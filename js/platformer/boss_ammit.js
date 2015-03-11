Ammit.prototype = new GameObject();
Ammit.prototype.constructor = GameObject;
function Ammit(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.sprite = sprites.ammit;
	this.speed = 0.075;
	
	this.start_x = x;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.states = {
		"drink" : 0,
		"attack" : 0,
		"cooldown" : Game.DELTASECOND * 2,
		"direction" : 1,
		"spit" : false
	};
	this.attacks = {
		"warm" : Game.DELTASECOND * 0.5,
		"release" : Game.DELTASECOND * 0.33,
		"drink_time" : Game.DELTASECOND * 4,
		"spit_time" : Game.DELTASECOND * 1
	}
	
	this.life = dataManager.life(16);
	this.mass = 5.0;
	this.damage = 25;
	this.collideDamage = 25;
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("collideHorizontal", function(){
		if( this.states.cooldown <= 0 ) 
			this.states.drink = this.attacks.drink_time;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) 
			obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(){
		_player.addXP(60);
		audio.play("kill");
		
		Item.drop(this,35);
		this.destroy();
	});
}
Ammit.prototype.update = function(){	
	if ( this.active && this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.drink > 0 ) {
			this.states.drink -= this.delta;
			this.states.cooldown = Game.DELTASECOND * 8;
			this.states.attack = 0;
			if( this.states.drink <= this.attacks.spit_time && !this.states.spit ) {
				//Fire balls!
				this.states.spit = true;
				for(var i=4; i<9; i++ ){
					var fire = new Fire(this.position.x, this.position.y);
					fire.force.x = (this.flip ? -1 : 1) * (i*2.5);
					fire.force.y = -9;
					fire.deltaScale = 0.3;
					fire.life *= fire.deltaScale;
					game.addObject(fire);
				}
			}
		} else {
			this.states.spit = false;
			if( this.states.attack > 0 ) {
				//Swing and attack
				this.states.attack -= this.delta;
				this.states.cooldown -= this.delta * 0.5;
			} else if( this.states.cooldown <= 0 ) {
				//Back into a corner for drinking
				var direction = dir.x > 0 ? 1 : -1;
				this.flip = dir.x > 0;
				this.force.x += direction * this.speed;
			} else {
				//Attack the player
				if( Math.abs( dir.x ) < 40 ) {
					this.states.attack = this.attacks.warm;
				} else { 
					if( this.position.x - this.start_x < -56 ) this.states.direction = 1.0;
					if( this.position.x - this.start_x > 56 ) this.states.direction = -1.0;
					this.flip = dir.x > 0;
					
					this.force.x += this.states.direction * this.speed;
					this.states.cooldown -= this.delta;
				}
			}
		}
		
		if( this.states.attack > 0 && this.states.attack <= this.attacks.release ){
			this.strike( new Line(0,10,32,-8) );
		}
	}
	
	/* Animation */
	if( this.states.drink > 0 ) {
		var range = this.attacks.drink_time - this.attacks.spit_time;
		var pos = (this.states.drink - this.attacks.spit_time) / range;
		this.frame = Math.min( Math.floor((1-pos)*4), 3); 
		this.frame_row = 2;
	} else if( this.states.attack > 0 ) {
		this.frame = this.states.attack <= this.attacks.release ? 1 : 0;
		this.frame_row = 1;
	} else {
		this.frame = (this.frame + (this.delta * 0.3 * Math.abs(this.force.x))) % 3;
		this.frame_row = 0;
	}
}