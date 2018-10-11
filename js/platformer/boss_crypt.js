class CryptKeeper extends GameObject {
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 56;
		this.sprite = "cryptkeeper";
		this.swrap = spriteWrap["cryptkeeper"];
		this.speed = 6.0;
		//this.active = false;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.difficulty = o.getInt("difficulty", Spawn.difficulty);
		
		this.life = Spawn.life(5,this.difficulty);
		this.lifeMax = this.life;
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(40,this.difficulty);
		this.damageContact = 0.0;
		this.mass = 1.8;
		this.pushable = false;
		
		this.on("struck", EnemyStruck);
		
		this.on("hurt", function(obj,damage){
			audio.play("hurt",this.position);
		});
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(this._hidden){
					this._cooldown = 0.0;
				}
			}
		});
		this.on("collideHorizontal", function(x){
			
		});
		
		this._transition = 0.0;
		this._attack = 0.0;
		this._chase = 0.0;
		this._hidden = true;
		this._cooldown = 3.0;
		this._anim = 0.0;
	}
	update(){
		if(this.life > 0){
			let dir = this.target().position.subtract(this.position);
			
			if(this._transition > 0){
				this._transition -= this.delta;
				let p = 1 - this._transition / CryptKeeper.TIME_TRANS;
				
				if(this._hidden){
					this.frame = this.swrap.frame("hide", p);
				} else {
					this.frame = this.swrap.frame("hide", 1-p);
				}
			} else if(this._attack > 0){
				this._attack -= this.delta;
				let p = 1 - this._attack / CryptKeeper.TIME_ATTACK;
				this.frame = this.swrap.frame("gas", p);
				
				if(Timer.isAt(this._attack, 0.3, this.delta )){
					this.strike( new Line(8,-16,32,16) );
				}
				
			} else if(this._chase > 0 ) {
				this._chase -= this.delta;
				this._anim = (this._anim + this.delta) % 1.0;
				this.frame = this.swrap.frame("attack", this._anim);
			} else if(this._hidden){
				//Track player and attack
				this.frame.x = 5; 
				this.frame.y = 0;
				
				this.flip = dir.x < 0;
				this.addHorizontalForce(this.speed * this.forward());
				this._cooldown -= this.delta;
				
				if(this._cooldown <= 0 && Math.abs(dir.x) < 64){
					this.unhide();
					this._attack = CryptKeeper.TIME_ATTACK;
				}
			} else {
				//Escape player
				this._anim = (this._anim + this.delta) % 1.0;
				this._cooldown -= this.delta;
				
				this.frame = this.swrap.frame("walk", this._anim);
				this.flip = dir.x > 0;
				this.addHorizontalForce(this.speed * 2.0 * this.forward());
				if(this._cooldown <= 0){
					this.hide();
				}
			}
		}
	}
	hide(){
		this._hidden = true;
		this._transition = CryptKeeper.TIME_TRANS;
		this._cooldown = 2.0;
	}
	unhide(){
		this._hidden = false;
		this._transition = CryptKeeper.TIME_TRANS;
		this._cooldown = CryptKeeper.TIME_ESCAPE;
	}
}
CryptKeeper.TIME_TRANS = 0.7;
CryptKeeper.TIME_ATTACK = 1.7;
CryptKeeper.TIME_CHASE = 3.0;
CryptKeeper.TIME_ESCAPE = 2.0;

self["CryptKeeper"] = CryptKeeper;