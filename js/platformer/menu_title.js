TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = "title";
	this.bgsprite = "landingpage";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	this.starting_tmx = "gateway.tmx";
	
	this.progress = 0;
	this.cursor = 1;
	
	this.starPositions = [
		new Point(42,26),
		new Point(64,35),
		new Point(105,42),
		new Point(138,18),
		new Point(182,19),
		new Point(208,43),
		new Point(223,17),
		new Point(250,42 ),
		new Point(307,36),
		new Point(326,43),
		new Point(363,9)
	]
	
	this.stars = [
		{ "pos" : new Point(), "timer" : 10 },
		{ "pos" : new Point(), "timer" : 20 },
		{ "pos" : new Point(), "timer" : 0 }
	];
	
	//this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"introduction_help",
		"start_help"
	];
	
	TitleMenu.fetchProfiles();
}

TitleMenu.prototype.update = function(){
	//if( this.progress == 0 ) audio.playAs("music_intro","music");
	
	if( this.page == 0 ){
		//Intro page
		this.progress += this.delta / Game.DELTASECOND;
		if( this.progress > 52 ) this.progress = 9.0;
		if( input.state("pause") == 1 || input.state("fire") == 1 ) {
			if(this.progress > 9 && this.progress < 24){
				this.page = 1;
				this.cursor = 0;
			}else{
				this.progress = 10.0;
			}
		}
	} else if( this.page == 1 ) {
		//Load game page
		this.progress = 10.0;
		if( input.state("up") == 1 ) { 
			this.cursor = Math.max(this.cursor-1, 0); 
			this.deleteProfileTimer = 0.0;
			audio.play("cursor"); 
		}
		if( input.state("down") == 1 ) { 
			this.cursor = this.cursor = Math.min(this.cursor+1, 2); 
			this.deleteProfileTimer = 0.0;
			audio.play("cursor"); 
		}
		if( input.state("jump") > 0  ) { 
			this.deleteProfileTimer += this.delta;
			if(this.deleteProfileTimer > TitleMenu.DELETETIME){
				//Save blank data to delete old profile
				game.save(false, this.cursor);
				//Refetch profiles
				TitleMenu.fetchProfiles();
				
				this.deleteProfileTimer = 0.0;
				audio.play("playerdeath");
			}
		} else {
			this.deleteProfileTimer = 0.0
		}
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			audio.play("pause");
			this.startGame(this.cursor); 
		}
	} else if( this.page == 2 ) {
		//Debug page
		this.progress = 10.0;
		if( input.state("up") == 1 ) { this.cursor -= 1; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor += 1; audio.play("cursor"); }
		this.cursor = Math.max(Math.min(this.cursor,5),0);
		
		if(this.cursor == 1){
			if( input.state("left") == 1 ) { TitleMenu.level -= 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.level += 1; audio.play("cursor"); }
			TitleMenu.level = Math.max(Math.min(TitleMenu.level,50),1);
		}else if(this.cursor == 2){
			if( input.state("left") == 1 ) { TitleMenu.doubleJump = !TitleMenu.doubleJump; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.doubleJump = !TitleMenu.doubleJump; audio.play("cursor"); }
		}else if(this.cursor == 3){
			if( input.state("left") == 1 ) { TitleMenu.grabLedges = !TitleMenu.grabLedges; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.grabLedges = !TitleMenu.grabLedges; audio.play("cursor"); }
		}else if(this.cursor == 4){
			if( input.state("left") == 1 ) { TitleMenu.dodgeFlash = !TitleMenu.dodgeFlash; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.dodgeFlash = !TitleMenu.dodgeFlash; audio.play("cursor"); }
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				TitleMenu.mapname = game.prompt("Enter filename",TitleMenu.mapname, function(name){
					TitleMenu.mapname = name;
				});
				//localStorage.setItem("debug_map", MapLoader.mapname);
			} else if(this.cursor == 5){
				//Start in DEBUG mode
				audio.play("pause");
				
				var p = new Player(0,0);
				p.stat_points = Math.max(TitleMenu.level-1, 0);
				
				game.loadMap(TitleMenu.mapname, function(starts){
					if(starts.length > 0 ){
						_player.position = new Point(starts[0].x,starts[0].y);
					} else {
						_player.position = new Point(48,176);
					}
					game.addObject(_player);
					game.addObject(new PauseMenu());
					game.addObject(new Background());
					
					_player.lightRadius = 240;
					_player.doubleJump = TitleMenu.doubleJump;
					_player.dodgeFlash = TitleMenu.dodgeFlash;
					_player.grabLedges = TitleMenu.grabLedges;
					if(TitleMenu.flight){ 
						_player.spellsCounters.flight = Game.DELTAYEAR;
					}
				})
				
			}
		}
	}
}

//Ӆ

TitleMenu.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	var pan = Math.sqrt(Math.min(this.progress/8, 1.0));
	
	//g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
	
	
	var tileSize = new Point(215,120);
	var bgcolor = [21/255.0,29/255.0,41/255.0,1.0];
	
	g.color = bgcolor;
	g.scaleFillRect(0,0,game.resolution.x, game.resolution.y);
	
	//Render star background
	g.renderSprite(this.bgsprite,new Point(xpos, 0),this.zIndex, new Point(0,0));
	g.renderSprite(this.bgsprite,new Point(xpos+tileSize.x, 0),this.zIndex, new Point(1,0));
	
	//Render middleground
	var mpos = xpos + pan * 24 - 159;
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x, 0),this.zIndex, new Point(2,0));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x*2, 0),this.zIndex, new Point(3,0));
	
	g.renderSprite(this.bgsprite,new Point(mpos, tileSize.y),this.zIndex, new Point(1,1));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x, tileSize.y),this.zIndex, new Point(2,1));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x*2, tileSize.y),this.zIndex, new Point(3,1));
	
	//Render foreground
	var fpos = xpos + pan * 240 - 240;
	g.renderSprite(this.bgsprite,new Point(fpos, tileSize.y),this.zIndex, new Point((game.time*10.0)%4,2));
	g.renderSprite(this.bgsprite,new Point(fpos+60, tileSize.y-24),this.zIndex, new Point((game.time*6.0)%3,3));
	
	//Random twinkling stars
	for(var i=0; i<this.stars.length; i++) {
		var star = this.stars[i];
		var frame = 2;
		if( 
			this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
			this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
		) frame = 3;
			
		g.renderSprite("bullets",star.pos.add(new Point(xpos-1,-1)),this.zIndex,new Point(frame,2));
		star.timer -= this.delta;
		if( star.timer <= 0 ){
			star.timer = Game.DELTASECOND * 1.0;
			star.pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
		}			
	}
	this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
	if( this.progress > this.stars.timer ) {
		this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
		this.stars.timer += this.stars.reset;
	}
	
	if(this.page < 1){
		g.renderSprite(this.bgsprite,new Point(xpos+107, Math.lerp(-480,32,pan)),this.zIndex, new Point(0,1));
	}
	
	textArea(g,"Copyright 2018",8,4);
	textArea(g,"Version "+version,8,228);
}

TitleMenu.prototype.hudrender = function(g,c){
	if(this.page == 0){
		//Press start
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			boxArea(g,x_pos,168,120,40);
			textArea(g,i18n("press_start"),x_pos+16,184);
		}
	} else if(this.page == 1) {
		//Select profile
		for(var i=0; i < 3; i++){
			var pos = new Point(game.resolution.x * 0.5 - 90, 16 + i * 72);
			this.renderProfile(g, pos, TitleMenu.profile_info[i]);
		}
		textArea(g,"@",game.resolution.x * 0.5 - 106,32+72*this.cursor);
	} else if(this.page == 2){ 
		//Debug
		var x_pos = game.resolution.x * 0.5 - 200 * 0.5;
		boxArea(g,x_pos,16,200,208);
		textArea(g,"Map name",x_pos+32,32);
		textArea(g,"Level",x_pos+32,64);
		textArea(g,"Double Jump",x_pos+32,96);
		textArea(g,"Wall Slide",x_pos+32,128);
		textArea(g,"Dash",x_pos+32,160);
		textArea(g,"Play",x_pos+32,192);
		
		textArea(g,"@",x_pos+16,32+32*this.cursor);
		
		textArea(g,""+TitleMenu.mapname,x_pos+32,32+12);
		textArea(g,""+TitleMenu.level,x_pos+32,64+12);
		textArea(g,""+TitleMenu.doubleJump,x_pos+32,96+12);
		textArea(g,""+TitleMenu.grabLedges,x_pos+32,128+12);
		textArea(g,""+TitleMenu.dodgeFlash,x_pos+32,160+12);
	}
	
	if( this.progress >= 24 ) {
		var y_pos = Math.lerp(240,16, Math.min( (this.progress-24)/8, 1) );
		var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
		boxArea(g,0,y_pos-16,game.resolution.x,game.resolution.y);
		textArea(g,i18n("intro_text"),x_pos,y_pos,256,240);
	}	
}
TitleMenu.prototype.renderProfile = function(g,c, profile){
	boxArea(g,c.x,c.y,180,64);
	
	if(profile != undefined){		
		if(profile.id == this.cursor && this.deleteProfileTimer > 0){
			let progress = Math.min(this.deleteProfileTimer / TitleMenu.DELETETIME, 1.0);
			g.color = [0.8,0.1,0.0,1.0];
			g.scaleFillRect(c.x,c.y,(180*progress),64);
		}
		
		Player.renderLifebar(g,c.add(new Point(16,16)),profile.life,profile.lifeMax,0);
		Player.renderManabar(g,c.add(new Point(16,28)),profile.mana, profile.manaMax);
		
		var timeHour = Math.floor(profile.time/3600);
		var timeMinute = Math.floor(profile.time/60) % 60;
		
		timeMinute = (timeMinute < 10 ? "0" : "") + timeMinute;
		
		textArea(g,"$"+profile.money,c.x+90,c.y+16);
		textArea(g,"T"+timeHour+":"+timeMinute,c.x+90,c.y+28);
		//textArea(g,profile.location,c.x+90,c.y+40);
		
		for(var i=0; i < 4; i++){
			if(profile["stone" + i]){
				textArea(g,"@",c.x+16+12*i,c.y+40);
			}
		}
	} else {
		var ng_text = i18n("new_game");
		var textpos = 90 - ng_text.length * 4;
		textArea(g,i18n("new_game"),c.x+textpos,c.y+28,256,240);
	}
}

TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(profile){
	self["sessionId"] = generateId();
	NPC.variables = {};
	new Player();
	
	game.ga_event("newgame",version);
	
	//WorldLocale.loadMap(this.starting_tmx, "first");
	
	//_player.lightRadius = true;
	//_player.downstab = true;
	//_player.dodgeFlash = true;
	//_player.baseStats.attack = 12;
	//_player.equip();
	
	
	if(TitleMenu.profile_info[profile]){
		Checkpoint.profile = profile;
		Checkpoint.loadState();
	} else {
		new Player();
		WorldLocale.loadMap("gateway.tmx");
	}
}
TitleMenu.fetchProfiles = function(){
	game.load(function(data){
		TitleMenu.profile_info = {};
		
		for(var i in data){
			var d = data[i];
			var areas = i18n("maps");
			var map = i18n("map_unknown");
			
			try{
				map = areas[d.location.map];
			} catch(e){}
			
			var out = {
				"id" : i,
				"life" : d.player.life,
				"lifeMax" : d.player.lifeMax,
				"mana" : d.player.mana,
				"manaMax" : d.player.manaMax,
				"money" : d.player.money,
				"stone0" : 0,
				"stone1" : 0,
				"stone2" : 0,
				"stone3" : 0,
				"time" : 5400,
				"location" : map
			};
			
			for(var stone = 0; stone < 4; stone++){
				var tname = "templegate_" + stone;
				if(tname in d.variables && d.variables[tname]){
					out["stone" + stone] = 1;
				}
			}
			
			TitleMenu.profile_info[i] = out;
		}
		
	},-1);
}

TitleMenu.profile_info = {};
TitleMenu.mapname = "testmap.tmx";
TitleMenu.level = 1;
TitleMenu.grabLedges = false;
TitleMenu.doubleJump = false;
TitleMenu.dodgeFlash = false;
TitleMenu.DELETETIME = Game.DELTASECOND * 2;