Bookrider.prototype = new GameObject();
Bookrider.prototype.constructor = GameObject;
function Bookrider(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.5;
	this.speedMax = 2.0;
	this.sprite = "bookrider";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 0.3,
		"turn" : Game.DELTASECOND * 0.5,
		"cooldown" : Game.DELTASECOND * 1.5,
		"retreat" : Game.DELTASECOND * 0.2,
		"lowerlock" : Game.DELTASECOND * 0.5
	};
	this.states = {
		"attack" : 0.0,
		"turn" : 0.0,
		"cooldown" : this.times.cooldown,
		"retreat" : 0.0,
		"lowerlock" : 0.0
	};
	
	this.on("hurt", function(obj,damage){
		this.states.retreat = this.times.retreat;
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && obj.position.y > this.position.y && this.life > 0){
			obj.hurt(this,this.damage);
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	//this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	
	this.pushable = false;
	this.hurtByDamageTriggers = false;
	
	this.mass = 1.0;
	this.friction = 0.2;
	this.gravity = 0.0;
}
Bookrider.prototype.update = function(){
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		this.grounded = false;
		
		if(this.states.retreat > 0){
			this.states.retreat -= this.delta;
			this.frame.x = 0;
			this.frame.y = 2;
			this.force.x += (dir.x > 0 ? 1 : -1) * this.speed * this.delta * 15;
		} else {
			if(this.states.attack > 0){
				this.states.attack -= this.delta;
				this.frame.x = 0;
				this.frame.y = 1;
			} else if(this.states.turn > 0){
				this.states.turn -= this.delta;
				var progress = this.states.turn / this.times.turn;
				this.frame.x = 1 + 2 * Math.sin(Math.PI*progress);
				this.frame.y = 1;
				if(Timer.isAt(this.states.turn, this.times.turn*0.5, this.delta)){
					this.flip = !this.flip;
				}
			} else {
				if((this.flip && dir.x < 0) || (!this.flip && dir.x > 0)){
					this.states.turn = this.times.turn;
				}
				
				if((Math.abs(dir.x) < 16 && dir.y < 0) || this.states.lowerlock > 0){
					if(dir.y < -56) {
						this.force.y += this.delta * this.speed;
					} else {
						this.states.cooldown -= this.delta;
						this.force.y -= this.delta * this.speed;
					}
					if(Math.abs(dir.x) < 16){
						this.states.lowerlock = this.times.lowerlock;
					} else {
						this.states.lowerlock -= this.delta;
					}
				} else {
					this.states.cooldown = Math.min(this.states.cooldown + this.delta * 0.25, this.times.cooldown);
					if(this.flip) {
						this.force.x -= this.delta * this.speed;
					} else {
						this.force.x += this.delta * this.speed;
					}
					if(dir.y < -80) {
						this.force.y += this.delta * this.speed;
					} else {
						this.force.y -= this.delta * this.speed;
					}
				}
				
				this.force.x = Math.max(Math.min(this.force.x, this.speedMax),-this.speedMax);
				this.force.y = Math.max(Math.min(this.force.y, this.speedMax),-this.speedMax);
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = this.times.cooldown;
					this.states.attack = this.times.attack;
					this.force.y = 4;
				}
				
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
				this.frame.y = 0;
			}
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}