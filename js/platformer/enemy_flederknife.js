Flederknife.prototype = new GameObject();
Flederknife.prototype.constructor = GameObject;
function Flederknife(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "flederknife";
	this.speed = 6.0;
	this.blockKnockback = 8.0;
	this.collideKnockback = 3.0;
	this.turndelay = 0.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1.0,
		"jump" : 0,
		"down" : 0,
		"jump_tick" : 1
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.lifeMax = Spawn.life(3,this.difficulty);
	this.damage = Spawn.life(1,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.mass = 1.0;
	
	this.on("blocked", function(obj){
		let d = obj.position.x > this.position.x ? -1 : 1;
		this.force.x += d * this.blockKnockback;
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && obj.hasModule(mod_rigidbody)){
			this.changeDirection();
			let d = obj.position.x > this.position.x ? -1 : 1;
			this.force.x += d * this.collideKnockback;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.position.x += dir > 0 ? 1 : -1;
		this.changeDirection();
	});
	this.on(["added","wakeup"], function(){
		var dir = this.position.subtract( _player.position );
		this.states.direction = dir.x > 0 ? -1.0 : 1.0;
		this.states.jump_tick = 1;
		
		if(this.difficulty > 0){
			this.states.duck = Math.round(Math.random());
		}
		if(this.difficulty > 1){
			this.states.jump_tick = Math.floor(Math.random()*3);
		}
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	this.faceTarget();
}
Flederknife.prototype.changeDirection = function(forceChange=false){
	this.force.x = 0;
	if(this.turndelay <= 0 || forceChange){
		this.states.direction *= -1.0;
		this.turndelay = Game.DELTASECOND * 0.5;
	
	
		if(this.difficulty > 0){
			this.states.duck = Math.round(Math.random());
		}
		if(this.difficulty > 99){
			this.states.jump_tick--;
		}
	}
}
Flederknife.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = this.states.direction < 0;
		
		this.addHorizontalForce(this.speed * this.forward());
		
		if(this.atLedge()){
			this.changeDirection(true);
		}
		
		if(this.states.jump && this.grounded){
			this.states.jump = 0;
			this.faceTarget();
			this.force.y -= this.delta * 3;
		} 

		if(this.grounded){
			if(this.states.duck){
				this.strike( new Line(0, 6, 12, 2) );
			} else {
				this.strike( new Line(0, -6, 12, 2) );
			}
		}
		
		if(this.states.jump_tick <= 0 && this.grounded && Math.abs(dir.x) < 80){
			//Jump behind the player
			this.states.jump = 1;
			this.grounded = false;
			this.states.direction = dir.x > 0 ? -1.0 : 1.0;
			this.force.y = -12;
			this.force.x = this.forward() * 300;
			this.states.jump_tick = 2 + Math.floor(Math.random()*3);
		}
		this.turndelay -= this.delta; 
		
		
		/* Animation */
		
		if( this.states.jump ){
			this.frame.x = (this.frame.x + this.delta * 0.4) % 3;
			this.frame.y = 2;
		} else {
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 6.0) % 4;
			if(this.states.duck){
				this.frame.y  = 0;
			} else {
				this.frame.y  = 1;
			}
		}
		
	} else {
		this.frame.x = 3;
		this.frame.y  = 2;
	}
}

Flederknife.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.states.direction = dir.x < 0 ? -1.0 : 1.0;
}