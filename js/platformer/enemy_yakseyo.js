Yakseyo.prototype = new GameObject();
Yakseyo.prototype.constructor = GameObject;
function Yakseyo(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 14;
	this.sprite = "yakseyo";
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"phase" : 0,
		"attack" : -1,
		"cooldown" : 0,
		"smoke_timer" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(10,this.difficulty);
	this.xpDrop = Spawn.xp(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	this.pushable = false;
	
	this.on("collideVertical", function(dir){
		if( dir < 0 ) {
			this.states.phase = 0;
			this.states.active = true;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj instanceof Player ) {
			if(this.states.phase == 2) {
				if( this.states.attack > 0 ) 
					obj.hurt( this, this.damage );
				else
					obj.hurt( this, this.collideDamage );
			}
			if( this.states.phase == 0 ) {
				this.states.phase = 1;
				this.states.cooldown = Game.DELTASECOND * .5;
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj){
		Item.drop(this,24);
		
		audio.play("kill",this.position);
		createExplosion(this.position, 40 );
		this.destroy();
	});
	SpecialEnemy(this);
	this.calculateXP();
}
Yakseyo.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.states.phase == 0 ) {
		//Find target
		var direction = dir.x > 0 ? -1 : 1;
		this.force.x += direction * this.speed * this.delta;
		this.states.smoke_timer -= this.delta;
		this.visible = false;
		if(this.states.smoke_timer <= 0 ){
			game.addObject(new EffectSmoke(this.position.x, this.position.y));
			this.states.smoke_timer = Game.DELTASECOND * 0.25;
		}
		this.height = 14;
	} else if ( this.states.phase == 1 ) {
		//Wait for attack
		if( this.states.cooldown <= 0 ) {
			this.states.attack = 4;
			this.states.cooldown = Game.DELTASECOND * 2;
			this.states.phase = 2;
		}
		this.visible = false;
		this.states.cooldown -= this.delta;
		this.height = 14;
	} else if ( this.states.phase == 2 ) {
		//Attack and wait
		if( this.states.cooldown <= 0 ) this.states.phase = 0;
		this.states.attack -= this.delta;
		this.states.cooldown -= this.delta;
		this.frame = this.states.attack > 0 ? 0 : 1;
		this.visible = true;
		this.height = 32;
	}
	
	Background.pushLight(this.position, 100, [1.0,0.8,0.5]);
}