class Ragdoll extends GameObject {
	constructor(x, y, d, o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		
		o = Options.convert(o);
		
		this.width = o.getInt("width", 24);
		this.height = o.getInt("width", 24);
		this.sprite = o.get("sprite", "pothead");
		this.zIndex = o.getInt("zIndex", 0);
		this.flip = o.getBool("flip", false);
		this.force = new Point();
		
		if(o.getBool("rigidbody", true)){
			this.addModule( mod_rigidbody );
		}
		this.addModule( mod_combat );
		
		this.lifeMax = this.life = 0;
		this.isDead();
		
		this.rotation = 0.0;
		this.rotationSpeed = o.getFloat("rotationSpeed", 30.0);
		this.force.x = o.getFloat("forceX", 0);
		this.force.y = o.getFloat("forceY", 0);
		this.frame.x = o.getInt("frameX", 0);
		this.frame.y = o.getInt("frameY", 0);
		this.frames = false;
		this.frameSpeed = o.getFloat("frameSpeed", 0.3);
		this.deathSound = o.get("deathSound", "kill");
		this.hurtSound = o.get("hurtSound", "hurt");
		this.gravity = o.getFloat("gravity", 1.0);
		this.friction = o.getFloat("friction", 0.1);
		this.deltaScale = o.getFloat("deltaScale", 1.0);
		
		this._frameprogress = 0.0;
		
		
		this.on("struck", EnemyStruck);
		
		this.on("hurt", function(){
			audio.play(this.hurtSound,this.position);
		});
		this.on("sleep", function(){
			this.destroy();
		});
		this.on("death", function(){
			audio.play(this.deathSound,this.position);
			this.destroy();
		});
	}
	update(){
		if(!this.hasModule(mod_rigidbody)){
			this.force = this.force.scale(1 - this.friction * this.delta);
			this.force.y += this.gravity * this.delta * UNITS_PER_METER;
			this.position = this.position.add(this.force.scale(this.delta * UNITS_PER_METER));
		}
	}
	render(g,c){
		if(this.frames instanceof Array){
			var f = Math.floor(this._frameprogress * this.frames.length);
			this.frame = this.frames[f];
		} else if(this.frames instanceof Sequence){
			this.frame = new this.frames.frame(this._frameprogress);
		}
		this._frameprogress = (this._frameprogress + this.frameSpeed * this.delta) % 1.0;
		
		this.rotation += Math.mod(this.delta * this.rotationSpeed, 360);
		
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, this.flip, {
			"rotate" : this.rotation
		});
	}
}