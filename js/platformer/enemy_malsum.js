Malsum.prototype = new GameObject();
Malsum.prototype.constructor = GameObject;
function Malsum(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = sprites.bear;
	this.speed = 0.3;
	
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.life = dataManager.life(4);
	
	this.states = {
		"direction" : -1,
	}
	
	this.damage = dataManager.damage(1);
	this.collideDamage = dataManager.damage(3);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Malsum.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.stun <= 0 ) {
		if( this.position.x - this.start_x < -48 ) this.states.direction = 1;
		if( this.position.x - this.start_x > 48 ) this.states.direction = -1;
		
		this.force.x += this.states.direction * this.delta * this.speed;
	}
	
	this.frame = 0;
	this.frame_row = 0;
}