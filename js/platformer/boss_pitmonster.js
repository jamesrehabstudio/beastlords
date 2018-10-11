class PitMonster extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.initPos = new Point(x, y);
		this.sprite = "pitmonster";
		this.width = 50;
		this.height = 52;
		this.frame = new Point(0,1);
		
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = this.lifeMax = Spawn.life(15, this.difficulty);
		this.damage = Spawn.damage(3, this.difficulty);
		
		this.on("hurt", function(obj){
			audio.play("hurt", this.position);
			
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
				this._attack_arm = 0.0;
				Combat.hit.apply(obj, [this, Options.convert({"multiplier":0.25}), new Point]);
			}
		});
		this.on("arm_struck_right", function(obj){
			if(this.life > 0 && obj instanceof Player){
				this._attack_arm = 0.0;
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
		
		this.arm_left = {
			"position" : new Point(),
			"parts" : new Array()
		};
		this.arm_right = {
			"position" : new Point(),
			"parts" : new Array()
		};
		
		
		for(let arm = 0; arm < 2; arm++){
			let carm = arm == 0 ? this.arm_left : this.arm_right;
			
			carm.position = this.position.scale(1);
			
			for(let part = 0; part < 12; part++){
				let p = new GameObject();
				p.position = carm.position.scale(1);
				p.parent = this;
				p.sprite = this.sprite;
				p.frame = part == 0 ? new Point(0,0) : new Point(1,0);
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
		this._active_arm = 0;
		this._phase = 0;
		this._pull_spikes_down = 0.0;
		this._attack_arm = 0.0;
		this._drag_arm = 0.0;
		this._transition = 0.0;
		this._cooldown = 0.0;
		this._target = new Point(x,y);
	}
	update(){
		
		if(this.life > 0){
			if(this.active){
				
				let carm = this._active_arm == 0 ? this.arm_left : this.arm_right;
				let darm = this._active_arm == 0 ? this.arm_right : this.arm_left;
				
				if(this._slimeCooldown <= 0){
					this._slimeAttack += this.delta;
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
				
				if(this._pull_spikes_down > 0){
					this._pull_spikes_down -= this.delta;
					this._slimeCooldown = 1.0;
					this._slimeAttack = 0.0;
					
					if(this._pull_spikes_down > 5.0){
						this.arm_left.position = this.position.add(new Point(-32,32));
						this.arm_right.position = this.position.add(new Point(32,32));
					} else if(this._pull_spikes_down > 2.0) {
						this.arm_left.position = this.position.add(new Point(-64,PitMonster.SPIKE_POS_UP));
						this.arm_right.position = this.position.add(new Point(64,PitMonster.SPIKE_POS_UP));
					} else if(this._pull_spikes_down > 0) {
						this.arm_left.position = this.position.add(new Point(-64,PitMonster.SPIKE_POS_DOWN));
						this.arm_right.position = this.position.add(new Point(64,PitMonster.SPIKE_POS_DOWN));
						this.spikes.position.y = this.position.y + Math.lerp(PitMonster.SPIKE_POS_DOWN, PitMonster.SPIKE_POS_UP, this._pull_spikes_down * 0.5);
					} else {
						this.spikes.position.y = this.position.y + PitMonster.SPIKE_POS_DOWN;
						this._phase = 1;
						//Fill in area
						let c = this.spikes.corners();
						for(let x = c.left; x < c.right; x++) for(let y = c.top + 16; y < c.bottom - 16; y++) {
							game.setTile(x,y,game.tileCollideLayer,1024);
						}
					}
					
				} else if(this._attack_arm > 0){
					//Swing arm
					
					if(this._transition > 0){
						this._transition -= this.delta;
						this._target = this.target().position.subtract(this.position).scale(1.5).add(this.position);

						carm.position = this.position.scale(1);
						darm.position = this.position.scale(1);
					} else {
						this._attack_arm -= this.delta;
						carm.position = this._target.scale(1);
						darm.position = this.position.scale(1);
					}
				} else if(this._drag_arm > 0){
					//Drag arm down side
					let xf = this._active_arm == 0 ? -1 : 1;
					let _start = this.position.add( new Point( xf * 224, -224 ));
					let _end = this.position.scale(1);
					
					if(this._transition > 0){
						this._transition -= this.delta;
					} else {
						this._drag_arm -= this.delta;
					}
					
					let p = 1 - this._drag_arm / 2.0;
					
					if(this._transition > 0.5){
						carm.position = new Point(_start.x, this.position.y);
						darm.position = this.position.scale(1);
					} else {
						carm.position = Point.lerp(_start, _end, p);
						darm.position = this.position.scale(1);
					}
					
				} else {
					//Idle
					this._cooldown -= this.delta;
					this.arm_left.position.y = this.position.y + 32;
					this.arm_right.position.y = this.position.y + 32;
					
					if(this._cooldown <= 0){
						this._cooldown = 2.0;
						
						if(Math.random() > 0.5){
							this._active_arm = this.target().position.x > this.position.x;
							this._drag_arm = 2.0;
							this._attack_arm = 0.0;
							this._transition = 1.5;
							if(this._active_arm > 0){
								audio.play("cracking", this.position.add(new Point(160,-160)));
							} else {
								audio.play("cracking", this.position.add(new Point(-160,-160)));
							}
							
						} else {
							this._drag_arm = 0.0;
							this._attack_arm = 2.0;
							this._transition = 1.0;
							this._active_arm = Math.random() > 0.5 ? 0 : 1;
						}
					} 
					
				}
				
			} else {
				//hide
				this.arm_left.position = this.position.add(new Point(-80, 0));
				this.arm_right.position = this.position.add(new Point(80, 0));
			}
		} else {
			//Dying
			this.arm_left.position = this.position.scale(1);
			this.arm_right.position = this.position.scale(1);
		}
		
		//Update arm positions
		for(let a = 0; a < 2; a++){
			for(let i = 0; i < this.arm_left.parts.length; i++){
				let carm = a == 0 ? this.arm_left : this.arm_right;
				
				let origin = new Point( Math.lerp(this.position.x, carm.position.x, 0.9), this.position.y + 24 );
				let destination = Point.lerp( carm.position, origin, Math.clamp01( i / this.arm_left.parts.length ) );
						
				carm.parts[i].tint = this.tint;
				carm.parts[i].position = Point.lerp(
					carm.parts[i].position,
					destination,
					this.delta
				);
			}
		}
		
	}
	idle(){}
	fireSlime(){
		let b = new PitMonsterSlime(this.position.x, this.position.y);
		b.damageSlime = Math.round( this.damage * 0.7 );
		b.force = new Point( (Math.random()-0.5) * 5, -8 - Math.random() * 5 );
		
		game.addObject(b);
	}
}
PitMonster.SPIKE_POS_UP = -336;
PitMonster.SPIKE_POS_DOWN = -160;

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