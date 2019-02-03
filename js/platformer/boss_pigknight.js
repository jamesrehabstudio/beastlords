class PigbossKnight extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.startPosition = this.position.scale(1);
		this.sprite = "pigbossknight";
		this.width = 64;
		this.height = 110;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.spikes = new Array();
		
		this.on("struck", function(obj, area){
			this.criticalChance = 1.0;
		});
		this.on("hurt", function(damage, obj){
			if(this._state != PigbossKnight.STATE_IDLE){
				this.setState(PigbossKnight.STATE_IDLE);
			}
		});
		this.on("block", function(obj, area, damage){
			audio.play("block", this.position);
			this._retreat = Math.max(this._retreat, Game.DELTASECOND * 0.4);
			this._cooldown -= 0.75;
			
			damage = Math.floor(damage * 0.35);
			
			if(damage > 0){
				this.life -= damage;
				this.isDead();
				this.displayDamage(damage);
			}
			
		});
		this.on("collideBall", function(obj){
			if(this.active){
				if(obj.hasModule(mod_combat) && obj.team != this.team){
					let multiplier = (this._ballToss > 0 && this._ballToss < 1) ? 1.5 : 1;
					obj.hurt(this, this.getDamage(multiplier));
				}
				if(obj instanceof DamageTrigger && this._spike){
					this.createSpike(obj);
					this._spike = false;
				}
				if(obj instanceof PigbossKnight && this._state == PigbossKnight.STATE_BALLWITHDRAW){
					this.setState(PigbossKnight.STATE_IDLE);
				}
			}
		});
		this.on("ballWall", function(){
			if( this._state == PigbossKnight.STATE_THROW){
				shakeCamera(0.25, 4);
				this.setState(PigbossKnight.STATE_BALLWITHDRAW);
			}
		});
		this.on("hurtBall", function(obj){
			audio.play("block", this.ballObj.position);
			
			if( this._type == 0 ){
				this._ballStun = Game.DELTASECOND;
			}
		});
		this.on("pre_death", function(){
			this.ballObj.destroy();
			
			for(let i=0; i < this.spikes.length; i++){
				this.spikes[i].destroy();
			}
		});
		this.on("player_death", function(){
			this.ballObj.position = this.startPosition.scale(1);
		});
		this.on("death", function(){
			Item.drop(this,24);
			audio.play("kill");
			this.destroy();
			
			game.addObject( new PigbossKnightNude( this.position.x, this.position.y ) );
		});
		this.on("activate", function(){
			
			this.visible = true;
			
			if( PigbossKnight.intro ){
				game.addObject( new CutscenePigboss() );
				PigbossKnight.intro = false;
			} else {
				game.addObject( new BossIntro(0) );
			}
			
			//Reset
			this._cooldown = Game.DELTASECOND * 4;
			this._attack = 0.0;
			this._type = 0;
			this._count = 4;
			
			this._chainSlack = 0.0;
			this._chainAnchor = new Point();
		});
		
		this.parts = {
			"body" : {
				"position" : new Point(),
				"origins" : [new Point(), new Point(), new Point(), new Point()],
				"frame" : new Point(),
				"zIndex" : 0
			},
			"head" : {
				"position" : new Point(),
				"origins" : [new Point(-8,-38), new Point(-6,-38), new Point(-4,-38), new Point(-2,-38)],
				"frame" : new Point(0,1),
				"zIndex" : -1
			},
			"arm1" : {
				"position" : new Point(),
				"offset" : [new Vector(-16,32,0), new Vector(-16,0,0), new Vector(16,20,90), new Vector(16,32,90) ],
				"origins" : [new Point(-8,-38), new Point(-4,-38), new Point(-2,-38), new Point(0,-38)],
				"frame" : new Point(0,4),
				"zIndex" : 3
			},
			"arm2" : {
				"position" : new Point(),
				"origins" : [new Point(8,-14), new Point(6,-14), new Point(4,-14), new Point(-2,-14)],
				"frame" : new Point(2,3),
				"zIndex" : -1
			},
			"leg1" : {
				"position" : new Point(),
				"origins" : [new Point(-8,28), new Point(-2,28), new Point(4,28), new Point(-2,28)],
				"frame" : new Point(0,2),
				"zIndex" : 1
			},
			"leg2" : {
				"position" : new Point(),
				"origins" : [new Point(16,28), new Point(12,28), new Point(8,28), new Point(-2,28)],
				"frame" : new Point(2,2),
				"zIndex" : -1
			}
		};
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(16, this.difficulty);
		this.defencePhysical = 0;
		this.defenceFire = Spawn.defence(2,this.difficulty);
		this.defenceSlime = Spawn.defence(2,this.difficulty);
		this.defenceIce = Spawn.defence(2,this.difficulty);
		this.defenceLight = Spawn.defence(2,this.difficulty);
		
		this.moneyDrop = 0;
		this.xpDrop = Spawn.xp(25,this.difficulty);
		
		this.ballObj = new GameObject(x,y);
		this.ballObj.parent = this;
		this.ballObj.width = this.ballObj.height = 20;
		this.ballObj.force_y = 0;
		this.ballObj.addModule(mod_combat);
		this.ballObj.addModule(mod_rigidbody);
		this.ballObj.pushable = false;
		this.ballObj.position = this.position.scale(1);
		this.ballObj.showDamage = false;
		this.ballObj.gravity = 0.0;
		this.ballObj.hurtByDamageTriggers = false;
		this.ballObj.on("hurt", function(damage, obj){ this.parent.trigger("hurtBall", damage, obj);  });
		this.ballObj.on("collideObject", function(obj){ this.parent.trigger("collideBall", obj); });
		this.ballObj.on(["collideHorizontal","collideVertical"], function(){ this.parent.trigger("ballWall"); });
		game.addObject(this.ballObj);
		
		this.speed = 3.0;
		this.death_time = Game.DELTASECOND * 2.0;
		
		this.guard.active = true;
		this.guard.omidirectional = true;
		this.guard.x = -36;
		this.guard.y = -32;
		this.guard.h = 88;
		this.guard.w = 72;
		
		this._ballPositionStart = this.position.scale(1);
		this._ballDestination = this.position.scale(1);
		this._ballDistance = 1.0;
		this._ballToss = 0.0;
		this._ballStun = 0.0;
		this._walkAnim = 0.0;
		this._retreat = 0.0;
		
		this._cooldown = Game.DELTASECOND * 5;
		this._count = 3;
		this._duck = false;
		
		this._state = PigbossKnight.STATE_IDLE;
		this._time = this._timeMax = 3;
		
		this._spike = false;
		this._walkChangeTimer = Game.DELTASECOND * 2.0;
		this._walkPause = Game.DELTASECOND * 2.0;
		this._walkDirection = 1.0;
	}
	setState(s){
		this._state = s;
		this.ballObj.gravity = 0.0;
		this.parts.head.frame.x = 0;
		
		if(this._state == PigbossKnight.STATE_IDLE){
			this._time = this._timeMax = 3;
		} else if(this._state == PigbossKnight.STATE_SPINBALL){
			this._time = this._timeMax = 1.6;
			this._count = 2;
		} else if(this._state == PigbossKnight.STATE_BALLCHARGE){
			this._time = this._timeMax = 1.5;
			this._count -= 1;
		} else if(this._state == PigbossKnight.STATE_THROW){
			this._time = this._timeMax = 1.0;
		} else if(this._state == PigbossKnight.STATE_BALLWITHDRAW){
			this._time = this._timeMax = 4.5;
			this.ballObj.gravity = 1.0;
		}
	}
	update(){
		this.criticalChance = 1.0;
		
		if( this.active ) {
			if(this.life > 0){
				
				let dif = this.target().position.subtract(this.position);
				this.flip = dif.x < 0;
				this.ballObj.life = 9999;
				this._ballStun -= this.delta;
				
				
				if(this._state == PigbossKnight.STATE_IDLE){
					this._time -= this.delta;
					this.ballObj.position = this.position.add(new Point(this.forward() * -24, 32));
					this.parts.arm1.frame.x = 0;
					this.parts.head.frame.x = this.stun <= 0 ? 0 : 3;
					
					
					if(this._time <= 0){
						if( this._count > 0 ){
							this.setState(PigbossKnight.STATE_BALLCHARGE);
						} else {
							this.setState(PigbossKnight.STATE_SPINBALL);
						}
						
					} else if(this._walkPause > 0){
						this._walkPause -= this.delta;
					} else {
						this.addHorizontalForce(this.speed * this._walkDirection);
						this._walkChangeTimer -= this.delta;
						
						if(this._walkChangeTimer <= 0){
							let currentWalkDir = this._walkDirection;
							if(this.position.x - this.startPosition.x < -64){
								this._walkDirection = 1;
							} else if(this.position.x - this.startPosition.x > 80){
								this._walkDirection = -1;
							} else if(Math.abs(dif.x) < 96){
								this._walkDirection = -this.forward();
							} else {
								this._walkDirection = this.forward();
							}
							
							if(this._walkDirection != currentWalkDir){
								this._walkPause = Game.DELTASECOND * 1.0;
							}
						}
					}
				} else if(this._state == PigbossKnight.STATE_SPINBALL){
					this._time -= this.delta;
					
					let angle = Math.mod(this._time * 6.0, Math.PI * 2) - 1.2;
					let radius = 64;
					
					this.parts.arm1.frame.x = 1;
					this.ballObj.position.x = this.position.x + Math.sin(angle) * radius;
					this.ballObj.position.y = this.position.y + Math.cos(angle) * radius - 48;
					
					this.ballObj.target = this.position.add(new Point(this.forward() * 64, -128));
					
					if(this._time <= 0){
						this._spike = true;
						this.ballObj.direction = this.ballObj.target.subtract(this.ballObj.position).normalize();
						this.setState(PigbossKnight.STATE_THROW);
					}
					
				} else if(this._state == PigbossKnight.STATE_BALLCHARGE){
					this._time -= this.delta;
					this.parts.arm1.frame.x = 1;
					
					
					this.ballObj.position.x = this.position.x + this.forward() * -24;
					this.ballObj.position.y = this.position.y - 64;
					
					if(this._time > 0.15){
						this.ballObj.target = this.target().position.subtract(new Point(0,6));
					} else if(this._time <= 0){
						this.ballObj.direction = this.ballObj.target.subtract(this.ballObj.position).normalize();
						this.setState(PigbossKnight.STATE_THROW);
					}
				} else if(this._state == PigbossKnight.STATE_THROW){
					this.parts.arm1.frame.x = 2;
					
					let move = this.ballObj.direction.scale(UNITS_PER_METER * PigbossKnight.BALL_THROW_SPEED * this.delta);
					game.t_move( this.ballObj, move.x, move.y);
					
				} else if(this._state == PigbossKnight.STATE_BALLWITHDRAW){
					this._time -= this.delta;
					this._duck = true;
					this.parts.arm1.frame.x = 3;
					this.ballObj.direction = this.ballObj.target.subtract(this.ballObj.position).normalize();
					
					this._chainSlack = PigbossKnight.BALL_PULL.get(1-this._time/this._timeMax);
					//this._chainSlack = Math.clamp01(1.5 * this._time/this._timeMax);
					
					if(this._time < 1.2){
						this.parts.head.frame.x = 1 + Math.floor( (game.timeScaled * 2) % 2);
					}
					
					if(this._time < 0.5){
						let move = this.position.subtract(this.ballObj.position).normalize(UNITS_PER_METER * this.delta * PigbossKnight.BALL_RETURN_SPEED);
						game.t_move( this.ballObj, move.x, move.y);
					}
				}
				
				//Apply animation
				if(Math.abs(this.force.x) > 0.5){
					this._walkAnim = Math.mod(this._walkAnim + this.delta * 0.5 * this.force.x * this.forward(), 1.0);
				} else {
					this._walkAnim = Math.lerp(this._walkAnim, 0.5, this.delta);
				}
				
				if(this._duck){
					this.parts.body.position.x = Math.lerp(this.parts.body.position.x, -8, this.delta * 0.5);
					this.parts.body.position.y = Math.lerp(this.parts.body.position.y, 24, this.delta * 2);
				} else {
					this.parts.body.position = Point.lerp(this.parts.body.position, new Point(0,0), this.delta * 5);
				}
				this.parts.arm1.position = Point.lerp(this.parts.arm1.position, this.parts.body.position, this.delta * 8);
				this.parts.arm2.position = Point.lerp(this.parts.arm2.position, this.parts.body.position, this.delta * 8);
				this.parts.head.position = Point.lerp(this.parts.head.position, this.parts.body.position, this.delta * 6);
				this.guard.y = this.parts.body.position.y - 28;
				this._duck = false;
				
				if(this._state == PigbossKnight.STATE_THROW){
					this._chainAnchor = new Point(28,-16);
				} else if(this._state == PigbossKnight.STATE_BALLWITHDRAW){
					this._chainAnchor = new Point(24,28);
				} else if(this._state == PigbossKnight.STATE_SPINBALL){
					this._chainAnchor = new Point(-28,-56);
				} else if(this._state == PigbossKnight.STATE_IDLE){
					this._chainAnchor = new Point(-24, 32);
				} else if(this._state == PigbossKnight.STATE_BALLCHARGE){
					this._chainAnchor = new Point(-24, -64);
				} else {
					this._chainAnchor.x = this.parts.arm1.position.x;
					this._chainAnchor.y = this.parts.arm1.position.y;
				}
				
				//this.frame.x = Math.clamp( ( 1 + Math.sin( this._walkAnim * 6.28 ) ) * 2.1, 0, 3);
				this.parts.body.frame.x = Math.clamp( Math.pingpong01( this._walkAnim ) * 4, 0, 3);
				
				//Animate legs
				this.parts.leg1.position.x = Math.sin(this._walkAnim * 6.28) * 4;
				this.parts.leg1.position.y = Math.min( -Math.cos(this._walkAnim * 6.28) * 4, 0);
				this.parts.leg2.position.x = Math.sin(3.14 + this._walkAnim * 6.28) * 4;
				this.parts.leg2.position.y = Math.min( -Math.cos(3.14 + this._walkAnim * 6.28) * 4, 0);
				
			}
		} else {
			this.visible = false;
		}
	}
	createSpike(damTrig){
		let c = damTrig.corners();
		this.spikes = new Array();
		
		for(let x = c.left; x < c.right-15; x += 16){
			let spike = new FallingSpike(x, c.top+1);
			spike._time += Math.random() * 0.5;
			spike.team = this.team;
			game.addObject( spike );
			this.spikes.push( spike );
			
			if(Math.random() > 0.5 ){
				x += 32;
			}
		}
	}
	render(g,c){
		//g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,this.flip,{"u_color":this.tint});
		let a = this.position.add(this._chainAnchor.scale(this.forward(), 1));
		let b = this.ballObj.position.scale(1);
		
		
		
		
		for(let v in this.parts){
			let part = this.parts[v];
			let origin = new Point();
			let rotation = 0;
			
			if("origins" in part){
				origin = part.origins[Math.floor(this.frame.x)].scale(this.forward(), 1);
			}
			
			if("offset" in part){
				let offset = part.offset[Math.floor( part.frame.x )];
				origin = origin.add( new Point( offset.x * this.forward(), offset.y ) );
				rotation = offset.z;
			}
			origin = origin.add( new Point( part.position.x * this.forward(), part.position.y ) );
			g.renderSprite(this.sprite, this.position.add(origin).subtract(c),this.zIndex + part.zIndex, part.frame, this.flip, {"u_color":this.tint ,"rotation" : rotation});
		}
		
		if(this.life > 0){	
			//Render ball and chain
			if(this._state == PigbossKnight.STATE_BALLWITHDRAW && this._time < 1.5){
				b.x += Math.randomRange(-2,2);
				b.y += Math.randomRange(-2,2);
			}
			for(let i=0; i < PigbossKnight.CHAIN_COUNT; i++){
				let d = i / PigbossKnight.CHAIN_COUNT;
				let l = Point.lerp(a,b,d);
				l.y += Math.sin(d * Math.PI) * this._chainSlack * 32;
				g.renderSprite(this.sprite, l.subtract(c), this.zIndex+2, new Point(1,3), false);
			}
			g.renderSprite(this.sprite, b.subtract(c),this.zIndex + 2, new Point(0,3), false, {"u_color":this.tint});
		}
		
		
	}
}
PigbossKnight.STATE_IDLE = 0;
PigbossKnight.STATE_THROW = 1;
PigbossKnight.STATE_SPINBALL = 2;
PigbossKnight.STATE_BALLWITHDRAW = 3;
PigbossKnight.STATE_BALLCHARGE = 4;

PigbossKnight.CHAIN_COUNT = 20;
PigbossKnight.intro = true;
PigbossKnight.BALL_THROW_SPEED = 8;
PigbossKnight.BALL_RETURN_SPEED = 12;
PigbossKnight.BALL_STUCK_TIME = 4;
PigbossKnight.BALL_PULL = new Curve([
	{x:0,y:0},{x:0.1,y:1},{x:0.2,y:1}, 
	{x:0.24,y:0},{x:0.4,y:0}, 
	{x:0.5,y:1},{x:0.6,y:1}, 
	{x:0.64,y:0},{x:1.0,y:0}
]).normalize();

self["PigbossKnight"] = PigbossKnight;

class PigbossKnightNude extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 56;
		this.sprite = "pigbossnude";
		this.flip = true;
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		
		this._time = 1.5;
		this.force.y = -5;
		this.speed = 6;
		
		game.slow(0.25, 1);
		_player.pause = true;
		
		this.on(["sleep","collideHorizontal"], function(){
			_player.pause = false;
			this.destroy();
		});
	}
	update(){
		if( this._time > 0 ){
			if( this.grounded ){
				let p = 1.0 - Math.clamp01( this._time / 1.5);
				let d = Math.clamp01( p * 3 ) * 5.9;
				
				this.frame.x = Math.mod(d, 4);
				this.frame.y = Math.floor(d/4);
				this._time -= this.delta;
			} else {
				this.frame.x = this.frame.y = 0;
			}
		} else {
			this.flip = false;
			this.addHorizontalForce(this.forward() * this.speed);
			this.frame = PigbossKnightNude.anim_walk.frame(Math.mod( game.time * 2.0, 1.0 ));
			
		}
	}
}
PigbossKnightNude.anim_walk = new Sequence([
	[2,1,0.25],
	[3,1,0.25],
	[0,2,0.25],
	[1,2,0.25]
]);