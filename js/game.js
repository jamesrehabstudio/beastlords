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
		this.list[l]["lastplayed"] = 0;
		this.list[l]["playcount"] = 0;
		
		
		if( "playOnLoad" in this.list[l] ){
			this.play(l);
		}
	}
}
AudioPlayer.prototype.isReady = function(l, gain){
	if(gain === undefined){
		gain = 1;
	}
	var time = game.time * 1;
	if(l in this.list){
		if(this.list[l]["lastplayed"] + 250 > time){
			this.list[l]["playcount"] += gain;
			if(this.list[l]["playcount"] > 4){
				return false;
			} else {
				return true;
			}
		} else {
			this.list[l]["lastplayed"] = time;
			this.list[l]["playcount"] = gain;
			return true;
		}
	}
	return false;
}

AudioPlayer.prototype.play = function(l){
	if(l in this.list ){
		if( "buffer" in this.list[l] ) {
			if( this.isReady(l) ){
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
			}
		} else {
			this.list[l]["playOnLoad"] = true;
		}
	} else {
		console.error("Trying to play a sound that does not exist");
	}
}
AudioPlayer.prototype.playPan = function(l,balance,gain){
	if(l in this.list ){
		if( "buffer" in this.list[l] ) {
			if( this.isReady(l, gain) ){
				var b = this.list[l]["buffer"];
				this.list[l]["source"] = this.a.createBufferSource();
				this.list[l]["source"].buffer = b;
				
				var volume = this.a.createGain();
				var stereo = audio.a.createStereoPanner();
				volume.gain.value = gain;
				stereo.pan.value = balance;
				var mix = volume.connect(stereo)
				
				if( "loop" in this.list[l] ) {
					this.list[l]["source"].loop = true;
					this.list[l]["source"].loopStart = this.list[l]["loop"];
					this.list[l]["source"].loopEnd = b.length / b.sampleRate;
				}
				
				if( "music" in this.list[l]) {
					this.list[l]["source"].connect(this.musVolume).connect(stereo).connect(volume);
				} else {
					stereo.connect(this.sfxVolume);
					volume.connect(stereo);
					this.list[l]["source"].connect(volume);
				}
				
				this.list[l]["source"].start();
			}
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
	
	window.game = this;
	this.renderCollisions = true;
	this.gameThread = new Worker("js/base.js");
	
	var self = this;
	this.gameThread.onmessage = function(event){ self.onmessage(event.data); }
	
	this.camera = new Point(0,0);
	this.tint = [1.0,1.0,1.0,1.0];
	this.filter = 0;
	this.objects = {};
	this.map = null;
	
	//Per frame datastructures
	this.time = new Date();
	this.fps = 1;
	
	this.pause = false;
	this.slowdown = 1.0;
	this.slowdown_time = 0.0;
	
	this.element = elm;
	this.g = elm.getContext('webgl', {"alpha":false});
	this.g.clearColor(0,0,0,0);
	
	this.width = Math.floor( this.element.width / pixel_scale );
	this.height = Math.floor( this.element.height / pixel_scale );
	this.layerCamera = {
		//0 : function(c){ return new Point(c.x*0.9375, c.y); }
	}
	this.resolution = new Point(256,240);
	this.cameraMatrix = new Matrix2D().scale(2/this.resolution.x,2/this.resolution.y);
	
	this.g.pixelStorei(this.g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA);
	//this.g.scaleFillRect = function(){};
	this.g.beginPath = function(){};
	this.g.closePath = function(){};
	
	this.finalBuffer = this.g.createF();
	this.lightBuffer = this.g.createF();
	this.hudBuffer = this.g.createF();
	this.backBuffer = this.g.createF();
	
	this._id_index = 0;
	this._objectsDeleteList = new Array();
	
	this.loadSettings();
	
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
	
	this.cameraMatrix = new Matrix2D().scale(2/this.resolution.x,-2/this.resolution.y).transition(this.resolution.x*-0.5,this.resolution.y*-0.5);
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
		this.applySettings( data["settings"] );
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
	

Game.prototype.renderObject = function(obj){
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
				obj.h,
				obj.options
			);
		}
	} catch (err){
		
	}
}

Game.prototype.render = function( ) {
	if ( input != undefined ) { input.update(); }
	var useLightBuffer = false;
	
	this.gameThread.postMessage({
		"input" : input.serialize(),
		"resolution" : {
			"x" : this.resolution.x,
			"y" : this.resolution.y
		},
		"settings" : Game.Settings
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
	
	var options = {};
	if("options" in this.objects){
		if("tint" in this.objects.options){
			this.tint = this.objects.options.tint;
		}
	}
	
	
	if("prerender" in this.objects){
		this.backBuffer.use(this.g);
		for(var i=0; i < this.objects["prerender"].length; i++){
			this.renderObject( this.objects["prerender"][i] ); 
		}
		this.backBuffer.reset(this.g);
	}
	
	var renderOrder = ["o"];
	if(this.map != undefined && this.map.order instanceof Array){
		renderOrder = this.map.order;
	}
	
	for(var order=0; order < renderOrder.length; order++){
		this.backBuffer.use(this.g);
		if(renderOrder[order] == "o"){
			if("render" in this.objects){
				for(var i=0; i < this.objects["render"].length; i++){
					this.renderObject( this.objects["render"][i] ); 
				}
			}
		} else {
			//Render Tile Layer
			if(this.map && renderOrder[order] in this.map.layers){
				var layer = this.map.layers[renderOrder[order]];
				var properties = this.map.layersProperties[renderOrder[order]];
				var tilesprite = window.tiles[this.map.tileset];
				var camera = this.camera.scale(1);
				
				if("scrollscale" in properties){
					camera = camera.scale(properties.scrollscale);
				}
				if("scrolloffset_x" in properties){
					camera = camera.add(new Point(properties.scrolloffset_x,0));
				}
				if("scrolloffset_y" in properties){
					camera = camera.add(new Point(0,properties.scrolloffset_y));
				}
				
				if(layer.length >= this.map.width){
					tilesprite.render(
						this.g,
						camera,
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
		
		//render FPS
		this.renderFPS();
		
		this.hudBuffer.reset(this.g);
	}
	
	this.finalBuffer.use(this.g);
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	this.g.renderBackbuffer(this.backBuffer.texture);
	
	if(useLightBuffer){
		this.g.blendFunc(this.g.DST_COLOR, this.g.Zero );
		this.g.renderBackbuffer(this.lightBuffer.texture);
	}
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	this.g.renderBackbuffer(this.hudBuffer.texture);
	
	this.g.viewport(0,0,this.element.width,this.element.height);
	this.finalBuffer.reset(this.g);
	this.g.renderBackbuffer(this.finalBuffer.texture, this.tint, {
		"shader":Game.Filters[this.filter]
	});
	
	this.g.flush();
}
Game.prototype.renderFPS = function(){
	var frameTime = new Date() - this.time;
	this.time = new Date();
	
	this.fps = Math.lerp(this.fps, frameTime,0.1);
	var length = (1 / this.fps) * 400;
	var clerp = length / 24;
	
	var start = this.resolution.x - 32;
	var fps = this.delta;
	
	/*
	this.g.color = [1,1,1,1];
	this.g.scaleFillRect(start-1, 240-17, 26, 10);
	
	this.g.color = [0,0,0,1];
	this.g.scaleFillRect(start, 240-16, 24, 8);
	
	this.g.color = [1-clerp,clerp,.4,1,];
	this.g.scaleFillRect(start, 240-16, length, 8);
	*/
}
Game.prototype.useMap = function( m ) {
	this.gameThread.postMessage(m);
	this.map = {
		"layers" : m.layers,
		"layersProperties" : m.layersProperties,
		"width" : m.width,
		"height" : m.height,
		"tileset" : m.tileset,
		"order" : m.order,
		"collisionLayer" : m.collisionLayer
	};
}
Game.prototype.loadSettings = function() {
	try{
		var s = JSON.parse(localStorage.getItem("global"));		
		this.applySettings(s);
	} catch(e){}
}
Game.prototype.applySettings = function( s ) {
	if(s instanceof Object){
		for(var i in s){
			Game.Settings[i] = s[i];
		}
	}
	
	audio.sfxVolume.gain.value = Game.Settings.sfxvolume;
	audio.musVolume.gain.value = Game.Settings.musvolume;
	this.fullscreen(Game.Settings.fullscreen);
	this.filter = Game.Settings.filter;
	
	localStorage.setItem("global", JSON.stringify(Game.Settings));
}
Game.prototype.isFullscreen = function(){
	var fullscreen = 
		document.isFullScreen ||
		document.webkitIsFullScreen;
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
	Game.Settings.fullscreen = fs;
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
Game.Settings = {
	"sfxvolume" : 1.0,
	"musvolume" : 0.5,
	"fullscreen" : false,
	"filter" : 0
}
Game.Filters = [
	"backbuffer",
	"backbuffercrt",
	"backbuffercolorblind",
	"backbuffernes",
	"backbuffergb"
];

//Constants
Game.MAX_RATIO = 1.7777777777777777777777777777778;
Game.DELTASECOND = 33.33333333;
Game.DELTADAY = 2880000.0;
Game.DELTAYEAR = 1036800000.0;

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
