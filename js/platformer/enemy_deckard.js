Deckard.prototype = new GameObject();
Deckard.prototype.constructor = GameObject;
function Deckard(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	this.sprite = "deckard";
	this.speed = 21.0;
	
	this.batty1 = false;
	this.batty2 = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"transition" : 0.0,
		"current" : 0,
		"time" : 0.0,
		"timeTotal" : 0.0,
		"combo": 0,
		"attack" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.lifeMax = Spawn.life(6,this.difficulty);
	this.moneyDrop = Spawn.money(15,this.difficulty);
	this.xpDrop = Spawn.xp(8,this.difficulty);
	this.mass = 4;
	this.damage = Spawn.damage(3,this.difficulty);
	this.death_time = Game.DELTASECOND * 2;
	
	this.on("struck", EnemyStruck);
	this.on("new_room", function(){
		this.destroy();
	});
	this.on("death", function(){
		Item.drop(this,20);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		
		if(this.batty1 instanceof Batty){
			this.batty1.position = this.position.scale(1);
			this.batty1.creep_show(false);
		}
		if(this.batty2 instanceof Batty){
			this.batty2.position = this.position.scale(1);
			this.batty2.creep_show(false);
		}
		
		this.destroy();
	});
}

Deckard.STATE_IDLE = 0;
Deckard.STATE_CHARGE = 1;
Deckard.STATE_PUNCH = 2;
Deckard.STATE_FIRE = 3;
Deckard.STATE_LEAP = 4;

Deckard.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	this.states.current = s;
	
	if(this.states.current == Deckard.STATE_IDLE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
	} else if(this.states.current == Deckard.STATE_CHARGE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(this.states.current == Deckard.STATE_PUNCH){
		this.states.combo = 3;
	} else if(this.states.current == Deckard.STATE_FIRE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(this.states.current == Deckard.STATE_LEAP){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 0.2;
		this.flip = dir.x > 0;
	}
}

Deckard.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.states.transition > 0){
			
		} else{
			if(this.states.current == Deckard.STATE_IDLE){
				this.states.time -= this.delta;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 5;
				this.frame.y = 0;
				
				if(this.states.time <= 0){
					if(Math.abs(dir.x > 168)){
						if(Math.random() < 0.5){
							this.setState(Deckard.STATE_IDLE);
						} else {
							this.setState(Deckard.STATE_LEAP);
						}
					} else {
						if(Math.random() < 0.5){
							this.setState(Deckard.STATE_CHARGE);
						} else {
							this.setState(Deckard.STATE_FIRE);
						}
					}
					
				}
			} else if(this.states.current == Deckard.STATE_CHARGE){
				this.addHorizontalForce(this.speed * this.forward());
				this.states.time -= this.delta;
				this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 3.0) % 4;
				this.frame.y = 4;
				
				if(this.states.time <= 0 || Math.abs(dir.x) < 64){
					if((dir.x < 0 && this.forward() < 0) || (dir.x > 0 && this.forward() > 0)){
						this.setState(Deckard.STATE_IDLE);
					} else if( Math.random() < 0.25 ){
						this.setState(Deckard.STATE_LEAP);
					} else {
						this.setState(Deckard.STATE_PUNCH);
					}
				}
			} else if(this.states.current == Deckard.STATE_PUNCH){
				this.states.time -= this.delta;
				this.frame = Deckard.anim_attack.frame(1 - this.states.time/this.states.timeTotal);
				
				if(this.frame.x == 1){
					this.grounded = false;
					this.addHorizontalForce(this.speed * this.forward());
					this.force.y = Math.min(this.force.y - this.delta, -1);
				} else if(this.frame.x == 2){
					this.strike(Deckard.attack_rect);
				}
				
				if(this.states.time <= 0){
					if(this.states.combo <= 0){
						this.setState(Deckard.STATE_IDLE);
					} else {
						this.states.combo--;
						this.states.time = Game.DELTASECOND * 1.2;
						this.flip = dir.x > 0;
					}
				}
			} else if(this.states.current == Deckard.STATE_FIRE){
				this.flip = dir.x > 0;
				this.states.time -= this.delta;
				this.frame = Deckard.anim_fire.frame(1 - this.states.time/this.states.timeTotal);
				
				if(Timer.isAt(this.states.time,Game.DELTASECOND*0.2,this.delta)){
					var bullet = Bullet.createFireball(this.position.x, this.position.y);
					bullet.force = _player.position.subtract(this.position).normalize(6);
					bullet.damageFire = this.damage;
					bullet.effect = EffectSmoke;
					bullet.team = this.team;
					game.addObject(bullet);
				}
				
				if(this.states.time <= 0){
					this.setState(Deckard.STATE_IDLE);
				}
			} else if(this.states.current == Deckard.STATE_LEAP){
				this.states.time -= this.delta;
				if(this.grounded){
					this.frame.x = 0;
					this.frame.y = 3;
					if(this.states.time <= 0){
						this.setState(Deckard.STATE_IDLE);
					} else if(Timer.isAt(this.states.time,this.states.timeTotal*0.1,this.delta)){
						this.grounded = false;
						this.force.y = -12;
					}
				} else {
					if(this.force.y > 0){
						Combat.strike.apply(this,[Deckard.attack_rect, {"blockable":false}]);
					}
					this.frame.x = (this.force.y < -0.1 ? 1 : (this.force.y > 0.1 ? 3 : 2));
					this.frame.y = 1;
					if((Math.abs(dir.x) < 32) ||(dir.x < 0 && this.forward() < 0) || (dir.x > 0 && this.forward() > 0)){
						
					} else {
						this.addHorizontalForce(this.speed * this.forward() * 1.2);
					}
					this.force.y -= 0.2 * this.delta;
				}
			}
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 3;
	}
}
Deckard.attack_rect = new Line(8,-8,32,24);
Deckard.anim_attack = new Sequence([
	[0,1,0.5],
	[1,1,0.5],
	[2,1,0.1],
	[3,1,0.5],
]);
Deckard.anim_fire = new Sequence([
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.4],
	[3,2,0.1],
	[4,2,0.5],
]);