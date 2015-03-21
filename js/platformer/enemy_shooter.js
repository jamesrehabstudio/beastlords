Shooter.prototype = new GameObject();
Shooter.prototype.constructor = GameObject;
function Shooter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.collideDamage = dataManager.damage(2);
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.start_x = x;
	this.sprite = sprites.shooter;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.life = 1;
	this.gravity = 0.5;
	this.friction = 0.2;
	
	this.bullet_y_pos = [-16,0,18];
	this.cooldown = Game.DELTASECOND;
	this.death_time = Game.DELTASECOND;
	this.max_distance = 360;
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(20);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 128 ) {
		this.flip = dir.x > 0;
		this.frame = ( this.frame + this.delta * 0.1 ) % 2;
		if( Math.abs( dir.x ) < 112 ) {
			if( this.flip ) {
				//Move to the right
				if( this.position.x - this.start_x < this.max_distance ) {
					this.force.x += this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			} else {
				//Move to the left
				if( this.position.x - this.start_x > -this.max_distance ) {
					this.force.x -= this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			}
		} 
		
		//Attack
		if( this.cooldown <= 0 ) {
			this.cooldown = Game.DELTASECOND * 0.6;
			var shooter_direction = Math.floor( Math.random() * this.bullet_y_pos.length);
			var y = this.bullet_y_pos[ shooter_direction ];
			this.frame_row = shooter_direction;
			var direction = this.flip ? 1 : -1;
			var bullet = new Bullet(
				_player.position.x + (128*direction), 
				this.position.y + y, 
				-direction
			);
			bullet.damage = this.damage;
			//bullet.speed = 0.8;
			game.addObject( bullet );
		}
		this.cooldown -= this.delta;
	} else if ( Math.abs( this.position.x - this.start_x ) < this.max_distance ){
		this.flip = dir.x > 0;
		var direction = this.flip ? -1 : 1;
		this.force.x += this.delta * this.speed * direction;
	}
}
Shooter.prototype.idle = function(){}