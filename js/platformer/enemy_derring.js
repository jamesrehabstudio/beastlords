Derring.prototype = new GameObject();
Derring.prototype.constructor = GameObject;
function Derring(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.amon;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(0);
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	
	this.mass = 1.0;
	this.gravity = 0.0;
	this.calculateXP();
}
Derring.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	this.flip = this.force.x < 0;
}