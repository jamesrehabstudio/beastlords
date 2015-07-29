Baller.prototype = new GameObject();
Baller.prototype.constructor = GameObject;
function Baller(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 72;
	this.sprite = sprites.baller;
	
	this.ball = new BallerBall(x-48,y);
	game.addObject( this.ball );
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"swing" : 0.0,
		"release" : 0.0,
		"retrieve" : 0.0,
	};
	this.timers = {
		"swing" : Game.DELTASECOND * 3.0,
		"release" : Game.DELTASECOND * 1.5,
		"retrieve" : Game.DELTASECOND * 3.0,
	}
	
	this.death_time = Game.DELTASECOND * 3.0;
	this.life = dataManager.life(28);
	this.lifeMax = dataManager.life(28);
	this.damage = dataManager.life(5);
	this.mass = 4.0;
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("pre_death", function(){
		this.ball.destroy();
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Baller.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = dir.x > 0;
		
		if( this.ball.reflect ) {
			this.ball.gravity = 0;
			var balldir = this.ball.position.subtract( this.position );
			balldir = balldir.normalize();
			this.ball.force.x = -balldir.x * 4.0;
			this.ball.force.y = -balldir.y * 4.0;
		} else if( this.states.retrieve > 0 ) {
			this.states.retrieve -= this.delta;
			if( this.ball.position.x < this.position.x ) {
				this.ball.force.x += this.delta * 0.5;
				this.ball.flip = false;
			} else { 
				this.ball.force.x -= this.delta * 0.5;
				this.ball.flip = true;
			}
		} else if ( this.states.release > 0 ) {
			this.states.release -= this.delta;
			if( this.position.distance( this.ball.position ) > 200 ) {
				this.force.x *= -1.0;
				this.force.y *= -1.0;
			}
			if( this.states.release <= 0 ) {
				this.states.retrieve = this.timers.retrieve;
				this.ball.pushable = true;
				this.ball.damage = 0;
			}
		} else if ( this.states.swing > 0 ) { 
			this.states.swing -= this.delta;
			//Spin ball around head
			var ball_position = Math.sin( this.states.swing * 0.2 );
			var ball_height = Math.max( Math.min( 32-Math.abs(dir.x*0.4), 32), -32);
			this.ball.frame = 1 + Math.floor((1-Math.abs(ball_position))*3);
			this.ball.flip = ball_position < 0;
			this.ball.position.x = this.position.x + ball_position * 96;
			this.ball.position.y = this.position.y + ball_height;
			
			if( this.states.swing <= 0 ) {
				this.states.release = this.timers.release;
				//Fling the ball
				this.ball.frame = 0;
				this.ball.gravity = 0.5;
				this.ball.force.x = 10 * (dir.x > 0 ? -1.0 : 1.0);
				this.ball.force.y = -3;
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) {
				this.states.swing = this.timers.swing;
				//Stop ball from moving
				this.ball.pushable = false;
				this.ball.gravity = 0;
				this.ball.force.x = this.ball.force.y = 0;
				this.ball.damage = this.damage;
			}
		}
	}
	
	/* Animation */
	if( this.ball.reflect || this.stun > 0 ) {
		this.frame = 3;
		this.frame_row = 1;
	} else if( this.states.retrieve > 0 ) {
		this.frame = Math.max((this.frame + this.delta * 0.1) % 3, 1);
		this.frame_row = 1;
	} else if ( this.states.release > 0 ) {
		this.frame = 0;
		this.frame_row = 1;
	} else if ( this.states.swing > 0 ) { 
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 0;
	} else {
		this.frame = 1;
		this.frame_row = 1;
	}
}


BallerBall.prototype = new GameObject();
BallerBall.prototype.constructor = GameObject;
function BallerBall(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 48;
	this.sprite = sprites.baller;
	this.damage = 0;
	this.reflect = false;
	
	this.strikeBox = this.bounds().transpose(this.position.scale(-1.0));
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.friction = 0.04;
	this.on("hurt_other", function(obj, damage){
		if( obj instanceof Player && damage > 0 ) {
			obj.force.x += this.force.x;
			obj.hurt( this, this.damage );
		}
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Baller && this.reflect ) {
			this.reflect = false;
			this.gravity = 1.0;
			obj.force.x += this.force.x;
			obj.hurt( this, this.damage * 2.0 );
		}
	});
	this.on("struck", function(obj) {
		if( !this.reflect && Math.abs( this.force.x ) > 1 && this.damage > 0 ) {
			this.reflect = true;
			audio.play("critical");
			game.slow(0.1, Game.DELTASECOND * 0.5 );
		}
	});
	
	this.mass = 3.0;
	this.frame = 0
	this.frame_row = 2;
}
BallerBall.prototype.update = function(){
	if( this.damage > 0 ) {
		this.strike( this.strikeBox );
	}
}