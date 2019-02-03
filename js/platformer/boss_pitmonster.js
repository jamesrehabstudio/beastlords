class PitMonster extends GameObject {
	get deltaModified(){ 
		let rlife = this.life / this.lifeMax;
		return this.delta * Math.lerp(2, 1, rlife);
	}
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPos = new Point(x, y);
		this.sprite = "pitmonster";
		this.width = 50;
		this.height = 52;
		this.frame = new Point(0,0);
		
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.death_time = Game.DELTASECOND * 2.0;
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.lightTrigger = ops.getString("lighttrigger", "")
		this.life = this.lifeMax = Spawn.life(15, this.difficulty);
		this.damage = Spawn.damage(3, this.difficulty);
		
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				this.position = this.initPos.add(new Point(0,64));
				
				let dif = this.target().position.x - this.position.x;
				if( this.isInActiveArea() && Math.abs(dif) < 200){
					this.trigger("activate");
				}
			}
		}
		
		this.on("hurt", function(obj){
			audio.play("hurt", this.position);
			
			this._slimeCooldown -= 3.0;
			
			if(this.life < this.lifeMax * 0.45){
				if(this._phase == 0 && this._pull_spikes_down <= 0){
					this._pull_spikes_down = 6.0;
				}
			}
		});
		this.on("downstabbed", function(){
			this._slimeCooldown = 0.0;
		});
		this.on("collideObject", function(obj){
			if(this.life > 0 && obj instanceof Player){
				obj.hurt( this, this.getDamage() );
			}
		});
		this.on("arm_touch", function(obj){
			if(this.life > 0 && obj instanceof Player){
				obj.hurt( this, this.getDamage() );
			}
		});
		this.on("arm_struck_left", function(obj){
			if(this.life > 0 && obj instanceof Player){
				this._attack_arm[0] = Math.max(this._attack_arm[0], 5);
				this.arm_left.speed = 16;
				Combat.hit.apply(obj, [this, Options.convert({"multiplier":0.25}), new Point]);
			}
		});
		this.on("arm_struck_right", function(obj){
			if(this.life > 0 && obj instanceof Player){
				this._attack_arm[1] = Math.max(this._attack_arm[1], 5);
				this.arm_right.speed = 16;
				Combat.hit.apply(obj, [this, Options.convert({"multiplier":0.25}), new Point]);
			}
		});
		this.on("player_death", function(){
			this._phase = 0;
			//Fill in area
			let c = this.spikes.corners();
			for(let x = c.left; x < c.right; x++) for(let y = c.top + 16; y < c.bottom - 16; y++) {
				game.setTile(x,y,game.tileCollideLayer,0);
			}
			this.spikes.position.y = this.position.y + PitMonster.SPIKE_POS_UP;
		});
		this.on("pre_death", function(){
			for(let i=0; i < this.flies.length; i++){
				if( this.flies[i].life > 0 ){
					this.flies[i].life = 0;
					this.flies[i].isDead();
				}
			}
			for(let a = 0; a < 2; a++){
			for(let i = 0; i < this.arm_left.parts.length; i++){
				let carm = a == 0 ? this.arm_left : this.arm_right;
				carm.parts[i].destroy();
			}}
		});
		this.on("death", function(){
			this.destroy();
		});
		
		this.arm_left = {
			"position" : new Point(),
			"parts" : new Array(),
			"speed" : 8,
			"particles" : false,
		};
		this.arm_right = {
			"position" : new Point(),
			"parts" : new Array(),
			"speed" : 8,
			"particles" : false,
		};
		
		
		for(let arm = 0; arm < 2; arm++){
			let carm = arm == 0 ? this.arm_left : this.arm_right;
			
			carm.particles = game.addObject( new ParticleSystem(x,y,[6,6],Options.convert({
				"sprite" : "bonetrap",
				"frame_x" : 0,
				"frame_y" : 5,
				"gravity" : 0.5,
				"count" : 8,
				"autodestroy" : false,
				"destroyOnSleep" : false,
				"loop" : true,
				"startForce" : 5,
				"time" : 0.5,
			})) );
			
			carm.position = this.position.scale(1);
			
			for(let part = 0; part < 12; part++){
				let p = new GameObject();
				p.position.x = carm.position.x;
				p.position.y = carm.position.y;
				p.parent = this;
				p.sprite = this.sprite;
				p.frame = part == 0 ? new Point(0,2) : new Point(0,3);
				p.width = p.height = 32;
				p.idle = function(){};
				p.zIndex = this.zIndex - part;
				p.flip = carm == 0;
				
				p.on("collideObject", function(obj){ this.parent.trigger("arm_touch", obj, this ); });
				
				if(arm == 0){
					p.on("struck", function(obj){ this.parent.trigger("arm_struck_left", obj, this ); });
				} else {
					p.on("struck", function(obj){ this.parent.trigger("arm_struck_right", obj, this ); });
				}
				
				carm.parts.push( p );
				game.addObject( p );
			}
		}
		
		this.spikes = new SpikeWall(this.position.x, this.position.y - 336, [128,64], Options.convert({"horizontal":true}));
		game.addObject(this.spikes);
		
		
		this._recall_left_arm = 0.0;
		this._recall_right_arm = 0.0;
		this._slimeCooldown = 8.0;
		this._slimeAttack = 0.0;
		//this._active_arm = 0;
		this._phase = 0;
		this._pull_spikes_down = 0.0;
		this._attack_arm = [0.0, 0.0];
		this._cooldown = [5.0, 10.0];
		this._flycooldown = 6.0;
		this._drag_arm = 0.0;
		this._transition = 0.0;
		this._intro = 0.0;
		this._target = new Point(x,y);
		
		this.flies = [];
	}
	update(){
		
		if(this.life > 0){
			if(!this.active){
				//hide
				this.arm_left.position = this.position.add(new Point(-80, 64));
				this.arm_right.position = this.position.add(new Point(80, 64));
				this.arm_left.particles.loop = false;
				this.arm_right.particles.loop = false;
			} else if(this._intro < PitMonster.INTRO_LENGTH) {
				//Play short intro where monster appears
				this._intro += this.delta;
				if(this._intro < PitMonster.INTRO_WAIT) {
					//Nothing happens
				} else if(this._intro < PitMonster.INTRO_REVEAL) {
					//Room shakes and beast appears
					let d = 0 - (this._intro - PitMonster.INTRO_WAIT) / (PitMonster.INTRO_WAIT - PitMonster.INTRO_REVEAL);
					this.position = Point.lerp(this.initPos.add(new Point(0,64)), this.initPos, d);
					shakeCamera(0.1,3);
				} else {
					//lights come on, and a short pause
					if(this._intro - this.delta < PitMonster.INTRO_REVEAL){
						Trigger.activate(this.lightTrigger);
					}
				}
			} else {
				let dif = this.target().position.subtract(this.position);
				this.frame.x = (this.frame.x + this.deltaModified * 8) % 4;
				this.frame.y = 0;
				
				//let carm = this._active_arm == 0 ? this.arm_left : this.arm_right;
				//let darm = this._active_arm == 0 ? this.arm_right : this.arm_left;
				
				for(let arm=0; arm < 2; arm++){
					let carm = arm == 0 ? this.arm_left : this.arm_right;
					
					
					if(this._cooldown[arm] <= 0){
						//Attack with arm
						this._attack_arm[arm] += this.deltaModified;
						
						//Set arm position and show dust
						if(this._attack_arm[arm]  < 2){
							
						} else if(this._attack_arm[arm]  < 5){
							//Extend arm
							carm.position.y = this.position.y+PitMonster.SPIKE_POS_UP;
						} else if(this._attack_arm[arm]  < 6){
							//retract arm
							carm.position.y = this.position.y + 64;
						} else {
							this._attack_arm[arm] = 0;
							this._cooldown[arm] = Math.lerp(8, 4, this.life/this.lifeMax);
						}
					} else {
						carm.particles.loop = false;
						this._cooldown[arm] -= this.deltaModified;
						
						if(this._cooldown[arm] <= 0){
							if((arm == 0 && dif.x < -32) || (arm != 0 && dif.x > 32)){
								//Get ready to spike
								carm.position.x = this.target().position.x;
								carm.position.y = this.position.y + 64;
								carm.speed = 8;
								carm.particles.position.x = carm.position.x;
								carm.particles.position.y = this.position.y	- Math.abs(this.position.x - carm.position.x) + 56;
								carm.particles.loop = true;
								audio.play("cracking", carm.position);
							} else {
								//Player on wrong side, wait
								this._cooldown[arm] = 2;
							}
							
						}
					}
				}
				
				this._flycooldown -= this.delta;
				if(this._flycooldown <= 0){
					this.spawnFly();
					this._flycooldown = Math.randomRange(3,7);
				}
				
				
				if(this._slimeCooldown <= 0){
					//Blow out slime
					this._slimeAttack += this.delta;
					this.frame.x = Math.clamp( (this._slimeAttack-0.7) * 6, 0, 3);
					this.frame.y = 1;
					if(
						Timer.isAt( this._slimeAttack, 1.0, this.delta ) ||
						Timer.isAt( this._slimeAttack, 1.2, this.delta ) ||
						Timer.isAt( this._slimeAttack, 1.4, this.delta )
					){
						this.fireSlime();
					}
					if(this._slimeAttack >= 2.0){
						this._slimeAttack = 0.0;
						this._slimeCooldown = 8.0;
					}
				} else {
					this._slimeCooldown -= this.delta;
				}
			}
			
		} else {
			//Dying
			this.arm_left.position = this.position.scale(1);
			this.arm_right.position = this.position.scale(1);
			this.arm_left.particles.loop = false;
			this.arm_right.particles.loop = false;
			
			if(Timer.interval(game.timeScaled, 0.3, game.delta)){
				this.fireSlime(true);
			}
			
		}
		
		//Update arm positions
		for(let a = 0; a < 2; a++){
			let carm = a == 0 ? this.arm_left : this.arm_right;
			carm.parts[0].position = Point.moveTo(carm.parts[0].position, carm.position, this.deltaModified * UNITS_PER_METER * carm.speed);
			for(let i = 1; i < this.arm_left.parts.length; i++){
				carm.parts[i].position = carm.parts[0].position.add(new Point(0,i*24));
			}
		}
		
	}
	idle(){}
	fireSlime(harmless=false){
		if(harmless){
			let s = new GameObject(this.position.x, this.position.y,false,false);
			s.width = s.height = 16;
			s.sprite = "bullets";
			s.frame.x = 5;
			s.frame.y = 0;
			s.addModule(mod_rigidbody);
			s.pushable = false;
			s.force.y = -12;
			s.force.x = Math.randomRange(-5,5);
			s.on(["collideHorizontal","collideVertical","sleep"],function(obj){
				this.destroy();
			});
			game.addObject(s);
		} else {
			let b = new PitMonsterSlime(this.position.x, this.position.y);
			b.damageSlime = Math.round( this.damage * 0.7 );
			b.force = new Point( (Math.random()-0.5) * 5, -8 - Math.random() * 5 );
			
			game.addObject(b);
		}
	}
	spawnFly(){
		let freeSlot = -1;
		if(this.flies.length < 4){
			freeSlot = this.flies.length;
		} else {
			for(let i=0; i < this.flies.length; i++){
				if(this.flies[i].life <= 0){
					freeSlot = i;
					break;
				}
			}
		}
		if(freeSlot >= 0){
			this.flies[freeSlot] = game.addObject(
				new Fly(
					this.position.x, 
					this.position.y,
					false, 
					new Options({"difficulty": this.difficulty})
				)
			);
		}
		
	}
}
PitMonster.SPIKE_POS_UP = -336;
PitMonster.SPIKE_POS_DOWN = -160;
PitMonster.INTRO_LENGTH = 10;
PitMonster.INTRO_WAIT = 5;
PitMonster.INTRO_REVEAL = 8;

class PitMonsterSlime extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "bullets";
		
		this.width = 16;
		this.height = 16;
		this.frame.x = 5;
		this.frame.y = 0;
		
		this.damage = 0;
		this.damageSlime = 5;
		
		this.force = new Point();
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt( this, Combat.getDamage.apply(this) );
				this.destroy();
			}
		});
		this.on("sleep", function(){
			this.destroy();
		})
	}
	update(){
		this.position.x += this.force.x * UNITS_PER_METER * this.delta;
		this.position.y += this.force.y * UNITS_PER_METER * this.delta;
		this.force.y += 0.5 * UNITS_PER_METER * this.delta;
	}
}

self["PitMonster"] = PitMonster;


class PitMonsterMini extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPos = new Point(x, y);
		this.sprite = "pitmonster";
		this.width = 28;
		this.height = 52;
		
		this.addModule(mod_combat);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = Spawn.life(5, this.difficulty);
		this.damage = Spawn.damage(5, this.difficulty);
		
		this.on("hurt", function(obj){
			audio.play("hurt", this.position);
		});
		this.on("pre_death", function(){
			audio.play("kill",this.position); 
		})
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt( this, this.getDamage() );
			}
		});
		this.on("sleep", function(){
			if(this.life <= 0){
				this.destroy();
			}
		});
		
		this._occ = 0.0;
	}
	update(){
		if(this.life > 0){
			this._occ += this.delta * 4;
			this.position.x = this.initPos.x + Math.sin(this._occ) * 12;
			this.position.y = this.initPos.y + Math.cos(this._occ) * 32;
		} else {
			this.position.x = Math.lerp(this.position.x, this.initPos.x, this.delta);
			this.position.y += this.delta * 32.0;
		}
	}
}

self["PitMonsterMini"] = PitMonsterMini;