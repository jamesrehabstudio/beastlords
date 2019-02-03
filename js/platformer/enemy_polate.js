class Polate extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 48;
		this.sprite = "polate";
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.death_time = Game.DELTASECOND;
		this.lifeMax = this.life = Spawn.life(5,this.difficulty);
		this.xpDrop = Spawn.xp(6,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(5,this.difficulty);
		this.mass = 1.0;
		this.pushable = false;
		
		this.states = {
			"attack" : 0,
			"cooldown" : 0,
			"jumpback" : 0
		}
		this.times = {
			"attack" : 1.5 * Game.DELTASECOND,
			"cooldown" : 3 * Game.DELTASECOND,
			"jumpback" : 3 * Game.DELTASECOND
		}
		
		this.on("hurt", function(){
			
			if(this.states.attack <= 0){
				this.states.jumpback = this.times.jumpback;
			}
		});
		
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
	}
	
	update(){
		if(this.life > 0){
			let dir = this.position.subtract(_player.position);
			
			if(this.states.attack > 0){
				//attack
				this.states.attack -= this.delta;
				
				if(this.states.attack > this.times.attack * 0.5){
					//Warm
					this.frame.x = 0;
					this.frame.y = 2;
				} else if(this.states.attack > this.times.attack * 0.4){
					//Striking
					this.frame.x = 1;
					this.frame.y = 2;
					this.strike(new Line(0,-12,72,4));
				} else {
					//Rest
					this.frame.x = 2;
					this.frame.y = 2;
				}
				
			} else if(this.states.jumpback > 0) {
				//leap back
				this.states.jumpback -= this.delta;
				this.frame.x = 1;
				this.frame.y = 1;
				
				if(!this.grounded){
					//In the air
					this.force.y -= this.delta * 0.8;
					this.friction = 0.0;
				} else if(Timer.isAt(this.states.jumpback, Game.DELTASECOND * 2.25, this.delta)){
					//Jump
					this.states.cooldown = 0;
					this.grounded = false;
					this.flip = dir.x > 0;
					this.force.y = -6;
					this.force.x = this.forward() * -4;
				} else {
					this.frame.x = 0;
					this.frame.y = 1;
					this.friction = 0.5;
				}
			} else {
				//idle
				this.frame.x = 0;
				this.frame.y = 0;
				this.flip = dir.x > 0;
				
				this.states.cooldown -= this.delta;
				
				if(this.states.cooldown <= 0 && Math.abs(dir.x) < 80){
					if(this.grounded){
						this.states.cooldown = this.times.cooldown;
						this.states.attack = this.times.attack;
					}
				} else if(dir.y > 32 && !_player.grounded){
					
					if(Math.abs(dir.x) < 128){
						//Playing attempting to jump over
						this.states.jumpback = this.times.jumpback;
						this.states.cooldown = 0;
					}
					
				}
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
		}
		
	}
}
self["Polate"] = Polate;