/* GAME OBJECTS */

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;

function Player(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	window._player = this;
	
	this.sprite = game.sprites.player;
	this._ani = 0;
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
			mouse_angle-Math.PI
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
}

Zombie.prototype = new GameObject();
Zombie.prototype.constructor = GameObject;

function Zombie(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = game.sprites.player;
	this._ani = 0;
	this.health = 100;
}
Zombie.prototype.update = function() {
	var angle_to_player = Math.atan2(
		this.position.x - _player.position.x,
		this.position.y - _player.position.y
	);
	if ( this.heath > 0 ) {
		game.c_move( this, 
			-Math.sin( angle_to_player ),
			-Math.cos( angle_to_player )
		);
		
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			if ( overlap[i] instanceof Player ) {
				game.removeObject( overlap[i] );
			}
		}
		
		this.frame_row = Math.floor( ( (2*Math.PI) - ( angle_to_player + (0.875*Math.PI) ) % (2*Math.PI) ) / (0.25*Math.PI) );
		this.frame_row %= 8;
	
	} else { 
		game.removeObject( this );
	}
}


Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x, y, angle){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 4;
	this.height = 4;
	
	this.angle = angle;
	this.speed = 5.0;
	this.age = 0;
}
Bullet.prototype.oncollide = function(){
	this.parent.removeObject( this );
}
Bullet.prototype.update = function(){
	this.age++;
	game.c_move( this,
		this.speed * Math.sin( this.angle ),
		this.speed * Math.cos( this.angle )
	);
	if( this.age > 100 ){
		this.parent.removeObject( this );
	} else {
		var overlap = game.overlap( this );
		for( var i = 0; i < overlap.length; i++ ){
			if ( overlap[i] instanceof Zombie ) {
				game.removeObject( overlap[i] );
				game.removeObject( this );
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

function Prop(sprite){
	this.constructor();
	this.sprite = sprite;
}

Tree.prototype = new Prop();
Tree.prototype.constructor = GameObject;
function Tree() {
	this.constructor();
	//replace div with image
	this.sprite = game.sprites.tree_trunk_ash;
	//this.trunk.src = "/img/tree_trunk_ash.png";
	
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
		temp.sprite = game.sprites.tree_brush_ash;
		
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