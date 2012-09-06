var game, data, input;

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
		
	//load sprites
	window.game.sprites['player'] = new Sprite("/img/dude.png", {offset:new Point(12, 28),width:24,height:32});
	window.game.sprites['tree_trunk_ash'] = new Sprite("/img/tree_trunk_ash.png", {offset:new Point(14, 145)});
	window.game.sprites['tree_brush_ash'] = new Sprite("/img/tree_brush_ash.png", {offset:new Point(26, 16)});
	window.game.sprites['grass_dry'] = new Sprite("/img/grass_dry.png");
	
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

/* Object for wrapping sprites */

function Sprite(url, options) {
	options = options || {};
	
	var offset = options['offset'] || new Point();
	
	this.img = new Image();
	this.img.src = url;
	this.img.sprite = this;
	this.img.onload = function(){ this.sprite.imageLoaded(); }
	this.offset = offset;
	
	this.frame_width = options['width'] || 0;
	this.frame_height = options['height'] || 0;
}
Sprite.prototype.imageLoaded = function() {
	if ( this.frame_width < 1 || this.frame_height < 1 ) {
		this.frame_width = this.img.width;
		this.frame_height = this.img.height;
	}
	if ( this.frame_width < 1 || this.frame_height < 1 ) {
		this.frame_width = this.img.width;
		this.frame_height = this.img.height;
	}
}
Sprite.prototype.render = function( g, pos, frame, row ) {
	frame = frame || 0;
	row = row || 0;
	
	var x_off = frame * this.frame_width;
	var y_off = row * this.frame_height;

	g.drawImage( 
		this.img, 
		x_off, y_off, 
		this.frame_width, 
		this.frame_height,
		pos.x - this.offset.x,
		pos.y - this.offset.y,
		this.frame_width,
		this.frame_height
		
	);
}

/* MAIN GAME OBJECT */

function Game( elm ) {
	this.queues = new QueueManager();
	
	this.objects = new Array();
	this.camera = new Point();
	this.collisions = new Array();
	
	this.element = elm;
	this.g = elm.getContext('2d');
	
	this.sprites = {};
	this._objectsDeleteList = new Array();
}

Game.prototype.addObject = function( obj ) {
	obj.assignParent( this );
	this.objects.push ( obj );
}

Game.prototype.removeObject = function( obj ) {
	this._objectsDeleteList.push(obj)
}


window.__time = 0;

Game.prototype.update = function( ) {
	//Update logic
	for ( var i in this.objects ) {
		if ( this.objects[i] instanceof GameObject ) {
			var obj = this.objects[i];
			obj.update();
		}		
	}	
	input.update();
	window.__time++;
	window.__wind = 0.2 * Math.abs( Math.sin( window.__time * 0.003 ) * Math.sin( window.__time * 0.007 ) );

	//Cleanup
	for( var i = 0; i < this._objectsDeleteList.length; i++) {
		var index = this.objects.indexOf( this._objectsDeleteList[i] );
		this.objects.remove( index );
	}
	this._objectsDeleteList = new Array();
	
	this.render();
}

Game.prototype.render = function( ) {
	var camera_center = new Point( this.camera.x - 160, this.camera.y - 120 );
	this.g.clearRect(0,0,this.element.clientWidth, this.element.clientHeight );
	
	for ( var i in this.objects ) {
		if ( this.objects[i] instanceof GameObject ) {
			var obj = this.objects[i];
			obj.render( this.g, camera_center );
		}		
	}
	
	//Debug, show collisions
	for ( var i = 0; i < this.collisions.length; i++ ){
		this.collisions[i].render( this.g, camera_center );
	}
}

Game.prototype.overlap = function( obj ) {
	//Returns a list of objcets the provided object is currently on top of
	var out = new Array();
	
	for ( var i = 0; i < this.objects.length; i++ ) {
		var temp = this.objects[i];
		if ( obj != temp ) {
			if ( obj.intersects( temp ) ){
				out.push( temp );
			}
		}
	}
	
	return out;
}

Game.prototype.c_move = function( obj, x, y ) {
	//Attempt to move a game object without hitting a colliding line
	var collide = false;
	obj.transpose( x, y );
	
	for ( var i = 0; i < this.collisions.length; i++ ){
		line = this.collisions[i];
		if ( obj.intersects( line ) ){
			collide = true;
			break;
		}
	}
	
	if( collide ) {
		obj.transpose( -x, -y );
		obj.oncollide();
	}
}

/* GAME PRIMITIVES */

function GameObject() {
	this.position = new Point();
	this.sprite;
	this.width = 8;
	this.height = 8;
	this.frame = 0;
	this.frame_row = 0;
	
	this.visible = true;
}
GameObject.prototype.transpose = function(x, y) {
	this.position.x += x;
	this.position.y += y;
}
GameObject.prototype.hitbox = function() {
	var half_width = Math.floor( this.width * 0.5 );
	var half_height = Math.floor( this.width * 0.5 );
	
	this._hitbox = new Polygon();
	this._hitbox.addPoint( new Point(this.position.x-half_width , this.position.y-half_height) );
	this._hitbox.addPoint( new Point(this.position.x+half_width , this.position.y-half_height) );
	this._hitbox.addPoint( new Point(this.position.x+half_width , this.position.y+half_height) );
	this._hitbox.addPoint( new Point(this.position.x-half_width , this.position.y+half_height) );
	
	return this._hitbox;
}
GameObject.prototype.intersects = function(a) {
	if ( a instanceof GameObject ) {
		a = a.hitbox();
	}
	return this.hitbox().intersects(a);
}
GameObject.prototype.oncollide = function() {}
GameObject.prototype.update = function(){ }
GameObject.prototype.render = function( g, camera ){ 
	if ( this.sprite instanceof Sprite ) {
		this.sprite.render( g, 
			new Point(this.position.x - camera.x, this.position.y - camera.y), 
			this.frame, this.frame_row
		);
	}
}
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};