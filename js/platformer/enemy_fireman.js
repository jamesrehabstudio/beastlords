Fireman.prototype = new GameObject();
Fireman.prototype.constructor = GameObject;
function Fireman(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	
	this.sprite = "flameman";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 2;
	this.bullet = null;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
		if(this.states.current == 0 || this.states.current == 4){
			for(var i=0; i < 2; i++){
				var fire = new Fire(this.position.x, this.position.y-8);
				fire.force.x = (i==0?-1:1) * 5;
				fire.force.y = -5;
				game.addObject(fire);
			}
		}
	});
	this.on("collideObject", function(obj){
		if( this.states.current != 3 && obj instanceof Player ) {
			obj.hurt(this,this.damage);
		}
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"current" : 0,
		"cooldown" : 50
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
Fireman.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.current == 0){
			//idle
			this.frame = new Point();
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				var bulletAddPos = this.flip ? -40 : 40;
				this.bullet = new PhantomBullet(this.position.x + bulletAddPos,this.position.y);
				this.bullet.sprite = this.sprite;
				this.bullet.frame = new Point(1,1);
				this.bullet.damage = this.damage;
				this.bullet.blockable = false;
				this.bullet.time = Game.DELTASECOND * 5;
				this.bullet.width = this.bullet.height = 32;
				game.addObject(this.bullet);
				
				this.states.current = 1;
				this.states.cooldown = Game.DELTASECOND * 2;
			}
		} else if(this.states.current == 1){
			//charge
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet.force.x = this.flip ? -6 : 6;
				this.states.current = 2;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 2){
			//fire
			this.frame = new Point(0,1);
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 3;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 3){
			//nude
			this.frame = new Point(0,2);
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 4;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 4){
			//regrow
			this.frame = new Point();
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 0;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		}
	}
	
	Background.pushLight( this.position, 200, [1,0.8,0,1] );
}