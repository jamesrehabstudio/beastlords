Shell.prototype = new GameObject();
Shell.prototype.constructor = GameObject;
function Shell(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	
	this.speed = 0.5;
	this.sprite = "shell";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1
	}
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			//obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.states.direction *= -1;
		this.force.x = 0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.2;
	this.stun_time = Game.DELTASECOND * 0.75;
	this.invincible_time = 30.0;
	
	this.mass = 1.0;
	this.gravity = 1.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Shell.prototype.update = function(){
	this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 4;
	if( this.stun < 0 ) {
		this.force.x += this.speed * this.delta * this.states.direction;
		this.flip = this.force.x < 0;
		
		//Stop at edges
		if( game.getTile( 
			16 * this.states.direction + this.position.x, 
			this.position.y + 16, game.tileCollideLayer) == 0 
		){
			//Turn around, don't fall off the edge
			this.force.x = 0;
			this.states.direction *= -1.0;
		}
	} else {
		this.force.x = this.force.y = 0;
	}
	
	this.strike( new Line(-8,-4,8,4) );
}