CryptKeeper.prototype = new GameObject();
CryptKeeper.prototype.constructor = GameObject;
function CryptKeeper(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 56;
	this.sprite = "cryptkeeper";
	this.speed = 0.3;
	//this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("hurtable" in o){
		this.hurtable = o["hurtable"] * 1;
	}
	
	this.life = Spawn.life(5,this.difficulty);
	this.lifeMax = this.life;
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.8;
	
	this.state = 0;
	this.states = {
		"time" : 0.0,
		"totalTime" : 0.0,
		"wait" : 0.0,
		"breathcooldown" : 0.0,
		"yettojumped" : true
	}
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		var dir = this.position.subtract(obj.position);
		if(this.state != 0){
			this.grounded = false;
			this.force.y = -8;
			this.force.x = 12 * (dir.x>0?1:-1);
			
			if(Math.random() > 0.6){
				this.setState(0);
			} else {
				
			}
		} else{
			this.force.x = (this.force.x > 0 ? -8 : 8);
			this.setState(3)
			this.states.wait = Game.DELTASECOND * 0.5;
		}
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.state == 0){
				//Charging and caught player
				obj.hurt(this, this.damage);
				obj.trigger("guardbreak", this);
				obj.statusEffects.stun = Game.DELTASECOND * 3;
				this.states.time = 0;
				this.states.wait = Game.DELTASECOND;
				this.frame.x = 3;
				this.frame.y = 1;
				game.slow(0.0, Game.DELTASECOND);
			} else if(this.state == 1){
				if(Math.random()>0.8){
					this.setState(5);
				} else {
					this.setState(3);
				}
			}
		}
	});
	this.on("collideHorizontal", function(x){
		if(this.state == 1 || this.state == 2){
			this.flip = !this.flip;
		}
	});
}
CryptKeeper.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	if(s == 0){
		//Charge
		this.frame.y = 2;
		this.frame.x = 0;
		this.states.wait = Game.DELTASECOND * 0.5;
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.5;
		this.states.yettojumped = true;
		this.flip = dir.x > 0; 
	} else if(s == 1){
		//Move
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	} else if(s == 2){
		//Shadow move
		this.flip = dir.x > 0; 
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	} else if(s == 3){
		//Enter shadow
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.0;
		this.interactive = false;
	} else if(s == 4){
		//Exit shadow
		this.states.time = this.states.totalTime = Game.DELTASECOND * 0.7;
	} else {
		//Breath smoke
		this.flip = dir.x > 0;
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	}
	this.state = s;
}

CryptKeeper.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.states.breathcooldown -= this.delta;
	
	if(!this.grounded){
		this.frame.y = 2;
		this.frame.x = 4;
	} else if(this.states.wait > 0){
		this.states.wait -= this.delta;
	} else if(this.state == 0){
		//Charge at player
		
		this.force.x += 3 * this.speed * this.delta * (this.flip?-1:1);
		
		this.frame.y = 2;
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		
		this.states.time -= this.delta;
		if(this.states.yettojumped && Math.abs(dir.x) < 64 && this.grounded){
			this.states.yettojumped = false;
			if(this.difficulty < 1 || Math.random() > 0.5){
				this.grounded = false;
				this.force.y = -8;
			}
		}
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.4 ? 1 : 3);
		}
	} else if(this.state == 1){
		//Move
		this.force.x += this.speed * this.delta * (this.flip?-1:1);
		
		this.frame.y = 1;
		this.frame.x = (this.frame.x + this.delta * 0.2) % 6;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.6 ? 0 : 3);
		}
		if(Math.abs(dir.x) < 64 && this.states.breathcooldown <= 0){
			this.setState(5);
		}
	} else if(this.state == 2){
		//move in shadows
		this.force.x += 2 * this.speed * this.delta * (this.flip?-1:1);
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = 5;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(4);
		}
		if(progress <= 0.5 && this.difficulty > 0 && Math.abs(dir.x) < 64){
			this.setState(4);
		}
	} else if(this.state == 3){
		//Disappear into a shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = Math.max(5 - Math.floor(progress * 6), 0);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(2);
		}
	} else if(this.state == 4){
		//Emerge out of the shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = Math.min(Math.floor(progress * 6), 5);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.interactive = true;
			this.setState(Math.random() > 0.8 ? 0 : 1);
		}
	} else{
		//Breath smoke
		this.force.x = 0;
		var progress = this.states.time / this.states.totalTime;
		this.frame = CryptKeeper.anim_smoke.frame(1-progress);
		
		if(progress < 0.4){
			this.strike(new Line(24,-16,56,8),"hurt",this.damage);
		}
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.states.breathcooldown = Game.DELTASECOND * 6;
			this.setState(1);
		}
	}
}

CryptKeeper.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if(this.state == 5){
		var progress = this.states.time / this.states.totalTime;
		if(progress < 0.45){
			var sprog = 1 - (progress / 0.45);
			var sframe = new Point(sprog*6,4);
			var offset = new Point(this.flip?-48:48, 8);
			g.renderSprite(this.sprite,this.position.add(offset).subtract(c),this.zIndex+1,sframe,this.flip);
		}
		
	}
}

CryptKeeper.anim_smoke = new Sequence({
	0.0 : [0,3],
	0.1 : [1,3],
	0.5 : [2,3],
	0.55 : [3,3],
	0.6 : [4,3]
});