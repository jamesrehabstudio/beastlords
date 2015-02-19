Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 12;
	this.height = 12;
	this.blockable = true;
	
	this.speed = 6.0;
	this.sprite = sprites.bullets;
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hurt instanceof Function ) {
			if( this.blockable ) {
				obj.trigger("struck", this, this.position, this.collideDamage );
			} else {
				obj.hurt( this, this.collideDamage );
			}
			this.trigger("death");
		} 
	});
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(obj,pos,damage){ this.destroy();});
	
	this.team = 0;
	this.collideDamage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
	this.flip = d < 0;
}