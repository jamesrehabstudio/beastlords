Malsum.prototype = new GameObject();
Malsum.prototype.constructor = GameObject;
function Malsum(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 18;
	this.sprite = "malsum";
	this.speed = 0.3;
	this.start = new Point(x,y);
	
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"hop" : Game.DELTASECOND * 0.2,
		"attack" : Game.DELTASECOND,
		"cooldown" : Game.DELTASECOND
	}
	this.states = {
		"hop" : 0.0,
		"attack" : 0.0,
		"cooldown" : this.times.cooldown,
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.mass = 1.0;
	this.gravity = 0.5;
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,3);
		audio.play("kill");
		this.destroy();
	});
}
Malsum.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0 ){
		
		if(this.grounded){
			this.frame = new Point(0,0);
		} else {
			this.frame = new Point(Math.max(Math.min(1+this.force.y,2),0),1);
		}
		
		if(this.states.cooldown > 0){
			if(this.grounded){
				this.states.cooldown -= this.delta;
				this.states.hop -= this.delta;
				this.flip = dir.x > 0;
			}
			
			if(this.states.cooldown > 0 && this.states.hop <= 0){
				this.states.hop = this.times.hop;
				this.grounded = false;
				this.force.y = -5;
				this.force.x = (this.position.x > this.start.x ? -1 : 1) * 4;
			}
			
			if(this.states.cooldown <= 0){
				this.states.attack = this.times.attack;
				if(Math.random() > 0.5){
					this.grounded = false;
					this.force.y = -5;
				}
			}
		} else if(this.states.attack > 0){
			this.states.attack -= this.delta;
			
			if(Timer.isAt(this.states.attack, this.times.attack * 0.5, this.delta)){
				var bullet = new Bullet(this.position.x, this.position.y + 4);
				bullet.damage = this.damage;
				bullet.blockable = true;
				bullet.frame = new Point(1,0);
				bullet.force.x = this.forward() * 8;
				game.addObject(bullet);
			}
			
			if(this.states.attack < this.times.attack * 0.5){
				this.frame = new Point(1,0);
			}
			
			if(this.states.attack <= 0 ){
				this.states.cooldown = this.times.cooldown;
			}
		}
	} else {
		this.frame.x = 0;
		this.frame.y = 2;
	}
}