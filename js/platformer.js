Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;

function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.damage = 5;
	this.items = [];
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0
	}
	
	this.attack_time = 8.5;
	this.attack_withdraw = 5.0;
	
	this.on("death", function(){
		this.destroy();
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		//game.slow(0,1.0);
		var dir = this.position.subtract(pos);
		if( this.states.guard && ((this.states.duck && dir.y < 0) || (!this.states.duck && dir.y > 0)) ){
			//blocked
			var kb = damage / 15.0;
			obj.force.x += dir.x > 0 ? -3 : 3;
			this.force.x += dir.x < 0 ? -kb : kb;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	this.team = 1;
	this.mass = 1;
	//this.addModule( mod_tracker );
}

Player.prototype.update = function(){
	var speed = 1.25;
	var force = new Point();
	
	if( this.life > 0 && this.states.attack <= 0 && this.hurt <= 0) {
		if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand(); this.setFlip(-1);}
		if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); this.setFlip(1); }
		if ( input.state('jump') == 1 && this.grounded ) { this.force.y -= 8; this.grounded = false; this.jump_boost = true; this.stand(); }
		if ( input.state('fire') == 1 ) { this.attack(); }
		
		if ( input.state('down') > 0 && this.grounded ) { this.duck(); } else { this.stand(); }
		if ( input.state('up') == 1 ) { this.stand(); }
	}
	
	//Apply jump boost
	if ( input.state('jump') > 0 && !this.grounded && this.jump_boost ) { 
		this.force.y -= this.gravity * 0.3 * this.delta; 
	} else {
		this.jump_boost = false;
	}
	
	this.friction = this.grounded ? 0.2 : 0.05;
	this.inertia = this.grounded ? 0.9 : 0.2;
	this.height = this.states.duck ? 24 : 30;
	this.states.guard = this.states.attack <= 0;
	
	if ( this.life < 1 ) {
		game.removeObject( this );
	}
	
	if ( this.states.attack > this.attack_withdraw ){
		this.strike(new Line(
			new Point( 12, (this.states.duck ? 4 : -4) ),
			new Point( 20, (this.states.duck ? 4 : -4)-4 )
		) );
	}
	
	//Animation
	if ( this.hurt > 0 ) {
		this.stand();
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 3;
	} else if( this.states.duck ) {
		this.frame = 0;
		this.frame_row = 1;
		if( this.states.attack > 0 ) this.frame = (this.states.attack > this.attack_withdraw ? 1 : 2);
	} else {
		this.frame_row = 0;
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
		}
		if( this.states.attack > 0 ) {
			this.frame = (this.states.attack > this.attack_withdraw ? 0 : 1);
			this.frame_row = 2;
		}
	}
	
	//Timers
	this.states.attack -= this.delta;
}
Player.prototype.stand = function(){
	if( this.states.duck ) {
		this.position.y -= 4;
		this.states.duck = false;
	}
}
Player.prototype.duck = function(){
	if( !this.states.duck ) {
		this.position.y += 4;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attack_time;
		if( this.grounded ) {
			this.force.x = 0;
		}
	}
}
Player.prototype.setFlip = function(x){
	this.flip = x < 0;
}

Player.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.states.attack > this.attack_withdraw ){
		//Draw sword
		this.sprite.render(
			g,
			new Point( this.position.x + (this.flip ? -24 : 24 ) - c.x, this.position.y - c.y ),
			3, 
			(this.states.duck ? 1 : 2 ),
			this.flip
		);
	}
	
	/* Render HP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.fillRect(7,7,(100/4)+2,10);
	g.fillStyle = "#000";
	g.fillRect(8,8,100/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.fillRect(8,8,this.life/4,8);
	g.closePath();
	
	for(var i=0; i < this.items.length; i++) {
		this.items[i].sprite.render(g, new Point(48+i*16, 12), this.items[i].frame, this.items[i].frame_row, false );
	}
	
	//if( this.ttest instanceof Line) this.ttest.renderRect( g, c );
}



Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.knight;
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_down" : false,
		"guard" : 2 //0 none, 1 bottom, 2 top
	}
	
	this.attack_warm = 30.0;
	this.attack_time = 3.0;
	
	this.life = 40;
	this.damage = 15;
	this.mass = 1.5;
	this.inviciple_time = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, 5 );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		//game.slow(0,1.0);
		var dir = this.position.subtract(pos);
		if( (this.states.guard == 1 && dir.y < 0) || (this.states.guard == 2 && dir.y > 0) ){
			//blocked
			obj.force.x += dir.x > 0 ? -3 : 3;
			this.force.x += dir.x < 0 ? -1 : 1;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = 40.0;
		this.states.guard = ~~(1 + Math.random() * 2);
	});
	this.on("death", function(){
		this.destroy();
	});
}
Knight.prototype.update = function(){	
	this.sprite = sprites.knight;
	if ( this.hurt <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	}
	if( this.states.cooldown < 0 ){
		this.states.attack_down = Math.random() > 0.5;
		this.states.guard = ~~(1 + Math.random() * 2);
		this.states.attack = this.attack_warm;
		this.states.cooldown = 70.0;
	}
	
	if ( this.states.attack > 0 && this.states.attack < this.attack_time ){
		this.strike(new Line(
			new Point( 12, (this.states.attack_down ? 4 : -4) ),
			new Point( 20, (this.states.attack_down ? 4 : -4)-4 )
		) );
	}
	
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.hurt > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 3;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = (this.states.guard == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame_row = (this.states.attack_down ? 2 : 1);
		} else {
			this.frame = (this.states.guard == 1 ? 1 : 0);
			this.frame_row = 0;
		}
	}
	
}

Skeleton.prototype = new GameObject();
Skeleton.prototype.constructor = GameObject;
function Skeleton(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.skele;
	this.speed = .3;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = 40;
	this.mass = 0.8;
	this.damage = 15;
	this.inviciple_tile = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, 5 );
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		if( (this.states.block_down && dir.y < 0) || (!this.states.block_down && dir.y > 0) ){
			//blocked
			obj.force.x += dir.x > 0 ? -3 : 3;
			this.force.x += dir.x < 0 ? -1 : 1;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = 30.0;
		//this.states.block_down = Math.random() > 0.5;
	});
	this.on("death", function(){
		game.objects.remove( game.objects.indexOf(this) );
	});
}
Skeleton.prototype.update = function(){	
	this.sprite = sprites.skele;
	if ( this.hurt <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -8.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attack_warm;
			this.states.cooldown = 50.0;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time ){
			this.strike(new Line(
				new Point( 12, -8 ),
				new Point( 20, -12 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.hurt > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_time ? 2 : (this.states.attack < this.attack_time*1.5 ? 1 : 0);
			this.frame_row = 1
		} else if( !this.grounded ) {
			this.frame = 3;
			this.frame_row = 1;
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4, 1 );
			}
		}
	}
}

Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = sprites.megaknight;
	this.speed = .1;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0,
		"walk_back" : false
	}
	
	this.attack_times = {
		"warm" : 60.0,
		"swing" : 50.0,
		"damage" : 45.0,
		"rest" : 40
	};
	
	this.life = 80;
	this.mass = 2.0;
	this.damage = 25;
	this.inviciple_tile = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, 5 );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		if( dir.y < 22.0 ){
			//blocked
			obj.force.x += dir.x > 0 ? -3 : 3;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = 10.0;
	});
	this.on("death", function(){
		game.objects.remove( game.objects.indexOf(this) );
	});
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.hurt <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.walk_back ? -1.0 : 1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( Math.abs( dir.x ) < 32 ) this.states.walk_back = true;
				if( Math.abs( dir.x ) > 96 ) this.states.walk_back = false;
				if( this.states.cooldown < 50 ) this.states.walk_back = false;
				
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attack_times.warm;
			this.states.cooldown = this.attack_times.warm * 2;
		}
		
		if ( this.states.attack > this.attack_times.rest && this.states.attack < this.attack_times.damage ){
			this.strike(new Line(
				new Point( 0, 0 ),
				new Point( 32, 32 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.hurt > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack < this.attack_times.damage ? 2 : (this.states.attack < this.attack_times.swing ? 1 : 0);
			this.frame_row = 1
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = ( this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 3;
			}
		}
	}
}

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	
	this.speed = 3.0;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( input.state("up") > 0 ) 
				this.force.y = -this.speed;
			if( input.state("down") > 0 )
				this.force.y = this.speed;
				
			obj.position.y = this.position.y;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
		}
	});
	
	this.mass = 0;
	this.gravity = 0.0;
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 192 + (Math.floor( _player.position.y / 240 ) * 240);
	//Move to find player
	if( Math.abs( dir.x ) > 64 ){
		if( Math.abs( this.position.y - goto_y ) > 16 ) {
			if( this.position.y > goto_y ) 
				this.force.y = -this.speed;
			else 
				this.force.y = this.speed;
		}
	}
}
Lift.prototype.render = function(g,c){
	g.fillStyle = "#FA0";
	//g.beginPath();
	g.fillRect(
		this.position.x - (this.width * .5 + c.x),
		this.position.y - (this.height * .5 + c.y),
		this.width, this.height
	);
	//g.closePath();
	
}

DeathTrigger.prototype = new GameObject();
DeathTrigger.prototype.constructor = GameObject;
function DeathTrigger(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 16;
	
	this.on("collideObject", function(obj){
		if( obj.hasModule(mod_combat) ) {
			obj.invincible = -999;
			obj.trigger("hurt", this, 9999 );
		}
	});
}

Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			if( this.name == "life" ) {
				obj.life = 100;
				this.destroy();
			} else {
				//collectable
				if( obj.items.indexOf( this ) < 0 ) {
					obj.items.push( this );
					this.destroy();
				}
			}
		}
	});
}
Item.prototype.update = function(){
	if( this.name == "life" ) {
		this.frame = 0;
		this.frame_row = 1;
	} else {
		this.frame = this.name.match(/\d+/) - 0;
		this.frame_row = 0;
	}
}

Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			var dir = this.position.subtract(obj.position);
			for( var i=0; i < obj.items.length; i++ ) {
				if( this.name == obj.items[i].name ) {
					this.destroy();
					return;
				}
			}
			obj.position.x = this.position.x + (dir.x < 0 ? 32 : -32);
		}
	});
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 8;
	this.frame_row = Math.floor( r / 8 );
}


/* Modules */
var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.grounded = false;
		this.friction = 0.1;
		
		this.on("collideHorizontal", function(dir){
			this.force.x = 0;
		});
		this.on("collideVertical", function(dir){
			this.force.y = 0;
			if( dir > 0 ) this.grounded = true;
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) ) {
				var dir = this.position.subtract( obj.position ).normalize();
				var mass = 1.0 - Math.max(this.mass - obj.mass, 0)
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
		
		this.grounded = false;
		game.i_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
		var friction_x = 1.0 - this.friction * this.delta;
		this.force.x *= friction_x;
	},
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
	},
	'update' : function(){		
		var screen = new Point(256,240);
		game.camera.x = this.position.x - (256 / 2);
		game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		if( this.lock instanceof Line ) {
			game.camera.x = Math.min( Math.max( game.camera.x, this.lock.start.x ), this.lock.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this.lock.start.y ), this.lock.end.y - screen.y );
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.team = 1;
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 20.0;
		this.damage = 10;
		this.team = 0;
		this.hurt = 0;
		this.hurt_time = 10.0;
		
		this.on("hurt", function(obj, damage){
			if( this.invincible <= 0 ) {
				if( damage != undefined ) this.life -= damage;
				var dir = this.position.subtract( obj.position ).normalize();
				this.force.x += dir.x * 3;
				this.invincible = this.invincible_time;
				this.hurt = this.hurt_time;
				if( this.life <= 0 ) this.trigger("death");
			}
		});
		
		this.strike = function(l){
		/*
			var offset = new Point(this.flip ? -12 : 12, this.states.attack_down ? 8 : -8 );
			var range = this.flip ? -8 : 8;
			var hits = game.overlaps( 
				new Point( this.position.x + offset.x, this.position.y + offset.y ),
				new Point( this.position.x + offset.x + range, this.position.y + offset.y + 4 )
			);
		*/
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			this.ttest = offset;
			
			var hits = game.overlaps(offset);
			for( var i=0; i < hits.length; i++ ) {
				if( hits[i] != this && hits[i].life != null ) {
					hits[i].trigger("struck", this, offset.center(), this.damage);
				}
			}
		}
	},
	"update" : function(){
		this.invincible -= this.delta;
		this.hurt -= this.delta;
	}
}