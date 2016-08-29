importScripts("maths.js");

audio = {
	"out" : {},
	"play" : function(name){
		if(!("play" in audio.out)) audio.out["play"] = new Array();
		audio.out["play"].push([name]);
	},
	"playAs" : function(name,alias){
		if(!("playAs" in audio.out)) audio.out["playAs"] = new Array();
		audio.out["playAs"].push([name,alias]);
	},
	"playLock" : function(name,duration){
		if(!("playLock" in audio.out)) audio.out["playLock"] = new Array();
		audio.out["playLock"].push([name,duration]);
	},
	"stopAs" : function(alias){
		if(!("stopAs" in audio.out)) audio.out["stopAs"] = new Array();
		audio.out["stopAs"].push([alias]);
	},
	"serialize" : function(){
		return audio.out;
	},
	"clear" : function(){
		audio.out = {};
	}
}

RENDER_STEPS = ["prerender","render","postrender","hudrender","lightrender"];

Renderer = {
	color : [1,1,1,1],
	tint : [1,1,1,1],
	layers : [new Array(),new Array(),new Array(),new Array(),new Array()],
	layer : 1
}
Renderer.clear = function(){
	Renderer.color = [1,1,1,1];
	Renderer.layers = [new Array(),new Array(),new Array(),new Array(),new Array()];
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
		"x" : pos.x,
		"y" : pos.y,
		"z" : z,
		"frame" : f,
		"frame_row" : fr,
		"flip" : flip,
		"options" : options
	},function(a,b){
		if("z" in b && !isNaN(b.z)){
			if("z" in a && !isNaN(a.z)){
				return a.z - b.z;
			} else {
				return -1;
			}
		}
		return 1;
	});
}
Renderer.scaleFillRect = function(x,y,w,h){
	Renderer.layers[Renderer.layer].insertSort({
		"type" : 1,
		"color" : [Renderer.color[0],Renderer.color[1],Renderer.color[2],Renderer.color[3]],
		"x" : x,
		"y" : y,
		"w" : w,
		"h" : h
	},function(a,b){
		if("z" in b){
			return -1;
		}
		return 1;
	});
}

//////////////////
//Game controller
//////////////////

function Game(){
	this.tileCollideLayer = 2;
	this.camera = new Point(0,0);
	this.resolution = new Point(320,240);
	this.map = {};
	this.objects = new Array();
	this.cycleTime = new Date() * 1;
	this.interval = 7;
	this.tree = new BSPTree(new Line(0,0,256,240));
	this.tileDelta = {};
	this.mainThreadReady = true;
	
	this.deltaScaleReset = 0.0;
	this.deltaScalePause = 0;
	
	this.delta = 1;
	this.deltaUnscaled = 1;
	this.deltaScale = 1.0;
	this.pause = false;
	this.time = 0.0;
	
	this.newmap = false;
	this._newmapCallback = false;
	this._loadCallback = false;
	this._promptCallback = false;
	
	if("game_start" in self && self.game_start instanceof Function){
		self.game_start(this);
	}
}

//constants

Game.DELTASECOND = 30.0;
Game.DELTAMINUTE = 60 * Game.DELTASECOND;
Game.DELTAHOUR = 60 * Game.DELTAMINUTE;
Game.DELTADAY = 24 * Game.DELTAHOUR;
Game.DELTAYEAR = Game.DELTADAY * 365.25;

Game.prototype.slow = function(s,d) {
	if( d > this.deltaScaleReset ) {
		this.deltaScale = s;
		this.deltaScaleReset = d;
	}	
}
Game.prototype.loadMap = function(name, func){
	this._newmapCallback = func;
	this.newmap = name;
}
Game.prototype.update = function(){
	//Interval lock
	while((new Date() * 1)-this.cycleTime < this.interval){}
	
	var newTime = new Date() * 1;
	var baseDelta = Math.min(
		(newTime - this.cycleTime) * (0.001*Game.DELTASECOND),
		0.1*Game.DELTASECOND
	);
	this.deltaUnscaled = baseDelta;
	this.delta = this.deltaUnscaled * this.deltaScale * (this.pause?0:1);
	this.deltaScaleReset -= this.deltaUnscaled;
	this.time += this.deltaUnscaled;
	if(this.deltaScaleReset <= 0){
		this.deltaScale = 1.0;
	}
	this.cycleTime = newTime;
	
	if(this.newmap){
		this.clearAll();
		postMessage({
			"loadmap" : this.newmap
		});
		
		this.newmap = false;
		return 0;
	}
	
	for(var i=0; i < this.objects.length; i++){
		var obj = this.objects[i];
		
		obj.idle();
		if( obj.awake ) {
			this.tree.remove(obj);
			
			var mods = obj.modules;
			//Set any frame specific values
			obj.delta = this.delta * obj.deltaScale;
			obj.deltaUnscaled = this.delta;
			
			//Update Functions
			if ( mods.length > 0 ) {
				for ( var j = 0; j < mods.length; j++ ) {
					if ( mods[j].beforeupdate instanceof Function ) {
						mods[j].beforeupdate.apply(obj);
					}
				}
				obj.update();
				if(obj.interactive){
					this.collideObject(obj);
				}
				for ( var j = 0; j < mods.length; j++ ) {
					if ( mods[j].update instanceof Function ) {
						mods[j].update.apply(obj);
					}
				}
			} else {
				obj.update();
			}
			
			if(obj.interactive && this.objects.indexOf(obj) >= 0){
				this.tree.push(obj);
			}
		}
	}
	
	for(var i=0; i < this.objects.length; i++){
		var obj = this.objects[i];
		if(obj.shouldRender()){
			for(var j=0; j < RENDER_STEPS.length; j++){
				//try{
					var step = RENDER_STEPS[j];
					Renderer.layer = j;
					if(obj[step] instanceof Function){
						obj[step](Renderer, this.camera);
					}
					
					for(var m=0; m < obj.modules.length; m++){
						if(step in obj.modules[m] ){
							obj.modules[m][step].apply(obj,[Renderer, this.camera]);
						}
					}
				//}catch(err){
					
				//}
			}
		}
	}
	
	if(this.mainThreadReady){
		this.mainThreadReady = false;
		postMessage({
			"audio" : audio.serialize(),
			"render" : Renderer.serialize(),
			"camera" : {"x":this.camera.x, "y":this.camera.y},
			"tiles" : this.tileDelta
		});
		this.tileDelta = {};
		audio.clear();
	}
	Renderer.clear();
}
Game.prototype.useMap = function(m){
	this.clearAll();
	
	this.map = {
		"layers" : m.layers,
		"map" : m.map,
		"tileset" : m.tileset,
		"width" : m.width,
		"height" : m.height
	};
	
	var splits = Math.floor(Math.max(m.width,m.height)/64);
	this.tree = new BSPTree(new Line(0,0,m.width*16,m.height*16), splits);
	
	for(var i=0; i < m.objects.length; i++){
		var obj = m.objects[i];
		if(obj.name in self){
			var newobj = new self[obj.name](obj.x,obj.y,[obj.width,obj.height],obj.properties);
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
Game.prototype.addObject = function(obj){
	if(obj instanceof GameObject && this.objects.indexOf(obj) < 0){
		this.objects.push(obj);
		obj.trigger("added");
	}
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
Game.prototype.clearAll = function(){
	this.objects = [];
	this.map = null;
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
Game.prototype.t_unstick = function( obj ) {
	var hitbox = obj.corners();
	obj.isStuck = false;
	var escape = {
		"top" : 0,
		"bottom" : 0,
		"left" : 0,
		"right" : 0
	}
	var ts = 16;
	var xinc = obj.width/ Math.ceil(obj.width/ts);
	var yinc = obj.height/ Math.ceil(obj.height/ts);
	var xmid = hitbox.left + Math.floor(obj.width/ts) * 0.5 * xinc;
	var ymid = hitbox.top + Math.floor(obj.height/ts) * 0.5 * xinc;
	for(var _x=hitbox.left; _x<=hitbox.right+1; _x+=xinc ) {
		for(var _y=hitbox.top; _y <=hitbox.bottom+1; _y+=yinc ) {
			var tile = this.getTile(_x,_y);
			var tileData = getTileData(tile);
			if( tileData.tile != 0 && !(tileData.tile in tilerules.currentrule()) ) {
				//You're stuck, do something about it!
				obj.isStuck = true;
			} else {
				if( _x == hitbox.left ) escape["left"] ++;
				else if( _x == hitbox.right ) escape["right"] ++;
				
				if ( _y == hitbox.top ) escape["top"] ++;
				else if( _y == hitbox.bottom ) escape["bottom"] ++;
			}
		}
	}
	if( obj.isStuck ) {
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
Game.prototype.prompt = function(message,value,callback){
	this._promptCallback = callback;
	postMessage({
		"prompt" : {
			"message" : message,
			"value" : value
		}
	});
}
Game.prototype.load = function(callback){
	this._loadCallback = callback;
	postMessage({
		"loaddata" : {
			"profile" : 0
		}
	});
	
}
Game.prototype.save = function(data){
	postMessage({
		"savedata" : {
			"profile" : 0,
			"data" : data
		}
	});
}


function Sequence(d){
	this.data = d;
}
Sequence.prototype.frame = function(progress){
	var i = 0;
	for(var i in this.data){
		if(progress <= i){
			return new Point(this.data[i][0], this.data[i][1]);
		}
	}
	return new Point(this.data[i][0], this.data[i][1]);
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

var tilerules = {
	"ts" : 16,
	"currentrule" : function(){
		if(game.map.tileset == "world"){
			return tilerules.rules.world;
		} else {
			return tilerules.rules.big;	
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
		if(axis == 0){
			if(v>0) limits[1] = Math.min(limits[1], pos.y);
			if(v<0) limits[3] = Math.max(limits[3], pos.y + tilerules.ts);
		} else {
			if(v>0) limits[0] = Math.min(limits[0], pos.x);
			if(v<0) limits[2] = Math.max(limits[2], pos.x + tilerules.ts);
		}
		return limits;
	},
	"slope_1tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y) + Math.max((hitbox.left-pos.x)*0.5, 1);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"onewayup" : function(axis,v,pos,hitbox,limits,start_hitbox){
		//one way blocks
		if(axis == 0){
			if(v > 0 && start_hitbox.bottom <= pos.y){
				limits[1] = Math.min(limits[1], pos.y);
			}
		}
		return limits;
	},
	"slope_halfto0" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y+(tilerules.ts*0.5)) + Math.max((hitbox.left-pos.x)*0.5, 1);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_1to0" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y) + Math.max(hitbox.left-pos.x, 1);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_0to1" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y+tilerules.ts) + Math.max(pos.x-hitbox.right, 1-tilerules.ts);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_0tohalf" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y+tilerules.ts) + Math.max((pos.x-hitbox.right) * 0.5, 1-tilerules.ts*0.5);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"slope_halfto1" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y+tilerules.ts) + Math.max((pos.x-(hitbox.right+tilerules.ts)) * 0.5, 1-tilerules.ts);
			limits[1] = Math.min(limits[1], peak-1);
		}
		return limits;
	},
	"ceil_0to1" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = pos.y + Math.min(hitbox.right-pos.x,16);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"ceil_1to0" : function(axis,v,pos,hitbox,limits){
		if(axis == 0){
			var peak = (pos.y+tilerules.ts) - Math.max(hitbox.left-pos.x, 1);
			limits[3] = Math.max(limits[3], peak+1);
		}
		return limits;
	},
	"edge_left" : function(axis,v,pos,hitbox,limits){
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
	},
	"edge_right" : function(axis,v,pos,hitbox,limits){
		if(axis == 1){
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
	"ignore" : function(axis,v,pos,hitbox,limits){
		return limits;
	}
}
tilerules.rules["world"] = {
	959:tilerules.ignore,
	960:tilerules.edge_right,
	989:tilerules.ceil_1to0,
	990:tilerules.ceil_0to1,
	991:tilerules.edge_left,
	992:tilerules.ignore,
	1021:tilerules.slope_1to0,
	1022:tilerules.slope_0to1
};
tilerules.rules["big"] = {
	9:tilerules.slope_1tohalf,
	10:tilerules.slope_halfto0,
	11:tilerules.slope_1to0,
	12:tilerules.slope_0to1,
	13:tilerules.slope_0tohalf,
	14:tilerules.slope_halfto1,
	41:tilerules.ignore,
	42:tilerules.ignore,
	43:tilerules.ignore,
	44:tilerules.ignore,
	45:tilerules.ignore,
	47:tilerules.ignore,
	
	73:tilerules.slope_1tohalf,
	74:tilerules.slope_halfto0,
	75:tilerules.slope_1to0,
	76:tilerules.slope_0to1,
	77:tilerules.slope_0tohalf,
	78:tilerules.slope_halfto1,
	105:tilerules.ignore,
	106:tilerules.ignore,
	107:tilerules.ignore,
	108:tilerules.ignore,
	109:tilerules.ignore,
	110:tilerules.ignore,
	
	137:tilerules.slope_1tohalf,
	138:tilerules.slope_halfto0,
	139:tilerules.slope_1to0,
	140:tilerules.slope_0to1,
	141:tilerules.slope_0tohalf,
	142:tilerules.slope_halfto1,
	169:tilerules.ignore,
	170:tilerules.ignore,
	171:tilerules.ignore,
	172:tilerules.ignore,
	173:tilerules.ignore,
	174:tilerules.ignore,
	
	201:tilerules.onewayup,
	202:tilerules.onewayup,
	203:tilerules.onewayup,
	204:tilerules.onewayup,
	205:tilerules.onewayup,
	206:tilerules.onewayup,
	233:tilerules.ignore,
	234:tilerules.ignore,
	235:tilerules.ignore,
	236:tilerules.ignore,
	237:tilerules.ignore,
	238:tilerules.ignore,
};

//////////////////
//Base game object
//////////////////

function GameObject() {
	this.id = -1;
	this.position = new Point();
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
	this.deltaScale = 1.0;
	this.filter = false;
	this.isStuck = false;
	this.idleMargin = 32;
	
	this.visible = true;
	this.modules = new Array();
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
	var corners = this.corners();
	
	this.awake = (
		corners.right + this.idleMargin > game.camera.x &&
		corners.left - this.idleMargin < game.camera.x + game.resolution.x &&
		corners.bottom + this.idleMargin > game.camera.y &&
		corners.top - this.idleMargin < game.camera.y + game.resolution.y
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
	if( self.debug ) {
		var bounds = this.bounds();
		g.scaleFillRect(bounds.start.x - camera.x, bounds.start.y - camera.y, bounds.width(), bounds.height() );
	}
	
	if ( this.sprite ) {
		g.renderSprite(
			this.sprite, 
			this.position.subtract(camera),
			this.zIndex,
			this.frame,
			this.flip,
			{"shader":this.filter}
		);
	}
}
GameObject.prototype.assignParent = function ( parent ) {
	this.parent = parent;
}
GameObject.prototype.destroy = function() {
	this.trigger("destroy");
	var index = game.objects.indexOf(this);
	if( index >= 0 ) {
		game.objects.remove( index );
	}
	game.tree.remove(this);
}

Test.prototype = new GameObject();
Test.prototype.constructor = GameObject;
function Test(x, y){
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.zIndex = 1;
	this.sprite = "oriax";
}
Test.prototype.update = function(){
	this.frame.x = (this.frame.x+this.delta*5) % 5;
	this.frame.y = 0;
}

importScripts("platformer.js");

//Start
_player = null;
game = new Game();

var input = {
	"states" : {},
	"state" : function(name){
		if(name in this.states){
			return this.states[name];
		}
		return 0;
	},
	"update" : function(s){
		if(s == undefined){
			for(var i in this.states){
				if(this.states[i] > 0){
					this.states[i]++;
				}
			}
		} else{
			for(var i in s){
				if(!(i in this.states)){
					this.states[i] = 0;
				}
				if(s[i] > 0){
					this.states[i]++;
				} else {
					this.states[i] = 0;
				}
			}
		}
	}
}

self.onmessage = function(event){
	if("loaddata" in event.data && game._loadCallback instanceof Function) {
		game._loadCallback(event.data["loaddata"]);
	}
	if("prompt" in event.data){
		game._promptCallback(event.data["prompt"]);
	}
	if("input" in event.data){
		//general update
		input.update(event.data.input);
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

function loop(){
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