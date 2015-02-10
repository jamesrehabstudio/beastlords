//Game engine for 2D HTML5 games.

// Dependacies: 
// Polygon, Line, Point
// Input

var game, data, input;
var pixel_scale = 2.0;

function loop() {
	game.update();
	
	if ( requestAnimationFrame instanceof Function ) {
		requestAnimationFrame( loop )
	} else {
		setTimeout( loop, 1000 );
	}
}

/* Audio player */
function AudioPlayer(list){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.a = new AudioContext();
	this.list = list;
	
	this.sfxVolume = this.a.createGain(); this.sfxVolume.gain.value = 0.8;
	this.musVolume = this.a.createGain(); this.musVolume.gain.value = 0.3;
	
	this.sfxVolume.connect(this.a.destination);
	this.musVolume.connect(this.a.destination);
	
	var self = this;
	for(var l in this.list){
		var request = new XMLHttpRequest();
		request.open("GET", this.list[l].url, true);
		request.responseType = "arraybuffer";
		request.uniqueid = l;
		request.onload = function(){ 
			var key = event.target.uniqueid;
			self.a.decodeAudioData(event.target.response, function(b){ 
				self.loaded(b,key); 
			}
		); }
		request.send();
	}
}
AudioPlayer.prototype.loaded = function(b,l){	
	if( l in this.list ) {
		this.list[l]["buffer"] = b;
		
		if( "playOnLoad" in this.list[l] ){
			this.play(l);
		}
	}
}
AudioPlayer.prototype.play = function(l){
	if(l in this.list ){
		if( "buffer" in this.list[l] ) {
			var volume = this.a.createGain();
			var b = this.list[l]["buffer"];
			this.list[l]["source"] = this.a.createBufferSource();
			this.list[l]["source"].buffer = b;
			
			if( "loop" in this.list[l] ) {
				this.list[l]["source"].loop = true;
				this.list[l]["source"].loopStart = this.list[l]["loop"];
				this.list[l]["source"].loopEnd = b.length / b.sampleRate;
			}
			
			if( "music" in this.list[l]) {
				this.list[l]["source"].connect(this.musVolume);
			} else {
				this.list[l]["source"].connect(this.sfxVolume);
			}
			
			this.list[l]["source"].start();
		} else {
			this.list[l]["playOnLoad"] = true;
		}
	} else {
		console.error("Trying to play a sound that does not exist");
	}
}
AudioPlayer.prototype.playLock = function(l,t){
	if( "lock_until" in this.list[l] ) {
		if( new Date().getTime() < this.list[l].lock_until ) {
			return;
		}
	}
	this.list[l]["lock_until"] = new Date().getTime() + t * 1000;
	this.play(l);
}
AudioPlayer.prototype.stop = function(l){
	if(l in this.list ){
		if( "source" in this.list[l] ) {
			this.list[l]["source"].stop();
		}
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
	this.width = -1;
	
	this.name = "";
}
Sprite.prototype.imageLoaded = function() {
	if ( this.frame_width < 1 ) {
		this.frame_width = this.img.width;
	}
	if ( this.frame_height < 1 ) {
		this.frame_height = this.img.height;
	}
	this.width = Math.ceil( this.img.width / this.frame_width );
}
Sprite.prototype.render = function( g, pos, frame, row, flip ) {
	if(frame == undefined ){
		x_off = y_off = 0;
	} else if ( row == undefined ) {
		x_off = (frame % this.width) * this.frame_width;
		y_off = Math.floor(frame / this.width) * this.frame_width;
	} else {
		x_off = ~~frame * this.frame_width;
		y_off = ~~row * this.frame_height;
	}
	
		
	g.beginPath();
	if( flip ) {
		g.save();
		g.scale(-1,1);
		pos.x = g.canvas.width + (g.canvas.width * -1) - pos.x;
	}
	g.drawImage( 
		this.img, 
		x_off, y_off, 
		this.frame_width, 
		this.frame_height,
		Math.floor( pixel_scale * ( pos.x - this.offset.x )),
		Math.floor( pixel_scale * ( pos.y - this.offset.y )),
		pixel_scale * this.frame_width,
		pixel_scale * this.frame_height
		
	);
	g.restore();
	g.closePath();
}

/* MAIN GAME OBJECT */

function Game( elm ) {
	//establish global animation request
	window.requestAnimationFrame = 
		window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		null;
	
	//this.queues = new QueueManager();
	//Options
	this.renderCollisions = true;
	
	this.objects = new Array();
	this.camera = new Point();
	this.collisions = new Array();
	this.bounds = new Line(new Point(-800,140),new Point(1900,1700));
	//this.nodes = new BSPTree( this.bounds, 4);
	this.sprites = {};
	
	this.tileDimension = null;
	this.tiles = null;
	this.tileSprite = sprites.tiles2;
	
	//Per frame datastructures
	this.renderTree;
	this.interactive = new BSPTree(this.bounds, 4);
	this.time = new Date();
	this.delta = 1;
	this.deltaUnscaled = 1;
	this.deltaScale = 1.0;
	this.delta_tot = 0;
	this.delta_avr = 0;
	
	this.pause = false;
	this.slowdown = 1.0;
	this.slowdown_time = 0.0;
	
	this.element = elm;
	this.g = elm.getContext('2d');
	this.g.imageSmoothingEnabled = false
	this.width = Math.floor( this.element.width / pixel_scale );
	this.height = Math.floor( this.element.height / pixel_scale );
	
	this._id_index = 0;
	this._objectsDeleteList = new Array();
}

Game.prototype.avr = function( obj ) {
	return 1 / ((this.delta_tot / this.delta_avr) / 1000.0);
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
Game.prototype.getObject = function( type ) {
	if( type instanceof Function ){
		for(var i=0; i < this.objects.length; i++ ) if( this.objects[i] instanceof type ) return this.objects[i];
	} else {
		this.objects[i];
	}
}
Game.prototype.clearAll = function(){
	this.objects = [];
	this.collisions = [];
	this.bounds = new Line(0,0,0,0);
	this.tileDimension = null;
	this.tiles = null;
}


window.__time = 0;

Game.prototype.slow = function(s,d) {
	if( d > this.slowdown_time ) {
		this.slowdown_time = d;
		this.slowdown = s;
	}	
}

Game.prototype.update = function( ) {
	//Update logic
	var newTime = new Date();
	this.delta = Math.min(newTime - this.time, 100.0) / 30.0;
	this.deltaUnscaled = this.delta;
	//FPS counter
	if(this.delta_tot > 5000) this.delta_avr = this.delta_tot = 0;
	this.delta_tot += newTime - this.time;
	this.delta_avr ++;
	
	this.time = newTime;
	
	//Handle slowdown
	if( this.pause ) {
		this.delta = 0;
	} else {
		this.slowdown_time -= this.delta;
		this.delta *= (this.slowdown_time > 0 ? this.slowdown : 1.0 );
	}
	
	//this._pathfinder.postMessage(this.objects);
	this.renderTree = [];
	//rebuild Interactive Objects
	//this.renderTree = new BSPTree(this.bounds, 4);
	var temp_interactive = new BSPTree(this.bounds, 4);

	
	for ( var i in this.objects ) {
		if ( this.objects[i] instanceof GameObject ) {
			var obj = this.objects[i];
			obj.idle();
			if( obj.awake ) {
				var mods = obj.modules;
				//Set any frame specific values
				obj.delta = this.delta * obj.deltaScale;
				
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
			}
			
			if ( obj.visible ) {
				this.renderTree.push( obj );
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
	var margin = 0;
	var screen = new Point( 160, 120 );
	var screen = new Point( 960, 720 );
	var view = new Line(
		new Point( this.camera.x - (screen.x + margin), this.camera.y - (screen.y + margin) ),
		new Point( this.camera.x + (screen.x + margin), this.camera.y + (screen.y + margin) )
	);
	var view = new Line(new Point(Number.MIN_VALUE,Number.MIN_VALUE), new Point(Number.MAX_VALUE,Number.MAX_VALUE));
	
	var renderList = this.renderTree;
	var camera_center = new Point( this.camera.x, this.camera.y );
	
	this.g.beginPath();
	this.g.clearRect(0,0,this.element.width, this.element.height );
	this.g.closePath();
	
	//Render tiles
	if( this.tiles != null ){
		var ts = 16;
		var camera_offset = new Point(
			(this.camera.x < 0 ? (ts+((this.camera.x%ts==0?-16:0)+this.camera.x%ts)) : (this.camera.x%ts) ),
			(this.camera.y%ts)
		);
		for(var x=0; x <= (1+this.width)/ts; x++)
		for(var y=0; y <= (1+this.height)/ts; y++)
		for(var l=0; l < this.tiles.length; l++) {
			var _x = x + Math.floor(this.camera.x / ts) + this.tileDimension.start.x;
			var tile_index = Math.floor(
				_x + (y + Math.trunc(this.camera.y / ts) + this.tileDimension.start.y) * this.tileDimension.width()
			);
			if( _x >= this.tileDimension.start.x*2 && _x+(this.width/ts)*2 < this.tileDimension.end.x ){
				
				var tile_render_index = this.tiles[l][tile_index] - 1;
				if( tile_render_index >= 0 ) {
					var offset = new Point( 
						(x*ts)-camera_offset.x,
						(y*ts)-camera_offset.y
					);
					this.tileSprite.render(this.g,offset,tile_render_index);
				}
			}
		}
	}
	
	for ( var i in renderList ) {
		if ( renderList[i] instanceof GameObject ) {
			var obj = renderList[i];
			obj.render( this.g, camera_center );
		}		
	}
	
	//Debug, show collisions
	if ( window.debug ) {
		for ( var i = 0; i < this.collisions.length; i++ ){
			this.collisions[i].render( this.g, camera_center );
		}
	}
}
//debug = 1;
Game.prototype.overlap = function( obj ) {
	//Returns a list of objects the provided object is currently on top of
	var out = new Array();
	
	var interactive = this.interactive.get(obj.position);
	
	for ( var i = 0; i < interactive.length; i++ ) {
		var temp = interactive[i];
		if ( obj != temp ) {
			if ( obj.intersects( temp ) ){
				out.push( temp );
			}
		}
	}
	
	return out;
}
Game.prototype.i_move = function(obj,x, y ){
	var bounds = obj.bounds();
	var area = new Line( 
		new Point(bounds.start.x - x - obj.width, bounds.start.y - y - obj.height),
		new Point(bounds.end.x + x + obj.width, bounds.end.y + y + obj.height) 
	);
	
	var collisions = this.lines.get( area );
	var objs = this.interactive.get( area );
	
	var hitbox = obj.hitbox();
	this.unstick(obj, hitbox, collisions);
	
	for(var o=0; o < objs.length; o++ ){
		if( objs[o] != obj ) {
			if( obj.intersects( objs[o] ) ){
				obj.trigger("collideObject", objs[o]);
				objs[o].trigger("collideObject", obj);
			}
		}
	}
		
	
	var interations = Math.ceil( Point.magnitude(x,y) );
	var interation_size = 1.0 / interations;
	
	for( var j = 0; j < interations; j++ ) {
		//Move X
		if( x != 0 ) {
			obj.transpose(x * interation_size ,0);
			hitbox.transpose(x * interation_size, 0);
			
			for( var i = 0; i < collisions.length; i++ ) {
				var c = collisions[i];
				if ( c.polyInstersects(hitbox) ){
					obj.transpose(-x * interation_size, 0);
					hitbox.transpose(-x * interation_size, 0);
					obj.trigger("collideHorizontal", x);
					x = 0;
				}
			}
		}
		
		//Move Y
		if( y != 0 ) {
			obj.transpose(0, y * interation_size);
			hitbox.transpose(0, y * interation_size);
			
			for( var i = 0; i < collisions.length; i++ ) {
				var c = collisions[i];
				if ( c.polyInstersects(hitbox) ){
					obj.transpose(0, -y * interation_size);
					hitbox.transpose(0, -y * interation_size);
					obj.trigger("collideVertical", y);
					y = 0;
				}
			}
		}
	}
}

Game.prototype.unstick = function( obj, hitbox, collisions ) {
	
	for( var i = 0; i < collisions.length; i++ ) {
		var c = collisions[i];
		if ( c.polyInstersects(hitbox) ){
			var normal = c.normal().normalize();
			obj.transpose(normal);
			hitbox.transpose(normal.x, normal.y);
		}
	}
}
Game.prototype.c_move = function( obj, x, y ) {
	//Attempt to move a game object without hitting a colliding line
	var lines = new Array();
	var max_collides = 1;//Prevent slide if any more lines are touched
	obj.transpose(x,y);
	
	var interactive = this.interactive.get(obj.position);	
	
	for ( var i = 0; i < interactive.length; i++ ){
		collider = interactive[i];
		if ( obj != collider && obj.mass && collider.applyForce instanceof Function ){
			if ( collider.intersects(obj) ){
				var direction = collider.position.subtract( obj.position );
				collider.applyForce( new Point((direction.x+x)*obj.mass,(direction.y+y)*obj.mass) );
				lines.push( collider );
				obj.transpose(-x,-y);
			}
		}
	}
	
	if ( lines.length <= 0 ) {
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
			obj.transpose(-x,-y);
			if ( lines.length <= max_collides ) {
				var line = lines[0];
				
				var v = new Point(x,y).normalize();
				var n = line.normal().normalize();
				
				obj.transpose( 
					(v.x + n.x) * 0.8,
					(v.y + n.y) * 0.8
				);
			}
		}
	}
	
	//obj.transpose( transpose );
	if ( lines.length > 0 ) {
		obj.oncollide(lines);
	}
	return false;
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

Game.prototype.raytrace = function(l, end){
	var line;
	if( l instanceof Line ) {
		line = l;
	} else if ( l instanceof Point ){
		line = new Line(l, end);
	}
	var out = [];
	for(var i=0; i < this.objects.length; i++ ){
		if( this.objects[i].intersects(line) ) {
			out.push( this.objects[i] );
		}
	}
	return out;
}

Game.prototype.overlaps = function(l, end){
	var line;
	if( l instanceof Line ) {
		line = l;
	} else if ( l instanceof Point ){
		line = new Line(l, end);
	}
	var out = [];
	for(var i=0; i < this.objects.length; i++ ){
		var a = this.objects[i];
		var you = new Line( 
			new Point( a.position.x - (a.width*.5), a.position.y - (a.height*.5) ),
			new Point( a.position.x + (a.width*.5), a.position.y + (a.height*.5) )
		);
		if( line.overlaps(you) ) {
			out.push( a );
		}
	}
	return out;
}

/* PATH FINDING FUNCTIONS */

Game.prototype.addCollision = function(l){
	if( this.lines instanceof BSPTree )
		this.lines.push(l);
	if( this.collisions.indexOf(l) < 0 ) 
		this.collisions.push(l);
}

Game.prototype.removeCollision = function(l){
	if( this.lines instanceof BSPTree )
		this.lines.remove(l);
	var index = this.collisions.indexOf(l);
	if( index >= 0 ) 
		this.collisions.remove(index);
}

Game.prototype.buildCollisions = function(){
	var new_bounds = new Line(0,0,0,0);
	for(var i=0; i<game.collisions.length;i++){
		var line = game.collisions[i];
		if( line.start.x < new_bounds.start.x ) new_bounds.start.x = line.start.x;
		if( line.start.x > new_bounds.end.x ) new_bounds.end.x = line.start.x;
		if( line.start.y < new_bounds.start.y ) new_bounds.start.y = line.start.y;
		if( line.start.y > new_bounds.end.y ) new_bounds.end.y = line.start.y;
		if( line.end.x < new_bounds.start.x ) new_bounds.start.x = line.end.x;
		if( line.end.x > new_bounds.end.x ) new_bounds.end.x = line.end.x;
		if( line.end.y < new_bounds.start.y ) new_bounds.start.y = line.end.y;
		if( line.end.y > new_bounds.end.y ) new_bounds.end.y = line.end.y;
	}
	
	this.bounds = new_bounds;
	this.lines = new BSPTree(this.bounds, 4);
	
	for(var i=0; i<game.collisions.length;i++){
		this.lines.push(this.collisions[i]);
	}
}
/*
Game.prototype.buildPaths = function(){
	var temp_nodes = new Array();
	for(var i=0; i<game.objects.length;i++){
		if ( game.objects[i] instanceof Node || game.objects[i].type == "Node" ){
			this.nodes.push( game.objects[i] );
			temp_nodes.push( game.objects[i] );
		}
	}
	
	for(var i=0; i<temp_nodes.length;i++){
		temp_nodes[i].connections = [];
	for(var j=0; j<temp_nodes.length;j++){
		if ( i != j && !temp_nodes[i].properties.nopath) {
			if ( game.trace( temp_nodes[i].position, temp_nodes[j].position, 15 ) ){
				temp_nodes[i].connections.push( temp_nodes[j] );
			}
		}
	} }
}

Game.prototype.nearestnode = function(target,thickness){
	var out = this.nodes.nearest(target.position,function(node, position){
		var out = game.trace( node.position, position, thickness );
		return out;
	});
	return out;	
}

Game.prototype.path_update = function(e){
	//console.log(e);
	if ( e.object instanceof Object ){
		_player.position.x = e.object.x;
		_player.position.y = e.object.y;
	}
}
*/

/* GAME PRIMITIVES */

function GameObject() {
	this.id = -1;
	this.position = new Point();
	this.origin = new Point(0.5, 0.5);
	this.sprite;
	this.width = 8;
	this.height = 8;
	this.frame = 0;
	this.frame_row = 0;
	this.flip = false;
	this.zIndex = null;
	this.awake = true;
	this.interactive = true;
	this.properties = false;
	this.events = {};
	this.delta = 0;
	this.deltaScale = 1.0;
	
	this.visible = true;
	this.modules = new Array();
}
GameObject.prototype.on = function(name, func) {
	if( !(name in this.events) ) 
		this.events[name] = [];
	this.events[name].push(func);
}
GameObject.prototype.trigger = function(name) {
	if( name in this.events) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		for( var i=0; i < this.events[name].length; i++ ){
			this.events[name][i].apply(this,args)
		}
	}
}
GameObject.prototype.clearEvents = function(name){
	this.events[name] = [];
}
GameObject.prototype.transpose = function(x, y) {
	if ( x instanceof Point ){
		this.position = this.position.add(x);
	} else {
		this.position.x += x;
		this.position.y += y;
	}
}
GameObject.prototype.bounds = function() {
	var left_width = Math.floor( this.width * this.origin.x );
	var right_width = Math.floor( this.width * (1.0-this.origin.x) );
	var top_height = Math.floor( this.height * this.origin.y );
	var bot_height = Math.floor( this.height * (1.0-this.origin.y) );
	
	return new Line(
		new Point( 
			this.position.x - left_width,
			this.position.y - top_height
		),
		new Point( 
			this.position.x + right_width,
			this.position.y + bot_height
		)
	);
}
GameObject.prototype.hitbox = function() {
	var left_width = Math.floor( this.width * this.origin.x );
	var right_width = Math.floor( this.width * (1.0-this.origin.x) );
	var top_height = Math.floor( this.height * this.origin.y );
	var bot_height = Math.floor( this.height * (1.0-this.origin.y) );
	
	this._hitbox = new Polygon();
	this._hitbox.addPoint( new Point(this.position.x-left_width , this.position.y-top_height) );
	this._hitbox.addPoint( new Point(this.position.x+right_width , this.position.y-top_height) );
	this._hitbox.addPoint( new Point(this.position.x+right_width , this.position.y+bot_height) );
	this._hitbox.addPoint( new Point(this.position.x-left_width , this.position.y+bot_height) );
	
	return this._hitbox;
}
GameObject.prototype.hasModule = function(x){
	return this.modules.indexOf(x) >= 0;
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
		
		var me = this.bounds();
		var you = a.bounds();
		
		return me.overlaps(you);
	} else if ( a instanceof Polygon ){
		return this.hitbox().intersects(a);
	}
}
GameObject.prototype.update = function(){ }
GameObject.prototype.idle = function(){
	var current = this.awake;
	var _cam = this.position.subtract(game.camera);
	var margin = 32;
	var screen = new Point( game.width*.5, game.height*.5);
	this.awake = (
		_cam.x > -margin && 
		_cam.y > -margin && 
		_cam.x-game.width < margin &&
		_cam.y-game.height < margin
	); 
	
	if( current != this.awake ){
		this.trigger( (this.awake ? "wakeup" : "sleep") );
	}
}
GameObject.prototype.render = function( g, camera ){
	if( window.debug ) {
		var bounds = this.bounds();
		g.fillStyle = "#A00";
		g.scaleFillRect(bounds.start.x - camera.x, bounds.start.y - camera.y, bounds.width(), bounds.height() );
		
		if( this.ttest instanceof Line ){
			g.fillStyle = "#AF0";
			g.scaleFillRect(this.ttest.start.x - camera.x, this.ttest.start.y - camera.y, this.ttest.width(), this.ttest.height() );
		}
	}
	
	if ( this.sprite instanceof Sprite ) {
		this.sprite.render( g, 
			new Point(this.position.x - camera.x, this.position.y - camera.y), 
			this.frame, this.frame_row, this.flip
		);
	}
}
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
}
GameObject.prototype.destroy = function() {
	var index = game.objects.indexOf(this);
	if( index >= 0 ) game.objects.remove( game.objects.indexOf(this) );
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

function BSPTree(bounds, levels) {
	//For sorting objects
	this.bounds = bounds;
	this.values = new Array();
	this.lower = null;
	this.higher = null;
	
	if ( levels ) this.split(levels);
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
		var position = value;	
		if ( position instanceof GameObject ) position = position.bounds();
		
		var _lower = this.lower.bounds.overlaps(position);
		var _higher = this.higher.bounds.overlaps(position);
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
	if( this.bounds.overlaps( value ) ){
		if( this.lower instanceof BSPTree && this.lower.bounds.overlaps(value) ){
			output = output.concat(this.lower.get(value));
		}
		if( this.higher instanceof BSPTree && this.higher.bounds.overlaps(value) ){
			output = output.concat(this.higher.get(value));
		}
	}
	return output;
}
BSPTree.prototype.remove = function(value){
	var index = this.values.indexOf(value);
	if( index >= 0 ) {
		this.values.remove(index);
		return value;
	} else { 
		if( this.lower instanceof BSPTree ) if( this.lower.remove(value) ) return value;
		if( this.higher instanceof BSPTree ) if( this.higher.remove(value) ) return value;
	}
	return null;
}
BSPTree.prototype.nearest = function(position, conditions){
	conditions = conditions || function(){ return true; };
	
	out = false;
	temp = new Array();
	temp.concat( this.values );
	
	var _higher = false;
	var _lower = false;
	
	if ( this.higher instanceof BSPTree ) _higher = this.higher.bounds.overlaps(position);
	if ( this.lower instanceof BSPTree ) _lower = this.lower.bounds.overlaps(position);
	
	//Check results in closest partition
	if ( _higher ) {
		var t = this.higher.nearest(position,conditions);
		if ( t ) temp.concat( t );
	} 
	if ( _lower ) {
		var t = this.lower.nearest(position,conditions);
		if ( t ) temp.concat( t );	
	}
	
	//Check if their any valid items in this partition
	for( var i = 0; i<this.values.length;i++) {
		if( conditions( this.values[i], position ) ) temp.push( this.values[i] );
	}
	
	//If all else failed, check off-partition
	if( temp.length < 0 ) {
		if ( !_higher ) {
			var t = this.higher.nearest(position,conditions);
			if ( t ) temp.push( t );
		} else if ( !_lower ) {
			var t = this.lower.nearest(position,conditions);
			if ( t ) temp.push( t );
		}		
	}
	
	//Establish closest item and return it.
	var nearest_distance = Number.MAX_VALUE;
	for( var i = 0; i < temp.length; i++ ) {
		var temp_distance = position.distance(temp[i].position || temp[i]);
		if( temp_distance < nearest_distance ) { 
			nearest_distance = temp_distance;
			out = temp[i];
		}
	}
	return out;
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
Math.trunc = function(x){
	return x < 0 ? Math.ceil(x) : Math.floor(x);
}
CanvasRenderingContext2D.prototype.scaleFillRect = function(x,y,w,h){
	this.fillRect(x*pixel_scale,y*pixel_scale,w*pixel_scale,h*pixel_scale);
}
HTMLAudioElement.prototype.playF = function(){
	this.currentTime = 0;
	this.play();
}