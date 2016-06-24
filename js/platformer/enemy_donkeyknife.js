DonkeyKnife.prototype = new GameObject();
DonkeyKnife.prototype.constructor = GameObject;
function DonkeyKnife(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 44;
	this.sprite = "donkeyknife";
	this.speed = 1.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"throwing" : 0.0,
		"throwingCool" : 0.0,
		"smoke" : 0
	};
	this.times = {
		"cooldown" : Game.DELTASECOND * 3.0,
		"attack" : Game.DELTASECOND * 1.0,
		"throwingCool" : Game.DELTASECOND * 0.66,
	}
	
	this.drill = new Line(0,0,8,8);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
DonkeyKnife.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.throwing > 0 ){
			var progress = Math.min(1 - this.states.throwingCool / this.times.throwingCool, 0.999);
			this.frame.y = 1;
			this.frame.x = progress * 4;
			
			if(this.states.throwingCool <= 0){
				this.states.throwing--;
				this.states.throwingCool = this.times.throwingCool;
				
				//Throw knife
				var missle;
				if( Math.random() > 0.5 ) {
					//Bottom
					missle = new Bullet(this.position.x, this.position.y+18, (this.flip?-1:1) );
				} else {
					//top
					missle = new Bullet(this.position.x, this.position.y+2, (this.flip?-1:1) );
				}
				missle.force.x *= 1.5;
				missle.damage = this.damage;
				missle.frame.x = 4;
				missle.frame.y = 0;
				game.addObject( missle ); 
			}
			this.states.throwingCool -= this.delta;
		} else if(this.states.attack > 0) {
			var progress = Math.min(1 - this.states.attack / this.times.attack, 0.999);
			
			this.frame.y = 3;
			this.frame.x = progress * 4;
			
			if(progress > .3 && progress < .6){
				this.strike(new Line(0,-24,32,16));
			}
			this.states.attack -= this.delta;
		} else {
			if(Math.abs(dir.x) < 88){
				//move away from player
				this.frame.y = 2;
				this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4;
				this.force.x = this.speed * (this.flip ? 1 : -1);
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = this.times.cooldown;
					this.states.attack = this.times.attack;
					this.force.x = 8 * (this.flip ? -1 : 1);
				}
			} else {
				//throw knives
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = this.times.cooldown;
					this.states.throwing = 3;
					this.states.throwingCool = this.times.throwingCool;
				}
			}
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	}
}