BookReptile.prototype = new GameObject();
BookReptile.prototype.constructor = GameObject;
function BookReptile(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "bookreptile";
	this.speed = 15.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 2,
		"rest" : Game.DELTASECOND * 3,
		"carryon" : Game.DELTASECOND * 2,
		"spawn" : Game.DELTASECOND * 0.2
	}
	
	this.states = {
		"missile" : false,
		"wakingup" : 1,
		"attack" : 0,
		"rest" : 0,
		"spawn" : this.times.spawn
	}
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.mass = 1;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	this.xpDrop = Spawn.xp(3,this.difficulty);
	this.pushable = false;
	this.force.y = -12;
	this.mForce = new Point();
	
	this.on(["collideHorizontal", "collideVertical"], function(h){
		this.states.missile = false;
	});
	this.on("collideObject", function(obj){
		if(this.states.missile){
			if(obj instanceof Player){
				obj.hurt(this);
				this.life = 0;
				this.destroy();
			}
		}
	});
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		Item.drop(this,4);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
	});
}

BookReptile.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.states.missile){
			this.frame.x = 0;
			this.frame.y = 0;
			
			this.force.x = this.mForce.x;
			this.force.y = this.mForce.y;
		} else if(this.states.wakingup > 0){
			this.interactive = false;
			this.frame.x = this.force.y < 0 ? 0 : 1;
			this.frame.y = 0;
			
			if(this.grounded){
				this.states.wakingup = 0;
			}
		} else if( this.states.spawn > 0) {
			this.interactive = true;
			var p = 1 - this.states.spawn / this.times.spawn;
			this.frame.x = 2 + p * 3;
			this.frame.y = 0;
			this.states.spawn -= this.delta;
			if(this.states.spawn <= 0){
				this.force.y = -9;
			}
		} else if( this.states.attack > 0) {
			//Leap and swing at the player
			this.frame.x = Math.min(this.frame.x + this.delta * 9.0, 3);
			
			if(this.frame.x >= 1 && this.frame.x < 3){
				this.strike(Axesub.attackRect);
			}
			
			this.states.attack -= this.delta;
		} else if( this.states.rest > 0) {
			this.frame.x = 0;
			this.frame.y = 1;
			this.states.rest -= this.delta;
		} else {
			//Run at player
			if(this.grounded){
				this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 3.0) % 6;
				this.frame.y = 1;
				
				this.flip = dir.x > 0;
				this.addHorizontalForce(this.forward() * this.speed);
			} else {
				this.frame.x = 1 + Math.max(Math.min(this.force.y,1),-1) * 0.1;
				this.frame.y = 3;
			}
			
			if(Math.abs(dir.x) < 64){
				this.states.attack = this.times.attack;
				this.states.rest = this.times.rest;
				this.frame.x = 0;
				this.frame.y = 2;
			}
		}
	} else {
		this.frame.x = 5;
		this.frame.y = 0;
	}
}

BookReptile.attackRect = new Line(8,-12,20,12);