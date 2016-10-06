Sentry.prototype = new GameObject();
Sentry.prototype.constructor = GameObject;
function Sentry(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	
	this.speed = 0.0;
	this.sprite = "chaz";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 33,
		"attack" : 0,
		"bullet" : 0,
		"attack_lower" : true
	};
	this.attack = {
		"warm" : Game.DELTASECOND * 3.5,
		"release" : Game.DELTASECOND * 3.0
	};
	
	this.calculateXP();
}
Sentry.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.cooldown <= 0 ) {
			if( this.states.attack <= 0 ) {
				this.states.cooldown = Game.DELTASECOND;
			} else if( this.states.attack <= this.attack.release ) {
				if( this.states.attack <= this.states.bullet ) {
					this.states.bullet = this.states.attack - Game.DELTASECOND * 0.25;
					var direction = this.flip ? -1 : 1;
					var bullet = new Bullet(this.position.x, this.position.y, direction);
					bullet.team = this.team;
					bullet.position.y += this.states.attack_lower ? 10 : -8;
					bullet.damage = this.damage;
					bullet.knockbackScale = 5;
					game.addObject(bullet);
				}
			}
			this.states.attack -= this.delta;
		} else {
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			if( this.states.cooldown <= 0 ) {
				this.states.attack_lower = !this.states.attack_lower;
				this.states.bullet = this.states.attack = this.attack.warm;
			}
		}
	}
	
	/* Animate */
	this.frame_row = 4;
	if( this.states.attack > 0 && this.states.attack <= this.attack.release ) {
		this.frame = (this.frame + this.delta * 0.5) % 2;
	} else {
		this.frame = 0;
	}
}