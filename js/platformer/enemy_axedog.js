Axedog.prototype = new GameObject();
Axedog.prototype.constructor = GameObject;
function Axedog(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = sprites.axedog;
	this.speed = 0.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"attack" : 0.0,
		"direction" : 1.0
	};
	this.attacks = {
		"charge" : Game.DELTASECOND,
		"release" : Game.DELTASECOND * 0.4,
		"rest" : Game.DELTASECOND * 0.25,
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.life(3,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.cooldown = Game.DELTASECOND * 0.5;
		this.states.attack = 0.0;
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
Axedog.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack > 0 ) {
			if(this.states.attack < this.attacks.release && this.states.attack > this.attacks.rest) {
				this.strike( new Line(0,-16,24,16) );
			}
			this.states.attack -= this.delta;
		} else {
			if( game.getTile( 
				16 * this.states.direction + this.position.x, 
				this.position.y + 24, game.tileCollideLayer) == 0 
			){
				//Turn around, don't fall off the edge
				this.force.x = 0;
				this.states.direction *= -1.0;
			}
			
			if( Math.abs( dir.x ) > 24 ) {
				this.force.x += this.speed * this.delta * this.states.direction;
			}
			this.states.cooldown -= this.delta;
			this.flip = this.states.direction < 0;
			
			if( this.states.cooldown <= 0 && Math.abs( dir.x ) < 64 ) {
				this.states.attack = this.attacks.charge;
				this.states.cooldown = Game.DELTASECOND * 2.0;
				this.flip = dir.x > 0;
			}
		}
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame = 3;
		this.frame_row = 2;
	} else if( this.states.attack > 0 ) {
		if( this.states.attack < this.attacks.rest ) {
			this.frame = 2;
			this.frame_row = 2;
		} else if (this.states.attack < this.attacks.release ){
			this.frame = 1;
			this.frame_row = 2;
		} else {
			this.frame = 0;
			this.frame_row = 2;
		}
	} else {
		this.frame_row = 1;
		this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 4;
	}
}