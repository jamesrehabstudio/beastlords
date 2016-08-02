function Weapon(name){
	this.combo = 0;
	this.time = 0.0;
	this.timeRest = 0.0;
	this.timeMiss = 0.0;
	this.queue = 0;
	this.stats = WeaponStats[name];
	this.combohit = 0;
	this.playerState = "standing";
	this.currentAttack = null;
	this.chargeTime = new Timer();
	this.charge = false;
}
Weapon.prototype.update = function(player){
	if(this.time > 0){
		var newState = Weapon.playerState(player);
		var phase = this.currentAttack[this.combo];
		
		//Build up charge
		if(input.state("fire") > 0){
			this.chargeTime.tick(player.delta);
			this.time = Math.max(this.time, player.delta+1);
			
			if(this.chargeTime.at(Game.DELTASECOND)){
				this.charge = true;
			}
		} else{
			if(this.chargeTime.time > Game.DELTASECOND){
				this.time = this.combo = this.queue = 0;
				this.attack(player);
			}
			this.chargeTime.set(0.0);
		}
		
		if(phase){
			if(input.state("left") > 0){
				player.force.x -= phase.movement * player.deltaSpeed();
			}
			if(input.state("right") > 0){
				player.force.x += phase.movement * player.deltaSpeed();
			}
		}
		
		if(this.playerState != newState){
			//cancel attack
			this.playerState = newState;
			this.queue = -9999;
		} else {	
			this.time -= player.delta;
			//player.force.x *= 
			//if(this.time <= 0){
			if(this.time+this.timeRest <= this.timeMiss && this.queue > this.combo){
				//Chain into next attack
				this.charge = false;
				this.attack(player, true);
			}else if(this.time <= 0){
				this.cancel();
			}
		}
	}
}

Weapon.prototype.attack = function(player, forceNextAttack){
	this.playerState = Weapon.playerState(player);
	this.currentAttack = this.stats[this.playerState];
	var phase = this.currentAttack[this.combo];
	
	if(this.time > 0 && !forceNextAttack){
		//Attempt to queue the next attack
		if(this.combo+1 in this.currentAttack && (this.combohit || this.currentAttack["alwaysqueue"])){
			this.queue = this.combo + 1;
		}
	} else {
		//Start a next attack
		this.combo = this.queue;
		if(this.combo in this.currentAttack){
			var newPhase = this.currentAttack[this.combo];
			this.timeRest = newPhase["rest"];
			this.timeMiss = newPhase["miss"];
			this.time = newPhase["time"] + newPhase["miss"];
			this.combohit = 0;
			
			audio.play("swing");
			
			if("force" in newPhase){
				player.force.y = newPhase["force"].y;
				if(player.flip){
					player.force.x = -newPhase["force"].x;
				} else {
					player.force.x = newPhase["force"].x;
				}
			}
		} else {
			this.cancel();
		}
	}
}
Weapon.prototype.cancel = function(){
	this.time = 0;
	this.combo = 0;
	this.queue = 0;
	this.combohit = 0;
	this.chargeTime.set(0.0);
	this.charge = false;
}

Weapon.prototype.hit = function(player,obj,damage){
	if(this.playerState == "downstab"){
		obj.trigger("downstabbed", player, damage);
		player.trigger("downstabTarget", obj, damage);
		this.cancel();
		return;
	}
	if(this.currentAttack == undefined || !(this.combo in this.currentAttack)){
		this.cancel();
		return;
	}
	
	var phase = this.currentAttack[this.combo];
	
	this.combohit = 1;
	//this.time -= this.timeMiss;
	//this.time += this.timeRest;
	
	if("pause" in phase){
		game.slow(0.0, phase["pause"]);
	}
	if("shake" in phase){
		shakeCamera(Game.DELTASECOND*0.25, phase["shake"]);
	}
	
	if("stun" in phase){
		obj.stun = phase["stun"];
	}
	
	if("knockback" in phase && obj.hasModule(mod_rigidbody)){
		var dir = obj.position.subtract( player.position ).normalize();
		var scale = 1.0 / Math.max(obj.mass, 1.0);
		obj.force.x += dir.x * phase["knockback"] * scale;
	}
}

Weapon.prototype.downstab = function(player){
	this.playerState = "downstab";
	var damage = Math.max(Math.floor(this.baseDamage(player) * 0.6),1);
	var type = "struck";
	player.strike(new Line( -4, 8, 4, 20), type, damage);
}
Weapon.prototype.strike = function(player){
	//var rest = this.combohit ? this.timeRest : this.timeMiss;
	if(!this.combohit && this.time > this.timeMiss){
		var phase = this.currentAttack[this.combo];
		var damage = this.damage(player);
		if(phase != undefined){
			var rect = phase["strike"];
			player.strike(rect,"struck",damage);
		}
	}
}
Weapon.prototype.animate = function(player){
	try{
		if(this.time > 0 && this.currentAttack){
			var phase = this.currentAttack[this.combo];
			var animation = phase["animation"];
			//var animTime = this.time - (this.combohit ? this.timeRest : this.timeMiss);
			var animTime = this.time - this.timeMiss;
			var progress = Math.max(1 - (animTime / phase["time"]), 0);
			
			base_f = 0;
			base_fr = 4;
			base_len = 4;
			
			switch(animation){
				case 0: base_f=0; base_fr=4; base_len=4; break; //open
				case 1: base_f=4; base_fr=4; base_len=4; break; //continue
				case 2: base_f=7; base_fr=4; base_len=4; break; //long
				case 3: base_f=1; base_fr=8; base_len=5; break; //jumping
				case 4: base_f=1; base_fr=9; base_len=5; break; //ducking
			}
			
			if(animTime > 0){
				player.frame.x = base_f + Math.floor(progress * base_len);
				player.frame.y = base_fr;
			} else {
				player.frame.x = base_f + base_len - 1;
				player.frame.y = base_fr;
			}
		}
	} catch (e){
		
	}
}
Weapon.prototype.baseDamage = function(player){
	return Math.round(5 + player.stats.attack * this.stats["damage"]);
}

Weapon.prototype.damage = function(player){
	//var state = Weapon.playerState(player);
	//var attack = this.stats[state];
	var phase = this.currentAttack[this.combo];
	var multi = 1.0;
	
	if(this.charge) multi *= 2;
	
	if(phase != undefined) {
		return Math.round(multi * this.baseDamage(player) * phase["damage"]);
	} else {
		return this.baseDamage(player);
	}
}

Weapon.playerState = function(player){
	var state = "standing";
	if(!player.grounded){ 
		state = "jumping";
	} else if(player.states.duck){
		state = "ducking";
	}
	return state;
}


createWeaponTemplate = function(baseTime, restTime, missTime, length){
	return {
		"damage" : 3.0,
		"standing" : {		
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : 0.1*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : 0.333*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			2 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.5,
				"time" : baseTime*Game.DELTASECOND,
				"rest":2.5*restTime*Game.DELTASECOND,
				"miss":missTime*1.2*Game.DELTASECOND,
				"animation" : 2,
				"force" : new Point(3.0, 0.0),
				"pause" : 0.333*Game.DELTASECOND,
				"knockback" : 5,
				"stun" : 0.25 * Game.DELTASECOND,
				"movement" : 0.3
			}
		},
		"ducking" : {
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,8), new Point(length,12)),
				"damage":1.2,
				"time" : baseTime*Game.DELTASECOND,
				"rest": restTime*Game.DELTASECOND,
				"miss": missTime*Game.DELTASECOND,
				"animation" : 4,
				"force" : new Point(0.0, 0.0),
				"stun" : 0.3 * Game.DELTASECOND,
				"movement" : 0.0
			}
		},
		"jumping" : {
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,12)),
				"damage":0.8,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":restTime*Game.DELTASECOND,
				"animation" : 3,
				"stun" : 0.5 * Game.DELTASECOND,
				"movement" : 1.0
			}
		}
	};
}

var WeaponStats = {
	"short_sword" : createWeaponTemplate(0.25,0.08,0.15,38),
	"long_sword" : createWeaponTemplate(0.333,0.1,0.2,42),
	"broad_sword" : createWeaponTemplate(0.4,0.1,0.3,42)
}

WeaponStats.short_sword.standing.alwaysqueue = 1;

WeaponStats.long_sword.damage = 5;

WeaponStats.broad_sword.damage = 7;