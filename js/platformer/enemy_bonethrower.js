class BoneThrower extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 30;
		
		this.sprite = "bonethrower";
		this.swrap = spriteWrap["bonethrower"];;
		this.speed = 5.0;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.life = Spawn.life(3, this.difficulty);
		this.damage = Spawn.damage(4, this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		this.death_time = 0.6;
		this.combat_knockback_speed = 0.0;
		
		this.defenceLight = Spawn.defence(2,this.difficulty);
		this.defenceSlime = Spawn.defence(2,this.difficulty);
		
		this.on("hurt", function(){
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
		this.on("collideHorizontal", function(){
			this.force.x = 0.0;
			this.flip = !this.flip;
		});
		
		this._anim = 0.0;
		this._attack = 0.0;
		this._cooldown = 0.0;
	}
	update(){
		if(this.life > 0){
			if(this._attack > 0){
				let p = 1 - this._attack / BoneThrower.TIME_ATTACK;
				this._attack -= this.delta;
				
				if(Timer.isAt(this._attack, BoneThrower.TIME_ATTACK * 0.45, this.delta )){
					this.throwAxe();
				}
				
				this.frame = this.swrap.frame("throw", p);
			} else {
				this.frame = this.swrap.frame("walk", this._anim);
				
				if(this._anim < 0.5){
					this.addHorizontalForce(this.speed * this.forward());
				}
				
				this._anim = ( this._anim + this.delta * 1.2 ) % 1.0;
				this._cooldown -= this.delta;
				
				if( this.atLedge() ){
					this.force.x = 0.0;
					this.flip = !this.flip;
				}
				
				if(this._cooldown <= 0){
					this._cooldown = BoneThrower.TIME_COOLDOWN;
					this._attack = BoneThrower.TIME_ATTACK;
					this.flip = this.target().position.x < this.position.x;
				}
			}
		} else {
			this.frame.x = 1;
			this.frame.y = 3;
		}
	}
	throwAxe(){
		let targetPos = this.target().position.subtract(this.position);
		let axe = new PhantomBullet(this.position.x, this.position.y, [24,24]);
		axe.gravity = 0.6;
		axe.friction.x = 0.05;
		axe.force.x = targetPos.x * 0.0625;
		axe.force.y = -10;
		axe.sprite = this.sprite;
		axe.frame = new Point(2, 3);
		axe.damage = this.damage;
		axe.deltaScale = 0.7;
		axe.postrender = GameObject.prototype.render;
		axe.idle = function(){ if(this.position.y > game.camera.y + 120) { GameObject.prototype.idle.apply(this); } }
		
		game.addObject( axe );
	}
}
BoneThrower.TIME_ATTACK = 1.25;
BoneThrower.TIME_COOLDOWN = 2.0;

self["BoneThrower"] = BoneThrower;