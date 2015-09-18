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
	this.alias = {};
	
	this.sfxVolume = this.a.createGain(); this.sfxVolume.gain.value = 0.6;
	this.musVolume = this.a.createGain(); this.musVolume.gain.value = 0.3;
	
	this.sfxVolume.connect(this.a.destination);
	this.musVolume.connect(this.a.destination);
	
	var self = this;
	for(var l in this.list){
		var request = new XMLHttpRequest();
		request.open("GET", this.list[l].url, true);
		request.responseType = "arraybuffer";
		request.uniqueid = l;
		request.onload = function(e){ 
			var event = window.event || e;
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
AudioPlayer.prototype.isPlayingAs = function(n){
	if(n in this.alias){
		return this.alias[n];
	}
	return "";
}
AudioPlayer.prototype.playAs = function(l,n){
	if( n in this.alias ) 
		this.stop(this.alias[n]);
	this.alias[n] = l;
	this.play(l);
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
AudioPlayer.prototype.stopAs = function(n){
	if( n in this.alias ) 
		this.stop(this.alias[n]);
}
AudioPlayer.prototype.isLoaded = function(l){
	if( l in this.list ) {
		return "buffer" in this.list[l];
	}
	return false;
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
	this.tileCollideLayer = 2;
	
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
	this.g = elm.getContext('webgl', {"alpha":false});
	this.g.clearColor(0,0,0,1);
	
	this.width = Math.floor( this.element.width / pixel_scale );
	this.height = Math.floor( this.element.height / pixel_scale );
	this.renderOrder = [0,1,2,"o"];
	this.layerCamera = {
		0 : function(c){ return new Point(c.x*0.9375, c.y); }
	}
	this.resolution = new Point(256,240);
	
	this.g.pixelStorei(this.g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA);
	//this.g.scaleFillRect = function(){};
	this.g.beginPath = function(){};
	this.g.closePath = function(){};
	
	//Build tile buffer for faster rendering
	var tileVerts = new Array();
	var ts = 16;
	for(var _x=0; _x < 28; _x++) for(var _y=0; _y < 16; _y++) {
		var x = _x*ts;
		var y = _y*ts;
		tileVerts.push(x); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y+ts);
	}
	this._tileBuffer = new Float32Array(tileVerts);
	this.backBuffer = this.g.createF();
	
	if( localStorage.getItem("sfxvolume") ){
		audio.sfxVolume.gain.value = localStorage.getItem("sfxvolume");
	} if( localStorage.getItem("sfxvolume") ){
		audio.musVolume.gain.value = localStorage.getItem("musvolume");
	}
	
	var fs = localStorage.getItem("fullscreen") == "true";
	this.fullscreen(fs);
	
	this._id_index = 0;
	this._objectsDeleteList = new Array();
	
	if( window.game_start instanceof Function ) {
		window.game_start( this );
	}
}

Game.prototype.resize = function(x,y) {
	//window.pixel_scale = x;
	this.element.width = x;
	this.element.height = y;
	var ratio = Math.min(this.element.width / ( this.element.height * 1.0 ), Game.MAX_RATIO);
	
	this.g.viewport(0,0,this.element.width,this.element.height);
	this.resolution.x = Math.ceil(240 * ratio);
	this.resolution.y = 240;
}
Game.prototype.avr = function( obj ) {
	return 1 / ((this.delta_tot / this.delta_avr) / 1000.0);
}

Game.prototype.addObject = function( obj ) {
	if( obj instanceof GameObject ) {
		this._id_index++;
		obj.id = this._id_index;
		obj.assignParent( this );
		obj.trigger("added");
		this.objects.push ( obj );
	}
}

Game.prototype.removeObject = function( obj ) {
	this._objectsDeleteList.push(obj)
}
Game.prototype.getObject = function( type ) {
	if( type instanceof Function ){
		for(var i=0; i < this.objects.length; i++ ) if( this.objects[i] instanceof type ) return this.objects[i];
	}
}
Game.prototype.getObjects = function( type ) {
	var out = new Array();
	if( type instanceof Function ){
		for(var i=0; i < this.objects.length; i++ ) if( this.objects[i] instanceof type ) out.push( this.objects[i] );
	}
	return out;
}
Game.prototype.clearAll = function(){
	this.objects = [];
	this.collisions = [];
	this.bounds = new Line(0,0,0,0);
	this.tileDimension = new Line(0,0,0,0);
	this.tiles = [[],[],[]];
}


window.__time = 0;

Game.prototype.slow = function(s,d) {
	if( d > this.slowdown_time ) {
		this.slowdown_time = d;
		this.slowdown = s;
	}	
}

Game.prototype.update = function( ) {
	//
	
	//this.g.viewport(0,0,this.g.drawingBufferWidth,this.g.drawingBufferHeight);
	
	//sprites.items.render(this.g, new Point(0,0), 0, 0);
	
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
	this.prerenderTree = [];
	this.postrenderTree = [];
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
				obj.deltaUnscaled = this.delta;
				
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
			if( obj.shouldRender() ) {
				if ( obj.prerender instanceof Function ) {
					this.prerenderTree.push( obj );
				}else{
					for(var i=0; i < obj.modules.length; i++){
						if("prerender" in obj.modules[i]){
							this.prerenderTree.push( obj );
							break;
						}
					}
				}
				if ( obj.postrender instanceof Function ) {
					this.postrenderTree.push( obj );
				}else{
					for(var i=0; i < obj.modules.length; i++){
						if("postrender" in obj.modules[i]){
							this.postrenderTree.push( obj );
							break;
						}
					}
				}
				
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
	/*
	for( var i = 0; i < this._objectsDeleteList.length; i++) {
		var index = this.objects.indexOf( this._objectsDeleteList[i] );
		this.objects.remove( index );
	}
	this._objectsDeleteList = new Array();
	*/
	
	this.render();
}

Game.prototype.render = function( ) {
	//this.resolution = new Point(512,512);
	this.g.viewport(0,0,this.resolution.x,this.resolution.y);
	this.backBuffer.use(this.g);
	
	var renderList = this.renderTree.sort(function(a,b){ return a.zIndex - b.zIndex; } );
	var camera_center = new Point( this.camera.x, this.camera.y );
	
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	this.g.enable(this.g.BLEND);
	
	//Prerender
	for ( var i in this.prerenderTree ) {
		if ( this.prerenderTree[i] instanceof GameObject ) {
			var obj = this.prerenderTree[i];
			if(obj.prerender instanceof Function){
				obj.prerender(this.g, camera_center);
			}
			for(var i=0; i < obj.modules.length; i++){
				if( "prerender" in obj.modules[i] ) {
					obj.modules[i].prerender.apply(obj,[this.g, camera_center]);
				}
			}
		}
	}
	
	//Render tiles and objects
	for(var o=0; o < this.renderOrder.length; o++){
		if( this.renderOrder[o] == "o" ){
			for ( var i in renderList ) {
				if ( renderList[i] instanceof GameObject ) {
					var obj = renderList[i];
					obj.render( this.g, camera_center );
					
					for(var i=0; i < obj.modules.length; i++){
						if( "render" in obj.modules[i] ) {
							obj.modules[i].render.apply(obj,[this.g, camera_center]);
						}
					}
				}		
			}
		} else {
			this.renderTiles( this.renderOrder[o] );
		}
	}
	
	//Postrender
	for ( var i in this.postrenderTree ) {
		var obj = this.postrenderTree[i];
		if ( obj instanceof GameObject ) {
			if(obj.postrender instanceof Function){
				obj.postrender(this.g, camera_center);
			}
			for(var i=0; i < obj.modules.length; i++){
				if( "postrender" in obj.modules[i] ) {
					obj.modules[i].postrender.apply(obj,[this.g, camera_center]);
				}
			}
		}
	}
	
	
	//Debug, show collisions
	if ( window.debug && this.lines instanceof BSPTree ) {
		var lines = this.lines.get(new Line(this.camera.x-32,this.camera.y-32,this.camera.x+game.width+32,this.camera.y+game.height+32));
		for ( var i = 0; i < lines.length; i++ ){
			lines[i].render( this.g, camera_center );
		}
	}
	
	this.backBuffer.reset(this.g);
	
	this.g.viewport(0,0,this.element.width,this.element.height);
	this.g.renderBackbuffer(this.backBuffer.texture);
	//this.g.renderImage(0,0,this.resolution.x,this.resolution.y, this.backBuffer.texture);
	
	this.g.flush();
}
Game.prototype.renderTiles = function(layer){
	if( !this.tileSprite.loaded || this.tiles == null ) return;
	
	var camera = this.camera;
	if( layer in this.layerCamera ) camera = this.layerCamera[layer](this.camera);
	
	//var tileVerts = new Array();
	var material = window.materials["default"].use();
	var uvVerts = new Array();
	var ts = 16;
	var gl = this.g;
	for(var _x=0; _x < 28; _x++) for(var _y=0; _y < 16; _y++) {
		/*
		var x = _x*ts;
		var y = _y*ts;
		tileVerts.push(x); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y+ts);
		*/
		var cam = new Point(Math.floor(camera.x/ts),Math.floor(camera.y/ts));
		var tile_index = (_x+cam.x-game.tileDimension.start.x) + ((_y+cam.y-game.tileDimension.start.y) * game.tileDimension.width());
		var tile = this.tiles[layer][tile_index];
		if( tile == 0 || tile == undefined) tile = window.BLANK_TILE;
		var tileUV = this.tileSprite.uv(tile-1);
		
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
	}
	var campos = new Point(
		0-Math.round(Math.mod(camera.x,ts)),
		0-Math.round(Math.mod(camera.y,ts))
	);
	
	material.set("u_resolution", game.resolution.x, game.resolution.y);
	material.set("u_camera", campos.x, campos.y);
	gl.bindTexture(gl.TEXTURE_2D, this.tileSprite.gl_tex);
	
	var gridBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, this._tileBuffer, gl.DYNAMIC_DRAW);
	material.set("a_position");
	
	var textBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvVerts), gl.DYNAMIC_DRAW);
	material.set("a_texCoord");
	
	gl.drawArrays(gl.TRIANGLES, 0, Math.floor(uvVerts.length/2));
}
Game.prototype.renderTile = function(layer){
	this.renderTiles(layer); return;
	//Render tiles
	if( this.tiles != null ){
		var ts = 16;
		var camera_offset = new Point(
			(this.camera.x < 0 ? (ts+((this.camera.x%ts==0?-16:0)+this.camera.x%ts)) : (this.camera.x%ts) ),
			(this.camera.y%ts)
		);
		for(var x=0; x <= (1+this.width)/ts; x++)
		for(var y=0; y <= (1+this.height)/ts; y++){
			var _x = x + Math.floor(this.camera.x / ts) - this.tileDimension.start.x;
			var tile_index = Math.floor(
				_x + (y + Math.trunc(this.camera.y / ts) - this.tileDimension.start.y) * this.tileDimension.width()
			);
			if(_x >= 0 && _x < this.tileDimension.width() ){
				
				var tile_render_index = this.tiles[layer][tile_index] - 1;
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
	
	var hitbox = obj.hitbox();
	this.unstick(obj, hitbox, collisions);
	
	if( obj.interactive ) {
		//Collide with other objects
		var objs = this.interactive.get( area );
		
		for(var o=0; o < objs.length; o++ ){
			if( objs[o] != obj ) {
				if( obj.intersects( objs[o] ) ){
					obj.trigger("collideObject", objs[o]);
					objs[o].trigger("collideObject", obj);
				}
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

Game.prototype.t_unstick = function( obj ) {
	var hitbox = obj.corners();
	var isStuck = false;
	var escape = {
		"top" : 0,
		"bottom" : 0,
		"left" : 0,
		"right" : 0
	}
	var exclusive = [137,138,139,140,141,142,143,144,159,160];
	var ts = 16;
	var xinc = obj.width/ Math.ceil(obj.width/ts);
	var yinc = obj.height/ Math.ceil(obj.height/ts);
	var xmid = hitbox.left + Math.floor(obj.width/ts) * 0.5 * xinc;
	var ymid = hitbox.top + Math.floor(obj.height/ts) * 0.5 * xinc;
	for(var _x=hitbox.left; _x<=hitbox.right+1; _x+=xinc ) {
		for(var _y=hitbox.top; _y <=hitbox.bottom+1; _y+=yinc ) {
			var tile = this.getTile(_x,_y);
			if( tile != 0 && exclusive.indexOf(tile) < 0 ) {
				//You're stuck, do something about it!
				isStuck = true;
			} else {
				if( _x == hitbox.left ) escape["left"] ++;
				else if( _x == hitbox.right ) escape["right"] ++;
				
				if ( _y == hitbox.top ) escape["top"] ++;
				else if( _y == hitbox.bottom ) escape["bottom"] ++;
			}
		}
	}
	if( isStuck ) {
		//Try to escape
		var dir = new Point(
			escape["right"] - escape["left"],
			escape["bottom"] - escape["top"]
		);
		if( dir.x == 0 && dir.y == 0 ) {
			obj.position.x += 1.0;
		} else {
			obj.position = obj.position.add(dir);
		}
	}
	return isStuck;
}
Game.prototype.t_move = function(obj, x, y) {
	
	if( this.t_unstick(obj) ) return;
	
	var exclusive = [137,138,139,140,141,142,143,144,159,160];
	var hitbox = obj.corners();
	var interation_size = 1.0;
	var ts = 16;
	
	var limits = [
		Number.MAX_SAFE_INTEGER, //Furthest left
		Number.MAX_SAFE_INTEGER, //Furthest down
		-Number.MAX_SAFE_INTEGER, //Furthest right
		-Number.MAX_SAFE_INTEGER //Furthest up
	];
	var margins = [
		obj.position.x - hitbox.left,
		obj.position.y - hitbox.top,
		obj.position.x - hitbox.right,
		obj.position.y - hitbox.bottom
	];
	var dirs = [0,1];
	
	//for(var dir=0; dir < dirs.length; dir++ ){
	for(var dir=1; dir >= 0; dir-- ){
		
		if( dir == 0 ) 
			obj.transpose(0, y * interation_size);
		else
			obj.transpose(x * interation_size, 0);
		
		var hitbox = obj.corners();
		
		var xinc = obj.width/ Math.ceil(obj.width/ts);
		var yinc = obj.height/ Math.ceil(obj.height/ts);
		
		for(var _x=hitbox.left; _x<=hitbox.right+1; _x+=xinc )
		for(var _y=hitbox.top; _y <=hitbox.bottom+1; _y+=yinc ) { 
			var tile = this.getTile(_x,_y);
			var corner = new Point(Math.floor(_x/ts)*ts, Math.floor(_y/ts)*ts);
			if( dir == 0 ){
				if( tile == 137 ) {
					var peak = (corner.y) + Math.max((hitbox.left-corner.x)*0.5, 1);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile == 138 ) {
					var peak = (corner.y+(ts*0.5)) + Math.max((hitbox.left-corner.x)*0.5, 1);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile == 139 ) {
					var peak = (corner.y) + Math.max(hitbox.left-corner.x, 1);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile == 140 ) {
					var peak = (corner.y+ts) + Math.max(corner.x-hitbox.right, 1-ts);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile == 141 ) {
					var peak = (corner.y+ts) + Math.max((corner.x-hitbox.right) * 0.5, 1-ts*0.5);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile == 142 ) {
					var peak = (corner.y+ts) + Math.max((corner.x-(hitbox.right+ts)) * 0.5, 1-ts);
					limits[1] = Math.min(limits[1], peak-1);
				} else if( tile != 0 && exclusive.indexOf(tile) < 0 ) {
					if(y>0) limits[1] = Math.min(limits[1], corner.y);
					if(y<0) limits[3] = Math.max(limits[3], corner.y+ts);
				}
			} else {
				if( tile != 0 && exclusive.indexOf(tile) < 0 ) {
					if(x>0) limits[0] = Math.min(limits[0], corner.x);
					if(x<0) limits[2] = Math.max(limits[2], corner.x+ts);
				}
			}
		}
	
		//for(var i=0; i<limits.length; i++) limits[i] -= margins[i];
		if( dir == 1) {
			limits[0] += margins[2] - 0.1;
			limits[2] += margins[0] + 0.1;
			if( obj.position.x > limits[0] ) {
				obj.position.x = limits[0];
				obj.trigger("collideHorizontal", x);
			} else if ( obj.position.x < limits[2] ) {
				obj.position.x = limits[2];
				obj.trigger("collideHorizontal", x);
			}
		} else {
			limits[1] += margins[3] - 0.1;
			limits[3] += margins[1] + 0.1;
			if( obj.position.y > limits[1] ) {
				obj.position.y= limits[1];
				obj.trigger("collideVertical", y);
			} else if ( obj.position.y < limits[3] ) {
				obj.position.y = limits[3];
				obj.trigger("collideVertical", y);
			}
		}
	
	}
	
	this.collideObject(obj);
}
Game.prototype.collideObject = function(obj) {
	var hitbox = obj.bounds();
	var area = new Line( 
		new Point(hitbox.start.x - obj.width, hitbox.start.y - obj.height),
		new Point(hitbox.end.x + obj.width, hitbox.end.y + obj.height) 
	);
	
	if( obj.interactive ) {
		//Collide with other objects
		var objs = this.interactive.get( area );
		
		for(var o=0; o < objs.length; o++ ){
			if( objs[o] != obj ) {
				if( obj.intersects( objs[o] ) ){
					obj.trigger("collideObject", objs[o]);
					objs[o].trigger("collideObject", obj);
				}
			}
		}
	}
	
}
Game.prototype.t_move2 = function(obj, x, y) {
	
	var special = function(x,y,t){
		var corner = new Point(Math.floor(x/16)*16,Math.floor(y/16)*16);
		var highest = 9999999;
		var hit = false;
		if( t == 140 ){
			hit = true;
			highest = Math.min( corner.y + 16 - (hitbox.right() - corner.x), highest);
		}
		
		highest -= hitbox.bottom() - obj.position.y;
		obj.position.y = Math.min( highest - (hitbox.bottom()-obj.position.y), obj.position.y );
		return hit;
	}
	
	var bounds = {
		"right" : function(){ 
			for(var y=hitbox.top(); y <= hitbox.bottom(); y+=16 ){
				var tile = game.getTile( new Point(hitbox.right(), y) );
				if( !special(hitbox.right(), y, tile) && tile != 0 ) return true;
			}
			//if( game.getTile( new Point(hitbox.right(), hitbox.bottom())) != 0 ) return true;
			return false;
		},
		"left" : function(){ 
			for(var y=hitbox.top(); y <= hitbox.bottom(); y+=16 ){
				var tile = game.getTile( new Point(hitbox.left(), y) );
				if( !special(hitbox.left(), y, tile) && tile != 0 ) return true;
			}
			//if( game.getTile( new Point(hitbox.left(), hitbox.bottom())) != 0 ) return true;
			return false;
		},
		"top" : function(){ 
			for(var x=hitbox.left(); x <= hitbox.right(); x+=16 ){
				var tile = game.getTile( new Point(x, hitbox.top()) );
				if( !special(x, hitbox.top(), tile) && tile != 0 ) return true;
			}
			//if( game.getTile( new Point(hitbox.right(), hitbox.top())) != 0 ) return true;
			return false;
		},
		"bottom" : function(){ 
			for(var x=hitbox.left(); x <= hitbox.right(); x+=16 ){
				var tile = game.getTile( new Point(x,hitbox.bottom()) );
				if( !special(x,hitbox.bottom(),tile) && tile != 0 ) return true;
			}
			//if( game.getTile( new Point(hitbox.right(), hitbox.bottom())) != 0 ) return true;
			return false;
		}
	};
	
	//slope \ 139
	//slope / 140
	
	//Unstick
	var hitbox = obj.bounds();
	var area = new Line( 
		new Point(hitbox.start.x - x - obj.width, hitbox.start.y - y - obj.height),
		new Point(hitbox.end.x + x + obj.width, hitbox.end.y + y + obj.height) 
	);
	
	if( obj.interactive ) {
		//Collide with other objects
		var objs = this.interactive.get( area );
		
		for(var o=0; o < objs.length; o++ ){
			if( objs[o] != obj ) {
				if( obj.intersects( objs[o] ) ){
					obj.trigger("collideObject", objs[o]);
					objs[o].trigger("collideObject", obj);
				}
			}
		}
	}
	
	var interations = Math.ceil( Point.magnitude(x,y) );
	var interation_size = 1.0 / interations;
	
	for(var i=0; i < interations; i++ ){
		
		if( y != 0 || 1 ) {
			//Y collide
			obj.transpose(0, y * interation_size);
			var hitbox = obj.bounds();
			
			for(var b in bounds ) {
				if( bounds[b]() ){
					obj.transpose(0, -y * interation_size);
					obj.trigger("collideVertical", y);
					y = 0;
					break;
				}
			}
		}

		//X collide
		
		
		if( x != 0 || 1 ){
			obj.transpose(x * interation_size, 0);
			var hitbox = obj.bounds();
			for(var b in bounds ) {
				if( bounds[b]() ){
					obj.transpose(-x * interation_size, 0);
					obj.trigger("collideHorizontal", x);
					x = 0;
					break;
				}
			}
		}
		
		obj.trigger("move", x, y );
	}
	
	//Unstick
	var hitbox = obj.bounds();
	
	for(var b in bounds ) {
		if( bounds[b]() ){
			switch(b){
				case "bottom" : obj.transpose(new Point(0,-1)); break;
				case "right" : obj.transpose(new Point(-1,0)); break;
				case "left" : obj.transpose(new Point(1,0)); break;
				case "top" : obj.transpose(new Point(0,1)); break;
			}
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
Game.prototype.isFullscreen = function(){
	var fullscreen = 
		document.fullscreenElement ||
		document.mozFullScreenElement ||
		document.webkitFullscreenElement ||
		document.msFullscreenElement;
	return fullscreen;
}
Game.prototype.fullscreen = function(fs){
	try{
		if( fs ) {
			var fullscreen = 
				Element.prototype.requestFullscreen || 
				Element.prototype.msRequestFullscreen || 
				Element.prototype.mozRequestFullScreen ||
				Element.prototype.webkitRequestFullscreen;
			fullscreen.apply(this.element);
		} else { 
			var cancelscreen = 
				document.exitFullscreen || 
				document.msExitFullscreen || 
				document.mozCancelFullScreen ||
				document.webkitExitFullscreen;
			cancelscreen.apply(document);
		}
		localStorage.setItem("fullscreen", this.isFullscreen());
	} catch (err) {
		console.error("Cannot fullscreen.");
	}
}
Game.prototype.getTile = function( x,y,layer ) {
	if( x instanceof Point ) { layer=y; y=x.y; x=x.x; }
	var ts = 16;
	if(layer == undefined) layer = this.tileCollideLayer;
	x = Math.floor(x/ts);
	y = Math.floor(y/ts);
	var index = (
		(x-this.tileDimension.start.x) +
		Math.floor( (y-this.tileDimension.start.y)*this.tileDimension.width())
	);
	return this.tiles[layer][index] || 0;
}
Game.prototype.setTile = function( x,y,layer,t ) {
	if( x instanceof Point ) { t=layer; layer=y; y=x.y; x=x.x; }
	var ts = 16;
	if(layer == undefined) layer = this.tileCollideLayer;
	x = Math.floor(x/ts);
	y = Math.floor(y/ts);
	var index = (
		(x-this.tileDimension.start.x) +
		Math.floor( (y-this.tileDimension.start.y)*this.tileDimension.width())
	);
	return this.tiles[layer][index] = t;
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
		if( line.overlaps(a.bounds()) ) {
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
	var new_bounds = new Line(
		game.tileDimension.start.x*16,
		game.tileDimension.start.y*16,
		game.tileDimension.end.x*16,
		game.tileDimension.end.y*16
	);
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

//Constants
Game.MAX_RATIO = 1.7777777777777777777777777777778;
Game.DELTASECOND = 33.33333333;
Game.DELTADAY = 2880000.0;
Game.DELTAYEAR = 1036800000.0;
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
	this.zIndex = 0;
	this.awake = true;
	this.interactive = true;
	this.properties = false;
	this.events = {};
	this.delta = 0;
	this.deltaUnscaled = 0;
	this.deltaScale = 1.0;
	this.filter = false;
	
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
GameObject.prototype.corners = function() {
	return {
		"left" : this.position.x + (-this.width*this.origin.x),
		"right" : this.position.x + (this.width*(1.0-this.origin.x)),
		"top" : this.position.y + (-this.height*this.origin.y),
		"bottom" : this.position.y + (this.height*(1.0-this.origin.y))
	};
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
	/*
	var left_width = Math.floor( this.width * this.origin.x );
	var right_width = Math.floor( this.width * (1.0-this.origin.x) );
	var top_height = Math.floor( this.height * this.origin.y );
	var bot_height = Math.floor( this.height * (1.0-this.origin.y) );
	*/
	var left_width =  ( this.width * this.origin.x );
	var right_width = ( this.width * (1.0-this.origin.x) );
	var top_height = ( this.height * this.origin.y );
	var bot_height = ( this.height * (1.0-this.origin.y) );
	
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
	if( this.hasModule(x) ) return;
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
	var margin_x = this.width + 32;
	var margin_y = this.height + 32;
	var screen = new Point( game.width*.5, game.height*.5);
	this.awake = (
		_cam.x > -margin_x && 
		_cam.y > -margin_y && 
		_cam.x-game.resolution.x < margin_x &&
		_cam.y-game.resolution.y < margin_y
	); 
	
	if( current != this.awake ){
		this.trigger( (this.awake ? "wakeup" : "sleep") );
	}
}
GameObject.prototype.shouldRender = function(){
	if(!this.visible) return false;
	if(!this.awake) return false;
	return true;
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
			this.frame, this.frame_row, this.flip, this.filter
		);
	}
}
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
}
GameObject.prototype.destroy = function() {
	this.trigger("destroy");
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
	return false;
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

function Timer(time, interval){
	this.time = this.start = this.previous = this.interval = 0;
	this.set( time, interval );
}

Timer.prototype.set = function(time, interval){
	this.start = time;
	this.time = time;
	this.previous = time-1.0;
	if( interval != undefined ) {
		this.interval = interval;
	}
	if( this.interval instanceof Array ) {
		this.interval = this.interval.sort(function(a,b){return a-b;});
	} else {
		this.nextInterval = this.time;
	}
}
Timer.prototype.tick = function(delta){
	if( delta > 0 ) {
		this.previous = this.time;
		this.time -= delta;
	}
}
Timer.prototype.status = function(delta){
	if( this.time <= 0 ) {
		return false;
	}
	this.tick(delta);
	if( this.interval instanceof Array ) {
		for(var i=0; i < this.interval.length; i++ ){
			if( this.time < this.interval[i] ) {
				return 1 + (this.interval.length - i);
			}
		}
		return 1;
	} else {
		if( this.time <= this.nextInterval ){
			this.nextInterval -= this.interval;
			return true;
		}
		return false;
	}
}

Timer.prototype.at = function(position){
	return position >= this.time && position < this.previous;
}
Timer.prototype.progress = function(delta){
	if( this.interval instanceof Array ) {
		for(var i=this.interval.length-1; i >= 0; i-- ){
			if( this.time > this.interval[i] ) {
				var low = this.interval[i];
				var high = (i+1 in this.interval) ? this.interval[i+1] : this.start;
				return 1.0 - ((this.time-low) / (high-low));
			}
		}
		return 1.0 - (this.time / this.interval[0]);
	} else {
		return 1.0 - (this.time-this.nextInterval / this.interval);
	}
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
Array.prototype.intersection = function(a){
	var out = new Array();
	for(var i=0; i < a.length; i++)
		if(this.indexOf(a[i]) >= 0) 
			out.push(a[i]);
	return out;
}
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
Math.mod = function(x,n){
	if( x >= 0 ) return x % n;
	while(x < 0 ) {
		x += n;
	}
	return x;
}
Math.lerp = function(x,y,delta){
	return x + (y-x) * delta;
}
CanvasRenderingContext2D.prototype.scaleFillRect = function(x,y,w,h){
	this.fillRect(x*pixel_scale,y*pixel_scale,w*pixel_scale,h*pixel_scale);
}
HTMLAudioElement.prototype.playF = function(){
	this.currentTime = 0;
	this.play();
}
