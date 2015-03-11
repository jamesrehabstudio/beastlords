Shooter.prototype = new GameObject();
Shooter.prototype.constructor = GameObject;
function Shooter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.visible = false;
	
	this.origin = new Point();
	this.frame = 6;
	this.frame_row = 12;
	
	this.bullet_y_pos = [-24,-8,10];
	this.direction = 0;
	
	this.sprite = game.tileSprite;
	this.cooldown = 30;
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( Math.abs( dir.x ) < 384 ){
		if( this.direction == 0 ) this.direction = dir.x < 0 ? -1 : 1;
		
		if( this.cooldown < 0 ) {
			this.cooldown = Game.DELTASECOND * 0.6;
			var y = this.bullet_y_pos[ Math.floor( Math.random() * this.bullet_y_pos.length) ];
			var bullet = new Bullet(
				_player.position.x + (128*this.direction), 
				this.position.y + y, 
				-this.direction
			);
			bullet.collideDamage = this.damage;
			//bullet.speed = 0.8;
			game.addObject( bullet );
		}
		this.cooldown -= this.delta;
	} else {
		this.direction = 0;
	}
}
Shooter.prototype.idle = function(){}