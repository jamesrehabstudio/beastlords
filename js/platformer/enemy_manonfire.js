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
	
	this.walkcycle = 0.0;
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
		if( game.getTile( 
			16 * this.forward() + this.position.x, 
			this.position.y + 24, game.tileCollideLayer) == 0 
		){
			//Turn around, don't fall off the edge
			this.force.x = -this.force.x;
			this.flip = !this.flip;
		}
		
		this.force.x = this.speed * this.forward();
		this.walkcycle = (this.walkcycle + this.delta * 0.3) % 6;
		this.frame.x = this.walkcycle % 3;
		this.frame.y = this.walkcycle / 3;
		
		Background.pushLight( this.position, 120, COLOR_FIRE );
	} else{
		this.frame.x += this.delta * 0.3;
		this.frame.y = 2;
		
		if(this.frame.x >= 3){
			this.trigger("death");
		}
	}
}