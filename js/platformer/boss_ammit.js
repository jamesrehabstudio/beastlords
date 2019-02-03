class Ammit extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "ammit";
		this.swrap = spriteWrap["ammit"];
		this.width = 32;
		this.height = 48;
		this.speed = 10.0;
		this.zIndex = -1;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		this.addModule(mod_boss);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.lifeMax = this.life = Spawn.life(24, this.difficulty);
		this.damage = Spawn.damage(3, this.difficulty);
		this.damageSlime = Spawn.damage(3, this.difficulty);
		this.moneyDrop = 0;
		this.xpDrop = Spawn.xp(35,this.difficulty);
		this.gravity = 0;
		
		this.defencePhysical = Spawn.defence(1, this.difficulty);
		this.defenceFire = Spawn.defence(-2, this.difficulty);
		this.defenceSlime = Spawn.defence(4, this.difficulty);
		
		this.mass = 5.0;
		this.death_time = Game.DELTASECOND * 7;
		
		this.sword = {
			visible : false,
			origin : new Point(),
			rotation : 0.0
		};
		
		var self = this;
		this.arms = new Array();
		for(let i=0; i < 8; i++){ 
			let arm = new AmmitArm(x,y);
			arm.on("collidePolygon", function(obj){
				self.trigger("arm_hit", obj);
			});
			game.addObject(arm);
			this.arms.push(arm); 
		}
		this.slimes = new Array();
		
		this._state = Ammit.STATE_IDLE;
		this._midTime = 0.0;
		this._midTimeMax = 1.0;
		this._counter = 0;
		this._counterMax = 0;
		this._timer = 0.0;
		this._timerMax = 3.0;
		this._hitCount = 0;
		this._goto = new Point();
		this._roomLight = null;
		this._death_origin_x = 0;
		
		this._particles = new ParticleSystem(
			this.position.x,
			this.position.y,
			[32,8],
			new Options({
				"loop" : true,
				"autodestroy" : false,
				"frame_x" : 5,
				"time" : 0.25,
				"sizeEnd" : 0.0,
				"startForce" : 8,
				"startForceRange" : new Line(-1,-2,1,-2)
			})
		);
		
		this.reset();
		
		
		this.on("hurt", function(){
			audio.play("hurt");
			
			if( this._state == Ammit.STATE_IDLE ) {
				//If hurt in idle, attack!
				this._timer = this._timerMax;
			} else if(
				this._state != Ammit.STATE_SWELL &&
				this._state != Ammit.STATE_HIDDEN && 
				this._state != Ammit.STATE_AIRBURST
			){
				//Hit too many times, escape
				let per = this._hitCount * 0.12;
				if( Math.random() < per ){
					if( Math.random() > 0.7 ) {
						this.setState(Ammit.STATE_SWELL);
					} else {
						this.setState(Ammit.STATE_HIDDEN);
					}
				}
			}
			
			this._hitCount++;
		});
		
		this.on("pre_death", function(){
			this.reset();
			this._death_origin_x = this.position.x;
			Trigger.activate("boss_drain");
		});
		this.on("death", function(){
			NPC.set("ammit", NPC.get("ammit")+1);
			audio.play("kill");
			
			Item.drop(this,65);
			this.destroy();
		});
		this.on("arm_hit", function(obj){
			if( obj.hasModule(mod_combat) && obj.team != this.team ){
				obj.hurt(this, this.getDamage());
			}
		});
		this.on("sword_hit", function(obj){
			if( obj.hasModule(mod_combat) && obj.team != this.team ){
				obj.hurt(this, this.getDamage(1.5));
			}
		});
		this.on("player_death", function(){
			this.reset();
		});
		this.on("activate", function(){
			try{
				this.gravity = 1.0;
				this._roomLight = Trigger.getTargets("boss_light")[0];
			} catch(e){}
		});
	}
	reset(){
		if(this._roomLight){ this._roomLight.turnOn(); }
		for(let i=0; i < this.arms.length; i++){ this.arms[i].deactivate(); }
		this.clearSlime();
		this.setState(Ammit.STATE_IDLE);
		this.gravity = 0;
		this.force = new Point();
	}
	setState(s){
		this._state = s;
		this._hitCount = 0;
		this._particles.loop = false;
		if(this._roomLight){ this._roomLight.turnOn(); }
		
		let life_d = Math.max(this.life / this.lifeMax, 0.35);
		
		if( this._state == Ammit.STATE_IDLE ) {
			this._timer = 0;
			this._timerMax = Math.randomRange(0.8,1.8) * life_d;
		} else if( this._state == Ammit.STATE_SPIKES ) {
			this._timer = 0;
			this._timerMax = 1;
			if(this.position.x < this.boss_starting_position.x){
				this._goto.x = this.boss_starting_position.x + 128;
			} else {
				this._goto.x = this.boss_starting_position.x - 128;
			}
		} else if( this._state == Ammit.STATE_SWELL ) {
			this._timer = 0;
			this._timerMax = 1.5;
			this._counterMax = this._counter = 6;
		} else if( this._state == Ammit.STATE_SING ) {
			if(this._roomLight){ this._roomLight.turnOff(); }
			this._timer = 0;
			this._timerMax = 3.0;
			this._counterMax = this._counter = 16;
			this._midTime = 1.2;
			this._midTimeMax = 0.8;
			this.flip = this.position.x > this.boss_starting_position.x;
		} else if( this._state == Ammit.STATE_AIRBURST ) {
			this._timer = 0;
			this._timerMax = 2;
			this._counterMax = this._counter = 16;
			this.force.x = this.force.y = 0;
		} else if( this._state == Ammit.STATE_JUMP ) {
			this._timer = 0;
			this._timerMax = 0.4;
			this._counterMax = this._counter = Math.random() > 0.5 ? 1 : 0;
		} else if( this._state == Ammit.STATE_HIDDEN ) {
			this._timer = 0;
			this._timerMax = 0.5;
			this._midTimeMax = this._midTime = Math.randomRange(2,5);
			this._goto = this.boss_starting_position.scale(1);
			this._goto.x += Math.randomRange(-120,120);
		} else if( this._state == Ammit.STATE_SWORD ) {
			this._timer = 0;
			this._timerMax = 3.0;
			this.flip = this.position.x > this.boss_starting_position.x;
		} else if( this._state == Ammit.STATE_ARMS ) {
			this._midTime = 0.0;
			this._midTimeMax = 0.6;
			this._timer = 0;
			this._timerMax = 1.5;
			this._counterMax = this._counter = 7;
		}
	}
	nextState(){
		let dis = this.position.subtract(this.boss_starting_position);
		let tdis = this.position.subtract(this.target().position);
		let tmid = this.boss_starting_position.subtract(this.target().position);
		
		if( Math.abs(dis) > 128 && Math.abs(tmid) > 128 ){
			//Don't corner the player
			this.setState(Ammit.STATE_HIDDEN);
			return;
		}
		
		let roll = Math.random();
		let rollMax = roll;
		let _s = Ammit.STATE_ARMS;
		
		
		if((roll = Math.random()) > rollMax) { rollMax = roll; _s = Ammit.STATE_JUMP; }
		if((roll = Math.random() * 0.9) > rollMax) { rollMax = roll; _s = Ammit.STATE_SING; }
		
		if( Math.abs(dis.x) > 32 ){
			if((roll = Math.random()) > rollMax) { rollMax = roll; _s = Ammit.STATE_SPIKES; }
		}
		
		if( Math.abs(dis.x) > 128 ){
			if((roll = Math.random() * 1.1) > rollMax) { rollMax = roll; _s = Ammit.STATE_SWORD; }
		}
		this.setState(_s);
		
	}
	update(){
		if(this.life > 0){
			if(this.active){
				
				let d = Math.clamp01(this._timer / this._timerMax);
				
				if( this._state == Ammit.STATE_SWORD ) {
					this.frame = this.swrap.frame("sword", d);
					this.trackSword(d);
					
					if(this._timer >= this._timerMax){
						this.setState(Ammit.STATE_IDLE);
					}
				} else if( this._state == Ammit.STATE_ARMS) {
					this.frame = this.swrap.frame("arm", d);
					
					//Can cancel into jump
					this.detectMissile();
					
					if(this._timer >= this._timerMax){
						//Attack with arms
						this._midTime -= this.delta;
						if(this._midTime <= 0 ){
							if( this._counter > 0 ){
								//Create new arm
								
								let arm = this.getInactiveArm();
								if( !arm.active ){
									let b = this.corners();
									let _x = this.boss_starting_position.x + Math.randomRange(-200,200);
									
									arm.position = new Point(_x, b.bottom);
									arm.rotation = Math.randomRange(45,135);
									arm.activate();
									
									if(this._counter == this._counterMax){
										//First arm rise to guard
										arm.position.x = this.position.x + this.forward() * 32;
										arm.rotation = this.flip ? 135 : 45;
									}
									if(this._counter == 1){
										//Last, attack an aggressive player
										arm.position.x = this.position.x + this.forward() * 72;
										arm.rotation = this.flip ? 45 : 135;
									}
									
									this._midTime = this._midTimeMax;
								}
								
								this._counter--;
							} else {
								//reset to idle
								this.setState(Ammit.STATE_IDLE);
							}
						}
					}
				} else if( this._state == Ammit.STATE_SING) {
					if( this._timer < this._timerMax){
						//Hide and move to singing spot
						if(this._timer < 0.5) {
							let _d = Math.clamp01(this._timer / 0.5);
							this.frame = this.swrap.frame("escape", _d);
						} else if(this._timer < this._timerMax - 0.5){
							this.flip = this.target().position.x < this.boss_starting_position.x;
							this.position.x = this.boss_starting_position.x + 160 * -this.forward();
						} else {
							let _d = 1 - Math.clamp01(Math.abs(this._timer - this._timerMax) / 0.5);
							this.frame = this.swrap.frame("return", _d);
							Background.pushLight(this.position, 256 * _d);
						}
					} else {
						Background.pushLight(this.position, 256);
						this.frame = this.swrap.frame("sing", Math.mod(game.time * 2.5, 1.0 ));
						
						//Can cancel into jump
						this.detectMissile();
						
						this._midTime -= this.delta;
						
						if( this._midTime <= 0){
							if( this._counter > 0){
								this._counter--;
								this._midTime = this._counter > 0 ? this._midTimeMax : 2.0;
								let range = (this._counter % 3 == 0) ? 64 : 200;
								
								//Create fan slime
								let pos = this.position.add( new Point(Math.randomRange(32,range) * this.forward(), 16 ) );
								
								if(this.forward() * (this.target().position.x - this.position.x) < 0) {
									//Target is behind boss
									pos.x = this.position.x + Math.randomRange(-128,-32) * this.forward();
								}
								
								let slime = this.createSlime(pos.x, pos.y);
								slime.setState(Slime.STATE_SINGING);
								slime.flip = slime.position.x > this.position.x;
								slime.moneyDrop = 0;
								slime.xpDrop = 0;
								game.addObject(slime);
								
							} else {
								this.setState(Ammit.STATE_IDLE);
							}
						}
					}
					
				} else if( this._state == Ammit.STATE_SWELL) {
					this.frame = this.swrap.frame("swell", Math.mod(game.time * 5, 1.0 ));
					
					if(this._timer >= this._timerMax ){
						if(this._counter > 0){
							this._counter--;
							//create slime
							let slime = this.createSlime(this.position.x, this.position.y);
							slime.force.x = Math.randomRange(-10,10);
							slime.force.y = Math.randomRange(-10,-4);
							slime.moneyDrop = 0;
							slime.xpDrop = 0;
							game.addObject(slime);
						} else {
							this.setState(Ammit.STATE_HIDDEN);
						}
					}
					
				} else if( this._state == Ammit.STATE_SPIKES) {
					this.frame = this.swrap.frame("spikes", d);
					this.flip = this.position.x > this._goto.x;
					if(d >= 1){
						this.addHorizontalForce(this.forward() * this.speed);
					}
					if(Math.abs(this.position.x - this._goto.x) < 8 ){
						this.setState(Ammit.STATE_IDLE);
					}
					
					//Can cancel into jump
					this.detectMissile();
				} else if( this._state == Ammit.STATE_HIDDEN) {
					if(d < 1 ){
						this.frame = this.swrap.frame("escape", d);
					} else {
						this._midTime -= this.delta;
						this.interactive = true;
						
						if(this._midTime <= 0){
							this.setState(Ammit.STATE_IDLE);
						} else if(this._midTime <= 0.5) {
							let _d = 1 - (this._midTime / 0.5);
							this.frame = this.swrap.frame("return", _d);
						} else {
							this.position.x = this._goto.x;
							this.frame = this.swrap.frame("escape", 1);
							this.interactive = false;
						}
					}
					if(this._midTime < 1.8) {
						if(!this._particles.loop){ 
							this._particles.loop = true;
							this._particles.reset();
						}
					}
					
				} else if( this._state == Ammit.STATE_AIRBURST) {
					this.frame = this.swrap.frame("air_swell", Math.clamp01(d*3));
					this.force.y = -this.gravity * this.delta * UNITS_PER_METER;
					
					if(this._timer >= this._timerMax){
						if(this._counter > 0){
							this._counter--;
							let a = Math.PI * 2.0 * (this._counter / 16.0);
							this.createBullet(a);
						} else {
							this.setState(Ammit.STATE_HIDDEN);
							this._timer = this._timerMax;
						}
					}
					
				} else if( this._state == Ammit.STATE_JUMP) {
					this.frame = this.swrap.frame("jump", d);
					
					if(d > 0.4 && d < 1 && this.grounded) {
						this.grounded = false;
						this.force.y = -8;
					} else if( !this.grounded ){
						this.addHorizontalForce(this.speed * this.forward());
						this.force.y -= 0.8 * UNITS_PER_METER * this.delta;
						
						if(this.force.y >= 0 && this._counter > 0){
							this.setState(Ammit.STATE_AIRBURST);
						}
					}
					
					if(this.grounded && d >= 1){
						this.setState(Ammit.STATE_IDLE);
					}
				} else {
					//Idle
					this.flip = this.position.x > this.target().position.x;
					this.frame = this.swrap.frame("idle", Math.mod(game.timeScaled * 2, 1.0));
					
					if( this._timer >= this._timerMax){
						this.nextState();
					}
					
					this.detectMissile();
				}
				
				this._timer += this.delta;
				this._particles.position = new Point(this.position.x, this.position.y + 24);
				this._particles.fullUpdate();
			} else {
				this.frame = this.swrap.frame("idle",0);
			}
		} else {
			let p = this._death_clock;
			this.damageContact = 0;
			this.pushable = false;
			this.interactive = true;
			this.force.x = 0;
			if(p > 1.5){
				let d = (p-1.5) / 5.5;
				let a = Math.sin(p * Math.PI);
				this.flip = a < 0;
				this.position.x = this._death_origin_x + a * d * 120;
				this.frame = this.swrap.frame("swell", Math.mod(game.time * 5, 1.0 ));
				this._death_origin_x = Math.lerp(this._death_origin_x, this.boss_starting_position.x, this.delta * 2);
			}
		}
	}
	idle(){}
	clearSlime(clearAll=true){
		let newSlimes = new Array();
		for(let i=0; i < this.slimes.length; i++){
			if( clearAll ){
				this.slimes[i].destroy();
			} else if(this.slimes[i]._isAdded){
				newSlimes.push(this.slimes[i]);
			}
		}
		this.slimes = newSlimes;
	}
	createSlime(x,y){
		//clean up
		this.clearSlime(false);	
		
		if( this.slimes.length >= 15) {
			//destroy a random slime
			let index = Math.floor(Math.random() * this.slimes.length);
			this.slimes[index].destroy();
		}
		
		let slime = new Slime(x, y, false, {"difficulty":this.difficulty});
		this.slimes.push(slime);
		return slime;
		
	}
	getInactiveArm(){
		for(let i=0; i < this.arms.length; i++){
			if(!this.arms[i].active){ return this.arms[i]; }
		}
		return this.arms[0];
	}
	trackSword(d){
		//Animate sword
		if(d < 0.35){
			let _d = (d - 0.0) / 0.35;
			this.sword.rotation = Math.lerp(-30, 0, _d);
			this.sword.origin = Point.lerp(new Point(-16,8), new Point(-16,0), _d);
		} else if( d < 0.75 ) {
			let _d = (d - 0.35) / 0.4;
			let _s = Math.clamp01(_d * 2.5);
			this.sword.rotation = Math.lerp(0, 20, _s);
			this.sword.origin = Point.lerp(new Point(-16,0), new Point(-32,-48), _s);
		} else {
			let _d = (d - 0.75) / 0.25;
			let _s = Math.clamp01(_d * 1.75);
			this.sword.rotation = Math.lerp(20, 180, _s);
			this.sword.origin = Point.lerp(new Point(-32,-48), new Point(32,32), _s);
		}
		
		//Calc sword hitbox
		let r = this.sword.rotation * this.forward();
		let org = this.sword.origin.scale( new Point(this.forward(),1) );
		let line = this.flip ? new Line(0,-16,160,0) : new Line(-160,0,0,16);
		let poly = line.toPolygon().rotate(r);
		
		poly.transpose(this.position);
		
		let hits = game.polyOverlaps(poly);
		for(let i=0; i < hits.length; i++){
			this.trigger("sword_hit", hits[i]);
		}
	}
	detectMissile(){
		let area = new Line(
			this.position.x - 80,
			this.position.y - this.height * 0.5,
			this.position.x + 80,
			this.position.y + this.height * 0.5,
		);
		let objs = game.overlaps(area);
		for(let i=0; i < objs.length; i++){
			let obj = objs[i];
			if( obj.team != this.team ){
				if(
					obj instanceof FireballSpell
				){
					this.setState(Ammit.STATE_JUMP);
					this.flip = obj.force.x > 0;
				}
			}
		}
	}
	createBullet(a){
		let bullet = new Bullet(this.position.x, this.position.y);
		bullet.width = bullet.height = 8;
		bullet.rotation = a * Math.rad2deg;
		bullet.force = Point.fromAngle(a, 5);
		bullet.team = this.team;
		bullet.sprite = this.sprite;
		bullet.frame = new Point(6,2);
		bullet.damage = this.damage;
		bullet.damageSlime = this.damageSlime;
		bullet.on("death", function(){ audio.play("splat1", this.position); });
		game.addObject(bullet);
	}
	objectpostrender(g,c){
		super.render(g,c);
	}
	render(g,c){
		//render sword
		if(this._state == Ammit.STATE_SWORD){
			let r = this.sword.rotation * this.forward();
			let a = -r * Math.deg2rad;
			let org = this.sword.origin.scale( new Point(this.forward(),1) );
			let top = org.add( new Point(Math.cos(a)*-95 * this.forward(), Math.sin(a)*95 * this.forward()) );
			
			//render bottom
			g.renderSprite(this.sprite, this.position.add(org).subtract(c), this.zIndex-1, new Point(3,3), this.flip, {"rotation":r} );
			
			//Render top
			g.renderSprite(this.sprite, this.position.add(top).subtract(c), this.zIndex-1, new Point(3,2), this.flip, {"rotation":r} );
		}
		
		if( this._particles.visible ){
			this._particles.render(g,c);
		}
	}
}
Ammit.STATE_IDLE = 0;
Ammit.STATE_SWORD = 1;
Ammit.STATE_ARMS = 2;
Ammit.STATE_JUMP = 3;
Ammit.STATE_AIRBURST = 4;
Ammit.STATE_HIDDEN = 5;
Ammit.STATE_SPIKES = 6;
Ammit.STATE_SING = 7;
Ammit.STATE_SWELL = 8;

self["Ammit"] = Ammit;

class AmmitArm extends GameObject{
	get range(){
		return Math.lerp(8,160, Math.clamp01(this._time * 2));
	}
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.origin = new Point(0.5,1.0);
		this.sprite = "ammit";
		this.frame = new Point(7,6);
		this.width = 160;
		this.height = 160;
		
		this.timeLimit = 4;
		this.rotation = 0.0;
		this._time = 0.0;
		this._range = 1.0;
		this._hurt = false;
		this.active = false;
		
		this._particles = new ParticleSystem(
			this.position.x,
			this.position.y,
			[8,8],
			new Options({
				"loop" : false,
				"frame_x" : 5,
				"time" : 0.25,
				"sizeEnd" : 0.0,
				"startForce" : 8,
				"startForceRange" : new Line(-1,-2,1,-2)
			})
		);
		
		this.on("struck", function(obj, area){
			if(this._time > 0 && this.active ){
				if(this.getPolygon(12).intersects(area.toPolygon())){
					this.trigger("hurt", obj);
				}
			}
		});
		this.on("hurt", function(obj){
			if(!this._hurt){
				obj.trigger("hurt_other", this, 0);
				audio.play("hurt", this.position);
				this._hurt = true;
			}
		});
		
		this.on("collideObject", function(obj){
			if(this._time > 0 && this.active && !this._hurt){
				let obj_hit = obj.hitbox();
				if(this.getPolygon().intersects(obj_hit)){
					this.trigger("collidePolygon", obj);
				}
			}
		});
	}
	getPolygon(thickness=8){
		let t = thickness * 0.5;
		let poly = new Line(0,-t,this.range,t).toPolygon().rotate(-this.rotation);
		poly.transpose(this.position);
		return poly;
	}
	idle(){}
	update(){
		this.tint = COLOR_WHITE;
		if(this.active){
			this._particles.fullUpdate();
			this._particles.position = this.position.scale(1);
			this._particles.loop = this._time < 0;
			
			if( this._hurt ){
				this.tint = COLOR_HURT;
				this._time = Math.min(this._time - this.delta * 2.0, 0.5);
				if(this._time <= 0){
					this.deactivate();
				}
			} else {
				this._time += this.delta;
				
				if( this._time >= this.timeLimit){
					this.deactivate();
				}
			}
		}
	}
	activate(){
		this._time = -0.75;
		this.active = true;
		this._hurt = false;
	}
	deactivate(){
		this._time = -2;
		this.active = false;
		this._hurt = false;
	}
	renderDebug(g,c){}
	render(g,c){
		if(this.active){
			if(this._time > 0){
				//Attack
				let r = -this.rotation;
				let a = r * Math.deg2rad;
				let scalex = this.range / 96;
				let offset = new Point(Math.cos(a), Math.sin(a) ).scale(40 * scalex);
				g.renderSprite(this.sprite, this.position.add(offset).subtract(c), this.zIndex, this.frame, this.flip, {"rotation":r, "scalex":scalex,"u_color":this.tint} );
			}
			this._particles.render(g,c);
		}
	}
}

/*
Ammit.prototype = new GameObject();
Ammit.prototype.constructor = GameObject;
function Ammit(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.sprite = "ammit";
	this.speed = 2.5;
	
	this.start_x = x;
	this.active = false;
	this.slimes = new Array();
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 4;
	this.bossface_frame.y = 0;
	
	this.states = {
		"current" : 0,
		"previous" : 0,
		"transition" : 0,
		"transitionTotal" : 0,
		"cooldown" : 0,
		"attack" : 0,
		"attackTotal" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = this.lifeMax = Spawn.life(24,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.damageSlime = Spawn.damage(3,this.difficulty);
	
	this.defencePhysical = Spawn.defence(2, this.difficulty);
	this.defenceFire = Spawn.defence(-2, this.difficulty);
	this.defenceSlime = Spawn.defence(4, this.difficulty);
	
	this.mass = 5.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		if(Math.random() > 0.666 && this.states.current != Ammit.STATE_BURST){
			var livingSlimes = Spawn.countList(this.slimes);
			var burstChance = (1-(livingSlimes/5.0)) * Math.min(Math.max(1-(this.life/this.lifeMax),0.2),0.8);
			
			if(Math.random() < burstChance){
				this.changeState(Ammit.STATE_BURST);
			} else {
				this.changeState(Ammit.STATE_HIDDEN);
			}
		}
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if(
				this.states.current == Ammit.STATE_MOVE || 
				this.states.current == Ammit.STATE_BOUNCE
			){
				if(this.states.transition <= 0){
					obj.hurt(this, this.getDamage());
				}
			}
		}
	});
	this.on(["player_death","pre_death"], function(){
		for(var i=0; i < this.slimes.length; i++){
			if(this.slimes[i] instanceof Slime){
				this.slimes[i].destroy();
			}
		}
	});
	this.on("death", function(){
		NPC.set("ammit", NPC.get("ammit")+1);
		audio.play("kill");
		
		Item.drop(this,65);
		this.destroy();
	});
	this.calculateXP();
}

Ammit.DISTANCE = 128;
Ammit.REACH = 256;
Ammit.BOUNCE_DISTANCE = 176;
Ammit.STATE_IDLE = 0;
Ammit.STATE_SPAWN = 1;
Ammit.STATE_MOVE = 2;
Ammit.STATE_PUNCH = 3;
Ammit.STATE_REACH = 4;
Ammit.STATE_BOUNCE = 5;
Ammit.STATE_HIDDEN = 6;
Ammit.STATE_BURST = 7;

Ammit.prototype.changeState = function(newState){
	this.states.previous = this.states.current;
	this.states.current = newState;
	this.states.transition = this.states.transitionTotal = Game.DELTASECOND;
	this.interactive = true;
	if(newState == Ammit.STATE_IDLE){
		this.states.cooldown = Game.DELTASECOND * 1.25;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		if(this.life / this.lifeMax < 0.5){
			this.states.cooldown = Game.DELTASECOND * 0.6;
		}
	}
	if(newState == Ammit.STATE_SPAWN){
		this.states.attack = 0;
	}
	if(newState == Ammit.STATE_PUNCH){
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		this.states.attack = this.states.attackTotal = Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_REACH){
		this.states.transition = this.states.transitionTotal = 0.5 * Game.DELTASECOND;
		this.states.attack = this.states.attackTotal = 1.5 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_HIDDEN){
		this.interactive = false;
		this.states.cooldown = Game.DELTASECOND * 2;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_BOUNCE){
		this.states.cooldown = Game.DELTASECOND * 5;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_BURST){
		this.states.cooldown = Game.DELTASECOND * 1.0;
		this.states.transition = this.states.transitionTotal = 0.0;
	}
}
Ammit.prototype.update = function(){	
	if ( this.active && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		var offpos = this.position.subtract(this.boss_starting_position);
		
		if(this.states.transition > 0){
			var progress = 1 - (this.states.transition / this.states.transitionTotal);
			//change from one state to another
			if(this.states.current == Ammit.STATE_BOUNCE){
				//appear as ball
				this.frame.x = Math.max(2 - progress * 3,0);
				this.frame.y = 3;
			} else if(this.states.previous == Ammit.STATE_BOUNCE){
				//Disappear as ball
				this.frame.x = progress * 3;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_HIDDEN){
				//Disappear
				this.frame.x = Math.max(3 - progress * 4,0);
				this.frame.y = 2;
			} else if(this.states.previous == Ammit.STATE_HIDDEN){
				//Appear
				this.frame.x = progress * 4;
				this.frame.y = 2;
			} else if(this.states.current == Ammit.STATE_PUNCH || this.states.current == Ammit.STATE_REACH){
				//Punch
				this.frame.x = 0;
				if(progress > 0.6){this.frame.x = 1;}
				if(progress > 0.8){this.frame.x = 2;}
				this.frame.y = 1;
			} else {
				//idle
				this.frame.x = (this.frame.x + this.delta * 9.0) % 4;
				this.frame.y = 0;
			}
			this.states.transition -= this.delta;
		} else {
			if(this.states.current == Ammit.STATE_HIDDEN){
				//hidden
				if(this.states.cooldown <= 0){
					
					var newX = this.boss_starting_position.x - Ammit.DISTANCE;
					this.position.x = newX + Ammit.DISTANCE * 2 * Math.random();
					if(Math.random() > 0.25){
						this.changeState(Ammit.STATE_IDLE);
					} else {
						this.changeState(Ammit.STATE_BOUNCE);
					}
				}
				this.states.cooldown -= this.delta;
				this.frame.x = 3;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_BOUNCE){
				//Bounce
				this.addHorizontalForce(this.speed * this.forward());
				this.force.y -= this.delta * 0.5;
				if(
					(offpos.x < -Ammit.BOUNCE_DISTANCE && this.flip) ||
					(offpos.x > Ammit.BOUNCE_DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.force.x = -this.force.x;
				}
				if(this.grounded){
					if(this.states.cooldown <= 0){
						this.force.x = 0;
						this.changeState(Ammit.STATE_HIDDEN);
						Spawn.addToList(this.position,this.slimes,Slime,5);
						Spawn.addToList(this.position,this.slimes,Slime,5);
					} else {
						shakeCamera(Game.DELTASECOND*0.3,2);
						this.grounded = false;
						this.force.y = -9;
					}
				}
				
				this.states.cooldown -= this.delta;
				this.frame.x = 0;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_REACH){
				//Reach Punch
				var reach = 1 - this.states.attack / this.states.attackTotal;
				var rd = 80 + Ammit.REACH * reach;
				this.strike(new Line(new Point(rd-12,-8), new Point(rd,0)));
				
				if(this.states.attack < 0){
					this.changeState(Ammit.STATE_IDLE);
				}
				this.states.attack -= this.delta;
				this.frame.x = 3;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_PUNCH){
				//Punch
				if(this.states.attack > Game.DELTASECOND * 0.7){
					this.strike(new Line(new Point(0,-8), new Point(48,0)));
				}
				
				if(this.states.attack < 0){
					var r = Math.random();
					if(r < 0.2){
						this.changeState(Ammit.STATE_MOVE);
					} else if (r < 0.5){
						this.changeState(Ammit.STATE_SPAWN);
					} else {
						this.changeState(Ammit.STATE_IDLE);
					}
				}
				this.states.attack -= this.delta;
				this.frame.x = 3;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_MOVE){
				//Change side
				this.addHorizontalForce(this.speed * 2 * this.forward());
				if(
					(offpos.x < -Ammit.DISTANCE && this.flip) ||
					(offpos.x > Ammit.DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.changeState(Ammit.STATE_IDLE);
				}
				this.frame.x = 5;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_SPAWN){
				//spawn enemies
				this.addHorizontalForce(this.speed * this.forward());
				if(
					(offpos.x < -Ammit.DISTANCE && this.flip) ||
					(offpos.x > Ammit.DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.changeState(Ammit.STATE_IDLE);
				}
				if(this.states.attack > Game.DELTASECOND){
					//create new Slime
					this.states.attack = 0;
					Spawn.addToList(this.position,this.slimes,Slime,5);
				}
				this.states.attack += this.delta;
				this.frame.x = (this.frame.x + this.delta * 9.0) % 4;
				this.frame.y = 0;
			} else if(this.states.current == Ammit.STATE_IDLE){
				//idle
				this.flip = dir.x > 0;
				
				if(Math.abs(dir.x) < 64){
					this.changeState(Ammit.STATE_PUNCH);
				}
				if(this.states.cooldown < 0){
					if(this.life/this.lifeMax > 0.5){
						//lots of life
						if(Math.random() > 0.3 && Spawn.countList(this.slimes) > 2){
							this.changeState(Ammit.STATE_REACH);
						} else if(Spawn.countList(this.slimes) < 4 && Math.random() > 0.5){
							this.changeState(Ammit.STATE_SPAWN);
						} else {
							this.changeState(Ammit.STATE_MOVE);
						}
					} else {
						//not so much life
						if(Math.random() > 0.5){
							this.changeState(Ammit.STATE_REACH);
						} else {
							this.changeState(Ammit.STATE_MOVE);
						}
					}
				}
				this.states.cooldown -= this.delta;
				this.frame.x = (this.frame.x + this.delta * 9.0) % 4;
				this.frame.y = 0;
			} else if(this.states.current == Ammit.STATE_BURST){
				if(this.states.cooldown < 0){
					for(var i=0; i < 5; i++){
						var randomPosition = new Point(Math.random()-.5,Math.random()-.8).normalize(32);
						var slime = Spawn.addToList(this.position.add(randomPosition),this.slimes,Slime,5);
						if(slime instanceof GameObject){
							slime.force = randomPosition.normalize(8);
						}
					}
					this.changeState(Ammit.STATE_HIDDEN);
				}
				this.states.cooldown -= this.delta;
				this.frame.x = Math.max((this.frame.x + this.delta * 15.0) % 6, 4);
				this.frame.y = 0;
			}
		}
	}
}

Ammit.prototype.idle = function(g,c){}

Ammit.prototype.render = function(g,c){
	if(this.states.transition <= 0){
		var dir = this.flip ? -1 : 1;
		if(this.states.current == Ammit.STATE_PUNCH ){
			//draw hand
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*80,0)),this.zIndex,new Point(0, 4),this.flip);
		} else if(this.states.current == Ammit.STATE_REACH){
			var reach = 1 - this.states.attack / this.states.attackTotal;
			var rd = 80 + Ammit.REACH * reach;
			//draw hand
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*rd,0)),this.zIndex,new Point(0, 4),this.flip);
			for(var i = rd; i > 80; i -= 32){
				//draw wrist
				g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*(i-32),0)),this.zIndex,new Point(1, 4),this.flip);
			}
		}
	}
	GameObject.prototype.render.apply(this,[g,c]);
}
*/