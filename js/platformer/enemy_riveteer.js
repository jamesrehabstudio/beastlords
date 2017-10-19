Riveteer.prototype = new GameObject();
Riveteer.prototype.constructor = GameObject;
function Riveteer(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	
	this.sprite = "riveteer";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("wakeup", function(obj,damage){
		this.life = this.lifeMax;
		this.frame.x = 0;
		this.frame.y = 0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
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
	
	this.life = this.lifeMax = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	
	this.states = {
		"attack" : Game.DELTASECOND * 0.5,
		"cooldown" : Game.DELTASECOND,
		"chain" : 3
	};
}
Riveteer.prototype.update = function(){
	if(this.life > 0){
		let dir = this.position.subtract(_player.position);
		if(this.states.cooldown <= 0){
			this.frame.x = this.frame.y = 2;
			if(this.states.attack <= 0){
				if(this.states.chain > 0){
					
					var bullet = new Bullet(this.position.x + this.forward() * 24, this.position.y);
					bullet.team = this.team;
					bullet.frame.x = 4;
					bullet.force = new Point(this.forward() * 8, 0);
					bullet.damage = this.damage;
					
					game.addObject(bullet);
					this.states.attack = Game.DELTASECOND * 0.5;
					
					this.states.chain--;
				} else {
					this.states.cooldown = Game.DELTASECOND * 2.0;
				}
			}
			this.states.attack -= this.delta;
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			this.states.chain = 3;
			this.frame.x = this.frame.y = 0;
			
			if(this.states.cooldown <= Game.DELTASECOND){
				let prog = 1.0 - (this.states.cooldown / (Game.DELTASECOND));
				this.frame = Riveteer.anim_ready.frame(prog);
			}
		}
		
	} else {
	}
}
Riveteer.anim_ready = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.8]
])