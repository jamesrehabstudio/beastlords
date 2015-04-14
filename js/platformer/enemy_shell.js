Shell.prototype = new GameObject();
Shell.prototype.constructor = GameObject;
function Shell(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 0.5;
	this.sprite = sprites.shell;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1
	}
	
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
	this.on("collideHorizontal", function(dir){
		this.states.direction *= -1;
		this.force.x = 0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(1);
	this.collisionReduction = -1.0;
	this.friction = 0.2;
	this.stun_time = Game.DELTASECOND * 0.75;
	this.invincible_time = 30.0;
	this.damage = dataManager.damage(2);
	
	this.mass = 1.0;
	this.gravity = 1.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Shell.prototype.update = function(){
	this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 3;
	if( this.stun < 0 ) {
		this.force.x += this.speed * this.delta * this.states.direction;
		this.flip = this.force.x < 0;
	} else {
		this.force.x = this.force.y = 0;
	}
}