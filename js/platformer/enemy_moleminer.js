Moleminer.prototype = new GameObject();
Moleminer.prototype.constructor = GameObject;
function Moleminer(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 24;
	this.sprite = "moleminer";
	this.speed = 0.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"blocking" : 0.0,
		"escape" : 0,
		"attack" : 0.0,
		"charge" : 0.0,
		"leap" : 0.0,
		"backoff" : 0.0,
		"cooldown" : Game.DELTASECOND
	};
	this.times = {
		"blocking" : Game.DELTASECOND * 0.5,
		"escape" : Game.DELTASECOND * 0.2,
		"attack" : Game.DELTASECOND * 2.0,
		"charge" : Game.DELTASECOND * 2.0,
		"leap" : Game.DELTASECOND * 2.0,
		"backoff" : Game.DELTASECOND * 2.00,
		"cooldown" : Game.DELTASECOND * 2.0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.defenceFire = Spawn.defence(1,this.difficulty);
	this.defenceIce = Spawn.defence(-1,this.difficulty);
	this.mass = 1.0;
	
	this.guard.active = true;
	this.guard.y = -16;
	this.guard.h = 20;
	
	this.on("collideHorizontal", function(x){
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		
		this.states.escape = this.times.escape;
		this.force.x = -5 * this.forward();
		this.force.y = -6;
		this.grounded = false;
		
		if(Math.random() > 0.6){
			this.states.backoff = this.times.backoff;
		}
	});
	this.on("block", function(obj){
		audio.play("block",this.position);
		var dir = this.position.subtract( obj.position );
		this.states.blocking = this.times.blocking;
		this.force.x = 5 * (dir.x > 0 ? 1 : -1);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Moleminer.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.guard.active = true;
		this.criticalChance = 0.0;
		
		if(this.states.leap > 0){
			var progress = 1 - (this.states.leap / this.times.leap);
			this.states.leap -= this.delta;
			this.states.blocking = 0;
			this.frame = Moleminer.anim_leap.frame(progress);
			
			if(this.frame.y == 2 || this.frame.y == 3){
				this.strike(new Line(12,-6,30,12));
				this.criticalChance = 1.0;
			}
			if(progress > 0.3){
				this.guard.active = false;
			}
			if(Timer.isAt(this.states.leap,this.times.leap*0.7,this.delta)){
				this.force.x = this.forward() * 6;
				this.force.y = -6;
				this.grounded = false;
			}
		} else if(this.states.blocking > 0){
			this.frame.x = 4;
			this.frame.y = 0;
			this.states.blocking -= this.delta;
		} else if(this.states.attack > 0){
			var progress = 1 - (this.states.attack / this.times.attack);
			this.frame = Moleminer.anim_attack.frame(progress);
			this.states.attack -= this.delta;
			this.guard.active = false;
			if(this.frame.y == 1 || this.frame.y == 2 || this.frame.y == 5){
				this.strike(new Line(12,-10,26,-6));
			}
			if(this.states.attack <= 0 && Math.random() > 0.5){
				this.states.backoff = this.times.backoff;
			}
		} else if(this.states.charge > 0){
			this.force.x += this.forward() * this.speed * this.delta * 2.0;
			this.frame.x = 0;
			this.frame.y = (this.frame.y + this.delta * Math.abs(this.force.x) * 0.15) % 4;
			
			if(this.atLedge()){
				this.states.charge = 0;
				this.force.x = 0;
			}
			
			if(Math.abs(dir.y) < 32 && _player.grounded){
				if(Math.abs(dir.x) < 64){
					this.states.charge = 0;
					this.states.leap = this.times.leap;
					this.force.x = 0;
				}
			} else {
				this.states.charge -= this.delta;
			}
		} else if(this.states.escape > 0) {
			if(this.grounded){
				this.frame.x = 4;
				this.frame.y = 4;
				this.states.escape -= this.delta;
			} else {
				this.frame.x = 4;
				this.frame.y = this.force.y > 0 ? 3 : 2;
			}
		} else if(!this.grounded){
			//Do nothing while falling
			this.frame.x = 2;
			this.frame.y = 1;
		} else {
			//Walking
			if(this.atLedge()){
				this.states.backoff = this.times.backoff;
			}
			
			var direction = 1;
			if(this.states.backoff > 0){
				direction = -1;
				this.states.backoff -= this.delta;
				if(this.atLedge(this.forward()*-1)){
					this.states.backoff = 0;
				}
				if(this.states.backoff <= 0){
					if(Math.abs(dir.x) > 80 && Math.abs(dir.y) < 32){
						this.states.charge = this.times.charge;
					}
				}
			}
			this.flip = dir.x > 0;
			this.force.x += this.forward() * this.speed * this.delta * direction;
			this.frame.x = 0;
			this.frame.y = (this.frame.y + this.delta * Math.abs(this.force.x) * 0.15) % 4;
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				if(Math.abs(dir.x) > 80 && Math.abs(dir.y) < 32){
					this.states.charge = this.times.charge;
					this.flip = dir.x > 0;
				} else if(Math.abs(dir.x) < 64 && Math.abs(dir.y) < 32){
					this.states.attack = this.times.attack;
					this.flip = dir.x > 0;
				}
				this.states.cooldown = this.times.cooldown;
			}
		}
		
	} else{
		//dead
		this.frame.x = 3;
		this.frame.y = 0;
	} 
}

Moleminer.anim_leap = new Sequence([
	[1,0,0.3],
	[1,1,0.1],
	[1,2,0.05],
	[1,3,0.05],
	[1,4,0.5]
]);
Moleminer.anim_attack = new Sequence([
	[3,0,0.2],
	[3,1,0.05],
	[3,2,0.1],
	[3,3,0.2],
	[3,4,0.2],
	[3,5,0.1],
	[3,6,0.4],
]);