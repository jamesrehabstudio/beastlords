Nolt.prototype = new GameObject();
Nolt.prototype.constructor = GameObject;
function Nolt(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	
	this.sprite = "nolt";
	
	//this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("wakeup", function(obj,damage){
		this.life = this.lifeMax;
		this.frame.x = 0;
		this.frame.y = 0;
	});
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("block", function(obj,damage){
		audio.play("block", this.position);
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.interactive = false;
		this.frame.x = 0;
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.guard.x = -16;
	this.guard.y = -20;
	this.guard.w = 32;
	this.guard.h = 16;
	this.guard.omidirectional = true;
	
	this.life = this.lifeMax = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0,
		"block" : 0.0
	};
}
Nolt.prototype.update = function(){
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		this.guard.active = false;
		
		this.visible = true;
		this.interactive = true;
		if(this.states.attack > 0){
			this.states.attack -= this.delta;
			var progress = 1 - Math.min(this.states.attack / Nolt.TIME_ATTACK, 1.0);
			this.frame = Nolt.anim_attack.frame(progress);
			
			if(Timer.isAt(this.states.attack, Nolt.TIME_ATTACK * 0.75, this.delta)){
				var ger = new Gernade(this.position.x, this.position.y+16);
				ger.damageSlime = this.damage;
				ger.team = this.team;
				game.addObject(ger);
			}
		} else if(dir.y > 0 || this.states.block > 0) {
			//Protect head
			if(dir.y > 0){
				this.states.block = Math.min(this.states.block + this.delta, Nolt.TIME_BLOCK);
				var progress = this.states.block / Nolt.TIME_BLOCK;
				this.frame.x = Math.floor(progress * 2);
			} else {
				this.states.block = Math.max(this.states.block - this.delta, 0);
				this.frame.x = 3;
			}
			this.guard.active = true;
			this.frame.y = 2;
		} else {
			this.flip = dir.x > 0;
			this.states.block = 0.0;
			this.frame.x = (this.frame.x + this.delta * 0.1) % 4;
			this.frame.y = 0;
			this.states.cooldown -= this.delta;
			if(Math.abs(dir.x) < 80 && this.states.cooldown <= 0){
				this.states.cooldown = Game.DELTASECOND * 2.5;
				this.states.attack = Nolt.TIME_ATTACK;
			}
		}
	} else {
		this.frame.x += this.delta * 7.5;
		this.frame.y = 3;
		if(this.frame.x >= 4){
			this.visible = false;
		}
	}
}
Nolt.TIME_ATTACK = Game.DELTASECOND * 1.2;
Nolt.TIME_BLOCK = Game.DELTASECOND * 0.5;
Nolt.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.8]
]);

class NoltMissile extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 32;
		
		this.sprite = "nolt";
		this.addModule( mod_combat );
	
		this.on("wakeup", function(obj,damage){
			this.life = this.lifeMax;
			this.frame.x = 0;
			this.frame.y = 0;
		});
		this.on("hurt", function(obj,damage){
			audio.play("hurt",this.position);
		});
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			audio.play("kill",this.position);
			this.interactive = false;
			this.frame.x = 0;
		});
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.homingMissile =  ops.getBool("homing", false);
		
		this.life = this.lifeMax = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(6,this.difficulty);
		this.moneyDrop = Spawn.money(1,this.difficulty);
		
		this.states = {
			"attack" : 0.0,
			"cooldown" : 0.0,
			"block" : 0.0
		};
	}
	update(){
		if(this.life > 0){
			this.visible = true;
			this.interactive = true;
			
			if(this.states.attack > 0){
				
				this.states.attack -= this.delta;
				
				if(Timer.isAt(this.states.attack,0.25,this.delta)){
					this.fire();
				}
			} else {
				this.states.cooldown -= this.delta;
				if(this.states.cooldown <= 0){
					this.flip = this.position.x > this.target().position.x;
					this.states.cooldown = Game.DELTASECOND * 3;
					this.states.attack = Game.DELTASECOND * 1;
				}
			}
			
		} else {
			this.frame.x += this.delta * 7.5;
			this.frame.y = 3;
			if(this.frame.x >= 4){
				this.visible = false;
			}
		}
	}
	fire(){
		let ops = new Options();
		ops["team"] = this.team;
		ops["damage"] = this.damage;
		ops["rotation"] = this.flip ? 180 : 0;
		let missile = Bullet.createHomingMissile(this.position.x + this.forward() * 16, this.position.y, ops);
		game.addObject(missile);
	}
}

self["NoltMissile"] = NoltMissile;