Boarbow.prototype = new GameObject();
Boarbow.prototype.constructor = GameObject;
function Boarbow(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "boarbow";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.time_cooldown = Game.DELTASECOND * 1.0;
	this.time_attack = Game.DELTASECOND * 2.0;
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0
	};
	
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.mass = 1.2;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
	this.on("collideObject", function(obj){
	});
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Boarbow.prototype.update = function(){	
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.stun <= 0 ){
			if(this.states.attack > 0){
				var progress = 1 - (this.states.attack / this.time_attack);
				this.frame = Boarbow.anim_attack.frame(progress);
				this.states.attack -= this.delta;
				
				if(Timer.isAt(this.states.attack, this.time_attack*0.22, this.delta)){
					var bolt = new Bullet(this.position.x, this.position.y-6);
					bolt.team = this.team;
					bolt.force.x = this.forward() * 10;
					bolt.flip = this.flip;
					bolt.sprite = this.sprite;
					bolt.frame.x = 2;
					bolt.frame.y = 2;
					bolt.damage = this.damage;
					bolt.setDeflect();
					game.addObject(bolt);
				}
			} else {
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				if(this.states.cooldown <= 0){
					this.states.attack = this.time_attack;
					this.states.cooldown = this.time_cooldown;
				}
			}
		} else {
			//Stunned
			this.frame.x = 2;
			this.frame.y = 0;
			this.states.attack = 0.0;
		}
		
	} else {
		this.frame.x = 2;
		this.frame.y = 1;
	}
}

Boarbow.anim_attack = new Sequence([
	[0,1,0.1],
	[0,2,0.1],
	[0,3,0.3],
	[1,0,0.1],
	[1,1,0.5],
	[1,2,0.2],
	[1,3,0.1]
]);
	