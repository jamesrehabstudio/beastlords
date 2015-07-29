MovingPlatform.prototype = new GameObject();
MovingPlatform.prototype.constructor = GameObject;
function MovingPlatform(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.width = 28;
	this.height = 16;
	
	this.speed = 1.3;
	this.direction = new Point(1,1);
	this.onboard = false;
	
	this.sprite = game.tileSprite;
	
	ops = ops || {};
	this.top = (ops.top || 0) - -y;
	this.bottom = (ops.bottom || 0) - -y;
	this.left = (ops.left || 0) - -x;
	this.right = (ops.right || 0) - -x;
	
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
	if( this.top != this.bottom ){
		if( this.position.y < this.top ) this.direction.y = 1.0;
		if( this.position.y > this.bottom ) this.direction.y = -1.0;
		this.force.y = this.direction.y * this.speed;
	}
	
	if( this.left != this.right ){
		if( this.position.x < this.left ) this.direction.x = 1.0;
		if( this.position.x > this.right ) this.direction.x = -1.0;
		this.force.x = this.direction.x * this.speed;
	}
	
	this.onboard = false;
}
MovingPlatform.prototype.render = function(g,c){
	game.tileSprite.render(g, new Point(this.position.x-16-c.x, this.position.y+8-c.y), 0, 15);
	game.tileSprite.render(g, new Point(this.position.x+0-c.x, this.position.y+8-c.y), 1, 15);
}