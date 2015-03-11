Crusher.prototype = new GameObject();
Crusher.prototype.constructor = GameObject;
function Crusher(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 48;
	this.sprite = game.tileSprite;
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.gravity = 0;
	this.pushable = false;
	
	this.states = {
		"phase" : 0,
		"cooldown" : 0,
		"active" : true
	}
	
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideVertical", function(dir){
		if( dir < 0 ) {
			this.states.phase = 0;
			this.states.active = true;
		}
	});
	this.on("collideObject", function(obj){
		if( !this.states.active ) return;
		if( obj.hurt instanceof Function ) {
			if( this.force.y > 5 ) obj.hurt( this, this.damage );
			else obj.hurt( this, this.collideDamage );
			this.states.active = false;
		}
	});
}
Crusher.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.states.phase == 0 && Math.abs(dir.x) <= 32 ){
		this.states.phase = 1;
		this.states.cooldown = Number.MAX_VALUE;
		this.force.y = 0;
		this.gravity = 1.0;
	}
	
	if( this.grounded && this.states.phase == 1 ) {
		this.states.phase = 2;
		this.states.cooldown = Game.DELTASECOND;
		audio.play("burst1");
	}
	
	if( this.states.cooldown <= 0 ) {
		this.force.y = -1;
		this.gravity = 0.0;
	}
	
	this.states.cooldown -= this.delta;
}
Crusher.prototype.render = function(g,c){
	for(var x=0; x < 2; x++ ) for(var y=0; y < 3; y++ ) {
		this.sprite.render(g,
			new Point( x*16 + -16 + this.position.x - c.x, y*16 + -24 + this.position.y - c.y ),
			x+2, y+13
		);
	}
}