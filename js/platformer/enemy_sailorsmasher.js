class SailorSmasher extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "sailorsmasher";
		this.width = 40;
		this.height = 56;
		
		this.speed = 1;
		this.airSpeed = 1;
		this.timer = 0;
		this.ground_y = 0;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(8,this.difficulty);
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
			audio.play("hurt",this.position);
			this.timer = Math.max(this.timer, SailorSmasher.phase_idle);
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if(this.force.y > 2 && obj.position.y > this.position.y){
				//Crush objects below 
				if(obj.hasModule(mod_combat)){
					obj.hurt(this, this.damage)
				}
			}
		});
	}
	update(){
		if(this.life > 0){
			if(this.timer < SailorSmasher.phase_idle){
				//idle
				this.gravity = 1;
				this.ground_y = this.position.y;
			} else if(this.timer < SailorSmasher.phase_jump){
				//Jump and target
				var p = this.target().position.subtract(this.position);
				this.gravity = 0;
				if(Math.abs(p.x) > 8 ){
					this.flip = p.x < 0;
					this.force.x += this.forward() * this.speed * this.delta;
				}
				if(this.grounded){
					this.grounded = false;
					this.force.y = -this.airSpeed / this.friction;
				}
				if(this.ground_y - this.position.y < 48){
					this.force.y -= this.airSpeed * this.delta;
				}
				this.force.y *= 1 - this.friction * this.delta;
			} else if (this.timer < SailorSmasher.phase_hang){
				//Hanging in the air
				this.gravity = 0;
				this.force.y *= 1 - this.friction * this.delta;
			} else if(this.timer < SailorSmasher.phase_pound){
				//Ground pound
				this.gravity = 1;
			} else {
				this.timer = 0.0;
			}
			this.timer += this.delta;
		} else {
			this.gravity = 0;
			this.force.x = this.force.y = 0;
		}
	}
}
SailorSmasher.phase_idle = 3 * Game.DELTASECOND;
SailorSmasher.phase_jump = 4.5 * Game.DELTASECOND;
SailorSmasher.phase_hang = 5.5 * Game.DELTASECOND;
SailorSmasher.phase_pound = 8 * Game.DELTASECOND;

self["SailorSmasher"] = SailorSmasher;