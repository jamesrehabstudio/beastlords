/* GAME OBJECTS */

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;

function Player(){
	this.constructor();
	
	this.element.src = "/img/dude.png";
	this.element.width = 42;
}
Player.prototype.update = function(){
	var speed = 3.5;
	
	if ( input.state('up') > 0 ) { this.position.y -= speed; }
	if ( input.state('down') > 0 ) { this.position.y += speed; }
	if ( input.state('left') > 0 ) { this.position.x -= speed; }
	if ( input.state('right') > 0 ) { this.position.x += speed; }
	
	this.parent.camera.x = this.position.x;
	this.parent.camera.y = this.position.y;
}

///////////////////////////////////////////
// PROPS
///////////////////////////////////////////

Prop.prototype = new GameObject();
Prop.prototype.constructor = GameObject;

function Prop(image){
	this.constructor();
	
	this.element.src = "/img/"+ image + ".jpg"; 
}

Tree.prototype = new Prop();
Tree.prototype.constructor = GameObject;
function Tree() {
	this.constructor();
	//replace div with image
	this.element = document.createElement('div');
	this.trunk = document.createElement('img');
	this.trunk.src = "/img/tree_trunk_ash.png";
	this.trunk.width = 84;
	
	this.element.appendChild( this.trunk );
	
	this.brushes = [];
	
	window.__wind = window.__wind || 0.002;
	for ( var i = 0; i < 15; i++  ) {
		temp = document.createElement('img');
		temp.src = "/img/tree_brush_ash.png";
		
		var thickness = Math.floor( 5 - (i * 0.4) );
		
		temp.width = 159;
		temp.pos_x = (-100-(thickness*5) ) + ( (i % thickness) * 75 );
		temp.pos_y = ( 100 * Math.floor(i / 4 ) ) + ( Math.random() * 60 ) - 40;
		temp.pos_t = (i + Math.random() % 3);
	
		this.element.appendChild( temp );	
		this.brushes.push ( temp );
	}
}
Tree.prototype.update = function(){
	for ( var i = 0; i < this.brushes.length; i++  ) {
		this.brushes[i].pos_t = this.brushes[i].pos_t + window.__wind;
		var wind = Math.sin( this.brushes[i].pos_t ) * 10;
		
		this.brushes[i].style.left = Math.floor( this.brushes[i].pos_x + wind ) + "px";
		this.brushes[i].style.top = Math.floor( this.brushes[i].pos_y ) + "px";
	}
}