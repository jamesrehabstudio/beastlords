class Garmr extends GameObject{
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 48;
		this.height = 48;
		this.origin = new Point(0.5,0.7);
		this.sprite = "garmr";
		this.swrap1 = spriteWrap["garmr_small"];
		this.swrap2 = spriteWrap["garmr_large"];
		this.swrap = this.swrap1;
		self["_garmr"] = this;
		
		this.speed = 3.0;
		this.force = new Point();
		this.friction = 0.1;
		this.gotoPos = new Vector();
		this.start = new Point(x,y);
		this.objectTracker = new Array();
		
		this.active = false;
		this.closeToBoss = false;
		//this.track = null;
		
		this.frame = new Point(0,0);
		
		this.fistPos = new Point(0,0);
		
		this.trackRay = {
			"position" : new Point(32,-28),
			"rotation" : 50,
			"length" : 300,
			"isOn" : false,
		}
		this.trackHead = {
			"position" : new Vector(x,y),
			"offset" : new Vector(0,-50,33),
			"rotation" : new Vector(),
			"turnStrength" : 0.25,
			"scream" : false
		};
		this.trackChest = {
			"position" : new Vector(x,y),
			"scale" : 1.0,
			"rotation" : 0.0
		};
		this.trackBody = {
			"position" : new Vector(x,y),
			"rotation" : 0.0
		};
		this.trackUpperRightArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(-36,-20,-12),
			"rotation" : new Vector(0,0,0)
		};
		this.trackLowerRightArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(-36,-20,-12),
			"rotation" : 0.0
		};
		this.trackUpperLeftArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(36,-20,-12),
			"rotation" : new Vector(0,0,0)
		};
		this.trackLowerLeftArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(36,-20,-12),
			"rotation" : 0.0
		};
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		this.addModule( mod_boss );
		
		ops = ops || new Options();
		
		if("trigger" in ops){
			this._tid = ops["trigger"];
		}
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.gravity = 0.5;
		this.mass = 5.0;
		
		this.baseLife0 = Spawn.life(24,this.difficulty);
		this.baseLife1 = Spawn.life(32,this.difficulty);
		this.baseLife2 = Spawn.life(64,this.difficulty);
		this.lifeMax = this.life = this.baseLife0;
		this.baseDamage = Spawn.damage(6,this.difficulty);
		
		this.defenceLight = Spawn.defence(6,this.difficulty);
		
		this.moneyDrop = Spawn.money(40,this.difficulty);
		this.death_time = Game.DELTASECOND * 3;
		
		this.hurt = function(obj, damage){
			//Override hurt function to prevent death
			if(this.states.phase < 2 && this.calcDamage(damage) >= this.life){
				this.life = 1;
				this.trigger("hurt",obj, 0);
				obj.trigger("hurt_other",this,0);
				this.invincible = this.invincible_time;
				if(this.states.current != Garmr.STATE_TRANSFORM){
					this.setState(Garmr.STATE_TRANSFORM);
				}
			} else {
				Combat.hurt.apply(this,[obj,damage]);
			}
		}
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
			
			this.states.jump = true;
			
			if(this.states.current == Garmr.STATE_IDLE){
				this.states.time -= Game.DELTASECOND * 0.75;
			}
			
			/*
			if(this.states.current == Garmr.STATE_BOLT && obj instanceof Player){
				if(this.states.time < this.states.timeTotal * 0.7){
					let d = this.getDamage(0);
					d.light = Math.ceil(this.damage * 0.6);
					obj.hurt(this, d);
				}
			}
			*/
		});
		this.on("hitWithRay", function(obj){
			if(obj instanceof Player){
				let d = this.getDamage(0);
				d.light = Math.ceil(this.damage);
				obj.hurt(this, d);
			}
		});
		this.on("activate", function(){
			this.blocks = Trigger.getTargets("garmr_block");
		});
		this.on("death", function(){
			
			//TODO: Remove this
			let item = new Item(this.boss_starting_position.x, this.boss_starting_position.y);
			item.setName("dodgeflash");
			game.addObject(item);
			
			audio.play("kill");
			
			Item.drop(this,140);
			this.effects.fireEffect.destroy();
			this.destroy();
		});
		this.on("collideHorizontal",function(h){
			this.states.wall = 0.7;
		});
		this.on("downstabbed",function(obj,damage){
			if(this.states.current != Garmr.STATE_PUNCH){
				//this.setState(Garmr.STATE_PUNCH);
			}
		});
		this.on(["pre_death","player_death"],function(){
			//var bullets = game.getObjects(HomingBullet);
			var towers = game.getObjects(FlameTower);
			this.removeTracker();
			
			//for(var i=0; i < bullets.length;i++){
			//	bullets[i].destroy();
			//}
			for(var i=0; i < towers.length;i++){
				towers[i].destroy();
			}
			//for(var i=0; i < this.enemies.length;i++){
			//	this.enemies[i].destroy();
			//}
		});
		
		this.states = {
			"phase" : 0,
			"animation" : 0,
			"current" : Garmr.STATE_IDLE,
			"previous" : -1,
			"time" : 0.0,
			"timeTotal" :Game.DELTASECOND * 2,
			"count" : 0,
			"transition" : 0.0,
			"turnabout" : 0.0,
			"dropFireTime" : 0.0,
			"dropFireCount" : 0,
			"blocks" : 0.0,
			
			"jump" : false,
			"wall" : 0.0,
		};
		
		this.effects = {
			"lightning" : false,
			"lightingSeed" : "0.1fasf2",
			"firehands" : false,
			"fireEffect" : ParticleSystem.fire(x,y,16)
		}
		
		this.blocks = new Array();
		
		this.effects.fireEffect.destroyOnSleep = false;
		this.effects.fireEffect.autodestroy = false;
		this.effects.fireEffect.zIndex = 5;
		this.boltDischargeTime = Game.DELTASECOND * 1.5;
		this._boltDischarge = this.boltDischargeTime;
		this.setPhase(0);
		
		this.combat_getHitAreas = function(){
			if(this.states.phase < 2){
				return this.swrap.getHitBoxes(this.frame, this);
			} else {
				let output = new Array();
				//body
				output.push(new Line(this.position.x-40,this.position.y-48,this.position.x+40,this.position.y+24));
				
				//Right arm
				let xarmr = Math.cos(this.trackBody.rotation) * this.trackUpperRightArm.offset.x + Math.sin(this.trackBody.rotation) * this.trackUpperRightArm.offset.z;
				output.push( new Line(this.position.x + xarmr - 16, this.position.y - 32, this.position.x + xarmr + 16, this.position.y + 0) );
				
				//Left arm
				let xarml = Math.cos(this.trackBody.rotation) * this.trackUpperLeftArm.offset.x + Math.sin(this.trackBody.rotation) * this.trackUpperLeftArm.offset.z;
				output.push( new Line(this.position.x + xarml - 16, this.position.y - 32, this.position.x + xarml + 16, this.position.y + 0) );
				
				return output;
			}
		}
	}
	
	setPhase(p){
		if(p == 0){
			this.rigidbodyActive = true;
			this.swrap = this.swrap1;
			this.width = 24;
			this.height = 30;
			this.damage = Math.floor(this.baseDamage * 0.5);
			this.lifeMax = this.life = this.baseLife0;
		} else if(p == 1){
			this.swrap = this.swrap2;
			this.rigidbodyActive = true;
			this.width = 32;
			this.height = 64;
			this.damage = Math.floor(this.baseDamage * 0.75);
			this.lifeMax = this.life = this.baseLife1;
		} else {
			this.rigidbodyActive = false;
			this.width = 48;
			this.height = 48;
			this.damage = Math.floor(this.baseDamage * 1.0);
			this.lifeMax = this.life = this.baseLife2;
		}
		
		this.states.phase = p;
	}
	
	nextState(){
		let list = new Array();
		
		if(this.states.phase < 2){
			list.push(Garmr.STATE_FIREFLOOR);
			list.push(Garmr.STATE_BOLTARRAY);
		} else {
			list.push(Garmr.STATE_PUNCH);
			list.push(Garmr.STATE_FIREBEAM);
			list.push(Garmr.STATE_LIGHTNING);
			list.push(Garmr.STATE_BOLTARRAY);
			list.push(Garmr.STATE_FIREFLOOR);
		}
		if(list.indexOf(this.states.previous) >= 0){
			list.remove(list.indexOf(this.states.previous));
		}
		if(this.states.blocks > 0){
			list.remove(list.indexOf(Garmr.STATE_FIREBEAM));
		}
		if(list.length > 0){
			let index = Math.floor(Math.random()*list.length);
			this.states.previous = list[index];
			this.setState(list[index]);
		} else {
			this.states.previous = Garmr.STATE_IDLE;
			this.setState(Garmr.STATE_IDLE);
		}
	}
	
	setState(s=0){
		this.states.current = s;
		if(s == Garmr.STATE_IDLE){
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.5;
		} else if(s == Garmr.STATE_PUNCH) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.5;
			this.states.count = 1;
		} else if(s == Garmr.STATE_FIREBEAM) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 3.5;
		} else if(s == Garmr.STATE_LIGHTNING) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 5;
		} else if(s == Garmr.STATE_BOLTARRAY) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 0.65;
			this.states.count = 4;
			if(this.states.phase == 0){ this.states.count = 1; }
			if(this.states.phase == 1){ this.states.count = 2; }
		} else if(s == Garmr.STATE_FIREFLOOR) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.0;
			this.states.count = 1;
			
			if(this.states.phase == 0){ 
				this.states.time = this.states.timeTotal = Game.DELTASECOND * 1.0;
			} else {
				this.effects.fireEffect.loop = true;
				this.effects.fireEffect.sizeStart = 2.66667;
				this.effects.fireEffect.reset();
			}
		} else if(s == Garmr.STATE_FIRESKY) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 4.0;
			this.states.count = 3;
			
			this.effects.fireEffect.position = this.position.scale(1);
			this.effects.fireEffect.loop = true;
			this.effects.fireEffect.sizeStart = 4;
			this.effects.fireEffect.reset();
			
		} else if(s == Garmr.STATE_POSE) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 3.0;
		} else if(s == Garmr.STATE_TRANSFORM) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.0;
		}
	}
	
	blockHit(){
		this.blocks.sort(function(){return Math.random()-0.5;});
		this.states.blocks = Garmr.BLOCK_RAISE_TIME;
		let xpos = 0.0;
		let xrange = 400;
		
		for(let i=0; i < this.blocks.length; i++){
			//Set block positions
			let cblock = this.blocks[i];
			
			let min = i > 0 ? (cblock.width + 16) : 0;
			let max = (xrange-xpos) / Math.max(this.blocks.length-i,1);
			let ran = Math.randomRange(min, max);
			
			cblock.position.x = this.boss_starting_position.x + xpos + ran - 200;
			xpos += ran;
		}
		
	}
	
	discharge (force){
		//Create a floating bolt
		this._boltDischarge += this.boltDischargeTime;
		let bolt = new GarmrBolt(this.position.x, this.position.y);
		if(force == undefined){
			force = new Point(Math.random()-0.5, Math.random()-0.5).normalize(4.5);
		}
		
		bolt.force = force;
		bolt.damage = 0.0;
		bolt.damageLight = Math.floor(this.damage * 0.6);
		game.addObject(bolt);
		this.track(bolt);
	
	}
	
	update(){
		this.effects.lightning = false;
		this.effects.fireEffect.loop = false;
		
		//return;
		if(this.life > 0 && this.active){
			
			this.states.time -= this.delta;
			this.states.turnabout -= this.delta;
			
			let v = (game.timeScaled * 0.025) % 1;
			let p = 1 - this.states.time / this.states.timeTotal;
			
			let dir = this.position.subtract(this.target().position);
			
			this.trackRay.isOn = false;
			
			this.states.blocks = Math.max(this.states.blocks-this.delta, 0);
			let blockp = this.states.blocks / Garmr.BLOCK_RAISE_TIME;
			for(let i=0; i < this.blocks.length; i++){
				//Set block positions
				let cblock = this.blocks[i];
				let blockdown = this.boss_starting_position.y + 80;
				let blockup = blockdown - cblock.height;
				cblock.position.y = Math.lerp(blockdown, blockup, Math.clamp01(Math.pingpong(blockp)*8));
			}
			
			if(this.states.dropFireCount > 0){
				this.states.dropFireTime -= this.delta;
				if(this.states.dropFireTime <= 0){
					let fire = new Fire(
						this.boss_starting_position.x + Math.randomRange(-200,200),
						this.boss_starting_position.y - 120
					);
					fire.life = Game.DELTASECOND * Math.randomRange(3,6);
					this.states.dropFireCount--;
					game.addObject(fire);
					this.track(fire);
					this.states.dropFireTime += Game.DELTASECOND * 0.4;
				}
			}
			
			////////////
			// STATES //
			////////////
			
			if(this.states.current == Garmr.STATE_IDLE){
				
				if(this.states.phase == 0 ){
					this.frame = this.swrap.frame("idle", (game.timeScaled*1.6) % 1);
					
					if(this.states.wall > 0){
						//Hang off the wall and jump
						this.states.wall -= this.delta;
						this.force.y = -this.gravity * UNITS_PER_METER * this.delta;
						this.flip = this.position.x > this.boss_starting_position.x;
						this.frame = this.swrap.frame("jump", 0);
						
						if(this.states.wall <= 0){
							//Jump off the wall
							this.force.y = -10;
							this.force.x = this.forward() * this.speed * 4;
						}
					} else if(!this.grounded){
						//In the air
						this.addHorizontalForce(this.forward() * this.speed * 4);
					} else if(this.grounded && this.states.jump){
						//leap into the air
						this.flip = this.position.x < this.target().position.x;
						this.force.y = -10;
						this.force.x = this.forward() * this.speed * 4;
						this.states.jump = false;
						this.frame = this.swrap.frame("jump", 0);
					} else if((this.flip && this.position.x < this.boss_starting_position.x-180) || (!this.flip && this.position.x > this.boss_starting_position.x+180)){
						//Turn around
						this.flip = !this.flip;
					} else {
						//Just run
						this.frame = this.swrap.frame("run", (game.timeScaled*1.6) % 1);
						this.addHorizontalForce(this.forward() * this.speed * 4);
						if(this.states.time <= 0){ this.nextState(); }
					}
					
				} else if(this.states.phase == 1 ){
					this.flip = dir.x > 0;
					this.addHorizontalForce(this.forward() * this.speed);
					this.frame = this.swrap.frame("walk", (game.timeScaled*1.4) % 1);
					
					if(this.states.time <= 0){ this.nextState(); }
				} else {
					this.states.animation = 0;
					this.animate(v);
					
					//Track the player
					this.gotoPos.xy = this.target().position.add(new Point(this.forward()*-76,-56));
					this.gotoPos.z = this.speed;
					
					if(Math.abs(this.position.x - this.start.x) > 160){
						this.states.turnabout = Game.DELTASECOND;
					}
					
					if(this.states.turnabout > 0){
						this.flip = this.position.x < this.start.x;
					} else {
						this.flip = dir.x > 0;
					}
					
					if(this.states.time <= 0){ this.nextState(); }
				}
				
			} else if(this.states.current == Garmr.STATE_BOLTARRAY){
				//Fire one after the other, ricocheting bolts
				
				this.flip = dir.x > 0;
				this.states.animation = 9 + (this.states.count % 2);
				this.gotoPos.x = this.boss_starting_position.x + this.forward() * - 128;
				this.animate(p);
				
				if(this.states.phase == 0){
					this.frame = this.swrap.frame("bolt", p);
				} else {
					this.frame = this.swrap.frame("bolt" + (1 + this.states.count % 2), p);
				}
				
				if(this.states.time <= 0){
					if(this.states.count > 0 ){
						//Fire Bolt
						this.discharge(dir.normalize(-8));
						this.states.count--;
						this.states.time = this.states.timeTotal;
						//this.gotoPos.x = Math.clamp(this.position.x + this.forward() * -24, this.boss_starting_position.x-200, this.boss_starting_position.x+200);
						this.gotoPos.z = this.speed * 0.25;
					} else {
						this.setState(Garmr.STATE_IDLE);
					}
				}
			} else if(this.states.current == Garmr.STATE_PUNCH){
				//Punch
				if(p < 0.55){
					this.gotoPos.x = this.boss_starting_position.x + this.forward() * 128;
					this.gotoPos.y = this.boss_starting_position.y - 32;
					this.gotoPos.z = this.speed * 2;
					//this.flip = dir.x > 0;
					
					this.states.animation = 2;
					this.animate(p*3);
					
				} else if(p < 1){
					//this.strike(this.fistRect(16));
					this.gotoPos.x = this.boss_starting_position.x + this.forward() * 144;
					this.gotoPos.z = this.speed * 6;
					
					this.states.animation = 3;
					this.animate(p*8);
					
					if( this.states.count > 0){
						shakeCamera(0.25,3);
						this.blockHit();
						this.states.count = 0;
					}
				} else {
					this.setState(Garmr.STATE_IDLE);
				}
				
			} else if(this.states.current == Garmr.STATE_FIREBEAM){
				//Beam
				if(p < 0.33){
					//Charging
					this.gotoPos.xy = this.boss_starting_position.add(new Point(0,-32));
					this.gotoPos.z = this.speed;
				
					this.states.animation = 4;
					this.animate(p*3);
				} else if(p < 1){
					this.gotoPos.xy = this.boss_starting_position.add(new Point(this.forward()*-96,0));
					this.gotoPos.z = this.speed * 0.25;
					
					let p2 = (p-0.33) * 2;
					this.trackRay.isOn = true;
					this.trackRay.length = 250 * Math.clamp01(p2*5);
					this.states.animation = 5;
					this.animate(p2*1.5);
					this.trackRay.rotation = Math.lerp(-20,60,p2);
				} else {
					this.setState(Garmr.STATE_IDLE);
				}
			} else if(this.states.current == Garmr.STATE_LIGHTNING){
				//Drop lightning bolts
				this.gotoPos.xy = this.start.add(new Point(0,-32));
				this.gotoPos.z = this.speed;
				this.effects.lightning = true;
				
				let lightRad = Math.clamp01(Math.pingpong(p) * 5) * 600;
				Background.pushLight(this.position, lightRad, COLOR_LIGHTNING);
				
				if(Timer.interval(this.states.time,Game.DELTASECOND*0.125,this.delta)){
					this.effects.lightingSeed = ""+Math.random();
				}
				
				if(Timer.interval(this.states.time,Game.DELTASECOND*0.5,this.delta)){
					let off = (Math.random()-0.5) * 470;
					let l = new LightningBolt(this.position.x+off, this.position.y-40);
					game.addObject(l);
					this.track(l);
				}
				this.states.animation = 6;
				this.animate(p*8);
				
				if( p >= 1 ) {
					this.setState(Garmr.STATE_IDLE);
				}
			} else if(this.states.current == Garmr.STATE_FIREFLOOR){
				//Punch floor, cause fire
				this.gotoPos.z = this.speed * 2.5;
				this.flip = dir.x > 0;
				
				if(this.states.phase > 0){
					this.effects.fireEffect.loop = true;
				}
				
				this.frame = this.swrap.frame("fist", p);
				
				if(p < 0.4){
					this.gotoPos.x = this.boss_starting_position.x + this.forward() * -64;
					this.gotoPos.y = this.boss_starting_position.y + 0;
					this.states.animation = 11;
					this.animate(p*5);
				} else if(p < 1){
					this.gotoPos.x = this.boss_starting_position.x + this.forward() * -24;
					this.gotoPos.y = this.boss_starting_position.y + 48;
					this.states.animation = 12;
					this.animate((p-0.5)*3);
					
					if(p > 0.5 && this.states.count > 0 && this.states.phase > 0){
						shakeCamera(0.25,3);
						
						let s = new FlameTower(this.position.x + 64*this.forward(), this.boss_starting_position.y+48);
						s.spread = 7;
						s.spreadDirection = this.forward();
						game.addObject(s);
						this.track(s);
						
						this.states.count = 0;
					}
				} else {
					this.setState(Garmr.STATE_IDLE);
				}
			} else if(this.states.current == Garmr.STATE_FIRESKY){
				this.gotoPos.x = this.boss_starting_position.x + this.forward() * -64;
				this.gotoPos.y = this.boss_starting_position.y + -48;
				
				if(p < 0.33){
					this.states.animation = 7;
					this.animate(p*5);
				} else if(p < 1){
					this.effects.fireEffect.loop = true;
					this.states.animation = 8;
					this.animate((p-0.5)*3);
				} else {
					this.states.dropFireCount = 16;
					this.setState(Garmr.STATE_IDLE);
				}
			} else if(this.states.current == Garmr.STATE_POSE){
				this.frame = this.swrap.frame("pose", p);
				if(p >= 1){
					this.setState(Garmr.STATE_IDLE);
				}
			} else if(this.states.current == Garmr.STATE_TRANSFORM){
				this.frame = this.swrap.frame("transform", (game.timeScaled*4) % 1);
				if(p >= 1){
					this.setPhase(this.states.phase+1);
					if(this.states.phase == 1){
						this.setState(Garmr.STATE_POSE);
					} else {
						this.setState(Garmr.STATE_IDLE);
					}
				}
			}
			
			if(!this.rigidbodyActive){
				//Can fly
				if(this.gotoPos.z > 0){
					let _s = this.gotoPos.z * this.delta;
					if(Math.abs(this.position.x - this.gotoPos.x) >= _s){
						this.force.x = this.gotoPos.z * (this.gotoPos.x > this.position.x ? 1 : -1);
					}
					if(Math.abs(this.position.y - this.gotoPos.y) >= _s){
						this.force.y = this.gotoPos.z * (this.gotoPos.y > this.position.y ? 1 : -1);
					}
				}
				this.position = this.position.add( this.force.scale( this.delta * UNITS_PER_METER ) );
				this.force = this.force.scale( 1 - (this.friction * this.delta * UNITS_PER_METER ) );
			}
			
			//Detect if laser is hitting the player
			if(this.trackRay.isOn){
				let r = this.flip ? 180 - this.trackRay.rotation : this.trackRay.rotation;
				let rayPos = this.position.add(this.trackRay.position.flip(this.flip));
				let laserHitbox = new Line(
					rayPos,
					rayPos.add(new Point(this.trackRay.length,24))
				).toPolygon().rotate(r, rayPos);
				
				if(laserHitbox.intersects(_player.hitbox())){
					this.trigger("hitWithRay",_player)
				}
			}
		} else {
			//Dying!!
		}
		
	}
	
	track(obj){
		for(let i=0; i < this.objectTracker.length; i++){
			if(!this.objectTracker[i]._isAdded){
				this.objectTracker.remove(i);
				i--;
			}
		}
		this.objectTracker.push(obj);
	}
	removeTracker(){
		for(let i=0; i < this.objectTracker.length; i++){
			this.objectTracker[i].destroy();
		}
		for(let i=0; i < this.blocks.length; i++){
			this.blocks[i].destroy();
		}
		this.objectTracker = new Array();
	}
	
	fistRect(radius=1){
		return new Line(
			this.fistPos.add(new Point(-1,-1).scale(radius)),
			this.fistPos.add(new Point(1,1).scale(radius))
		);
	}
	
	idle(){}
	
	animate(progress){
		//let progress = (game.timeScaled * 0.025) % 1;
		progress = Math.clamp01(progress);
		let flipLimbsOnFlip = false;
		
		this.trackHead.scream = false;
		this.trackHead.turnStrength = 0.25;
		this.trackHead.offset = new Vector(0,-50,33);
		this.trackChest.scale = 1;
		
		if(this.states.animation == 0){
			//Idle
			let p = Math.sin(progress * Math.PI * 2);
			this.trackHead.rotation.x = 0.0;
			this.trackChest.scale = 1 + Math.sin(game.timeScaled * 1.5) * 0.03125;
			
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(2.40,0.78,0), p);
			this.trackLowerRightArm.rotation = Math.lerp(0.65,0.55, p);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.40,-0.78,0), p);
			this.trackLowerLeftArm.rotation = Math.lerp(0.65,0.55, p);
			
		} else if(this.states.animation == 1){
			//Build up charge
			this.trackHead.turnStrength = 0.0;
			this.trackChest.scale = Math.lerp(1,1.15,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-60,23), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.30,0), new Vector(2.8,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.65,0.1, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.3,0), new Vector(2.8,-0.30,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.65,0.1, progress);
		} else if(this.states.animation == 2){
			//Punch wall
			flipLimbsOnFlip = true;
			this.trackHead.turnStrength = 0.2;
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(3.0,0.0,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.64,0, progress);
			
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(1.35,-0.78,0), new Vector(1.9,0,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.64,0.0, progress);
			
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 3){
			//Punch wall release
			flipLimbsOnFlip = true;
			this.trackHead.turnStrength = 0.22;
			
			this.trackUpperLeftArm.rotation = new Vector(0, 0.0, 0);
			this.trackLowerLeftArm.rotation = 0.0;
			
			this.trackUpperRightArm.rotation = new Vector(3, 0, 0);
			this.trackLowerRightArm.rotation = 1.0;
			
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 4){
			//Fire charge
			this.trackChest.scale = Math.lerp(1,1.15,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-60,23), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.30,0), new Vector(2.8,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.65,0.1, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.3,0), new Vector(2.8,-0.30,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.65,0.1, progress);
		} else if(this.states.animation == 5){
			//Fire release
			this.trackHead.scream = true;
			this.trackChest.scale = Math.lerp(1.15,0.91,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-60,23), new Vector(0,-50,44), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.8,0.30,0), new Vector(2.35,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.1,1.6, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.8,-0.3,0), new Vector(2.35,-0.30,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.1,1.6, progress);
		} else if(this.states.animation == 6){
			//Bolt ready
			this.trackHead.scream = progress > 0.6;
			this.trackHead.turnStrength = Math.lerp(0.25,0.05,progress);
			this.trackChest.scale = Math.lerp(1.0,1.0,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-55,10), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(-1.5,0.3,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.64,-1.40, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.35,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.64,0.2, progress);
		} else if(this.states.animation == 7){
			//build fire
			this.trackHead.turnStrength = 0.25;
			this.trackHead.scream = true;
			this.trackHead.rotation.x = Math.lerp(0.0,-0.7,progress);
			this.trackChest.scale = Math.lerp(1.0,1.25,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-55,10), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(2.3,0.75,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.64,0.1, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.3,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.64,0.1, progress);
		} else if(this.states.animation == 8){
			//spit fire
			this.trackHead.turnStrength = 0.25;
			this.trackHead.scream = true;
			this.trackHead.rotation.x = -0.7;
			this.trackChest.scale = Math.lerp(1.25,0.93,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-55,10), new Vector(0,-40,45), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.3,0.78,0), new Vector(2.8,0.7,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.1,0.75, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.3,-0.78,0), new Vector(2.8,-0.7,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.1,1.2, progress);
			
			this.effects.fireEffect.position = this.position.add(new Point(this.forward()*48,-56));
			this.effects.fireEffect.startForce = new Line(this.forward()*4,-4,this.forward()*4,-4);
		} else if(this.states.animation == 9){
			//Release bolt 1
			this.trackHead.turnStrength = this.flip ? 0.24 : 0.16;
			let deltaSpeed = this.delta * 8;
			
			this.trackUpperRightArm.rotation = Vector.lerp(this.trackUpperRightArm.rotation, new Vector(3, 0, 0), deltaSpeed);
			this.trackLowerRightArm.rotation = Math.lerp(this.trackLowerRightArm.rotation, 1.0, deltaSpeed);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(this.trackUpperLeftArm.rotation, new Vector(0, 0, 0), deltaSpeed);
			this.trackLowerLeftArm.rotation = Math.lerp(this.trackLowerLeftArm.rotation, 0.0, deltaSpeed);
			
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 10){
			//Release bolt 2
			this.trackHead.turnStrength = this.flip ? 0.16 : 0.32;
			let deltaSpeed = this.delta * 8;
			
			this.trackUpperRightArm.rotation = Vector.lerp(this.trackUpperRightArm.rotation, new Vector(0, 0, 0), deltaSpeed);
			this.trackLowerRightArm.rotation = Math.lerp(this.trackLowerRightArm.rotation, 0.0, deltaSpeed);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(this.trackUpperLeftArm.rotation, new Vector(3, 0, 0), deltaSpeed);
			this.trackLowerLeftArm.rotation = Math.lerp(this.trackLowerLeftArm.rotation, 1.0, deltaSpeed);
			
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 11){
			//Punch floor wind up
			let deltaSpeed = this.delta * 4;
			
			this.trackUpperRightArm.rotation = Vector.lerp(this.trackUpperRightArm.rotation, new Vector(-2.4, -0.5, 0.0), deltaSpeed);
			this.trackLowerRightArm.rotation = Math.lerp(this.trackLowerRightArm.rotation, -3.0, deltaSpeed);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(this.trackUpperLeftArm.rotation, new Vector(-2.4, 0.5, 0), deltaSpeed);
			this.trackLowerLeftArm.rotation = Math.lerp(this.trackLowerLeftArm.rotation, -3.0, deltaSpeed);
			
			this.effects.fireEffect.position = Point.lerp(new Point(88,24), new Point(-32,-64), progress).scale(this.forward(),1).add(this.position);
			this.effects.fireEffect.startForce = new Line(-1,-1,1,-1);
			
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 12){
			//Punch floor release
			let deltaSpeed = this.delta * 24;
			
			this.trackUpperRightArm.rotation = Vector.lerp(this.trackUpperRightArm.rotation, new Vector(0.75, 0.0, 0.0), deltaSpeed);
			this.trackLowerRightArm.rotation = Math.lerp(this.trackLowerRightArm.rotation, 0.0, deltaSpeed);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(this.trackUpperLeftArm.rotation, new Vector(0.75, 0.0, 0), deltaSpeed);
			this.trackLowerLeftArm.rotation = Math.lerp(this.trackLowerLeftArm.rotation, 0.0, deltaSpeed);
			
			this.effects.fireEffect.position = Point.lerp(new Point(-32,-64), new Point(88,24), progress).scale(this.forward(),1).add(this.position);
			this.effects.fireEffect.startForce = new Line(-1,-1,1,-1);
			
			//this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		}
		
		if(this.flip && flipLimbsOnFlip){
			let up = this.trackUpperRightArm.rotation.scale(1);
			let low = this.trackLowerRightArm.rotation;
			
			this.trackUpperRightArm.rotation = this.trackUpperLeftArm.rotation;
			this.trackLowerRightArm.rotation = this.trackLowerLeftArm.rotation;
			
			this.trackUpperLeftArm.rotation = up;
			this.trackLowerLeftArm.rotation = low;
		}
	}
	
	render(g,c){
		
		if(this.effects.lightning){
			LightningBolt.renderBolt(g,c,this.position,this.boss_starting_position.add(new Point(0,-256)),this.effects.lightingSeed);
		}
		
		//White Laser
		if(this.trackRay.isOn){
			let r = this.flip ? 180 - this.trackRay.rotation : this.trackRay.rotation;
			g.renderSprite("white",this.position.add(this.trackRay.position.flip(this.flip)).subtract(c),this.zIndex,new Point(),false,{
				"scalex":this.trackRay.length,
				"scaley":24,
				"rotate":r
			});
		} else if(this.states.current == Garmr.STATE_FIREBEAM){
			let p = 1 - this.states.time / this.states.timeTotal;
			let l = Math.lerp(Math.lerp(0,88,p*2), 0, p*2);
			let s = new Seed("skjnafdjn");
			for(let i=0; i<16;i++){
				let r = s.random() * 80 + Math.lerp(64,16,p*2);
				let a = Math.lerp(-0.8,0.8,i/16);
				a = this.flip ? Math.PI - a : a;
				let _c = Math.cos(a); 
				let _s = Math.sin(a);
				g.renderLine(
					new Point(_c,_s).scale(r).add(this.position.add(this.trackRay.position.flip(this.flip)).subtract(c)),
					new Point(_c,_s).scale(r+l).add(this.position.add(this.trackRay.position.flip(this.flip)).subtract(c)),
					1,
					[1,1,1,0.9]
				);
			}
		}
		
		if(this.states.phase == 0){
			g.renderSprite("garmr_small", this.position.subtract(c), this.zIndex, this.frame, this.flip);
		} else if(this.states.phase == 1){
			g.renderSprite("garmr_large", this.position.subtract(c), this.zIndex, this.frame, this.flip);
		} else {
			//Render 3D model for phase 2
		
			this.trackHead.rotation.y = Math.lerp(this.trackHead.rotation.y, Math.PI * this.forward() * this.trackHead.turnStrength, this.delta * 3.75);
			this.trackChest.rotation = Math.lerp(this.trackChest.rotation, this.trackHead.rotation.y, this.delta * 6.5);
			this.trackBody.rotation = Math.lerp(this.trackBody.rotation, this.trackChest.rotation, this.delta * 3.25);
			
			this.trackHead.position = new Vector(this.position.x, this.position.y, 0);
			this.trackChest.position = Vector.lerp(this.trackChest.position, this.position, this.delta * 12.0);
			this.trackBody.position = Vector.lerp(this.trackBody.position, this.trackChest.position, this.delta * 12.0);
			
			let offset = Vector.rotate(this.trackHead.offset,0,this.trackHead.rotation.y,0);
			let headModel = this.trackHead.scream ? "garmr_headscream" : "garmr_head";
			
			g.renderMesh(headModel, this.trackHead.position.add(offset).subtract(c), this.zIndex+3+0.001, {
				"rotate" : [this.trackHead.rotation.x, this.trackHead.rotation.y, 0]
			});
			g.renderMesh("garmr_chest", this.trackChest.position.subtract(c), this.zIndex+3, {
				"rotate" : [0, this.trackChest.rotation, 0],
				"scale" : [this.trackChest.scale,this.trackChest.scale,this.trackChest.scale]
			});
			g.renderMesh("garmr_body", this.trackBody.position.subtract(c), this.zIndex+2, {
				"rotate" : [0, this.trackBody.rotation, 0]
			});
			
			
			this.trackUpperRightArm.offset.y = Math.lerp(0,-40,this.trackChest.scale-0.5);
			
			offset = Vector.rotate(this.trackUpperRightArm.offset,0,this.trackChest.rotation,0);
			let rightArmZOff = this.trackChest.rotation * 0.1;
			g.renderMesh("garmr_armupper", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+rightArmZOff, {
				"rotate" : [
					this.trackUpperRightArm.rotation.x, 
					this.trackUpperRightArm.rotation.y + this.trackChest.rotation, 
					this.trackUpperRightArm.rotation.z
				]
			});
			offset = this.trackUpperRightArm.offset.add(new Matrix4x4().rotate(
				this.trackUpperRightArm.rotation.x, 
				this.trackUpperRightArm.rotation.y + this.trackChest.rotation, 
				this.trackUpperRightArm.rotation.z
			).apply(Garmr.lowerArmOffset));
			g.renderMesh("garmr_armlower", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+rightArmZOff, {
				"rotate" : [
					this.trackLowerRightArm.rotation, 
					this.trackChest.rotation, 
					this.trackUpperRightArm.rotation.y
				]
			});
			
			
			this.trackUpperLeftArm.offset.y = Math.lerp(0,-40,this.trackChest.scale-0.5);
			
			offset = Vector.rotate(this.trackUpperLeftArm.offset,0,this.trackChest.rotation,0);
			let leftArmZOff = this.trackChest.rotation * -0.1;
			g.renderMesh("garmr_armupper", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+leftArmZOff, {
				"flip" : true,
				"rotate" : [
					this.trackUpperLeftArm.rotation.x, 
					this.trackUpperLeftArm.rotation.y + this.trackChest.rotation, 
					this.trackUpperLeftArm.rotation.z
				]
			});
			offset = new Vector(36,-20,40).add(new Matrix4x4().rotate(
				this.trackUpperLeftArm.rotation.x, 
				this.trackUpperLeftArm.rotation.y + this.trackChest.rotation, 
				this.trackUpperLeftArm.rotation.z
			).apply(Garmr.lowerArmOffset));
			g.renderMesh("garmr_armlower", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+leftArmZOff, {
				"flip" : true,
				"rotate" : [
					this.trackLowerLeftArm.rotation, 
					this.trackChest.rotation, 
					this.trackUpperLeftArm.rotation.y
				]
			});
		}
		
		
	}
}
Garmr.lowerArmOffset = new Vector(0,0,40);
Garmr.STATE_IDLE = 0;
Garmr.STATE_PUNCH = 1;
Garmr.STATE_BOLTARRAY = 2;
Garmr.STATE_FIREBEAM = 3;
Garmr.STATE_LIGHTNING = 4;
Garmr.STATE_FIREFLOOR = 5;
Garmr.STATE_FIRESKY = 6;
Garmr.STATE_TRANSFORM = 7;
Garmr.STATE_POSE = 8;
Garmr.BLOCK_RAISE_TIME = Game.DELTASECOND * 6;
self["Garmr"] = Garmr;

class GarmrBolt extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 12;
		this.zIndex = 20;
		
		this.damage = 0;
		this.damageLight = 3;
		
		this.time = 8;
		this.addModule(mod_rigidbody);
		
		this.gravity = 0.0;
		this.bounce = 1.0;
		this.collisionReduction = -1.0;
		this.friction = this.friction_y = 0.0;
		this.pushable = false;
		
		this.tailSize = 8;
		this.tailTime = 0;
		this.tail = [];
		
		this.on("struck", function(){
			this.destroy();
		});
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				obj.hurt(this, Combat.getDamage.apply(this));
				this.destroy();
			}
		});
		this.on("sleep", function(){ this.destroy(); } );
	}
	update(){
		Background.pushLight(this.position, 64, COLOR_LIGHTNING);
		this.time -= this.delta;
		if(this.time <= 0){ 
			this.destroy(); 
		}
	}
	render(g,c){
		this.tailTime -= this.delta;
		if(this.tailTime <= 0){
			this.tail.push(this.position.scale(1));
			this.tailTime += GarmrBolt.TIME_TAILUPDATE;
		}
		if(this.tail.length > this.tailSize){
			this.tail.remove(0);
		}
		
		g.color = COLOR_LIGHTNING;
		for(let i=0; i < this.tail.length; i++){
			let curr = this.tail[i];
			let next = this.position;
			if((i+1)<this.tail.length) { next = this.tail[i+1]; }
			
			g.renderLine(
				curr.subtract(c),
				next.subtract(c),
				1, g.color
			);
		}
		
		Renderer.drawRect(
			this.position.x - (this.width * 0.5) - c.x,
			this.position.y - (this.height * 0.5) - c.y,
			this.width,
			this.height,
			this.zIndex
		);
		
	}
}
GarmrBolt.TIME_TAILUPDATE = 0.09375;