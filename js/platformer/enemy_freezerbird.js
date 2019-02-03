class FreezerBird extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 30;
		this.height = 30;
		this.sprite = "flyingslime";
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
	
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = 0;
		this.damageIce = Spawn.damage(2,this.difficulty);
		this.defenceIce = Spawn.defence(4, this.difficulty);
		this.defenceFire = Spawn.defence(-4, this.difficulty);
		this.moneyDrop = Spawn.money(4,this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		
		this.gravity = 0.0;
		this.pushable = false;
		this.speed = 56;
		this.hurtByDamageTriggers = false;
		
		this.on("collideObject", function(obj){
			if ( obj.hasModule( mod_combat ) && obj.team != this.team ) {
				obj.hurt( this, this.getDamage() );
				
				this.life = 0;
				this.destroy();
			}
		});
		
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
		
		if(this.life > 0){
		
			if(true){
				this.flip = this.position.x > this.target().position.x;
				
				this.force.y = Math.clamp( (this.target().position.y - this.position.y) / 64, -1, 1 ) * 3.0;
				
				
				this.addHorizontalForce( this.speed * this.forward(), 0.5 );
				
			}
		} else {
			
			this.gravity = 0.5;
			
		}
		
	}
}

self["FreezerBird"] = FreezerBird;