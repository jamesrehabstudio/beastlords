Fly.prototype = new GameObject();
Fly.prototype.constructor = GameObject;
function Fly(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.damage = Spawn.damage(2,this.difficulty);
	this.team = 0;
	this.sprite = sprites.amon;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(1,this.difficulty);
	
	this.speed = 0.25;
	this.frame = 0;
	this.frame_row = 1;
	this.gravity = 0.0;
	this.friction = 0.1;
	this.mass = 0.7;
	this.itemDrop = true;
	
	this.times = {
		"attackWarm" : Game.DELTASECOND,
		"attack" : Game.DELTASECOND * 0.25,
	};
	this.states = {
		"attackWarm" : 0.0,
		"attack" : 0.0
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		if( this.itemDrop ){
			Item.drop(this);
		}
		this.destroy();
	});
}

Fly.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		
		this.flip = dir.x > 0;
		
		if(this.states.attackWarm > 0) {
			this.states.attackWarm -= this.delta;
			this.force = this.force.scale(1 - this.delta*0.5);
			if( this.states.attackWarm <= 0) {
				this.force.x = -10 * (dir.x < 0 ? -1.0 : 1.0);
				this.states.attack = this.times.attack;
			}
		} else if(this.states.attack > 0) {
			this.states.attack -= this.delta;
			this.strike( new Line(0,-6,16,12) );
		} else {
			if( Math.abs(dir.x) > 32 || Math.abs(dir.y) > 32 ){
				this.force = this.force.subtract( dir.normalize( this.speed ) );
			}
			if( Math.abs(dir.x) < 64 && Math.abs(dir.y) < 24 ){
				this.states.attackWarm = this.times.attackWarm;
			}
		}
	}
	
	this.frame = (this.frame + this.delta * 0.5) % 2.0;
}