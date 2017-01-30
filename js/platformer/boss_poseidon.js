Poseidon.prototype = new GameObject();
Poseidon.prototype.constructor = GameObject;
function Poseidon(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 64;
	this.sprite = "poseidon";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	this.speed = 0.6;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 1;
	
	o = o || {};
	
	if("difficulty" in o){
		this.difficulty = o["difficulty"]*1;
	}
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = Spawn.life(30,this.difficulty);
	this.lifeMax = this.life;
	this.collideDamage = 5;
	
	this.defencePhysical = 0.3;
	this.defenceFire = 0.0;
	this.defenceSlime = 0.1;
	this.defenceIce = -0.2;
	this.defenceLight = -0.2;
	
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.stun_time = 0;
	this.interactive = false;
	
	this.mass = 6.0;
	this.gravity = 0.4;
	
	this.states = {
		"current" : 0,
		"transition" : 0,
		"transitionTotal" : 0,
		"timer" : 0,
		"timerTotal" : 0,
		"targetX" : 0,
		"startX" : this.position.x
	}
	
	this.on("land", function(){
		this.setState(Poseidon.LAND_STATE);
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			if(this.force.y > 0 && this.states.current == Poseidon.JUMP_STATE){
				obj.hurt(this, this.landDamage);
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt", this.position);
	});
	this.on("downstabbed", function(obj,damage){
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
	});
	this.on("death", function(){
		Item.drop(this,50);
		this.destroy();
	});
}

Poseidon.IDLE_STATE = 0;
Poseidon.TOSS_STATE = 1;
Poseidon.WALK_STATE = 2;
Poseidon.JUMP_STATE = 3;
Poseidon.FIRE_STATE = 4;
Poseidon.BASH_STATE = 5;
Poseidon.RUSH_STATE = 6;
Poseidon.BITE_STATE = 7;
Poseidon.LAND_STATE = 9;
Poseidon.ESCAPE_STATE = 10;

Poseidon.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	
	this.states.current = s;
	if(s == Poseidon.IDLE_STATE){
		this.states.transition = this.states.transitionTotal = 0.0;
		this.states.timer = this.states.timerTotal = Game.DELTASECOND;
	} else if(s == Poseidon.TOSS_STATE){
		this.states.transition = this.states.transitionTotal = Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.3 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.WALK_STATE){
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 1.5 * Game.DELTASECOND;
	} else if(s == Poseidon.JUMP_STATE){
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
		this.states.targetX = _player.position.x;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.FIRE_STATE){
		this.states.transition = this.states.transitionTotal = 1.0 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.6 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.BASH_STATE){
		this.states.transition = this.states.transitionTotal = 0.5 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.RUSH_STATE){
		this.states.transition = this.states.transitionTotal = 0.6 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 1.0 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.BITE_STATE){
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 0.8 * Game.DELTASECOND;
	} else if(s == Poseidon.LAND_STATE){
		shakeCamera(Game.DELTASECOND*0.5, 6);
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
	} else if(s == Poseidon.ESCAPE_STATE){
		this.flip = this.states.startX < this.position.x;
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 1.0 * Game.DELTASECOND;
	}
}
Poseidon.prototype.selectState = function(){
	var dir = this.position.subtract(_player.position);
	
	if(Math.abs(dir.x) > 240){
		var roll = Math.random();
		if(roll < 0.4){
			this.setState(Poseidon.JUMP_STATE);
		} else if(roll < 0.5){
			this.setState(Poseidon.FIRE_STATE);
		} else if(roll < 0.9){
			this.setState(Poseidon.RUSH_STATE);
		} else {
			this.setState(Poseidon.WALK_STATE);
		}
	} else if(Math.abs(dir.x) < 120){
		var roll = Math.random();
		if(roll < 0.5){
			this.setState(Poseidon.BASH_STATE);
		} else if(roll < 0.75){
			this.setState(Poseidon.TOSS_STATE);
		} else {
			this.setState(Poseidon.FIRE_STATE);
		}
	} else {
		var roll = Math.random();
		if(roll < 0.2){
			this.setState(Poseidon.TOSS_STATE);
		} else if(roll < 0.4){
			this.setState(Poseidon.JUMP_STATE);
		} else if(roll < 0.6){
			this.setState(Poseidon.FIRE_STATE);
		} else if(roll < 0.8){
			this.setState(Poseidon.WALK_STATE);
		} else {
			this.setState(Poseidon.RUSH_STATE);
		} 
	}
}
Poseidon.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	Background.pushLight(this.position,200);
	
	if(this.active && this.life > 0){
		
		if(this.states.transition > 0){
			var transitionProgress = 1 - (this.states.transition / this.states.transitionTotal);
			
			if(this.states.current == Poseidon.TOSS_STATE){
				this.frame.x = transitionProgress * 9;
				this.frame.y = 1;
			} else if(this.states.current == Poseidon.JUMP_STATE){
				this.frame.x = transitionProgress * 3;
				this.frame.y = 3;
			}else if(this.states.current == Poseidon.FIRE_STATE){
				this.frame.x = Math.min(transitionProgress * 12, 3);
				this.frame.y = 4;
			}else if(this.states.current == Poseidon.BASH_STATE){
				this.frame.x = Math.min(transitionProgress * 5, 3);
				this.frame.y = 8;
			}else if(this.states.current == Poseidon.RUSH_STATE){
				this.frame.x = Math.min(transitionProgress * 8, 8);
				this.frame.y = 7;
			}
			this.states.transition -= this.delta;
		} else {
			var timerProgress = 1 - (this.states.timer / this.states.timerTotal);
			
			if(this.states.current == Poseidon.IDLE_STATE){
				this.frame.x = (this.frame.x + this.delta * 0.3) % 10;
				this.frame.y = 0;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.TOSS_STATE){
				if(this.states.timer + this.delta >= this.states.timerTotal){
					var bullet = new Bullet(this.position.x, this.position.y+8);
					bullet.team = 0;
					bullet.blockable = 1;
					bullet.force.x = this.forward() * 12;
					bullet.damage = this.damage;
					game.addObject(bullet);
				}
				this.frame.x = Math.min(9 + timerProgress * 2, 10);
				this.frame.y = 1;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.WALK_STATE){
				this.flip = this.position.x > _player.position.x;
				this.force.x += (this.flip?-1:1) * this.delta * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 8;
				this.frame.y = 2;
				if(this.states.timer <= 0){
					this.setState(Poseidon.BASH_STATE);
				}
			} else if(this.states.current == Poseidon.JUMP_STATE){
				if(this.grounded){
					this.grounded = false;
					this.force.y = -10;
				} else {
					this.frame.x = 3;
					if(this.force.y < -1) this.frame.x = 4;
					if(this.force.y > 1) this.frame.x = 5;
					var distance = this.position.x - this.states.targetX;
					if(Math.abs(distance) > 32){
						this.force.x += this.delta * 1.5 * this.speed * (distance<0?1:-1);
					}
				}
			} else if(this.states.current == Poseidon.FIRE_STATE){
				if(this.states.timer + this.delta >= this.states.timerTotal){
					var bullet = new Bullet(this.position.x, this.position.y);
					bullet.team = 0;
					bullet.frames = [5,6,7];
					bullet.frame.y = 1;
					bullet.force.x = this.forward() * 6;
					bullet.blockable = 0;
					bullet.damage = Math.round(this.damage*1.5);
					bullet.explode = true;
					game.addObject(bullet);
				}
				this.frame.x = Math.min(4 + timerProgress*6, 7);
				this.frame.y = 4;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.BASH_STATE){
				this.frame.x = Math.min(4 + timerProgress*8, 8);
				this.frame.y = 8;
				if(timerProgress < 0.5){
					this.strike(new Line(16,-8,64,24));
				}
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.RUSH_STATE){
				this.force.x += (this.flip?-1:1) * this.delta * 1.5 * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 6;
				this.frame.y = 6;
				if(this.states.timer <= 0 || (Math.abs(dir.x) < 64 && Math.abs(dir.y) < 32)){
					this.setState(Poseidon.BITE_STATE);
				}
			} else if(this.states.current == Poseidon.BITE_STATE){
				this.frame.x = Math.min(timerProgress*7, 6);
				this.frame.y = 5;
				if(timerProgress > 0.2 && timerProgress < 0.5){
					this.strike(new Line(16,-8,64,24), {"blockable":false});
				}
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.LAND_STATE){
				this.frame.x = Math.min(6+timerProgress*6, 11);
				this.frame.y = 3;
				if(this.states.timer <= 0){
					this.setState(Poseidon.IDLE_STATE);
				}
			} else if(this.states.current == Poseidon.ESCAPE_STATE){
				this.force.x += (this.flip?-1:1) * this.delta * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 8;
				this.frame.y = 2;
				if(this.states.timer <= 0){
					this.selectState();
				}
			}
			
			this.states.timer -= this.delta;
		}
	}
}