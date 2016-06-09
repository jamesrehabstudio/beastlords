ChickenChain.prototype = new GameObject();
ChickenChain.prototype.constructor = GameObject;
function ChickenChain(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "chickenchain";
	this.speed = 0.125;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"direction" : 1.0,
		"attackstage" : 0,
		"duck" : 0
	};
	this.attacks = {
		"cooldown" : Game.DELTASECOND * 3,
		"distance" : 200,
		"speed" : 5.0,
		"rest" : 0
	}
	this.ball = new Point(0,0);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.life(3,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.attackstage = 0;
		this.states.cooldown = this.attacks.cooldown;
	});
	
	this.on("struckTarget", function(obj){
		if(obj instanceof Player && this.attacks.rest <= 0){
			this.attacks.rest = Game.DELTASECOND * 0.3333;
			console.log("struckTarget");
		}
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
ChickenChain.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.attacks.rest = Math.max(this.attacks.rest-this.delta, 0);
		
		if( this.states.attackstage ) {
			this.force.x = this.force.y = 0;
			if(this.states.attackstage == 1){
				//Chain flies forward
				this.states.attack += this.attacks.speed * this.delta;
				if(this.states.attack >= this.attacks.distance){
					this.states.attackstage = 2;
					this.states.duck = Math.round(Math.random());
				}
			} else{
				//Chain return
				this.states.attack -= this.attacks.speed * this.delta;
				if(this.states.attack <= 0){
					this.states.attackstage = 0;
					this.states.duck = 0;
				}
			}
			this.ball = new Point(this.states.attack, (-4 + this.states.duck*16));
			if(this.attacks.rest <= 0){
				this.strike(new Line(this.ball,this.ball.add(new Point(4,4))));
			}
		} else {
			if( game.getTile( 
				16 * this.states.direction + this.position.x, 
				this.position.y + 28, game.tileCollideLayer) == 0 
			){
				//Turn around, don't fall off the edge
				this.force.x = 0;
				this.states.direction *= -1.0;
			}
			
			if( Math.abs( dir.x ) > 24 ) {
				this.force.x += this.speed * this.delta * this.states.direction;
			}
			this.states.cooldown -= this.delta;
			this.flip = this.states.direction < 0;
			
			if( this.states.cooldown <= 0 && Math.abs( dir.x ) < this.attacks.distance ) {
				this.states.duck = Math.round(Math.random());
				this.states.attackstage = 1;
				this.states.cooldown = this.attacks.cooldown;
				this.flip = dir.x > 0;
				this.states.direction = this.flip ? -1.0 : 1.0;
				
			}
		}
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame = 2;
		this.frame_row = 1;
	} else if( this.states.attackstage > 0 ) {
		if( this.states.duck ) {
			this.frame = 1;
			this.frame_row = 1;
		} else {
			this.frame = 0;
			this.frame_row = 1;
		}
	} else {
		this.frame_row = 0;
		this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 3;
	}
}
ChickenChain.prototype.render = function(g,c){
	if(this.states.attackstage){
		var b = new Point(
			this.ball.x * this.states.direction,
			this.ball.y
		);
		var links = Math.ceil(this.states.attack / 9);
		for(var i=0; i < links; i++){
			var b2 = b.add(new Point(i*-9*this.states.direction,0));
			g.renderSprite(this.sprite,b2.add(this.position).subtract(c),this.zIndex,new Point(0,2));
		}
		g.renderSprite(this.sprite,b.add(this.position).subtract(c),this.zIndex,new Point(1,2));
	}
	GameObject.prototype.render.apply(this,[g,c]);
}