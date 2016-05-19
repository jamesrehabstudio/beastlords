TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = "title";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 0;
	this.loading = true;
	
	this.starPositions = [
		new Point(84,64),
		new Point(102,80),
		new Point(99,93),
		new Point(117,99),
		new Point(117,111),
		new Point(128,71),
		new Point(191,41),
		new Point(64,108 ),
		new Point(158,65),
		new Point(15,5),
		new Point(229,69)
	]
	
	this.stars = [
		{ "pos" : new Point(), "timer" : 10 },
		{ "pos" : new Point(), "timer" : 20 },
		{ "pos" : new Point(), "timer" : 0 }
	];
	
	this.playedIntro = !!localStorage.getItem("playedintro");
	if( this.playedIntro ) this.cursor = 1;
	this.playedIntro = true;
	
	//this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"introduction_help",
		"start_help"
	];
	
	if(localStorage.getItem("debug_map")){
		MapLoader.mapname = localStorage.getItem("debug_map")
	}
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		//Display game object
		game.element.style.display = "block";
		
		this.loading = false;
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
			this.cursor = Math.max(Math.min(this.cursor,3),0);
			
			if(this.cursor == 1){
				if( input.state("left") == 1 ) { MapLoader.level -= 1; audio.play("cursor"); }
				if( input.state("right") == 1 ) { MapLoader.level += 1; audio.play("cursor"); }
				MapLoader.level = Math.max(Math.min(MapLoader.level,50),1);
			}else if(this.cursor == 2){
				if( input.state("left") == 1 ) { MapLoader.flight = !MapLoader.flight; audio.play("cursor"); }
				if( input.state("right") == 1 ) { MapLoader.flight = !MapLoader.flight; audio.play("cursor"); }
			}
			
			if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
				if(this.cursor == 0){
					MapLoader.mapname = prompt("Enter filename",MapLoader.mapname);
					localStorage.setItem("debug_map", MapLoader.mapname);
				} else if(this.cursor == 3){
					//Start in DEBUG mode
					window._player = new Player(0,0);
					MapLoader.loadMapTmx(MapLoader.mapname, function(starts){
						_player.lightRadius = 240;
						if(starts.length > 0){
							_player.position.x = starts[0].x;
							_player.position.y = starts[0].y;
						} else {
							_player.position.x = 64;
							_player.position.y = 176;
						}
						game.addObject(_player);
					});
					audio.play("pause");
				}
			}
		}
	}
}

//Ӆ

TitleMenu.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	if( this.loading ){ 
		//g.font = (30*pixel_scale)+"px monospace";
		//g.fillStyle = "#FFF";
		//g.fillText("Loading", 64*pixel_scale, 120*pixel_scale);
	} else if( this.start ) {
		"loading".render(g,new Point(game.resolution.x*0.5,game.resolution.y*0.5),0,0);
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(xpos,0),0,2);
		
		//Random twinkling stars
		for(var i=0; i<this.stars.length; i++) {
			var frame = 2;
			if( 
				this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
				this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
			) frame = 3;
				
			"bullets".render(g,this.stars[i].pos.add(new Point(xpos,0)),frame,2);
			this.stars[i].timer -= this.delta;
			if( this.stars[i].timer <= 0 ){
				this.stars[i].timer = Game.DELTASECOND * 1.0;
				this.stars[i].pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
			}			
		}
		this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
		if( this.progress > this.stars.timer ) {
			this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
			this.stars.timer += this.stars.reset;
		}
		
		this.sprite.render(g,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),0,1);
		this.sprite.render(g,new Point(xpos,Math.lerp( this.title_position, 0, pan)),0,0);
		
		textArea(g,"Copyright Pogames.uk 2016",8,4);
		textArea(g,"Version "+window._version,8,228);
		
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
			if( this.playedIntro ) textArea(g,i18n("new_game"),x_pos+24,178);
			
			"text".render(g, new Point(x_pos+16,162+(16*this.cursor)),15,5);
		} else if(this.page == 2){ 
			var x_pos = game.resolution.x * 0.5 - 200 * 0.5;
			boxArea(g,x_pos,16,200,208);
			textArea(g,"Map name",x_pos+32,48);
			textArea(g,"Level",x_pos+32,80);
			textArea(g,"Flight",x_pos+32,112);
			textArea(g,"Play",x_pos+32,144);
			
			textArea(g,"@",x_pos+16,48+32*this.cursor);
			
			textArea(g,""+MapLoader.mapname,x_pos+32,48+12);
			textArea(g,""+MapLoader.level,x_pos+32,80+12);
			textArea(g,""+MapLoader.flight,x_pos+32,112+12);
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,16, Math.min( (this.progress-24)/8, 1) );
			var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
			boxArea(g,0,y_pos-16,game.resolution.x,game.resolution.y);
			textArea(g,i18n("intro_text"),x_pos,y_pos,256,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	
	if(this.cursor == 1) {
		this.start = true;
		audio.play("pause");
		WorldMap.newgame();
	} else { 
		audio.play("negative");
		//ga("send","event","start_intro");
		//dataManager.loadMap(game,_map_maps[0]);
		//audio.stop("music_intro");
	}
}