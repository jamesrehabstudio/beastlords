LilGhost.prototype = new GameObject();
LilGhost.prototype.constructor = GameObject;
function LilGhost(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.damage = Spawn.damage(2,this.difficulty);
	this.team = 0;
	this.sprite = sprites.lilghost;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.start = new Point(x,y);
	this.speed = 0.25;
	this.frame = 0;
	this.frame_row = 0;
	this.gravity = 0.0;
	this.friction = 0.1;
	this.mass = 0.3;
	this.maxForce = 2.0;
	
	this.force.y = this.maxForce;
	
	this.on("struck", EnemyStruck);
	
	this.on("wakeup", function(){
		this.life = 1;
		this.dead = false;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	
	this.on("death", function(){
		this.gravity = 1.0;
	});
}

LilGhost.prototype.update = function(){
	
	if( this.life > 0 && this.stun <= 0 ) {
		if( this.position.y > this.start.y ) {
			this.gravity = -0.25;
		} else { 
			this.gravity = 0.25;
		}
		
		if( this.position.x < this.start.x - 8 ) {
			this.force.x += this.speed * this.delta;
		}
		if( this.position.x > this.start.x + 8 ) {
			this.force.x -= this.speed * this.delta;
		}
		this.force.y = Math.max(Math.min(this.force.y,this.maxForce),-this.maxForce);
	}
	
	if( this.life <= 0 ) {
		this.frame_row = 1;
		this.frame = this.force.y > 0.1 ? 0 : 1;
	} else { 
		this.frame_row = 0;
		this.frame = 0;
		
		if( this.force.y > 0.5 ) this.frame = 2;
		if( this.force.y < -0.5 ) this.frame = 1;
	}
}

LilGhost.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if( this.life > 0 ) {
		Background.pushLight( this.position.subtract(c), 100 );
	}
}