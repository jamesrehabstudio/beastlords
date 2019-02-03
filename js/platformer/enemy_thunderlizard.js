class ThunderLizard extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "thunderlizard";
		this.swrap = self.spriteWrap["thunderlizard"];
		this.width = 40;
		this.height = 56;
		
		this.speed = 12.0;
		this.airSpeed = 1;
		this.timer = 0;
		this.ground_y = 0;
		
		this.states = {
			"phase" : 4,
			"cooldown" : 0.0,
			"time" : 0.0,
			"spin" : 0.0,
			"timeTotal" : 1.0,
			"hurttime" : 0.0,
			"downstabbed" : 0.0,
			"upattackwait" : 0.0
		}
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.lifeMax = this.life = Spawn.life(8,this.difficulty);
		this.xpDrop = Spawn.xp(7,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(4,this.difficulty);
		this.mass = 5.0;
		this.death_time = 2 * Game.DELTASECOND;
		
		this.on("land", function(){
			if(this.force.y > 4){
				audio.play("hardland",this.position);
				shakeCamera(Game.DELTASECOND*0.5,5);
			}
		});
		this.on("hurt", function(){
			
			this.timer = Math.max(this.timer, SailorSmasher.phase_idle);
			this.states.hurttime += Game.DELTASECOND;
			if(this.states.hurttime > 2.2){
				this.states.hurttime = 0.0;
				this.setState(3, true);
			}
		});
		this.on("downstabbed", function(obj,damage){
			this.states.downstabbed = Game.DELTASECOND * 2;
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
			let dir = this.position.subtract(this.target().position);
			
			this.states.upattackwait = Math.max(this.states.upattackwait - this.delta, 0);
			this.states.downstabbed = Math.max(this.states.downstabbed - this.delta, 0);
			this.states.hurttime = Math.max(this.states.hurttime - this.delta, 0);
			
			if(this.states.spin > 0){
				//Spinning attack
				if(this.states.spin > 0.5){
					this.frame = new Point(4,4);
				} else {
					this.frame = this.swrap.frame("spin", (game.time*3.0) % 1);
				}
				this.states.spin -= this.delta;
			} else if(this.states.phase == 1){
				//Charge attack
				this.frame = this.swrap.frame("run", (game.time*2.0) % 1);
				this.states.time -= this.delta;
				this.addHorizontalForce(this.forward() * this.speed);
				
				if(Math.abs(dir.x) < 64){
					this.setState(3, false);
				}
				
				if(this.states.time <= 0){
					this.setState(4);
				}
			} else if(this.states.phase == 2){
				//Lightning attack
				let p = 1 - this.states.time / this.states.timeTotal;
				this.frame = this.swrap.frame("lightning", p);
				
				this.states.time -= this.delta;
				
				if(this.states.time <= 0){
					this.setState(4);
				}
			} else if(this.states.phase == 3){
				//Up attack
				let p = 1 - this.states.time / this.states.timeTotal;
				this.frame = this.swrap.frame("upatt", p);
				
				this.states.time -= this.delta;
				
				if(this.states.time <= 0){
					this.setState(4);
				}
			} else {
				//Idle
				this.frame = this.swrap.frame("idle", (game.time*0.5) % 1);
				this.states.cooldown -= this.delta;
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = Game.DELTASECOND;
					this.setState();
				}
			}
		} else {
			this.frame.x = 4;
			this.frame.y = 4;
		}
	}
	setState(s = -1, allowSpin = true){
		let dir = this.position.subtract(this.target().position);
		this.flip = dir.x > 0;
		
		if(s < 0){
			//No state specified, pick one
			if(Math.abs(dir.x) > 80 ){
				//Far away
				let roll = Math.random() * 3;
				if(roll > 2){
					s = 2;
				} else if(roll > 1){
					s = 1;
				} else {
					s = 4;
				}
			} else if(this.states.upattackwait <= 0 && this.states.downstabbed > 0){
				//Defend down stabbing enemy
				s = 3;
				this.states.upattackwait = 3;
				allowSpin = false;
			} else {
				s = 1 + Math.floor(Math.random() * 2);
			}
		}
		
		this.states.phase = s;
		if(s == 1){
			//Charge
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2;
			this.states.cooldown = Game.DELTASECOND * 3;
		} else if(s == 2) { 
			//Lightning
			this.states.spin = Game.DELTASECOND * 1;
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2;
			this.states.cooldown = Game.DELTASECOND * 3;
		} else if(s == 3) {
			//Up attack
			if(allowSpin) { this.states.spin = Game.DELTASECOND * 1; }
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2;
			this.states.cooldown = Game.DELTASECOND * 1;
		} else {
			this.states.cooldown = Game.DELTASECOND * 3;
		}
		
	}
}

self["ThunderLizard"] = ThunderLizard;