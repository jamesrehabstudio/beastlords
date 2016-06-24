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
		"attackwait" : 0.0,
		"drilling" : 0,
		"smoke" : 0
	};
	
	this.drill = new Line(0,0,8,8);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
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
			if(this.states.attack > 0 ){
				this.states.attack -= this.delta;
			} else if (this.states.attackwait > 0){
				this.states.attackwait -= this.delta;
				if(this.drill.overlaps(_player.bounds())){
					_player.hurt(this, this.damage);
				}
			} else {
				this.states.drilling = 0;
			}
			if(this.grounded && this.states.smoke <= 0){
				this.smoke(new Line(this.position.x-6,this.position.y+10,this.position.x+8,this.position.y+15));
				this.smoke(new Line(this.drill.start.x,this.drill.end.y-4,this.drill.end.x,this.drill.end.y));
				this.states.smoke = Game.DELTASECOND * 0.1;
			}
			this.states.smoke -= this.delta;
		} else {
			//idle
			this.states.cooldown -= this.delta;
			
			if(_player.grounded){
				this.drill = new Line(
					_player.position.x - 0,
					_player.position.y - 0,
					_player.position.x + 16,
					_player.position.y + 16
				);
			}
			
			if(this.states.cooldown <= 0 ){
				this.states.drilling = 1;
				this.states.attack = Game.DELTASECOND * 2;
				this.states.attackwait = Game.DELTASECOND;
				this.states.cooldown = Game.DELTASECOND * 2;
				this.force.y = -9;
				this.grounded = false;
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
ChickenDrill.prototype.render = function(g,c){
	if(this.states.attack <= 0 && this.states.attackwait > 0 ){
		var drill = Math.floor(new Date()/100)%2;
		g.renderSprite(this.sprite,this.drill.start.add(new Point(2,0)).subtract(c),this.zIndex,new Point(3,1+drill));
	}
	GameObject.prototype.render.apply(this,[g,c]);
}