DemoThanks.prototype = new GameObject();
DemoThanks.prototype.constructor = GameObject;
function DemoThanks(){	
	this.constructor();
	this.sprite = "title";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 1;
	
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
}

DemoThanks.prototype.update = function(){
	
	if(this.progress >= 8.0){
		if(input.state("pause") == 1){
			audio.play("pause");
			delete self._player;
			game.clearAll();
			game.pause = false;
			game.deltaScale = 1.0;
			game_start(game);
		}
	} else {
		if(input.state("pause") == 1){
			this.progress = 10.0;
		}
	}
	
	this.progress += this.delta / Game.DELTASECOND;
}

DemoThanks.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	var pan = Math.min(this.progress/8, 1.0);
	
	g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
	
	//Random twinkling stars
	for(var i=0; i<this.stars.length; i++) {
		var star = this.stars[i];
		var frame = 2;
		if( 
			this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
			this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
		) frame = 3;
			
		g.renderSprite("bullets",star.pos.add(new Point(xpos,0)),this.zIndex,new Point(frame,2));
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
	
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),this.zIndex,new Point(0,1));
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.title_position, 0, pan)),this.zIndex,new Point(0,0));
	
	textArea(g,"Copyright Rattus/Rattus LLP 2016",8,4);
	textArea(g,"Version "+version,8,228);
}

DemoThanks.prototype.hudrender = function(g,c){	
	if( this.progress >= 8 ) {
		var y_pos = Math.lerp(240,152, Math.min( (this.progress-8)/2, 1) );
		var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
		textBox(g,"Thank you for playing!\n\nPress start to play again",x_pos,y_pos,256,64);
	}	
}
DemoThanks.prototype.idle = function(){}