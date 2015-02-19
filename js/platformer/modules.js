var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.grounded = false;
		this.friction = 0.1;
		this.bounce = 0.0;
		this.collisionReduction = 0.0;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				this.grounded = true;
				if( this.force.y > 5.0 ) this.trigger("land");
			}
			this.force.y *= -this.bounce;
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) ) {
				var dir = this.position.subtract( obj.position ).normalize();
				var mass = Math.max( 1.0 - Math.max(this.mass - obj.mass, 0), 0);
				this.force.y += dir.y * this.friction * mass;
				this.force.x += dir.x * this.friction * mass;
			}
		});
	},
	'update' : function(){
		this.force.y += this.gravity * this.delta;
		//Max speed 
		this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
		this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
		
		if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
		if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
		
		this.grounded = false;
		game.i_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
		var friction_x = 1.0 - this.friction * this.delta;
		this.force.x *= friction_x;
	},
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.lock_overwrite = false;
		this._lock_current = false;
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
	},
	'update' : function(){		
		var screen = new Point(256,240);
		game.camera.x = this.position.x - (256 / 2);
		game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		
		//Set up locks
		if( this.lock_overwrite instanceof Line ) {
			if( this._lock_current instanceof Line ) {
				var transition = this.delta * 0.1;
				this._lock_current.start.x = Math.lerp( this._lock_current.start.x, this.lock_overwrite.start.x, transition );
				this._lock_current.start.y = Math.lerp( this._lock_current.start.y, this.lock_overwrite.start.y, transition );
				this._lock_current.end.x = Math.lerp( this._lock_current.end.x, this.lock_overwrite.end.x, transition );
				this._lock_current.end.y = Math.lerp( this._lock_current.end.y, this.lock_overwrite.end.y, transition );
			} else {
				this._lock_current = this.lock_overwrite;
			}
		} else {
			if( this.lock instanceof Line ) {
				this._lock_current = new Line(this.lock.start.x, this.lock.start.y, this.lock.end.x, this.lock.end.y);
			} else {
				this._lock_current = false;
			}
		}
		
		if( this._lock_current instanceof Line ) {
			game.camera.x = Math.min( Math.max( game.camera.x, this._lock_current.start.x ), this._lock_current.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this._lock_current.start.y ), this._lock_current.end.y - screen.y );
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.damage = 10;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = 10.0;
			
		this.strike = function(l,trigger){
			trigger = trigger == undefined ? "struck" : trigger;
			
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			offset.correct();
			this.ttest = offset;
			
			var hits = game.overlaps(offset);
			for( var i=0; i < hits.length; i++ ) {
				if( hits[i].interactive && hits[i] != this && hits[i].life != null ) {
					if( trigger == "hurt" ) {
						hits[i].hurt(this, this.damage);
					} else {
						hits[i].trigger(trigger, this, offset.center(), this.damage);
					}
				}
			}
		}
		
		this.hurt = function(obj, damage){
			if( this.invincible <= 0 ) {
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.ceil( this.damageReduction * damage ), 1 );
				
				this.life -= damage;
				var dir = this.position.subtract( obj.position ).normalize();
				this.force.x += dir.x * ( 3/Math.max(this.mass,0.3) );
				this.invincible = this.invincible_time;
				this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				if( this.life <= 0 ) this.trigger("death");
			}
		}
	},
	"update" : function(){
		if( this.invincible > 0 ) this.invert = !this.invert;
		else this.invert = false;
		
		this.invincible -= this.delta;
		this.stun -= this.delta;
	}
}

var mod_boss = {
	"init" : function(){
		this.active = false;
		var x = this.position.x;
		var y = this.position.y;
		
		var corner = new Point(256*Math.floor(x/256),240*Math.floor(y/240));
		this.borders = [
			new Line(corner.x,corner.y,corner.x+256,corner.y),
			new Line(corner.x+256,corner.y,corner.x+256,corner.y+240),
			new Line(corner.x+256,corner.y+240,corner.x,corner.y+240),
			new Line(corner.x,corner.y+240,corner.x,corner.y)
		];
		
		this.on("activate", function() {
			for(var i=0; i < this.borders.length; i++ ) game.addCollision( this.borders[i] );
			_player.lock_overwrite = new Line(this.borders[0].start,this.borders[1].end);
			this.interactive = true;
		});
		this.on("death", function() {
			for(var i=0; i < this.borders.length; i++ ) game.removeCollision( this.borders[i] );
			_player.lock_overwrite = false;
		});
	},
	"update" : function(){
		if( !this.active ) {
			this.interactive = false;
			var dir = this.position.subtract( _player.position );
			if( Math.abs( dir.x ) < 64 && Math.abs( dir.y ) < 64 ){
				this.active = true;
				this.trigger("activate");
			}
		}
	}
}