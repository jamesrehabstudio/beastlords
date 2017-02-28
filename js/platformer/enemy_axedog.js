Axedog.prototype = new GameObject();
Axedog.prototype.constructor = GameObject;
function Axedog(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "axedog";
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
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction = x > 0 ? -1 : 1;
		this.position.x += this.states.direction;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.cooldown = Game.DELTASECOND * 0.5;
		this.states.attack = 0.0;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill",this.position);
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
			if( this.grounded && this.atLedge() ){
				//Turn around, don't fall off the edge
				this.force.x = 0;
				this.states.direction *= -1.0;
			}
			
			if( Math.abs( dir.x ) > 24 || Math.abs(dir.y) > 48) {
				this.force.x += this.speed * this.delta * this.states.direction;
				this.flip = this.states.direction < 0;
			}
			
			if(Math.abs(dir.y) < 48){
				this.states.cooldown -= this.delta;
				
				if( this.states.cooldown <= 0 && Math.abs( dir.x ) < 64 ) {
					this.states.attack = this.attacks.charge;
					this.states.cooldown = Game.DELTASECOND * 2.0;
					this.flip = dir.x > 0;
				}
			}
		}
		
		/* Animation */
		if( this.states.attack > 0 ) {
			if( this.states.attack < this.attacks.rest ) {
				this.frame.x = 1;
				this.frame.y = 3;
			} else if (this.states.attack < this.attacks.release ){
				this.frame.x = 1;
				this.frame.y = Math.max(Math.min(this.frame.y + this.delta * 0.5,3),1);
			} else {
				this.frame.x = 1;
				this.frame.y = 0;
			}
		} else {
			this.frame.x = 0;
			this.frame.y = (this.frame.y + Math.abs(this.force.x) * this.delta * 0.2) % 6;
		}
	} else{
		//Stun or dead
		this.frame.x = 2;
		this.frame.y = 1;
		if(this.life > 0){
			this.frame.y = 0;
		}
	} 
}