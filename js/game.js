window.onload = function() {
	window.game = new Game( document.getElementById( 'game' ) );
	window.data = new DataManager();
	window.input = new Input();
	
	window.requestAnimationFrame = 
		window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		null;
	
	delete_me_create_map();
	loop();
}
function loop() {
	game.update();
	
	if ( requestAnimationFrame instanceof Function ) {
		requestAnimationFrame( loop )
	} else {
		setTimeout( loop, 100 );
	}
}

/* MAIN GAME OBJECT */

function Game( elm ) {
	this.queues = new QueueManager();
	
	this.objects = new Array();
	this.camera = new Point();
	
	this.element = elm;
}

Game.prototype.addObject = function( obj ) {
	obj.assignParent( this );
	this.objects.push ( obj );
}

window.__time = 0;

Game.prototype.update = function( ) {
	for ( var i in this.objects ) {
		if ( this.objects[i] instanceof GameObject ) {
			var obj = this.objects[i];
			
			obj.update();
			obj.element.style.left = Math.floor( obj.position.x - ( this.camera.x - 400 ) ) + "px";
			obj.element.style.top = Math.floor( obj.position.y - this.camera.y + 300 ) + "px";
		}		
	}
	
	window.__time++;
	window.__wind = 0.2 * Math.abs( Math.sin( window.__time * 0.003 ) * Math.sin( window.__time * 0.007 ) );
}
/* GAME PRIMITIVES */

function GameObject() {
	this.elementType = 'img';
	this.position = new Point();
	this.element = document.createElement( this.elementType );
}
GameObject.prototype.update = function(){ }
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
	this.parent.element.appendChild( this.element );
}


function Point(x,y) {
	this.x = x || 0;
	this.y = y || 0;
}
Point.prototype.distance = function(d){
	return Math.sqrt (
		Math.pow( Math.abs( this.x - d.x ), 2 ) +
		Math.pow( Math.abs( this.y - d.y ), 2 )
	);
}