Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = sprites.chaz;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(8);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 45;
	this.collideDamage = 5;
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 15
	};
}
Chaz.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( this.position.x - this.start_x > 24 ) this.states.backup = true;
		if( this.position.x - this.start_x < -24 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 50;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new Bullet(this.position.x, this.position.y+10, (this.flip?-1:1) );
				} else {
					missle = new Bullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 3;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame_row = this.states.attack_lower ? 2 : 1;
		} else {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}