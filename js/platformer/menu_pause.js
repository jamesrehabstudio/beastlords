PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.page = 1;
	this.pageCount = 5;
	this.mapflip = 0;
	this.cursor = 0;
	this.questscroll = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	this.questlist = new Array();
	
	this.icons = false;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
	this.message_text = false;
	this.message_time = 0;
	
	this.loadMapReveal();
}

PauseMenu.open = false;
PauseMenu.questScrollLimit = 12;

PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){
	DemoThanks.time += this.delta;
	
	if( PauseMenu.open ) {
		game.pause = true;
		this.message_time = 0;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				_player.respawn();
				return;
			}
		} else if( this.page == 0 ) {
			//Option page
			
			if( input.state("up") == 1 ) { this.cursor-=1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=1; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, 4), 0 );
			
			if( input.state("fire") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.setSetting("fullscreen", !Settings.fullscreen);
				if(this.cursor == 1 ) game.setSetting("filter", (Settings.filter+1) % PauseMenu.Filters.length);
				if(this.cursor == 2 ) game.setSetting("sfxvolume", Math.min(Settings.sfxvolume+0.125,1));
				if(this.cursor == 3 ) game.setSetting("musvolume", Math.min(Settings.musvolume+0.125,1));
				if(this.cursor == 4 ){
					PauseMenu.open = false;
					game.clearAll();
					game_start(game);
					return;
				}
			} else if( input.state("jump") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.setSetting("fullscreen", !Settings.fullscreen);
				if(this.cursor == 1 ) game.setSetting("filter", (Settings.filter+1) % PauseMenu.Filters.length);
				if(this.cursor == 2 ) game.setSetting("sfxvolume", Math.max(Settings.sfxvolume-0.125,0));
				if(this.cursor == 3 ) game.setSetting("musvolume", Math.max(Settings.musvolume-0.125,0));
			}
		} else if( this.page == 1 ) {
			//Map page			
			if( input.state("jump") == 1) { this.mapflip = !this.mapflip; }
			if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }
			

		} else if( this.page == 2 ){
			//attributes page
			AttributeMenu.update();
		} else if ( this.page == 3 ) {
			//Unique Items
			DebugeMenu.update();
			/*
			if( input.state("fire") == 1 ) { 
				_player.unique_item = _player.uniqueItems[this.cursor];
				PauseMenu.open = false;
				game.pause = false;
				audio.play("spell");
			}
			*/
		} else if (this.page == 4){
			//Quests
			if(this.questlist.length > 0){
				if( input.state("down") == 1){
					this.cursor = (this.cursor + 1) % this.questlist.length;
					audio.play("cursor"); 
				}
				if( input.state("up") == 1){
					this.cursor = this.cursor == 0 ? this.questlist.length-1 : this.cursor-1;
					audio.play("cursor"); 
				}
				this.questscroll = Math.max(
					Math.min(this.cursor, this.questscroll), 
					this.cursor-(PauseMenu.questScrollLimit-1)
				);
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 ) {
				PauseMenu.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( this.page != 1 || input.state("fire") <= 0 ) {
				if( input.state("select") == 1 ) { this.page = ( this.page + 1 ) % this.pageCount; this.cursor = 0; audio.play("cursor"); }
				
				//Skip debug menu
				if( this.page == 3) { this.page = 4;}
				
				
				//if( input.state("right") == 1 ) { this.page = (this.page<=0 ? (this.pageCount-1) : this.page-1); this.cursor = 0; audio.play("cursor"); }
			}
		}
	} else {
		if( ( input.state("pause") == 1 ) && _player instanceof Player && _player.life > 0 ) {
			PauseMenu.open = true;
			//_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			this.page = 1;
			this.questlist = Quests.list();
			if( _player.stat_points > 0 ) this.page = 2;
			audio.play("pause");
			AttributeMenu.close();
		}
	}

	var map_width = Math.floor(game.map.width / 16);
	var map_index = (
		( Math.floor(_player.position.x / 256) - 0 ) + 
		( Math.floor(_player.position.y / 240) - 0 ) * map_width
	);
	this.map_reveal[map_index] = 2;
	
	this.message_time -= game.deltaUnscaled;
}
PauseMenu.prototype.message = function(m){
	this.message_text = m;
	this.message_time = Game.DELTASECOND*2;
}
PauseMenu.prototype.revealMap = function(secrets){
	secrets = secrets || 0;
	var map = game.map.map;
	for(var i=0; i < map.length; i++ ) {
		if( secrets > 0 || map[i] >= 0 ){
			if( this.map_reveal[i] == undefined ) {
				this.map_reveal[i] = 0;
			}
			this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
		}
	}
}
PauseMenu.prototype.loadMapReveal = function(){
	var mapname = WorldLocale.currentMapName;
	var recordname = "mapreveal_" + mapname;
	
	var str_reveal = NPC.get(recordname);
	if(str_reveal){
		this.map_reveal = str_reveal.split(",");
	}
}
PauseMenu.prototype.saveMapReveal = function(){
	var mapname = WorldLocale.currentMapName;
	var recordname = "mapreveal_" + mapname;
	var str_reveal = this.map_reveal.toString();
	
	NPC.set(recordname, str_reveal);
}
PauseMenu.prototype.hudrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	"pig".render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	/* mini map */
	
	
	
	if( this.message_time > 0 ) {
		var left = game.resolution.x * 0.5 - 224 * 0.5;
		boxArea(g,left,16,224,64);
		textArea(g,this.message_text,left+16,32,192);
	}
	var leftx = 0;
	if( PauseMenu.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			g.color = [0,0,0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
			
			var gamex = game.resolution.x * 0.5 - 427 * 0.5;
			g.renderSprite("title",new Point(gamex,0),this.zIndex,new Point(0,3));
			
			boxArea(g,xpos+68,168,120,40);
			textArea(g,i18n("press_start"),xpos+84,184);
		} else if( this.page == 0 ) {
			//Option 68
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Settings",leftx+30,20);
			
			textArea(g,"Screen",leftx+16,40);
			textArea(g,(Settings.fullscreen?"Fullscreen":"Windowed"),leftx+20,52);
			
			textArea(g,"Screen Filter",leftx+16,72);
			textArea(g,PauseMenu.Filters[Settings.filter],leftx+20,84);
			
			textArea(g,"SFX Volume",leftx+16,104);
			g.color = [1.0,0.9,0.8,1.0];
			
			for(var i=0; i<Math.floor(Settings.sfxvolume*8); i++)
				g.scaleFillRect(leftx+20+i*8, 116, 7, 8 );
			
			textArea(g,"MUS Volume",leftx+16,136);
			g.color = [1.0,0.9,0.8,1.0];
			for(var i=0; i<Math.floor(Settings.musvolume*8); i++)
				g.scaleFillRect(leftx+20+i*8, 148, 7, 8 );
			
			textArea(g,"Game",leftx+16,168);
			textArea(g,"Reset",leftx+20,180);
			
			//Draw cursor 84
			textArea(g,"@",leftx+12, 52 + this.cursor * 32 );
		} else if ( this.page == 1 ) {
			//Map
			leftx = game.resolution.x*0.5 - 224*0.5;
			let name = game.newmapName;
			var player_map_position = {
				"gateway.tmx" : new Point(24,128),
				"temple1.tmx" : new Point(178,110),
				"temple2.tmx" : new Point(64,112),
				"temple3.tmx" : new Point(88,168),
				"temple4.tmx" : new Point(48,64),
				"sky.tmx" : new Point(104,96),
				"mills.tmx" : new Point(176,160),
				"townhub.tmx" : new Point(120,128),
				"lighthouse.tmx" : new Point(200,104)
			};
			
			
			if(this.mapflip){
				boxArea(g,leftx,8,224,224);

				if(name in player_map_position){
					var map_position = player_map_position[name];				
					let bounce = Math.sin(game.time * 0.1) * 2;
					g.renderSprite("mapicons", map_position.add(new Point(leftx+4,10+bounce)),2,new Point());
				}
				
				g.renderSprite("worldmap", new Point(leftx+8,16),1,new Point(), false);
				textArea(g,"Minimap (JUMP)",leftx+100,212);
			} else {
				boxArea(g,leftx,8,224,224);
				textArea(g,"Map",leftx+102,20);
				textArea(g,"Map",leftx+102,20);
				this.renderMap(g,this.mapCursor,new Point(leftx+16,24), new Line(0,0,24*8,24*8) );
				textArea(g,"Worldmap (JUMP)",leftx+96,212);
			}
			
		} else if ( this.page == 2 ) {
			//Stats page
			AttributeMenu.render(g, new Point(game.resolution.x*0.5 - 224*0.5, 8));
			//PauseMenu.renderStatsPage(g,new Point(game.resolution.x*0.5 - 224*0.5, 8));
		} else if ( this.page == 3 ) {
			//Unique Items
			DebugeMenu.render(g, new Point(game.resolution.x*0.5 - 224*0.5, 8));
		} else if ( this.page == 4 ){
			//Quests
			leftx = game.resolution.x*0.5 - 224*0.5;
			boxArea(g,leftx,8,224,152);
			boxArea(g,leftx,168,224,64);
			textArea(g,"Quests",leftx+88,20);
			
			var rangeTop = this.questscroll;
			var rangeBot = this.questscroll + PauseMenu.questScrollLimit;
			var y_pos = 12 * -this.questscroll;
			
			for(var i=0; i < this.questlist.length; i++){
				q = this.questlist[i];
				
				textArea(g,q.name,leftx+32,40+y_pos);
				
				if( i == this.cursor ){
					textArea(g,"@",leftx+16,40+y_pos);
				}
				
				if( q.complete ) {
					textArea(g,"@",leftx+16,40+y_pos);
				} else {
					if( i == this.cursor ){
						textArea(g,q.description,leftx+16,16+168,224-32);
					}
				}
				y_pos += 12;
			}
			
		}
	} else {
		if( _player instanceof Player ) {
			//Minimap
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(game.resolution.x-49,7,42,26);
			g.color = [0.0,0.0,0.0,1.0];
			g.scaleFillRect(game.resolution.x-48,8,40,24);
			this.renderMap(g,
				new Point(Math.floor(-_player.position.x/256), Math.floor(-_player.position.y/240)),
				new Point(game.resolution.x-24,24), 
				new Line(-24,-16,16,8)
			);
		}
	}
}

PauseMenu.mapIcons = new Array();
PauseMenu.pushIcon = function(icon){
	if(icon instanceof MapIcon && PauseMenu.mapIcons.indexOf(icon) < 0){
		PauseMenu.mapIcons.push(icon);
	}
}

PauseMenu.prototype.renderMap = function(g,cursor,offset,limits){
	try {
		var size = new Point(8,8);
		var mapstart = new Point(0,0);
		var mapwidth = Math.floor(game.map.width/16);
		var map = game.map.map;
		
		for(var i=0; i < map.length; i++ ){
			if( map[i] != undefined && this.map_reveal[i] > 0 )  {
				var tile = new Point(
					mapstart.x + (i%mapwidth ),
					mapstart.y + Math.floor(i/mapwidth )
				);
				var pos = new Point( 
					(mapstart.x*8) + (cursor.x*8) + (i%mapwidth ) * size.x, 
					(mapstart.y*8) + (cursor.y*8) + Math.floor(i/mapwidth ) * size.y 
				);
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					//"map".render(g,pos.add(offset),Math.abs(this.map[i])-1,(this.map_reveal[i]>=2?0:1));
					var xtile = Math.floor(map[i] / 16);
					var ytile = map[i] % 16;
					if( this.map_reveal[i] < 2 ) xtile += 4;
					g.renderSprite("map",pos.add(offset),this.zIndex,new Point(xtile,ytile));
				}
			}
		}
		
		for(var i=0; i < PauseMenu.mapIcons.length; i++){
			var icon = PauseMenu.mapIcons[i];
			var pos = icon.mapPosition().add(cursor).scale(8)
			var reveal = this.map_reveal[icon.mapIndex()];
			if(reveal >= icon.mapRevealMin){
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					var c = new Point().subtract(cursor.scale(8)).subtract(offset);
					icon.render(g,c);
				}
			}
			
		}
		/*
		if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
			g.color = [1.0,0.0,0.0,1.0];
			g.renderSprite("map",pos.add(offset),this.zIndex+1,new Point(9,0),false);
		}
		*/
	} catch (err) {
		var r = 0;
	}
}

PauseMenu.Filters = [
	"Default",
	"CRT",
	"Deuteranopia",
	"Terrible port",
	"Dot matrix"
]

PauseMenu.convertTileDataToMapData = function(data){
	//Used to convert raw map data to something useable by the map engine
	out = new Array(data.length);
	for(var i=0; i < data.length; i++){
		if(data[i]==0){
			out[i] = null;
		}else{
			var d = data[i] - 1;
			out[i] = Math.floor(d/16)+(d%16)*16;
		}
	}
	return out;
}
PauseMenu.attackspeedToName = function(speed){
	var n = i18n("speeds");
	if(speed > 20){
		return n[0];
	} else if (speed > 16){
		return n[1];
	} else if (speed > 12){
		return n[2];
	} else if (speed > 8){
		return n[3];
	} else {
		return n[4];
	}
}

function MapIcon(x,y){
	this.position = new Point(x,y);
	this.bobSpeed = 0;
	this.bobHeight = 3;
	this.sprite = "mapicons";
	this.mapRevealMin = 2;
	this.frame = new Point(0,0);
}
MapIcon.prototype.mapPosition = function(){
	return new Point(Math.floor(this.position.x/(16*16)), Math.floor(this.position.y/(15*16)));
}
MapIcon.prototype.mapIndex = function(){
	var mPos = this.mapPosition();
	var mWidth = Math.floor(game.map.width / 16);
	return mPos.x + mPos.y * mWidth;
}
MapIcon.prototype.render = function(g,c){
	var bob = Math.abs(Math.sin(game.time * this.bobSpeed)) * this.bobHeight;
	var p = this.mapPosition();
	
	g.renderSprite(
		this.sprite,
		p.scale(8).add(new Point(0,-bob)).subtract(c),
		1000,
		this.frame
	)
}