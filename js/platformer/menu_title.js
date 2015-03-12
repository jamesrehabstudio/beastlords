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
	
	this.stars = {
		"pos" : new Point(),
		"timer" : 0,
		"reset" : 0.2
	};
	
	this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"Death is not the end. If you die you will return to the entrance of the area.",
		"You only have one chance. Death will will send you to the beginning of your quest."
	];
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		if( this.progress == 0 ) audio.play("music_intro");
		
		if( this.start_options ) {
			this.progress = 10.0;
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
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
	if( this.start ) {
		
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(),2);
		
		//Random twinkling stars
		this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
		if( this.progress > this.stars.timer ) {
			this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
			this.stars.timer += this.stars.reset;
		}
		g.fillStyle = "#000";
		g.scaleFillRect ( this.stars.pos.x, this.stars.pos.y, 16,16);
		
		this.sprite.render(g,new Point(0,Math.lerp( this.castle_position, 0, pan)),1);
		this.sprite.render(g,new Point(0,Math.lerp( this.title_position, 0, pan)),0);
		
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			if( this.start_options ) {
				boxArea(g,32,32,192,88);
				textArea(g,this.options[this.cursor],48,48,160);
				boxArea(g,68,146,120,56);
				textArea(g,"Easy",92,162);
				textArea(g,"Hard core",92,178);
				sprites.text.render(g, new Point(80,162+(16*this.cursor)),15,5);
			} else { 
				boxArea(g,68,168,120,40);
				textArea(g,"Press start",84,184);
			}
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,0, Math.min( (this.progress-24)/8, 1) );
			boxArea(g,0,y_pos,256,240);
			textArea(g,this.message,16,y_pos+16,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	this.start = true;
	
	var world = new WorldMap(0,0);
	world.mode = this.cursor > 0 ? 1 : 0;
	
	game.clearAll();
	game.addObject(world);
	audio.stop("music_intro");
}