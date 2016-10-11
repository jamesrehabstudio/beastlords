Garmr.prototype = new GameObject();
Garmr.prototype.constructor = GameObject;
function Garmr(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 80;
	this.height = 112;
	this.sprite = "garmr";
	
	this.speed = 0.8;
	this.force = new Point();
	this.friction = 0.1;
	
	this.active = false;
	this.closeToBoss = false;
	this.track = null;
	
	this.armforwardPos = Garmr.frontArm.scale(1);
	this.armbackPos = Garmr.backArm.scale(1);
	this.armforwardFrame = new Point(0,1);
	this.armbackFrame = new Point(0,2);
	this.enemies = new Array();
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops["trigger"];
	}
	if("difficulty" in ops){
		this.difficulty = ops["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(24,this.difficulty);
	this.mass = 5.0;
	this.damage = Spawn.damage(6,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,140);
		this.destroy();
	});
	this.on("downstabbed",function(obj,damage){
		if(this.states.current != Garmr.STATE_PUNCH){
			this.setState(Garmr.STATE_PUNCH);
		}
	});
	this.on(["pre_death","player_death"],function(){
		var bullets = game.getObjects(HomingBullet);
		var towers = game.getObjects(FlameTower);
		
		for(var i=0; i < bullets.length;i++){
			bullets[i].destroy();
		}
		for(var i=0; i < towers.length;i++){
			towers[i].destroy();
		}
		for(var i=0; i < this.enemies.length;i++){
			this.enemies[i].destroy();
		}
	});
	
	this.states = {
		"current" : Garmr.STATE_IDLE,
		"time" : 0.0,
		"timeTotal" : 0.0,
		"transition" : 0.0
	}
}

Garmr.STATE_IDLE = 0;
Garmr.STATE_PUNCH = 1;
Garmr.STATE_FIREBREATH = 2;
Garmr.STATE_MISSLES = 3;


Garmr.prototype.setState = function(s){
	this.states.current = s;
	
	var dir = this.position.subtract(_player.position);
	this.flip = dir.x > 0;
	
	if(this.states.current == Garmr.STATE_IDLE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 2.0;
	} else if(this.states.current == Garmr.STATE_PUNCH){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 1.0;
	} else if(this.states.current == Garmr.STATE_FIREBREATH){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 1.3;
	} else if(this.states.current == Garmr.STATE_MISSLES){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 1.5;
	} 
}
Garmr.prototype.selectState = function(){
	var dir = this.position.subtract(_player.position);
	var _punch = 1.0;
	var _fire = 1.0;
	var _missle = 1.0;
	
	if(!_player.grounded){ _punch += 1;}
	if(Math.abs(dir.x) < 64){ _fire += 1;}
	if(Math.abs(dir.x) > 128){ _missle += 1;}
	
	var total = _punch + _fire + _missle;
	var roll = Math.random() * total;
	
	if(roll < _punch){
		return Garmr.STATE_PUNCH;
	} 
	roll -= _punch;
	if(roll < _fire){
		return Garmr.STATE_FIREBREATH;
	}
	
	return Garmr.STATE_MISSLES
}

Garmr.prototype.update = function(){
	if ( this.life > 0 && this.active ) {
		var dir = this.position.subtract(_player.position);
		
		var progress = 1 - (this.states.time / this.states.timeTotal);
		
		if(this.states.current == Garmr.STATE_IDLE){
			//idle
			this.animation(Garmr.STATE_IDLE,0);
			var m = 16;
			if(this.position.x > this.boss_starting_position.x + m){
				this.force.x -= this.speed * this.delta;
			} else if(this.position.x < this.boss_starting_position.x - m){
				this.force.x += this.speed * this.delta;
			}
			
			if(this.position.y > this.boss_starting_position.y + m){
				this.force.y -= this.speed * this.delta;
			} else if(this.position.y < this.boss_starting_position.y - m){
				this.force.y += this.speed * this.delta;
			}
			this.flip = dir.x > 0;
			this.states.time -= this.delta;
			if(this.states.time <= 0){
				this.spawnEnemy();
				this.setState(this.selectState());
			}
			
		} else if(this.states.current == Garmr.STATE_PUNCH){
			//Punch
			this.states.time -= this.delta;
			
			if(this.states.time > Game.DELTASECOND * 0.5){
				var align = new Point(this.forward()*64,-28);
				if(dir.y + align.y < -8 ){
					this.force.y += this.speed * this.delta;
				} else if(dir.y + align.y > 8 ) {
					this.force.y -= this.speed * this.delta;
				}
				
				if(dir.x + align.x < -8 ){
					this.force.x += this.speed * this.delta;
				} else if(dir.x + align.x > 8 ) {
					this.force.x -= this.speed * this.delta;
				}
				
				this.animation(Garmr.STATE_PUNCH,0);
			} else if(this.states.time > 0){
				this.animation(Garmr.STATE_PUNCH,1);
				this.strike(new Line(0,-28,112,-4));
				
				if(Timer.isAt(this.states.time,Game.DELTASECOND * 0.5,this.delta)){
					this.force.x = this.forward() * this.speed * 8;
					this.force.y = 0;
				}
			} else {
				this.setState(Garmr.STATE_IDLE);
			}
		} else if(this.states.current == Garmr.STATE_FIREBREATH){
			//Fire breath
			this.states.time -= this.delta;
			
			if(this.states.time > Game.DELTASECOND * 1.0){
				this.animation(Garmr.STATE_FIREBREATH,progress < 0.03 ? 0 : 1);
			} else if(this.states.time > 0){
				this.animation(Garmr.STATE_FIREBREATH,2);
				if(Timer.isAt(this.states.time, Game.DELTASECOND, this.delta)){
					//Unlease
					this.fireAttack(12);
				}
			} else {
				this.setState(Garmr.STATE_IDLE);
			}
			
		} else if(this.states.current == Garmr.STATE_MISSLES){
			//homing missles
			this.animation(Garmr.STATE_MISSLES,0);
			
			this.states.time -= this.delta;
			
			if(Timer.isAt(this.states.time, Game.DELTASECOND, this.delta)){
				//Unlease
				this.bulletAttack(5);
			}
			
			if(this.states.time <= 0){
				this.setState(Garmr.STATE_IDLE);
			}
		}
		
		this.position.x += this.force.x * this.delta;
		this.position.y += this.force.y * this.delta;
		this.force = this.force.scale(1-this.friction*this.delta);
		
	}
	
	Background.pushLight(this.projection, 240);
}

Garmr.prototype.spawnEnemy = function(){
	var position = this.position.add(new Point(
		this.forward() * (this.width + Math.random() * 100),
		Math.random() * 80 - 40
	));
	Spawn.addToList(position,this.enemies,Amon,5,{"difficulty":this.difficulty});
}
Garmr.prototype.fireAttack = function(amount){
	var xoff = amount * -40 * 0.5;
	for(var i=0; i < amount; i++){
		var ftower = new FlameTower(xoff+this.position.x, this.position.y);
		ftower.damage = this.damage;
		ftower.time = Math.abs(xoff/40) * 0.2 * -Game.DELTASECOND;
		game.addObject(ftower);
		xoff += 40;
	}
}
Garmr.prototype.bulletAttack = function(amount){
	var pos = this.position.add(new Point(this.forward()*80,8));
	for(var i=0; i < amount; i++){
		var bullet = new HomingBullet(pos.x, pos.y);
		bullet.damage = this.damage;
		bullet.gotoPos = new Point(
			this.position.x + (64 + Math.random() * 128) * this.forward(),
			this.position.y + (-120 + Math.random() * 200)
		);
		game.addObject(bullet);
	}
}

Garmr.prototype.animation = function(f,n){
	if(this.states.current == Garmr.STATE_IDLE){
		if(n == 0){
			this.frame = new Point((this.frame.x + this.delta * 0.2) % 4,0);
			this.armforwardFrame = new Point(0,1);
			this.armbackFrame = new Point(0,2);
			
			var pass = game.timeScaled * 0.1;
			var armlift = (Math.abs(Math.sin(pass))-Math.abs(Math.sin(pass-2.5))) * -3;
			this.armforwardPos = Garmr.frontArm.add(new Point(0,armlift));
			this.armbackPos = Garmr.backArm.add(new Point(0,armlift));
		}
	} else if(this.states.current == Garmr.STATE_PUNCH){
		if(n == 0){
			this.frame = new Point(0,0);
			this.armforwardFrame = new Point(4,1);
			this.armbackFrame = new Point(1,2);
		} else if(n == 1){
			this.frame = new Point(5,0);
			this.armforwardPos.x = 40;
			this.armbackPos.x = 0;
			this.armforwardFrame = new Point(5,1);
			this.armbackFrame = new Point(1,2);
		}
	} else if(this.states.current == Garmr.STATE_FIREBREATH){
		if(n == 0){
			this.frame = new Point(0,3);
			this.armforwardFrame = new Point(0,1);
			this.armbackFrame = new Point(0,2);
			this.armforwardPos = new Point(-58,-14);
			this.armbackPos = new Point(12,-14);
		} else if(n == 1){
			this.frame = new Point(1,3);
			this.armforwardFrame = new Point(2,1);
			this.armbackFrame = new Point(0,2);
			this.armforwardPos = new Point(-68,-16);
			this.armbackPos = new Point(0,-16);
		} else if(n == 2){
			this.frame = new Point(2,3);
			this.armforwardFrame = new Point(3,1);
			this.armbackFrame = new Point(1,2);
			this.armforwardPos = new Point(-56,-14);
			this.armbackPos = new Point(0,-14);
		}
	} else if(this.states.current == Garmr.STATE_MISSLES){
		if(n == 0){
			this.frame = new Point(0,0);
			this.armforwardFrame = new Point(1,1);
			this.armforwardPos = new Point(24,-16);
			this.armbackFrame = new Point(1,2);
			this.armbackPos = new Point(56,-14);
		}
	}
}
Garmr.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	var fa = this.armforwardPos.scale(this.forward(),1);
	var ba = this.armbackPos.scale(this.forward(),1);
	
	g.renderSprite(this.sprite,this.position.add(fa).subtract(c),this.zIndex+1,this.armforwardFrame,this.flip,{"shader":this.filter});
	g.renderSprite(this.sprite,this.position.add(ba).subtract(c),this.zIndex-1,this.armbackFrame,this.flip,{"shader":this.filter});
	
}
Garmr.prototype.idle = function(){}

Garmr.frontArm = new Point(-46,-14);
Garmr.backArm = new Point(68,-14);



HomingBullet.prototype = new GameObject();
HomingBullet.prototype.constructor = GameObject;
function HomingBullet(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "bullets";
	this.height = 8;
	this.width = 8;
	this.damage = 1;
	this.time = 0;
	this.speed = 8;
	this.startPos = new Point(x,y);
	this.gotoPos = new Point(x,y);
	this.zIndex = 5;
	
	this.angle = 0;
	
	this.timers = {
		"wait" : Game.DELTASECOND * 1.5,
		"destroy" : Game.DELTASECOND * 3.8
	};
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			obj.hurt(this,this.damage);
			game.addObject(new EffectBang(this.position.x,this.position.y));
			this.destroy();
		}
	});
}

HomingBullet.prototype.update = function(){
	this.time += this.delta;
	
	if(Timer.isAt(this.time,this.timers.wait,this.delta)){
		var dir = _player.position.subtract(this.position);
		this.angle = Math.atan2(dir.y, dir.x);
	}
	
	if(this.time < this.timers.wait){
		var prog = this.time / this.timers.wait;
		this.position = Point.lerp(this.startPos,this.gotoPos, prog);
		this.frame.x = (this.frame.x + this.delta) % 3;
		this.frame.y = 3;
	} else {
		this.position.x += Math.cos(this.angle) * this.speed * this.delta;
		this.position.y += Math.sin(this.angle) * this.speed * this.delta;
		
		this.frame.x = Math.max((this.frame.x + this.delta)%8,5);
		this.frame.y = 1;
	}
	if(this.time > this.timers.destroy){
		this.destroy();
	}
}
HomingBullet.prototype.render = function(g,c){
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		false,
		{
			"rotate" : ((this.angle / Math.PI) * 180)
		}
	);
}