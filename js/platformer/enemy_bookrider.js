Bookrider.prototype = new GameObject();
Bookrider.prototype.constructor = GameObject;
function Bookrider(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.5;
	this.speedMax = 2.0;
	this.gotoForce = new Point(1,1);
	this.sprite = "bookrider";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 1.3,
		"cooldown" : Game.DELTASECOND * 2.0
	};
	this.states = {
		"attack" : 0.0,
		"cooldown" : this.times.cooldown
	};
	
	this.on("collideHorizontal", function(h){
		this.gotoForce.x = h > 0 ? -1 : 1;
	});
	this.on("collideVertical", function(v){
		this.gotoForce.y = v > 0 ? -1 : 1;
	});
	this.on("hurt", function(obj,damage){
		this.states.retreat = this.times.retreat;
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && obj.position.y > this.position.y && this.life > 0){
			obj.hurt(this,this.damage);
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	//this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.damageLight = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.pushable = false;
	this.hurtByDamageTriggers = false;
	
	this.mass = 1.0;
	this.friction = 0.2;
	this.gravity = 0.0;
}
Bookrider.prototype.update = function(){
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		
		if(this.states.attack > 0){
			this.force.x = this.force.y = 0.0;
			this.frame.x = this.frame.y = 0;
			this.states.attack -= this.delta;
			
			if(Timer.isAt(this.states.attack, this.times.attack * 0.5, this.delta )){
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damageLight = lightning2.damageLight = this.damageLight;
				lightning1.force.x = lightning2.force.x = 0.0;
				lightning1.force.y = lightning2.force.y = 0.0;
				game.addObject(lightning1);
				game.addObject(lightning2);
			}
			
			if(this.states.attack < this.times.attack * 0.5 ){
				this.frame.y = 1;
			}
			
		} else {
			if(dir.y >= 120) {
				this.gotoForce.y = -1;
			} else if (dir.y <= -120) {
				this.gotoForce.y = 1;
			}
			
			if(dir.x >= 200) {
				this.gotoForce.x = -1;
			} else if (dir.x <= -200) {
				this.gotoForce.x = 1;
			}
			
			this.force.x += this.gotoForce.x * this.delta * this.speed;
			this.force.y += this.gotoForce.y * this.delta * this.speed;
			
			//Artifically add friction to Y movement so it matches X movement
			this.force.y = this.force.y * (1.0 - (this.friction * this.delta));
			
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 32 && this.states.cooldown <= 0){
				this.states.attack = this.times.attack;
				this.states.cooldown = this.times.cooldown;
			}
			
			this.flip = this.force.x < 0;
			if(Math.abs(this.force.x) > 2.0){
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			} else if (Math.abs(this.force.x) > 1.0){
				this.frame.y = 1;
				this.frame.x = 1;
			} else {
				this.frame.y = 1;
				this.frame.x = 2;
			}
		}
		
		
		
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}