ChickenDrill.prototype = new GameObject();
ChickenDrill.prototype.constructor = GameObject;
function ChickenDrill(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 30;
	this.sprite = "chickendrill";
	this.speed = 0.125;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"drilling" : 0,
		"spike" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.5;
	this.death_time = Game.DELTASECOND * 0.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
ChickenDrill.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.drilling){
			this.states.attack -= this.delta;
			
			if(this.states.attack <= 0 ){
				this.states.drilling = 0;
			} else if(this.grounded){
				if (Timer.interval(this.states.attack,Game.DELTASECOND*0.2,this.delta)){
					var spikes = new ChickenDrillSpike(
						this.position.x + this.states.spike * 40 * (this.flip?-1:1), 
						this.position.y + 8
					);
					spikes.damage = this.damage;
					game.addObject(spikes);
					this.states.spike++;
				}
			}
		} else {
			//idle
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0 ){
				this.states.drilling = 1;
				this.states.attack = Game.DELTASECOND * 2.0;
				this.states.cooldown = Game.DELTASECOND * 2;
				this.states.spike = 1;
				this.force.y = -9;
				this.grounded = false;
				this.flip = dir.x > 0;
			}
		}
	}
	
	/* Animation */
	if( this.grounded ) {
		if(this.states.drilling){
			this.frame.x = (this.frame.x + this.delta * 0.8) % 3;
			this.frame.y = 2;
		} else {
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
		}
	} else {
		this.frame.y = 1;
		if(this.force.y > 0 ) {
			this.frame.x = 2;
		} else {
			this.frame.x = 1;
		}
	}
}
ChickenDrill.prototype.smoke = function(spos){
	var x = Math.lerp(spos.start.x, spos.end.x, Math.random());
	var y = Math.lerp(spos.start.y, spos.end.y, Math.random());
	
	game.addObject( new EffectSmoke(
		x, y, null,
		{
			"frame":1, 
			"speed":0.4 + Math.random() * 0.2,
			"time":Game.DELTASECOND * (0.3 + 0.4 * Math.random())
		}
	));
}

ChickenDrillSpike.prototype = new GameObject();
ChickenDrillSpike.prototype.constructor = GameObject;
function ChickenDrillSpike(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 8;
	this.sprite = "chickendrill";
	this.damage = 1;
	this.frame = new Point(0,3);
	this.time = Game.DELTASECOND * 2.0;
	
	this.on("sleep", function(obj){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(this.frame.x >= 1 && obj instanceof Player){
			var prelife = obj.life;
			obj.hurt(this,this.damage);
			if(obj.life != prelife){
				this.destroy();
			}
		}
	});
}
ChickenDrillSpike.prototype.update = function(){
	this.time -= this.delta;
	
	if(this.time <= 0){
		this.frame.x = Math.min(this.frame.x - this.delta * 0.5, 2);
		if(this.frame.x < 0){
			this.destroy();
		}
	} else {
		this.frame.x = Math.min(this.frame.x + this.delta * 0.5, 2);
	}
}