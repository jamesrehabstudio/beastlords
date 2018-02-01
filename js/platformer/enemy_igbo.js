Igbo.prototype = new GameObject();
Igbo.prototype.constructor = GameObject;
function Igbo(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 36;
	this.height = 48;
	this.sprite = "igbo";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"chargeattack" : Game.DELTASECOND * 1.0,
		"charge" : Game.DELTASECOND * 1.5,
		"fireball" : Game.DELTASECOND * 1.0,
		"groundattack" : Game.DELTASECOND * 1.5,
		"cooldown" : Game.DELTASECOND * 3.5,
		"escape" : Game.DELTASECOND * 2.0,
		"guarding" : Game.DELTASECOND * 2.0,
	}
	this.states = {
		"chargeattack" : 0,
		"charge" : 0,
		"fireball" : 0,
		"groundattack" : 0,
		"cooldown" : this.times.cooldown,
		"escape" : 0,
		"guarding" : 0,
		"blockCount" : 0
	}
	this.frame_swing = new Point(0,0);
	
	this.guard.active = true;
	this.guard.x = 8;
	this.guard.y = -20;
	this.guard.w = 24;
	this.guard.h = 46;	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(10,this.difficulty);
	this.death_time = Game.DELTASECOND;
	this.speed = 2.5;
	this.mass = 3.0;
	this.friction = 0.4;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
		
		if(this.states.guarding > 0){
			this.states.blockCount++;
		} else {
			this.states.blockCount=1;
		}
		
		this.states.guarding = this.times.guarding;
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("downstabbed", function(){
		if(
			this.states.chargeattack <= 0 &&
			this.states.charge <= 0 &&
			this.states.fireball <= 0 &&
			this.states.groundattack <= 0 &&
			Math.random() > 0.3
		){
			this.states.fireball = this.times.fireball;
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		if(this.guard.active){
			if(this.states.guarding) {
				this.states.guarding = 0;
				this.states.escape = this.times.escape;
			} else {
				this.states.guarding = this.times.guarding;
			}
		}
	});
	this.on("death", function(obj){
		Item.drop(this,15);
		audio.play("kill",this.position);
		this.destroy();
	});
}
Igbo.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		this.frame_swing.x = this.frame_swing.y = 0;
		
		if(this.states.chargeattack > 0){
			//Swing shield
			var progress = 1 - (this.states.chargeattack / this.times.chargeattack);
			this.frame = Igbo.anim_shieldbash.frame(progress);
			this.frame_swing = Igbo.anim_shieldbash_swing.frame(progress);
			this.guard.active = false;
			
			if(this.frame_swing.x > 0){
				this.strike(new Line(0,-24,52,8));
			}
			
			this.states.chargeattack -= this.delta;
		} else if(this.states.escape > 0){
			
			if(this.states.escape == this.times.escape){
				this.grounded = false;
				this.force.y = -6;
			}
			
			this.states.escape -= this.delta;
			this.guard.active = false;
			
			if(this.grounded){
				this.frame.x = 4;
				this.frame.y = (this.frame.y + Math.abs(this.force.x) * 0.1 * this.delta) % 4;
				this.force.x += this.forward() * this.speed * this.delta;
				
				if(Math.abs(dir.x) < 64 && Math.abs(dir.y) < 16){
					this.flip = dir.x > 0;
					this.states.escape = 0;
					this.states.chargeattack = this.times.chargeattack;
				} else if(this.states.escape <= 0){
					this.flip = dir.x > 0;
					this.states.groundattack = this.times.groundattack;
				}
			} else {
				this.force.y -= 0.6 * this.delta;
				this.force.x = this.forward() * -3;
				this.frame.x = 4;
				this.frame.y = 1;
			}
		} else if(this.states.charge > 0){
			//Charge at player
			this.states.charge -= this.delta;
			
			this.frame.x = 4;
			this.frame.y = (this.frame.y + Math.abs(this.force.x) * 0.1 * this.delta) % 4;
			this.force.x += this.forward() * this.speed * this.delta;
			this.guard.active = false;
			
			if(Math.abs(dir.x) < 64){
				this.states.charge = 0;
				this.states.chargeattack = this.times.chargeattack;
			}
		} else if(this.states.fireball > 0){
			//Fire balls up
			this.states.fireball -= this.delta;
			this.guard.active = false;
			
			var progress = 1-this.states.fireball/this.times.fireball;
			
			this.frame = Igbo.anim_attack.frame(progress);
			
			var x_off = 2 * (progress - 0.5);
			if(Timer.interval(this.states.fireball, this.times.fireball*0.2, this.delta)){
				var bullet = Bullet.createFireball(this.position.x, this.position.y - 24);
				bullet.team = this.team;
				bullet.damageFire = this.damage;
				bullet.force = new Point(x_off,-5);
				bullet.rotation = 180 * Math.atan2(bullet.force.y,bullet.force.x) / Math.PI;
				game.addObject(bullet);
			}
			
		} else if(this.states.groundattack > 0 ){
			//Place fireballs on the ground
			this.criticalChance = 1.0;
			this.states.groundattack -= this.delta;
			this.frame = Igbo.anim_attack.frame(1-this.states.groundattack/this.times.groundattack);
			this.guard.active = false;
			if(Timer.isAt(this.states.groundattack,this.times.groundattack*0.5,this.delta)){
				this.fire(4,0.0);
			}
		} else if(this.states.guarding > 0){
			this.states.guarding -= this.delta;
			
			this.criticalChance = 0.0;
			this.flip = dir.x > 0;
			this.guard.active = true;
			this.guard.x = 6;
			this.guard.y = -28;
			
			if(this.states.blockCount >= 3){
				if(this.states.guarding <= this.times.guarding * 0.8){
					this.states.escape = this.times.escape;
					this.states.guarding = 0;
				}
			}
			
		} else {
			this.states.cooldown -= this.delta;
			
			this.criticalChance = 0.0;
			this.flip = dir.x > 0;
			this.guard.active = true;
			this.guard.x = 8;
			this.guard.y = -20;
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			
			if(this.states.cooldown <= 0){
				if(Math.random() > 0.4 && Math.abs(dir.x) > 80){
					this.states.groundattack = this.times.groundattack;
				} else {
					this.states.charge = this.times.charge;
				}
				this.states.cooldown = this.times.cooldown;
			}
		}
	} else {
		this.guard.active = false;
		this.frame.x = 2;
		this.frame.y = 2;
	}
}

Igbo.prototype.fire = function(amount, skiprandom){
	
	var ftower = new CarpetBomb(this.position.x, this.position.y);
	ftower.damageFire = this.damage;
	ftower.force = new Point(this.forward()*6, -8);
	game.addObject(ftower);
}

Igbo.prototype.render = function(g,c){
	if(this.guard.active){
		xOff = this.guard.x + this.guard.w * 0.5;
		yOff = this.guard.y + this.guard.h * 0.5;
		g.renderSprite(
			this.sprite,
			this.position.add(new Point(this.forward() * xOff, yOff)).subtract(c),
			this.zIndex + 1,
			new Point(0,3),
			this.flip
		);
	}
	if(this.frame_swing.x > 0){
		g.renderSprite(
			this.sprite,
			this.position.add(new Point(this.forward() * 24, 0)).subtract(c),
			this.zIndex + 1,
			this.frame_swing,
			this.flip
		);
	}
	GameObject.prototype.render.apply(this,[g,c]);
}

Igbo.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.5],
	[3,1,0.1],
	[0,2,0.1],
	[1,2,0.5]
]);
Igbo.anim_shieldbash = new Sequence([
	[4,1,0.1],
	[4,2,0.1],
	[3,2,0.5]
]);
Igbo.anim_shieldbash_swing = new Sequence([
	[0,0,0.2],
	[1,3,0.05],
	[2,3,0.05],
	[3,3,0.05],
	[0,0,0.35],
]);