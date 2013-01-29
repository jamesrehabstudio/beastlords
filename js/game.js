var game, data, input;

function loop() {
	game.update();
	
	if ( requestAnimationFrame instanceof Function ) {
		requestAnimationFrame( loop )
	} else {
		setTimeout( loop, 1000 );
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
	this.nodes = new Array(); //For path finding
	this.sprites = {};
	
	//Per frame datastructures
	this.renderTree;
	this.interactive = new Array();
	this.time = new Date();
	this.delta = 1;
	this.delta_tot = 0;
	this.delta_avr = 0;
	
	this.element = elm;
	this.g = elm.getContext('2d');
	
	this._id_index = 0;
	this._objectsDeleteList = new Array();
}

Game.prototype.avr = function( obj ) {
	return 30 / (this.delta_tot / this.delta_avr);
}

Game.prototype.addObject = function( obj ) {
	this._id_index++;
	obj.id = this._id_index;
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
	this.delta = Math.min( (newTime - this.time) / 30, 1);
	this.delta_tot += this.delta;
	this.delta_avr ++;
	//this.delta = 1.1;
	this.time = newTime;
	
	//this._pathfinder.postMessage(this.objects);
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
	var transpose = new Point(x,y);
	
	for ( var i = 0; i < this.interactive.length; i++ ){
		collider = this.interactive[i];
		if ( obj != collider && obj.mass && collider.applyForce instanceof Function ){
			if ( collider.intersects(obj) ){
				collider.applyForce( new Point(x*obj.mass,y*obj.mass) );
				transpose = new Point();
			}
		}
	}
	
	if ( transpose.length() > 0 ) {
		var collisions = this.lines.get( new Line( 
			new Point(obj.position.x-20,obj.position.y-20),
			new Point(obj.position.x+20,obj.position.y+20) 
		) );
		
		for ( var i = 0; i < collisions.length; i++ ){
			if ( obj.intersects( collisions[i] ) ){
				lines.push( collisions[i] );
				if ( lines.length > max_collides ) break;
			}
		}
		
		if( lines.length > 0 ) {
			transpose = new Point();
			if ( lines.length <= max_collides ) {
				var line = lines[0];
				
				var v = new Point(x,y).normalize();
				var n = line.normal().normalize();
				
				transpose = new Point( 
					(v.x + n.x) * 0.8,
					(v.y + n.y) * 0.8
				);
			}
			obj.oncollide(lines);
		}
	}
	
	obj.transpose( transpose );
	return transpose
}

Game.prototype.trace = function( start, end, thickness ) {
	var lines = [ new Line(start,end) ];
	
	if ( thickness ) {
		var n = lines[0].normal().normalize(thickness);
		lines.push( new Line(start.add(n), end.add(n)) );
		var m = n.scale(-1);
		lines.push( new Line(start.add(m), end.add(m)) );
	}
	
	var collisions = this.lines.get( new Line(start,end) );
	
	for( var i = 0; i < lines.length; i++ ){
	for( var j = 0; j < collisions.length; j++ ){
		if ( collisions[j].intersects( lines[i] ) ){
			return false;
		}
	} }
	return true;
}

/* PATH FINDING FUNCTIONS */

//Path builder
Game.prototype.buildCollisions = function(){
	this.lines = new BSPTree(new Line(new Point(-800,140),new Point(1900,1700)));
	this.lines.split(4);
	
	for(var i=0; i<game.collisions.length;i++){
		this.lines.push(this.collisions[i]);
	}
}

Game.prototype.buildPaths = function(){
	this.nodes = new Array();
	for(var i=0; i<game.objects.length;i++){
		if ( game.objects[i] instanceof Node || game.objects[i].type == "Node" ){
			this.nodes.push( game.objects[i] );
		}
	}
	
	for(var i=0; i<this.nodes.length;i++){
		this.nodes[i].connections = [];
	for(var j=0; j<this.nodes.length;j++){
		if ( i != j && !this.nodes[i].properties.nopath) {
			if ( game.trace( this.nodes[i].position, this.nodes[j].position, 15 ) ){
				this.nodes[i].connections.push( this.nodes[j] );
			}
		}
	} }
}

Game.prototype.nearestnode = function(target,thickness){
	//Get nearest node
	if ( target instanceof GameObject ) {
		target = target.position;
	}
	
	var nearest_node = false;
	var nearest_distance = Number.MAX_VALUE;
	for(var i=0;i<game.nodes.length;i++){
		if(game.nodes[i] instanceof Node){
			if( game.trace(game.nodes[i].position,target,thickness) ){
				var dis = game.nodes[i].position.distance(target);
				if( dis < nearest_distance ){ 
					nearest_distance = dis;
					nearest_node = game.nodes[i];
				}
			}
		}
	}
	
	return nearest_node;
	
}

Game.prototype.path_update = function(e){
	//console.log(e);
	if ( e.object instanceof Object ){
		_player.position.x = e.object.x;
		_player.position.y = e.object.y;
	}
}

/* GAME PRIMITIVES */

function GameObject() {
	this.id = -1;
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
		this.position = this.position.add(x);
	} else {
		this.position.x += x;
		this.position.y += y;
	}
}
GameObject.prototype.hitbox = function() {
	var half_width = Math.floor( this.width * 0.5 );
	var half_height = Math.floor( this.height * 0.5 );
	
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
	if (a instanceof Line ) {
		return this.hitbox().intersects(a);
	} else if ( a instanceof GameObject ) {
		var me = new Line( 
			new Point( this.position.x - (this.width*.5), this.position.y - (this.height*.5) ),
			new Point( this.position.x + (this.width*.5), this.position.y + (this.height*.5) )
		);
		var you = new Line( 
			new Point( a.position.x - (a.width*.5), a.position.y - (a.height*.5) ),
			new Point( a.position.x + (a.width*.5), a.position.y + (a.height*.5) )
		);
		return me.overlaps(you);
	} else if ( a instanceof Polygon ){
		return this.hitbox().intersects(a);
	}
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

function BSPTree(bounds) {
	//For sorting objects
	this.bounds = bounds;
	this.values = new Array();
	this.lower = null;
	this.higher = null;
}
BSPTree.prototype.split = function(levels){
	if( levels % 2 == 0 ) {
		this.lower = new BSPTree( new Line(
			new Point( this.bounds.start.x, this.bounds.start.y ),
			new Point( 
				(this.bounds.start.x + this.bounds.end.x) * 0.5, 
				this.bounds.end.y 
			)
		) );
		this.higher = new BSPTree( new Line(
			new Point( 
				(this.bounds.start.x + this.bounds.end.x) * 0.5, 
				this.bounds.start.y 
			),
			new Point( this.bounds.end.x, this.bounds.end.y )
		) );
	} else {
		this.lower = new BSPTree( new Line(
			new Point( this.bounds.start.x, this.bounds.start.y ),
			new Point( 
				this.bounds.end.x,
				(this.bounds.start.y + this.bounds.end.y) * 0.5
			)
		) );
		this.higher = new BSPTree( new Line(
			new Point( 
				this.bounds.start.x,
				(this.bounds.start.y + this.bounds.end.y) * 0.5
			),
			new Point( this.bounds.end.x, this.bounds.end.y )
		) );
	}
	if ( levels > 1 ) {
		this.lower.split(levels-1); 
		this.higher.split(levels-1);
	}
}
BSPTree.prototype.push = function(value){
	if( this.lower instanceof BSPTree && this.higher instanceof BSPTree ){
		var _lower = value.overlaps(this.lower.bounds);
		var _higher = value.overlaps(this.higher.bounds);
		if( _lower && _higher ) {
			this.values.push( value );
		} else if ( _lower ) {
			this.lower.push( value );
		} else if ( _higher ) {
			this.higher.push( value );
		}
	} else {
		this.values.push( value );
	}
}
BSPTree.prototype.get = function(value){
	var output = this.values;
	if( value.overlaps( this.bounds ) ){
		if( this.lower instanceof BSPTree && value.overlaps(this.lower.bounds) ){
			output = output.concat(this.lower.get(value));
		}
		if( this.higher instanceof BSPTree && value.overlaps(this.higher.bounds) ){
			output = output.concat(this.higher.get(value));
		}
	}
	return output;
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
Array.prototype.peek = function() {
  if ( this.length > 0 ) return this[ this.length - 1 ];
  return undefined;
};
Math.angleTurnDirection = function(_a,_b){
	_a = _a % (2*Math.PI);
	_b = _b % (2*Math.PI);
	
	var a = (_a - _b);
	var b = ((_a-(2*Math.PI))-_b);
	var test = Math.abs(b) < Math.abs(a) ? b: a;
	return test > 0 ? -1 : 1;
	
}