

 /* platformer/boss_chort.js*/ 

Chort.prototype = new GameObject();
Chort.prototype.constructor = GameObject;
function Chort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = sprites.pigboss;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	this.collideDamage = 5;
	this.damage = 10;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.life = 80;
	this.mass = 6.0;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"jump_phase" : 0,
		"land_wait" : 0.0,
		"recover" : 0.0,
		"backup" : false
	}
	
	this.attack_times = {
		"warm" : 24,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideVertical", function(y){
		if( y > 0 && this.states.jump_phase == 2) {
			this.force.x = 0;
			this.states.recover = Game.DELTASECOND * 2;
		} 
		if ( y < 0 && this.states.jump_phase == 1) {
			this.force.x = 0;
			this.states.jump_phase = 2;
			this.states.land_wait = Game.DELTASECOND;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(35);
		//for(var i=0; i < this.borders.length; i++ ) game.removeCollision( this.borders[i] );
		//_player.lock = false;
		//game.objects.remove( game.objects.indexOf(this) );
		Item.drop(this,9);
		Item.drop(this,9);
		Item.drop(this,9);
		audio.play("kill");
		this.destroy();
	});
}
Chort.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.states.recover <= 0 && this.active ) {
		if ( this.states.cooldown <= 0 ){
			//In air attack
			this.friction = 0.04;
			
			if( this.states.land_wait <= 0 && this.states.jump_phase == 2){
				this.gravity = 1.0;
				this.collideDamage = 15;
			} 
			if( this.states.jump_phase == 1 ){
				//Aim for player
				var direction = dir.x > 0 ? -1 : 1;
				this.force.x += direction * this.speed * 6.0 * this.delta;
			}
			this.states.land_wait -= this.delta;
		} else {
			//Ground actions
			if( this.states.attack <= 0 ) {
				if( this.states.backup && this.position.x - this.start_x > 64) this.states.backup = false;
				if( !this.states.backup && this.position.x - this.start_x < -64) this.states.backup = true;
				
				this.friction = 0.1;
				var direction = this.states.backup ? 1 : -1;
				this.force.x += direction * this.speed * this.delta;
				
				if( Math.abs(dir.x) < 48 && this.states.attack < -10 ) this.states.attack = this.attack_times.warm;
				
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				if( this.states.cooldown <= 0 ) {
					this.gravity = -0.3;
					this.force.y = -2;
					this.states.jump_phase = 1;
				}
			} else {
				this.force.x = 0;
				if( this.states.attack <= this.attack_times.release && this.states.attack > this.attack_times.cool ) {
					this.strike( new Line(12,-6,32,10), "hurt" );
				}
			}
			this.states.attack -= this.delta;
		}
	} else {
		this.collideDamage = 5;
		this.states.jump_phase = 0;
		this.gravity = 1.0;
		this.states.cooldown = Game.DELTASECOND * 4;
		this.states.recover -= this.delta;
	}
	
	/* animation */
	if( this.states.jump_phase == 0 ) {
		if( this.states.recover > 0 ) { 
			this.frame_row = 1; 
			this.frame = 3; 
			this.width = 48;
		} else {
			this.width = 28;
			if( this.states.attack > 0 ) {
				this.frame_row = 2; 
				this.frame = 0; 
				if( this.states.attack <= this.attack_times.release ) this.frame = 1;
				if( this.states.attack <= this.attack_times.cool ) this.frame = 2;
			} else {
				this.frame_row = 0; 
				this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3;
			}
		}
	} else {
		this.width = 48;
		this.frame_row = 1;
		this.frame = 1;
		if( this.force.y > 0.3 ) this.frame = 2;
		if( this.force.y < -0.3 ) { this.frame = 0; this.width = 28; }
	}
}

 /* platformer/boss_marquis.js*/ 

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
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
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
	this.mass = 4.0;
	this.damage = 25;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( dir.y < 22.0 || !this.active ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = (Math.random() > 0.6 ? 0.0 : 10.0);
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(40);
		audio.play("kill");
		
		Item.drop(this,9);
		Item.drop(this,9);
		Item.drop(this,9);
		this.destroy();
	});
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
				
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.walk_back ? -1.0 : 1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				var start_distance = this.position.x - this.start_x;
				if( Math.abs( dir.x ) < 32 ) this.states.walk_back = true;
				if( Math.abs( dir.x ) > 96 && Math.abs(start_distance) < 48 ) this.states.walk_back = false;
				if( start_distance > 96 ) this.states.walk_back = !this.flip;
				else if( start_distance < -96 ) this.states.walk_back = this.flip;
				else if( this.states.cooldown < 50 && Math.abs(start_distance) < 64 ) this.states.walk_back = false;
				
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 48 ){
			this.states.attack = this.attack_times.warm;
			this.states.cooldown = this.attack_times.warm * 2;
		}
		
		if ( this.states.attack > this.attack_times.rest && this.states.attack < this.attack_times.damage ){
			this.strike(new Line(
				new Point( 16, 0 ),
				new Point( 40, 16 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
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

 /* platformer/bullet.js*/ 

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	this.blockable = true;
	
	this.speed = 6.0;
	this.sprite = sprites.bullets;
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	
	this.on("collideObject", function(obj){
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !this.blockable ) {
				obj.hurt( this, this.collideDamage );
			} else {
				if( "_shield" in obj && game.overlaps(this.bounds()).indexOf(obj._shield) > -1 ){
					obj.trigger("block",this,this.position,this.collideDamage);
				} else {
					obj.hurt( this, this.collideDamage );
				}
				
			}
			this.trigger("death");
		} 
	});
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy();});
	
	this.team = 0;
	this.collideDamage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
	this.flip = d < 0;
}

 /* platformer/cornerstone.js*/ 

CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.active = false;
	this.progress = 0.0;
	this.on("struck",function(obj,pos,damage){
		if( ! this.active && obj instanceof Player ) {
			audio.stop("music");
			audio.play("crash");
			this.active = true;
		}
	});
	
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
		-32 + x + _x,
		-32 + y +_y,
		1,window.BLANK_TILE);
	}
	
	this.addModule(mod_combat);
}
CornerStone.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame = 1;
		
		if( this.progress > 33.333 ) {
			audio.playLock("fanfair",10.0);
			audio.playLock("explode1",10.0);
			this.frame = 2;
		}
		
		if( this.progress > 233.333 ) {
			//Load new level
			dataManager.randomLevel( game, dataManager.currentTemple + 1 );
			_player.life = 1;
			game.pause = false;
			_player.heal = Number.MAX_VALUE;
			_player.mana = _player.manaMax;
			_player.addXP(40);
			_player.keys = [];
			
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}

 /* platformer/deathtrigger.js*/ 

DeathTrigger.prototype = new GameObject();
DeathTrigger.prototype.constructor = GameObject;
function DeathTrigger(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 18;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			obj.invincible = -999;
			obj.position.x = obj.checkpoint.x;
			obj.position.y = obj.checkpoint.y;
			obj.hurt( this, Math.floor( obj.lifeMax * .2) );
		} else if( obj.hasModule(mod_combat) ) {
			obj.invincible = -999;
			obj.hurt( this, 9999 );
		}
		if(obj instanceof Item){
			obj.destroy();
		}
	});
}


 /* platformer/debugger.js*/ 

Debuger.prototype = new GameObject();
Debuger.prototype.constructor = GameObject;
function Debuger(x, y){	
	this.sprite = sprites.player;
	this.width = 14;
	this.height = 30;
	this.speed = 10;
	
	window._player = this;
	this.addModule( mod_camera );
	
	window.pixel_scale = 0.25;
}
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}

 /* platformer/door.js*/ 

Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			var dir = this.position.subtract(obj.position);
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
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

 /* platformer/enemy_amon.js*/ 

Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.amon;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	/*
	this.on("collideHorizontal", function(dir){
		this.force.x *= -1;
	});
	this.on("collideVertical", function(dir){
		this.force.y *= -1;
	});
	*/
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(10);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 15;
	this.collisionReduction = -1.0;
	this.bounce = 1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	
	this.mass = 1.0;
	this.gravity = 0.0;
}
Amon.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	if( this.stun < 0 ) {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
	} else {
		this.force.x = this.force.y = 0;
	}
}

 /* platformer/enemy_batty.js*/ 

Batty.prototype = new GameObject();
Batty.prototype.constructor = GameObject;
function Batty(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.batty;
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 2,
		"lockon": false,
		"attack" : 0,
		"direction" : 0
	}
	
	this.life = 5;
	this.lifeMax = 5;
	this.mass = 0.8;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	this.gravity = -0.6;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			obj.hurt( this, this.collideDamage );
			this.states.attack = 0;
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.attack = 0;
		
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
		else this.states.lockon = true;
		
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		this.visible = true;
		this.interactive = true;
		this.states.cooldown = Game.DELTASECOND * 2;
		this.states.jumps = 0;
		this.life = this.lifeMax;
		this.gravity = -0.6;
	});
	this.on("death", function(){
		this.visible = false;
		this.interactive = false;
		_player.addXP(1);
		audio.play("kill");
	});
}
Batty.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			
			if( this.states.lockon ) {
				this.gravity = 0;
				this.force.y = 0;
				this.force.x += this.speed * this.delta * this.states.direction;
				this.flip = this.force.x < 0; 
			} else {
				this.gravity = 0.6;
				if( dir.y + 16.0 > 0 ) {
					this.states.lockon = true;
					this.states.direction = dir.x > 0 ? -1 : 1;
				}
			}
			
			if( this.states.attack <= 0 ){
				this.gravity = -0.6;
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.lockon = false;
			} else {
				this.states.attack -= this.delta
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) this.states.attack = Game.DELTASECOND * 2.5;
			this.states.direction = dir.x > 0 ? -1 : 1;
		}
	} 
	
	/* Animation */
	if( Math.abs(this.force.y) < 0.2 && Math.abs(this.force.x) < 0.2  ) {
		this.frame = 1;
	} else {
		if( this.force.y > 1.0 ) {
			this.frame = 0;
		} else {
			this.frame = Math.max( (this.frame + this.delta * 0.3) % 5, 2);
		}
	}
}

 /* platformer/enemy_beaker.js*/ 

Beaker.prototype = new GameObject();
Beaker.prototype.constructor = GameObject;
function Beaker(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.beaker;
	this.speed = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"backwards": false,
		"jumps" : 0
	}
	
	this.life = 15;
	this.lifeMax = 15;
	this.mass = 0.8;
	this.collideDamage = 8;
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = !this.states.backwards;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		this.visible = true;
		this.interactive = true;
		this.states.cooldown = 50;
		this.states.jumps = 0;
		this.life = this.lifeMax;
	});
	this.on("death", function(){
		this.visible = false;
		this.interactive = false;
		audio.play("kill");
	});
}
Beaker.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.backwards ? -1.0 : 1.0);
			
			var speed = 2;
			var jump = 3;
			this.states.cooldown = Game.DELTASECOND;
			this.states.jumps++;
			
			if( this.states.jumps > 2 ) {
				speed = 7;
				jump = 7;
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.jumps = 0;
			}
			this.force.x += direction * speed;
			this.force.y = -jump;
		}
		
		if( Math.abs( this.force.x ) > 0.5 ) this.flip = this.force.x < 0;
		if( Math.abs(dir.x) > 100 ) this.states.backwards = false;
		
		/* counters */
		this.states.cooldown -= this.delta;
	}
	
	this.friction = this.grounded ? 0.4 : 0.025;
	
	/* Animation */
	this.frame = 0;
	if( this.states.cooldown < 5 ) this.frame = 1;
	if( !this.grounded ) this.frame = 2;
}

 /* platformer/enemy_bear.js*/ 

Bear.prototype = new GameObject();
Bear.prototype.constructor = GameObject;
function Bear(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.bear;
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
	
	this.attack_warm = 40.0;
	this.attack_time = 23.0;
	this.attack_rest = 20.0;
	
	this.life = 40;
	this.damage = 15;
	this.collideDamage = 10;
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = Math.random() > 0.6 ? 0 : 30;
		this.states.guard = Math.random() > 0.5 ? 1 : 2;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(10);
		audio.play("kill");
		this.destroy();
	});
}
Bear.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active && this.states.attack <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 ){
			this.states.attack_down = Math.random() > 0.5;
			this.states.guard = 0;
			this.states.attack = this.attack_warm;
			this.states.cooldown = 70.0;
		}
		
		if( this.states.guard == 0 && this.states.attack <= 0 ){
			this.states.guard = Math.random() > 0.5 ? 1 : 2;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time && this.states.attack > this.attack_rest ){
			this.strike(new Line(
				new Point( 15, (this.states.attack_down ? 8 : -8) ),
				new Point( 27, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* guard */
	this.guard.active = this.states.guard != 0;
	this.guard.x = 8;
	this.guard.y = this.states.guard == 1 ? 5 : -6;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame_row = 1;
		} else {
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.2) % 4, 1 );
			} else {
				this.frame = 0;
			}
			this.frame_row = 0;
		}
	}
}
Bear.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 2 : 3 ), 2, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Sword
	var _x = 0
	if( this.states.attack > 0 )
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	this.sprite.render( g, 
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.frame, this.frame_row+3, this.flip
	);
}

 /* platformer/enemy_chaz.js*/ 

Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = sprites.chaz;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(8);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 45;
	this.collideDamage = 5;
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 15
	};
}
Chaz.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( this.position.x - this.start_x > 24 ) this.states.backup = true;
		if( this.position.x - this.start_x < -24 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 50;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new Bullet(this.position.x, this.position.y+10, (this.flip?-1:1) );
				} else {
					missle = new Bullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 3;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame_row = this.states.attack_lower ? 2 : 1;
		} else {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

 /* platformer/enemy_derring.js*/ 

Derring.prototype = new GameObject();
Derring.prototype.constructor = GameObject;
function Derring(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.amon;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(3);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 5;
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	
	this.mass = 1.0;
	this.gravity = 0.0;
}
Derring.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	this.flip = this.force.x < 0;
}

 /* platformer/enemy_dropper.js*/ 

Dropper.prototype = new GameObject();
Dropper.prototype.constructor = GameObject;
function Dropper(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.origin = new Point();
	this.frame = 6;
	this.frame_row = 12;
	
	
	this.sprite = game.tileSprite;
	this.cooldown = 50;
}
Dropper.prototype.update = function(){
	if( this.cooldown < 0 ) {
		this.cooldown = Game.DELTASECOND;
		var bullet = new Bullet(this.position.x + 8, this.position.y + 16, 0);
		bullet.collideDamage = 5;
		bullet.blockable = false;
		bullet.gravity = 1.0;
		game.addObject( bullet );
	}
	this.cooldown -= this.delta;
}

 /* platformer/enemy_knight.js*/ 

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
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guardUpdate" : 0.0,
		"backup" : 0
	}
	
	this.attack_warm = 24.0;
	this.attack_time = 10.0;
	this.attack_rest = 7.0;
	
	this.life = 45;
	this.damage = 20;
	this.collideDamage = 10;
	this.mass = 3.0;
	this.inviciple_time = this.stun_time;
	
	this.level = 1 + Math.floor( Math.random() + dataManager.currentTemple / 3 );
	this.fr_offset = 0;
	this.cooldown_time = Game.DELTASECOND * 2.0;
	
	if( this.level == 2 ){
		this.life = 90;
		this.damage = 30;
		this.fr_offset = 3;
		this.cooldown_time = Game.DELTASECOND * 1.6;
		this.attack_warm = 20.0;
		this.attack_time = 6.0;
		this.attack_rest = 3.0;
		this.speed = 0.25;
	} else if ( this.level >= 3 ) {
		this.life = 160;
		this.damage = 50;
		this.fr_offset = 6;
		this.cooldown_time = Game.DELTASECOND * 1.4;
		this.attack_warm = 16.0;
		this.attack_time = 6.0;
		this.attack_rest = 3.0;
		this.speed = 0.3;
	}
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		this.states.cooldown -= 20;
		audio.play("hurt");
		this.states.guard = _player.states.duck ? 1 : 2;
	});
	this.on("death", function(){
		Item.drop(this,8);
		_player.addXP(18);
		audio.play("kill");
		this.destroy();
	});
}
Knight.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active /*&& this.states.attack <= 0*/ ) {
			var direction = 1;
			if( this.states.backup != 0 ) {
				direction = this.states.backup;
				if( Math.abs( this.position.x - this.start_x ) < 16 ) this.states.backup = 0;
			} else { 
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				if( this.position.x - this.start_x > 64 ) this.states.backup = -1;
				if( this.position.x - this.start_x < -64 ) this.states.backup = 1;
			}
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 32 ){
			if( Math.random() > 0.6 ) {
				//Pick a random area to attack
				this.states.attack_down = Math.random() > 0.5;
			} else {
				//Aim for the player's weak side
				this.states.attack_down = !_player.states.duck;
			}
			
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if( this.states.guardUpdate < 0 && this.states.attack < 0 ){
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guardUpdate = Game.DELTASECOND * 0.3;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time && this.states.attack > this.attack_rest ){
			this.strike(new Line(
				new Point( 15, (this.states.attack_down ? 8 : -8) ),
				new Point( 29, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* guard */
	this.guard.active = this.states.guard > 0;
	this.guard.y = this.states.guard == 1 ? 6 : -5;
	this.guard.x = 12;
	
	/* counters */
	this.states.attack -= this.delta;
	this.states.guardUpdate -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = (this.states.attack > this.attack_time ? 0 : 1);
		this.frame_row = this.fr_offset + (this.states.attack_down == 1 ? 2 : 1);
	} else {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3, 0 );
		} else {
			this.frame = 0;
		}
		this.frame_row = this.fr_offset;
	}
}
Knight.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 3 : 4 ), this.fr_offset, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
}

 /* platformer/enemy_oriax.js*/ 

Oriax.prototype = new GameObject();
Oriax.prototype.constructor = GameObject;
function Oriax(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	
	this.speed = 0.1;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(5);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = 40;
	this.collideDamage = 5;
	this.mass = 1.0;
	this.stun_time = 0;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 45,
		"release" : 25
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.flip ? -1 : 1) * (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( Math.abs(dir.x) < 32 ) this.states.backup = true;
		if( Math.abs(dir.x) > 104 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 60;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new SnakeBullet(this.position.x, this.position.y+8, (this.flip?-1:1) );
				} else {
					missle = new SnakeBullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame += this.states.attack_lower ? 2 : 0;
			this.frame_row = 1;
		} else {
			this.frame = Math.max(this.frame + this.delta * Math.abs(this.force.x) * 0.3, 1 ) % 4;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

 /* platformer/enemy_shooter.js*/ 

Shooter.prototype = new GameObject();
Shooter.prototype.constructor = GameObject;
function Shooter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	this.visible = false;
	
	this.origin = new Point();
	this.frame = 6;
	this.frame_row = 12;
	
	this.bullet_y_pos = [-24,-8,10];
	this.direction = 0;
	
	this.sprite = game.tileSprite;
	this.cooldown = 50;
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( Math.abs( dir.x ) < 384 ){
		if( this.direction == 0 ) this.direction = dir.x < 0 ? -1 : 1;
		
		if( this.cooldown < 0 ) {
			this.cooldown = Game.DELTASECOND * 0.75;
			var y = this.bullet_y_pos[ Math.floor( Math.random() * this.bullet_y_pos.length) ];
			var bullet = new Bullet(
				_player.position.x + (128*this.direction), 
				this.position.y + y, 
				-this.direction
			);
			bullet.collideDamage = 8;
			//bullet.speed = 0.8;
			game.addObject( bullet );
		}
		this.cooldown -= this.delta;
	} else {
		this.direction = 0;
	}
}
Shooter.prototype.idle = function(){}

 /* platformer/enemy_skeleton.js*/ 

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
		"cooldown" : Game.DELTASECOND,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	this.guard.active = true;
	
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = 20;
	this.mass = 0.8;
	this.damage = 15;
	this.collideDamage = 8;
	this.stun_time = 0;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = 30.0;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(4);
		audio.play("kill");
		this.destroy();
	});
}
Skeleton.prototype.update = function(){	
	this.sprite = sprites.skele;
	if ( this.stun <= 0 ) {
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
			this.states.cooldown = Game.DELTASECOND;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time ){
			this.strike(new Line(
				new Point( 12, -6 ),
				new Point( 20, -10 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
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

 /* platformer/enemy_snakebullet.js*/ 

SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	this.origin.y = 0.7;
	
	this.speed = 0.2;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.states.landed && obj instanceof Oriax ){
			this.trigger("death");
		}
	});
	this.on("collideVertical", function(dir){
		if( !this.states.landed ){
			this.states.landed = true;
			this.flip = !this.flip;
		}
	});
	this.on("struckTarget",function(obj){
		if( this.team == obj.team ) return;
		this.trigger("death");
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	this.flip = d < 0;
	this.force.x = d * 8;
	this.life = 3;
	this.collideDamage = 5;
	this.mass = 0.0;
	this.gravity = 0.1;
	
	this.states = {
		"landed" : false,
		"life" : 200
	}
}
SnakeBullet.prototype.update = function(){
	this.frame = Math.max( (this.frame + this.delta * 0.2) % 4, 2);
	this.frame_row = 2;
	this.friction = this.grounded ? 0.2 : 0.05;
	
	this.states.life -= this.delta;
	
	if( this.stun < 0 && this.states.landed && this.states.dieOnTouch ) {
		this.gravity = 1.0;
		var direction = (this.flip ? -1 : 1);
		this.force.x += this.speed * this.delta * direction;
	}
	
	this.strike( new Line(-8,-4,8,4) );
	
	if( this.states.life < 0 ){
		this.trigger("death");
	}
}

 /* platformer/item.js*/ 

Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	
	if( name != undefined ) {
		this.setName( name );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 25; obj.heal = Number.MAX_VALUE; }
			if( this.name == "life_small" ) { obj.heal = 10; }
			if( this.name == "xp_small" ) { obj.addXP(10); audio.play("pickup1"); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "short_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "long_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "spear") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "small_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "tower_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); audio.play("pickup1"); }
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.money+=1; audio.play("coin"); }
			if( this.name == "coin_2") { obj.money+=5; audio.play("coin"); }
			if( this.name == "coin_3") { obj.money+=10; audio.play("coin"); }
			
			this.interactive = false;
			this.destroy();
		}
	});
}
Item.prototype.setName = function(n){
	this.name = n;
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	if(n == "short_sword") { this.frame = 0; this.frame_row = 2; return; }
	if(n == "long_sword") { this.frame = 1; this.frame_row = 2; return; }
	if(n == "spear") { this.frame = 2; this.frame_row = 2; return; }
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "mana_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "xp_small") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	
	if(n == "coin_1") { this.frame = 7; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frame = 10; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frame = 13; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	
}
Item.drop = function(obj,money){
	var drops = ["life_small", "xp_small"];
	drops.sort(function(a,b){ return Math.random() - 0.5; } );
	if(Math.random() > 0.84 && money == undefined){
		game.addObject( new Item( obj.position.x, obj.position.y, drops[0] ) );
	} else {
		money = money == undefined ? (1+Math.random()*3) : money;
		while(money > 0){
			var coin;
			var off = new Point((Math.random()-.5)*8,(Math.random()-.5)*8);
			if(money > 10){
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_3" );
				money -= 10;
			} else if( money > 5 ) {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_2" );
				money -= 5;
			} else {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_1" );
				money -= 1;
			}
			coin.force.y -= 5.0;
			game.addObject(coin);
			
		}
	}
}

 /* platformer/lift.js*/ 

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y){
	this.constructor();
	this.start_x = x + 8;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	this.sprite = game.tileSprite;
	
	this.onboard = false;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = true;
			obj.position.y = this.position.y;
			obj.checkpoint = this.position;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
			obj.visible = false;
			obj.interactive = false;
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
	if( this.onboard ) {
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		if( Math.abs( this.position.y - goto_y ) > 16 ) {
			if( this.position.y > goto_y ) 
				this.force.y = -this.speed;
			else 
				this.force.y = this.speed;
		}
	}
	
	this.onboard = false;
}
Lift.prototype.render = function(g,c){
	for(var x=0; x < 2; x++ ) for(var y=0; y < 3; y++ ) {
		this.sprite.render(g,
			new Point( x*16 + -16 + this.position.x - c.x, y*16 + -24 + this.position.y - c.y ),
			x, y+13
		);
	}
	
}

 /* platformer/menu_pause.js*/ 

PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.cursor = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
}
PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){
	if( this.open ) {
		game.pause = true;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				dataManager.reset();
				dataManager.randomLevel(game,0);
			}
		} else if( this.page == 0 ) {
			//Equipment page
			if( input.state("left") == 1 ) { this.cursor--; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.cursor++; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.cursor-=4; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=4; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, _player.equipment.length -1 ), 0 );
			
			if( input.state("fire") == 1 ) {
				var item = _player.equipment[this.cursor];
				audio.play("equip");
				if( item.name.match(/shield/) ){
					_player.equip( _player.equip_sword, item );
				} else {
					_player.equip( item, _player.equip_shield );
				}
			}
		} else if( this.page == 1 ) {
			//Map page
			if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }

		} else if( this.page == 2 ){
			//attributes page
			if( _player.stat_points > 0 ) {
				if( input.state("up") == 1 ) { this.stat_cursor -= 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.stat_cursor += 1; audio.play("cursor"); }
				this.stat_cursor = Math.max( Math.min( this.stat_cursor, Object.keys(_player.stats).length-1 ), 0 );
				
				if( input.state("fire") == 1 ) _player.levelUp(this.stat_cursor);
			}
		} else if ( this.page == 3 ) {
			var unlocked = Object.keys( _player.spellsUnlocked );
			if( unlocked.length > 0 ) {
				//Select a spell, if one hasn't already been selected
				if( !(_player.selectedSpell in _player.spellsUnlocked ) ) _player.selectedSpell = unlocked[0];
				
				//Control Menu
				if( input.state("up") == 1 ) {
					var pos = Math.max( unlocked.indexOf( _player.selectedSpell ) - 1, 0 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("down") == 1 ) { 
					var pos = Math.min( unlocked.indexOf( _player.selectedSpell ) + 1, unlocked.length-1 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 ) {
				this.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( input.state("select") == 1 ) {
				this.page = ( this.page + 1 ) % 4;
				audio.play("cursor");
			}
		}
	} else {
		if( input.state("pause") == 1 && _player instanceof Player && _player.life > 0 ) {
			this.open = true;
			_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			if( _player.stat_points > 0 ) this.page = 2;
			audio.play("pause");
		}
	}
	
	//Reveal map
	if( this.mapDimension instanceof Line ) {
		var map_index = (
			( Math.floor(_player.position.x / 256) - this.mapDimension.start.x ) + 
			( Math.floor(_player.position.y / 240) - this.mapDimension.start.y ) * this.mapDimension.width()
		);
		this.map_reveal[map_index] = 2;
		
		var lock;
		switch( this.map[map_index] ){
			case 1: lock = new Line(-256,0,512,240); break;
			case 2: lock = new Line(-256,-240,512,240); break;
			case 3: lock = new Line(-256,0,512,480); break;
			case 4: lock = new Line(-256,-240,256,240); break;
			case 5: lock = new Line(0,-240,512,240); break;
			case 6: lock = new Line(-256,0,256,480); break;
			case 7: lock = new Line(0,0,512,480); break;
			case 8: lock = new Line(0,-240,256,480); break;
			case 9: lock = new Line(-256,-240,512,480); break;
			case 10: lock = new Line(0,-240,512,480); break;
			case 11: lock = new Line(-256,-240,256,480); break;
			case 12: lock = new Line(0,0,512,240); break;
			case 13: lock = new Line(-256,0,256,240); break;
			case 14: lock = new Line(0,0,256,240); break;
			case 15: lock = new Line(0,0,512,240); break;
			default: lock = new Line(0,0,256,240); break;
		}
		lock = lock.transpose( Math.floor(_player.position.x / 256)*256,  Math.floor(_player.position.y / 240)*240 );
		_player.lock = lock;
	}
}
PauseMenu.prototype.revealMap = function(){
	for(var i=0; i < this.map.length; i++ ) {
		if( this.map_reveal[i] == undefined ) this.map_reveal[i] = 0;
		this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
	}
}
PauseMenu.prototype.render = function(g,c){
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	sprites.pig.render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	
	if( this.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			sprites.title.render(g,new Point(), 3);
			boxArea(g,68,168,120,40);
			textArea(g,"Press start",84,184);
		} else if( this.page == 0 ) {
			//Equipment
			
			boxArea(g,68,8,120,224);
			textArea(g,"Equipment",94,20);
			
			//Draw cursor
			g.fillStyle = "#FFF";
			g.scaleFillRect(
				84+(this.cursor % 4) * 24, 
				(64 + Math.floor(this.cursor / 4) * 24),
				24, 32 
			);
			g.fillStyle = "#000";
			g.scaleFillRect(
				86+(this.cursor % 4) * 24, 
				(66 + Math.floor(this.cursor / 4) * 24),
				20, 28 
			);
			
			if( _player.equip_sword instanceof Item )
				_player.equip_sword.render(g, new Point(-108,-40));
			if( _player.equip_shield instanceof Item )
				_player.equip_shield.render(g, new Point(-148,-40));
				
			for(var i=0; i < _player.equipment.length; i++ ) {
				_player.equipment[i].position.x = 0;
				_player.equipment[i].position.y = 0;
				_player.equipment[i].render( g, new Point(
					-(96 + (i % 4) * 24),
					(-80 + Math.floor(i / 4) * -24)
				));
			}
		} else if ( this.page == 1 ) {
			//Map
			boxArea(g,16,8,224,224);
			
			textArea(g,"Map",118,20);
			
			var size = new Point(8,8);
			var offset = new Point(32,24);
			for(var i=0; i < this.map.length; i++ ){
				if( this.map[i] > 0 && this.map_reveal[i] > 0 )  {
					var tile = new Point(
						this.mapDimension.start.x + (i%this.mapDimension.width() ),
						this.mapDimension.start.y + Math.floor(i/this.mapDimension.width() )
					);
					var pos = new Point( 
						(this.mapDimension.start.x*8) + (this.mapCursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
						(this.mapDimension.start.y*8) + (this.mapCursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
					);
					if( pos.x >= 0 && pos.x < 24*8 && pos.y >= 0 && pos.y < 24*8 ) {
						sprites.map.render(g,pos.add(offset),this.map[i]-1,(this.map_reveal[i]>=2?0:1));
						
						if( this.map_reveal[i] >= 2 ) {
							var doors = game.getObjects(Door);
							for(var j=0; j < doors.length; j++ ){
								if( tile.x == Math.floor(doors[j].position.x/256) && tile.y == Math.floor(doors[j].position.y/240) ){
									var door_id = doors[j].name.match(/(\d+)/)[0] - 0;
									sprites.map.render(g,pos.add(offset),door_id,2);
								}
							}
						}
					}
				}
			}
			//Draw player
			var pos = new Point(
				1+this.mapCursor.x*8 + Math.floor(_player.position.x/256)*8, 
				2+(this.mapCursor.y*8) + Math.floor(_player.position.y/240)*8
			);
			if( pos.x >= 0 && pos.x < 24*8 && pos.y >= 0 && pos.y < 24*8 ) {
				g.fillStyle = "#F00";
				g.scaleFillRect(pos.x + offset.x, pos.y + offset.y, 5, 5 );
			}
		} else if ( this.page == 2 ) {
			//Stats page
			boxArea(g,68,8,120,224);
			
			textArea(g,"Attributes",88,20);
			
			textArea(g,"Points: "+_player.stat_points ,88,36);
			
			var attr_i = 0;
			for(attr in _player.stats) {
				var y = attr_i * 28;
				textArea(g,attr ,88,60+y);
				g.fillStyle = "#e45c10";
				for(var i=0; i<_player.stats[attr]; i++)
					g.scaleFillRect(88+i*4, 72 + y, 3, 8 );
				
				if( _player.stat_points > 0 ) {
					//Draw cursor
					g.fillStyle = "#FFF";
					if( this.stat_cursor == attr_i )
						g.scaleFillRect(80, 62 + y, 4, 4 );
				}
				attr_i++;
			}
		} else if ( this.page == 3 ) {
			//Spells
			boxArea(g,68,8,120,224);
			textArea(g,"Spells",112,20);
			
			var spell_i = 0;
			for(spell in _player.spellsUnlocked) {
				var y = spell_i * 16;
				textArea(g,_player.spellsUnlocked[spell] ,88,36+y);
				
				if(_player.selectedSpell == spell ) {
					g.fillStyle = "#FFF";
					g.scaleFillRect(80, 38 + y, 4, 4 );
				}
				spell_i++;
			}
		}
	}
}

 /* platformer/menu_title.js*/ 

TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = sprites.title;
	this.zIndex = 999;
	this.visible = true;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	
	this.stars = {
		"pos" : new Point(),
		"timer" : 0,
		"reset" : 0.2
	};
	
	this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		if( this.progress == 0 ) audio.play("music_intro");
		
		this.progress += this.delta / Game.DELTASECOND;
		
		if( input.state("pause") == 1 ) {
			if( this.progress < 9.0 || this.progress > 24.0 ) {
				this.progress = 9.0;
			} else {
				//Start game
				audio.play("pause");
				this.startGame();
			}
		}
		
		if( this.progress > 48 ) this.progress = 9.0;
		
	}
}

TitleMenu.prototype.render = function(g,c){
	if( this.start ) {
		
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(),2);
		
		//Random twinkling stars
		this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
		if( this.progress > this.stars.timer ) {
			this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
			this.stars.timer += this.stars.reset;
		}
		g.fillStyle = "#000";
		g.scaleFillRect ( this.stars.pos.x, this.stars.pos.y, 16,16);
		
		this.sprite.render(g,new Point(0,Math.lerp( this.castle_position, 0, pan)),1);
		this.sprite.render(g,new Point(0,Math.lerp( this.title_position, 0, pan)),0);
		
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			boxArea(g,68,168,120,40);
			textArea(g,"Press start",84,184);
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,0, Math.min( (this.progress-24)/8, 1) );
			boxArea(g,0,y_pos,256,240);
			textArea(g,this.message,16,y_pos+16,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	this.start = true;
	dataManager.reset();
	dataManager.randomLevel(window.game,0);
	audio.stop("music_intro");
}

 /* platformer/modules.js*/ 

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
		
		//Add just enough force to lock them to the ground
		if(this.grounded ) this.force.y += 0.1;
		
		this.grounded = false;
		game.t_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
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
		this._hurt_strobe = 0;
		
		var self = this;
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false
		};
		this._shield = new GameObject();
		this._shield.life = 1;
		
		this.on("added",function(){ game.addObject(this._shield); });
		this._shield.on("struck",function(obj,position,damage){
			if( obj != self ) 
				self.trigger("block",obj,position,damage);
		});
			
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
					this.trigger("struckTarget", this, offset.center(), this.damage);
					
					if( trigger == "hurt" && hits[i].hurt instanceof Function ) {
						hits[i].hurt(this, this.damage);
					} else if( "_shield" in hits[i] && hits.indexOf( hits[i]._shield ) > -1 ) {
						//
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
		
		this.on("death", function(){
			this._shield.destroy();
		});
	},
	"update" : function(){
		if( this.invincible > 0 ) {
			this._hurt_strobe = (this._hurt_strobe + game.deltaUnscaled * 0.5 ) % 2;
			this.filter = this._hurt_strobe < 1 ? "hurt" : false;
		} else {
			this.filter = false;
		}
		
		this._shield.interactive = this.guard.active;
		this._shield.team = this.team;
		if( this.guard.active ) {
			this._shield.position.x = this.position.x+(this.flip?-1:1)*this.guard.x;
			this._shield.position.y = this.position.y+this.guard.y;
			this._shield.width = this.guard.w;
			this._shield.height = this.guard.h;
		} else {
			this._shield.position.x = -Number.MAX_VALUE;
			this._shield.position.y = -Number.MAX_VALUE;
		}
		
		this.invincible -= this.delta;
		this.stun -= this.delta;
	}
}

var mod_boss = {
	"init" : function(){
		this.active = false;
		var x = this.position.x;
		var y = this.position.y;
		
		var corner = new Point(256*Math.floor(x/256), 240*Math.floor(y/240));
		this.boss_lock = new Line(
			corner.x,
			corner.y,
			256 + corner.x,
			240 + corner.y
		);
		this.boss_doors = [
			new Point(corner.x+8,corner.y+168),
			new Point(corner.x+8,corner.y+184),
			new Point(corner.x+8,corner.y+200),
			
			new Point(corner.x+248,corner.y+168),
			new Point(corner.x+248,corner.y+184),
			new Point(corner.x+248,corner.y+200)
		];
		
		this.on("activate", function() {
			for(var i=0; i < this.boss_doors.length; i++ ) 
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, 1, window.BLANK_TILE);
			_player.lock_overwrite = this.boss_lock;
			this.interactive = true;
		});
		this.on("death", function() {
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, 1, 0);
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

 /* platformer/player.js*/ 

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.zIndex = 1;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	this.equipment = [new Item(0,0,"short_sword"), new Item(0,0,"small_shield")];
	this.spells = [];
	
	this.equip_sword = this.equipment[0];
	this.equip_shield = this.equipment[1];
	
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND
	};
	
	this.attackProperites = {
		"warm" : 8.5,
		"strike" : 8.5,
		"rest" : 5.0,
		"range" : 8.0,
		"sprite" : sprites.sword1
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	}
	
	this.on("death", function(){
		game.slow(0,Game.DELTASECOND);
		audio.stop("music");
	});
	this.on("land", function(){
		audio.play("land");
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		this.hurt(obj,damage);
		/*
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		var facing = true;
		
		if( this.states.guard && facing && (
			(this.states.duck && dir.y < this.shieldProperties.duck) || 
			(!this.states.duck && dir.y > this.shieldProperties.stand)
		)){
			//blocked
			var kb = damage / 15.0;
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -kb : kb) * this.delta;
			audio.playLock("block",0.1);
		} else {
			this.hurt(obj,damage);
		}
		*/
	});
	this.on("hurt", function(obj, damage){
		this.states.attack = 0;
		game.slow(0,5.0);
		audio.play("playerhurt");
	})
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	this.life = 0;
	this.lifeMax = 100;
	this.mana = 100;
	this.manaMax = 100;
	this.money = 0;
	this.heal = 100;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if( this.spellsCounters.thorns > 0 && obj.hurt instanceof Function)
			obj.hurt(this,damage);
		if( this.spellsCounters.magic_armour > 0 )
			damage = Math.max( Math.floor( damage * 0.5 ), 1);
		this.superHurt(obj,damage);
	}
	
	//Stats
	this.stat_points = 0;
	this.experience = 0;
	this.level = 1;
	this.nextLevel = 0;
	this.prevLevel = 0;
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	
	this.equip(this.equipment[0], this.equipment[1]);
	
	this.spellsUnlocked = {};
	this.selectedSpell = "";
	this.spells = {
		"bolt" : function(){ 
			if( this.mana > 15 ){
				this.mana -= 15;
				var bullet = new Bullet(this.position.x, this.position.y, this.flip ? -1 : 1);
				bullet.team = this.team;
				bullet.collisionDamage = this.damage * 3;
				game.addObject(bullet);
			}
		},
		"magic_sword" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.magic_sword = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"magic_armour" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.magic_armour = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"feather_foot" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.feather_foot = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"thorns" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.spellsCounters.thorns = Game.DELTASECOND * 30; 
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		},
		"heal" : function(){
			if( this.mana > 25 ){
				this.mana -= 25;
				this.heal += 33;
				game.slow(0,Game.DELTASECOND*0.25);
				audio.play("spell");
			}
		}
	};
	this.spellsCounters = {
		"magic_sword" : 0,
		"magic_armour" : 0,
		"feather_foot" : 0,
		"thorns" : 0
	};
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	
	if( this.heal > 0 ){
		audio.play("heal");
		this.life += 2;
		this.heal -= 2;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	} else {
		if( this.life < this.lifeMax * .2 && this.delta > 0 ) audio.playLock("danger",1.00);
	}
	if ( this.life > 0 ) {
		if( this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
			if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand(); this.flip = true;}
			if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); this.flip = false; }
			if ( input.state('jump') == 1 && this.grounded ) { this.jump(); }
			if ( input.state('fire') == 1 ) { this.attack(); }
			if ( input.state('select') == 1 ) { this.castSpell(this.selectedSpell); }
			
			if ( input.state('down') > 0 && this.grounded ) { this.duck(); } else { this.stand(); }
			if ( input.state('up') == 1 ) { this.stand(); }
		}
		
		//Apply jump boost
		if ( input.state('jump') > 0 && !this.grounded && this.jump_boost ) { 
			var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
			this.force.y -= this.gravity * boost * this.delta; 
		} else {
			this.jump_boost = false;
		}
		
		this.friction = this.grounded ? 0.2 : 0.05;
		this.inertia = this.grounded ? 0.9 : 0.2;
		this.height = this.states.duck ? 24 : 30;
		this.states.guard = this.states.attack <= 0;
		
		if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
			//Play sound effect for attack
			if( !this.states.startSwing ) {
				audio.play("swing");
				if( this.spellsCounters.magic_sword > 0 ){
					var offset_y = this.states.duck ? 4 : -4;
					var bullet = new Bullet(this.position.x, this.position.y + offset_y, this.flip ? -1 : 1);
					bullet.team = this.team;
					bullet.speed = this.speed * 2;
					bullet.frame = 1;
					bullet.collisionDamage = Math.max( Math.floor( this.damage * 0.75 ), 1 );
					game.addObject(bullet);
				}
			}
			this.states.startSwing = true;
			
			//Create box to detect enemies
			this.strike(new Line(
				new Point( 12, (this.states.duck ? 4 : -4) ),
				new Point( 12+this.attackProperites.range , (this.states.duck ? 4 : -4)-4 )
			) );
		} else {
			this.states.startSwing = false;
		}
	} else {
		//Player is dead, start his death clock
		this.states.death_clock -= game.deltaUnscaled;
	}
	
	//Shield
	this.guard.active = this.states.guard;
	this.guard.y = this.states.duck ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.stun > 0 || this.life < 0 ) {
		this.stand();
		this.frame = 4;
		this.frame_row = 0;
	} else {
		if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
	}
	
	//Timers
	this.states.attack -= this.delta;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
	
	if( this.states.death_clock <= 0 ) {
		//Go to game over screen
		game.getObject(PauseMenu).open = true;
		audio.play("playerdeath");
		this.destroy();
	}
}
Player.prototype.idle = function(){}
Player.prototype.stand = function(){
	if( this.states.duck ) {
		this.position.y -= 4;
		this.states.duck = false;
	}
}
Player.prototype.duck = function(){
	if( !this.states.duck ) {
		this.position.y += 3.9999999;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = 7;
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attackProperites.warm;
		if( this.grounded ) {
			this.force.x = 0;
		}
	}
}
Player.prototype.castSpell = function(name){
	if( name in this.spells && name in this.spellsUnlocked ) {
		this.spells[name].apply(this);
	}
}
Player.prototype.equip = function(sword, shield){
	try {
		if( sword.name == "short_sword" ){
			this.attackProperites.warm =  8.5;
			this.attackProperites.strike =  8.5;
			this.attackProperites.rest =  5.0;
			this.attackProperites.range =  12.0;
			this.attackProperites.sprite = sprites.sword1;
		} else if ( sword.name == "long_sword" ){
			this.attackProperites.warm = 15.5;
			this.attackProperites.strike =  10.5;
			this.attackProperites.rest =  7.0;
			this.attackProperites.range =  18.0;
			this.attackProperites.sprite = sprites.sword2;
		} else if ( sword.name == "spear" ){
			this.attackProperites.warm =  18.5;
			this.attackProperites.strike =  13.5;
			this.attackProperites.rest =  8.0;
			this.attackProperites.range =  27.0;
			this.attackProperites.sprite = sprites.sword3;
			shield = null;
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( shield.name == "small_shield" ){
				this.shieldProperties.duck = 6.0;
				this.shieldProperties.stand = -5.0;
				this.shieldProperties.frame_row = 3;
				this.guard.h = 16;
			} else if ( shield.name == "tower_shield" ){
				this.attackProperites.warm += 15.0;
				this.attackProperites.strike +=  12.0;
				this.attackProperites.rest +=  12.0;
				this.shieldProperties.duck = -5.0;
				this.shieldProperties.stand = -5.0;
				this.guard.h = 32;
				this.shieldProperties.frame_row = 4;
			} else {
				this.shieldProperties.duck = -Number.MAX_VALUE;
				this.shieldProperties.stand = -Number.MAX_VALUE;
				this.shieldProperties.frame_row = 5;
				this.guard.h = 16;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		/* Modify using stats */
		var tech = this.stats.technique - 1;
		
		this.attackProperites.rest = Math.max( this.attackProperites.rest - tech*0.8, 0);
		this.attackProperites.strike = Math.max( this.attackProperites.strike - tech*0.8, 3.5);
		this.attackProperites.warm = Math.max( this.attackProperites.warm - tech*1.0, this.attackProperites.strike);		
		
	} catch(e) {
		this.equip( this.equip_sword, this.equip_shield );
	}
}
Player.prototype.levelUp = function(index){
	if( this.stat_points > 0 ) {
		var i=0;
		for(var attr in this.stats ){
			if( i == index && this.stats[attr] < 20) {
				this.stats[attr]++;
				this.stat_points--;
				audio.play("levelup");
			}
			i++;
		}
	}
	
	this.damage = 3 + this.stats.attack * 2;
	var def = this.stats.defence - 1;
	this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
	this.equip( this.equip_sword, this.equip_shield );
}
Player.prototype.addXP = function(value){
	this.nextLevel = Math.floor( Math.pow( this.level,1.8 ) * 100 );
	this.prevLevel = Math.floor( Math.pow( this.level-1,1.8 ) * 100 );
	this.experience += value;
	
	if( this.experience >= this.nextLevel ) {
		this.stat_points++;
		this.level++;
		audio.play("levelup2");
		
		//Call again, just in case the player got more than one level
		this.addXP(0);
	}
}
Player.prototype.render = function(g,c){
	var shield_frame = (this.states.duck ? 1:0) + (this.states.guard ? 0:2);
	this.sprite.render(g, this.position.subtract(c), shield_frame, this.shieldProperties.frame_row, this.flip);
	
	GameObject.prototype.render.apply(this,[g,c]);
	
	//Render current sword
	this.attackProperites.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.flip);
	
	
	/* Render HP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.fillStyle = "#000";
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.scaleFillRect(8,8,this.life/4,8);
	g.closePath();
	
	/* Render Mana */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,19,(this.manaMax/4)+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,20,this.manaMax/4,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.scaleFillRect(8,20,this.mana/4,2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,25,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,this.money+"g",8, 33 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 45 );
	
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(48+i*16, 12), this.keys[i].frame, this.keys[i].frame_row, false );
	}
	
	//if( this.ttest instanceof Line) this.ttest.renderRect( g, c );
}

 /* platformer/prisoner.js*/ 

Prisoner.prototype = new GameObject();
Prisoner.prototype.constructor = GameObject;
function Prisoner(x,y){
	this.constructor();
	this.sprite = sprites.prisoner;
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 48;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.phase = 0;
	this.alert = 0;
	
	this.progress = 0.0;
	
	this.message_help = "Help, I'm trapped in here!\nI can teach you something \nif you free me.";
	this.message_thanks = "Thank you for your help,\nbrave traveller. Now \nreceive your reward.";
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.phase == 0){
			this.phase = 1;
		}
	});
	this.on("wakeup", function(){
		if( this.alert == 0 ) this.alert = 1;
	});
	this.on("sleep", function(){
		if( this.alert > 0 ) this.alert = 2;
	});
	
	this.addModule(mod_rigidbody);
	this.friction = 0.9;
	this.mass = 0;
}
Prisoner.prototype.update = function(){
	this.flip = this.position.x - _player.position.x > 0;
	
	if( this.phase == 1 ) { 
		this.interactive = false;
		game.pause = true;
		if( input.state("fire") == 1 ) this.phase = 2;
	}
	
	if( this.phase >= 2 && this.phase < 4 ) {
		game.pause = true;
		
		if( this.phase == 2 && this.progress > 16 ) {
			this.phase = 3;
			audio.play("pause");
			var pauseMenu = game.getObject(PauseMenu);
			pauseMenu.page = 3;
			pauseMenu.open = true;
		}
		
		if( this.phase == 3 && this.progress > 50 ) {
			this.giveSpell();
			this.phase = 4;
		}
		
		this.progress += game.deltaUnscaled;
	}
	
	if( this.phase <= 0 ){
		this.frame = ( this.frame + this.delta * 0.2 ) % 3;
	} else {
		this.frame = 3;
	}
}
Prisoner.prototype.giveSpell = function(){
	var spell_list = {
		"bolt" : "Bolt",
		"magic_sword" : "Magic Sword",
		"magic_armour" : "Magic Armour",
		"feather_foot" : "Feather Foot",
		"thorns" : "Thorns",
		"heal" : "Heal"
	};
	var names = Object.keys( spell_list );
	names.sort(function(a,b){ return Math.random() -0.5; });
	for(var i=0; i < names.length; i++ ) {
		if( !( names[i] in _player.spellsUnlocked ) ){
			_player.spellsUnlocked[ names[i] ] = spell_list[names[i]];
			audio.play("item1");
			break;
		}
	}
}
Prisoner.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.phase == 1 ){
		textArea(g, this.message_thanks, 32,32);
	}
	if( this.alert == 1 && this.phase == 0 ){
		textArea(g, this.message_help, 32,32);
	}
}

 /* platformer/renderers.js*/ 

var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","|","}","~","£"
];
function boxArea(g,x,y,w,h){
	g.fillStyle = "#000";
	g.scaleFillRect(x, y, w, h );
	g.fillStyle = "#FFF";
	g.scaleFillRect(x+7, y+7, w-14, h-14 );
	g.fillStyle = "#000";
	g.scaleFillRect(x+8, y+8, w-16, h-16 );
}
function textArea(g,s,x,y,w,h){
	var _x = 0;
	var _y = 0;
	if( w != undefined ) {
		w = Math.floor(w/8);
		var last_space = 0;
		var cursor = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( cursor >= w ) {
				//add line break
				s = s.substr(0,last_space) +"\n"+ s.substr(last_space+1,s.length)
				cursor = i -last_space;
			}
			cursor++;
		}
	}
	
	for(var i=0; i < s.length; i++ ){
		if(s[i] == "\n") {
			_x = 0; _y++;
		} else {
			var index = textLookup.indexOf(s[i]);
			if( index >= 0 ){
				sprites.text.render(g,new Point(_x*8+x,_y*12+y),index);
				_x++;
			}
		}
	}
}

 /* platformer/shop.js*/ 

Shop.prototype = new GameObject();
Shop.prototype.constructor = GameObject;
function Shop(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.shops;
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	
	window._shop = this;
	
	this.items = [];
	this.prices = [];
	
	this.on("struck",function(obj){
		if( this.open==0 && obj instanceof Player ){
			game.pause = true;
			obj.states.attack = 0;
			this.open = 1;
			audio.playLock("pause",0.3);
		}
	});
	this.message = [
		//                       ||                        ||                        ||
		"What are you looking \nfor? Whatever it is, we \nno doubt sell it!",
		"I sold my entire stock. \nNice doing business with \nyou."
	];
	this.open = 0;
	this.cursor = 0;	
	
	this.restock(window.dataManager);
}
Shop.prototype.update = function(g,c){
	if( this.open == 2 ) {
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			audio.playLock("unpause",0.3);
			this.open = 0;
			game.pause = false;
		}
		
		if( input.state("left") == 1 ){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = ( this.cursor == 0 ? this.cursor = this.items.length : this.cursor )-1;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("right") == 1){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1){
			this.purchase();
		}
	}
	if( this.open > 0 ) this.open = 2 //This is to prevent same frame button purchases
}
Shop.prototype.purchase = function(){
	if( this.items[ this.cursor ] instanceof Item ){
		if( _player.money >= this.prices[ this.cursor ] ) {
			var item = this.items[ this.cursor ];
			item.gravity = 1.0;
			item.interactive = true;
			this.items[ this.cursor ] = null;
			_player.money -= this.prices[ this.cursor ];
			audio.play("equip");
			
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			
			return true;
		} else {
			audio.play("negative");
		}
	}
	return false;
}
Shop.prototype.restock = function(data){
	this.items = new Array(3);
	this.prices = new Array(3);
	
	for(var i=0; i < this.items.length; i++) {
		var tresure = data.randomTresure(Math.random());
		tresure.remaining--;
		var x = this.position.x + (i*32) + -40;
		
		this.items[i] = new Item(x, this.position.y-80, tresure.name);
		this.prices[i] = tresure.price;
	
		if( !this.items[i].hasModule(mod_rigidbody) ) this.items[i].addModule(mod_rigidbody);
		this.items[i].gravity = 0;
		this.items[i].interactive = false;
		game.addObject(this.items[i]);
	}
}
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	sprites.characters.render(g,this.position.subtract(c),0,0,false);
	
	if( this.open == 2 ){		
		this.soldout = true;
		for(var i=0; i < this.items.length; i++ ){
			if( this.items[i] instanceof Item ) {
				this.soldout = false;
				var p = this.items[i].position.subtract(c);
				if( i == this.cursor ) boxArea(g, p.x-16,p.y-16,32,32);
				textArea(g, ""+this.prices[i], p.x-8, p.y+12);
			}
		}
		
		boxArea(g,16,16,224,64);
		if( this.soldout ) {
			textArea(g,this.message[1],32,32);
		} else {
			textArea(g,this.message[0],32,32);
		}
	}
}

 /* platformer/start.js*/ 

function game_start(g){
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
}

 /* platformer/tiles.js*/ 

window.BLANK_TILE = 166;

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 1);
	this.width = this.height = 16;
	this.frame = 6;
	this.frame_row = 11;
	this.visible = false;
	
	this.center = new Point(this.position.x, this.position.y);
	
	this.timer = 20
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.3);
		}
	});
	this.on("wakeup",function(){
		if( !this.visible ) {
			this.visible = true; 
			this.active = false;
			game.setTile(this.position.x, this.position.y, 1, window.BLANK_TILE);
			this.timer = 20;
		}
	});
}
CollapseTile.prototype.update = function(){
	if( this.active ) {
		//wobble
		this.position.x = this.center.x + ( -1 + Math.random() * 2 );
		this.position.y = this.center.y + ( -1 + Math.random() * 2 );
		this.timer -= this.delta;
		
		if(this.timer < 0) this.hide();
	}
}
CollapseTile.prototype.hide = function(){
	this.active = false;
	this.visible = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.setTile(this.position.x, this.position.y, 1, 0);
}
CollapseTile.prototype.destroy = function(){
	game.setTile(this.position.x, this.position.y, 1, 0);
	GameObject.prototype.destroy.apply(this);
}

BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	
	this.on("struck", function(obj,pos,damage){
		if( obj instanceof Player){
			//break tile
			if( game.getTile(this.position.x, this.position.y ) != 0 ) {
				audio.play("crash");
				game.setTile(this.position.x, this.position.y, 1, 0 );
				if( this.item instanceof Item){
					this.item.position.x = this.position.x;
					this.item.position.y = this.position.y;
					game.addObject( this.item );
				}
			}
			this.destroy();
		}
	});
}