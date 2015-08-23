PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.cursor = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
	this.message_text = false;
	this.message_time = 0;
}
PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){	
	if( this.open ) {
		game.pause = true;
		this.message_time = 0;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				if( window._world instanceof WorldMap ) {
					_world.trigger("reset");
				} else {
					game.clearAll();
					game.addObject(new TitleMenu());
				}
				return;
			}
		} else if( this.page == 0 ) {
			//Option page
			
			if( input.state("up") == 1 ) { this.cursor-=1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=1; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, 3), 0 );
			
			if( input.state("fire") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.fullscreen(!game.isFullscreen());
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) audio.sfxVolume.gain.value = Math.min(audio.sfxVolume.gain.value+0.1,1);
				if(this.cursor == 3 ) audio.musVolume.gain.value = Math.min(audio.musVolume.gain.value+0.1,1);
				
				localStorage.setItem("sfxvolume",audio.sfxVolume.gain.value);
				localStorage.setItem("musvolume",audio.musVolume.gain.value);
			} else if( input.state("jump") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.fullscreen(!game.isFullscreen());
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) audio.sfxVolume.gain.value = Math.max(audio.sfxVolume.gain.value-0.1,0);
				if(this.cursor == 3 ) audio.musVolume.gain.value = Math.max(audio.musVolume.gain.value-0.1,0);
				
				localStorage.setItem("sfxvolume",audio.sfxVolume.gain.value);
				localStorage.setItem("musvolume",audio.musVolume.gain.value);
			}
		} else if( this.page == 1 ) {
			//Map page
			if( input.state("fire") ) {
				if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
				if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }
			}

		} else if( this.page == 2 ){
			//attributes page
			if( _player.stat_points > 0 ) {
				if( input.state("up") == 1 ) { this.stat_cursor -= 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.stat_cursor += 1; audio.play("cursor"); }
				this.stat_cursor = Math.max( Math.min( this.stat_cursor, Object.keys(_player.stats).length-1 ), 0 );
				
				if( input.state("fire") == 1 ) _player.levelUp(this.stat_cursor);
			}
		} else if ( this.page == 3 ) {
			var unlocked = Object.keys( _player.spellsUnlocked );
			if( unlocked.length > 0 ) {
				//Select a spell, if one hasn't already been selected
				if( !(_player.selectedSpell in _player.spellsUnlocked ) ) _player.selectedSpell = unlocked[0];
				
				//Control Menu
				if( input.state("up") == 1 ) {
					var pos = Math.max( unlocked.indexOf( _player.selectedSpell ) - 1, 0 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("down") == 1 ) { 
					var pos = Math.min( unlocked.indexOf( _player.selectedSpell ) + 1, unlocked.length-1 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("fire") == 1 ) { 
					_player.castSpell(_player.selectedSpell);
				}
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 || input.state("select") == 1 ) {
				this.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( this.page != 1 || input.state("fire") <= 0 ) {
				if( input.state("left") == 1 ) { this.page = ( this.page + 1 ) % 4; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.page = (this.page<=0 ? 3 : this.page-1); audio.play("cursor"); }
			}
		}
	} else {
		if( ( input.state("pause") == 1 || input.state("select") == 1 ) && _player instanceof Player && _player.life > 0 ) {
			this.open = true;
			//_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			this.page = 1;
			if( _player.stat_points > 0 ) this.page = 2;
			if( input.state("select") == 1 ) this.page = 3;
			audio.play("pause");
		}
	}
	
	//Reveal map
	if( this.mapDimension instanceof Line ) {
		var map_index = (
			( Math.floor(_player.position.x / 256) - this.mapDimension.start.x ) + 
			( Math.floor(_player.position.y / 240) - this.mapDimension.start.y ) * this.mapDimension.width()
		);
		this.map_reveal[map_index] = 2;
		
		var lock;
		switch( Math.abs(this.map[map_index]) % 16 ){
			case 0: lock = new Line(0,0,256,480); break;
			case 1: lock = new Line(0,0,512,480); break;
			case 2: lock = new Line(-256,0,256,480); break;
			case 3: lock = new Line(-256,0,512,480); break;
			case 4: lock = new Line(0,0,256,240); break;
			case 5: lock = new Line(0,0,512,240); break;
			case 6: lock = new Line(-256,0,256,240); break;
			case 7: lock = new Line(-256,0,512,240); break;
			case 8: lock = new Line(0,-240,256,480); break;
			case 9: lock = new Line(0,-240,512,480); break;
			case 10: lock = new Line(-256,-240,256,480); break;
			case 11: lock = new Line(-256,-240,512,480); break;
			case 12: lock = new Line(0,-240,256,240); break;
			case 13: lock = new Line(0,-240,512,240); break;
			case 14: lock = new Line(-256,-240,256,240); break;
			case 15: lock = new Line(-256,-240,512,240); break;
			default: lock = new Line(-256,-240,256,480); break;
		}
		lock = lock.transpose( Math.floor(_player.position.x / 256)*256,  Math.floor(_player.position.y / 240)*240 );
		_player.lock = lock;
	}
	
	this.message_time -= game.deltaUnscaled;
}
PauseMenu.prototype.message = function(m){
	this.message_text = m;
	this.message_time = Game.DELTASECOND*2;
}
PauseMenu.prototype.revealMap = function(secrets){
	secrets = secrets || 0;
	for(var i=0; i < this.map.length; i++ ) {
		if( secrets > 0 || this.map[i] >= 0 ){
			if( this.map_reveal[i] == undefined ) this.map_reveal[i] = 0;
			this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
		}
	}
}
PauseMenu.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	sprites.pig.render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	/* mini map */
	
	if( _player instanceof Player ) {
		g.color = [1.0,1.0,1.0,1.0];
		g.scaleFillRect(game.resolution.x-41,7,34,26);
		g.color = [0.0,0.0,0.0,1.0];
		g.scaleFillRect(game.resolution.x-40,8,32,24);
		this.renderMap(g,
			new Point(Math.floor(-_player.position.x/256), Math.floor(-_player.position.y/240)),
			new Point(game.resolution.x-24,24), 
			new Line(-16,-16,16,8)
		);
	}
	
	if( this.message_time > 0 ) {
		var left = game.resolution.x * 0.5 - 224 * 0.5;
		boxArea(g,left,16,224,64);
		textArea(g,this.message_text,left+16,32,192);
	}
	var leftx = 0;
	if( this.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			g.color = [0,0,0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
			
			var gamex = game.resolution.x * 0.5 - 427 * 0.5;
			sprites.title.render(g,new Point(gamex,0), 0,3);
			
			boxArea(g,xpos+68,168,120,40);
			textArea(g,i18n("press_start"),xpos+84,184);
		} else if( this.page == 0 ) {
			//Option 68
			leftx = game.resolution.x*0.5 - 120*0.5;
			
			boxArea(g,leftx,8,120,224);
			textArea(g,"Settings",leftx+30,20);
			
			textArea(g,"Screen",leftx+16,40);
			textArea(g,(game.isFullscreen()?"Fullscreen":"Windowed"),leftx+20,52);
			
			textArea(g,"Guard Style",leftx+16,72);
			textArea(g,(_player.autoblock?"Automatic":"Manual"),leftx+20,84);
			
			textArea(g,"SFX Volume",leftx+16,104);
			//g.fillStyle = "#e45c10";
			g.color = [0.8,0.6,0.1,1.0];
			for(var i=0; i<audio.sfxVolume.gain.value*20; i++)
				g.scaleFillRect(leftx+20+i*4, 116, 3, 8 );
			
			textArea(g,"MUS Volume",leftx+16,136);
			g.color = [0.8,0.6,0.1,1.0];
			for(var i=0; i<audio.musVolume.gain.value*20; i++)
				g.scaleFillRect(leftx+20+i*4, 148, 3, 8 );
			
			//Draw cursor 84
			textArea(g,"@",leftx+12, 52 + this.cursor * 32 );
		} else if ( this.page == 1 ) {
			//Map
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Map",leftx+102,20);
			this.renderMap(g,this.mapCursor,new Point(leftx+16,24), new Line(0,0,24*8,24*8) );
			
		} else if ( this.page == 2 ) {
			//Stats page
			leftx = game.resolution.x*0.5 - 120*0.5;
			
			boxArea(g,leftx,8,120,224);
			
			textArea(g,"Attributes",leftx+20,20);
			
			textArea(g,"Points: "+_player.stat_points ,leftx+20,36);
			
			var attr_i = 0;
			for(attr in _player.stats) {
				var y = attr_i * 28;
				textArea(g,attr ,leftx+20,60+y);
				g.color = [0.8,0.6,0.1,1.0];
				for(var i=0; i<_player.stats[attr]; i++)
					g.scaleFillRect(leftx+20+i*4, 72 + y, 3, 8 );
				
				if( _player.stat_points > 0 ) {
					//Draw cursor
					g.color = [1.0,1.0,1.0,1.0];
					if( this.stat_cursor == attr_i ){
						g.scaleFillRect(leftx+12, 62 + y, 4, 4 );
					}
				}
				attr_i++;
			}
		} else if ( this.page == 3 ) {
			//Spells
			leftx = game.resolution.x*0.5 - 152*0.5;
			
			boxArea(g,leftx,8,152,224);
			textArea(g,"Spells",leftx+52,20);
			
			var spell_i = 0;
			for(spell in _player.spellsUnlocked) {
				var y = spell_i * 16;
				textArea(g,_player.spellsUnlocked[spell] ,leftx+20,36+y);
				if(_player.selectedSpell == spell ) textArea(g,"@",leftx+10,36+y);
				if( spell in _player.spellsCounters && _player.spellsCounters[spell] > 0 ) {
					var remaining = Math.min( Math.floor((8*_player.spellsCounters[spell]) / _player.spellEffectLength), 8);
					var y_offset = 8 - remaining;
					g.color = [0.1,0.7,0.98,1.0];
					g.scaleFillRect(leftx+132, 36+y+y_offset, 8, remaining );
					sprites.text.render(g,new Point(leftx+132,36+y), 5, 6);
				}
				
				spell_i++;
			}
		}
	}
}

PauseMenu.prototype.renderMap = function(g,cursor,offset,limits){
	try {
		var size = new Point(8,8);
		//var offset = new Point(32,24);
		var doors = game.getObjects(Door);
		var shop = game.getObject(Shop);
		
		for(var i=0; i < this.map.length; i++ ){
			if( this.map[i] != undefined && this.map_reveal[i] > 0 )  {
				var tile = new Point(
					this.mapDimension.start.x + (i%this.mapDimension.width() ),
					this.mapDimension.start.y + Math.floor(i/this.mapDimension.width() )
				);
				var pos = new Point( 
					(this.mapDimension.start.x*8) + (cursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
					(this.mapDimension.start.y*8) + (cursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
				);
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					//sprites.map.render(g,pos.add(offset),Math.abs(this.map[i])-1,(this.map_reveal[i]>=2?0:1));
					var xtile = Math.floor(this.map[i] / 16);
					var ytile = this.map[i] % 16;
					if( this.map_reveal[i] < 2 ) xtile += 4;
					sprites.map.render(g,pos.add(offset),xtile,ytile);
					
					if( this.map_reveal[i] >= 2 ) {					
						for(var j=0; j < doors.length; j++ ){
							if( tile.x == Math.floor(doors[j].position.x/256) && tile.y == Math.floor(doors[j].position.y/240) ){
								var door_id = doors[j].name.match(/(\d+)/)[0] - 0;
								sprites.map.render(g,pos.add(offset),8,door_id);
							}
						}
						if( shop != null && tile.x == Math.floor(shop.position.x/256) && tile.y == Math.floor(shop.position.y/240) ){
							sprites.text.render(g,pos.add(offset),4,0);
						}
					}
				}
			}
		}
		//Draw player
		var pos = new Point(
			1+cursor.x*8 + Math.floor(_player.position.x/256)*8, 
			2+(cursor.y*8) + Math.floor(_player.position.y/240)*8
		);
		if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
			g.color = [1.0,0.0,0.0,1.0];
			g.scaleFillRect(1 + pos.x + offset.x, 1 + pos.y + offset.y, 4, 3 );
		}
	} catch (err) {}
}