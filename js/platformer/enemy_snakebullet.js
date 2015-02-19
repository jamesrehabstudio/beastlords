SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.origin.y = 0.8;
	
	this.speed = 0.2;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team != obj.team ) {
			obj.trigger("struck", this, this.position, this.collideDamage );
			this.trigger("death");
		} else if( this.states.landed && obj instanceof Oriax ){
			this.trigger("death");
		}
	});
	this.on("collideVertical", function(dir){
		if( !this.states.landed ){
			this.states.landed = true;
			this.flip = !this.flip;
		}
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	this.flip = d < 0;
	this.force.x = d * 8;
	this.life = 3;
	this.collideDamage = 5;
	this.mass = 0.0;
	this.gravity = 0.1;
	
	this.states = {
		"landed" : false,
		"life" : 200
	}
}
SnakeBullet.prototype.update = function(){
	this.frame = Math.max( (this.frame + this.delta * 0.2) % 4, 2);
	this.frame_row = 2;
	this.friction = this.grounded ? 0.2 : 0.05;
	
	this.states.life -= this.delta;
	
	if( this.stun < 0 && this.states.landed && this.states.dieOnTouch ) {
		this.gravity = 1.0;
		var direction = (this.flip ? -1 : 1);
		this.force.x += this.speed * this.delta * direction;
	}
	
	if( this.states.life < 0 ){
		this.trigger("death");
	}
}