class WallNolt extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "portholeman";
		this.width = 24;
		this.height = 24;
				
		this.bulletSpeed = 4;
		this.timer = 0;
		this.throwReady = true;
		
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		if("flip" in ops){
			this.flip = ops["flip"]=="true";
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.xpDrop = Spawn.xp(1,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.death_time = 0;
		
		this.on("wakeup", function(){
			this.life = this.lifeMax;
			this.timer = 0;
		});
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			createExplosion(this.position, 40 );
			//this.destroy();
		});
	}
	update(){
		if(this.life > 0){
			let dif = this.position.subtract(this.target().position);
			
			if(this.timer < WallNolt.PHASE_HIDE){
				this.interactive = false;
				this.frame.x = 0;
				this.frame.y = 0;
			} else if(this.timer < WallNolt.PHASE_LOOK){
				this.interactive = true;
				this.throwReady = true;
				this.frame.x = 0;
				this.frame.y = 1;
			} else if(this.timer < WallNolt.PHASE_THROW){
				if(this.throwReady){
					this.fire();
					this.throwReady = false;
				}
				this.interactive = true;
				this.frame.x = 0;
				this.frame.y = 2;
			} else if(this.timer < WallNolt.PHASE_ESCAPE){			
				this.interactive = false;
				this.frame.x = 0;
				this.frame.y = 0;
			} else {
				this.timer = 0;
			}
			this.timer += this.delta;
		} else {
			this.interactive = false;
			this.frame.x = 0;
			this.frame.y = 0;
		}
	}
	fire(){
		//audio.play("bullet1",this.position);
		
		let dif = this.position.subtract(this.target().position);
		var bullet = new Bullet(this.position.x + this.forward() * 12, this.position.y);
		bullet.team = this.team;
		bullet.damage = this.damage;
		bullet.force = dif.normalize(-this.bulletSpeed);
		bullet.sprite = this.sprite;
		bullet.frame = new Point(0,3);
		bullet.setDeflect();
		bullet.rotation = 0.0;
		bullet.on("preupdate", function(){this.rotation += this.delta * 6;});
		game.addObject(bullet);
		
	}
}
WallNolt.PHASE_HIDE = Game.DELTASECOND * 1.5;
WallNolt.PHASE_LOOK = Game.DELTASECOND * 3.0;
WallNolt.PHASE_THROW = Game.DELTASECOND * 4.5;
WallNolt.PHASE_ESCAPE = Game.DELTASECOND * 5.0;

self["WallNolt"] = WallNolt;