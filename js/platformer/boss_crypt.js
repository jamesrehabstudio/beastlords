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
		"wait" : 0.0
	}
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		var dir = this.position.subtract(obj.position);
		if(this.state != 0){
			this.grounded = false;
			this.force.y = -8;
			this.force.x = 12 * (dir.x>0?1:-1);
			
			if(Math.random() > 0.8){
				this.state
			} else {
				
			}
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
				this.frame = 3;
				this.frame_row = 1;
				game.slow(0.0, Game.DELTASECOND);
			} else if(this.state == 1){
				this.setState(3);
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
		this.frame_row = 2;
		this.frame = 0;
		this.states.wait = Game.DELTASECOND * 1.0;
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.5;
		this.flip = dir.x > 0; 
	} else if(s == 1){
		//Move
		this.states.time = this.states.totalTime = Game.DELTASECOND * 3.0;
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
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.0;
	} else {
		//Something else
	}
	this.state = s;
}

CryptKeeper.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(!this.grounded){
		this.frame_row = 2;
		this.frame = 4;
	} else if(this.states.wait > 0){
		this.states.wait -= this.delta;
	} else if(this.state == 0){
		//Charge at player
		
		this.force.x += 3 * this.speed * this.delta * (this.flip?-1:1);
		
		this.frame_row = 2;
		this.frame = (this.frame + this.delta * 0.2) % 4;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.4 ? 1 : 3);
		}
	} else if(this.state == 1){
		//Move
		this.force.x += this.speed * this.delta * (this.flip?-1:1);
		
		this.frame_row = 1;
		this.frame = (this.frame + this.delta * 0.2) % 6;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.3 ? 0 : 3);
		}
	} else if(this.state == 2){
		//move in shadows
		this.force.x += 2 * this.speed * this.delta * (this.flip?-1:1);
		
		this.frame_row = 0;
		this.frame = 5;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(4);
		}
	} else if(this.state == 3){
		//Disappear into a shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame_row = 0;
		this.frame = Math.max(5 - Math.floor(progress * 6), 0);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(2);
		}
	} else{
		//Emerge out of the shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame_row = 0;
		this.frame = Math.min(Math.floor(progress * 6), 5);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.interactive = true;
			this.setState(Math.random() > 0.8 ? 0 : 1);
		}
	}
	
}