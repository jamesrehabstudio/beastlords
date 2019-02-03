class Spikebug extends GameObject{
	constructor(x, y, d, ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 16;
		this.sprite = "spikebug";
		this.speed = 3.0;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
				
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty)
		
		this.lifeMax = this.life = Spawn.life(1,this.difficulty);
		this.xpDrop = Spawn.xp(2,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(2,this.difficulty);
		this.mass = 0.7;
		
		this.on(["added","wakeup"], function(obj){
			var dir = this.position.subtract(_player.position);
			this.flip = dir.x > 0;
		});
		this.on("collideObject", function(obj){
			if(this.life > 0){
				if(obj instanceof Player){
					if(!obj.grounded){
						obj.hurt(this,this.getDamage());
					} else {
						this.flip = !this.flip;
					}
				}
			}
		});
		this.on("collideHorizontal", function(x){
			this.force.x = 0;
			this.flip = !this.flip;
		});
		this.on("struck", EnemyStruck);
		
		this.on("hurt", function(){
			
		});
		this.on("death", function(){
			
			audio.play("kill",this.position);
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
	}
	update(){
		if ( this.life > 0 ) {
			if(this.grounded){
				if(this.atLedge()){
					this.flip = !this.flip;
				}
				this.addHorizontalForce(this.forward() * this.speed);
			}
		} else{
			//Stun or dead
			this.frame.x = 2;
			this.frame.y = 1;
		} 
	}
}
self["Spikebug"] = Spikebug;