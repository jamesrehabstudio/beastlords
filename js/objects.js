/* GAME OBJECTS */

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;

function Player(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = game.sprites.player;
}
Player.prototype.update = function(){
	var speed = 2.5;
	
	var x = 0;
	var y = 0;
	
	if ( input.state('up') > 0 ) { y -= speed; }
	if ( input.state('down') > 0 ) { y += speed; }
	if ( input.state('left') > 0 ) { x -= 1; }
	if ( input.state('right') > 0 ) { x += 1; }
	
	var angle = Math.atan2( x, y );
	if ( x != 0 || y != 0 ) {
		this.parent.c_move( 
			this, 
			speed * Math.sin(angle), 
			speed * Math.cos(angle) 
		);
	}
	
	this.parent.camera.x = this.position.x;
	this.parent.camera.y = this.position.y;
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