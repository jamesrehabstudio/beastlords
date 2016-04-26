SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	
	this.speed = 0.3;
	this.sprite = sprites.snake;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("sleep",function(){
		this.destroy();
	})
	this.on("hurt_other",function(obj, damage){
		this.trigger("death");
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.pushable = false;
	this.mass = 0.3;
	this.gravity = 0.5;
	this.timeCounter = Game.DELTASECOND * 3;
}
SnakeBullet.prototype.update = function(){	
	this.timeCounter -= this.delta;
	
	if(this.grounded){
		this.force.x += this.speed * (this.flip ? -1 : 1) * this.delta;
		this.strike(new Line(new Point(0,-3),new Point(12,3)));
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 0;
	} else {
		this.frame = (this.frame + this.delta * 0.3) % 4;
		this.frame_row = 1;
	}
	
	if(this.timeCounter <= 0){
		this.destroy();
	}
}