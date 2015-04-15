Dream.prototype = new GameObject();
Dream.prototype.constructor = GameObject;
function Dream(x, y, t){	
	this.constructor();
	this.progress = 0;
	
	this.previousMusic = audio.isPlayingAs("music");
	this.type = t || 0;
	this.length = 5.0;
	
	if( this.type == 0 ){
		audio.playAs("music_sleep","music");
	} else {
		audio.playAs("music_goeson","music");
		this.length = 20.0;
	}
	game.pause = true;
}

Dream.prototype.idle = function(){}
Dream.prototype.update = function(){
	this.progress += game.deltaUnscaled;
	
	if(this.progress > Game.DELTASECOND * this.length){
		game.pause = false;
		audio.playAs(this.previousMusic,"music");
		this.destroy();
	}
}
Dream.prototype.postrender = function(g,c){
	if( this.type == 0 ){
		sprites.title.render(g,new Point(),0,2);
	} else {
		sprites.dreams.render(g,new Point(),0,0);
	}
}