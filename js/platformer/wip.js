WIP.prototype = new GameObject();
WIP.prototype.constructor = GameObject;
function WIP(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 48;
	this.sprite = "wip";
	this.zIndex = 1;
}
WIP.prototype.render = function(g,c){
	let rad = 80 + Math.abs(Math.sin(game.timeScaled * 0.1)) * 80;
	Background.pushLight(this.position.subtract(new Point(16,12)), rad, COLOR_FIRE);
	GameObject.prototype.render.apply(this,[g,c]);
}