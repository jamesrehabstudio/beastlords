Beaker.prototype = new GameObject();
Beaker.prototype.constructor = GameObject;
function Beaker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.beaker;
	this.speed = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"backwards": false,
		"jumps" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.lifeMax = Spawn.life(3,this.difficulty);
	this.mass = 0.8;
	this.collideDamage = Spawn.damage(2,this.difficulty);
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = !this.states.backwards;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		//this.visible = true;
		//this.interactive = true;
		this.states.cooldown = 50;
		this.states.jumps = 0;
		//this.life = this.lifeMax;
	});
	this.on("death", function(){
		//this.visible = false;
		//this.interactive = false;
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Beaker.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.backwards ? -1.0 : 1.0);
			
			var speed = 2;
			var jump = 3;
			this.states.cooldown = Game.DELTASECOND;
			this.states.jumps++;
			
			if( this.states.jumps > 2 ) {
				speed = 7;
				jump = 7;
				this.grounded = false;
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.jumps = 0;
				this.criticalChance = 1.0;
			}
			this.force.x += direction * speed;
			this.force.y = -jump;
		}
		
		if( Math.abs( this.force.x ) > 0.5 ) this.flip = this.force.x < 0;
		if( Math.abs(dir.x) > 100 ) this.states.backwards = false;
		
		/* counters */
		this.states.cooldown -= this.delta;
		
		if( this.criticalChance > 0 ) {
			this.strike( new Line(-8,-4,8,4) );
		}
	}
	
	if(this.grounded) this.criticalChance = 0.0;
	this.friction = this.grounded ? 0.4 : 0.025;
	
	/* Animation */
	this.frame = 0;
	if( this.states.cooldown < 5 ) this.frame = 1;
	if( !this.grounded ) this.frame = 2;
}