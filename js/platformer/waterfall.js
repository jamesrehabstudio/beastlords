Waterfall.prototype = new GameObject();
Waterfall.prototype.constructor = GameObject;
function Waterfall(x,y,t,o){
	this.constructor();
	this.position.x=x;
	this.position.y=y;
	this.width = 128;
	this.height = 240;
	this.sprite = sprites.waterfall;
	this.frame = 0;
	this.frame_row = t;
	this.zIndex = 1;
}
Waterfall.prototype.update = function(){
	this.frame = (this.frame+0.1*this.delta)%3;
}
Waterfall.prototype.render = function(){}
Waterfall.prototype.prerender = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
}