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
		});
		this.on("hurtBall", function(obj){
			audio.play("block", this.ballObj.position);
			this._ballStun = Game.DELTASECOND;
		});
		this.on("pre_death", function(){
			this.ballObj.destroy();
		});
		this.on("death", function(){
			Item.drop(this,24);
			audio.play("kill");
			this.destroy();
		});
		
		this.parts = {
			"head" : {
				"position" : new Point(),
				"origins" : [new Point(-8,-38), new Point(-6,-38), new Point(-2,-38)],
				"frame" : new Point(0,1),
				"zIndex" : -1
			},
			"arm1" : {
				"position" : new Point(),
				"offset" : [new Vector(-16,32,0), new Vector(-16,0,0), new Vector(16,20,90), new Vector(16,32,90) ],
				"origins" : [new Point(-8,-38), new Point(-2,-38), new Point(4,-38)],
				"frame" : new Point(0,4),
				"zIndex" : 1
			},
			"arm2" : {
				"position" : new Point(),
				"origins" : [new Point(16,-14), new Point(12,-14), new Point(8,-14)],
				"frame" : new Point(2,3),
				"zIndex" : -1
			},
			"leg1" : {
				"position" : new Point(),
				"origins" : [new Point(-8,28), new Point(-2,28), new Point(4,28)],
				"frame" : new Point(0,2),
				"zIndex" : 1
			},
			"leg2" : {
				"position" : new Point(),
				"origins" : [new Point(16,28), new Point(12,28), new Point(8,28)],
				"frame" : new Point(2,2),
				"zIndex" : -1
			}
		};
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(8, this.difficulty);
		this.moneyDrop = Spawn.money(25,this.difficulty);
		
		this.ballObj = new GameObject(x,y);
		this.ballObj.parent = this;
		this.ballObj.width = this.ballObj.height = 32;
		this.ballObj.addModule(mod_combat);
		this.ballObj.position = this.position.scale(1);
		this.ballObj.showDamage = false;
		this.ballObj.on("hurt", function(damage, obj){ this.parent.trigger("hurtBall", damage, obj);  });
		this.ballObj.on("collideObject", function(obj){ this.parent.trigger("collideBall", obj); });
		game.addObject(this.ballObj);
		
		this.speed = 3.0;
		this.attackTime = Game.DELTASECOND * 4;
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
		
		this._walkChangeTimer = Game.DELTASECOND * 2.0;
		this._walkPause = Game.DELTASECOND * 2.0;
		this._walkDirection = 1.0;
	}
	update(){
		if(this.life > 0){
			let dif = this.target().position.subtract(this.position);
			this.flip = dif.x < 0;
			this.ballObj.life = 9999;
			this._ballStun -= this.delta;
			
			if(this.grounded){
				
				if(this._attack > 0){
					
					if(this._attack > 3.0){
						//Warm up
						this.parts.arm1.frame.x = 1;
						this.ballObj.position.x = this.position.x + this.forward() * -24;
						this.ballObj.position.y = this.position.y - 64;
						this._attack -= this.delta;
						
						if(this._attack <= 3.0){
							this._ballPositionStart = this.ballObj.position.scale(1);
							this._ballToss = 0.0;
							
							this._ballDestination = dif.normalize(512).add(this.position);
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
					} else if(Math.abs(this.ballObj.position.x - this.position.x ) > 24){
						//Returning
						if(this._ballStun <= 0){
							this.ballObj.position.y = this.corners().bottom - 16;
							this.ballObj.position.x += (this.ballObj.position.x < this.position.x ? 1 : -1) * this.delta * 2.0 * UNITS_PER_METER;
						}
						this.parts.arm1.frame.x = 3;
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
						this._attack = this.attackTime;
						this._cooldown = Game.DELTASECOND * 4;
					}
				}
				
				if(Math.abs(this.force.x) > 0.5){
					this._walkAnim = Math.mod(this._walkAnim + this.delta * 0.5 * this.force.x * this.forward(), 1.0);
				} else {
					this._walkAnim = Math.lerp(this._walkAnim, 0.5, this.delta);
				}
				
				this.frame.x = ( 1 + Math.sin( this._walkAnim * 6.28 ) ) * 1.45;
				
				//Animate legs
				this.parts.leg1.position.x = Math.sin(this._walkAnim * 6.28) * 4;
				this.parts.leg1.position.y = Math.min( -Math.cos(this._walkAnim * 6.28) * 4, 0);
				this.parts.leg2.position.x = Math.sin(3.14 + this._walkAnim * 6.28) * 4;
				this.parts.leg2.position.y = Math.min( -Math.cos(3.14 + this._walkAnim * 6.28) * 4, 0);
			}
		}
	}
	render(g,c){
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,this.flip,{"u_color":this.tint});
		
		for(let v in this.parts){
			let part = this.parts[v];
			let origin = part.origins[Math.floor(this.frame.x)].scale(this.forward(), 1);
			let rotation = 0;
			
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

self["PigbossKnight"] = PigbossKnight;