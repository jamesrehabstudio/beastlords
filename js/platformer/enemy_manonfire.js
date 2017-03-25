ManOnFire.prototype = new GameObject();
ManOnFire.prototype.constructor = GameObject;
function ManOnFire(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.sprite = "manonfire";
	this.speed = 1.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.timers = {
		"walkcycle" : 0.0,
		"cooldown" : 0.0,
		"fireball" : 0.0,
		"fireballTime" : Game.DELTASECOND * 1.2
	}
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.damage = 0;
	this.damageFire = Spawn.damage(3,this.difficulty);
	this.defencePhysical = 0.6;
	this.defenceFire = 1.2;
	this.defenceIce = -1.0;
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = -this.force.x;
		this.flip = !this.flip;
	});
	
	this.on("collideObject", function(obj){
		if(this.life > 0){
			if(obj instanceof Player){
				obj.hurt(this,this.getDamage());
			}
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		this.frame.x = 0;
		this.frame.y = 2;
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
ManOnFire.prototype.update = function(){
	if ( this.life > 0 ) {
		if(this.timers.fireball > 0){
			var progress = 1 - (this.timers.fireball / this.timers.fireballTime);
			this.timers.fireball -= this.delta;
			
			this.frame = ManOnFire.anim_fire.frame(progress);
			
			if(Timer.isAt(this.timers.fireball,this.timers.fireballTime*0.5,this.delta)){
				var fb = Bullet.createFireball(this.position.x, this.position.y,{"team":this.team,"damage":this.damageFire});
				fb.force = new Point(this.forward() * 6, 0);
				game.addObject(fb);
			}
		} else {
			if( this.atLedge() ){
				//Turn around, don't fall off the edge
				this.force.x = -this.force.x;
				this.flip = !this.flip;
			}
			
			var dir = this.position.subtract(_player.position);
			
			if(Math.abs(dir.y) < 48 && this.timers.cooldown <= 0){
				this.flip = dir.x > 0;
				this.timers.fireball = this.timers.fireballTime;
				this.timers.cooldown = Game.DELTASECOND * (2.0 * Math.random()*1.5);
			}
			
			this.timers.cooldown -= this.delta;
			this.force.x = this.speed * this.forward();
			this.timers.walkcycle = (this.timers.walkcycle + this.delta * 0.3) % 6;
			this.frame.x = this.timers.walkcycle % 3;
			this.frame.y = this.timers.walkcycle / 3;
		}
		
		Background.pushLight( this.position, 120, COLOR_FIRE );
	} else{
		this.frame.x += this.delta * 0.3;
		this.frame.y = 2;
		
		if(this.frame.x >= 3){
			this.trigger("death");
		}
	}
}
ManOnFire.anim_fire = new Sequence([
	[0,3,0.1],
	[1,3,0.2],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.5]
]);