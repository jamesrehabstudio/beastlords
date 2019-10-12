class ChickenDrill extends GameObject{
	constructor(x, y, d, o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 30;
		this.sprite = "chickendrill";
		this.speed = 0.125;
		
		this.loadSprites = ["chickendrill"];
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		this.addModule( mod_creep );
		
		this.states = {
			"cooldown" : Game.DELTASECOND * 3,
			"attack" : 0.0,
			"drilling" : 0,
			"spike" : 0
		};
		
		this.difficulty = o.getInt("difficulty", Spawn.difficulty);
		
		this.life = Spawn.life(4,this.difficulty);
		this.lifeMax = Spawn.life(4,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(7,this.difficulty);
		this.xpDrop = Spawn.xp(8,this.difficulty);
		this.mass = 1.5;
		this.death_time = Game.DELTASECOND * 0.5;
		
		this.on("struck", EnemyStruck);
		this.on("wakeup", function(){
			this.states.attack = 0.0;
			this.states.drilling = 0;
			this.states.cooldown = Game.DELTASECOND * 3;
		});
		
		this.on("hurt", function(){
			
		});
		this.on("death", function(){
			
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.creep_hide();
		});
	}
	update(){
		if ( this.life > 0 ) {
			var dir = this.position.subtract( _player.position );
			
			if(this.states.drilling){
				this.states.attack -= this.delta;
				
				if(this.states.attack <= 0 ){
					this.states.drilling = 0;
				} else if(this.grounded){
					if (Timer.interval(this.states.attack,Game.DELTASECOND*0.2,this.delta)){
						var spikes = new ChickenDrillSpike(
							this.position.x + this.states.spike * 40 * this.forward(), 
							this.position.y + 8
						);
						spikes.damage = this.damage;
						game.addObject(spikes);
						this.states.spike++;
					}
				}
			} else {
				//idle
				this.states.cooldown -= this.delta;
				
				if(this.states.cooldown <= 0 ){
					this.states.drilling = 1;
					this.states.attack = Game.DELTASECOND * 2.0;
					this.states.cooldown = Game.DELTASECOND * 2;
					this.states.spike = 1;
					this.force.y = -9;
					this.grounded = false;
					this.flip = dir.x > 0;
				}
			}
		}
		
		/* Animation */
		if( this.grounded ) {
			if(this.states.drilling){
				this.frame.x = (this.frame.x + this.delta * 24.0) % 3;
				this.frame.y = 2;
			} else {
				this.frame.x = (this.frame.x + this.delta * 6.0) % 4;
				this.frame.y = 0;
			}
		} else {
			this.frame.y = 1;
			if(this.force.y > 0 ) {
				this.frame.x = 2;
			} else {
				this.frame.x = 1;
			}
		}
	}
	smoke(spos){
		var x = Math.lerp(spos.start.x, spos.end.x, Math.random());
		var y = Math.lerp(spos.start.y, spos.end.y, Math.random());
		
		game.addObject( new EffectSmoke(
			x, y, null,
			{
				"frame":1, 
				"speed":0.4 + Math.random() * 0.2,
				"time":Game.DELTASECOND * (0.3 + 0.4 * Math.random())
			}
		));
	}
}

self["ChickenDrill"] = ChickenDrill;

class ChickenDrillSpike extends GameObject{
	constructor(x, y, d, o){
		super(x, y, d, o);
		
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 8;
		this.sprite = "chickendrill";
		this.damage = 1;
		this.frame = new Point(0,3);
		this.time = this.timeMax = Game.DELTASECOND * 2.0;
		this.visible = false;
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		this.force.y = 8;
		
		this.on("sleep", function(obj){
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if(this.frame.x >= 1 && obj instanceof Player){
				var prelife = obj.life;
				
				obj.hurt(this,this.damage);
				
				if(obj.life != prelife){
					this.destroy();
				}
			}
		});
	}
	update(){
		if(this.time <= this.timeMax - Game.DELTASECOND * 0.03125){
			this.visible = true;
			if(this.isStuck || !this.grounded){
				this.destroy();
			}
		}
		
		this.time -= this.delta;
		
		if(this.time <= 0){
			this.frame.x = Math.min(this.frame.x - this.delta * 15.0, 2);
			if(this.frame.x < 0){
				this.destroy();
			}
		} else {
			this.frame.x = Math.min(this.frame.x + this.delta * 15.0, 2);
		}
	}
}

self["ChickenDrillSpike"] = ChickenDrillSpike;