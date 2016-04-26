Slimerilla.prototype = new GameObject();
Slimerilla.prototype.constructor = GameObject;
function Slimerilla(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.collideDamage = 0;
	this.team = 0;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = sprites.slimerilla;
	this.speed = 0.3;
	this.visible = false;
	this.pushable = false;
	this.startactive = false;
	this.gravity = 0.5;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("startactive" in o){
		this.startactive = o["startactive"] * 1;
	}
	
	this.times = {
		"attackWarm" : Game.DELTASECOND * 2,
		"attackRelease" : Game.DELTASECOND,
		"attackRest" : Game.DELTASECOND * 0.7777,
		"attack" : 0.0,
		"cooldown" : Game.DELTASECOND,
		"timeBetweenAttacks" : Game.DELTASECOND * 1.5,
		"reappear" : 0,
		"reappearTime" : 0.0,
		"turnTimer" : 0.0,
		"jumpback" : false
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		audio.play("hurt");
		this.times.jumpback = true;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && !this.visible){
			this.times.reappearTime = Game.DELTASECOND * 1;
			this.times.reappear = 1;
		}
	});
	
	if(this.startactive){
		this.visible = true;
		this.pushable = true;
		this.faceTarget();
	}
	
	this.life = Spawn.life(8, this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.calculateXP();
}
Slimerilla.prototype.update = function(){
	if(this.visible){
		var dir = _player.position.subtract(this);
		if(this.times.attack > 0){
			//once warming up for an attack, there's no stoping him!
			if(this.times.attack < this.times.attackRest ){
				this.frame = 0
				this.frame_row = 0;
			} else if(this.times.attack < this.times.attackRelease ){
				this.strike(new Line(new Point(0,-24),new Point(48,24)));
				this.frame = 1
				this.frame_row = 1;
			} else {
				this.force.x = 0;
				this.frame = 0
				this.frame_row = 1;
			}
			this.times.attack -= this.delta;
		} else if(this.stun > 0){
			//Do nothing
			this.frame = 0;
			this.frame_row = 0;
		} else if(this.times.jumpback){
			//jump away from player
			this.force.y = -6;
			this.force.x = (dir.x>0?-1.0:1.0) * 10;
			this.times.jumpback = false;
		} else {
			//move towards player
			if(this.flip){
				this.force.x -= this.speed * this.delta;
			} else {
				this.force.x += this.speed * this.delta;
			}
			if(Math.abs(dir.x) < 48 && this.times.cooldown <= 0 ){
				this.times.attack = this.times.attackWarm;
				this.times.cooldown = this.times.timeBetweenAttacks;
				this.faceTarget();
			}
			if(this.times.turnTimer <= 0){
				this.faceTarget();
				this.times.turnTimer = Game.DELTASECOND * 2;
			}
			this.times.turnTimer -= this.delta;
			this.times.cooldown -= this.delta;
		}
		
	} else {
		if(this.times.reappear){
			this.times.reappearTime -= this.delta;
			if(this.times.reappearTime <= 0){
				this.visible = true;
				this.pushable = true;
				this.faceTarget();
			}
		}
	}
}
Slimerilla.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.flip = dir.x < 0;
}