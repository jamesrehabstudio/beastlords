Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
	this.height = 64;
	this.sprite = "megaknight";
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 1;
	this.bossface_frame_row = 1;
	
	this.times = {
		"attack1" : Game.DELTASECOND * 1.5,
		"attack2" : Game.DELTASECOND * 1.0,
		"turn" : Game.DELTASECOND * 1.2,
		"cooldown" : Game.DELTASECOND * 3.0,
		"rage" : 3
	};
	
	this.states = {
		"attack" : 0,
		"pose" : 0,
		"cooldown" : this.times.cooldown,
		"turn" : 0.0,
		"direction" : 1,
		"rage" : 0
	}
		
	this.life = this.lifeMax = Spawn.life(24,this.difficulty);
	this.mass = 4.0;
	this.damage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.death_time = Game.DELTASECOND * 3;
	
	this.guard.active = true;
	this.guard.omidirectional = true;
	this.guard.y = -16;
	this.guard.h = 48;
	this.guard.x = -24;
	this.guard.w = 48;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("critical", function(){
		//this.states.attack = 0;
		//this.states.cooldown = this.attack_times.warm;
	});
	this.on("struckTarget", function(){
		//this.states.attack = 0;
		//this.states.cooldown = this.attack_times.warm;
	});
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.cooldown -= Game.DELTASECOND * 0.5;
		if(Math.random() > 0.6){
			var dir = this.position.subtract(_player.position);
			this.states.direction = dir.x > 0 ? 1 : -1;
		}
	});
	this.on("activate", function(){
		var dir = this.position.subtract(_player.position);
		this.states.direction = dir.x > 0 ? -1 : 1;
	});
	this.on("blocked", function(obj){
		if(obj.hasModule(mod_rigidbody)){
			obj.force.x += this.forward() * 13.5;
		}
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team || this.inviciple > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("death", function(){
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	this.on("player_death", function(){
		this.states["attack"] = 0;
		this.states["pose"] = 0;
		this.states["cooldown"] = this.times.cooldown;
	});
	this.calculateXP();
}
Marquis.prototype.update = function(){	
	this.sprite = "megaknight";
	if ( this.life > 0 && this.active) {
		var dir = this.position.subtract( _player.position );
				
		if( this.states.attack > 0 ) {
			if(this.states.pose){
				//low
				var progress = 1 - (this.states.attack / this.times.attack2);
				this.frame = Marquis.anim_attack2.frame(progress);
				if(this.frame.y >= 1 && this.frame.y <= 2 ){
					this.strike(Marquis.line_attackdown);
				}
			} else {
				//high
				var progress = 1 - (this.states.attack / this.times.attack1);
				this.frame = Marquis.anim_attack1.frame(progress);
				
				if(this.frame.y >= 3){
					this.strike(Marquis.line_attackup);
				}
			}
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				if(this.states.pose){
					this.states.pose = 0;
				} else {
					
				}
			}
		} else if( this.states.turn > 0 ) {
			var progress = 1 - (this.states.turn / this.times.turn);
			this.frame = Marquis.anim_turn.frame(progress);
			this.states.turn -= this.delta;
			this.states.pose = 1;
		} else {
			if(this.states.pose){
				this.frame.x = 0;
				//this.frame.y = 4;
				this.frame.y = Math.max((this.frame.y+Math.abs(this.force.x)*this.delta*0.2)%8,4);
			} else {
				this.frame.x = 0;
				//this.frame.y = 0;
				this.frame.y = Math.max((this.frame.y+Math.abs(this.force.x)*this.delta*0.2)%4,0);
			}
			
			if(this.states.direction > 0){
				this.force.x += this.states.direction * this.speed * this.delta;
				if(this.position.x - this.start_x > 120){
					this.states.direction = -1;
				}
			} else {
				this.force.x += this.states.direction * this.speed * this.delta;
				if(this.position.x - this.start_x < -120){
					this.states.direction = 1;
				}
			}
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			//Change state
			if(this.states.cooldown <= 0){
				if(this.states.pose){
					this.states.attack = this.times.attack2;
				} else {
					if(Math.random() > 0.6){
						this.states.turn = this.times.turn;
					} else {
						this.states.attack = this.times.attack1;
					}
				}
				if(this.states.rage > 0){
					this.states.rage--;
				} else {
					this.states.cooldown = this.times.cooldown;
					var rageChange = 0.2 + (this.life/this.lifeMax) * 0.3;
					if(Math.random() < rageChange){
						this.states.rage = this.times.rage;
					}
				}
			}
		}
	}
}

Marquis.anim_attack1 = new Sequence([
	[1,0,0.1],
	[1,1,0.5],
	[1,2,0.06],
	[1,3,0.1],
	[1,4,0.1],
	[1,5,0.5]
]);
Marquis.anim_attack2 = new Sequence([
	[3,0,0.5],
	[3,1,0.1],
	[3,2,0.1],
	[3,3,0.1],
	[3,4,0.1]
]);
Marquis.anim_turn = new Sequence([
	[2,0,0.1],
	[2,1,0.1],
	[2,2,0.1],
	[2,3,0.1],
	[2,4,0.1],
	[2,5,0.1],
	[2,6,0.5]
]);
Marquis.line_attackup = new Line(16,6,88,10);
Marquis.line_attackdown = new Line(16,28,64,32);