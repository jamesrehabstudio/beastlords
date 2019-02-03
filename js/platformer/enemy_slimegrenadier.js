SlimeGrenadier.prototype = new GameObject();
SlimeGrenadier.prototype.constructor = GameObject;
function SlimeGrenadier(x,y,d,o){
	this.constructor();
	
	var bottom = y + d[1] * 0.5;
	
	this.position.x = x;
	this.position.y = bottom - 40;
	this.startPosition = new Point(this.position.x,this.position.y);
	this.width = 24;
	this.height = 48;
	
	this.speed = 1.5;
	this.sprite = "slimegrenadier";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	if("speed" in o){
		this.speed = o["speed"] * 1;
	}
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.stun_time = Game.DELTASECOND;
	this.life = Spawn.life(6, this.difficulty);
	this.xpDrop = Spawn.xp(6,this.difficulty);
	this.damage = 0;
	this.damageSlime = Spawn.damage(3, this.difficulty);
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.mass = 3.0;
	this.death_time = Game.DELTASECOND * 0.5;
	
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	this.times = {
		"cooldown" : 0.0,
		"cooldownTime" : Game.DELTASECOND * 3,
		"attack" : new Timer(0),
		"attackRelease" : Game.DELTASECOND * 0.2,
		"attackWarm" : Game.DELTASECOND * 0.5
	};
}
SlimeGrenadier.prototype.update = function(){
	if(this.life > 0){
		var dir = _player.position.subtract(this.position);
		
		if(this.times.attack.time > 0){
			//Throw attack
			var progress = 1.0 - (this.times.attack.time / this.times.attack.start);
			this.frame.x = Math.floor(progress * 5);
			this.frame.y = 1;
			
			if(this.times.attack.at(this.times.attackRelease)){
				//Throw bomb
				var nade = new Gernade(this.position.x, this.position.y);
				nade.damageSlime = this.damageSlime;
				nade.force.x = Math.min(Math.abs(dir.x)*0.04,30);
				nade.force.y = -5;
				nade.team = this.team;
				if(this.flip){
					nade.force.x *= -1.0;
				}
				game.addObject(nade);
			}
			this.times.attack.tick(this.delta);
		} else if(this.stun > 0) {
			//stun
			this.frame.x = 4;
			this.frame.y = 0;
		} else {
			//idle
			
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			this.flip = dir.x < 0;
			
			if(this.times.cooldown <= 0 ){
				this.times.cooldown = this.times.cooldownTime;
				this.times.attack.set(this.times.attackWarm);
			}
			this.times.cooldown -= this.delta;
		}
	} 
}

Gernade.prototype = new GameObject();
Gernade.prototype.constructor = GameObject;
function Gernade(x,y,d,o){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "bullets";
	
	this.frame.x = 5;
	this.frame.y = 0;
	
	this.addModule( mod_rigidbody );
	
	this.damage = 0;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.friction = 0.03;
	this.gravity = 0.5;
	this.bounce = 0.9;
	this.collisionReduction = -0.9;
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && this.team != obj.team){
			obj.hurt(this,Combat.getDamage.apply(this));
			this.destroy();
		}
	});
	this.on("sleep",function(){
		this.destroy();
	});
	
	this.times = {
		"fuse" : Game.DELTASECOND * 2
	};
}
Gernade.prototype.update = function(x,y,d,o){
	if(this.times.fuse <= 0){
		this.destroy();
	}
	this.times.fuse -= this.delta;
}
