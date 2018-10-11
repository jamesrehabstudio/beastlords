class Spearbe extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.sprite = "spearbe";
		this.swrap = spriteWrap["spearbe"];
		
		this.width = 40;
		this.height = 44;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.damageContact = 0.0;
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(8,this.difficulty);
		this.xpDrop = Spawn.xp(7,this.difficulty);
		this.death_time = Game.DELTASECOND * 0.5;
		this.moneyDrop = Spawn.money(7,this.difficulty);
		this.combat_knockback_speed = 1.0;
		this.speed = 6;
		
		this.defenceBlock = Spawn.defence(3, this.difficulty);
		this.defencePhysical = 0;
		
		this._state = Spearbe.STATE_IDLE;
		this._blocking = 0.0;
		this._cooldown = 2.0;
		this._count = 0;
		this._time = 0.0;
		this._timeTotal = 1.0;
		this._anim = 0.0;
		this._afterimage = 0.0;
		
		this.on("collideObject", function(obj, damage){
			if( this._state == Spearbe.STATE_CHARGE ){
				if( obj == this.target() ){
					this.setState(Spearbe.STATE_THROW);
					game.slow(0,0.4);
					
					this.target().pause = true;
					this.target().showplayer = false;
					this.target().interactive = false;
				}
			}
		});
		
		this.on("blocked", function(obj){
			obj.combat_knockback.x = this.forward() * 40;
		});
		
		this.on("hurt", function(obj, damage){
			if(this.defencePhysical >= this.defenceBlock){
				audio.play("block", this.position);
				this._blocking = Game.DELTASECOND * 0.7;
			} else {
				audio.play("hurt", this.position);
			}
		});
		
		this.on("death", function(){
			this.destroy();
			Item.drop(this);
			audio.play("kill",this.position); 
			createExplosion(this.position, 32 );
		});
		
	}
	update(){
		if(this.life > 0){
			this._blocking = Math.max( this._blocking - this.delta, 0);
			this._time -= this.delta;
			
			let p = 1 - Math.clamp01(this._time / this._timeTotal);
			let dir = this.position.subtract(this.target().position);
			
			if(this._state == Spearbe.STATE_THROW){
				this.frame = this.swrap.frame("throw", p);
				
				if(this._count > 0 && this.frame.x == 2 && this.frame.y == 5){
					//Jump and throw player
					this.grounded = false;
					this.force.y = -6;
					this.force.x = this.forward() * -this.speed;
					
					this.target().hurt( this, this.getDamage() );
					this.target().pause = false;
					this.target().showplayer = true;
					this.target().interactive = true;
					this._count = 0;
				}
				if(!this.grounded){
					this.addHorizontalForce(this.forward() * -this.speed);
				}
				
				if( p >= 1 && this.grounded ){
					this.setState(Spearbe.STATE_IDLE);
				}
			} else if(this._state == Spearbe.STATE_CHARGE){
				//Slide toward player
				this.frame = this.swrap.frame("charge", Math.clamp01(p * 3));
				
				if(p * 3 >= 1){
					this.addHorizontalForce(this.forward() * this.speed * 2);
					
					//Create after image
					this._afterimage -= this.delta;
					if(this._afterimage <= 0 ){
						EffectAfterImage.create(this);
						this._afterimage += 0.25;
					}
				}
				if(this._time <= 0){
					this.setState(Spearbe.STATE_IDLE);
				}
			} else if(this._state == Spearbe.STATE_KICK){
				
				this.frame = this.swrap.frame("kick", p);
				
				if(p > 0.1 && this._count > 0){
					this._count = 0;
					this.force.x = this.forward() * this.speed * 1.5;
				}
				
				if(p > 0.8){
					this.force.x = 0.0;
				}
				
				if(this._time <= 0){
					this.setState(Spearbe.STATE_IDLE);
				}
			} else {
				this.defencePhysical = this.defenceBlock;
				this._cooldown -= this.delta;
				this.flip = this.position.x > this.target().position.x;
				
				if(this._cooldown <= 0){
					this.defencePhysical = 0;
					this._cooldown = Game.DELTASECOND * 3;
					
					if( this.target().grounded && Math.abs(dir.x) < 140 && Math.random() > 0.3){
						this.setState(Spearbe.STATE_KICK);
					} else {
						this.setState(Spearbe.STATE_CHARGE);
					}
					
				} else if(this._blocking > 0){
					this.frame = this.swrap.frame("block", 0.0);
				} else {
					
					if(Math.abs( dir.x ) < 96 ){
						this.addHorizontalForce(this.forward() * -this.speed);
					} else if(Math.abs( dir.x ) > 112 ){
						this.addHorizontalForce(this.forward() * this.speed);
					}
					
					this._anim = Math.mod( this._anim + this.delta * this.forward() * this.force.x * 1.0, 1.0 );
					this.frame = this.swrap.frame("walk", this._anim);
				}
				
			}
		} else {
			this.frame = this.swrap.frame("hurt", 0.0);
		}
	}
	setState(state){
		this._state = state;
		this._count = 0;
		if( this._state == Spearbe.STATE_IDLE){
			this._time = this._timeTotal = Game.DELTASECOND * 2;
		} else if( this._state == Spearbe.STATE_CHARGE){
			this._time = this._timeTotal = Game.DELTASECOND * 3;
		} else if( this._state == Spearbe.STATE_THROW){
			this._count = 1;
			this.force.x = 0.0;
			this._time = this._timeTotal = Game.DELTASECOND * 0.75;
		} else if( this._state == Spearbe.STATE_KICK){
			this.force.x = 0.0;
			this._time = this._timeTotal = Game.DELTASECOND * 1.5;
			this._count = 1;
		}	
	}
	render(g,c){
		super.render(g,c);
		if(this.frame.x == 2 && this.frame.y == 4){
			g.renderSprite("player", this.position.add(Spearbe.PLAYER_GRIP_POS.scale(this.forward(),1)).subtract(c), this.zIndex+1, new Point(10,1), this.flip );
		}
	}
}
Spearbe.PLAYER_GRIP_POS = new Point(-32,-24);
Spearbe.STATE_IDLE = 0;
Spearbe.STATE_CHARGE = 1;
Spearbe.STATE_THROW = 2;
Spearbe.STATE_KICK = 3;

self["Spearbe"] = Spearbe;
