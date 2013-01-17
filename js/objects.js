/* GAME OBJECTS */

Hud.prototype = new GameObject();
Hud.prototype.constructor = GameObject;

function Hud(){
	this.constructor();
	window._hud = this;
	this.zIndex = 9999;
}
Hud.prototype.render = function(g, camera){	
	var health = _player.health || 0;
	health = Math.max( 10 - Math.floor( health / 10 ) , 0 );
	sprites.health_bar.render(g, new Point(0,224), 0, health );
}

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;

function Player(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.interactive = true;
	
	window._player = this;
	game.addObject( new Hud() );
	
	this.weapon = 1;
	this.health = 100;
	this.sprite = sprites.player;
	this._ani = 0;
	this.team = 1;
	
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
}
Player.prototype.fire = function(weapon){
	weapon = weapon || this.weapon;
	if ( weapon == 1 && input.state('click') == 1) {
		//Pistols
		this.parent.addObject( new Bullet( 
			this.position.x,
			this.position.y,
			this.angle-Math.PI,
			this.team
		) );
	} else if ( weapon == 2 && this._weapontimeout < 1) {
		//Shot gun
		var delta = 0.5;
		var pellets = 5;
		for ( var i = 0; i < pellets; i++ ){
			var spread = (delta*.5) - ( Math.random() * delta );
			this.parent.addObject( new Bullet( 
				this.position.x,
				this.position.y,
				(this.angle+spread)-Math.PI,
				this.team
			) );
		}
		this._weapontimeout = 30;
	} else if ( weapon == 3 && this._weapontimeout < 1) {
		//Rifle
		var bullet = new Bullet( 
			this.position.x,
			this.position.y,
			this.angle-Math.PI,
			this.team
		);
		bullet.damage = 100;
		this.parent.addObject( bullet );
		this._weapontimeout = 40;
	} else if ( weapon == 4 && this._weapontimeout < 1) {
		//Rifle
		var gernade = new Gernade( 
			this.position.x,
			this.position.y,
			this.angle-Math.PI,
			this.team
		);
		this.parent.addObject( gernade );
		this._weapontimeout = 40;
	}
	
}
Player.prototype.update = function(){
	var speed = 3.5;
	
	this.force.x = 0;
	this.force.y = 0;
	
	if ( input.state('key1') == 1 ) { this.weapon = 0; }
	if ( input.state('key2') == 1 ) { this.weapon = 1; }
	if ( input.state('key3') == 1 ) { this.weapon = 2; }
	if ( input.state('key4') == 1 ) { this.weapon = 3; }
	if ( input.state('key5') == 1 ) { this.weapon = 4; }
	
	if ( input.state('up') > 0 ) { this.force.y -= speed; }
	if ( input.state('down') > 0 ) { this.force.y += speed; }
	if ( input.state('left') > 0 ) { this.force.x -= speed; }
	if ( input.state('right') > 0 ) { this.force.x += speed; }
	
	var mouse_x = input.mouseCenter.x - 160;
	var mouse_y = input.mouseCenter.y - 120;
	
	this.angle = ( Math.atan2( mouse_x, mouse_y ) ) + Math.PI;
	this.frame_row = Math.floor( ( (2*Math.PI) - ( this.angle + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) );
	
	this._weapontimeout--;
	if ( input.state('click') > 0 ) this.fire();
	
	var angle = Math.atan2( this.force.x, this.force.y );
	if ( this.force.x != 0 || this.force.y != 0 ) {
		this._ani = ( this._ani + (0.3 * game.delta) ) % 3;
		this.frame = Math.floor( this._ani );
	} else {
		this.frame = 0;
	}
	
	if ( this.health < 1 ) {
		game.removeObject( this );
	}
}

Zombie.prototype = new GameObject();
Zombie.prototype.constructor = GameObject;

function Zombie(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 30;
	this.height = 30;
	this.speed = 1.5;
	this.interactive = true;
	
	this.sprite = sprites.bullman;
	this._ani = 0;
	this.health = 100;
	this.team = 2;
	
	this.attack_charge = 0;
	this.addModule( mod_rigidbody );
	this.mass = 0.5;
}
Zombie.prototype.update = function() {
	var angle_to_player = Math.atan2(
		this.position.x - _player.position.x,
		this.position.y - _player.position.y
	);
	if ( this.health > 0 ) {
		if ( this.position.distance( _player.position ) < 24 ) {
			//Warming a melee attack
			this.attack_charge -= game.delta;
			if ( this.attack_charge <= 0 ) {
				bullet = new Bullet( 
					this.position.x, 
					this.position.y,
					angle_to_player-Math.PI,
					this.team
				);
				bullet.age = 5;
				bullet.damage = 10;
				game.addObject( bullet );
				this.attack_charge = 20;
			}
			this.force.x = 0;
			this.force.y = 0;
		} else {
			this.attack_charge = Math.max(5,this.attack_charge);
			
			this.force.x = -Math.sin( angle_to_player ) * this.speed;
			this.force.y = -Math.cos( angle_to_player ) * this.speed;
		}
		
		this._ani += 1 * game.delta;
		this.frame = Math.floor( this._ani * 0.2 ) % 4;
		//this.frame_row = Math.floor( ( (2*Math.PI) - ( angle_to_player + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) );
		//this.frame_row %= 8;
	
	} else { 
		game.removeObject( this );
	}
}

ZombieSpawner.prototype = new GameObject();
ZombieSpawner.prototype.constructor = GameObject;
function ZombieSpawner(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
	this.height = 40;
	this.interactive = true;
	
	this.sprite = sprites.spawner;
	this.health = 300;
	this.time = 0;
	this.team = 2;
}
ZombieSpawner.prototype.update = function(){
	if ( this.health > 0 ) {
		if ( window._player instanceof Player ) {
			if( this.time < 0 ) {
				this.time = 700;
				temp = new Zombie( this.position.x, this.position.y + 32 );
				game.addObject( temp );
			}
			if ( window._player.health > 0 ) {
				this.time-=game.delta;
			}
		}
	} else {
		this.frame_row = 1;
		this.team = 0;
	}
}

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x, y, angle, team, damage){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.damage = damage || 20;
	this.angle = angle;
	this.speed = 8.0;
	this.age = 40;
	this.team = team || 1;
}
Bullet.prototype.oncollide = function(){
	this.parent.removeObject( this );
}
Bullet.prototype.update = function(){
	this.age -= game.delta;
	game.c_move( this,
		this.speed * Math.sin( this.angle ) * game.delta,
		this.speed * Math.cos( this.angle ) * game.delta
	);
	if( this.age < 1 ){
		this.parent.removeObject( this );
	} else {
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			if ( overlap[i].team != undefined && overlap[i].team > 0 && overlap[i].team != this.team ) {
				overlap[i].health -= this.damage;
				if ( overlap[i].momentum instanceof Point ) {
					overlap[i].momentum.x += Math.sin( this.angle ) * this.damage * 0.25;
					overlap[i].momentum.y += Math.cos( this.angle ) * this.damage * 0.25;
				}
				game.removeObject( this );
				break;
			}
		}
	}
}
Bullet.prototype.render = function(g, camera){
	g.fillRect(
		this.position.x - camera.x,
		this.position.y - camera.y,
		4, 4
	);
}

Gernade.prototype = new GameObject();
Gernade.prototype.constructor = GameObject;
function Gernade(x, y, angle, team){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.damage = 80;
	this.radius = 100;
	this.angle = angle;
	this.speed = 1.0;
	this.age = 50;
	this.team = team || 1;
}
Gernade.prototype.oncollide = function(){
	this.speed = -this.speed;
}
Gernade.prototype.update = function(){
	this.age--;
	
	if( this.age < 1 ){
		this.width = this.radius;
		this.height = this.radius;
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			var target = overlap[i];
			if ( target.team != undefined && target.team > 0 && target.team != this.team ) {
				knock_angle = Math.atan2(
					target.position.x - this.position.x,
					target.position.y - this.position.y
				) + Math.pi;
				game.c_move( target, 
					Math.sin( this.angle ) * 10, 
					Math.cos( this.angle ) * 10 
				);
				game.health -= this.damage;
			}
		}
		game.removeObject(this);
	}else {
		var move_speed = 0.125 * this.age * this.speed;
		game.c_move( this,
			move_speed * Math.sin( this.angle ),
			move_speed * Math.cos( this.angle )
		);
	}
}
Gernade.prototype.render = function(g, camera){
	g.fillRect(
		this.position.x - ( camera.x + (this.width*.5)),
		this.position.y - ( camera.y + (this.width*.5)),
		8, 8
	);
}
///////////////////////////////////////////
// PROPS AND TILES
///////////////////////////////////////////

Tile.prototype = new GameObject();
Tile.prototype.constructor = GameObject;

function Tile(x,y,sprite){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprite;
	this.zIndex = -99999;
}
Tile.prototype.update = function(){ this.zIndex = this.position.y - 99999; }

Prop.prototype = new GameObject();
Prop.prototype.constructor = GameObject;
function Prop(x,y,sprite){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprite;
}

Tree.prototype = new GameObject();
Tree.prototype.constructor = GameObject;
function Tree(x,y) {
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.tree_trunk_ash;
	
	this.brushes = [];
	var positions = [
		new Point( -50, -60 ),
		new Point( 50, -60 ),
		new Point( -25, -40 ),
		new Point( 25, -40 ),
		new Point( 0, -32 ),
	
		new Point( -25, -70 ),
		new Point( 25, -70 ),
		new Point( 0, -65 ),
	
		new Point( -35, -95 ),
		new Point( 35, -95 ),
		new Point( 15, -90 ),
		new Point( 0, -90 ),
		
		
		new Point( -15, -115 ),
		new Point( 15, -115 ),
		
		new Point( 0, -140 ),
	];
	
	window.__wind = window.__wind || 0.002;
	for ( var i = 0; i < positions.length; i++  ) {
		temp = {}
		temp.sprite = sprites.tree_brush_ash;
		
		var thickness = Math.floor( 5 - (i * 0.4) );
		
		temp.position = new Point();
		temp.center = positions[i];
		temp.shake = Math.min( 15 / Math.abs( temp.center.x )  , 1 );
		temp.pos_t = (temp.center.x * 0.03) + (Math.random() * 0.9) ;
	
		this.brushes.push ( temp );
	}
}
Tree.prototype.update = function(){
	for ( var i = 0; i < this.brushes.length; i++  ) {
		this.brushes[i].pos_t = this.brushes[i].pos_t + window.__wind;
		var wind_x = Math.sin( this.brushes[i].pos_t ) * (30 * this.brushes[i].shake * window.__wind);
		var wind_y = Math.sin( this.brushes[i].pos_t * 3 ) * (0.1 * this.brushes[i].shake * window.__wind);
		
		this.brushes[i].position.x = Math.floor( this.brushes[i].center.x + wind_x );
		this.brushes[i].position.y = Math.floor( this.brushes[i].center.y + wind_y );
	}
}

Tree.prototype.render = function( g, camera ){
	Prop.prototype.render.call( this, g, camera );
	
	for ( var i = 0; i < this.brushes.length; i++  ) {
		this.brushes[i].sprite.render(g, new Point(
			this.brushes[i].position.x + (this.position.x - camera.x),
			this.brushes[i].position.y + (this.position.y - camera.y)
		) );
	}
}

/* Modules */
var mod_rigidbody = {
	'init' : function(){
		this.mass = 0.125;
		this.momentum = new Point();
		this.force = new Point();
	},
	'update' : function(){
		this.momentum.x *= (1-this.mass) * game.delta;
		this.momentum.y *= (1-this.mass) * game.delta;
		game.c_move( this,
			(this.force.x + this.momentum.x) * game.delta,
			(this.force.y + this.momentum.y) * game.delta
		);
	}
}

var mod_camera = {
	'update' : function(){
		this.parent.camera.x = this.position.x - 160;
		this.parent.camera.y = this.position.y - 120;
	}
}