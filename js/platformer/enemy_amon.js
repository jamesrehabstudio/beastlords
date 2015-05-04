Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y){
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
	this.on("struck", EnemyStruck);
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(0);
	this.collisionReduction = -1.0;
	this.bounce = 1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	this.damage = dataManager.damage(2);
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	if( this.stun < 0 ) {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.force.x = this.speed * (this.force.x > 0 ? 1 : -1);
			this.force.y = this.speed * (this.force.y > 0 ? 1 : -1);
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
		this.strike( new Line(-8,0,8,4) );
	} else {
		this.force.x = this.force.y = 0;
	}
}