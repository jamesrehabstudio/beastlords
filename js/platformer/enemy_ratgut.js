Ratgut.prototype = new GameObject();
Ratgut.prototype.constructor = GameObject;
function Ratgut(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "ratgut";
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 5,
		"attack" : 0,
		"runaway" : 0,
		"move_cycle" : 0,
		"direction" : 1
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.2;
	this.collideDamage = Spawn.damage(4,this.difficulty);
	this.stun_time = Game.DELTASECOND;
	this.attackEffects.poison = [1.0,30.0];
	
	this.attack_release = Game.DELTASECOND * 1.2;
	this.attack_time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			//obj.hurt( this, this.collideDamage );
			
			//this.states.cooldown = Game.DELTASECOND * 3;
			//this.states.runaway = Game.DELTASECOND * 1.5;
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.runaway = Game.DELTASECOND * 1.5;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Ratgut.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack > 0 ) {
			//Do nothing
			this.states.attack -= this.delta;
			if(!this.grounded){
				this.strike( new Line(0,-16,16,16) );
			}
		} else if( this.states.cooldown <= 0 ){
			//Charge at player
			this.flip = dir.x > 0;
			this.force.x += this.delta * this.speed * (this.flip?-1:1);
			this.states.runaway = Game.DELTASECOND * 1.5;
			if( Math.abs( dir.x ) < 64 ) {
				//Attack player
				this.states.attack = Game.DELTASECOND * 2;
				this.force.x = (this.flip ? -1 : 1) * 7;
				this.force.y = -3;
				this.states.cooldown = Game.DELTASECOND * 5;
			}
		} else {
			//wander
			if( this.states.runaway > 0 ) {
				this.flip = dir.x < 0;
				this.force.x += this.delta * this.speed * (this.flip?-1:1);
				this.states.runaway -= this.delta;
			} else {
				if( this.states.move_cycle > Game.DELTASECOND * 0.5 ) {
					this.flip = this.states.direction < 0;
					this.force.x += this.delta * 0.5 * this.speed * (this.flip?-1:1);
				} else {
					this.force.x = 0;
				}
				
				if( this.states.move_cycle <= 0 ){
					this.states.direction = Math.random() > 0.5 ? -1 : 1;
					this.states.move_cycle = Game.DELTASECOND * 1.0;
				}
				this.states.cooldown -= this.delta;
			}
		}
	} 
	
	this.friction = this.grounded ? 0.1 : 0.02;
	this.gravity = this.states.attack > 0 ? 0.2 : 1.0;
	this.criticleChance = this.grounded ? 0.0 : 1.0;
	
	if( this.stun > 0 ){
		this.frame_row = 2;
		this.frame = 1;
	} else if( this.states.attack > 0 ){
		this.frame_row = 2;
		this.frame = this.grounded ? 1 : 0;
	} else {
		if( Math.abs( this.force.x ) < 0.3 ){
			this.frame = (this.frame + this.delta * 0.2) % 4;
			this.frame_row = 0;
		} else {
			this.frame = (this.frame + (this.delta * 0.2 * Math.abs(this.force.x))) % 4;
			this.frame_row = 1;
		}
	}
}