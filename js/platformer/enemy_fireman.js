Fireman.prototype = new GameObject();
Fireman.prototype.constructor = GameObject;
function Fireman(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	this.zIndex = 1;
	
	this.sprite = "flameman";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 2;
	this.bullet = null;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(5,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"current" : 0,
		"cooldown" : 50
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
Fireman.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.current == 0){
			//idle
			this.frame = new Point();
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet = new FiremanFlame(this.position.x,this.position.y + this.height*0.5);
				this.bullet.flip = this.flip;
				this.bullet.damage = this.damage;
				this.bullet.time = Game.DELTASECOND * 5;
				game.addObject(this.bullet);
				
				this.states.current = 1;
				this.states.cooldown = Game.DELTASECOND * 2;
			}
		} else if(this.states.current == 1){
			//charge
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet.phase = 1;
				this.states.current = 2;
				this.states.cooldown = Game.DELTASECOND * 2;
				this.bullet.time = Game.DELTASECOND * 3;
			}
		} else if(this.states.current == 2){
			//move ahead
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet.phase = 2;
				this.bullet.force.x = 9 * (this.bullet.flip ? -1 : 1);
				this.states.current = 3;
				this.states.cooldown = Game.DELTASECOND * 1;
				this.bullet.time = Game.DELTASECOND * 2;
			}
		} else if(this.states.current == 3){
			//fire
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 4;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 4){
			//nude
			this.frame = new Point(0,2);
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 5;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 5){
			//regrow
			this.frame = new Point();
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 0;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		}
	}
	
	Background.pushLight( this.position, 200, COLOR_FIRE );
}

 

FiremanFlame.prototype = new GameObject();
FiremanFlame.prototype.constructor = GameObject;
function FiremanFlame(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	this.zIndex = 0;
	
	this.phase = 0;
	this.basePosition = new Point(x,y);
	this.transformSpeed = 0.05;
	this.time = Game.DELTASECOND * 5;
	this.damage = 1;
	this.force = new Point();
	this.extraLift = 0;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
		}
	});
}

FiremanFlame.prototype.update = function(){
	if(this.phase == 0){
		this.width = Math.lerp(this.width, 64, this.delta * this.transformSpeed);
		this.height = Math.lerp(this.height, 144, this.delta * this.transformSpeed);
		this.position.y = this.basePosition.y - (this.height / 2);
	} else if(this.phase == 1){
		this.width = Math.lerp(this.width, 32, this.delta * this.transformSpeed);
		this.height = Math.lerp(this.height, 32, this.delta * this.transformSpeed);
		this.extraLift = Math.lerp(this.extraLift, -12, this.delta * this.transformSpeed);
		this.position.y = this.extraLift + (this.basePosition.y - (this.height / 2));
		
		var front = this.basePosition.x + (this.flip ? -48 : 48);
		this.position.x = Math.lerp(this.position.x, front, this.delta * this.transformSpeed);
	}
	
	this.time -= this.delta;
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	
	if(this.time <= 0){
		this.destroy();
	}
	
	Background.pushLight( this.position, Math.max(this.width,this.height)*2, [1,0.7,0,1] );
}
	
FiremanFlame.prototype.render = function(g,c){
	g.color = [1.0,0.7,0.0,1.0];
	g.scaleFillRect(
		(this.position.x - this.width*0.5) - c.x,
		(this.position.y - this.height*0.5) - c.y,
		this.width, this.height
	);
}