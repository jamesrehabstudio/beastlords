Shockowl.prototype = new GameObject();
Shockowl.prototype.constructor = GameObject;
function Shockowl(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "shockowl";
	this.speed = 7.0;
	this.zIndex = 3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.bounceCount = 3;
	this.mass = 1.0;
	this.gravity = 0.4;
	
	this.attack = 0.0;
	this.attackTime = Game.DELTASECOND * 0.5;
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Shockowl.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.attack > 0){
			this.attack -= this.delta;
			var progress = 1 - this.attack/this.attackTime;
			
			this.frame.x = Math.min(progress * 2, 1);
			this.frame.y = 1;
			
			if(Timer.isAt(this.attack,this.attackTime * 0.5, this.delta)){
				var lightning1 = new LightningBolt(this.position.x,this.position.y);
				var lightning2 = new LightningBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damage = lightning2.damage = this.damage;
				lightning1.force.x = lightning2.force.x = this.forward() * 6;
				lightning1.force.y = lightning2.force.y = -12;
				game.addObject(lightning1);
				game.addObject(lightning2);
			}
		} else {
			this.frame.x = 1.2 + this.force.y * 0.2;
			this.frame.y = 0;
			
			if(this.grounded){
				this.force.x = this.forward() * this.speed;
				this.force.y = -4;
				this.grounded = false;
				this.bounceCount--
				this.flip = dir.x > 0;
				
				if(this.bounceCount <= 0){
					this.attack = this.attackTime;
					this.bounceCount = 4;
				}
			}
		}
	} else{
		this.frame.x = 0;
		this.frame.y = 2;
	}
}