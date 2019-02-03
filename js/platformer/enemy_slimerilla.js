/*
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
		
		this.times.jumpback = true;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
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
*/
class Slimerilla extends GameObject{
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		this.collideDamage = 0;
		this.team = 0;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_creep);
		
		this.sprite = "slimerilla";
		this.swrap = spriteWrap["slimerilla"];
		this.speed = 4.0;
		this.jumpSpeed = 4.0;
		this.gravity = 0.5;
		
		o = o || {};
		
		this.difficulty = o.getInt("difficulty",Spawn.difficulty);
		this.startHidden = this.hidden = o.getBool("hidden",false);
		
		this.states = {
			
			"attack" : 0.0,
			"cooldown" : Game.DELTASECOND,
			"takeshape" : 0.0,
			"reappear" : 0.0,
			"turn" : 0.0,
			"jumpCooldown" : 0.0,
			"landed" : 0.0,
			"walk" : 0.0,
			"jumpback" : false
		};
		this.times = {
			"attack" : Game.DELTASECOND * 3,
			"cooldown" : Game.DELTASECOND * 2,
			"takeshape" : Game.DELTASECOND * 0.5,
			"reappear" : Game.DELTASECOND * 3,
			"turn" : Game.DELTASECOND * 2,
			"jumpCooldown" : Game.DELTASECOND * 7,
			"landed" : Game.DELTASECOND * 0.125
		};
		
		this.on("struck", EnemyStruck);
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(this.hidden){ this.states.reappear = this.times.reappear; }
			}
		})
		this.on("hurt",function(obj,damage){
			
			this.states.jumpback = true;
		});
		this.on("respawn", function(){
			this.states.cooldown = this.times.cooldown;
			this.states.attack = 0.0;
			this.states.reappear = 0.0;
			
			this.hidden = this.startHidden;
		});
		this.on("land", function(){
			this.states.landed = this.times.landed;
		});
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			this.creep_hide();
		});
		
		if(this.hidden){
			this.pushable = true;
		}
		
		this.life = Spawn.life(4, this.difficulty);
		this.moneyDrop = Spawn.money(8,this.difficulty);
		this.damage = Spawn.damage(4,this.difficulty);
		this.defencePhysical = Spawn.defence(1,this.difficulty);
		this.defenceFire = Spawn.defence(-2,this.difficulty);
		this.defenceSlime = Spawn.defence(4,this.difficulty);
		this.death_time = Game.DELTASECOND * 0.5;
	}
	update(){
		if(this.life > 0){
			let dir = this.target().position.subtract(this.position);
			
			if(this.hidden){
				//Waiting for player
				this.damageContact = 0.0;
				this.frame.x = 3;
				this.frame.y = 0;
				this.pushable = false;
				this.invincible = Math.max(this.invincible, 0.25);
				this.combat_shootable = false;
				
				if(this.states.reappear > 0){
					this.states.reappear -= this.delta;
					if(this.states.reappear <= 0){ 
						this.states.takeshape = this.times.takeshape;
						this.hidden = false;
						this.pushable = true;
						this.jump();
						this.flip = dir.x < 0;
					}
				}
			} else {
				this.combat_shootable = true;
				this.damageContact = 0.5;
				
				if(this.states.takeshape > 0){
					//Appearing
					let p = 1 - this.states.takeshape / this.times.takeshape;
					this.frame = this.swrap.frame("appear", p);
					this.states.takeshape -= this.delta;
				} else if(this.states.attack > 0){
					//Attacking
					let p = 1 - this.states.attack / this.times.attack;
					this.frame = this.swrap.frame("attack", p);
					this.states.attack -= this.delta;
					this.force.x = 0;
				} else if(!this.grounded){
					//Jumping
					this.addHorizontalForce(this.speed * -this.forward(), 0.5);
					this.frame.x = (this.force.y < -0.25 ? 0 : (this.force.y > 0.25 ? 2 : 1));
					this.frame.y = 3;
				} else if(this.states.landed > 0){
					this.states.landed -= this.delta;
					this.frame.x = this.frame.y = 3;
				} else {
					//Idle state
					this.states.jumpCooldown -= this.delta;
					
					if((this.flip && dir.x > 0) || (!this.flip && dir.x < 0)){
						//Player is behind
						this.states.turn += this.delta;
						if(this.states.turn >= this.times.turn){
							this.flip = dir.x < 0;
						}
					} else {
						this.states.turn = 0.0;
						this.states.cooldown -= this.delta;
						
						if(Math.abs(dir.x) < 80){
							this.states.walk = (this.states.walk + 0.5 * this.delta) % 1;
							this.frame = this.swrap.frame("idle", this.states.walk);
						} else {
							//Walk towards target
							this.addHorizontalForce(this.speed * this.forward());
							this.states.walk = (this.states.walk + Math.abs(this.force.x) * 1.5 * this.delta) % 1;
							this.frame = this.swrap.frame("walk", this.states.walk);
						}
						if(this.states.jumpCooldown <= 0 && this.states.jumpback){
							this.jump();
							this.states.jumpback = false;
							this.states.jumpCooldown = this.times.jumpCooldown;
							this.force.x = this.speed * 2 * -this.forward();
						} else if(this.states.cooldown <= 0){
							this.states.cooldown = this.times.cooldown;
							this.states.attack = this.times.attack;
						}
					}
				}
			}
		} else {
			this.frame.x = 1;
			this.frame.y = 3;
		}
	}
	jump(){
		this.grounded = false;
		this.force.y = -5;
	}
}
self["Slimerilla"] = Slimerilla;