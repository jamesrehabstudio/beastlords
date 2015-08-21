SceneEnding.prototype = new GameObject();
SceneEnding.prototype.constructor = GameObject;
function SceneEnding(x,y){
	game.clearAll();
	game.tileSprite = sprites.tiles3;
	
	var bg = new Background();
	bg.walls = false;
	game.addObject(bg);
	
	this.speed = 0;
	this.phase = 0;
	this.x_off = 0;
	this.progress = 0;
	
	this.player_position = 0;
	this.father_position = 0;
	audio.stopAs("music");
	/*
	this.animation = {
		0.0 : [{"id":0,"position":new Point(104,192),"render":function(g,p,c){}}]
	};*/
	
	if( window._world instanceof WorldMap ){
		window._world.town.money += _player.money;
		window._world.worldTick();
	}
	
	ga("send","event","finished",_player.level);
	
	this.text_credits = "" +
	"BEAST LORDS\n\n"+
	"POGAMES.UK\n"+
	"Staff\n\n"+
	"ART\nBirdy\n\n"+
	"PROGRAMMING\nBirdy\n\n"+
	"SOUND\nBirdy\n\n"+
	"MUSIC\nBirdy\n\n"+
	"PLAY TESTING\n\n"+
	"E.R\n"+
	"W.B\n"+
	"D.S\n\n"+
	"Thanks for playing.";
}
SceneEnding.prototype.update = function(){
	game.camera.x = this.x_off;
	game.camera.y = 0;
	game.pause = false;
	
	if( this.phase == 0 ) {
		this.progress += this.delta;
		if(this.progress > Game.DELTASECOND * 3) {
			audio.playAs("music_goodbye", "music");
			this.progress = 0;
			this.phase = 1;
		}
	} else if( this.phase == 1 ) {
		this.progress += this.delta * 0.01;
		if( this.progress < 8 ) {
			if( Math.floor(this.progress) > this.player_position ) this.player_position += this.delta * 0.02;
			if( Math.floor(this.progress-0.1) > this.father_position ) this.father_position += this.delta * 0.02;
		} 
		if( this.progress > 9 ) {
			this.phase = 2;
			this.progress = 0;
		}
	} else if ( this.phase == 2 ) {
		//Driving
		this.speed = Math.min(this.speed + this.delta * 0.01, 7.0);
		this.x_off += this.delta * this.speed;
		this.progress += this.delta / Game.DELTASECOND;
		if( this.progress > 60 ) {
			this.phase = 3;
			var im = new ItemMenu(dataManager.unlocks);
			im.on("destroy", function(){
				game.clearAll();
				game.addObject(new TitleMenu());
				audio.stopAs("music");
			});
			game.addObject(im);
		}
	} else if( this.phase == 3 ){
		//Show Scores
	}
	
	if(this.phase < 3 && input.state("pause") == 1 ) {
		this.phase = 3;
		this.progress = 9999;
	}
}
SceneEnding.prototype.render = function(g,c){
	for(var x=0; x<27; x++) for(var y=0; y<16; y++) {
		var tile = y <= 0 ? 32 : 96;
		var off = c.x % 16;
		game.tileSprite.render(g,new Point(x*16-off,208+y*16),tile);
	}
	
	if( this.phase == 0 ) {
		g.color = [0,0,0,1];
		g.scaleFillRect(0, 0, game.resolution.x, game.resolution.y );
	} else if( this.phase == 1 ) {
		sprites.chazbike.render(g,new Point(104,192),0,2);
		sprites.ending.render(g,new Point(this.father_position*20-64,176),0,0);		
		sprites.player.render(g,new Point(this.player_position*20-20,192),1,2,true);
		
	} else if( this.phase == 2 ) {
		var pos = 1 + Math.min(-this.x_off*0.01+Math.pow(this.x_off*0.005,2),0);
		if(this.progress > 45) pos += Math.max(this.progress-45,0);
		sprites.ending.render(g,new Point(88*pos,176),1,1);
		
		var credit_pos = Math.lerp(360,-320,Math.min(this.progress/40,1));
		textArea(g,this.text_credits,128,credit_pos,120);
	} else if( this.phase == 3 ) {
		
	}
}
SceneEnding.prototype.idle = function(){}