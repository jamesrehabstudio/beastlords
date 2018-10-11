class Laughing extends GameObject {
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 16;
		this.team = 0;
		this.sprite = "laughing";
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		
		this.difficulty = o.getInt("difficulty", Spawn.difficulty);
		
		this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		this.xpDrop = Spawn.xp(3,this.difficulty);
		this.damageContact = 0.0;
		
		this.speed = 0.65;
		this.frame = 0;
		this.frame_row = 0;
		this.gravity = 0.0;
		this.friction = 0.08;
		this.pushable = false;
		
		this.on("struck", EnemyStruck);
		this.on("hurt", function(){
			audio.play("hurt",this.position);
		});
		this.on("collideObject", function(obj){
			if( obj instanceof Player && this.life > 0 ) {
				obj.hurt(this);
				this._retreat = 1.0;
			}
		});
		this.on("death", function(){
			
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			
			Item.drop(this);
			this.destroy();
		});
		
		this._retreat = 0.0;
	}
	update(){
		let dir = this.position.subtract(this.target().position);
		let frc = this.target().force;
		
		if( this.life > 0 && this.stun <= 0 ) {
			
			if(this._retreat <= 0){
				let moveDir = dir.normalize(-1);
				
				if(dir.y > 16 ) { moveDir.y -= 1.0; }
				if(dir.y < -16 ) { moveDir.y += 1.0; }
				
				this.force = moveDir.normalize( this.speed * frc.magnitude() );
				this.flip = this.force < 0;
			} else {
				this._retreat -= this.delta;
				this.force = dir.normalize( this.speed * 5.0 );
				this.flip = this.force < 0;
			}
		}
		
		//Animation
		this.frame = (this.frame + this.delta * 6.0 ) % 3;
	}
}

self["Laughing"] = Laughing;