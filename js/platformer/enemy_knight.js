Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = sprites.knight;
	this.speed = 0.4;
	this.active = false;
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
		"retreat" : 0
	}
	
	this.attack_warm = 24.0;
	this.attack_release = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 8;
	
	this.guard.x = 8;
	this.guard.y = 8;
	this.guard.w = 16;
	this.guard.h = 16;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(12,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	this.xp_award = 18;
	this.money_award = 8;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("blockOther", function(obj, position, damage){
		audio.playLock("clang",0.5);
		this.states.guard_freeze = Game.DELTASECOND;
		this.states.combo = 0;
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.retreat = Game.DELTASECOND * 0.5;
		this.states.guard_freeze = 0.0;
	});
	this.on("death", function(){
		Item.drop(this,this.money_award);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.calculateXP();
}
Knight.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		var home_x = this.position.x - this.start_x;
		
		if(this.states.attack > 0 || this.states.combo > 0){
			if(this.states.attack <= 0){
				
				if(this.states.combo > 0){
					this.states.attack = this.attack_warm;
					this.force.x = this.thrust_power * (this.flip?-1:1);
					this.states.attack_down = Math.random() > 0.5;
					this.states.combo--;
				}
			}
			
			if(this.states.attack <= this.attack_release && this.states.attack > this.attack_rest){
				if(this.states.attack_down){
					this.strike(new Line(0,16,32,20));
				} else {
					this.strike(new Line(0,0,32,4));
				}
				this.frame = 2;
			} else if(this.states.attack > this.attack_release){
				var p = (this.states.attack - this.attack_release) / (this.attack_warm - this.attack_release)
				this.frame = p > 0.5 ? 0 : 1;
			} else {
				this.frame = 3;
			}
			
			this.states.attack -= this.delta;
			this.frame_row = 1;
			this.guard.active = false;
		} else if(this.stun > 0 || this.states.guard_freeze > 0){
			//hurt, do nothing
			this.guard.active = false;
			this.frame = 0;
			this.frame_row = 2;
			this.states.guard_freeze -= this.delta;
		} else {
			this.flip = dir.x > 0;
			if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
				this.states.combo = 3;
				this.states.cooldown = Game.DELTASECOND * 2;
			}
			this.states.cooldown -= this.delta;
			
			this.guard.active = true;
			if(this.states.guard == 1){
				//bottom
				this.guard.x = 8;
				this.guard.y = 12;
			} 
			if(this.states.guard == 2){
				this.guard.x = 8;
				this.guard.y = -8;
			}
			
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
			
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 4;
			this.frame_row = 0;
		}
	}
}
Knight.prototype.render = function(g,c){
	//Shield no guard
	if(!this.guard.active){
		//render shield
		this.sprite.render(g,this.position.subtract(c),3, 2, this.flip, this.filter);
	}
	//Render body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Shield guard
	if(this.guard.active){
		//render shield
		var shield_f = this.guard.y > 0 ? 1 : 2;
		this.sprite.render(g,this.position.subtract(c),shield_f, 2, this.flip, this.filter);
	}
	
	//Render sword
	var sword_f = 4;
	var sword_fr = 0;
	if(this.states.attack > 0){
		sword_f = this.frame;
		sword_fr = this.states.attack_down ? 4 : 3;
	}
	this.sprite.render(g,this.position.subtract(c),sword_f, sword_fr, this.flip, this.filter);
}