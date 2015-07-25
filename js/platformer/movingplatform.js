MovingPlatform.prototype = new GameObject();
MovingPlatform.prototype.constructor = GameObject;
function MovingPlatform(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.start_y = y;
	
	this.width = 28;
	this.height = 16;
	
	this.speed = 1.3;
	this.distance = 32;
	this.direction = 1.0;
	this.onboard = false;
	
	this.sprite = game.tileSprite;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( obj.force.y > 0 ) {
				this.onboard = true;
				obj.position.y = this.position.y;
				obj.trigger( "collideVertical", 1);
			}
		}
	});
	
	this.pushable = false;
	this.gravity = 0.0;
}

MovingPlatform.prototype.idle = function(){}
MovingPlatform.prototype.update = function(){
	var dir = this.position.y - this.start_y;
	if( dir > this.distance ) {
		this.direction = -1.0;
	}
	if( dir < -this.distance ) {
		this.direction = 1.0;
	}
	this.force.y = this.direction * this.speed;
	
	this.onboard = false;
}
MovingPlatform.prototype.render = function(g,c){
	game.tileSprite.render(g, new Point(this.position.x-8-c.x, this.position.y+8-c.y), 0, 15);
	game.tileSprite.render(g, new Point(this.position.x+8-c.x, this.position.y+8-c.y), 1, 15);
}