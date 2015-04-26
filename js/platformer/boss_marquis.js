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
		"direction" : 1,
		"attack_down" : false
	}
	
	this.attack_times = {
		"warm" : Game.DELTASECOND * 3,
		"attack" : Game.DELTASECOND * 2,
		"rest" : Game.DELTASECOND * 1.0
	};
		
	this.life = dataManager.life(24);
	this.mass = 4.0;
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(3);
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 3;
	
	this.guard.active = true;
	this.guard.y = 8;
	this.guard.h = 48;
	this.guard.x = 0;
	this.guard.w = 28;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("critical", function(){
		this.states.cooldown = (Math.random() > 0.6 ? 0.0 : 10.0);
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		audio.play("hurt");
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team || this.inviciple > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,30);
		this.destroy();
	});
	this.on("player_death", function(){
		this.states["attack"] = 0;
		this.states["cooldown"] = 100.0;
		this.states["attack_type"] = 0;
		this.states["direction"] = 1;
		this.states["attack_down"] = false;
	});
	this.calculateXP();
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.stun <= 0  && this.life > 0 && this.active) {
		var dir = this.position.subtract( _player.position );
				
		if( this.states.attack <= 0 ) {
			this.criticalChance = 0.0;
			if(this.position.x - this.start_x > 64) this.states.direction = -1;
			if(this.position.x - this.start_x < -64) this.states.direction = 1;
			
			this.force.x += this.speed * this.delta * this.states.direction;
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			
			if( this.states.cooldown <= 0 ){
				this.states.attack = this.attack_times.warm;
				this.states.cooldown = this.attack_times.warm * (1+Math.random()*2);
				this.states.direction = dir.x > 0 ? -1 : 1;
				this.states.attack_down = Math.random() > 0.5;
			}
		} else {
			if( this.states.attack < this.attack_times.attack ) {
				this.criticalChance = 1.0;
				var y_offset = this.states.attack_down ? 18 : 0;
				this.strike(new Line(
					new Point( 16, y_offset+8 ),
					new Point( 64, y_offset+16 )
				) );
				if ( this.states.attack > this.attack_times.rest ){
					this.force.x += this.speed * 4.0 * this.delta * this.states.direction;
				}
			}
			this.states.attack -= this.delta;
		}
	}
	
	/* Animation */
	if(this.states.attack > 0 ) {
		this.frame_row = 1;
		this.frame = 0;
		if( this.states.attack_down ) this.frame_row = 2;
		if( this.states.attack < this.attack_times.attack ) this.frame = 1; 
	} else {
		this.frame = (this.frame+this.delta*0.2*Math.abs(this.force.x))%3;
		this.frame_row = 0;
	}
}