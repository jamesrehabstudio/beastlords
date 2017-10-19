FlameSlime.prototype = new GameObject();
FlameSlime.prototype.constructor = GameObject;
function FlameSlime(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "flameslime";
	this.speed = 4.0;
	this.zIndex = 3;
	this.small = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = 1;
	this.damage = 0;
	this.damageFire = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.defencePhysical = Spawn.defence(2, this.difficulty);
	this.defenceFire = Spawn.defence(4, this.difficulty);
	this.defenceIce = Spawn.defence(-4, this.difficulty);
	this.death_time = Game.DELTASECOND * 0.01;
	this.frame.y = 3;
	
	this.spawnSmallSlimes = true;
	
	if("small" in o){
		this.small = true;
		this.damageFire = Math.max(Math.floor(this.damageFire*0.5), 1);
		this.width = this.height = 14;
		this.frame.y = 4;
		this.spawnSmallSlimes = false;
		//Set origin to correct sprite sheet
		this.origin = new Point(0.5,0.2);
	}
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	
	this.jumpCount = 3;
	this.cooldown = 0.0;
	this.rest = 0.0;
	this.warm = 0.0;
	this.jumpForce = 9.0;
	this.firstSpawn = true;
	
	this.rest = Game.DELTASECOND * (0.3 + Math.random() * 1.4);
	
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			if(obj.invincible <= 0){
				obj.hurt(this, this.getDamage());
				this.life = 0;
				this.isDead();
			}
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		audio.play("kill",this.position);
		if(!this.small){
			Item.drop(this);
		}
		this.destroy();
		
		if(this.spawnSmallSlimes){
			//Spawn 
			for(var i = 0; i < 6; i++){
				var slime = new FlameSlime(
					this.position.x + 24 * (0.5 - Math.random()), 
					this.position.y + 24 * (0.5 - Math.random()),
					false, 
					{
						"difficulty" : this.difficulty,
						"small" : true
					}
				);
				slime.invincible = Game.DELTASECOND * 0.5;
				slime.force.x = -2.0 + (Math.random() * 4);
				slime.force.y = -2.0;
				slime.grounded = false;
				game.addObject(slime);
			}
		}
	});
}
FlameSlime.JUMP_SMALL = 3.0;
FlameSlime.JUMP_BIG = 5.0;


FlameSlime.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.grounded){
			this.force.x = 0;
			this.firstSpawn = false;
			if(this.rest > 0){
				this.frame.x = 3; 
				this.rest -= this.delta;
			} else if(this.cooldown > 0){
				this.frame.x = 0; 
				this.cooldown -= this.delta;
			} else if(this.warm > 0){
				this.frame.x = 1;
				this.warm -= this.delta;
			} else {
				this.jump = false;
				this.grounded = false;
				this.flip = dir.x > 0;
				
				if(this.jumpCount <= 0){
					this.force.y = -FlameSlime.JUMP_BIG;
					this.jumpCount = 3;
					this.warm = Game.DELTASECOND * 2.5;
					this.rest = Game.DELTASECOND * 1.5;
					this.cooldown = Game.DELTASECOND * (0.3 + Math.random() * 0.1);
				} else {
					this.force.y = -FlameSlime.JUMP_SMALL;
					this.jumpCount--;
					this.cooldown = Game.DELTASECOND * (0.3 + Math.random() * 0.1);
					this.warm = Game.DELTASECOND * (0.3 + Math.random() * 0.2);
				}
			}
			
		} else {
			this.frame.x = 2; 
			if(!this.firstSpawn){
				this.force.x = this.forward() * this.speed;
			}
		}
		Background.pushLight(this.position, 80, COLOR_FIRE);
	} else{
		this.frame.x = 0;
	}
}


FlameSlimeWalker.prototype = new GameObject();
FlameSlimeWalker.prototype.constructor = GameObject;
function FlameSlimeWalker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 48;
	this.sprite = "flameslime";
	this.speed = 0.25;
	this.zIndex = 3;
	
	//Set origin to correct sprite sheet
	this.origin = new Point(0.5,0.75);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.hurtByDamageTriggers = false;
	this.spawnDuplicate = false;
	this.walkerID = false;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	var autoWalkerID = "walker_"+Math.floor(x)+"_"+Math.floor(y);
	
	this.walkerID = autoWalkerID;
	
	var walkers = game.getObjects(Walker);
	var walker = walkers.find(function(a){ return a.walkerID == autoWalkerID; });
	
	if(walker){
		if(walkers[i].isOnscreen()){
			this.spawnDuplicate = true;
		} else {
			walkers[i].destroy();
		}
	}
	
	
	this.lifeMax = this.life = 1;
	this.damage = 0;
	this.damageFire = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.defencePhysical = Spawn.defence(1, this.difficulty);;
	this.defenceFire = Spawn.defence(4, this.difficulty);;
	this.defenceIce = Spawn.defence(-4, this.difficulty);;
	this.death_time = Game.DELTASECOND * 0.01;
	this.frame.y = 3;
	
	this.spawnSmallSlimes = true;
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	
	this.jumpCount = 3;
	this.cooldown = 0.0;
	this.rest = 0.0;
	this.warm = 0.0;
	this.jumpForce = 9.0;
	this.firstSpawn = true;
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.getDamage());
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		audio.play("kill",this.position);
		this.destroy();
		
		if(this.spawnSmallSlimes){
			//Spawn 
			this.createSlime(-10.0);
			this.createWalker();
		}
	});
}
FlameSlimeWalker.prototype.createSlime = function(upwardForce){
	var slime = new FlameSlime(
		this.position.x, 
		this.position.y,
		false, 
		{
			"difficulty" : this.difficulty
		}
	);
	slime.invincible = Game.DELTASECOND * 0.5;
	slime.force.x = -2.0 + (Math.random() * 4);
	slime.force.y = upwardForce;
	slime.grounded = false;
	game.addObject(slime);
}
FlameSlimeWalker.prototype.createWalker = function(){
	var walker = new Walker(this.position.x, this.position.y);
	walker.walkerID = this.walkerID;
	walker.standTime = Walker.STAND_TIME;
	walker.flip = this.flip;
	game.addObject(walker);
}
FlameSlimeWalker.prototype.update = function(){
	if(this.spawnDuplicate){
		this.destroy();
		this.createSlime(0.0);
		this.spawnDuplicate = false;
	} else if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.grounded){
			this.flip = dir.x > 0;
			
			this.force.x += this.forward() * this.speed * this.delta;
			
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
			this.frame.y = 0;
			
		} else {
			
		}
		Background.pushLight(this.position, 80, COLOR_FIRE);
	} else{
		this.frame.x = 0;
	}
}