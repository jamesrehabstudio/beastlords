class DrillerKiller extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "drillerkiller";
		this.swrap = spriteWrap.drillerkiller;
		this.width = 48;
		this.height = 48;
		this.speed = 10.0;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.death_time = Game.DELTASECOND * 0.5;
		this.lifeMax = this.life = Spawn.life(8,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(6,this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		this.xpDrop = Spawn.xp(7,this.difficulty);
		this.mass = 1.5;
		
		this.on("block", function(obj,strike_rect,damage){
			audio.play("block",this.position);
		});
		this.on(["blocked","hurt_other"], function(obj,damage){
			if(obj.hasModule(mod_rigidbody)){
				obj.force.x += this.forward() * 8;
				this.force.x = this.forward() * -2;
			}
		});
		this.on("hurt", function(obj,damage){
			
		});
		this.on("death", function(){
			this.destroy();
			Item.drop(this,12);
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
		});
		
		this._drilllift = 0.0;
		this._swingTime = 0.0;
		this._charging = 0.0;
		this._stunImmune = 0.0;
		
	}
	update(){
		if(this.life > 0){
			let dif = this.target().position.subtract(this.position);
			this._stunImmune -= this.delta;
			
			if(this._charging > 0){
				//Push drill forward
				this.frame = this.swrap.frame("run", 0.0);
				this.addHorizontalForce( this.speed * this.forward() );
				
				if(this.atLedge()){
					this.force.x = 0.0;
					this._charging = 0.0;
				}
				
				if(!this.target().grounded && Math.abs(dif.x) < 96){
					//Player is the air
					this._charging -= this.delta * 3.0;
				}
				
				if((this.flip && dif.x > 0) || (!this.flip && dif.x < 0) ){
					//Player behind
					this._charging -= this.delta;
				}
				
			} else if(this.stun > 0 && this._stunImmune <= 0){
				this._drilllift = this._charging = 0.0;
				this._swingTime = DrillerKiller.SWING_TIME;
				
				this.frame = this.swrap.frame("hurt", 0.0);
				
				if(this.combat_stuncount > 3){
					this._stunImmune = Game.DELTASECOND * 2.0;
				}
			} else if(this._swingTime > 0){
				//Smash drill down
				let p = 1.0 - this._swingTime / DrillerKiller.SWING_TIME;
				this.frame = this.swrap.frame("attack", p);
				this._swingTime -= this.delta;
				
				if(this._swingTime <= 0) {
					this._charging = 0.8 * Game.DELTASECOND;
				}
			} else if(this._drilllift > 0){
				//Lifting drill up
				let p = 1.0 - this._drilllift / DrillerKiller.SWING_TIME;
				this.frame = this.swrap.frame("lift", p);
				this._drilllift -= this.delta;
			} else {
				//Wait
				if(Math.abs(dif.x) < 160){
					this.flip = dif.x < 0;
					this._swingTime = DrillerKiller.SWING_TIME;
					this._drilllift = DrillerKiller.SWING_TIME;
				}
			}
		} else {
			this.frame = this.swrap.frame("hurt", 0.0);
		}
	}
}
DrillerKiller.SWING_TIME = Game.DELTASECOND * 0.8;

self["DrillerKiller"] = DrillerKiller;