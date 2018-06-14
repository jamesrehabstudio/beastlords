HammerMan.prototype = new GameObject();
HammerMan.prototype.constructor = GameObject;
function HammerMan(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "hammerman";
	this.speed = 10;
	this.jump = 8;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.collisionReduction = -1.0;
	this.gravity = 0.7;
	this.friction = 0.05;
	this.states = {
		"cooldown" : 50.0,
		"inair" : false,
		"jumps" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.attackTime = 0;
	this.attackTimeTotal = Game.DELTASECOND * 4.0;
	
	this.life = Spawn.life(2,this.difficulty);
	this.lifeMax = Spawn.life(2,this.difficulty);
	this.splashDamage = Spawn.damage(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.2;
	
	this.on("struck", EnemyStruck);
	
	this.on(["wakeup","added"], function(){
		let dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
HammerMan.prototype.update = function(){
	if(this.life > 0 && !this.stun <= 0){
		this.attackTime = (this.attackTime + this.delta) % this.attackTimeTotal;
		this.frame = HammerMan.anim_attack.frame(this.attackTime/this.attackTimeTotal);
		if(Timer.isAt(this.attackTime, this.attackTimeTotal*0.45, this.delta)){
			this.strike(new Line(0,-24,42,-4));
		}
	} else {
		this.frame.x = 2;
		this.frame.y = 0;
		this.attackTime = 0;
	}
}
HammerMan.anim_attack = new Sequence([
	[0,0,1.5],
	[0,1,0.3],
	[0,2,0.1],
	[0,3,0.1],
	
	[1,0,1.5],
	[1,1,0.2],
	[1,2,0.2],
	[1,3,0.2],
]);