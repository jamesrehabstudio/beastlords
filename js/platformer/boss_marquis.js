Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = sprites.megaknight;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0,
		"walk_back" : false
	}
	
	this.attack_times = {
		"warm" : 60.0,
		"swing" : 50.0,
		"damage" : 45.0,
		"rest" : 40
	};
		
	this.life = 80;
	this.mass = 4.0;
	this.damage = 25;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( dir.y < 22.0 || !this.active ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = (Math.random() > 0.6 ? 0.0 : 10.0);
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(40);
		audio.play("kill");
		
		Item.drop(this,30);
		this.destroy();
	});
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
				
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.walk_back ? -1.0 : 1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				var start_distance = this.position.x - this.start_x;
				if( Math.abs( dir.x ) < 32 ) this.states.walk_back = true;
				if( Math.abs( dir.x ) > 96 && Math.abs(start_distance) < 48 ) this.states.walk_back = false;
				if( start_distance > 96 ) this.states.walk_back = !this.flip;
				else if( start_distance < -96 ) this.states.walk_back = this.flip;
				else if( this.states.cooldown < 50 && Math.abs(start_distance) < 64 ) this.states.walk_back = false;
				
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 48 ){
			this.states.attack = this.attack_times.warm;
			this.states.cooldown = this.attack_times.warm * 2;
		}
		
		if ( this.states.attack > this.attack_times.rest && this.states.attack < this.attack_times.damage ){
			this.strike(new Line(
				new Point( 16, 0 ),
				new Point( 40, 16 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_times.damage ? 2 : (this.states.attack < this.attack_times.swing ? 1 : 0);
			this.frame_row = 1
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = ( this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 3;
			}
		}
	}
}