FlyingSlime.prototype = new GameObject();
FlyingSlime.prototype.constructor = GameObject;
function FlyingSlime(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.startPosition = new Point(x,y);
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.4;
	this.sprite = "flyingslime";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("struck", EnemyStruck);
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = 9999;
	this.damageReduction = 1.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.loopTime = 0.0;
	this.loopTimeFull = Game.DELTASECOND;
	this.hurtByDamageTriggers = false;
	this.damageContact = 0.0;
	
	this.mass = 1.0;
	this.gravity = 0.0;
	this.friction = 0.8;
	this.pushable = false;
}
FlyingSlime.prototype.update = function(){
	this.frame = 0;
	this.frame_row = 0;
	this.grounded = false;
	
	var variation = this.position.subtract(this.startPosition);
	this.force.y = 0;
	if(Math.abs(variation.x) > 4){
		if(variation.x > 0){
			this.force.x -= this.speed * this.delta;
		} else {
			this.force.x += this.speed * this.delta;
		}
	}
	
	this.loopTime += this.delta;
	this.position.y = this.startPosition.y - Math.sin((this.loopTime/this.loopTimeFull)*Math.PI) * 16;
	
	if(this.loopTime >= this.loopTimeFull){
		this.loopTime = 0;
		var bullet = new Bullet(this.position.x, this.position.y + 16, 0);
		bullet.damage = Spawn.damage(2,this.difficulty);
		bullet.blockable = false;
		bullet.gravity = 1.0;
		bullet.frame = 2;
		bullet.frame_row = 0;
		game.addObject( bullet );
	}
}