Slimerilla.prototype = new GameObject();
Slimerilla.prototype.constructor = GameObject;
function Slimerilla(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.collideDamage = 0;
	this.team = 0;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = "slimerilla";
	this.swrap = spriteWrap["slimerilla"];
	this.speed = 2.0;
	this.jumpSpeed = 4.0;
	this.interactive = this.visible = false;
	this.pushable = false;
	this.startactive = true;
	this.gravity = 0.5;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("startactive" in o){
		this.startactive = o["startactive"] * 1;
	}
	
	this.times = {
		"attackTime" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"cooldown" : Game.DELTASECOND,
		"timeBetweenAttacks" : Game.DELTASECOND * 1.5,
		"reappear" : 0,
		"reappearTime" : 0.0,
		"turnTimer" : 0.0,
		"jumpback" : false
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		audio.play("hurt",this.position);
		this.times.jumpback = true;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	if(this.startactive){
		this.interactive = this.visible = true;
		this.pushable = true;
		this.faceTarget();
	}
	
	this.life = Spawn.life(8, this.difficulty);
	this.moneyDrop = Spawn.money(8,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.death_time = Game.DELTASECOND * 0.5;
	this.calculateXP();
}
Slimerilla.prototype.update = function(){
	var dir = _player.position.subtract(this.position);
	
	if(this.interactive){
		var dir = this.target().position.subtract(this.position);
		
		if(this.times.attack > 0){
			let p = 1 - this.times.attack / this.times.attackTime;
			this.frame = this.swrap.frame("attack", p);
			this.times.attack -= this.delta;
		} else if(this.times.jumpback){
			//jump away from player
			this.force.y = -6;
			this.addHorizontalForce(this.jumpSpeed * (dir.x>0?-1.0:1.0), 99);
			this.times.jumpback = false;
		} else {
			//move towards player
			this.addHorizontalForce(this.speed * this.forward());
			
			if(Math.abs(dir.x) < 48 && this.times.cooldown <= 0 ){
				this.times.attack = this.times.attackTime;
				this.times.cooldown = this.times.timeBetweenAttacks;
				this.faceTarget();
			}
			if(this.times.turnTimer <= 0){
				this.faceTarget();
				this.times.turnTimer = Game.DELTASECOND * 2;
			}
			this.times.turnTimer -= this.delta;
			this.times.cooldown -= this.delta;
			
			if(this.grounded){
				if(Math.abs(this.force.x) > 0.2){
					this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.1) % 4;
					this.frame.y = 2;
				} else {
					this.frame.x = (this.frame.x+this.delta*0.15) % 3;
					this.frame.y = 0;
				}
			} else {				
				this.frame.x = (this.force.y < -1 ? 0 : (this.force.y > 1 ? 2 : 1));
				this.frame.y = 3;
			}
			
		}
		
	} else {
		if(this.life <= 0){
			//Do nothing, dying
		} else if(this.times.reappear){
			this.times.reappearTime -= this.delta;
			var progress = this.times.reappearTime / (Game.DELTASECOND * 0.2);
			if(progress <= 1){
				this.visible = true;
				this.frame.x = Math.min((1 - progress) * 3, 2);
				this.frame.y = 4;
			}
			
			if(this.times.reappearTime <= 0){
				this.interactive = true;
				this.pushable = true;
				this.faceTarget();
				this.force.y = -5;
				this.grounded = false;
			}
		} else if(dir.length() < 32) {
			this.times.reappearTime = Game.DELTASECOND * 1;
			this.times.reappear = 1;
		}
	}
}
Slimerilla.prototype.faceTarget = function(){
	var dir = this.target().position.subtract(this.position);
	this.flip = dir.x < 0;
}