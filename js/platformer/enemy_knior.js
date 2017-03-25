Knior.prototype = new GameObject();
Knior.prototype.constructor = GameObject;
function Knior(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "knior";
	
	this.speed = 0.6;
	this.jumpPower = 11.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.timers = {
		"jumpPrep" : 0.0,
		"jumpPrepReady" : false,
		"knifeReady" : true,
		"rest" : Game.DELTASECOND * 1.5,
		"throwKnife" : 0.0,
		"throwKnifeTime" : Game.DELTASECOND * 0.5,
		"cooldown" : 0.0
	}
	
	this.lifeMax = this.life = Spawn.life(6,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	
	this.defencePhysical = 0.0;
	//this.defenceFire = 1.2;
	//this.defenceIce = -1.0;
	this.mass = 1.0;
	this.gravity = 0.5;
	
	this.on("collideHorizontal", function(x){
	});
	
	this.on("collideObject", function(obj){
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
	});
	
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Knior.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.grounded){
			
			if(this.timers.rest > 0){
				this.timers.jumpPrepReady = false;
				this.timers.rest -= this.delta;
				this.frame.x = 0;
				this.frame.y = 2;
			} else if(this.timers.jumpPrepReady){
				this.force.x = 0;
				this.timers.jumpPrep -= this.delta;
			} else{
				this.flip = dir.x > 0;
				this.force.x += this.forward() * this.speed * this.delta;
				this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
				this.frame.y = 0;
			}
			
			if(Math.abs(dir.x) < 72){
				this.flip = dir.x > 0;
				this.timers.jumpPrepReady = true;
				this.frame.x = 0;
				this.frame.y = 2;
			}
			
			if(this.timers.jumpPrepReady && this.timers.jumpPrep <= 0){
				this.grounded = false;
				this.force.y = -this.jumpPower;
				this.force.x = this.forward() * this.speed;
				this.timers.rest = Game.DELTASECOND;
				this.timers.jumpPrep = Game.DELTASECOND * 0.5;
			}
			
			this.timers.knifeReady = true;
			this.timers.throwKnife = 0.0;
			
		} else {
			this.frame.x = 0;
			this.frame.y = 1;
			
			if(this.timers.throwKnife > 0){
				var progress = 1 - this.timers.throwKnife / this.timers.throwKnifeTime;
				this.frame = Knior.anim_knife.frame(progress);
				this.timers.throwKnife -= this.delta;
				
				if(Timer.isAt(this.timers.throwKnife, this.timers.throwKnifeTime*0.75, this.delta)){
					var bullet = new Bullet(this.position.x, this.position.y);
					bullet.rotation = 90;
					bullet.team = this.team;
					bullet.damage = this.damage;
					bullet.setDeflect();
					bullet.force = new Point(0, 8);
					bullet.sprite = this.sprite;
					bullet.frame = new Point(2,2);
					game.addObject(bullet);
				}
			} else if(dir.y < 0){
				//Above the player
				if(this.timers.knifeReady && Math.abs(dir.x) < 16){
					this.timers.throwKnife = this.timers.throwKnifeTime;
					this.timers.knifeReady = false;
				}
			}
			
			this.force.x += this.forward() * this.delta * this.speed;
		}
	} else{
		this.frame.x = 1;
		this.frame.y = 2;
	}
}
Knior.anim_knife = new Sequence([
	[1,1,0.1],
	[2,1,0.1],
	[3,1,0.2],
	[4,1,0.1],
	[5,1,0.5],
]);