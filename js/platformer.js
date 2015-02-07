Debuger.prototype = new GameObject();
Debuger.prototype.constructor = GameObject;
function Debuger(x, y){	
	this.sprite = sprites.player;
	this.width = 14;
	this.height = 30;
	this.speed = 10;
	
	window._player = this;
	this.addModule( mod_camera );
	
	game.element.width = game.element.height = 1024;
}
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	
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
		"stun" : 0.0
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
		game.slow(0,20.0);
		this.destroy();
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
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
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(obj, damage){
		if( this.invincible <= 0 ) {
			this.states.attack = 0;
			game.slow(0,5.0);
		}
	})
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	this.life = 0;
	this.lifeMax = 100;
	this.heal = 100;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.equip(this.equipment[0], this.equipment[1]);
}

Player.prototype.update = function(){
	var speed = 1.25;
	
	if( this.heal > 0 ){
		this.life += 2;
		this.heal -= 2;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	}
	
	if( this.life > 0 && this.states.attack <= 0 && this.hurt <= 0 && this.delta > 0) {
		if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand(); this.flip = true;}
		if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); this.flip = false; }
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
	
	if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
		this.strike(new Line(
			new Point( 12, (this.states.duck ? 4 : -4) ),
			new Point( 12+this.attackProperites.range , (this.states.duck ? 4 : -4)-4 )
		) );
	}
	
	//Animation
	if ( this.hurt > 0 ) {
		this.stand();
		this.frame = Math.max((this.frame + 1) % 5, 3);
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
		this.position.y += 4;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attackProperites.warm;
		if( this.grounded ) {
			this.force.x = 0;
		}
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
				this.shieldProperties.duck = 8.0;
				this.shieldProperties.stand = -8.0;
				this.shieldProperties.frame_row = 3;
			} else if ( shield.name == "tower_shield" ){
				this.attackProperites.warm += 15.0;
				this.attackProperites.strike +=  12.0;
				this.attackProperites.rest +=  12.0;
				this.shieldProperties.duck = Number.MAX_VALUE;
				this.shieldProperties.stand = -Number.MAX_VALUE;
				this.shieldProperties.frame_row = 4;
			} else {
				this.shieldProperties.duck = -Number.MAX_VALUE;
				this.shieldProperties.stand = Number.MAX_VALUE;
				this.shieldProperties.frame_row = 5;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
		this.equip_sword = sword;
		this.equip_shield = shield;
		
	} catch(e) {
		this.equip( this.equip_sword, this.equip_shield );
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
	g.fillRect(7,7,(this.lifeMax/4)+2,10);
	g.fillStyle = "#000";
	g.fillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.fillRect(8,8,this.life/4,8);
	g.closePath();
	
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(48+i*16, 12), this.keys[i].frame, this.keys[i].frame_row, false );
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
	
	this.attack_warm = 40.0;
	this.attack_time = 23.0;
	this.attack_rest = 20.0;
	
	this.life = 40;
	this.damage = 15;
	this.collideDamage = 10;
	this.mass = 1.5;
	this.inviciple_time = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( (this.states.guard == 1 && dir.y < 0) || (this.states.guard == 2 && dir.y > 0) ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -1 : 1) * this.delta;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = Math.random() > 0.6 ? 10 : 40;
		this.states.guard = Math.random() > 0.5 ? 1 : 2;
	});
	this.on("death", function(){
		Item.drop(this);
		this.destroy();
	});
}
Knight.prototype.update = function(){	
	this.sprite = sprites.knight;
	if ( this.hurt <= 0 ) {
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
				new Point( 12, (this.states.attack_down ? 8 : -8) ),
				new Point( 24, (this.states.attack_down ? 8 : -8)+4 )
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
			this.frame = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame_row = 1;
		} else {
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.min( (this.frame + this.delta * 0.1) % 4, 1 );
			} else {
				this.frame = 0;
			}
			this.frame_row = 0;
		}
	}
}
Knight.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 2 : 3 ), 2, this.flip
		);
	}
	//Body
	this.sprite.render( g, 
		new Point(this.position.x - c.x, this.position.y - c.y), 
		this.frame, this.frame_row, this.flip
	);
	//Sword
	var _x = 0
	if( this.states.attack > 0 )
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	this.sprite.render( g, 
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.frame, this.frame_row+3, this.flip
	);
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
	
	this.life = 20;
	this.mass = 0.8;
	this.damage = 15;
	this.collideDamage = 8;
	this.inviciple_tile = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( (this.states.block_down && dir.y < 0) || (!this.states.block_down && dir.y > 0) ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir2.x < 0 ? -1 : 1) * this.delta;
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
		Item.drop(this);
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
				new Point( 12, -6 ),
				new Point( 20, -10 )
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
	this.start_x = x;
	
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
	var corner = new Point(256*Math.floor(x/256),240*Math.floor(y/240));
	this.borders = [
		new Line(corner.x,corner.y,corner.x+256,corner.y),
		new Line(corner.x+256,corner.y,corner.x+256,corner.y+240),
		new Line(corner.x+256,corner.y+240,corner.x,corner.y+240),
		new Line(corner.x,corner.y+240,corner.x,corner.y)
	];
	
	this.life = 80;
	this.mass = 2.0;
	this.damage = 25;
	this.collideDamage = 10;
	this.inviciple_tile = this.hurt_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(pos);
		var dir2 = this.position.subtract(obj.position);
		
		if( dir.y < 22.0 || !this.active ){
			//blocked
			obj.force.x += (dir2.x > 0 ? -3 : 3) * this.delta;
		} else {
			this.trigger("hurt",obj,damage);
		}
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = 10.0;
	});
	this.on("death", function(){
		for(var i=0; i < this.borders.length; i++ ) game.removeCollision( this.borders[i] );
		_player.lock = false;
		game.objects.remove( game.objects.indexOf(this) );
	});
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.hurt <= 0 ) {
		var dir = this.position.subtract( _player.position );
		if( !this.active && Math.abs( dir.x ) < 64 ){
			this.active = true;
			for(var i=0; i < this.borders.length; i++ ) game.addCollision( this.borders[i] );
			_player.lock = new Line(this.borders[0].start,this.borders[1].end);
		}
		
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
	
	this.on("struck", function(obj,pos,damage){
		this.trigger("hurt", obj, this.damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, this.damage );
	});
	this.on("collideHorizontal", function(dir){
		this.force.x *= -1;
	});
	this.on("collideVertical", function(dir){
		this.force.y *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		this.destroy();
	});
	
	this.life = 15;
	this.collisionReduction = 1.0;
	this.friction = 0.0;
	this.hurt_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	
	this.mass = 0;
	this.gravity = 0.0;
}
Amon.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	if( this.hurt < 0 ) {
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
		this.trigger("hurt", obj, this.damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		obj.trigger("hurt", this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		this.destroy();
	});
	
	this.life = 40;
	this.collideDamage = 5;
	this.mass = 1.0;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false
	};
	this.attack = {
		"warm" : 45,
		"release" : 25
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.hurt < 0 ) {
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
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle = new SnakeBullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.hurt > 0 ) {
		this.frame = (this.frame + 1) % 2;
		this.frame_row = 2;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame_row = 1;
		} else {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3 ) % 2
			this.frame_row = 0;
		}
	}
}

SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.origin.y = 0.8;
	
	this.speed = 0.2;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		this.trigger("hurt", obj, this.damage );
	});
	this.on("collideObject", function(obj){
		if( this.team != obj.team ) {
			obj.trigger("struck", this, this.position, this.collideDamage );
			this.trigger("death");
		} else if( this.states.landed ){
			this.trigger("death");
		}
	});
	this.on("collideVertical", function(dir){
		if( !this.states.landed ){
			this.states.landed = true;
			this.flip = !this.flip;
		}
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
		"landed" : false
	}
}
SnakeBullet.prototype.update = function(){
	this.frame = Math.max( (this.frame + this.delta * 0.2) % 4, 2);
	this.frame_row = 0;
	this.friction = this.grounded ? 0.2 : 0.05;
	
	if( this.hurt < 0 && this.states.landed) {
		this.gravity = 1.0;
		var direction = (this.flip ? -1 : 1);
		this.force.x += this.speed * this.delta * direction;
	}
}

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
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); }
			if( this.name == "life" ) { obj.heal = 100; }
			if( this.name == "life_small" ) { obj.heal = 10; }
			if( this.name == "short_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); }
			if( this.name == "long_sword") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); }
			if( this.name == "spear") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); }
			if( this.name == "small_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); }
			if( this.name == "tower_shield") if( obj.equipment.indexOf( this ) < 0 ) { obj.equipment.push(this); }
			this.position.x = this.position.y = 0;
			this.destroy();
		}
	});
}
Item.prototype.setName = function(n){
	this.name = n;
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "short_sword") { this.frame = 0; this.frame_row = 2; return; }
	if(n == "long_sword") { this.frame = 1; this.frame_row = 2; return; }
	if(n == "spear") { this.frame = 2; this.frame_row = 2; return; }
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "mana_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	if(n == "money_small") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); return; }
	
}
Item.drop = function(obj){
	var drops = ["life_small", "money_small"];
	drops.sort(function(a,b){ return Math.random() - 0.5; } );
	if(Math.random() > 0.16 ){
		game.addObject( new Item( obj.position.x, obj.position.y, drops[0] ) );
	}
}

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
	
	this.center = new Point(this.position.x, this.position.y);
	this.lineTop = new Line(this.position.x+16,this.position.y,this.position.x,this.position.y);
	
	this.timer = 20
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ){
			this.active = true;
		}
	});
	this.on("wakeup",function(){
		this.visible = true; 
		this.active = false;
		game.addCollision(this.lineTop);
		this.timer = 20;
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
	game.removeCollision(this.lineTop);
}
CollapseTile.prototype.destroy = function(){
	game.removeCollision(this.lineTop);
	GameObject.prototype.destroy.apply(this);
}

PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	
	this.open = false;
	this.cursor = 0;
}
PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){
	if( this.open ) {
		game.pause = true;
		
		if( input.state("left") == 1 ) this.cursor--;
		if( input.state("right") == 1 ) this.cursor++;
		if( input.state("up") == 1 ) this.cursor-=4;
		if( input.state("down") == 1 ) this.cursor+=4;
		
		this.cursor = Math.max( Math.min( this.cursor, _player.equipment.length -1 ), 0 );
		
		if( input.state("fire") == 1 ) {
			var item = _player.equipment[this.cursor];
			if( item.name.match(/shield/) ){
				_player.equip( _player.equip_sword, item );
			} else {
				_player.equip( item, _player.equip_shield );
			}
		}
		
		
		if( input.state("pause") == 1 ) {
			this.open = false;
			game.pause = false;
		}
	} else {
		if( input.state("pause") == 1 && _player instanceof Player ) {
			this.open = true;
			_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
		}
	}
}
PauseMenu.prototype.render = function(g,c){
	if( this.open ) {
		g.fillStyle = "#000";
		//g.beginPath();
		g.fillRect(39, 8, 120, 224 );
		g.fillStyle = "#FFF";
		g.fillRect(39+4, 8+4, 120-8, 224-8 );
		g.fillStyle = "#000";
		g.fillRect(39+5, 8+5, 120-10, 224-10 );
		//g.closePath();
		
		//Draw cursor
		g.fillStyle = "#FFF";
		g.fillRect(
			52+(this.cursor % 4) * 24, 
			(64 + Math.floor(this.cursor / 4) * 24),
			24, 32 
		);
		g.fillStyle = "#000";
		g.fillRect(
			54+(this.cursor % 4) * 24, 
			(66 + Math.floor(this.cursor / 4) * 24),
			20, 28 
		);
		
		if( _player.equip_sword instanceof Item )
			_player.equip_sword.render(g, new Point(-80,-40));
		if( _player.equip_shield instanceof Item )
			_player.equip_shield.render(g, new Point(-112,-40));
			
		for(var i=0; i < _player.equipment.length; i++ ) {
			_player.equipment[i].render( g, new Point(
				-(64 + (i % 4) * 24),
				(-80 + Math.floor(i / 4) * -24)
			));
		}
		
		//Draw cursor
	}
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
		this.collisionReduction = 0.0;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			this.force.y *= this.collisionReduction;
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
		this.collideDamage = 5;
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
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			offset.correct();
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