Spikebug.prototype = new GameObject();
Spikebug.prototype.constructor = GameObject;
function Spikebug(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 16;
	this.sprite = "spikebug";
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.mass = 0.7;
	
	this.on(["added","wakeup"], function(obj){
		var dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	});
	this.on("collideObject", function(obj){
		if(this.life > 0){
			if(obj instanceof Player){
				if(!obj.grounded){
					obj.hurt(this,this.getDamage());
				} else {
					this.flip = !this.flip;
				}
			}
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.flip = !this.flip;
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
	
	SpecialEnemy(this);
	this.calculateXP();
}
Spikebug.prototype.update = function(){
	if ( this.life > 0 ) {
		if(this.grounded){
			if(this.atLedge()){
				this.flip = !this.flip;
			}
			this.force.x += this.forward() * this.delta * this.speed;
		}
	} else{
		//Stun or dead
		this.frame.x = 2;
		this.frame.y = 1;
	} 
}