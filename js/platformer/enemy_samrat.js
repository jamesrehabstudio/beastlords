class Samrat extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 30;
		this.sprite = "samrat";
		this.swrap = spriteWrap["samrat"];
		this.frame = new Point();
		
		this.speed = 12.0;
		this.jumpStrength = 8;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.gravity = 0.5;
		this.pushable = false;
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.alwayAlert = ops.getBool("alert", false);
		
		this.life = this.lifeMax = Spawn.life(2,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		
		this.states = {
			anim : 0.0,
			land : 0.0,
			jump : 0.0,
			dive : 0,
			kick : 0.0,
			escape : 0.0,
			active : 0.0,
			backoff : 0.0,
			cooldown : 3.0,
		}
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt",this.position);
			
			this.gravity = 0.5;
			this.states.dive = 0;
			this.states.active = Samrat.TIME_ALERT;
			if(this.life > 0 && this.states.escape <= 0){
				this.states.escape = Game.DELTASECOND * 0.5;
				this.flip = this.target().position.x < this.position.x;
				this.force.x = this.speed * -this.forward();
			}
		});
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			audio.play("kill",this.position);
			this.destroy();
		});
		
		this.on("collideHorizontal", function(){
			this.force.x = 0;
			if(this.states.backoff > 0){
				this.states.backoff = 0;
			} else {
				this.states.backoff = Samrat.TIME_BACKOFF;
			}
		});
		this.on("land", function(){
			this.force.x = 0;
			this.states.land = Samrat.TIME_LAND;
			this.states.dive = 0;
			this.gravity = 0.5;
		});
	}
	
	update(){
		if(this.life > 0 ){
			let dif = this.target().position.subtract(this.position);
			
			if ( this.states.active <= 0.0 && !this.alwayAlert) {
				//Pray
				this.frame = this.swrap.frame("pray", game.time % 1);
				if(Math.abs(dif.x) < 88 && Math.abs(dif.y) < 32){
					this.states.active = Samrat.TIME_ALERT;
				}
			} else if(this.states.escape > 0){
				//Escape
				this.states.escape -= this.delta;
				this.frame = new Point(0,3);
			} else if(this.states.land > 0.0){
				//Land animation
				this.states.land -= this.delta;
				let p = 1 - (this.states.land / Samrat.TIME_LAND);
				this.frame = this.swrap.frame("land", p);
			} else if(this.states.jump > 0.0){
				//jump into the air
				if(this.grounded){
					this.grounded = false;
					this.force.y = -this.jumpStrength;
				}
				this.states.jump -= this.delta;
				this.frame = this.swrap.frame("jump" , 1 - (this.states.jump / Samrat.TIME_JUMP));
			} else if(this.states.dive > 0){
				//dive kick attack
				if(this.states.anim >= 1){
					if(this.states.dive == 1){
						this.force.x = this.forward() * this.speed;
						this.force.y = Math.abs(this.force.x) * 0.5;
					} else {
						this.force.x = 0;
						this.force.y = this.speed;
					}
				} else {
					this.states.anim += this.delta;
					this.frame = this.swrap.frame("dive" + this.states.dive, this.states.anim);
				}
				
			} else if(!this.grounded){
				if(this.force.y >= 0){
					//Transition into dive kick
					if(Math.abs(dif.x) > 64){
						this.states.dive = 1;
					} else {
						this.states.dive = 2;
					}
					
					this.states.anim = 0.0;
					this.force.y = 0;
					this.gravity = 0.0;
				} else {
					this.frame = new Point(0,6);
				}
			} else if(this.states.kick > 0.0){
				//Kick attack
				let p = 1 - this.states.kick / Samrat.TIME_KICK;
				this.frame = this.swrap.frame("kick", p);
				this.states.kick -= this.delta;
			} else {
				//Active
				this.states.anim = this.states.anim + this.delta * Math.abs(this.force.x) * 1.0;
				
				if(this.states.anim >= 1){
					this.states.anim = this.states.anim % 1;
					this.flip = dif.x < 0;
				}
				
				let speed = this.speed * Math.max( Math.sin( this.states.anim * Math.PI ), 0.25 );
				
				if(this.states.backoff > 0.0){
					this.frame = this.swrap.frame("backward", this.states.anim);
					this.addHorizontalForce(this.forward() * -speed);
					this.states.backoff -= this.delta;
				} else {
					this.frame = this.swrap.frame("forward", this.states.anim);
					this.addHorizontalForce(this.forward() * speed);
				}
				
				this.states.cooldown -= this.delta;
				
				if(this.states.backoff <= 0 && Math.abs(dif.x) < 48 && Math.abs(dif.y) < 32){
					this.states.backoff = Samrat.TIME_BACKOFF;
				}
				
				if(this.states.cooldown <= 0){
					
					if(Math.abs(dif.x) < 40 && Math.abs(dif.y) < 32){
						this.states.kick = Samrat.TIME_KICK;
					} else if(game.time > Samrat.last_jump){
						this.states.jump = Samrat.TIME_JUMP;
						this.states.cooldown = Game.DELTASECOND * 4;
						Samrat.last_jump = game.time + Game.DELTASECOND * 1.0;
					} else {
						this.states.cooldown = Game.DELTASECOND * 0.5;
					}
				}
				
			}
		} else {
			this.frame = new Point(0,3);
		}
	}
}
Samrat.last_jump = 0;
Samrat.TIME_JUMP = Game.DELTASECOND * 0.3;
Samrat.TIME_LAND = Game.DELTASECOND * 0.4;
Samrat.TIME_BACKOFF = Game.DELTASECOND * 1.5;
Samrat.TIME_KICK = Game.DELTASECOND * 1.75;
Samrat.TIME_ALERT = Game.DELTASECOND * 3;

self["Samrat"] = Samrat;