/* GAME OBJECTS */

Hud.prototype = new GameObject();
Hud.prototype.constructor = GameObject;

function Hud(){
	this.constructor();
	window._hud = this;
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
	
	window._player = this;
	game.addObject( new Hud() );
	
	this.health = 100;
	this.sprite = sprites.player;
	this._ani = 0;
	this.team = 1;
}
Player.prototype.update = function(){
	var speed = 2.5;
	
	var x = 0;
	var y = 0;
	
	if ( input.state('up') > 0 ) { y -= speed; }
	if ( input.state('down') > 0 ) { y += speed; }
	if ( input.state('left') > 0 ) { x -= 1; }
	if ( input.state('right') > 0 ) { x += 1; }
	
	var mouse_x = input.mouseCenter.x - 160;
	var mouse_y = input.mouseCenter.y - 120;
	
	var mouse_angle = ( Math.atan2( mouse_x, mouse_y ) ) + Math.PI;
	this.frame_row = Math.floor( ( (2*Math.PI) - ( mouse_angle + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) );
	
	if ( input.state('click') == 1 ) { 
		this.parent.addObject( new Bullet( 
			this.position.x,
			this.position.y,
			mouse_angle-Math.PI,
			this.team
		) );
	}
	
	var angle = Math.atan2( x, y );
	if ( x != 0 || y != 0 ) {
		this._ani = ( this._ani + 0.3 ) % 3;
		this.frame = Math.floor( this._ani );
		this.parent.c_move( 
			this, 
			speed * Math.sin(angle), 
			speed * Math.cos(angle) 
		);
	} else {
		this.frame = 0;
	}
	
	this.parent.camera.x = this.position.x;
	this.parent.camera.y = this.position.y;
	
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
	
	this.sprite = sprites.bullman;
	this._ani = 0;
	this.health = 100;
	this.team = 2;
	
	this.attack_charge = 0;
}
Zombie.prototype.update = function() {
	var angle_to_player = Math.atan2(
		this.position.x - _player.position.x,
		this.position.y - _player.position.y
	);
	if ( this.health > 0 ) {
		if ( this.position.distance( _player.position ) < 24 || this.attack_charge > 0 ) {
			//Warming a melee attack
			this.attack_charge++;
			if ( this.attack_charge > 20 ) {
				bullet = new Bullet( 
					this.position.x, 
					this.position.y,
					angle_to_player-Math.PI,
					this.team
				);
				bullet.age = 10;
				bullet.damage = 10;
				game.addObject( bullet );
				this.attack_charge = 0;
			}
		} else {
			this.attack_charge = 0;
			
			game.c_move( this, 
				-Math.sin( angle_to_player ) * this.speed,
				-Math.cos( angle_to_player ) * this.speed
			);
		}
		
		this._ani++;
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
	
	this.sprite = sprites.spawner;
	this.health = 300;
	this.time = 0;
	this.team = 2;
}
ZombieSpawner.prototype.update = function(){
	if ( this.health > 0 ) {
		if ( window._player instanceof Player ) {
			if( this.time < 0 ) {
				this.time = 900;
				temp = new Zombie( this.position.x, this.position.y + 32 );
				game.addObject( temp );
			}
			if ( window._player.health > 0 ) {
				this.time--;
			}
		}
	} else {
		this.frame_row = 1;
		this.team = 0;
	}
}

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x, y, angle, team){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	
	this.damage = 20;
	this.angle = angle;
	this.speed = 5.0;
	this.age = 40;
	this.team = team || 1;
}
Bullet.prototype.oncollide = function(){
	this.parent.removeObject( this );
}
Bullet.prototype.update = function(){
	this.age--;
	game.c_move( this,
		this.speed * Math.sin( this.angle ),
		this.speed * Math.cos( this.angle )
	);
	if( this.age < 1 ){
		this.parent.removeObject( this );
	} else {
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			if ( overlap[i].team != undefined && overlap[i].team > 0 && overlap[i].team != this.team ) {
				overlap[i].health -= this.damage;
				game.c_move( overlap[i], 
					Math.sin( this.angle ) * 10, 
					Math.cos( this.angle ) * 10 
				);
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
///////////////////////////////////////////
// PROPS
///////////////////////////////////////////

Prop.prototype = new GameObject();
Prop.prototype.constructor = GameObject;

function Prop(x,y,sprite){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprite;
	this.zIndex = -99999;
}
Prop.prototype.update = function(){ this.zIndex = this.position.y - 99999; }

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