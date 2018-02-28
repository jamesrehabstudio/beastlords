class Igbo extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "igbo";
		this.width = 32;
		this.height = 40;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.speed = 0.5;
		this.mass = 4.0;
		this.death_time = Game.DELTASECOND * 3;
		
		this.guard.active = true;
		this.guard.x = 8;
		this.guard.y = -24;
		this.guard.w = 32;
		this.guard.h = 32;
		this.guard.rotation = 0;
		this.guard.omidirectional = true;
		
		this.difficulty = Spawn.difficulty;
		this.lifeMax = this.life = Spawn.life(9, this.difficulty);
		this.damage = Spawn.damage(4);
		this.moneyDrop = Spawn.money(6,this.difficulty);
		
		this.states = {
			"phase" : Igbo.PHASE_IDLE,
			"timer" : 0.0,
			"blockTimer" : 0.0,
			"blockCount" : 0,
			"cooldown" : Game.DELTASECOND * 3,
			"cooldownMax" : Game.DELTASECOND * 3,
		}
		
		this.on("block", function(obj,pos,damage){
			audio.play("block", this.position);
			this.states.blockCount++;
			this.states.blockTimer = Game.DELTASECOND;
			if(this.states.blockCount >= 3){
				this.setState(Igbo.PHASE_SHIELDSMASH);
			}
		});
		this.on("hurt", function(){
			this.setState(Igbo.PHASE_RETREAT);
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			Item.drop(this);
			audio.play("kill",this.position);
			this.destroy();
		});
		
	}
	update(){
		if(this.life > 0 && this.stun <= 0){
			let tdir = this.position.subtract(this.target().position);
			
			this.states.blockTimer -= this.delta
			if(this.states.blockTimer <= 0){
				this.states.blockTimer = 0.0;
				this.states.blockCount = 0;
			}
			
			if(this.states.phase == Igbo.PHASE_SHIELDSMASH){
				//Shield smash
				if(this.delta > 0){
					this.guard.active = false;
					this.target().hurt(this, this.damage);
					this.frame = new Point(0,3);
				} else {
					this.frame = new Point(0,2);
				}
				this.states.timer -= this.delta;
				if(this.states.timer <= 0){
					this.setState(Igbo.PHASE_IDLE);
				}
				
			} else if(this.states.phase == Igbo.PHASE_RETREAT){
				//Retreat with fire
				this.guard.active = true;
				this.flip = tdir.x > 0;
				
				if(this.grounded){
					if(this.states.timer > 0){
						this.grouded = false;
						this.force.y = -6;
						this.force.x = -this.speed * 5;
					} else {
						this.setState(Igbo.PHASE_IDLE);
					}
				} else {
					this.force.x -= this.forward() * this.delta * this.speed;
					this.force.y -= this.delta * 0.8;
					this.states.timer -= this.delta;
					if(Timer.isAt(this.states.timer, 0, this.delta)){
						this.fire(1);
					}
				}
				
			} else if(this.states.phase == Igbo.PHASE_ATTACK){
				//Attack 
				this.guard.active = false;
				this.states.timer -= this.delta;
				if(Timer.isAt(this.states.timer, Game.DELTASECOND * 0.25, this.delta)){
					this.fire(-1);
				}
				this.frame = new Point(0,0);
			} else if(this.states.phase == Igbo.PHASE_IDLE){
				//Posture
				this.guard.active = true;
				this.flip = tdir.x > 0;
				let a = tdir.toAngle();
				
				if(Math.abs(tdir.x) < 80){
					this.states.cooldown -= this.delta * 0.5;
					if(this.states.cooldown <= 0) {
						this.setState(Igbo.PHASE_RETREAT);
					}
				} else {
					this.states.cooldown -= this.delta * 1;
					if(this.states.cooldown <= 0){
						this.setState(Igbo.PHASE_ATTACK);
					}
				}
				
				this.guard.rotation = (this.flip?0:180) - a * (180 / Math.PI);
				this.guard.x = Math.abs( Math.cos(a) * -16 ) + 0;
				this.guard.y = Math.min( Math.sin(a) * 16, 0 ) - 24;
				
				if(Math.abs(tdir.x) < 80 && tdir.y > 32){
					this.frame = new Point(0,1);
				} else {
					this.frame = new Point(0,0);
				}
				
			}
		} else {
			
		}
	}
	setState(s){
		this.states.phase = s;
		if(s == Igbo.PHASE_SHIELDSMASH){
			game.slow(0, Game.DELTASECOND * 0.8);
			this.states.timer = Game.DELTASECOND * 0.5;
			this.states.blockCount = 0;
		}
		if(s == Igbo.PHASE_RETREAT){
			this.states.timer = Game.DELTASECOND * 0.5;
		}
		if(s == Igbo.PHASE_ATTACK){
			this.states.timer = Game.DELTASECOND * 0.5;
		}
	}
	fire(dir){
		var yforce = dir > 0 ? 4 : -8;
		
		var bomb = new CarpetBomb(this.position.x, this.position.y);
		bomb.damageFire = this.damage;
		bomb.force = new Point(this.forward()*6, yforce);
		game.addObject(bomb);
	}
	render(g,c){
		GameObject.prototype.render.apply(this,[g,c]);
		
		if(this.guard.active){
			g.renderSprite(this.sprite, this.position.subtract(c),this.zIndex+1,Igbo.SHIELDFRAME,this.flip,{
				"rotation" : this.guard.rotation
			});
		}
	}
}
Igbo.SHIELDFRAME = new Point(0,4);
Igbo.PHASE_SHIELDSMASH = 0;
Igbo.PHASE_RETREAT = 1;
Igbo.PHASE_ATTACK = 2;
Igbo.PHASE_IDLE = 3;


self["Igbo"] = Igbo;