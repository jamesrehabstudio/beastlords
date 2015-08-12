Lamp.prototype = new GameObject();
Lamp.prototype.constructor = GameObject;
function Lamp(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.lamps;
	this.zIndex = -21;
	
	this.frame = 0;
	this.frame_row = 0;
}
Lamp.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.3) % 4;
}
Lamp.prototype.render = function(g,c){	
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), 180 );
}