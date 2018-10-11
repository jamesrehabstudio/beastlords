importScripts("maths.js");

audio = {
	"alias" : {},
	"out" : {},
	"play" : function(name,position,falloff){
		if(position === undefined){
			//Play sound as is
			if(!("play" in audio.out)) audio.out["play"] = new Array();
			audio.out["play"].push([name]);
		} else {
			//Apply panning and falloff
			if(!("playPan" in audio.out)) audio.out["playPan"] = new Array();
			if(falloff === undefined) falloff = 1;
			
			var scale = 180;
			var center = game.camera.add(new Point(game.resolution.x*0.5,game.resolution.y*0.5));
			var distance = position.subtract(center);
			var balance = Math.max(Math.min(Math.subtractToZero(distance.x, scale)/ scale,1),-1);
			var gain = 1.0 - Math.max(Math.min(Math.subtractToZero(distance.length(),scale) / (scale*falloff),1),0);
			
			audio.out["playPan"].push([name, balance, gain]);
		}
	},
	"playAs" : function(name,alias){
		if(this.get(alias) != name){
			this.alias[alias] = name;
			if(!("playAs" in audio.out)) audio.out["playAs"] = new Array();
			audio.out["playAs"].push([name,alias]);
		}
	},
	"playLock" : function(name,duration){
		if(!("playLock" in audio.out)) audio.out["playLock"] = new Array();
		audio.out["playLock"].push([name,duration]);
	},
	"stopAs" : function(alias){
		this.alias[alias] = "";
		if(!("stopAs" in audio.out)) audio.out["stopAs"] = new Array();
		audio.out["stopAs"].push([alias]);
	},
	"serialize" : function(){
		return audio.out;
	},
	"clear" : function(){
		audio.out = {};
	},
	"get" : function(alias){
		if(alias in this.alias){
			return this.alias[alias];
		}
		return "";
	}
}

RENDER_STEPS = ["prerender","render","objectpostrender","postrender","hudrender","lightrender"];

Renderer = {
	color : [1,1,1,1],
	tint : [1,1,1,1],
	layers : [new Array(),new Array(),new Array(),new Array(),new Array(),new Array()],
	layer : 1
}
Renderer.clear = function(){
	Renderer.color = [1,1,1,1];
	Renderer.layers = [new Array(),new Array(),new Array(),new Array(),new Array(),new Array()];
	Renderer.layer = 1;
}
Renderer.serialize = function(){
	var out = {
		"options" : {
			"tint" : this.tint
		}
	};
	for(var i=0; i < RENDER_STEPS.length; i++){
		if(Renderer.layers[i] instanceof Array){
			out[RENDER_STEPS[i]] = Renderer.layers[i];
		} else {
			out[RENDER_STEPS[i]] = new Array();
		}
	}
	return out;
}
Renderer.renderSprite = function(sprite,pos,z,frame,flip,options){
	var f = 0; var fr = 0;
	if(frame instanceof Point){
		f = Math.floor(frame.x);
		fr = Math.floor(frame.y);
	} else {
		f = Math.floor(frame);
	}
	
	Renderer.layers[Renderer.layer].insertSort({
		"type" : 0,
		"sprite" : sprite,
		"x" : Math.round(pos.x),
		"y" : Math.round(pos.y),
		"zIndex" : z,
		"frame" : f,
		"frame_row" : fr,
		"flip" : flip,
		"options" : options
	},function(a,b){
		if("zIndex" in b && !isNaN(b.zIndex)){
			if("zIndex" in a && !isNaN(a.zIndex)){
				return a.zIndex - b.zIndex;
			} else {
				return -1;
			}
		}
		return 1;
	});
}
Renderer.drawRect = function(x,y,w,h,z,ops){
	Renderer.renderSprite("white",new Point(x,y),z,new Point(),false,{
		scalex : w,
		scaley : h,
		u_color : Renderer.color
	});
}
Renderer.scaleFillRect = function(x,y,w,h,ops){
	if(x instanceof Point){
		ops = h;
		h = w;
		w = y;
		y = x.y;
		x = x.x;
	}
	
	Renderer.layers[Renderer.layer].insertSort({
		"type" : 1,
		"color" : [Renderer.color[0],Renderer.color[1],Renderer.color[2],Renderer.color[3]],
		"x" : x,
		"y" : y,
		"w" : w,
		"h" : h,
		"options" : ops
	},function(a,b){
		if("z" in b){
			return -1;
		}
		return 1;
	});
}
Renderer.renderMesh = function(mesh,pos,z,options){
	pos.z = pos.z || 0;
	Renderer.layers[Renderer.layer].insertSort({
		"type" : 2,
		"mesh" : mesh,
		"x" : Math.round(pos.x),
		"y" : Math.round(pos.y),
		"z" : Math.round(pos.z),
		"zIndex" : z,
		"options" : options
	},function(a,b){
		if("zIndex" in b && !isNaN(b.zIndex)){
			if("zIndex" in a && !isNaN(a.zIndex)){
				return a.zIndex - b.zIndex;
			} else {
				return -1;
			}
		}
		return 1;
	});
}
Renderer.renderLine = function(start,end,thickness,color){
	let length = 0;
	let angle = 0;
	if(start instanceof Point){
		let center = start.add(end).scale(0.5);
		let dot = start.subtract(end);
		angle = Math.atan2(dot.y, dot.x);
		length = dot.length();
	} else{
		length = start.z;
		angle = end;
		end = new Point(start.x, start.y);
	}
	
	if(color == undefined){
		color = [1.0,1.0,1.0,1.0];
	}
	
	Renderer.renderSprite(
		"white", 
		end,
		1,
		new Point(),
		false,
		{
			u_color : color,
			scalex : length,
			scaley : thickness,
			rotate : (angle / Math.PI) * 180
		}
	)
}

//////////////////
//Game controller
//////////////////

function Game(){
	self.game = this;
	
	this.tileCollideLayer = 2;
	this.camera = new Point(0,0);
	this.resolution = new Point(320,240);
	this.map = {};
	this.objects = new Array();
	this.cycleTime = new Date() * 1;
	this.interval = 7;
	this.tree = new BSPTree(new Line(0,0,256,240));
	this._firstEmptyIndex = -1;
	this.tileDelta = {};
	this.mainThreadReady = true;
	this.settingsUpdated = false;
	
	this.deltaScaleReset = 0.0;
	this.deltaScalePause = 0;
	
	this.frameTime = 0;
	this.delta = 1;
	this.deltaUnscaled = 1;
	this.deltaScale = 1.0;
	this.pause = false;
	this.time = 0.0;
	this.timeScaled = 0.0;
	
	this.newmap = false;
	this.newmapName = false;
	this._newmapCallback = false;
	this._loadCallback = false;
	this._promptCallback = false;
	
	if("game_start" in self && self.game_start instanceof Function){
		self.game_start(this);
	}
}

//constants

Game.DELTASECOND = 1.0;
Game.DELTAMINUTE = 60 * Game.DELTASECOND;
Game.DELTAHOUR = 60 * Game.DELTAMINUTE;
Game.DELTADAY = 24 * Game.DELTAHOUR;
Game.DELTAYEAR = Game.DELTADAY * 365.25;
Game.DELTAFRAME30 = Game.DELTASECOND / 30.0;
Game.DELTAFRAME60 = Game.DELTASECOND / 60.0;

Game.prototype.setSetting = function(name,val) {
	Settings[name] = val;
	this.settingsUpdated = true;
}
Game.prototype.slow = function(s,d) {
	if( d > this.deltaScaleReset ) {
		this.deltaScale = s;
		this.deltaScaleReset = d;
	}	
}
Game.prototype.loadMap = function(name, func){
	this._newmapCallback = func;
	this.newmap = true;
	this.newmapName = name;
}
Game.prototype.update = function(){
	//Interval lock
	//while((new Date() * 1)-this.cycleTime < this.interval){}
	
	var newTime = performance.now();
	this.frameTime = newTime - this.cycleTime;
	var baseDelta = Math.clamp(
		this.frameTime * 0.001,
		
		0,
		0.1 * Game.DELTASECOND
	);
	this.deltaUnscaled = baseDelta;
	this.delta = this.deltaUnscaled * this.deltaScale * (this.pause?0:1);
	this.deltaScaleReset -= this.deltaUnscaled;
	this.time = performance.now() * Game.DELTASECOND * 0.001;
	this.timeScaled += this.delta;
	if(this.deltaScaleReset <= 0){
		this.deltaScale = 1.0;
	}
	this.cycleTime = newTime;
	
	if(this.newmap){
		this.clearAll(false);
		postMessage({
			"loadmap" : this.newmapName
		});
		
		this.newmap = false;
		return 0;
	}
	
	let lastValidObject = 0;
	for(var i=0; i < this.objects.length; i++){
		//Update logic loop
		var obj = this.objects[i];
		
		if(obj != undefined){	
			lastValidObject = i;
			obj.idle();
			if( obj.awake ) {
				this.tree.remove(obj);
				
				obj.fullUpdate();
				
				if(obj.interactive && this.objects.indexOf(obj) >= 0){
					this.tree.push(obj);
				}
			}
		}
	}
	//Cut the empty tail
	this.objects = this.objects.slice(0, lastValidObject+1);
	if(this._firstEmptyIndex >= this.objects.length) {this._firstEmptyIndex = -1;}
	
	var fCamera = this.camera.floor();
	
	for(var i=0; i < this.objects.length; i++){
		//Render loop
		var obj = this.objects[i];
		
		if(obj == undefined){
			if(this._firstEmptyIndex < 0){
				this._firstEmptyIndex = i;
			} else {
				this._firstEmptyIndex = Math.min(this._firstEmptyIndex, i);
			}
		} else if(obj.shouldRender()){
			if(self.debug){
				Renderer.layer = RENDER_STEPS.indexOf("render");
				obj.renderDebug(Renderer, fCamera)
			}
			
			for(var j=0; j < RENDER_STEPS.length; j++){
				//try{
					var step = RENDER_STEPS[j];
					Renderer.layer = j;
					if(obj[step] instanceof Function){
						obj[step](Renderer, fCamera);
					}
					
					for(var m=0; m < obj.modules.length; m++){
						if(step in obj.modules[m] ){
							obj.modules[m][step].apply(obj,[Renderer, fCamera]);
						}
					}
					
					obj.useBuff(step, Renderer, fCamera);
				//}catch(err){
					
				//}
			}
		}
	}
	
	if(this.mainThreadReady){
		this.mainThreadReady = false;
		if(this.settingsUpdated){
			self.postMessage({
				"settings" : Settings
			});
			this.settingsUpdated = false;
		}
		
		let fCamera = this.camera.floor();
		postMessage({
			"audio" : audio.serialize(),
			"render" : Renderer.serialize(),
			"camera" : {"x":fCamera.x, "y":fCamera.y},
			"times" : {"time":this.time, "timeScaled":this.timeScaled},
			"tiles" : this.tileDelta
		});
		this.tileDelta = {};
		audio.clear();
	}
	Renderer.clear();
	input.update();
}
Game.prototype.useMap = function(m){
	this.clearAll(false);
	
	this.map = {
		"filename" : m.filename,
		"layers" : m.layers,
		"map" : m.map,
		"tileset" : m.tileset,
		"width" : m.width,
		"height" : m.height
	};
	
	this.mapProperties = {};
	for(let i=0; i < m.layersProperties.length; i++) for(let key in m.layersProperties[i]){
		this.mapProperties[key] = m.layersProperties[i][key];
	}
	this.mapProperties = Options.convert(this.mapProperties);
	
	var splits = Math.floor(Math.max(m.width,m.height)/64);
	this.tree = new BSPTree(new Line(0,0,m.width*16,m.height*16), splits);
	this.tileCollideLayer = m.collisionLayer;
	
	for(var i=0; i < m.objects.length; i++){
		var obj = m.objects[i];
		if(obj.name in self){
			//Create and append new object
			
			//Convert to Points
			let points = new Array();
			for(let j=0; j < obj.points.length;j++){points.push(new Point(obj.points[j].x*1.0, obj.points[j].y*1.0));}
			
			var options = new Options(obj.properties);
			var dimensions = points.length > 0 ? points : [obj.width,obj.height];
			var newobj = new self[obj.name](obj.x,obj.y,dimensions,options);
			this.addObject(newobj);
		}
	}
	
	if(this._newmapCallback instanceof Function){
		this._newmapCallback(m.starts);
	}
}
Game.prototype.getTile = function( x,y,layer ) {
	if( x instanceof Point ) { layer=y; y=x.y; x=x.x; }
	var ts = 16;
	if(layer == undefined) layer = this.tileCollideLayer;
	x = Math.floor(x/ts);
	y = Math.floor(y/ts);
	var index = (x + Math.floor( (y)*this.map.width));
	return this.map.layers[layer][index] || 0;
}
Game.prototype.setTile = function( x,y,layer,t ) {
	if( x instanceof Point ) { t=layer; layer=y; y=x.y; x=x.x; }
	var ts = 16;
	if(layer == undefined) layer = this.tileCollideLayer;
	x = Math.floor(x/ts);
	y = Math.floor(y/ts);
	var index = (x + Math.floor( (y)*this.map.width));
	
	//Set tile delta
	if(!(layer in this.tileDelta)) this.tileDelta[layer] = {};
	this.tileDelta[layer][index] = t;
	
	return this.map.layers[layer][index] = t;
}
Game.prototype.getTileRule = function(x,y,layer){
	var t = this.getTile(x,y,layer);
	var tile = getTileData(t).tile;
	var rules = tilerules.currentrule();
	if(tile == 0){
		return tilerules.ignore;
	} else if(tile in rules){
		return rules[tile];
	} else {
		return tilerules.block;
	}
}
Game.prototype.addObject = function(obj){
	if(obj instanceof GameObject && this.objects.indexOf(obj) < 0){
		if(this._firstEmptyIndex < 0){
			this.objects.push(obj);
		} else {
			this.objects[this._firstEmptyIndex] = obj;
			this._firstEmptyIndex = -1;
		}
		
		obj.trigger("added");
		obj._isAdded = true;
	}
	return obj;
}
Game.prototype.removeObject = function( obj ) {
	//this._objectsDeleteList.push(obj)
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
Game.prototype.clearAll = function(tellEngine = true){
	if(tellEngine){
		postMessage({"clearAll":true});
	}
	
	this.objects = [];
	this._firstEmptyIndex = -1;
	this.map = null;
}
Game.prototype.overlaps = function(l, end){
	var line;
	if( l instanceof Line ) {
		line = l;
	} else if ( l instanceof Point ){
		line = new Line(l, end);
	}
	var near = this.tree.get(line);
	var out = [];
	for(var i=0; i < near.length; i++ ){
		var a = near[i];
		if( line.overlaps(a.bounds()) ) {
			out.push( a );
		}
	}
	return out;
}
Game.prototype.polyOverlaps = function(p){
	let out = new Array();
	let hits = this.overlaps(p.bounds());
	for(let i=0; i < hits.length; i++){
		if( p.intersects(hits[i].hitbox()) ){
			out.push(hits[i]);
		}
	}
	return out;
}
Game.prototype.insideScreen = function(p,margin) {
	if(margin === undefined){
		margin = 0;
	}
	return 	(
		p.x > this.camera.x - margin &&
		p.x < this.camera.x + margin + this.resolution.x &&
		p.y > this.camera.y - margin &&
		p.y < this.camera.y + margin + this.resolution.y
	);
}

Game.prototype.t_unstick = function( obj ) {
	var hitbox = obj.corners();
	obj.isStuck = false;
	var escape = {
		"top" : true,
		"bottom" : true,
		"left" : true,
		"right" : true
	}
	var ts = 16;
	var xinc = obj.width/ Math.ceil(obj.width/ts);
	var yinc = obj.height/ Math.ceil(obj.height/ts);
	var xmid = hitbox.left + Math.floor(obj.width/ts) * 0.5 * xinc;
	var ymid = hitbox.top + Math.floor(obj.height/ts) * 0.5 * xinc;
	for(var _x=hitbox.left; _x<=hitbox.right; _x+=xinc ) {
		for(var _y=hitbox.top; _y <=hitbox.bottom; _y+=yinc ) {
			var tile = this.getTile(_x,_y);
			var tileData = getTileData(tile);
			if( tileData.tile != 0 && !(tileData.tile in tilerules.currentrule()) ) {
				//You're stuck, do something about it!
				obj.isStuck = true;
				
				if( _x == hitbox.left ) escape["left"] = false;
				if( _x == hitbox.right ) escape["right"] = false;
				if( _y == hitbox.top ) escape["top"] = false;
				if( _y == hitbox.bottom ) escape["bottom"] = false;
			}
		}
	}
	if( obj.isStuck ) {
		//Try to escape
		if(escape.left){
			obj.position.x -= 1;
		} else if(escape.right){
			obj.position.x += 1;
		} else if(escape.top){
			obj.position.y -= 1;
		} else if(escape.bottom){
			obj.position.y += 1;
		} else {
			obj.position.x += 1;
		}
	}
	return obj.isStuck;
}
Game.prototype.t_move = function(obj, x, y) {	
	var start_hitbox = obj.corners();
	var interation_size = 1.0;
	var ts = 16;
	var y_pull = 0;
	
	var limits = [
		Number.MAX_SAFE_INTEGER, //Furthest left
		Number.MAX_SAFE_INTEGER, //Furthest down
		-Number.MAX_SAFE_INTEGER, //Furthest right
		-Number.MAX_SAFE_INTEGER //Furthest up
	];
	var margins = [
		obj.position.x - start_hitbox.left,
		obj.position.y - start_hitbox.top,
		obj.position.x - start_hitbox.right,
		obj.position.y - start_hitbox.bottom
	];
	var dirs = [0,1];
	
	if( this.t_unstick(obj) ) {
		this.collideObject(obj);
		return limits;
	}
	
	//for(var dir=0; dir < dirs.length; dir++ ){
	for(var dir=1; dir >= 0; dir-- ){
		
		if( dir == 0 ) 
			obj.transpose(0, y * interation_size);
		else
			obj.transpose(x * interation_size, 0);
		
		var hitbox = obj.corners();
		
		var xinc = obj.width/ Math.ceil(obj.width/ts);
		var yinc = obj.height/ Math.ceil(obj.height/ts);
		
		var addleft = (x<0&&dir==1)?xinc:0;
		var addright = (x>0&&dir==1)?xinc:0;
		var addtop = (y<0&&dir==0)?yinc:0;
		var addbot = (y>0&&dir==0)?yinc:0;
		
		for(var _x=hitbox.left-addleft; _x<=hitbox.right+addright; _x+=xinc )
		for(var _y=hitbox.top-addtop; _y <=hitbox.bottom+addbot; _y+=yinc ) {
			var tile = this.getTile(_x,_y);
			var tileData = getTileData(tile);
			var corner = new Point(Math.floor(_x/ts)*ts, Math.floor(_y/ts)*ts);
			var v = dir==0?y:x;
			limits = tilerules.collide(tileData.tile,dir,v,corner,hitbox,limits,start_hitbox);
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
	return limits;
}
Game.prototype.t_raytrace = function(l,q, check){
	if(l instanceof Point){
		l = new Line(l, q);
	} else {
		check = q;
	}
	if(check == undefined){
		check = function(p){
			return this.getTileRule(p.x, p.y) != tilerules.ignore;
		}
	}
	
	
	var output = {
		"start" : l.start,
		"distance" : l.length(),
		"end" : l.end,
		"collide" : false
	};
	
	var l_distance = l.length();
	var increment = 16;
	
	for(let d=0; d < l_distance; d += increment){
		let percent = d/l_distance;
		let p = Point.lerp(l.start,l.end,percent);
		
		if(check.apply(this,[p])){
			if(increment < 16){
				return p;
			} else {
				d -= increment;
				increment = 1;
			}
		}
	}
	return false;
}

Game.prototype.collideObject = function(obj) {
	if(obj.interactive){
		var objs = this.tree.get(obj.bounds());
		
		for(var i=0; i < objs.length; i++ ){
			if( objs[i] && objs[i] != obj ) {
				var o = objs[i];
				if( obj.intersects( o ) ){
					obj.trigger("collideObject", o);
					o.trigger("collideObject", obj);
				}
			}
		}
	}
}
Game.prototype.ga_event = function(){
	let e = new Array();
	for(let a=0; a < arguments.length; a++){
		e.push(arguments[a]);
	}
	postMessage({
		"ga_event" : e
	})
}
	
Game.prototype.prompt = function(message,value,callback){
	this._promptCallback = callback;
	postMessage({
		"prompt" : {
			"message" : message,
			"value" : value
		}
	});
}
Game.prototype.load = function(callback, profile){
	this._loadCallback = callback;
	if(profile == undefined){ profile = 0;}
	
	postMessage({
		"loaddata" : {
			"profile" : profile
		}
	});
	
}
Game.prototype.save = function(data, profile){
	if(profile == undefined) { profile = 0; }
	postMessage({
		"savedata" : {
			"profile" : profile,
			"data" : data
		}
	});
}


function Sequence(d){
	if(d instanceof Array){
		this.data = {};
		this.total = 0.0;
		
		for(var i=0; i<d.length; i++) this.total += d[i][2];
		
		var cursor = 0.0;
		for(var i=0; i<d.length; i++){
			this.data[cursor] = d[i];
			cursor += d[i][2] / this.total;
		}
	} else {
		this.data = d;
		this.total = 1.0;
	}
}
Sequence.prototype.properties = function(progress){
	var out;
	progress = Math.min(Math.max(progress,0),1);
	for(var i in this.data){
		if(progress >= i){
			out = this.data[i];
		}
	}
	if(out && out.length > 3){
		return out[3];
	}
	return {};
}
Sequence.prototype.frame = function(progress){
	var out;
	progress = Math.min(Math.max(progress,0),1);
	for(var i in this.data){
		if(progress >= i){
			out = this.data[i];
		}
	}
	if(out){
		return new Point(out[0], out[1]);
	}
	return new Point();
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
BSPTree.prototype.toArray = function(){
	let l = new Array();
	let h = new Array();
	if(this.lower instanceof BSPTree) {l = this.lower.toArray(); }
	if(this.higher instanceof BSPTree) {h = this.higher.toArray(); }
	return this.values.concat(l.concat(h));
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

var tilerules = {
	"ts" : 16,
	"VERTICAL" : 0,
	"HORIZONTAL" : 1,
	"currentrule" : function(){
		if(game.map.tileset in tilerules.rules){
			return tilerules.rules[game.map.tileset];
		} else {
			return tilerules.rules["default"];
		}
	},	
	"rules" : {},
	"collide" : function(t,axis,v,pos,hitbox,limits,start_hitbox){
		var rules = tilerules.currentrule();
		if(t <= 0){
			return limits;
		}else{
			if(t in rules){
				return rules[t](axis,v,pos,hitbox,limits,start_hitbox);
			} else{
				return tilerules.block(axis,v,pos,hitbox,limits,start_hitbox);
			}
		}
	},
	"block" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			if(v>0) limits[1] = Math.min(limits[1], pos.y);
			if(v<0) limits[3] = Math.max(limits[3], pos.y + tilerules.ts);
		} else {
			if(v>0) limits[0] = Math.min(limits[0], pos.x);
			if(v<0) limits[2] = Math.max(limits[2], pos.x + tilerules.ts);
		}
		return limits;
	},
	"onewayup" : function(axis,v,pos,hitbox,limits,start_hitbox){
		//one way blocks
		if(axis == tilerules.VERTICAL){
			if(v > 0 && start_hitbox.bottom <= pos.y){
				limits[1] = Math.min(limits[1], pos.y);
			}
		}
		return limits;
	},
	"slope_1tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.max((hitbox.left - pos.x) / tilerules.ts, 0);
			var peak = Math.lerp(pos.y, pos.y+tilerules.ts*0.5, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_halfto0" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.max((hitbox.left - pos.x) / tilerules.ts, 0);
			var peak = Math.lerp(pos.y+tilerules.ts*0.5, pos.y+tilerules.ts, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_1to0" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.max((hitbox.left - pos.x) / tilerules.ts, 0);
			var peak = Math.lerp(pos.y, pos.y+tilerules.ts, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_0to1" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.min((hitbox.right - pos.x) / tilerules.ts, 1);
			var peak = Math.lerp(pos.y+tilerules.ts, pos.y, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_0tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.min((hitbox.right - pos.x) / tilerules.ts, 1);
			var peak = Math.lerp(pos.y+tilerules.ts, pos.y+tilerules.ts*0.5, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_halfto1" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			var maxright = Math.min((hitbox.right - pos.x) / tilerules.ts, 1);
			var peak = Math.lerp(pos.y+tilerules.ts*0.5, pos.y, maxright);
			
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"ceil_0tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && v < 0 && hitbox.top > pos.y){
			var peak = pos.y + Math.min((hitbox.right-pos.x)*0.5,8);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_halfto1" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && v < 0 && hitbox.top > pos.y){
			var peak = pos.y + Math.min(8+(hitbox.right-pos.x)*0.5,16);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_0to1" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && hitbox.top > pos.y){
			var peak = pos.y + Math.min(hitbox.right-pos.x,16);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_1to0" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && hitbox.top > pos.y){
			var peak = (pos.y+tilerules.ts) - Math.max(hitbox.left-pos.x, 1);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_1tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && hitbox.top > pos.y){
			var peak = pos.y + Math.min(Math.max(16-(hitbox.left-pos.x)*0.5,0),8);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_halfto0" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL && v < 0 && hitbox.top > pos.y){
			var peak = pos.y + Math.min(Math.max(8-(hitbox.left-pos.x)*0.5,8),16);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"edge_left" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.HORIZONTAL){
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
	},
	"edge_right" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.HORIZONTAL){
			var center = (hitbox.left + hitbox.right) * 0.5;
			if(center > pos.x+tilerules.ts){
				//obj on right side
				limits[2] = pos.x+tilerules.ts;
			} else {
				//obj on left side
				limits[0] = pos.x+tilerules.ts;
			}
		}
		return limits;
	},
	"wall_slope0tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			
			var maxright = pos.x + Math.clamp( (hitbox.bottom - pos.y) * 0.5, 0, 8 );
			
			limits[2] = Math.max(limits[2], maxright+2);
		}
		return limits;
	},
	"wall_slopehalfto1" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.HORIZONTAL){
			
			var maxright = pos.x + Math.clamp( 8 + (hitbox.bottom - pos.y) * 0.5, 0, 16 );
			
			limits[2] = Math.max(limits[2], maxright+2);
		}
		return limits;
	},
	"wall_slope1tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.VERTICAL){
			
			var maxright = pos.x + tilerules.ts - Math.clamp( (hitbox.bottom - pos.y) * 0.5, 0, 8 );
			
			limits[0] = Math.min(limits[0], maxright-2);
		}
		return limits;
	},
	"wall_slopehalfto0" : function(axis,v,pos,hitbox,limits){
		if(axis == tilerules.HORIZONTAL){
			
			var maxright = pos.x + tilerules.ts - Math.clamp( 8 + (hitbox.bottom - pos.y) * 0.5, 0, 16 );
			
			limits[0] = Math.min(limits[0], maxright-2);
		}
		return limits;
	},
	"ignore" : function(axis,v,pos,hitbox,limits){
		return limits;
	}
}

tilerules.rules["default"] = {};


//////////////////
//Base game object
//////////////////

function GameObject() {
	this.id = -1;
	this.position = new Point();
	this.positionPrevious = new Point();
	this.origin = new Point(0.5, 0.5);
	this.sprite;
	this.width = 8;
	this.height = 8;
	this.frame = new Point(0,0);
	this.flip = false;
	this.zIndex = 0;
	this.awake = true;
	this.interactive = true;
	this.properties = false;
	this.events = {};
	this.delta = 0;
	this.deltaUnscaled = 0;
	this.deltaPrevious = 0;
	this.deltaScale = 1.0;
	this.filter = false;
	this.isStuck = false;
	this.idleMargin = 32;
	this.buffs = new Array();
	this.tint = [1,1,1,1];
	
	this.visible = true;
	this.modules = new Array();
	
	this._isAdded = false;
}
GameObject.prototype.on = function(name, func) {
	if(name instanceof Array){
		for(var i=0; i < name.length; i++){
			this.on(name[i], func);
		}
	} else {
		if( !(name in this.events) ) 
			this.events[name] = [];
		this.events[name].push(func);
	}
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
GameObject.prototype.addBuff = function(buff){
	buff.user = this;
	this.buffs.push(buff);
	this.trigger("addbuff", buff);
}
GameObject.prototype.useBuff = function(name, a,b,c,d,e,f){
	for(var i=0; i < this.buffs.length; i++){
		if(name in this.buffs[i] && this.buffs[i][name] instanceof Function){
			a = this.buffs[i][name](a,b,c,d,e,f);
		}
	}
	return a;
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
GameObject.prototype.corners = function(pos) {
	pos = pos || this.position;
	return {
		"left" : pos.x + (-this.width*this.origin.x),
		"right" : pos.x + (this.width*(1.0-this.origin.x)),
		"top" : pos.y + (-this.height*this.origin.y),
		"bottom" : pos.y + (this.height*(1.0-this.origin.y))
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
GameObject.prototype.fullUpdate = function(){ 
	var mods = this.modules;
	//Set any frame specific values
	this.deltaPrevious = this.delta;
	this.positionPrevious = this.position.scale(1);
	this.delta = game.delta * this.deltaScale;
	this.deltaUnscaled = game.delta;

	//Update Functions
	if ( mods.length > 0 ) {
		for ( var j = 0; j < mods.length; j++ ) {
			if ( mods[j].beforeupdate instanceof Function ) {
				mods[j].beforeupdate.apply(this);
			}
		}
	}
	
	this.update();
		
	//Update buffs
	for(var j=0; j < this.buffs.length; j++){
		this.buffs[j].time -= game.delta;
		if(this.buffs[j].time <= 0){
			this.buffs.remove(j);
			j--;
		}
	}
	this.useBuff("update");
		
	if(this.interactive){
		game.collideObject(this);
	}
	
	if ( mods.length > 0 ) {
		for ( var j = 0; j < mods.length; j++ ) {
			if ( mods[j].update instanceof Function ) {
				mods[j].update.apply(this);
			}
		}
	}
}
GameObject.prototype.update = function(){ }
GameObject.prototype.isOnscreen = function(){
	var corners = this.corners();
	return (
		corners.right + this.idleMargin > game.camera.x &&
		corners.left - this.idleMargin < game.camera.x + game.resolution.x &&
		corners.bottom + this.idleMargin > game.camera.y &&
		corners.top - this.idleMargin < game.camera.y + game.resolution.y
	);
}
GameObject.prototype.idle = function(){
	var current = this.awake;
	
	this.awake = this.isOnscreen();
	
	if( current != this.awake ){
		this.trigger( (this.awake ? "wakeup" : "sleep") );
	}
}
GameObject.prototype.shouldRender = function(){
	if(!this.visible) return false;
	if(!this.awake) return false;
	return true;
}

GameObject.prototype.renderDebug = function( g, camera ){
	var bounds = this.bounds();
	g.color = [1.0,0.5,1.0,1.0];
	g.scaleFillRect(bounds.start.x - camera.x, bounds.start.y - camera.y, bounds.width(), bounds.height() );
}	
GameObject.prototype.render = function( g, camera ){
	if ( this.sprite ) {
		g.renderSprite(
			this.sprite, 
			this.position.subtract(camera),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"shader":this.filter,
				"u_color" : this.tint
			}
		);
	}
}
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
}
GameObject.prototype.forward = function() {
	return this.flip ? -1 : 1;
}
GameObject.prototype.destroy = function() {
	this.trigger("destroy");
	this._isAdded = false;
	var index = game.objects.indexOf(this);
	if( index >= 0 ) {
		//game.objects.remove( index );
		game.objects[index] = undefined;
		if(game._firstEmptyIndex < 0){
			game._firstEmptyIndex = index;
		} else {
			game._firstEmptyIndex = Math.min(game._firstEmptyIndex, index);
		}
		
	}
	game.tree.remove(this);
}



importScripts("platformer.js");

//Start
_player = null;

new Game();

var Settings = {
	"filter" : 0,
	"fullscreen" : false,
	"sfxvolume" : 1.0,
	"musvolume" : 0.5,
	"debugmap" : "testmap.tmx"
}

var input = {
	"states" : {},
	"state" : function(name){
		if(name in this.states){
			return this.states[name];
		}
		return 0;
	},
	"update" : function(){
		for(var i in this.states){
			if(this.states[i] > 0){
				this.states[i]++;
			}
		}
	},
	"refresh" : function(s){
		if(s == undefined){
			return;
		} else {
			for(var i in s){
				if(!(i in this.states)) this.states[i] = 0;
				
				if(s[i] > 0){
					this.states[i] = Math.max(this.states[i], 1);
				} else if(this.states[i] > 1){
					this.states[i] = 0;
				}
			}
		}
	}
}

self.onmessage = function(event){
	if("settings" in event.data){
		for(var i in event.data.settings){
			Settings[i] = event.data.settings[i];
		}
	}
	if("loaddata" in event.data && game._loadCallback instanceof Function) {
		game._loadCallback(event.data["loaddata"]);
	}
	if("prompt" in event.data){
		game._promptCallback(event.data["prompt"]);
	}
	if("input" in event.data){
		//general update
		input.refresh(event.data.input);
		if(game instanceof Game){
			game.mainThreadReady = true;
			game.resolution.x = event.data.resolution.x;
			game.resolution.y = event.data.resolution.y;
		}
	} 
	if("map" in event.data){
		//New map
		if(game instanceof Game){
			game.useMap(event.data)
		}
	}
}

var loopCount = 0;
var lastTotalCount = 0;
var nextSecond = 0;
function loop(){
	loopCount++;
	if(performance.now() > nextSecond){
		nextSecond = Math.floor(1+(performance.now()) * 0.001)*1000;
		lastTotalCount = loopCount;
		loopCount = 0;
	}
	
	game.update();
	input.update();
	setTimeout(loop, 1);
	
}
loop();

/*
while(1){
	//Main loop
	game.update();
}*/