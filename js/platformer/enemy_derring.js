class Derring extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.sprite = "derring";
		
		this.addModule(mod_block);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.flip = ops.getBool("flip", false);
		
		this.damgeFire = Spawn.damage(3, this.difficulty);
		
		this._attack = 0.0;
	}
	update(){
		let p = Math.clamp01( this._attack - 3.0 );
		this.frame.x = (p*4) % 2;
		this.frame.y = (p*2);
		
		this._attack = (this._attack + this.delta) % Derring.TIME_ATTACK;
		
		if( Timer.isAt(this._attack, Derring.TIME_ATTACK * 0.9, this.delta) ){
			this.fire();
		}
	}
	fire(){
		let fb = Bullet.createFireball(this.position.x + this.forward() * 24, this.position.y);
		fb.damgeFire = this.damgeFire;
		fb.force.x = this.forward() * 7.0;
		game.addObject(fb);
	}
}
Derring.TIME_ATTACK = 4;
self["Derring"] = Derring;