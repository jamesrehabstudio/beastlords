Ammit.prototype = new GameObject();
Ammit.prototype.constructor = GameObject;
function Ammit(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.sprite = "ammit";
	this.speed = 0.25;
	
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
	
	this.damage = Spawn.damage(4,this.difficulty);
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
					obj.hurt(this, this.damage);
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
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,35);
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
		this.states.cooldown = Game.DELTASECOND * 1.5;
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
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
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
				this.force.x += this.speed * 1.5 * this.delta * (this.flip?-1:1);
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
				this.force.x += this.speed * 2 * this.delta * (this.flip?-1:1);
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
				this.force.x += this.speed * this.delta * (this.flip?-1:1);
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
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
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
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
				this.frame.y = 0;
			} else if(this.states.current == Ammit.STATE_BURST){
				if(this.states.cooldown < 0){
					for(var i=0; i < 5; i++){
						var randomPosition = new Point(Math.random()-.5,Math.random()-.5).scale(32);
						var slime = Spawn.addToList(this.position.add(randomPosition),this.slimes,Slime,5);
						if(slime instanceof GameObject){
							slime.force = new Point(Math.random()-0.5,Math.random()-0.8).normalize(8);
						}
					}
					this.changeState(Ammit.STATE_HIDDEN);
				}
				this.states.cooldown -= this.delta;
				this.frame.x = Math.max((this.frame.x + this.delta * 0.5) % 6, 4);
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