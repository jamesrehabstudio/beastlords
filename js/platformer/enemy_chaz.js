Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 30;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = "chaz";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.calculateXP();
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(7,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 15
	};
}
Chaz.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( this.position.x - this.start_x > 24 ) this.states.backup = true;
		if( this.position.x - this.start_x < -24 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 50;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new Bullet(this.position.x, this.position.y+10, (this.flip?-1:1) );
				} else {
					missle = new Bullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				missle.damage = this.damage;
				missle.frame.x = 4;
				missle.frame.y = 0;
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame.x = 0;
		this.frame.y = 3;
	} else {
		if( this.states.attack > 0 ) {
			var progress = this.states.attack / (this.attack.warm-this.attack.release);
			if(this.states.attack_lower){
				this.frame.x = this.states.attack > this.attack.release ? 0 : 1;
				this.frame.y = 2;
			} else {
				if(this.states.attack <= this.attack.release){
					this.frame.x = 3;
				} else if(progress > 1.8){
					this.frame.x = 0;
				} else if(progress > 1.6){
					this.frame.x = 1;
				} else {
					this.frame.x = 2;
				}
				this.frame.y = 1;
			}
		} else {
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ){
				this.frame.x = 0;
			} 
			this.frame.y = 0;
		}
	}
}