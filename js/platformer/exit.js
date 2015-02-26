Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 16;
	this.height = 240;
	
	this.visible = false;
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			window._world.trigger("activate");
		}
	});
}
Exit.prototype.idle = function(){}