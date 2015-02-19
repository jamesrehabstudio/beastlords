Batty.prototype = new GameObject();
Batty.prototype.constructor = GameObject;
function Batty(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.batty;
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 2,
		"lockon": false,
		"attack" : 0,
		"direction" : 0
	}
	
	this.life = 5;
	this.lifeMax = 5;
	this.mass = 0.8;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	this.gravity = -0.6;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			obj.hurt( this, this.collideDamage );
			this.states.attack = 0;
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.attack = 0;
		
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
		else this.states.lockon = true;
		
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		this.visible = true;
		this.interactive = true;
		this.states.cooldown = Game.DELTASECOND * 2;
		this.states.jumps = 0;
		this.life = this.lifeMax;
		this.gravity = -0.6;
	});
	this.on("death", function(){
		this.visible = false;
		this.interactive = false;
		_player.addXP(1);
		audio.play("kill");
	});
}
Batty.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			
			if( this.states.lockon ) {
				this.gravity = 0;
				this.force.y = 0;
				this.force.x += this.speed * this.delta * this.states.direction;
				this.flip = this.force.x < 0; 
			} else {
				this.gravity = 0.6;
				if( dir.y + 16.0 > 0 ) {
					this.states.lockon = true;
					this.states.direction = dir.x > 0 ? -1 : 1;
				}
			}
			
			if( this.states.attack <= 0 ){
				this.gravity = -0.6;
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.lockon = false;
			} else {
				this.states.attack -= this.delta
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) this.states.attack = Game.DELTASECOND * 2.5;
			this.states.direction = dir.x > 0 ? -1 : 1;
		}
	} 
	
	/* Animation */
	if( Math.abs(this.force.y) < 0.2 && Math.abs(this.force.x) < 0.2  ) {
		this.frame = 1;
	} else {
		if( this.force.y > 1.0 ) {
			this.frame = 0;
		} else {
			this.frame = Math.max( (this.frame + this.delta * 0.3) % 5, 2);
		}
	}
}