Chort.prototype = new GameObject();
Chort.prototype.constructor = GameObject;
function Chort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = sprites.pigboss;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(26);
	this.collideDamage = 5;
	this.damage = dataManager.damage(4);
	this.landDamage = dataManager.damage(6);
	
	this.mass = 6.0;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"jump_phase" : 0,
		"land_wait" : 0.0,
		"recover" : 0.0,
		"backup" : false
	}
	
	this.attack_times = {
		"warm" : 24,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideVertical", function(y){
		if( y > 0 && this.states.jump_phase == 2) {
			this.force.x = 0;
			this.states.recover = Game.DELTASECOND * 2;
		} 
		if ( y < 0 && this.states.jump_phase == 1) {
			this.force.x = 0;
			this.states.jump_phase = 2;
			this.states.land_wait = Game.DELTASECOND;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			else
				obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
}
Chort.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.states.recover <= 0 && this.active ) {
		if ( this.states.cooldown <= 0 ){
			//In air attack
			this.friction = 0.04;
			
			if( this.states.land_wait <= 0 && this.states.jump_phase == 2){
				this.gravity = 1.0;
				this.collideDamage = 15;
			} 
			if( this.states.jump_phase == 1 ){
				//Aim for player
				var direction = dir.x > 0 ? -1 : 1;
				this.force.x += direction * this.speed * 6.0 * this.delta;
			}
			this.states.land_wait -= this.delta;
		} else {
			//Ground actions
			if( this.states.attack <= 0 ) {
				if( this.states.backup && this.position.x - this.start_x > 64) this.states.backup = false;
				if( !this.states.backup && this.position.x - this.start_x < -64) this.states.backup = true;
				
				this.friction = 0.1;
				var direction = this.states.backup ? 1 : -1;
				this.force.x += direction * this.speed * this.delta;
				
				if( Math.abs(dir.x) < 48 && this.states.attack < -10 ) this.states.attack = this.attack_times.warm;
				
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				if( this.states.cooldown <= 0 ) {
					this.gravity = 0.2;
					this.force.y = -12;
					this.states.jump_phase = 1;
				}
			} else {
				this.force.x = 0;
				if( this.states.attack <= this.attack_times.release && this.states.attack > this.attack_times.cool ) {
					this.strike( new Line(12,-6,32,10), "hurt" );
				}
			}
			this.states.attack -= this.delta;
		}
	} else {
		this.collideDamage = 5;
		this.states.jump_phase = 0;
		this.gravity = 1.0;
		this.states.cooldown = Game.DELTASECOND * 3;
		this.states.recover -= this.delta;
	}
	
	/* animation */
	if( this.states.jump_phase == 0 ) {
		if( this.states.recover > 0 ) { 
			this.frame_row = 1; 
			this.frame = 3; 
			this.width = 48;
		} else {
			this.width = 28;
			if( this.states.attack > 0 ) {
				this.frame_row = 2; 
				this.frame = 0; 
				if( this.states.attack <= this.attack_times.release ) this.frame = 1;
				if( this.states.attack <= this.attack_times.cool ) this.frame = 2;
			} else {
				this.frame_row = 0; 
				this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3;
			}
		}
	} else {
		this.width = 48;
		this.frame_row = 1;
		this.frame = 1;
		if( this.force.y > 0.3 ) this.frame = 2;
		if( this.force.y < -0.3 ) { this.frame = 0; this.width = 28; }
	}
}