class Garmr extends GameObject{
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 80;
		this.height = 96;
		this.origin = new Point(0.5,0.7);
		this.sprite = "garmr";
		self["_garmr"] = this;
		
		this.speed = 3.0;
		this.force = new Point();
		this.friction = 0.1;
		this.gotoPos = new Vector();
		this.start = new Point(x,y);
		
		this.active = false;
		this.closeToBoss = false;
		this.track = null;
		
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
			"rotation" : 0.0,
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
		
		this.addModule( mod_combat );
		this.addModule( mod_boss );
		
		ops = ops || new Options();
		
		if("trigger" in ops){
			this._tid = ops["trigger"];
		}
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(64,this.difficulty);
		this.mass = 5.0;
		this.damage = Spawn.damage(4,this.difficulty);
		this.defenceLight = Spawn.defence(4,this.difficulty);
		
		this.moneyDrop = Spawn.money(40,this.difficulty);
		this.death_time = Game.DELTASECOND * 3;
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
			
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
		this.on("death", function(){
			
			//TODO: Remove this
			let item = new Item(this.boss_starting_position.x, this.boss_starting_position.y);
			item.setName("dodgeflash");
			game.addObject(item);
			
			audio.play("kill");
			
			Item.drop(this,140);
			this.destroy();
		});
		this.on("downstabbed",function(obj,damage){
			if(this.states.current != Garmr.STATE_PUNCH){
				//this.setState(Garmr.STATE_PUNCH);
			}
		});
		this.on(["pre_death","player_death"],function(){
			//var bullets = game.getObjects(HomingBullet);
			var towers = game.getObjects(FlameTower);
			
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
			"animation" : 0,
			"current" : Garmr.STATE_IDLE,
			"time" : 0.0,
			"timeTotal" :Game.DELTASECOND * 2,
			"count" : 0,
			"transition" : 0.0,
			"turnabout" : 0.0,
		}
		
		this.boltDischargeTime = Game.DELTASECOND * 1.5;
		this._boltDischarge = this.boltDischargeTime;
	}
	
	setState(s=0){
		this.states.current = s;
		if(s == Garmr.STATE_IDLE){
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.5;
		} else if(s == Garmr.STATE_PUNCH) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2.5;
			this.states.count = 1;
		} else if(s == Garmr.STATE_FIREBEAM) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 4.5;
		} else if(s == Garmr.STATE_LIGHTNING) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 5;
		} else if(s == Garmr.STATE_BOLTARRAY) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 0.65;
			this.states.count = 12;
		} else if(s == Garmr.STATE_FIREFLOOR) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 0.75;
			this.states.count = 3;
		} else if(s == Garmr.STATE_FIRESKY) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 0.75;
			this.states.count = 3;
		}
	}
	
	fireball (){
		var bomb = new CarpetBomb(this.position.x, this.position.y);
		bomb.damageFire = this.damage;
		bomb.force = new Point(this.forward()*6, -8);
		game.addObject(bomb);
		return bomb;
	}
	
	discharge (force){
		//Create a floating bolt
		this._boltDischarge += this.boltDischargeTime;
		let bolt = new GarmrBolt(this.position.x, this.position.y);
		
		if(force == undefined){
			force = new Point(Math.random()-0.5, Math.random()-0.5).normalize(4.5);
		}
		
		bolt.force = force;
		bolt.damage = Math.floor(this.damage * 0.6);
		game.addObject(bolt);
	
	}
	
	update(){
		//return;
		if(this.life > 0 && this.active){
			
			this.states.time -= this.delta;
			this.states.turnabout -= this.delta;
			
			let v = (game.timeScaled * 0.025) % 1;
			let p = 1 - this.states.time / this.states.timeTotal;
			
			let dir = this.position.subtract(this.target().position);
			
			this.trackRay.isOn = false;
			
			this._boltDischarge -= this.delta;
			if( this._boltDischarge <= 0){
				this.discharge();
			}
			
			if(this.states.current == Garmr.STATE_IDLE){
				//Track the player
				this.gotoPos.xy = _player.position.add(new Point(this.forward()*-76,-56));
				this.gotoPos.z = this.speed;
					
				this.states.animation = 0;
				this.animate(v);
				
				if(Math.abs(this.position.x - this.start.x) > 160){
					this.states.turnabout = Game.DELTASECOND;
				}
				
				if(this.states.turnabout > 0){
					this.flip = this.position.x < this.start.x;
				} else {
					this.flip = dir.x > 0;
				}
				
				if(this.states.time <= 0){
					this.setState(Garmr.STATE_BOLTARRAY);
					//this.setState(Math.floor(Math.random() * 7));
				}
			} else if(this.states.current == Garmr.STATE_BOLTARRAY){
				//Fire one after the other, ricocheting bolts
				
				this.flip = dir.x > 0;
				this.states.animation = 9 + (this.states.count % 2);
				this.animate(p);
				
				if(this.states.time <= 0){
					if(this.states.count > 0 ){
						//Fire Bolt
						this.discharge(dir.normalize(-8));
						this.states.count--;
						this.states.time = this.states.timeTotal;
						this.gotoPos.x = Math.clamp(this.position.x + this.forward() * -24, this.boss_starting_position.x-200, this.boss_starting_position.x+200);
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
						//let bomb = this.fireball();
						//bomb.position.x = this.position.x - 64;
						//bomb.force = new Point(0,5);
						//this.states.count = 0;
					}
				} else {
					this.setState(Garmr.STATE_IDLE);
				}
				
			} else if(this.states.current == Garmr.STATE_FIREBEAM){
				//Beam
				this.gotoPos.xy = this.start.add(new Point(0,-32));
				this.gotoPos.z = this.speed;
				
				if(p < 0.5){
					this.states.animation = 4;
					this.animate(p*3);
				} else {
					let p2 = (p-0.5) * 2;
					this.trackRay.isOn = true;
					this.trackRay.length = 250 * Math.clamp01(p2*5);
					this.states.animation = 5;
					this.animate(p2*1.5);
					this.trackRay.rotation = Math.lerp(-20,60,p2);
				}
			} else if(this.states.current == Garmr.STATE_LIGHTNING){
				//Drop lighting bolts
				this.gotoPos.xy = this.start.add(new Point(0,-32));
				this.gotoPos.z = this.speed;
				
				if(Timer.interval(this.states.time,Game.DELTASECOND*0.5,this.delta)){
					let off = (Math.random()-0.5) * 470;
					let l = new LightningBolt(this.position.x+off, this.position.y-40);
					game.addObject(l);
				}
				
				this.states.animation = 6;
				this.animate(p*8);
			} else if(this.states.current == Garmr.STATE_FIREFLOOR){
				//Missile
				this.gotoPos.x = this.position.x + this.forward()*-20;
				this.gotoPos.y = _player.position.y;
				this.gotoPos.z = this.speed * 0.5;
				this.flip = dir.x > 0;
				
				if(Timer.isAt(this.states.time, this.states.timeTotal*0.5, this.delta)){
					this.fireball();
				}
				
				if(p < 0.5){
					this.states.animation = 7;
					this.animate(p*3);
				} else {
					this.states.animation = 8;
					this.animate((p-0.5)*3);
				}
			} else if(this.states.current == Garmr.STATE_FIRESKY){
				
			}
			
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
			this.trackChest.scale = Math.lerp(1.25,0.93,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-55,10), new Vector(0,-40,45), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.3,0.78,0), new Vector(2.8,0.7,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.1,0.75, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.3,-0.78,0), new Vector(2.8,-0.7,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.1,1.2, progress);
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
		this.trackHead.rotation = Math.lerp(this.trackHead.rotation, Math.PI * this.forward() * this.trackHead.turnStrength, this.delta * 3.75);
		this.trackChest.rotation = Math.lerp(this.trackChest.rotation, this.trackHead.rotation, this.delta * 6.5);
		this.trackBody.rotation = Math.lerp(this.trackBody.rotation, this.trackChest.rotation, this.delta * 3.25);
		
		this.trackHead.position = new Vector(this.position.x, this.position.y, 0);
		this.trackChest.position = Vector.lerp(this.trackChest.position, this.position, this.delta * 12.0);
		this.trackBody.position = Vector.lerp(this.trackBody.position, this.trackChest.position, this.delta * 12.0);
		
		let offset = Vector.rotate(this.trackHead.offset,0,this.trackHead.rotation,0);
		let headModel = this.trackHead.scream ? "garmr_headscream" : "garmr_head";
		
		g.renderMesh(headModel, this.trackHead.position.add(offset).subtract(c), this.zIndex+3+0.001, {
			"rotate" : [0, this.trackHead.rotation, 0]
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
self["Garmr"] = Garmr;

class GarmrBolt extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 12;
		this.zIndex = 20;
		
		this.damage = 3;
		this.time = 8;
		this.addModule(mod_rigidbody);
		
		this.gravity = 0.0;
		this.bounce = 1.0;
		this.collisionReduction = -1.0;
		this.friction = this.friction_y = 0.0;
		this.pushable = false;
		
		this.on("struck", function(){
			this.destroy();
		});
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				let dam = Combat.getDamage();
				dam.light = this.damage;
				obj.hurt(this, dam);
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
		g.color = COLOR_LIGHTNING;
		Renderer.drawRect(
			this.position.x - (this.width * 0.5) - c.x,
			this.position.y - (this.height * 0.5) - c.y,
			this.width,
			this.height,
			this.zIndex
		);
		
	}
}