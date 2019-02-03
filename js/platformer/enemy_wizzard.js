WizzardBolter.prototype = new GameObject();
WizzardBolter.prototype.constructor = GameObject;
function WizzardBolter(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 2;
	this.offsetX = 0.0;
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		
	});
	this.on("collideObject", function(obj){
		if( obj instanceof WizzardBolter ) {
			var dif = this.position.x - obj.position.x;
			if(dif > 0){
				this.offsetX = Game.DELTASECOND * 0.5;
			} else {
				this.offsetX = -Game.DELTASECOND * 0.5;
			}
		}
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.xpDrop = Spawn.xp(5,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : Game.DELTASECOND,
		"align" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
WizzardBolter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attach > 0){
			this.states.attach -= this.delta;
		} else {
			//Align with player
			var ypos = _player.position.y + this.states.align;
			var speed = this.speed * this.delta;
			
			if(Math.abs(this.position.y - ypos) <= speed){
				this.position.y = ypos;
			} else if(this.position.y > ypos){
				this.position.y -= speed;
			} else {
				this.position.y += speed;
			}
			
			if(this.offsetX != 0){
				if(this.offsetX > 0){
					this.position.x += speed;
					this.offsetX -= this.delta;
					if(this.offsetX <= 0) {
						this.offsetX = 0;
					}
				} else {
					this.position.x -= speed;
					this.offsetX += this.delta;
					if(this.offsetX >= 0) {
						this.offsetX = 0;
					}
				}
			} else {
				if(Math.abs(dir.x) > 160){
					if(this.flip){
						this.position.x -= speed;
					} else {
						this.position.x += speed;
					}
				}
				
				if(Math.abs(dir.x) < 32){
					if(this.flip){
						this.position.x += speed;
					} else {
						this.position.x -= speed;
					}
				}
			}
			
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				//Attack
				this.states.attack = this.times.attackCool;
				this.states.cooldown = this.times.cooldown;
				this.states.align = Math.random() > 0.5 ? this.times.alignTop : this.times.alignBot;
				
				var bullet = new PhantomBullet(this.position.x, this.position.y);
				bullet.damage = this.damage;
				bullet.force.x = this.flip ? -4 : 4;
				game.addObject(bullet);
			}
		}
		this.frame = new Point();
	}
}


WizzardFlamer.prototype = new GameObject();
WizzardFlamer.prototype.constructor = GameObject;
function WizzardFlamer(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t3","t3","t3","t3","t3"];
	this.speed = 2;
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : Game.DELTASECOND,
		"align" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 3.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
WizzardFlamer.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attach > 0){
			this.states.attach -= this.delta;
		} else {
			//Align with player
			var ypos = _player.position.y + this.states.align;
			var speed = this.speed * this.delta;
			
			if(Math.abs(this.position.y - ypos) <= speed){
				this.position.y = ypos;
			} else if(this.position.y > ypos){
				this.position.y -= speed;
			} else {
				this.position.y += speed;
			}
			
			if(Math.abs(dir.x) > 160){
				if(this.flip){
					this.position.x -= speed;
				} else {
					this.position.x += speed;
				}
			}
			
			if(Math.abs(dir.x) < 96){
				if(this.flip){
					this.position.x += speed;
				} else {
					this.position.x -= speed;
				}
			}
			
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				//Attack
				this.states.attack = this.times.attackCool;
				this.states.cooldown = this.times.cooldown;
				this.states.align = Math.random() > 0.5 ? this.times.alignTop : this.times.alignBot;
				
				var xoff = 32;
				for(var i=0; i < 3; i++){
					var xpos = (this.flip?-1:1) * xoff;
					var ftower = new FlameTower(xpos+this.position.x, this.position.y);
					ftower.damage = this.damage;
					ftower.time = Game.DELTASECOND * i * -0.6;
					game.addObject(ftower);
					xoff += Math.random()>0.5 ?  40 : 80;
				}
			}
		}
		this.frame = new Point();
	}
}

WizzardSoldier.prototype = new GameObject();
WizzardSoldier.prototype.constructor = GameObject;
function WizzardSoldier(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t2","t2","t2","t2","t2"];
	this.speed = 2;
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 6.0,
		"attack" : Game.DELTASECOND * 3.0
	};
}
WizzardSoldier.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			//Attack			
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				for(var i=0; i < WizzardSoldier.enemyPlacement.length; i++){
					var xpos = (this.flip?-1:1) * WizzardSoldier.enemyPlacement[i];
					var enemy = new Flederknife(xpos+this.position.x, this.position.y, null, {"difficulty":this.difficulty});
					game.addObject(enemy);
				}
				this.destroy();
			}
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 80){
				this.position.x += (this.flip?1:-1) * this.speed * this.delta;
			}
			if(Math.abs(dir.x) > 96){
				this.position.x += (this.flip?-1:1) * this.speed * this.delta;
			}
			if(dir.y > -40){
				this.position.y -= this.speed * this.delta;
			}
			if(dir.y < -64){
				this.position.y += this.speed * this.delta;
			}
		}
	this.frame = new Point();
	}
}
WizzardSoldier.enemyPlacement = [-200,-128,80,128,200];

WizzardLightning.prototype = new GameObject();
WizzardLightning.prototype.constructor = GameObject;
function WizzardLightning(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t1","t1","t1","t1","t1"];
	this.speed = 1;
	this.direction = 0;
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 2.0,
		"attack" : Game.DELTASECOND * 1.0
	};
}
WizzardLightning.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			//Attack			
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damage = lightning2.damage = this.damage;
				game.addObject(lightning1);
				game.addObject(lightning2);
				
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.attack = Game.DELTASECOND * 1;
			}
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			this.direction += this.delta * 0.1;
			this.position.x += Math.sin(this.direction) * this.speed * this.delta;
			this.position.y += Math.cos(this.direction) * this.speed * this.delta;
		}
	this.frame = new Point();
	}
}


//Wizzard attacks


GroundBolt.prototype = new GameObject();
GroundBolt.prototype.constructor = GameObject;
function GroundBolt(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 8;
	this.damageLight = 1;
	this.time = 0;
	this.speed = 0;
	this.team = 0;
	this.color = COLOR_LIGHTNING;
	this.lightRadius = 48;
	
	this.on("sleep", function(){
		this.destroy();
	});
	/*
	this.on("collideObject", function(obj){
		if( obj instanceof Player && !this.grounded) {
			obj.hurt(this, this.getDamage() );
		}
	});
	*/
	this.on(["struckTarget","collideHorizontal"], function(dir){
		this.destroy();
	});
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
}

GroundBolt.prototype.update = function(){
	this.time += this.delta;
	
	if(this.grounded){
		this.addHorizontalForce(this.speed);
		this.flip = this.force.x < 0; 
		Combat.strike.apply(this,[new Line(0,0,8,4)]);
	} else {
		//fall
	}
	
	if(this.lightRadius > 0){
		Background.pushLight(this.position,this.lightRadius,this.color);
	}
	
	if(this.time > Game.DELTASECOND * 3){
		this.destroy();
	}
}
	
GroundBolt.prototype.render = function(g,c){
	g.color = this.color;
	g.scaleFillRect(
		(this.position.x - this.width*0.5) - c.x,
		(this.position.y - this.height*0.5) - c.y,
		this.width, this.height
	);
}