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
	
	/*
	if(localStorage.getItem("debug_map")){
		MapLoader.mapname = localStorage.getItem("debug_map")
	}
	*/
}

TitleMenu.prototype.update = function(){
	//if( this.progress == 0 ) audio.playAs("music_intro","music");
	
	if( this.page == 0 ){
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
		this.progress = 10.0;
		if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				this.page = 2;
				audio.play("pause");
			} else if(this.cursor == 1){
				this.startGame(); 
			}
		}
	} else if( this.page == 2 ) {
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
	g.renderSprite(this.bgsprite,new Point(fpos, tileSize.y),this.zIndex, new Point((game.time*0.333)%4,2));
	g.renderSprite(this.bgsprite,new Point(fpos+60, tileSize.y-24),this.zIndex, new Point((game.time*0.2)%3,3));
	
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
	
	textArea(g,"Copyright Rattus/Rattus LLP 2016",8,4);
	textArea(g,"Version "+version,8,228);
}

TitleMenu.prototype.hudrender = function(g,c){
	if(this.page == 0){
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			boxArea(g,x_pos,168,120,40);
			textArea(g,i18n("press_start"),x_pos+16,184);
		}
	} else if(this.page == 1) {
		var x_pos = game.resolution.x * 0.5 - 192 * 0.5;
		boxArea(g,x_pos,32,192,88);
		textArea(g,i18n(this.options[this.cursor]),x_pos+16,48,160);
		
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		boxArea(g,x_pos,146,120,56);
		//textArea(g,i18n("introduction"),x_pos+24,162);
		textArea(g,"Debug",x_pos+24,162);
		textArea(g,i18n("new_game"),x_pos+24,178);
		
		g.renderSprite("text",new Point(x_pos+16,162+(16*this.cursor)),this.zIndex,new Point(15,5));
	} else if(this.page == 2){ 
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
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	
	if(this.cursor == 1) {
		this.start = true;
		audio.play("pause");
		//WorldMap.newgame();
		new Player(0,0);
		_player.lightRadius = 240;
		WorldLocale.loadMap("townhub.tmx");
	} else { 
		audio.play("negative");
		//ga("send","event","start_intro");
		//dataManager.loadMap(game,_map_maps[0]);
		//audio.stop("music_intro");
	}
}
TitleMenu.mapname = "testmap.tmx";
TitleMenu.level = 1;
TitleMenu.grabLedges = false;
TitleMenu.doubleJump = false;
TitleMenu.dodgeFlash = false;