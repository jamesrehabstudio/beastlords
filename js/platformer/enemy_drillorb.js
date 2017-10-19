DrillOrb.prototype = new GameObject();
DrillOrb.prototype.constructor = GameObject;
function DrillOrb(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.sprite = "drillorb";
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.baseDamage());
		}
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = this.lifeMax = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
}
DrillOrb.prototype.update = function(){
	if(this.life > 0){
		this.frame.x = (game.time * 0.2) % 4;
		this.frame.y = 0;
	}
}