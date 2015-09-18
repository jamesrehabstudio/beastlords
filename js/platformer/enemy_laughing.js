Laughing.prototype = new GameObject();
Laughing.prototype.constructor = GameObject;
function Laughing(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = dataManager.damage(2);
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.sprite = sprites.laughing;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 0.225;
	this.frame = 0;
	this.frame_row = 0;
	this.life = dataManager.life(0);
	this.gravity = 0.0;
	this.friction = 0.08;
	
	this.cooldown = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			
		} else if ( obj.hasModule(mod_combat) ) {
			var dif = this.position.subtract( obj.position ).normalize();
			this.force.x += dif.x * this.speed * this.delta;
			this.force.y += dif.y * this.speed * this.delta;
		}
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Laughing.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		this.flip = dir.x > 0;
		
		var gotopos = this.position;
		
		if( this.cooldown <= 0 ) {
			gotopos = new Point(
				_player.position.x,
				_player.position.y
			);
			if( this.cooldown < -Game.DELTASECOND * 2){
				this.cooldown = Game.DELTASECOND * 3
			}
		} else {
			//Hover around the player
			gotopos = new Point(
				_player.position.x + (this.flip?1:-1) * 96,
				_player.position.y - 56
			);
			this.strike( new Line(-8,-4,8,4) );
		}
		
		this.cooldown -= this.delta;
		var direction = gotopos.subtract(this.position).normalize();
		this.force.x += direction.x * this.delta * this.speed;
		this.force.y += direction.y * this.delta * this.speed;
	}
	
	//Animation
	this.frame = (this.frame + this.delta * 0.2 ) % 3;
}