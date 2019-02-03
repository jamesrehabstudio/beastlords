Pothead.prototype = new GameObject();
Pothead.prototype.constructor = GameObject;
function Pothead(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "pothead";
	this.speed = 6.3;
	this.deathtrigger = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.guard.active = 1;
	this.guard.omidirectional = 1;
	this.guard.x = -14;
	this.guard.y = -22;
	this.guard.w = 28;
	this.guard.h = 24;
	this.gravity = 0.6;
	
	this.states = {
		"sleep" : 1,
		"phase" : 0,
		"attack" : 0.0,
		"land" : 0.0,
		"hide" : 0.0,
		"cooldown" : Game.DELTASECOND
	};
	
	this.time_attack = Game.DELTASECOND * 1.0;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("deathtrigger" in o){
		this.deathtrigger = o["deathtrigger"];
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.xpDrop = Spawn.xp(4,this.difficulty);
	this.mass = 1.5;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.damageContact = 1.0;
	
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		if(this.states.hide > 0){
			this.states.hide += Game.DELTASECOND * 0.5;
			this.states.hide = Math.min(this.states.hide, Game.DELTASECOND * 1.5);
		}
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("wakeup", function(){
		this.states.sleep = 1;
	});
	this.on("land", function(){
		if(Math.random() > 0.4){
			this.states.hide = Game.DELTASECOND * 1.2;
		} else {
			this.states.land = Game.DELTASECOND * 0.5;
		}
	});
	this.on("pre_death", function(){
		var pot = new Ragdoll(this.position.x, this.position.y);
		pot.sprite = this.sprite;
		pot.frame.x = 0;
		pot.frame.y = 1;
		pot.width = pot.height = 24;
		game.addObject(pot);
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		
		if(Math.random() > 0.7 && this.grounded){
			this.states.hide = Game.DELTASECOND * 1.2;
		}
	});
	this.on("death", function(){
		if(this.deathtrigger){
			Trigger.activate(this.deathtrigger);
		}
		
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Pothead.prototype.update = function(){	
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.sleep){
			this.frame.x = 0;
			this.frame.y = 1;
			if(Math.abs(dir.x) < 140){
				this.states.sleep = 0;
				this.states.hide = Game.DELTASECOND * 0.5;
			}
			
		} else if(!this.grounded){
			this.frame.y = 1;
			this.states.cooldown = Game.DELTASECOND * 2.0;
			this.addHorizontalForce(this.forward() * this.speed * 0.5);
			if(this.force.y < -0.5){
				this.frame.x = 2;
			} else if(this.force.y > 0.5){
				this.frame.x = 4;
			} else{
				this.frame.x = 3;
			}
		} else if(this.states.attack > 0){
			var progress = 1 - (this.states.attack / this.time_attack);
			this.frame = Pothead.anim_attack.frame(progress);
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				this.flip = dir.x > 0;
				this.grounded = false;
				this.force.y = -10;
			}
		} else if(this.states.land > 0){
			this.frame.x = 5;
			this.frame.y = 1;
			this.states.land -= this.delta;
		} else if(this.states.hide > 0){
			//Hide
			this.frame.x = 0;
			this.frame.y = 1;
			if(this.states.hide < Game.DELTASECOND * 0.1){
				//Anticipate release
				this.frame.x = 1;
			}
			this.states.hide -= this.delta;
		} else {
			//Walk
			this.flip = dir.x > 0;
			if(Math.abs(dir.x) > 40 ){
				this.addHorizontalForce(this.forward() * this.speed);
			}
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * 6.0 * this.delta) % 6;
			this.frame.y = 0;
			
			if(Math.abs(dir.x) < 64 ){
				this.states.cooldown -= this.delta;
				if(this.states.cooldown <= 0){
					this.states.cooldown = Game.DELTASECOND * 2.0;
					this.states.attack = this.time_attack;
				}
			}
		}
		
	} else {
		this.guard.active = 0;
		this.frame.x = 0;
		this.frame.y = 2;
		
	}
	
	if(this.frame.y == 1 && (this.frame.x == 0 || this.frame.x == 1)){
		this.guard.h = 34;
	} else {
		this.guard.h = 24;
	}
}

Pothead.anim_attack = new Sequence([
	[5,1,0.2],
	[2,1,0.1],
	[1,2,0.1],
	[1,1,0.1],
	[0,1,0.2],
	[1,1,0.1]
]);
	