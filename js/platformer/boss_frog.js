class BossFrog extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPosition = this.position.scale(1);
		this.width = 40;
		this.height = 40;
		this.sprite = "pigbot";
		
		this.head = new GameObject(x,y-40,d,ops);
		this.body = new GameObject(x,y+32,d,ops);
		
		this.head.width = 128;
		this.head.height = 40;
		this.head.ypos = -40;
		this.head.shake = 0;
		this.head.life = Spawn.life(7, this.difficulty);
		game.addObject(this.head);
		
		this.body.width = 128;
		this.body.height = 64;
		this.body.ypos = 32;
		this.body.shake = 0;
		this.body.life = Spawn.life(7, this.difficulty);
		game.addObject(this.body);
		
		this.body.parent = this.head.parent = this;
		
		this.addModule(mod_combat);
		this.flip = ops.getBool("flip", false);
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(25, this.difficulty);
		this.damage = Spawn.damage(15, this.difficulty);
		this.death_time = 2;
		
		this.force = 0;
		this.speed = 1;
		
		this.alerted = false;
		this.light = 0;
		this.state = 0;
		this.count = 0;
		this.time = 1;
		this.warmup = 0;
		this.timeMax = 1;
		this.setState(BossFrog.STATE_IDLE);
		
		this.laserAngle = 29.0;
		this._lasers = [];
		this._laserHurtTime = 0;
		this._laserHurtIndex = 0;
		
		this.on("laser", function(obj){
			if(obj instanceof Mech){
				obj.trigger("hurt", this, 18);
			}
			/*
			if(obj instanceof Player){
				obj.life -= 2;
				obj.isDead();
			}
			*/
		});
		
		this.on("hurt", function(obj, damage){
			this.force += this.forward() * -8;
		});
		
		this.body.on("collideObject", function(obj){
			this.parent.trigger("armorHit", obj, this);
			if(obj instanceof Mech){
				obj.position.x -= 4 * UNITS_PER_METER * obj.delta;
			}
		});
		this.head.on("collideObject", function(obj){
			this.parent.trigger("armorHit", obj, this);
		});
		
		this.on("armorDeath", function(armor){
			if(armor === this.head){
				game.addObject(new Ragdoll(this.head.position.x, this.head.position.y, false, {
					"flip":this.flip,
					"sprite":"pigbot",
					"rigidbody":false,
					"frameX":1,
					"frameY":0,
					"zIndex":this.zIndex+6,
					"deltaScale": 0.5
					
				}));
			} else if(armor === this.body){
				game.addObject(new Ragdoll(this.body.position.x, this.body.position.y-28, false, {
					"flip":this.flip,
					"sprite":"pigbot",
					"rigidbody":false,
					"zIndex":this.zIndex+6,
					"deltaScale":0.5
				}));
			}
		});
		
		this.on("armorHit", function(obj, armor){
			if(obj instanceof Bullet && obj.team != this.team){
				if(this.alerted) {
					let damage = obj.damage;
					let blocked = false;
					
					if(damage > 0){
						if(armor === this.head) {
							if(this.head.life > 0){
								this.head.shake = 2.0;
								audio.play("block", this.position);
								damage = Math.floor(damage * 0.25);
								blocked = true;
								this.head.life -= damage;
								if(this.head.life <= 0){
									this.trigger("armorDeath", this.head);
									
								}
							}
						}
						if(armor === this.body) {
							if(this.body.life > 0){
								this.body.shake = 2.0;
								audio.play("block", this.position);
								damage = Math.floor(damage * 0.25);
								blocked = true;
								this.body.life -= damage;
								if(this.body.life <= 0){
									this.trigger("armorDeath", this.body);
									
								}
							}
						}
						if(!blocked){
							obj.trigger("hurt");
						}
						
						this.life -= damage;
						this.isDead();
						this.displayDamage(damage);
					}
				}
				obj.trigger("death");
			}
		});
		this.on("death", function(){
			this.head.destroy();
			this.body.destroy();
			this.destroy();
		});
	}
	setState(s){
		this.state = s;
		if(this.state == BossFrog.STATE_IDLE){
			//Wait for player
			this.time = this.count = 0;
			this.timeMax = 1;
		} else if(this.state == BossFrog.STATE_ACTIVATE){
			//and activate
			this.time = this.count = 0;
			this.timeMax = 2;
		} else if(this.state == BossFrog.STATE_CLAW){
			//Claw attack
			this.laserAngle = this.flip ? 180 : 0;
			this.warmup = 2 + Math.randomRange(0.5,0.7);
			this.time = this.count = 0;
			this.timeMax = 5;
		} else if(this.state == BossFrog.STATE_CARPET_BOMB){
			//Missile spread
			this.time = this.count = 0;
			this.warmup = 3.0;
			this.timeMax = 2.5;
		} else if(this.state == BossFrog.STATE_MILLILES){
			//Missile sequence
			this.time = this.count = 0;
			this.timeMax = 0.5;
		}
	}
	nextState(){
		this.setState(Math.floor(Math.randomRange(2,4)));
		//this.setState(BossFrog.STATE_CLAW);
	}
	update(){
		var fix = 32;
		if(this.life > 0){
			if(this.state == BossFrog.STATE_IDLE){
				//Wait for player
				this.head.ypos = -32+fix;
				this.body.ypos = 16+fix;
				if(Math.abs(this.target().position.x - this.position.x) < 160){
					this.setState(BossFrog.STATE_ACTIVATE);
				}
			} else if(this.state == BossFrog.STATE_ACTIVATE){
				//and activate
				this.head.ypos = -32+fix;
				this.body.ypos = 16+fix;
				this.light = Math.lerp(0, 1, this.time / this.timeMax);
				this.time += this.delta;
				if(this.time > this.timeMax){
					this.light = 1;
					this.alerted = true;
					this.nextState();
				}
			} else if(this.state == BossFrog.STATE_CLAW){
				//Claw attack
				this.head.ypos = -72+fix;
				this.body.ypos = 16+fix;
				
				if(this.warmup > 0) {
					if(this.warmup > 2) {
						//move laser
						this.laserAngle += this.delta * -90 * this.forward();
						this.calcLaser();
					}
					this.warmup -= this.delta;
				} else if(this.time < this.timeMax){
					//FRY!
					this.laserHurt();
					this.time += this.delta;
				} else {
					this.nextState();
				}
			} else if(this.state == BossFrog.STATE_CARPET_BOMB){
				//Missile spread
				this.head.ypos = -40+fix;
				this.body.ypos = 16+fix;
				this.time += this.delta;
				if(this.warmup > 0) {
					this.warmup -= this.delta;
				} else if(this.time > this.timeMax){
					//Fire missile
					if(this.count < 3){
						this.fire();
						this.count++;
						this.time = this.timeMax * 0.8;
					} else {
						this.nextState();
					}
				}
			} else if(this.state == BossFrog.STATE_MILLILES){
				//Missile sequence
				this.head.ypos = -32+fix;
				this.body.ypos = 16+fix;
				
				this.time += this.delta;
				if(this.time > this.timeMax){
					//Fire missile
					if(this.count < 3){
						//this.fire();
						this.count++;
						this.time = 0;
					} else {
						this.nextState();
					}
				}
			}
			//Update body parts
			this.head.position.x = this.position.x;
			this.body.position.x = this.position.x;
			
			this.head.position.y = Math.lerp(this.head.position.y, this.position.y+this.head.ypos, this.delta*2);
			this.body.position.y = Math.lerp(this.body.position.y, this.position.y+this.body.ypos, this.delta*2);
			
			//Apply movement
			this.force *= 1 - 0.15 * this.delta * UNITS_PER_METER;
			if(Math.abs(this.position.x - this.initPosition.x) > 32){
				this.force += (this.position.x > this.initPosition.x ? -1 : 1) * this.speed * UNITS_PER_METER * this.delta;
			}
			this.position.x += this.force * UNITS_PER_METER * this.delta;
			
			if(Timer.interval(game.timeScaled, 0.3, game.delta)){
				Background.pushSmoke(this.position.add(new Point(this.forward()*-96,0)), Math.randomRange(24,40), new Point(this.forward()*-4,-3));
			}
		}
		Background.pushLight(this.position, 400, [this.light, this.light, this.light, 1]);
	}
	fire(){
		let ops = new Options();
		let spawnPos = new Point(this.position.x + this.forward() * 56, this.position.y);
		ops["team"] = this.team;
		ops["damage"] = this.damage;
		ops["rotation"] = this.flip ? 180 : 0;
		if(this.state === BossFrog.STATE_CARPET_BOMB){
			spawnPos.x = this.position.x + this.forward() * (56 - this.count * 16);
			spawnPos.y = this.position.y + 20;
			ops["rotation"] = 270;
		}
		let missile = Bullet.createHomingMissile(spawnPos.x, spawnPos.y, ops);
		missile.zIndex = this.zIndex + 4;
		game.addObject(missile);
	}
	laserHurt(){
		this._laserHurtTime -= this.delta;
		if (this._laserHurtTime <= 0) {
			let l = this._lasers[this._laserHurtIndex];
			let o = game.overlaps(l);
			o.forEach(obj => {
				if(l.polyInstersects(obj.bounds().toPolygon())) {
					this.trigger("laser", obj);
				}
			});
			this._laserHurtIndex = (this._laserHurtIndex + 1 ) % this._lasers.length;
			this._laserHurtTime = 0.05;
			shakeCamera(0.05, 3);
		}
	}
	calcLaser(){
		var top = new Line(-9999, this.position.y-96, 9999, this.position.y-80);
		var bot = new Line(-9999, this.position.y+80, 9999, this.position.y+96);
		var norm = Point.fromAngle(this.laserAngle * Math.deg2rad);
		var next = new Line(this.position.add(new Point(this.forward() * -48, 0)), this.position.add(norm.scale(9999)));
		this._lasers = [];
		
		for (let i=0; i < 5; i++) {
			let side = norm.y < 0 ? top : bot;
			let intsec = next.getIntersectionPoint(side);
			this._lasers.push(new Line(next.start, intsec));
			
			norm.y *= -1;
			next = new Line(intsec, this.position.add(norm.scale(9999)));
		}
		
	}
	render(g,c){
		
		if(this.life > 0){
			
			if(this.state === BossFrog.STATE_CARPET_BOMB) {
				//Render reloading missiles
				for(let i=this.count; i < 3; i++) {
					let offset = new Point();
					let delay = -i;
					offset.x = this.forward() * (56 - i * 16) ;
					offset.y = Math.lerp(16,-20, Math.clamp01((3.0+delay)-this.warmup));
					g.renderSprite("bullets", this.body.position.add(offset).subtract(c), this.zIndex+1, new Point(3,3), false, {rotation:270});
				}
			}
			
			if(this.state == BossFrog.STATE_CLAW){
				//Render laser
				let thicknessLerp 	= Math.pingpong01(this.time / this.timeMax);
				let thickness 		= 2 + 6 * Math.clamp01(thicknessLerp * 3);
				let color 			= Math.colorLerp(COLOR_LIGHTNING,[0.3,0.3,1.0,1.0], thicknessLerp * 4);
				this._lasers.forEach(l => {
					g.renderLine(l.start.subtract(c), l.end.subtract(c), thickness, color, this.zIndex+4);
					if(this.warmup <= 0){
						g.renderLine(l.start.subtract(c), l.end.subtract(c), 2, COLOR_WHITE, this.zIndex+5);
					}
				});
				
			}
		}
		
		if(this.body.life > 0){
			let offset = new Point(0, -28);
			if(this.body.shake > 0) {
				offset.x = Math.randomRange(-2,1);
				this.body.shake -= this.delta;
			}
			g.renderSprite(this.sprite, this.body.position.add(offset).subtract(c), this.zIndex+2, new Point(0,0), this.flip);
		}
		if(this.head.life > 0){
			let offset = new Point();
			if(this.head.shake > 0) {
				offset.x = Math.randomRange(-2,1);
				this.head.shake -= this.delta;
			}
			g.renderSprite(this.sprite, this.head.position.add(offset).subtract(c), this.zIndex+1, new Point(1,0), this.flip);
		}
		
		g.renderSprite(this.sprite, this.head.position.subtract(c), this.zIndex, new Point(0,1), this.flip);
		g.renderSprite(this.sprite, this.body.position.add(new Point(0,-28)).subtract(c), this.zIndex-1, new Point(1,1), this.flip);
		
		//this.render_old(g,c);
	}
	render_old(g,c){
		let corn = this.corners();
		
		//Core
		g.color = [1,0,0,1];
		g.drawRect(corn.left-c.x,corn.top-c.y, this.width, this.height, this.zIndex-3);
		
		//Head and body
		g.color = [0,0,.8,1];
		g.drawRect(this.head.position.x-this.head.width*0.5-c.x, this.head.position.y-this.head.height*0.5-c.y, this.head.width, this.head.height, this.zIndex-2);
		g.drawRect(this.body.position.x-this.body.width*0.5-c.x, this.body.position.y-this.body.height*0.5-c.y, this.body.width, this.body.height, this.zIndex-2);
	}
}
BossFrog.STATE_IDLE = 0;
BossFrog.STATE_ACTIVATE = 1;
BossFrog.STATE_CLAW = 2;
BossFrog.STATE_CARPET_BOMB = 3;
BossFrog.STATE_MILLILES = 4;
BossFrog.test = 0.5;
self["BossFrog"] = BossFrog;