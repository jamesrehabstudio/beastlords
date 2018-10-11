class Axedog extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 30;
		this.sprite = "axedog";
		this.swrap = spriteWrap["axedog"];
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.states = {
			"cooldown" : 5,
			"attack" : 0.0,
			"direction" : 1.0,
			"walk" : 0.0
		};
		this.times = {
			"cooldown" : Game.DELTASECOND * 2.0,
			"attack" : Game.DELTASECOND * 1.65
		}
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.lifeMax = this.life = Spawn.life(3,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(4,this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		this.mass = 1.0;
		this.speed = 5.0;
		
		this.on("collideHorizontal", function(x){
			this.force.x = 0;
			this.states.direction = x > 0 ? -1 : 1;
			this.position.x += this.states.direction;
		});
		this.on("struck", EnemyStruck);
		
		this.on("hurt", function(){
			audio.play("hurt",this.position);
			this.states.cooldown = Game.DELTASECOND * 0.5;
			this.states.attack = 0.0;
			this.force.x = 0.0;
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
	}
	update(){
		if ( this.stun <= 0 && this.life > 0 ) {
			var dir = this.position.subtract( this.target().position );
			
			if( this.states.attack > 0 ) {
				let p = 1 - this.states.attack / this.times.attack;
				this.frame = this.swrap.frame("attack",p);
				this.states.attack -= this.delta;
				this.force.x = 0;
			} else {
				this.states.walk = (this.states.walk+this.delta*Math.abs(this.force.x)) % 1;
				this.frame = this.swrap.frame("walk",this.states.walk);
				
				if( this.grounded && this.atLedge() ){
					//Turn around, don't fall off the edge
					this.force.x = 0;
					this.states.direction *= -1.0;
				}
				
				if( Math.abs( dir.x ) > 24 || Math.abs(dir.y) > 48) {
					this.flip = this.states.direction < 0;
					this.addHorizontalForce(this.speed * this.forward());
				}
				
				if(Math.abs(dir.y) < 48){
					this.states.cooldown -= this.delta;
					
					if( this.states.cooldown <= 0 && Math.abs( dir.x ) < 64 ) {
						this.states.attack = this.times.attack;
						this.states.cooldown = this.times.cooldown;
						this.flip = dir.x > 0;
					}
				}
			}
		} else {
			this.frame = this.swrap.frame("hurt",0);
		}
	}
}
self.Axedog = Axedog;