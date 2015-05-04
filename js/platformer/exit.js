Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y,t,o){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 16;
	this.height = 240;
	
	var options = o || {};
	this.visible = false;
	this.offset = new Point();
	
	if("direction" in options){
		if( options.direction == "e" ) this.offset.x += 16;
		if( options.direction == "w" ) this.offset.x -= 16;
		if( options.direction == "s" ) this.offset.y += 16;
		if( options.direction == "n" ) this.offset.y -= 16;
	}
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			window._world.player.x += this.offset.x;
			window._world.player.y += this.offset.y;
			window._world.trigger("activate");
		}
	});
}
Exit.prototype.idle = function(){}