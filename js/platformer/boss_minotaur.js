Minotaur.prototype = new GameObject();
Minotaur.prototype.constructor = GameObject;
function Minotaur(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 64;
	this.sprite = "minotaur";
	this.speed = 1.8;
	this.active = false;
	this.origin = new Point(.5,1);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 3;
	this.bossface_frame_row = 0;
	
	this.states = {
		"attack" : 0,
		"prep" : 0,
		"cooldown" : Game.DELTASECOND * 2,
		"dizzy" : 0
	}
	
	this.life = Spawn.life(30,this.difficulty);
	this.mass = 5.0;
	this.damage = Spawn.damage(5,this.difficulty);
	this.collideDamage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.inviciple_tile = this.stun_time;
	this.collisionReduction = -1.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) 
			if( this.states.attack > 0 ) {
				obj.hurt( this, this.damage );
			}
	});
	this.on("collideHorizontal", function(dir){
		if( this.states.attack > 0 && Math.abs(this.force.x) > 1.0 ) {
			this.states.attack = 0;
			this.states.cooldown = Game.DELTASECOND;
			this.states.dizzy = Game.DELTASECOND * 2.5;
			
			if( dir > 0 ) {
				game.addObject(new EffectExplosion(this.position.x + 20, this.position.y-32));
			} else {
				game.addObject(new EffectExplosion(this.position.x - 20, this.position.y-32));
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt", this.position);
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,35);
		this.destroy();
	});
	this.calculateXP();
}
Minotaur.prototype.update = function(){	
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
				
		if( this.active ) {
			if( this.states.cooldown <= 0 ) {
				if( this.states.attack > 0 ) {
					this.force.x = (this.flip ? -1 : 1) * this.delta * this.speed * 4;
				} else {
					//Prep charge
					this.states.prep -= this.delta;
					if( this.states.prep <= 0 ) this.states.attack = Game.DELTASECOND * 3;
				}
			} else {
				if( this.states.dizzy > 0 ){
					//dizzy
					this.states.dizzy -= this.delta;
				} else {
					this.states.prep = Game.DELTASECOND;
					this.flip = dir.x > 0;
					this.force.x = (dir.x > 0 ? 1 : -1) * this.delta * this.speed;
					this.states.cooldown -= this.delta;
				}
			}
		}
	}
	
	/* Animation */
	this.width = 32;
	this.height = 64;
	if(this.states.cooldown > 0){
		if( this.states.dizzy > 0){
			this.frame_row = 2;
			this.frame = (this.frame + (this.delta * 0.1)) % 3;
		} else {
			this.frame_row = 0;
			this.frame = (this.frame + (this.delta * 0.2 * Math.abs(this.force.x))) % 3;
		}
	} else {
		if( this.states.attack > 0 ){
			this.frame = Math.max( (this.frame + (this.delta * 0.133 * Math.abs(this.force.x))) % 3, 1 );
			this.frame_row = 1;
			this.width = 40;
			this.height = 32;
		} else {
			this.frame = 0;
			this.frame_row = 1;
		}
	}
	
}