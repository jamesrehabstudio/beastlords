//Game engine for 2D HTML5 games.

// Dependacies: 
// Polygon, Line, Point
// Input

var game, data, input;
var pixel_scale = 2.0;

function loop() {
	game.render();
	
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
	
	this.renderCollisions = true;
	this.gameThread = new Worker("js/base.js");
	
	var self = this;
	this.gameThread.onmessage = function(event){ self.onmessage(event.data); }
	
	this.camera = new Point(0,0);
	this.tint = [1.0,1.0,1.0,1.0];
	this.objects = {};
	this.map = null;
	
	//Per frame datastructures
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
	this.g.clearColor(0,0,0,0);
	
	this.width = Math.floor( this.element.width / pixel_scale );
	this.height = Math.floor( this.element.height / pixel_scale );
	this.renderOrder = [0,1,2,"o",3];
	this.layerCamera = {
		//0 : function(c){ return new Point(c.x*0.9375, c.y); }
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
	
	this.lightBuffer = this.g.createF();
	this.hudBuffer = this.g.createF();
	this.backBuffer = this.g.createF();
	
	if( localStorage.getItem("sfxvolume") ){
		audio.sfxVolume.gain.value = localStorage.getItem("sfxvolume");
	} if( localStorage.getItem("sfxvolume") ){
		audio.musVolume.gain.value = localStorage.getItem("musvolume");
	}
	
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


window.__time = 0;

Game.prototype.onmessage = function(data){
	//Interface with game thread
	
	if("loaddata" in data){
		var profile = data["loaddata"]["profile"] * 1;
		var name = "profile_" + profile;
		try{
			var loaddata = JSON.parse(localStorage.getItem(name));
			this.gameThread.postMessage({"loaddata":loaddata});
		} catch (err){}
	}
	if("savedata" in data){
		//Save sent data to localStorage
		var profile = data["savedata"]["profile"] * 1;
		var savedata  = data["savedata"]["data"];
		var name = "profile_" + profile;
		localStorage.setItem(name,JSON.stringify(savedata));
	}
	
	if("loadmap" in data){
		//load a new map
		this.map = null;
		MapLoader.loadMapTmx("maps/" + data.loadmap);
	}
	
	if("prompt" in data){
		var d = prompt(
			data["prompt"]["message"],
			data["prompt"]["value"]
		);
		this.gameThread.postMessage({"prompt":d});
	}

	if("render" in data) {
		//frame update
		this.objects = data.render;
		this.camera = new Point(data.camera.x, data.camera.y);
		
		if("audio" in data){
			for(var i in data.audio){
				for(var j=0; j < data.audio[i].length; j++){
					audio[i].apply(audio,data.audio[i][j]);
				}
			}
		}
	}
	
	if("settings" in data){
		var settings = data["settings"];
		if("sfxvolume" in settings) audio.sfxVolume.gain.value = settings.sfxvolume;
		if("musvolume" in settings) audio.musVolume.gain.value = settings.musvolume;
		if("fullscreen" in settings) game.fullscreen(settings.fullscreen);
	}
	
	if("tiles" in data){
		for(var layer in data["tiles"]){
			for(var index in data["tiles"][layer]){
				if(layer in game.map.layers && index in game.map.layers[layer]){
					game.map.layers[layer][index] = data["tiles"][layer][index];
				}
			}
		}
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
	this.hudrenderTree = [];
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
				
				if ( obj.hudrender instanceof Function ) {
					this.hudrenderTree.push( obj );
				}else{
					for(var i=0; i < obj.modules.length; i++){
						if("hudrender" in obj.modules[i]){
							this.hudrenderTree.push( obj );
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
	
	if ( input != undefined ) { input.update(); }
}

Game.prototype.renderObject = function(obj){
	if ( input != undefined ) { input.update(); }
	
	try{
		if(obj.type == 0){
			//render sprite
			var sprite = window.sprites[obj.sprite];
			
			sprite.render(
				this.g,
				new Point(obj.x,obj.y),
				obj.frame,
				obj.frame_row,
				obj.flip,
				obj.options
			);
		} else if(obj.type == 1){
			this.g.color = obj.color;
			this.g.scaleFillRect(
				obj.x,
				obj.y,
				obj.w,
				obj.h
			);
		}
	} catch (err){
		
	}
}

Game.prototype.render = function( ) {
	
	var useLightBuffer = false;
	
	this.gameThread.postMessage({
		"input" : input.states,
		"resolution" : {
			"x" : this.resolution.x,
			"y" : this.resolution.y
		}
	});
	
	//this.resolution = new Point(512,512);
	this.g.viewport(0,0,this.resolution.x,this.resolution.y);
	
	//var renderList = this.renderTree.sort(function(a,b){ return a.zIndex - b.zIndex; } );
	//var camera_center = new Point( this.camera.x, this.camera.y );
	
	//Clear buffers
	//this.backBuffer.reset(this.g);
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	//this.backBuffer.use(this.g);
	//this.g.clear(this.g.COLOR_BUFFER_BIT);
	//this.lightBuffer.use(this.g);
	//this.g.clear(this.g.COLOR_BUFFER_BIT);
	this.hudBuffer.use(this.g);
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.g.enable(this.g.BLEND);
	
	if("prerender" in this.objects){
		this.backBuffer.use(this.g);
		for(var i=0; i < this.objects["prerender"].length; i++){
			this.renderObject( this.objects["prerender"][i] ); 
		}
		this.backBuffer.reset(this.g);
	}
	
	for(var order=0; order < this.renderOrder.length; order++){
		this.backBuffer.use(this.g);
		if(this.renderOrder[order] == "o"){
			if("render" in this.objects){
				for(var i=0; i < this.objects["render"].length; i++){
					this.renderObject( this.objects["render"][i] ); 
				}
			}
		} else {
			//Render Tile Layer
			if(this.map && this.renderOrder[order] in this.map.layers){
				var layer = this.map.layers[this.renderOrder[order]];
				var tilesprite = window.tiles[this.map.tileset];
				if(layer.length >= this.map.width){
					tilesprite.render(
						this.g,
						this.camera,
						layer,
						this.map.width
					);
				}
			}
		}
		this.backBuffer.reset(this.g);
	}
	
	if("postrender" in this.objects){
		this.backBuffer.use(this.g);
		for(var i=0; i < this.objects["postrender"].length; i++){
			this.renderObject( this.objects["postrender"][i] ); 
		}
		this.backBuffer.reset(this.g);
	}
	
	if("lightrender" in this.objects){
		//Use light buffer to render lights
		this.lightBuffer.use(this.g);
		//Black out buffer, effectively clearing it
		this.g.color = [0,0,0,1];
		this.g.scaleFillRect(0,0,this.resolution.x,this.resolution.y);
		//Set blend mode to multiply
		this.g.blendFunc(this.g.ONE, this.g.ONE );
		for(var i=0; i < this.objects["lightrender"].length; i++){
			useLightBuffer = true;
			this.renderObject( this.objects["lightrender"][i] ); 
		}
		//reset
		this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
		this.lightBuffer.reset(this.g);
	}
	
	
	if("hudrender" in this.objects){
		this.hudBuffer.use(this.g);
		for(var i=0; i < this.objects["hudrender"].length; i++){
			this.renderObject( this.objects["hudrender"][i] ); 
		}
		this.hudBuffer.reset(this.g);
	}
	
	//lightBuffer
	
	/*
	
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
			//Render Tile Layer
			if(this.tiles && this.renderOrder[o] in this.tiles){
				var layer = this.tiles[this.renderOrder[o]];
				this.tileRules.render(this.g,this.camera,layer,this.tileDimension.width());
			}
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
	
	//Render Hud
	//this.hudBuffer.use(this.g);
	for ( var i in this.hudrenderTree ) {
		var obj = this.hudrenderTree[i];
		if ( obj instanceof GameObject ) {
			if(obj.hudrender instanceof Function){
				obj.hudrender(this.g, camera_center);
			}
			for(var i=0; i < obj.modules.length; i++){
				if( "hudrender" in obj.modules[i] ) {
					obj.modules[i].hudrender.apply(obj,[this.g, camera_center]);
				}
			}
		}
	}
	//this.hudBuffer.reset(this.g);
	
	
	//Debug, show collisions
	if ( window.debug && this.lines instanceof BSPTree ) {
		var lines = this.lines.get(new Line(this.camera.x-32,this.camera.y-32,this.camera.x+game.width+32,this.camera.y+game.height+32));
		for ( var i = 0; i < lines.length; i++ ){
			lines[i].render( this.g, camera_center );
		}
	}
	*/
	
	this.g.viewport(0,0,this.element.width,this.element.height);
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	this.g.renderBackbuffer(this.backBuffer.texture, this.tint);
	
	if(useLightBuffer){
		this.g.blendFunc(this.g.DST_COLOR, this.g.Zero );
		this.g.renderBackbuffer(this.lightBuffer.texture);
	}
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	this.g.renderBackbuffer(this.hudBuffer.texture);
	//this.g.renderImage(0,0,this.resolution.x,this.resolution.y, this.backBuffer.texture);
	
	this.g.flush();
}
Game.prototype.useMap = function( m ) {
	this.gameThread.postMessage(m);
	this.map = {
		"layers" : m.layers,
		"width" : m.width,
		"height" : m.height,
		"tileset" : m.tileset
	};
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

function Tileset(sprite,rules,animation){
	this.sprite = sprite;
	this.blank = 1024;
	this.special = rules;
	this.animation = animation;
}
Tileset.prototype.use = function(g){
	g.tileSprite = this.sprite;
	g.tileRules = this;
	BLANK_TILE = this.blank;
}
Tileset.prototype.collide = function(t,axis,v,pos,hitbox,limits,start_hitbox){
	if(t <= 0){
		return limits;
	}else{
		if(t in this.special){
			return this.special[t](axis,v,pos,hitbox,limits,start_hitbox);
		} else{
			return Tileset.block(axis,v,pos,hitbox,limits,start_hitbox);
		}
	}
}
Tileset.prototype.render = function(g,c,tiles,width){
	BLANK_TILE = this.blank;
	this.sprite.renderTiles(g,tiles,width,c.x,c.y,this.animation);
}
Tileset.ts = 16;
Tileset.block = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		if(v>0) limits[1] = Math.min(limits[1], pos.y);
		if(v<0) limits[3] = Math.max(limits[3], pos.y + Tileset.ts);
	} else {
		if(v>0) limits[0] = Math.min(limits[0], pos.x);
		if(v<0) limits[2] = Math.max(limits[2], pos.x + Tileset.ts);
	}
	return limits;
}
Tileset.slope_1tohalf = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y) + Math.max((hitbox.left-pos.x)*0.5, 1);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.onewayup = function(axis,v,pos,hitbox,limits,start_hitbox){
	//one way blocks
	if(axis == 0){
		if(v > 0 && start_hitbox.bottom <= pos.y){
			limits[1] = Math.min(limits[1], pos.y);
		}
	}
	return limits;
}
Tileset.slope_halfto0 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y+(Tileset.ts*0.5)) + Math.max((hitbox.left-pos.x)*0.5, 1);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.slope_1to0 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y) + Math.max(hitbox.left-pos.x, 1);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.slope_0to1 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y+Tileset.ts) + Math.max(pos.x-hitbox.right, 1-Tileset.ts);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.slope_0tohalf = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y+Tileset.ts) + Math.max((pos.x-hitbox.right) * 0.5, 1-Tileset.ts*0.5);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.slope_halfto1 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y+Tileset.ts) + Math.max((pos.x-(hitbox.right+Tileset.ts)) * 0.5, 1-Tileset.ts);
		limits[1] = Math.min(limits[1], peak-1);
	}
	return limits;
}
Tileset.ceil_0to1 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = pos.y + Math.min(hitbox.right-pos.x,16);
		limits[3] = Math.max(limits[3], peak+1);
	}
	return limits;
}
Tileset.ceil_1to0 = function(axis,v,pos,hitbox,limits){
	if(axis == 0){
		var peak = (pos.y+Tileset.ts) - Math.max(hitbox.left-pos.x, 1);
		limits[3] = Math.max(limits[3], peak+1);
	}
	return limits;
}
Tileset.edge_left = function(axis,v,pos,hitbox,limits){
	if(axis == 1){
		var center = (hitbox.left + hitbox.right) * 0.5;
		if(center > pos.x){
			//obj on right side
			limits[2] = pos.x;
		} else {
			//obj on left side
			limits[0] = pos.x;
		}
	}
	return limits;
}
Tileset.edge_right = function(axis,v,pos,hitbox,limits){
	if(axis == 1){
		var center = (hitbox.left + hitbox.right) * 0.5;
		if(center > pos.x+Tileset.ts){
			//obj on right side
			limits[2] = pos.x+Tileset.ts;
		} else {
			//obj on left side
			limits[0] = pos.x+Tileset.ts;
		}
	}
	return limits;
}
Tileset.ignore = function(axis,v,pos,hitbox,limits){
	return limits;
}

CanvasRenderingContext2D.prototype.scaleFillRect = function(x,y,w,h){
	this.fillRect(x*pixel_scale,y*pixel_scale,w*pixel_scale,h*pixel_scale);
}
HTMLAudioElement.prototype.playF = function(){
	this.currentTime = 0;
	this.play();
}
