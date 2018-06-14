BikerSmall.prototype = new GameObject();
BikerSmall.prototype.constructor = GameObject;
function BikerSmall(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "biker";
	this.speed = 6.0;
	this.topspeed = this.speed * 20;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"backtrack" : 0,
		"cooldown" : 0,
		"attack" : 0
	}
	
	this.difficulty = o.getInt("difficulty", Spawn.difficulty);
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.mass = 1;
	this.friction = 0.01;
	this.pushable = false;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.on("collideHorizontal", function(h){
		if(this.states.backtrack <= 0){
			var dir = this.position.subtract(this.target().position);
			
			if( (dir.x > 0 && h < 0) || (dir.x < 0 && h > 0) ){
				this.states.backtrack = Game.DELTASECOND * 4.0;
			}
		}
	});
	
	this.on("collideObject", function(obj){
		if(this.life > 0 && obj instanceof Player){
			obj.hurt(this,this.damage);
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		Item.drop(this,12);
		audio.play("kill",this.position);
	});
}

BikerSmall.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(this.target().position);
		
		this.flip = this.force.x < 0;
		this.states.backtrack -= this.delta;
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
		
		let f = (dir.x > 0 ? -1 : 1) * (this.states.backtrack > 0 ? -1 : 1);
		this.addHorizontalForce(this.speed * f, 0.6);
		
		
		if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
			this.states.attack = Game.DELTASECOND * 0.5;
			this.states.cooldown = Game.DELTASECOND * 4.0;
			
			var molotov = new Molotov(this.position.x, this.position.y);
			molotov.team = this.team;
			molotov.force.y = -10;
			molotov.force.x = this.forward() * 5;
			molotov.damage = this.damage;
			game.addObject(molotov);
		}
		
		//Animate
		if(this.states.attack > 0){
			this.frame.x = 3;
			this.frame.y = 3;
		} else if(Math.abs(this.force.x) < 1.2){
			this.frame.x = (Math.abs(this.force.x) < 0.5 ? 1 : 0);
			this.frame.y = 4;
		} else {
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 3;
			this.frame.y = 3;
		}
	}
}


Molotov.prototype = new GameObject();
Molotov.prototype.constructor = GameObject;
function Molotov(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 14;
	this.zIndex = 1;

	this.sprite = "bullets";
	this.frame.x = 6;
	this.frame.y = 0;
	this.rotate = 0.0;
	this.damage = 1;
	this.spinspeed = 12;
	
	this.timer = 3.0 * Game.DELTASECOND;
	this.cooldown = 0.5* Game.DELTASECOND;
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
	this.collisionReduction = -1.0;
	this.friction = 0;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on(["collideHorizontal", "collideVertical"], function(dir){
		this.explode();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
			this.explode();
		}
	});
}
Molotov.prototype.explode = function(){
	game.addObject(new EffectBang(this.position.x, this.position.y));
	
	for(var i=0; i < 6; i++){
		var pos = new Point(i*12+this.position.x-36,this.position.y);
		var fire = new Fire(pos.x, pos.y);
		game.addObject(fire);
	}
	
	this.destroy();
}
Molotov.prototype.render = function(g,c){	
	this.rotate += this.delta * this.spinspeed;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"shader" : this.filter,
			"rotate" : this.rotate
		}
	)
}