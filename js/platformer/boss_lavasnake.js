LavaSnake.prototype = new GameObject();
LavaSnake.prototype.constructor = GameObject;
function LavaSnake(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 32;
	this.sprite = "lavasnake";
	this.active = false;
	
	this.addModule( mod_block );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.lifeMax = this.life = Spawn.life(26,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	this.force = new Point();
	this.friction = 0.02;
	this.speed = 0.1;
	
	this.states = {
		
	};
	
	this.tail = new Array();
	for(var i=0; i < 8; i++){
		var t = new LavaSnakeBody(x,y);
		this.tail.push(t);
		game.addObject(t);
		t.position.x += (i+1) * t.distance;
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
		}
		if(obj.hasModule(mod_rigidbody) && obj.isStuck){
			this.force.x *= -1;
			this.force.y *= -1;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.force.x = -this.force.x;
	});
	this.on("collideVertical", function(dir){
		this.force.y = -this.force.y;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
		
		for(var i=0; i < this.tail.length; i++){
			this.tail[i].destroy();
		}
	});
	this.calculateXP();
}
LavaSnake.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0 && this.active){
		var dirnormal = _player.position.subtract(this.position).normalize();
		
		this.force.x += dirnormal.x * this.delta * this.speed;
		this.force.y += dirnormal.y * this.delta * this.speed;
		
		game.t_move(this,this.force.x * this.delta,this.force.y * this.delta);
		this.force = this.force.scale(1.0 - this.friction * this.delta);
		
		this.updatetail();
	}
}
LavaSnake.prototype.idle = function(){}

LavaSnake.prototype.updatetail = function(){
	for(var i=0; i < this.tail.length; i++){
		var head = i > 0 ? this.tail[i-1] : this;
		var t = this.tail[i];
		var dir = t.position.subtract(head.position).normalize(t.distance);
		t.position = head.position.add(dir);
	}
}

LavaSnakeBody.prototype = new GameObject();
LavaSnakeBody.prototype.constructor = GameObject;
function LavaSnakeBody(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 32;
	this.sprite = "lavasnake";
	this.active = false;
	this.frame.x = 0;
	this.frame.y = 1;
	
	this.addModule( mod_block );
	this.parentPart = false;
	this.distance = 48;
}	