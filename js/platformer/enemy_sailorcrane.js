class SailorCrane extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "hooksailor";
		this.width = 32;
		this.height = 32;
		
		this.force = new Point(0,0);
		this.speedIn = 0.5;
		this.speedOut = 0.25;
		this.friction = new Point(0.1, 0.1);
		
		this.phase = 0;
		this.timer = 1.2 * Game.DELTASECOND;
		this.shotTime = 0.333 * Game.DELTASECOND;
		this.shots = 4;
		
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.death_time = 0;
		
		this.on("wakeup", function(){
			this.phase = 0;
			this.timer = 1.2 * Game.DELTASECOND;
			this.position.y = game.camera.y;
		});
		this.on("sleep", function(){
			this.destroy();
		});
		
		this.on("hurt", function(obj, damage){
			this.force.x = 5 * (obj.x > this.position.x ? -1 : 1);
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			createExplosion(this.position, 40 );
			//this.destroy();
		});
		
		this.trigger("wakeup");
	}
	update(){
		if(this.life > 0){
			let dif = this.position.subtract(this.target().position);
			if(this.phase == 0){
				//slide in
				this.flip = dif.x > 0;
				this.force.y += this.speedIn * this.delta;
				if(dif.y > -8){
					this.phase++;
				}
			} else if (this.phase == 1){
				//wait and fire
				this.force.y = this.force.x = 0.0;
				this.timer -= this.delta;
				
				if(this.timer <= 0){
					if(this.shots > 0){
						this.flip = dif.x > 0;
						this.fire();
						this.shots--;
						this.timer = this.shotTime;
					} else {
						this.phase++;
					}
				}
			}  else {
				//Rise up and out of shot
				this.force.y -= this.speedOut * this.delta;
			}
		} else {
			this.force.y += this.delta;
			this.friction.y = 0.02;
		}
		this.force = this.force.scale(new Point(1,1).subtract(this.friction.scale(this.delta)));
		this.position = this.position.add(this.force.scale(this.delta));
	}
	fire(){
		audio.play("bullet1",this.position);
		var bullet = new Bullet(this.position.x + this.forward() * 16, this.position.y);
		bullet.team = this.team;
		bullet.damage = this.damage;
		bullet.force = new Point(this.forward()*4, 0);
		bullet.flip = this.flip;
		bullet.frame = new Point(4,0);
		game.addObject(bullet);
		
	}
}

self["SailorCrane"] = SailorCrane;