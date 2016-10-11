Oriax.prototype = new GameObject();
Oriax.prototype.constructor = GameObject;
function Oriax(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "oriax";
	this.paletteSwaps = ["t0","t0","t2","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		this.spawnSnakes(2);
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	this.on("stun", function(obj,damage,count){
		if(count == 3){
			//spawn two snakes to scare player
			this.spawnSnakes(2);
		}
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(12,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(9,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 3.0;
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : new Timer(0),
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 10
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attack.time > 0){
			if( this.states.attack.at(this.attack.release)){
				//Fire
				if(this.states.attack_lower){
					var snakebullet = new SnakeBullet(this.position.x, this.position.y + 16);
					snakebullet.damage = this.damage;
					snakebullet.flip = this.flip;
					game.addObject(snakebullet);
				} else {
					var bullet = new Bullet(this.position.x, this.position.y+4,(this.flip?-1:1));
					bullet.blockable = 1;
					bullet.damage = this.damage;
					game.addObject(bullet);
				}
				this.states.cooldown = Game.DELTASECOND * 1.5;
			}
			this.states.attack.tick(this.delta);
		} else if(this.stun > 0) {
			//Hurt, do nothing
		} else {
			//idle
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				this.states.attack.set(this.attack.warm);
				this.states.attack_lower = Math.random() > 0.5;
			}
		}
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		//dead
		this.frame.x = 4;
		this.frame.y = 1;
	} else if( this.states.attack.time > 0 ) {
		//Attack
		var progress = 1 - (this.states.attack.time / this.states.attack.start);
		if(this.states.attack_lower){
			this.frame.x = Math.floor(progress * 4);
			this.frame.y = 2;
		} else {
			this.frame.x = 0;
			if(progress > 0.15){ this.frame.x = 1;}
			if(progress > 0.55){ this.frame.x = 2;}
			if(progress > 0.6){ this.frame.x = 3;}
			this.frame.y = 1;
		}
	} else if (this.stun > 0){
		//dead
		this.frame.x = 4;
		this.frame.y = 1;
	} else {
		//idle
		this.frame.x = (this.frame.x + this.delta * 0.2 ) % 5;
		this.frame.y = 0;
	}
}

Oriax.prototype.spawnSnakes = function(amount){
	for(var i=0; i < amount; i++){
		var snakebullet = new SnakeBullet(this.position.x, this.position.y - 16);
		snakebullet.damage = this.damage;
		snakebullet.flip = i;
		snakebullet.force.x = snakebullet.flip ? 5.0 : -5.0;
		snakebullet.force.y = -6;
		game.addObject(snakebullet);
	}
}