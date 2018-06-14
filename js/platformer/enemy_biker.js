Biker.prototype = new GameObject();
Biker.prototype.constructor = GameObject;
function Biker(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.startPosition = new Point(x,y);
	this.width = 52;
	this.height = 56;
	this.previousForceX = 0.0;
	this.start_x = x;
	
	this.speed = 0.13;
	this.sprite = "biker";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
		this.states.runaway = Game.DELTASECOND * 0.5;
	});
	this.on("collideObject", function(obj){
		if( this.states.collideCooldown > 0 || this.team == obj.team ){
			return;
		} 
		if( obj instanceof Player && obj.hurt instanceof Function ) {
			var dir = _player.position.subtract(this.position);
			if((this.force.x > 0.25 && dir.x > 0) || (this.force.x < -0.25 && dir.x < 0)){
				this.states.collideCooldown = Game.DELTASECOND;
				this.states.runaway = Game.DELTASECOND * 1.0;
				obj.hurt( this, this.collideDamage );
			}
		}
	});
	this.on("pre_death", function(obj,pos,damage){
		var body = new BikerBody(this.position.x, this.position.y);
		body.force.x = this.force.x * 2;
		body.force.y = -6;
		body.grounded = false;
		game.addObject( body );
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	this.on("player_death", function(){
		this.life = this.lifeMax;
		this.position.x = this.startPosition.x;
		this.position.y = this.startPosition.y;
		this.active = false;
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(8,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(25,this.difficulty);
	this.mass = 5.3;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	this.active = false;
	
	this.states = {
		"collideCooldown" : 0.0,
		"runaway" : 0.0
	};
	
	this.calculateXP();
	
}
Biker.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.previousForceX = this.force.x;
	
	if( this.life > 0 ) {
		if(this.active){
			this.flip = this.force.x < 0;
			var direction = 0;
			
			if( Math.abs(this.force.x) < 2 && Math.abs(dir.x) < 24){
				this.states.runaway = Game.DELTASECOND * 2;
			}
			
			if(this.states.runaway > 0){
				direction = this.force.x > 0 ? 1 : -1;
			} else {
				direction = dir.x < 0 ? 1 : -1;
			}
			this.force.x += this.speed * this.delta * direction;
			this.states.collideCooldown -= this.delta;
			this.states.runaway -= this.delta;
		} else {
			this.active = game.insideScreen(this.position, 32);
		}
	} else {
		this.force.x = 0;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame.x = 0;
		this.frame.y = 1;
	} else {
		if( Math.abs( this.force.x ) > 2 ) {
			if(Math.abs(this.previousForceX) > Math.abs(this.force.x)){
				this.frame.y = 0;
				this.frame.x = 1;
			} else {
				this.frame.y = 0;
				this.frame.x = 0;
			}
		} else {
			this.frame.y = 0;
			this.frame.x = 2;
		}
		var lightoffset = Math.min(Math.abs( this.force.x ),2) * 16;
		Background.pushLight(this.position.add(new Point(this.forward()*lightoffset,0)), 200);
	}
}
Biker.prototype.idle = function(){}

BikerBody.prototype = new GameObject();
BikerBody.prototype.constructor = GameObject;
function BikerBody(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 56;
	this.sprite = "biker";
	
	this.addModule( mod_rigidbody );
	this.interactive = false;
	this.friction = 0.05;
}

BikerBody.prototype.update = function(){
	if(this.grounded){
		this.frame.x = 2;
		this.frame.y = 1;
	} else {
		this.frame.x = 1;
		this.frame.y = 1;
	}
}