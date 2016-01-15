Svarog.prototype = new GameObject();
Svarog.prototype.constructor = GameObject;
function Svarog(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 40;
	
	this.speed = 2.5;
	this.sprite = sprites.svarog;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			//obj.hurt( this, this.damage );
			//this.force.x *= -1;
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
		this.force.x = dir.x > 0 ? -this.speed : this.speed; 
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	
	this.states = {
		"cooldown" : 0
	};
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Svarog.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 3;
	this.frame_row = 0;
	this.flip = this.force.x < 0;
	
	var dir = this.position.subtract(_player.position);
	this.force.y += ( dir.y > -56 ? -.2 : .2 ) * this.delta;
	
	if( this.states.cooldown <= 0 ) {
		this.states.cooldown = Game.DELTASECOND * 1.0;
		var fire = new Fire(this.position.x, this.position.y);
		fire.team = this.team;
		fire.damage = this.damage;
		game.addObject(fire);
	}
	this.states.cooldown -= this.delta;
}