HammerMathers.prototype = new GameObject();
HammerMathers.prototype.constructor = GameObject;
function HammerMathers(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.sprite = "hammermather";
	this.speed = 10;
	this.jump = 8;
	this.attackTime = Game.DELTASECOND * 2.5;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.collisionReduction = -1.0;
	this.gravity = 0.7;
	this.friction = 0.05;
	this.states = {
		"cooldown" : 50.0,
		"inair" : false,
		"jumps" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.lifeMax = Spawn.life(2,this.difficulty);
	this.damage = Spawn.life(2,this.difficulty);
	this.mass = 1.2;
	
	
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
HammerMathers.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			this.criticalChance = 1.0;
			this.strike( new Line(0,-16,32,-4) );
			if( this.grounded ) {
				this.states.cooldown = this.attackTime;
			}
		} else {
			this.criticalChance = 0.0;
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			if( this.states.cooldown <= 0 ) {
				this.grounded = false;
				this.force.x = this.speed * (this.flip ? -1.0 : 1.0);
				this.force.y = -this.jump;
			}
		}
	}
	
	/* Animation */
	if( this.grounded ) {
		if( this.states.cooldown <= Game.DELTASECOND * 0.5 ) {
			var anim_progress = 1.0 - (this.states.cooldown / (Game.DELTASECOND * 0.5));
			if( anim_progress < 0.55 ) { this.frame_row = 0; this.frame = 1; }
			else if( anim_progress < 0.7 ) { this.frame_row = 0; this.frame = 2; }
			else if( anim_progress < 0.85 ) { this.frame_row = 0; this.frame = 3; }
			else { this.frame_row = 1; this.frame = 0; }
		} else {
			this.frame_row = this.frame = 0;
		}
	} else {
		this.frame_row = 1;
		if( Math.abs( this.force.y ) > 1.0 ) {
			this.frame = this.force.y > 0 ? 3 : 1;
		} else {
			this.frame = 2;
		}
	}
}