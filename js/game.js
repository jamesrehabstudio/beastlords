var game, data, input;

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
	
	this.name = "";
}
Sprite.prototype.imageLoaded = function() {
	if ( this.frame_width < 1 ) {
		this.frame_width = this.img.width;
	}
	if ( this.frame_height < 1 ) {
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
		~~( pos.x - this.offset.x ),
		~~( pos.y - this.offset.y ),
		this.frame_width,
		this.frame_height
		
	);
}

/* MAIN GAME OBJECT */

function Game( elm ) {
	//this.queues = new QueueManager();
	//Options
	this.renderCollisions = true;
	
	this.objects = new Array();
	this.camera = new Point();
	this.collisions = new Array();
	
	//Per frame datastructures
	this.renderTree;
	this.interactive = new Array();
	this.time = new Date();
	this.delta = 1;
	
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
	var newTime = new Date();
	this.delta = Math.min( (newTime - this.time) / 30, 2);
	this.time = newTime;
	
	this.renderTree = new SortTree();
	var temp_interactive = new Array(); //rebuild Interactive Objects
	
	for ( var i in this.objects ) {
		if ( this.objects[i] instanceof GameObject ) {
			var obj = this.objects[i];
			var mods = obj.modules;
			//Update Functions
			if ( mods.length > 0 ) {
				for ( var i = 0; i < mods.length; i++ ) {
					if ( mods[i].beforeupdate instanceof Function ) {
						mods[i].beforeupdate.apply(obj);
					}
				}
				obj.update();
				for ( var i = 0; i < mods.length; i++ ) {
					if ( mods[i].update instanceof Function ) {
						mods[i].update.apply(obj);
					}
				}
			} else {
				obj.update();
			}
			
			if ( obj.visible ) {
				this.renderTree.push( obj, obj.zIndex || obj.position.y );
			}
			if ( obj.interactive ) {
				temp_interactive.push ( obj );
			}
		}		
	}
	
	if ( input != undefined ) { input.update(); }
	window.__time++;
	window.__wind = 0.2 * Math.abs( Math.sin( window.__time * 0.003 ) * Math.sin( window.__time * 0.007 ) );

	//Cleanup
	this.interactive = temp_interactive;
	for( var i = 0; i < this._objectsDeleteList.length; i++) {
		var index = this.objects.indexOf( this._objectsDeleteList[i] );
		this.objects.remove( index );
	}
	this._objectsDeleteList = new Array();
	
	this.render();
}

Game.prototype.render = function( ) {
	var renderList = this.renderTree.toArray();
	var camera_center = new Point( this.camera.x, this.camera.y );
	this.g.clearRect(0,0,this.element.clientWidth, this.element.clientHeight );
	
	for ( var i in renderList ) {
		if ( renderList[i] instanceof GameObject ) {
			var obj = renderList[i];
			obj.render( this.g, camera_center );
		}		
	}
	
	//Debug, show collisions
	if ( this.renderCollisions ) {
		for ( var i = 0; i < this.collisions.length; i++ ){
			this.collisions[i].render( this.g, camera_center );
		}
	}
}

Game.prototype.overlap = function( obj ) {
	//Returns a list of objects the provided object is currently on top of
	var out = new Array();
	
	for ( var i = 0; i < this.interactive.length; i++ ) {
		var temp = this.interactive[i];
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
	var lines = new Array();
	var max_collides = 1;//Prevent slide if any more lines are touched
	obj.transpose( x, y );
	
	for ( var i = 0; i < this.collisions.length; i++ ){
		if ( obj.intersects( this.collisions[i] ) ){
			lines.push( this.collisions[i] );
			if ( lines.length > max_collides ) break;
		}
	}
	
	if( lines.length > 0 ) {
		obj.transpose( -x, -y );
		if ( lines.length <= max_collides ) {
			var line = lines[0];
			
			var v = new Point(x,y).normalize();
			var n = line.normal().normalize();
			
			obj.transpose( 
				(v.x + n.x) * 0.8,
				(v.y + n.y) * 0.8
			);
			//obj.transpose( collide.normal() );
		}
		obj.oncollide(line);
	}
}

/* GAME PRIMITIVES */

function GameObject() {
	this.position = new Point();
	this.angle = 0; //Angle the sprite is facing (if any)
	this.sprite;
	this.width = 8;
	this.height = 8;
	this.frame = 0;
	this.frame_row = 0;
	this.zIndex = null;
	this.interactive = false;
	this.properties = false;
	
	this.visible = true;
	this.modules = new Array();
}
GameObject.prototype.transpose = function(x, y) {
	if ( x instanceof Point ){
		this.position.add(x);
	} else {
		this.position.x += x;
		this.position.y += y;
	}
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
GameObject.prototype.addModule = function(x){
	if ( x.init instanceof Function ){
		x.init.apply(this);
	}
	this.modules.push(x);
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

function SortTree() {
	//For sorting objects
	this.object = null;
	this.value = 0;
	this.lower = null;
	this.higher = null;
}
SortTree.prototype.push = function(object, value){
	if (this.object == null ){
		this.object = object;
		this.value = value;
	} else if ( value > this.value ) {
		if ( this.higher == null ) { this.higher = new SortTree(); }
		this.higher.push( object, value );
	} else {
		if ( this.lower == null ) { this.lower = new SortTree(); }
		this.lower.push( object, value );
	}
}
SortTree.prototype.toArray = function(){
	var out = [];
	if ( this.lower instanceof SortTree ) {
		out = out.concat( this.lower.toArray() );
	}
	out = out.concat( [ this.object ] );
	if ( this.higher instanceof SortTree ) {
		out = out.concat( this.higher.toArray() );
	}
	return out;
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};