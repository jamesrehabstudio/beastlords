Lamp.prototype = new GameObject();
Lamp.prototype.constructor = GameObject;
function Lamp(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "lamps";
	this.zIndex = -21;
	this.size = 180;
	this.show = true;
	this.color = [1.0,0.85,0.75,1.0];
	
	this.frame = 0;
	this.frame_row = 0;
	
	o = o || {};
	if("size" in o){
		this.size = o.size * 1;
	}
	if("show" in o){
		this.show = o.show * 1;
	}
	if("color" in o){
		var colorArray = o.color.split(",");
		if(colorArray.length >= 3){
			this.color[0] = colorArray[0] * 1;
			this.color[1] = colorArray[1] * 1;
			this.color[2] = colorArray[2] * 1;
		}
	}
}
Lamp.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.3) % 4;
}
Lamp.prototype.render = function(g,c){	
	if(this.show){
		GameObject.prototype.render.apply(this,[g,c]);
	}
	Background.pushLight( this.position, this.size, this.color );
}
Lamp.prototype.idle = function(){
	var current = this.awake;
	var corners = this.corners();
	var margin = this.size * 0.5 + 32;
	
	this.awake = (
		corners.right + margin > game.camera.x &&
		corners.left - margin < game.camera.x + game.resolution.x &&
		corners.bottom + margin > game.camera.y &&
		corners.top - margin < game.camera.y + game.resolution.y
	);
	
	if( current != this.awake ){
		this.trigger( (this.awake ? "wakeup" : "sleep") );
	}
}