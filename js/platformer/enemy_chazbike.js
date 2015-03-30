ChazBike.prototype = new GameObject();
ChazBike.prototype.constructor = GameObject;
function ChazBike(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.15;
	this.sprite = sprites.chazbike;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		this.states.backwards = Game.DELTASECOND * 3;
	});
	this.on("collideObject", function(obj){
		if( this.states.collideCooldown > 0 || this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			this.states.collideCooldown = Game.DELTASECOND;
			obj.hurt( this, this.collideDamage );
		}
	});
	this.on("pre_death", function(obj,pos,damage){
		var rider = new Chaz(this.position.x, this.position.y);
		rider.force.y = - 6;
		rider.force.x = this.flip ? 6 : -6;
		game.addObject( rider );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
	
	this.life = dataManager.life(6);
	this.collideDamage = dataManager.damage(3);
	this.mass = 5.3;
	this.friction = 0.01;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"collideCooldown" : 0,
		"backwards" : 0,
		"direction" : 1
	};
	
}
ChazBike.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 && this.life > 0 ) {
		this.flip = this.force.x < 0;
		var direction = dir.x < 0 ? 1 : -1;
		this.force.x += this.speed * this.delta * direction * this.states.direction;
		this.states.collideCooldown -= this.delta;
		this.states.backwards -= this.delta;
		this.states.direction = this.states.backwards <= 0 ? 1 : -1;
	} else {
		this.force.x = 0;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		if( Math.abs( this.force.x ) > 2 ) {
			this.frame_row = 0;
			this.frame = (this.frame + (Math.abs(this.force.x) * 0.3 * this.delta) ) % 3;
		} else {
			this.frame_row = 1;
			this.frame = 0;
			if( Math.abs(this.force.x) < 1 ) this.frame = 1;
		}
	}
}