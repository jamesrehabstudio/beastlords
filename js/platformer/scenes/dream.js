Dream.prototype = new GameObject();
Dream.prototype.constructor = GameObject;
function Dream(x, y){	
	this.constructor();
	this.progress = -Game.DELTASECOND;
	
	//Decide dream
	this.type = 0;
	var completed = 0;
	for(var i=0; i < _world.temples.length; i++) if( _world.temples[i].complete ) completed++;
	if( _world.dreams < 3 && dataManager.currentTown > 0 && completed > _world.lastDream ) {
		_world.lastDream = completed;
		_world.dreams++;
		this.type = _world.dreams;
	}
	
	this.previousMusic = audio.isPlayingAs("music");
	this.length = 5.0;
	this.waveStrength = 1.0;
	
	if( this.type == 0 ){
		audio.playAs("music_sleep","music");
	} else {
		audio.playAs("music_goeson","music");
		this.length = 19.5;
		this.waveStrength = this.type * 3;
	}
}

Dream.prototype.idle = function(){}
Dream.prototype.update = function(){
	this.progress += game.deltaUnscaled;
	
	if( input.state("pause") == 1 ) {
		this.progress = Math.max( Game.DELTASECOND * this.length, this.progress );
	}
	
	if(this.progress > Game.DELTASECOND * (this.length+0.5)){
		game.pause = false;
		audio.playAs(this.previousMusic,"music");
		this.destroy();
	} else {
		game.pause = true;
	}
}
Dream.prototype.postrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
	
	//Wavy background
	var x = this.type % 2;
	var _y = Math.floor(this.type / 2)*15;
	for(var y=0; y < 240/16; y++){
		var wave = Math.sin(this.progress*0.1+y*0.2) * this.waveStrength;
		sprites.dreams.render(g,new Point(xpos+wave,y*16),x,_y+y);
	}
	
	if(this.type == 1){
		var f = 4 + Math.abs(this.progress/Game.DELTASECOND*3) % 2;
		sprites.characters.render(g,new Point(xpos+184,192),f,0,true);
		sprites.characters.render(g,new Point(xpos+104,192),f,1,false);
	} else if(this.type == 2){
		var f = Math.abs(this.progress/Game.DELTASECOND*3) % 3;
		var distance = 256 * (this.progress / (this.length*Game.DELTASECOND));
		sprites.characters.render(g,new Point(xpos+distance,192),f,0,false);
		if(this.progress > Game.DELTASECOND*7){
			sprites.characters.render(g,new Point(xpos+16+distance,192),3,1,true);
		} else {
			f = Math.abs(this.progress/Game.DELTASECOND*5) % 3;
			distance = Math.lerp(-64,distance+16,this.progress/(Game.DELTASECOND*7));
			sprites.characters.render(g,new Point(xpos+distance,192),3+f,2,false);
		}
	} else if(this.type == 3){
		var distance = Math.lerp(-64,96,Math.min(this.progress/(Game.DELTASECOND*7),1));
		var f = Math.abs(distance*0.2) % 3;
		sprites.characters.render(g,new Point(xpos+distance,192),3+f,2,false);
		
		if(this.progress > Game.DELTASECOND * 15){
			sprites.poseidon.render(g,new Point(xpos+168,160),2,1,true);
		}
		sprites.characters.render(g,new Point(xpos+176,192),3,0,true);
		
		//White flashes
		if(
			Math.abs(this.progress-(12*Game.DELTASECOND)) <= 1 ||
			Math.abs(this.progress-(14*Game.DELTASECOND)) <= 1 ||
			Math.abs(this.progress-(15*Game.DELTASECOND)) <= 1
		){
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
		}
	}
	
	//Fade in and out
	var fade = Math.max(Math.max(
		0-this.progress/Game.DELTASECOND, 
		(this.progress/Game.DELTASECOND)-(this.length-1)
	), 0);
	g.color = [0.0,0.0,0.0,fade]
	g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
}