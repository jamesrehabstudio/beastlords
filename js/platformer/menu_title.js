TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = sprites.title;
	this.zIndex = 999;
	this.visible = true;
	this.start_options = false;
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
	
	//this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"introduction_help",
		"start_help"
	];
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		this.loading = false;
		if( this.progress == 0 ) audio.playAs("music_intro","music");
		
		if( this.start_options ) {
			this.progress = 10.0;
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
			if( !this.playedIntro ) this.cursor = 0;
		} else {
			this.progress += this.delta / Game.DELTASECOND;
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) {
			if( this.progress < 9.0 || this.progress > 24.0 ) {
				this.progress = 9.0;
			} else if( this.start_options ) {
				//Start game
				audio.play("pause");
				this.startGame();
			} else {
				this.start_options = true;
			}
		}
		
		if( this.progress > 48 ) this.progress = 9.0;
		
	}
}

TitleMenu.prototype.render = function(g,c){
	if( this.loading ){ 
		//g.font = (30*pixel_scale)+"px monospace";
		//g.fillStyle = "#FFF";
		//g.fillText("Loading", 64*pixel_scale, 120*pixel_scale);
	} else if( this.start ) {
		
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(),2);
		
		//Random twinkling stars
		for(var i=0; i<this.stars.length; i++) {
			var frame = 2;
			if( 
				this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
				this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
			) frame = 3;
				
			sprites.bullets.render(g,this.stars[i].pos,frame,2);
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
		
		this.sprite.render(g,new Point(0,Math.lerp( this.castle_position, 0, pan)),1);
		this.sprite.render(g,new Point(0,Math.lerp( this.title_position, 0, pan)),0);
		
		textArea(g,"Copyright Pogames.uk 2015",8,4);
		textArea(g,"Version "+window._version,8,228);
		
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			if( this.start_options ) {
				boxArea(g,32,32,192,88);
				textArea(g,i18n(this.options[this.cursor]),48,48,160);
				boxArea(g,68,146,120,56);
				textArea(g,i18n("introduction"),92,162);
				if( this.playedIntro ) textArea(g,i18n("new_game"),92,178);
				sprites.text.render(g, new Point(80,162+(16*this.cursor)),15,5);
			} else { 
				boxArea(g,68,168,120,40);
				textArea(g,i18n("press_start"),84,184);
			}
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,0, Math.min( (this.progress-24)/8, 1) );
			textBox(g,i18n("intro_text"),0,y_pos,256,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	this.start = true;
	
	dataManager.reset();
	if(this.cursor == 1) {
		var world = new WorldMap(0,0);
		world.mode = this.cursor > 0 ? 1 : 0;
		
		ga("send","event","start_game");
		
		game.clearAll();
		game.addObject(world);
		audio.stop("music_intro");
		
		world.trigger("activate");
	} else { 
		ga("send","event","start_intro");
		dataManager.loadMap(game,_map_maps[1]);
		audio.stop("music_intro");
	}
}