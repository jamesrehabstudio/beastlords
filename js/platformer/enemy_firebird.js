FireBird.prototype = new GameObject();
FireBird.prototype.constructor = GameObject;
function FireBird(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "firebird";
	
	this.addModule( mod_combat );
	this.addModule( mod_rigidbody );
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.fire = new Point(x,y);
	
	this.speed = 0.4;
	
	this.states = {
		"turntime" : 0.0
	};
	
	this.on("collideObject", function(obj){
		if(obj instanceof Airjet && obj.active){
			if(this.grounded){
				this.grounded = false;
				this.force.y = -5;
			} else {
				
			}
		}
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
}
FireBird.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		
		if(this.stun > 0){
			this.force.x = 0;
		} else {
			//Turn logic
			if(dir.x > 0 != this.flip){
				this.states.turntime += this.delta;
				if(this.states.turntime > Game.DELTASECOND * 0.5){
					this.states.turntime = 0.0;
					this.flip = !this.flip;
				}
			} else {
				this.states.turntime = 0.0;
			}
			
			if(this.grounded){
				this.frame.y = 0;
				this.speed = 0.4;
				this.friction = 0.1;
				this.fire.x = this.position.x + this.forward() * 32;
				this.fire.y = this.position.y - 6;
			} else {
				this.frame.y = 1;
				this.speed = 0.25;
				this.friction = 0.05;
				this.force.y -= 0.8 * this.delta;
				this.fire.x = this.position.x;
				this.fire.y = this.position.y + 24;
			}
			
			this.force.x += this.delta * this.speed * this.forward();
		}
		
		var firearea = new Line(this.fire.x - 8, this.fire.y - 8, this.fire.x + 8, this.fire.y + 8);
		var hits = game.overlaps(firearea);
		for(var i=0; i < hits.length; i++){
			if( hits[i] instanceof Player && hits[i].intersects(firearea) ){
				hits[i].hurt(this, this.damage);
			}
		}
	}
}

FireBird.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite("bullets",this.fire.subtract(c),this.zIndex,new Point((game.timeScaled*0.5)%3,3),this.flip);
}