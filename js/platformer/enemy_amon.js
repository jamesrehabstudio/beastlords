Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.charged = false;
	
	this.speed = 2.5;
	this.sprite = "lilghost";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("struck", function(obj,pos,damage){
		EnemyStruck.apply(this,arguments);
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	//this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	
	this.collisionReduction = -1.0;
	this.bounce = 1.0;
	this.friction = 0.0;
	this.stun_time = Game.DELTASECOND * 3;
	this.invincible_time = 30.0;
	this.changeTime = 0.0;
	this.isCharged = 0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	this.pushable = false;
	
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame.x = ( this.frame.x + this.delta * 0.2 ) % 3;
	if(this.life <= 0){
		this.gravity = 0.4;
	} else if( this.stun < 0 ) {
		if(this.charged){
			if(this.isCharged){
				Background.pushLight(this.position,180,[.5,.7,1.0,1.0]);
				this.damageReduction = 1.0;
				this.changeTime -= this.delta;
				if(this.changeTime <= 0) {
					this.isCharged = 0;
				}
			} else{
				this.changeTime += this.delta;
				this.damageReduction = 0.0;
				if(this.changeTime >= Game.DELTASECOND * 2) {
					this.isCharged = 1;
				}
			}
		}
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.force.x = this.speed * (this.force.x > 0 ? 1 : -1);
			this.force.y = this.speed * (this.force.y > 0 ? 1 : -1);
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
		this.strike( new Line(-8,0,8,4) );
	} else {
		this.force.x = this.force.y = 0;
	}
}