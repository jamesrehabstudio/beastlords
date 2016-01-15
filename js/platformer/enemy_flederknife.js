Flederknife.prototype = new GameObject();
Flederknife.prototype.constructor = GameObject;
function Flederknife(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.flederknife;
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1.0,
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.lifeMax = Spawn.life(3,this.difficulty);
	this.damage = Spawn.life(2,this.difficulty);
	this.mass = 1.0;
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("collideHorizontal", function(dir){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract( _player.position );
		this.states.direction = dir.x > 0 ? -1.0 : 1.0;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Flederknife.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = this.states.direction < 0;
		
		this.force.x += this.delta * this.speed * this.states.direction;
		this.strike( new Line(0, -2, 12, 2) );
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 4;
		this.frame_row = 1;
	}
}