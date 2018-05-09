Ragdoll.prototype = new GameObject();
Ragdoll.prototype.constructor = GameObject;
function Ragdoll(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "pothead";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.lifeMax = this.life = 0;
	this.isDead();
	
	this.rotation = 0.0;
	this.rotationSpeed = 30.0;
	this.frame.x = 0;
	this.frame.y = 0;
	this.frames = false;
	this.frameSpeed = 0.3;
	this.deathSound = "kill";
	this.hurtSound = "hurt";
	
	this._frameprogress = 0.0;
	
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play(this.hurtSound,this.position);
	});
	
	this.on("death", function(){
		audio.play(this.deathSound,this.position);
		this.destroy();
	});
}
Ragdoll.prototype.render = function(g,c){
	if(this.frames instanceof Array){
		var f = Math.floor(this._frameprogress * this.frames.length);
		this.frame = this.frames[f];
	} else if(this.frames instanceof Sequence){
		this.frame = new this.frames.frame(this._frameprogress);
	}
	this._frameprogress = (this._frameprogress + this.frameSpeed * this.delta) % 1.0;
	
	this.rotation += Math.mod(this.delta * this.rotationSpeed, 360);
	
	g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, false, {
		"rotate" : this.rotation
	});
}