Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = "knight";
	this.speed = 0.4;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND * 3.0,
		"combo" : 0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guard_freeze" : 0.0,
		"guard_tire" : Game.DELTASECOND * 3,
		"retreat" : 0
	}
	
	this.attack_time = Game.DELTASECOND * 0.9;
	this.thrust_power = 4;
	
	this.guard.active = true;
	this.guard.x = -24;
	this.guard.y = 8;
	this.guard.w = 32;
	this.guard.h = 16;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(12,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(15,this.difficulty);
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	this.xp_award = 18;
	this.money_award = 8;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		this.states.guard_tire -= Game.DELTASECOND * 0.3;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.retreat = Game.DELTASECOND * 0.5;
		this.states.guard_freeze = 0.0;
	});
	this.on("death", function(){
		Item.drop(this,this.money_award);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	this.calculateXP();
}
Knight.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		var home_x = this.position.x - this.start_x;
		
		if(this.states.attack > 0){
			
			var progress = 1 - (this.states.attack / this.attack_time);
			
			if(this.states.attack_down){
				this.frame = Knight.anim_attackdown.frame(progress);
			} else{
				this.frame = Knight.anim_attackup.frame(progress);
			}
			
			
			if(this.frame.x == 1){
				this.force.x = this.forward() * this.thrust_power;
				if(this.states.attack_down){
					this.strike(new Line(0,16,48,20));
				} else {
					this.strike(new Line(0,0,48,4));
				}
			} 
			
			this.states.attack -= this.delta;
		} else if(this.states.combo > 0){
			this.states.attack = this.attack_time;
			this.states.attack_down = Math.random() > 0.5;
			this.states.combo--;			
		} else {
			this.flip = dir.x > 0;
			if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
				this.force.x = 0;
				this.states.combo = 3;
				this.states.cooldown = Game.DELTASECOND * 1.5;
			}
			this.states.cooldown -= this.delta;
			
			if(this.states.retreat > 0){
				//run away from player
				this.force.x += this.speed * this.delta * (this.flip?2:-2);
				this.states.retreat -= this.delta;
			} else if(Math.abs(home_x) > 128){
				//Too far, go home
				this.force.x += this.speed * this.delta * (home_x>0?-1:1);
			} else if(Math.abs(_player.position.x - this.start_x) < 128){
				//Player close, proach him
				this.force.x += this.speed * this.delta * (this.flip?-1:1);
			} else if(Math.abs(home_x) > 8){
				//Player is coy, go home
				this.force.x += this.speed * this.delta * (home_x>0?-1:1);
			}
			
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 4;
			this.frame.y = 0;
		}
		
		if(this.states.guard_freeze > 0){
			this.states.guard_tire = Game.DELTASECOND * 3;
			this.states.guard_freeze -= this.delta;
		} else {
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guard_tire -= this.delta;
			if(this.states.guard_tire <= 0){
				this.states.guard_freeze = Game.DELTASECOND * 0.8;
			}
		}
		
		if(this.states.guard == 1){
			//bottom
			this.guard.y = 12;
		} 
		if(this.states.guard == 2){
			this.guard.y = -8;
		}
	} else {
		this.guard.active = false;
		this.frame.x = 3;
		this.frame.y = 1;
	}
}
Knight.prototype.render = function(g,c){
	var filter = {"shader":this.filter};

	//Render body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Shield guard
	if(this.guard.active){
		//render shield
		var shield_f = this.states.attack > 0 ? 1 : 0;
		var zPlus = this.states.attack > 0 && this.frame.x >= 1 ? -1 : 1;
		var shieldOff = this.states.guard == 1 ? 16 : 0;
		g.renderSprite(
			this.sprite,
			this.position.add(new Point(0,shieldOff)).subtract(c),
			this.zIndex+zPlus,
			new Point(shield_f, 3), 
			this.flip, 
			filter
		);
	}
}
Knight.anim_attackup = new Sequence([
	[0,2,0.8],
	[1,2,0.1],
	[2,2,0.4],
]);
Knight.anim_attackdown = new Sequence([
	[0,1,0.8],
	[1,1,0.1],
	[2,1,0.4],
]);