Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.knight;
	this.speed = 0.4;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guardUpdate" : 0.0,
		"backup" : 0
	}
	
	this.attack_warm = 24.0;
	this.attack_time = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 6;
	
	this.life = 45;
	this.damage = 20;
	this.collideDamage = 10;
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	
	this.level = 1 + Math.floor( Math.random() + dataManager.currentTemple / 3 );
	this.fr_offset = 0;
	this.cooldown_time = Game.DELTASECOND * 1.6;
	
	if( this.level == 2 ){
		this.life = 90;
		this.damage = 30;
		this.fr_offset = 3;
		this.cooldown_time = Game.DELTASECOND * 1.4;
		this.attack_warm = 22.0;
		this.attack_time = 6.5;
		this.attack_rest = 3.0;
		this.speed = 0.42;
		this.thrust_power = 8;
		this.death_time = Game.DELTASECOND * 2;
	} else if ( this.level >= 3 ) {
		this.life = 160;
		this.damage = 50;
		this.fr_offset = 6;
		this.cooldown_time = Game.DELTASECOND * 1.2;
		this.attack_warm = 20.0;
		this.attack_time = 6.5;
		this.attack_rest = 3.0;
		this.speed = 0.45;
		this.thrust_power = 10;
		this.death_time = Game.DELTASECOND * 3;
	}
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
		if( Math.random() > 0.2 ) {
			this.states.guardUpdate = Game.DELTASECOND * 2.0;
			this.states.guard = _player.states.duck ? 1 : 2;
		}
	});
	this.on("death", function(){
		Item.drop(this,8);
		_player.addXP(18);
		audio.play("kill");
		this.destroy();
	});
}
Knight.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active /*&& this.states.attack <= 0*/ ) {
			var direction = 1;
			if( Math.abs(_player.position.x - this.start_x ) < 128 ){
				//Player in the attack area, advance at player
				direction = dir.x > 0 ? -1.0 : 1.0;
				direction *= (Math.abs(dir.x) > 20 ? 1.0 : -1.0);
			} else {
				direction = this.position.x - this.start_x > 0 ? -1.0 : 1.0;
			} 
			
			//if( this.position.x - this.start_x > 64 ) this.states.backup = -1;
			//if( this.position.x - this.start_x < -64 ) this.states.backup = 1;
			
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 40 ){
			if( Math.random() > 0.6 ) {
				//Pick a random area to attack
				this.states.attack_down = Math.random() > 0.5;
			} else {
				//Aim for the player's weak side
				this.states.attack_down = !_player.states.duck;
			}
			
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if( this.states.guardUpdate < 0 && this.states.attack < 0 ){
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guardUpdate = Game.DELTASECOND * 0.3;
		}
		if( this.states.attack <= 0 ) this.states.attack_counter = 0;
			
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ){
			if( this.states.attack_counter == 0 ){
				audio.play("swing");
				this.states.attack_counter = 1;
				this.force.x += (dir.x > 0 ? -1 : 1) * this.thrust_power;
			}
			this.strike(new Line(
				new Point( 10, (this.states.attack_down ? 8 : -8) ),
				new Point( 29, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* guard */
	this.guard.active = this.states.guard > 0;
	this.guard.y = this.states.guard == 1 ? 6 : -5;
	this.guard.x = 12;
	
	/* counters */
	this.states.attack -= this.delta;
	this.states.guardUpdate -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = 0;
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ) this.frame = 1;
		this.frame_row = this.fr_offset + (this.states.attack_down == 1 ? 2 : 1);
	} else {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3, 0 );
		} else {
			this.frame = 0;
		}
		this.frame_row = this.fr_offset;
	}
}
Knight.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 3 : 4 ), this.fr_offset, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
}