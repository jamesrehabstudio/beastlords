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
	this.gameTime = 0.0;
	this.gameTimeScaled = 0.0;
	
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
	
	this.finalBuffer = new BackBuffer();
	this.finalBufferCRT = new BackBuffer(undefined, {"fs" : "fragment-crt"});
	this.finalBufferNES = new BackBuffer(undefined, {"fs" : "fragment-palletswap", "settings":{"u_colorgrid":"nescolors"} });
	this.finalBufferGBP = new BackBuffer(undefined, {"fs" : "fragment-palletswap", "settings":{"u_colorgrid":"dotmatcolors"} });
	this.finalBufferBLD = new BackBuffer(undefined, {"fs" : "fragment-highcontrast"});
	
	this.lightBuffer = new BackBuffer(undefined, {"mixtype":Material.MIX_MULTIPLY});
	this.hudBuffer = new BackBuffer();
	this.postBuffer = new BackBuffer();
	this.tileBuffer = new BackBuffer();
	this.objectPostBuffer = new BackBuffer();
	this.objectBuffer = new BackBuffer();
	this.backBuffer = new BackBuffer();
	
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
			if(profile >= 0){
				var loaddata = JSON.parse(localStorage.getItem(name));
				this.gameThread.postMessage({"loaddata":loaddata});
			} else {
				var alldata = {};
				for(var i=0; i < 3; i++){
					var name = "profile_" + i;
					if(localStorage.getItem(name)){
						alldata[i] = JSON.parse(localStorage.getItem(name));
					}
				}
				this.gameThread.postMessage({"loaddata":alldata});
			}
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
	if("clearAll" in data){
		for(let i in sprites) if(sprites[i] instanceof Sprite){ sprites[i].unload(); }
		this.map = null;
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
		let oldRenderTargets = this.objects.renderTargets || {};
		
		this.objects = data.render;
		this.camera = new Point(data.camera.x, data.camera.y);
		
		
		for(let rname in oldRenderTargets){
			if(!(rname in this.objects.renderTargets)){
				this.objects.renderTargets[rname] = oldRenderTargets[rname];
			}
		}
		
		
		if("audio" in data){
			for(var i in data.audio){
				for(var j=0; j < data.audio[i].length; j++){
					audio[i].apply(audio,data.audio[i][j]);
				}
			}
		}
	}
	if("loadSprites" in data){
		for(let i=0; i < data["loadSprites"].length; i++){
			if(data["loadSprites"][i] in sprites){
				sprites[ data["loadSprites"][i] ].load();
			}
		}
	}
	if("loadAudio" in data){
		for(let i=0; i < data["loadAudio"].length; i++){
			if(data["loadAudio"][i] in AudioPlayer.list){
				AudioPlayer.list[ data["loadAudio"][i] ].load();
			}
		}
	}
	
	if("ga_event" in data){		
		let arg = ["send","event"].concat( data["ga_event"] );
		ga.apply(window, arg);
	}
	
	if("settings" in data){
		this.applySettings( data["settings"] );
	}
	
	if("times" in data){
		this.gameTime = data["times"].time;
		this.gameTimeScaled = data["times"].timeScaled;
	}
	
	if("tiles" in data && game.map){
		for(var layer in data["tiles"]){
			if(layer == "tileset"){
				//Tileset
				game.map.tileset = data["tiles"][layer];
			} else {
				//Tiles
				for(var index in data["tiles"][layer]){
					if(layer in game.map.layers && index in game.map.layers[layer]){
						game.map.layers[layer][index] = data["tiles"][layer][index];
					}
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
				new Point(obj.x,obj.y),
				obj.frame,
				obj.frame_row,
				obj.flip,
				obj.options
			);
		} else if(obj.type == 1){
			//Render rectangle
			this.g.color = obj.color;
			this.g.scaleFillRect(
				obj.x,
				obj.y,
				obj.w,
				obj.h,
				obj.options
			);
		} else if(obj.type == 2){
			//Render mesh
			var mesh;
			if(obj.mesh.startsWith("lm_")){
				mesh = window.lightMeshes[obj.mesh];
			} else {
				mesh = window.meshes[obj.mesh];
			}
			
			mesh.render(
				new Vector(obj.x,obj.y,obj.z),
				obj.options
			);
		}
	} catch (err){
		
	}
}

var debug_stop_render = false;

Game.prototype.render = function( ) {
	if( debug_stop_render ) { return; }
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
	this.g.cullFace(this.g.BACK);
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
	
	//Clear buffers
	this.hudBuffer.useBuffer();
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.objectBuffer.useBuffer();
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.objectPostBuffer.useBuffer();
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.tileBuffer.useBuffer();
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.postBuffer.useBuffer();
	this.g.clear(this.g.COLOR_BUFFER_BIT);
	
	this.g.enable(this.g.BLEND);
	
	var options = {};
	if("options" in this.objects){
		if("tint" in this.objects.options){
			this.tint = this.objects.options.tint;
		}
	}
	
	
	if("prerender" in this.objects){
		this.backBuffer.useBuffer();
		for(var i=0; i < this.objects["prerender"].length; i++){
			this.renderObject( this.objects["prerender"][i] ); 
		}
		this.backBuffer.reset(this.g);
	}
	
	sprites.backbuff = this.backBuffer;
	
	var renderOrder = ["o"];
	if(this.map != undefined && this.map.order instanceof Array){
		renderOrder = this.map.order;
	}
	
	if( this.objects.renderTargets ) for(let target in this.objects.renderTargets){
		let props = this.objects.renderTargets[target];
		if( !(target in sprites ) ) {
			let size = Math.max(props.width, props.height);
			sprites[target] = new Sprite("", {force_load:true, width:size, height:size});
			BackBuffer.prototype.createFrameBuffer.apply(sprites[target]);
		}
		
		BackBuffer.prototype.useBuffer.apply(sprites[target]);
		this.g.clear(this.g.COLOR_BUFFER_BIT);
		//this.g.viewport(0,0,props.width, props.height);
		
		let spriteList = this.objects.renderTargets[target].draw;
		for(let i=0; i < spriteList.length; i++ ){
			this.renderObject( spriteList[i] ); 
		}
		
		BackBuffer.prototype.reset.apply(sprites[target]);
		delete this.objects.renderTargets[target];		
	}
	
	//this.g.viewport(0,0,this.resolution.x,this.resolution.y);
	
	let useForground = false;
	for(var order=0; order < renderOrder.length; order++){
		let layer = renderOrder[order];
		if(layer == "o"){
			useForground = true;
			this.objectBuffer.useBuffer();
			if("render" in this.objects){
				for(var i=0; i < this.objects["render"].length; i++){
					this.renderObject( this.objects["render"][i] ); 
				}
			}
		} else {
			if(useForground){
				this.tileBuffer.useBuffer();
			} else {
				this.backBuffer.useBuffer();
			}
			
			//Render Tile Layer
			if(this.map && renderOrder[order] in this.map.layers){
				var properties = this.map.layersProperties[order] || {};
				var scrollScaleX = ("scrollscalex" in properties) ? properties["scrollscalex"] : 1.0;
				var scrollScaleY = ("scrollscaley" in properties) ? properties["scrollscaley"] : 1.0;
				var camera = this.camera.scale(scrollScaleX, scrollScaleY);
				
				tiles[this.map.tileset].render(camera, this.map, layer);
				/*
				var layer = this.map.layers[renderOrder[order]];
				var properties = this.map.layersProperties[renderOrder[order]];
				var tilesprite = window.tiles[this.map.tileset];
				
				
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
				*/
			}
		}
		this.objectBuffer.reset(this.g);
	}
	
	if("objectpostrender" in this.objects){
		this.objectPostBuffer.useBuffer();
		for(var i=0; i < this.objects["objectpostrender"].length; i++){
			this.renderObject( this.objects["objectpostrender"][i] ); 
		}
		this.objectPostBuffer.reset(this.g);
	}
	
	if("postrender" in this.objects){
		this.postBuffer.useBuffer();
		for(var i=0; i < this.objects["postrender"].length; i++){
			this.renderObject( this.objects["postrender"][i] ); 
		}
		this.postBuffer.reset(this.g);
	}
	
	if("lightrender" in this.objects){
		//Use light buffer to render lights
		this.lightBuffer.useBuffer();
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
		this.hudBuffer.useBuffer();
		for(var i=0; i < this.objects["hudrender"].length; i++){
			this.renderObject( this.objects["hudrender"][i] ); 
		}
		
		//render FPS
		this.renderFPS();
		
		this.hudBuffer.reset(this.g);
	}
	
	let fBuffer = this.finalBuffer;
	switch ( Game.Settings.filter ) {
		case 1 : fBuffer = this.finalBufferCRT; break;
		case 2 : fBuffer = this.finalBufferBLD; break;
		case 3 : fBuffer = this.finalBufferNES; break;
		case 4 : fBuffer = this.finalBufferGBP; break;
	}
	fBuffer.useBuffer();
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	//this.g.renderBackbuffer(this.backBuffer.texture);
	this.backBuffer.render();
	
	this.objectBuffer.render();
	
	this.objectPostBuffer.render();
	
	this.tileBuffer.render();
	
	this.postBuffer.render();
	
	
	if(useLightBuffer){
		//this.g.blendFunc(this.g.DST_COLOR, this.g.Zero );
		this.lightBuffer.render();
		//this.g.renderBackbuffer(this.lightBuffer.texture);
	}
	
	this.g.blendFunc(this.g.SRC_ALPHA, this.g.ONE_MINUS_SRC_ALPHA );
	this.hudBuffer.render();
	//this.g.renderBackbuffer(this.hudBuffer.texture);
	
	
	this.g.viewport(0,0,this.element.width,this.element.height);
	fBuffer.reset(this.g);
	fBuffer.render(this.tint);
	
	this.g.flush();
}
Game.prototype.renderFPS = function(){
	if(this.frameCounter == undefined){
		this.frameCounter = 0;
		this.lastFrameCount = 0;
		this.time = new Date() * 1;
	}
	
	this.frameCounter++;
	let now = new Date() * 1;
	
	if(now - this.time >= 1000){
		this.time = now;
		this.lastFrameCount = "" + this.frameCounter;
		this.frameCounter = 0;
	}
	for(let i=0; i < this.lastFrameCount.length; i++){
		let code = this.lastFrameCount.charCodeAt(i) - 48;
		let frame = new Point(code, 1);
		sprites.text.render(new Point(i*8,0),frame.x,frame.y,false,{});
	}
	
	if(audio.debug){
		audio.analysis.getByteTimeDomainData(audio.audiodebug);
		for(let i=0; i < 480 && i < audio.audiodebug.length; i++){
			sprites.white.render(new Point(i,56 + audio.audiodebug[i]*0.5),0,0,false,{});
		}
	}
	
	
	
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
		"filename" : m.filename,
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
	
	audio.sfxVolume.gain.value = Game.Settings.sfxvolume ** 2;
	audio.musVolume.gain.value = Game.Settings.musvolume ** 2;
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
			Element.prototype.requestFullscreen.apply(this.element).then(function(){}, function(){});
			/*
			var fullscreen = 
				Element.prototype.requestFullscreen || 
				Element.prototype.msRequestFullscreen || 
				Element.prototype.mozRequestFullScreen ||
				Element.prototype.webkitRequestFullscreen;
			fullscreen.apply(this.element);
			*/
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
	//this.sprite.renderTiles(g,tiles,width,c.x,c.y,this.animation);
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
