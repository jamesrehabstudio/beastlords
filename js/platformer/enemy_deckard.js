Deckard.prototype = new GameObject();
Deckard.prototype.constructor = GameObject;
function Deckard(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 36;
	this.sprite = sprites.deckard;
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"combo": 0,
		"fly" : 0,
		"attack" : 0,
		"attack_counter":0,
		"attack_lower" : false,
		"direction" : 1
	}
	this.attack_time = Game.DELTASECOND * 0.6;
	this.jump_start_y = 0;
	
	this.life = 60;
	this.lifeMax = 60;
	this.mass = 4;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 2;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			obj.hurt( this, this.collideDamage );
			this.states.attack = 0;
		}
	});
	this.on("collideHorizontal", function(x){
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) {
			this.gravity = 0;
			this.force.y = 0;
		}
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		this.destroy();
		_player.addXP(30);
		Item.drop(this,20);
		audio.play("kill");
		
		for(var i=0; i < 2; i++ ){
			//Spawn bats on death
			var batty = new Batty(this.position.x, this.position.y);
			batty.fuse = false;
			batty.invincible = batty.invincible_time;
			batty.force.x = i <= 0 ? -8 : 8;
			game.addObject(batty);
		}
	});
}
Deckard.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if( this.states.combo > 0 ) {
			if( this.states.attack < 0 ) {
				this.states.attack = this.attack_time;
				this.states.attack_lower = Math.random() >= 0.5;
			}
			
			if( this.states.attack < this.attack_time * 0.3 ) {
				if( this.states.attack_counter == 0 ) {
					this.states.attack_counter = 1;
					this.force.x += this.speed * 10.0 * this.states.direction;
					audio.play("swing");
				}
			} else {
				this.states.attack_counter = 0;
			}
			
			this.states.combo -= this.delta;
			this.states.attack -= this.delta;
		} else if ( this.states.fly > 0 ) {
			this.states.fly -= this.delta;
			if( this.states.fly < this.states.attack_counter ) {
				//Fire fireball
				this.states.attack_counter = this.states.fly - Game.DELTASECOND * .5;
			}
			if( this.position.y - this.jump_start_y < -64 ) {
				this.gravity = 0;
				this.force.y = 0;
				this.force.x += this.speed * this.delta * this.states.direction;
			}
		} else {
			//walk towards player
			this.states.cooldown -= this.delta;
			this.states.attack = 0;
			this.flip = dir.x > 0;
			this.states.direction = dir.x < 0 ? 1 : -1;
			this.gravity = 1.0;
			this.jump_start_y = this.position.y;
			
			if( Math.abs(dir.x) > 48 ) {
				this.force.x += this.speed * this.delta * this.states.direction;
			}
			
			if( this.states.cooldown <= 0 ) {
				if( Math.abs(dir.x) > 64 ) {
					this.states.fly = Game.DELTASECOND * 5;
					this.states.attack_counter = this.states.fly - Game.DELTASECOND;
					this.gravity = 0.4;
					this.force.y = -8;
					this.force.x = this.states.direction * -8;
				} else {
					this.states.combo = this.attack_time * 5;
					this.force.x = 0;
					this.states.attack_counter = 0;
				}
				this.states.cooldown = Game.DELTASECOND * 3;
			}
		}
	} 
	
	if( this.states.attack > 0 && this.states.attack < this.attack_time * 0.3 ) {
		this.strike( new Line(
			0, this.states.attack_lower ? 8 : -4,
			40, this.states.attack_lower ? 12 : 0
		) );
	}
	
	/* Animation */
	if( this.states.attack > 0 ){
		this.frame = this.states.attack < this.attack_time * 0.3 ? 1 : 0;
		this.frame_row = this.states.attack_lower ? 2 : 1;
	} else {
		if( this.grounded ) {
			this.frame = 0;
			this.frame_row = 0;
		} else {
			this.frame = (this.frame + (this.delta * Math.abs(this.force.x) * 0.2)) % 2;
			this.frame_row = 3;
		}
	}
}