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
		
		this.on("hurt", function(damage, obj){
			if(this._attack < 2.0){
				this._attack = 0.0;
				this._ballToss = 0.0;
			}
			audio.play("hurt",this.position);
		});
		this.on("block", function(obj){
			audio.play("block", this.position);
			this._retreat = Math.max(this._retreat, Game.DELTASECOND * 0.4);
		});
		this.on("collideBall", function(obj){
			if(obj.hasModule(mod_combat) && obj.team != this.team){
				let multiplier = (this._ballToss > 0 && this._ballToss < 1) ? 1.5 : 1;
				obj.hurt(this, this.getDamage(multiplier));
			}
			if(obj instanceof DamageTrigger && this._spike){
				this.createSpike(obj);
				this._spike = false;
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
				"zIndex" : 1
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
		this.life = this.lifeMax = Spawn.life(8, this.difficulty);
		this.defencePhysical = 0;
		this.defenceFire = Spawn.defence(2,this.difficulty);
		this.defenceSlime = Spawn.defence(2,this.difficulty);;
		this.defenceIce = Spawn.defence(2,this.difficulty);;
		this.defenceLight = Spawn.defence(2,this.difficulty);;
		
		this.moneyDrop = 0;
		this.xpDrop = Spawn.xp(25,this.difficulty);
		
		this.ballObj = new GameObject(x,y);
		this.ballObj.parent = this;
		this.ballObj.width = this.ballObj.height = 32;
		this.ballObj.force_y = 0;
		this.ballObj.addModule(mod_combat);
		this.ballObj.position = this.position.scale(1);
		this.ballObj.showDamage = false;
		this.ballObj.hurtByDamageTriggers = false;
		this.ballObj.on("hurt", function(damage, obj){ this.parent.trigger("hurtBall", damage, obj);  });
		this.ballObj.on("collideObject", function(obj){ this.parent.trigger("collideBall", obj); });
		game.addObject(this.ballObj);
		
		this.speed = 3.0;
		this.attackTime = Game.DELTASECOND * 4;
		this.attackTime2 = Game.DELTASECOND * 8;
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
		
		this._cooldown = Game.DELTASECOND * 4;
		this._attack = 0.0;
		this._type = 0;
		this._count = 4;
		this._duck = false;
		
		this._spike = false;
		
		this._walkChangeTimer = Game.DELTASECOND * 2.0;
		this._walkPause = Game.DELTASECOND * 2.0;
		this._walkDirection = 1.0;
	}
	update(){
		if( this.active ) {
			
			if(this.life > 0){
				let dif = this.target().position.subtract(this.position);
				this.flip = dif.x < 0;
				this.ballObj.life = 9999;
				this._ballStun -= this.delta;
				
				if(this._attack > 0){
					
					if(this._attack > 3.0){
						//Warm up
						if( this._type == 0 ){
							//Hold ball
							this.parts.arm1.frame.x = 1;
							this.ballObj.position.x = this.position.x + this.forward() * -24;
							this.ballObj.position.y = this.position.y - 64;
						} else {
							//Spin ball
							let angle = Math.mod(this._attack * 6.0, Math.PI * 2) - 1.2;
							let radius = 64;
							
							this.parts.arm1.frame.x = 1;
							this.ballObj.position.x = this.position.x + Math.sin(angle) * radius;
							this.ballObj.position.y = this.position.y + Math.cos(angle) * radius - 48;
						}
						this._attack -= this.delta;
						
						if(this._attack <= 3.0){
							//Target and throw
							this._ballPositionStart = this.ballObj.position.scale(1);
							this._ballToss = 0.0;
							
							if( this._type == 0 ){
								this._ballDestination = dif.normalize(512).add(this.position);
							} else {
								this._ballDestination = this.position.add( new Point( this.forward()*128, -256 ) );
							}
							
							this._spike = true;
							let p = game.t_raytrace(this.position, this._ballDestination);
							if(p instanceof Point){ this._ballDestination = p;}
							this._ballDistance = this.position.subtract(this._ballDestination).magnitude();
							
							
						}
					} else if(this._ballToss < 1.0) {
						//Throwing
						let tspeed = this.delta * (160.0 / this._ballDistance); 
						this._ballToss += tspeed;
						this.ballObj.position = Point.lerp(this._ballPositionStart, this._ballDestination, this._ballToss);
						this.parts.arm1.frame.x = 2;
					} else if(this._attack > 2.0){
						//Pause for a moment
						this._attack -= this.delta;
						this.ballObj.force_y += this.delta * UNITS_PER_METER;
						let fall_speed = this.ballObj.force_y * UNITS_PER_METER * this.delta;
						
						this.ballObj.position.y = Math.min(this.ballObj.position.y + fall_speed, this.corners().bottom - 16)
					} else if(Math.abs(this.ballObj.position.x - this.position.x ) > 24){
						//Returning
						if(this._ballStun <= 0){
							this.ballObj.position.y = this.corners().bottom - 16;
							this.ballObj.position.x += (this.ballObj.position.x < this.position.x ? 1 : -1) * this.delta * 2.0 * UNITS_PER_METER;
						}
						this.parts.arm1.frame.x = 3;
						this._duck = true;
						this.ballObj.force_y = 0;
					} else {
						//Pause once again
						this._attack -= this.delta;
					}
				} else {
					this.ballObj.position.x = this.position.x + this.forward() * -24;
					this.ballObj.position.y = this.position.y + 24;
					this.parts.arm1.frame.x = 0;
					
					if(this._retreat > 0){
						//Walking backwards
						this._retreat -= this.delta;
						if(this.position.x - this.startPosition.x < 88 ){
							this.addHorizontalForce(this.speed * 3 * -this.forward());
						}
					} else {
						//Walking
						if(this._walkPause > 0){
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
					}
					
					this._cooldown -= this.delta;
					
					if(this._cooldown <= 0){
						this._count--;
						this._spike = false;
						
						if( this._count > 0 ){
							this._attack = this.attackTime;
							this._type = 0;
						} else {
							this._count = 4;
							this._attack = this.attackTime2;
							this._type = 1;
						}
						this._cooldown = Game.DELTASECOND * 4;
						
					}
				}
				
				if(Math.abs(this.force.x) > 0.5){
					this._walkAnim = Math.mod(this._walkAnim + this.delta * 0.5 * this.force.x * this.forward(), 1.0);
				} else {
					this._walkAnim = Math.lerp(this._walkAnim, 0.5, this.delta);
				}
				
				if(this._duck){
					this.parts.body.position = Point.lerp(this.parts.body.position, new Point(0,24), this.delta * 2);
				} else {
					this.parts.body.position = Point.lerp(this.parts.body.position, new Point(0,0), this.delta * 5);
				}
				this.parts.arm1.position = Point.lerp(this.parts.arm1.position, this.parts.body.position, this.delta * 8);
				this.parts.arm2.position = Point.lerp(this.parts.arm2.position, this.parts.body.position, this.delta * 8);
				this.parts.head.position = Point.lerp(this.parts.head.position, this.parts.body.position, this.delta * 6);
				this.guard.y = this.parts.body.position.y - 28;
				this._duck = false;
				
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
			g.renderSprite(this.sprite, this.ballObj.position.subtract(c),this.zIndex + 2, new Point(0,3), false, {"u_color":this.tint});
		}
		
		
	}
}
PigbossKnight.intro = true;

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