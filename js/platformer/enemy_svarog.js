Svarog.prototype = new GameObject();
Svarog.prototype.constructor = GameObject;
function Svarog(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.speed = 7.5;
	this.sprite = "svarog";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		
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
		
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		this.destroy();
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.xpDrop = Spawn.xp(4,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.05;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.times = {
		"turn" : Game.DELTASECOND * 0.8,
		"forceHeight" : 0.1,
		"waveSpeed" : 0.08,
	};
	this.states = {
		"cooldown" : 0,
		"turn" : 0.0,
		"wave" : 0.0
	};
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Svarog.prototype.isBehind = function(p){
	if(this.flip){
		return p.x > this.position.x;
	} else{
		return p.x < this.position.x;
	}
}
Svarog.prototype.update = function(){
	
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		this.states.wave += this.delta * this.times.waveSpeed;
		this.force.y += Math.sin(this.states.wave) * this.times.forceHeight * this.delta;
		
		if(this.states.turn > 0){
			var progress = 1 - this.states.turn / this.times.turn;
			this.frame.x = progress * 4;
			this.frame.y = 1;
			this.states.turn -= this.delta;
			if(this.states.turn <= 0){
				this.flip = !this.flip;
			}
		} else {
			if(this.isBehind(_player.position)){
				this.states.turn = this.times.turn;
			}
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			this.addHorizontalForce(this.forward() * this.speed);
		}
		
		this.states.cooldown -= this.delta;
		
		if( this.states.cooldown <= 0 ) {
			this.states.cooldown = Game.DELTASECOND * 1.0;
			var fire = new Fire(this.position.x, this.position.y+20);
			fire.team = this.team;
			game.addObject(fire);
		}
		
	} else {
		this.frame.x = 0;
		this.frame.y = 2;
		this.gravity = 1.0;
		this.force.x = this.forward() * 2;
	}
}