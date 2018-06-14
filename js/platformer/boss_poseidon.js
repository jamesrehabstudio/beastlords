class Poseidon extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPos = this.position
		this.width = 48;
		this.height = 64;
		this.sprite = "poseidon";
		this.swrap = spriteWrap["poseidon"];;
		this.speed = 24.0;
		this.active = false;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		this.addModule( mod_boss );
		
		this.bossface_frame = 0;
		this.bossface_frame_row = 1;
		
		
		this.condition = ops.getString("condition", false);
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.death_time = Game.DELTASECOND * 3;
		this.life = Spawn.life(20,this.difficulty);
		this.lifeMax = this.life;
		this.collideDamage = 5;
		
		this.defencePhysical = Spawn.defence(1, this.difficulty);
		this.defenceFire = Spawn.defence(0, this.difficulty);
		this.defenceSlime = Spawn.defence(1, this.difficulty);
		this.defenceIce = Spawn.defence(-1, this.difficulty);
		this.defenceLight = Spawn.defence(-1, this.difficulty);
		
		this.damage = Spawn.damage(4,this.difficulty);
		this.landDamage = Spawn.damage(5,this.difficulty);
		this.moneyDrop = Spawn.money(40,this.difficulty);
		this.stun_time = 0;
		this.interactive = false;
		
		this.mass = 6.0;
		this.gravity = 0.4;
		
		
		this._state = 0;
		this._time = 0.0;
		this._timeTotal = 1.0;
		this._transition = 0.0;
		this._transitionTotal = 1.0;
		this._count = 3;
		this._anim = 0.0;
		this._slash_alert = 0.0;
		
		this.on("land", function(){
			
			if(this._state == Poseidon.STATE_ESCAPE){
				if(this._count <= 0){
					this.fire();
					this.setState(Poseidon.STATE_LAND);
				} else {
					this._count = 0;
					this.setState(Poseidon.STATE_DASH);
				}
			} else {
				this.setState(Poseidon.STATE_LAND);
			}
		});
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				if(!this.grounded && this.force.y > 0 && obj.position.y > this.position.y){
					obj.hurt(this, this.landDamage);
				}
			}
		});
		this.on("added", function(){
			if( this.condition && !NPC.get(this.condition) ){
				this.destroy();
			}
		});
		this.on("struck", function(obj){
			
			if(obj instanceof Player && !obj.isDownstabbing){
				//Hit with strike
				if(this._state == Poseidon.STATE_IDLE){
					let roll = Math.random();
					
					if(roll > 0.7){
						this.setState(Poseidon.STATE_ESCAPE);
						if(roll > 0.9) { this._count = 1;} 
					} else if(roll > 0.55){
						this.setState(Poseidon.STATE_FIRE);
					} else if(roll > 0.3){
						this.setState(Poseidon.STATE_SLASH);
					}
				}
			}
		});
		this.on("hurt", function(){
			audio.play("hurt", this.position);
		});
		this.on("downstabbed", function(obj,damage){
			if(this._state == Poseidon.STATE_IDLE){
				this.flip = this.boss_starting_position.x < this.position.x;
				this.setState(Poseidon.STATE_ESCAPEROLL);
				//this._transition = Game.DELTASECOND * 0.5;
			}
			/*
			if(
				this.states.current == Poseidon.IDLE_STATE ||
				this.states.current == Poseidon.TOSS_STATE ||
				this.states.current == Poseidon.FIRE_STATE ||
				this.states.current == Poseidon.BASH_STATE
			){
				if(Math.random() < 0.6){
					this.setState(Poseidon.ESCAPE_STATE);
				} else {
					this.setState(Poseidon.JUMP_STATE);
				}
			}
			*/
		});
		this.on("death", function(){
			Item.drop(this,50);
			this.destroy();
			
			game.clearAll();
			game.addObject( new DemoThanks(0,0) );
		});
	}
	update(){
		if(this.life > 0){
			this._time -= this.delta;
			this._transition -= this.delta;
			
			let dir = this.target().position.subtract(this.position);
			let p = this._time / this._timeTotal;
			let q = 1 - p;
			let t = 1 - this._transition / this._transitionTotal;
			
			if(this._state == Poseidon.STATE_LAND){
				this.frame = this.swrap.frame("land", q);
				
				if(this._time <= 0){ 
					this.setState(Poseidon.STATE_IDLE); 
				}
				
			} else if(this._state == Poseidon.STATE_KNIFE) {
				if(this._transition > 0){
					this._time = this._timeTotal;
					this.frame = this.swrap.frame("knife_ready", t);
				} else {
					
					if( Timer.isAt(this._time, this._timeTotal * 0.5, this.delta) ){
						this.throwKnife();
					}
					
					if(this._time <= 0){
						this._count--;
						if(this._count > 0){
							this._time = this._timeTotal;
						} else {
							this.setState(Poseidon.STATE_IDLE);
						}
					}
					
					this.frame = this.swrap.frame("knife", q);
				}
			} else if(this._state == Poseidon.STATE_ESCAPE) {
				this.frame = this.swrap.frame("jump", q);
								
				if( Timer.isAt(this._time, this._timeTotal * 0.75, this.delta) ){
					this.grounded = false;
					this.force.y = -6;
					this.force.x = this.forward() * -6;
				}
				if(!this.grounded){ this.force.y -= this.gravity * 0.35 * this.delta * UNITS_PER_METER; }
				
				if(this._count <= 0){
					if( 
						Timer.isAt(this._time, this._timeTotal * 0.45, this.delta) ||
						Timer.isAt(this._time, this._timeTotal * 0.30, this.delta) 
					){
						this.fire();
					}
				}
				if(this._time <= 0){
					this.setState(Poseidon.STATE_IDLE);
				}
				
			} else if(this._state == Poseidon.STATE_ESCAPEROLL) {
				this.frame = this.swrap.frame("roll", (game.timeScaled * 4.0) % 1 );
				this.addHorizontalForce(this.forward() * this.speed * 1.3);
				
				if(this._time <= 0){
					this._slash_alert = Game.DELTASECOND * 0.85;
					this.setState(Poseidon.STATE_IDLE);
				}
				
			} else if(this._state == Poseidon.STATE_CHOMP) {
				this.frame = this.swrap.frame("chomp", q);
				
				if(this._time <= 0){
						this._count--;
					if(this._count > 0){
						this._time = this._timeTotal;
					} else {
						this.setState(Poseidon.STATE_IDLE);
					}
				}
			} else if(this._state == Poseidon.STATE_DASH) {
				this.addHorizontalForce(this.forward() * this.speed);
				
				this._anim = Math.mod(this._anim + this.delta * Math.abs(this.force.x) * 0.2, 1.0);
				this.frame = this.swrap.frame("run", this._anim);
				
				if(Math.abs(dir.x) < 64){
					this.setState(Poseidon.STATE_CHOMP);
				}
				
				if(this._time <= 0){
					this.setState(Poseidon.STATE_IDLE);
				}
			} else if(this._state == Poseidon.STATE_FIRE) {
				this.frame = this.swrap.frame("roar", q);
				
				if( Timer.isAt(this._time, this._timeTotal * 0.4, this.delta) ){
					this.fire();
				}
				
				if(this._time <= 0){
					this.setState(Poseidon.STATE_IDLE);
				}
			} else if(this._state == Poseidon.STATE_SLASH) {
				if(this._transition > 0){
					this._time = this._timeTotal;
				}
				
				this.frame = this.swrap.frame("slash", q);
				
				if(this._time <= 0){
					this.setState(Poseidon.STATE_IDLE);
				}
			} else if(this._state == Poseidon.STATE_JUMP) {
				this.frame = this.swrap.frame("jump", q);
				if(!this.grounded && Math.abs(dir.x) > 48){
					this.addHorizontalForce(this.forward() * this.speed * 2.0, 0.5);
				}
				
				if( Timer.isAt(this._time, this._timeTotal * 0.375, this.delta) ){
					this.grounded = false;
					this.force.y = -9;
					this.force.x = this.forward() * 7;
				}
				if(this._time <= 0){
					this.setState(Poseidon.STATE_IDLE);
				}
			} else {
				
				if(!this.grounded){
					
				} else if(Math.abs(this.force.x) > 0.4){
					this._anim = Math.mod(this._anim + this.delta * Math.abs(this.force.x) * 0.4, 1.0);
					this.frame = this.swrap.frame("walk", this._anim);
				} else {
					this._anim = (this._anim + this.delta) % 1.0;
					this.frame = this.swrap.frame("idle", this._anim);
				}
				
				if(this.grounded){
					this.flip = dir.x < 0;
					
					if(this._slash_alert > 0.0){
						this._slash_alert -= this.delta;
						if( Math.abs(dir.x) < 96 && Math.abs(dir.y) < 64 ){
							this.flip = dir.x < 0;
							this.force.x = 0.0;
							this._slash_alert = 0.0;
							this.setState(Poseidon.STATE_SLASH);
						} else if (Math.abs(dir.x) > 96 && dir.y < -40 ){
							this.flip = dir.x < 0;
							this.force.x = 0.0;
							this._slash_alert = 0.0;
							this.setState(Poseidon.STATE_FIRE);
						}
						
					}
					
					if(this.boss_starting_position.x - this.position.x > 12){
						this.addHorizontalForce(this.speed * 0.3);
					}
					if(this.boss_starting_position.x - this.position.x < -12){
						this.addHorizontalForce(this.speed * -0.3);
					}
				}
				
				if(this._time <= 0){
					this.flip = dir.x < 0;
					this.setState();
				}
			}
			
		}
	}
	setState(state){
		
		if(state == undefined){
			state = this.getState();
		}
		
		this._state = state;
		
		let multiplier = 0.7 + (this.life / this.lifeMax) * 0.3;
		
		if(this._state == Poseidon.STATE_LAND){
			this._time = this._timeTotal = Game.DELTASECOND * 0.6 * multiplier;
		} else if(this._state == Poseidon.STATE_KNIFE) {
			this._transition = this._transitionTotal = Game.DELTASECOND * 0.8 * multiplier;
			this._time = this._timeTotal = Game.DELTASECOND * 0.8 * multiplier;
			this._count = 3;
		} else if(this._state == Poseidon.STATE_CHOMP) {
			this._time = this._timeTotal = Game.DELTASECOND * 0.5 * multiplier;
			this._count = 2;
		} else if(this._state == Poseidon.STATE_DASH) {
			this._time = this._timeTotal = Game.DELTASECOND * 2.0 * multiplier;
		} else if(this._state == Poseidon.STATE_FIRE) {
			this._time = this._timeTotal = Game.DELTASECOND * 1.2 * multiplier;
		} else if(this._state == Poseidon.STATE_SLASH) {
			this._time = this._timeTotal = Game.DELTASECOND * 1.0 * multiplier;
		} else if(this._state == Poseidon.STATE_JUMP) {
			this._time = this._timeTotal = Game.DELTASECOND * 1.0 * multiplier;
		} else if(this._state == Poseidon.STATE_ESCAPE) {
			this._time = this._timeTotal = Game.DELTASECOND * 2.0 * multiplier;
		} else if(this._state == Poseidon.STATE_ESCAPEROLL) {
			this._time = this._timeTotal = Game.DELTASECOND * 0.6 * multiplier;
		} else if(this._state == Poseidon.STATE_IDLE) {
			this._time = this._timeTotal = Game.DELTASECOND * 2.0 * multiplier;
		}
	}
	getState(){
		let ranged = [Poseidon.STATE_KNIFE, Poseidon.STATE_DASH, Poseidon.STATE_FIRE, Poseidon.STATE_JUMP];
		let melee = [Poseidon.STATE_KNIFE, Poseidon.STATE_SLASH, Poseidon.STATE_FIRE, Poseidon.STATE_JUMP];
		
		let selection = Math.abs(this.target().position.x - this.position.x) > 72 ? ranged : melee;
		let index = Math.floor( Math.random() * selection.length );
		return selection[index];
	}
	fire(){
		var sf = new SharkFlame(this.position.x, this.position.y);
		sf.damage = this.damage;
		sf.flip = this.flip;
		game.addObject(sf);
	}
	throwKnife(){
		var sk = new SharkKnife(this.position.x, this.position.y);
		sk.damage = this.damage;
		sk.flip = this.flip;
		game.addObject(sk);
	}
}
Poseidon.STATE_IDLE = 0;
Poseidon.STATE_KNIFE = 1;
Poseidon.STATE_CHOMP = 2;
Poseidon.STATE_DASH = 3;
Poseidon.STATE_FIRE = 4;
Poseidon.STATE_SLASH = 5;
Poseidon.STATE_JUMP = 6;
Poseidon.STATE_LAND = 7;
Poseidon.STATE_ESCAPE = 8;
Poseidon.STATE_ESCAPE2 = 9;
Poseidon.STATE_ESCAPEROLL = 10;


self["Poseidon"] = Poseidon;

class SharkFlame extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "bullets";
		this.width = 30;
		this.height = 24;
		this.team = 0;
		
		this.speed = 9;
		
		this.damage = 10;
		this.damageFire = 0;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		this.damageFixed = 0;
		this.damageMultiplier = 1.0;
		
		this.frame = new Point(5,3);
		
		this.ignoreList = new Array();
		
		this.on("sleep", function(){
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if(obj.hasModule(mod_combat) && this.team != obj.team){
				
				if( this.ignoreList.indexOf(obj) < 0){
				
					this.ignoreList.push(obj);
					obj.hurt( this, Combat.getDamage.apply(this) );
				}
			}
		});
	}
	update(){
		this.position.x += this.forward() * this.speed * this.delta * UNITS_PER_METER;
	}
	render(g,c){}
	postrender(g,c){
		super.render(g,c);
	}
}

class SharkKnife extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "bullets";
		this.width = 24;
		this.height = 8;
		this.team = 0;
		this.frame = new Point(0,6);
		
		this.speed = 12;
		
		this.damage = 8;
		this.damageFire = 0;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		this.damageFixed = 0;
		this.damageMultiplier = 1.0;
		
		this.ignoreList = new Array();
		this._spin = -0.25;
		
		this.on("sleep", function(){
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if(obj.hasModule(mod_combat) && this.team != obj.team){
				
				if( this.ignoreList.indexOf(obj) < 0){
				
					this.ignoreList.push(obj);
					obj.hurt( this, Combat.getDamage.apply(this) );
				}
			}
		});
	}
	update(){
		this._spin += this.delta;
		let t = Math.cos( Math.clamp( this._spin, 0, 1.0 ) * Math.PI );
		this.position.x += this.forward() * this.speed * t * this.delta * UNITS_PER_METER;
		this.frame.x = (this.frame.x + this.delta * 12.0) % 6;
	}
	idle(){
		if(this._spin >= 1){
			super.idle();
		}
	}
	render(g,c){}
	postrender(g,c){
		g.renderSprite(
			this.sprite,
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip, 
			{}
		);
	}
}