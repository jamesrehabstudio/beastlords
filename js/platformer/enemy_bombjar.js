Bombjar.prototype = new GameObject();
Bombjar.prototype.constructor = GameObject;
function Bombjar(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "bombjar";
	this.speed = 3.0;
	this.zIndex = 3;
	this.blastradius = 24;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.walkcycle = 0.0;
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.bounceCount = 4;
	this.mass = 1.0;
	this.death_time = 0.1;
	this.gravity = 0.5;
	this.pushable = false;
	this.flip = x > _player.position.x;
	
	this.on("collideHorizontal", function(x){
		this.force.x = -this.force.x;
		this.flip = !this.flip;
	});
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		var explosion = new EffectBang(this.position.x,this.position.y);
		game.addObject(explosion);
		
		c = this.corners();
		l = new Line(
			c.left - this.blastradius, 
			c.top - this.blastradius, 
			c.right + this.blastradius, 
			c.bottom + this.blastradius
		);
		list = game.overlaps(l);
		for(var i=0; i < list.length; i++){
			var obj = list[i];
			if(obj instanceof Player){
				obj.hurt(this, this.damage);
			} else if(obj.hasModule(mod_combat)){
				obj.hurt(this, this.damage * 4);
			}
		}
		shakeCamera(Game.DELTASECOND * 0.5, 4);
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Bombjar.prototype.update = function(){
	if ( this.life > 0 ) {
		
		if(this.grounded){
			this.force.x = this.forward() * this.speed;
			this.force.y = -5;
			this.grounded = false;
			this.bounceCount--
			
			if(this.bounceCount <= 0){
				this.bounceCount = 4;
				var fire = new Fire(this.position.x, this.position.y - this.height * 0.5);
				fire.grounded = false;
				fire.force.y = -5;
				game.addObject(fire);
			}
		}
		
		this.walkcycle = (this.walkcycle + this.delta * 0.3) % 6;
		this.frame.x = this.walkcycle % 3;
		this.frame.y = this.walkcycle / 3;
		
		Background.pushLight( this.position, 180, COLOR_FIRE );
	} else{
		
	}
}