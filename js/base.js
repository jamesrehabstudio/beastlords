importScripts("maths.js");

audio = {
	"play" : function(name){
		
	},
	"playAs" : function(name,alias){
		
	},
	"playLock" : function(name,duration){
		
	}
}

Renderer = {
	color : [1,1,1,1],
	layers : [new Array(),new Array(),new Array(),new Array()],
	layer : 1
}
Renderer.clear = function(){
	Renderer.color = [1,1,1,1];
	Renderer.layers = [new Array(),new Array(),new Array(),new Array()];
	Renderer.layer = 1;
}
Renderer.serialize = function(){
	var out = {};
	for(var i=0; i < RENDER_STEPS.length; i++){
		out[RENDER_STEPS[i]] = Renderer.layers[i];
	}
	return out;
}
Renderer.renderSprite = function(sprite,pos,z,frame,flip,filter){
	var f = 0; var fr = 0;
	if(frame instanceof Point){
		f = Math.floor(frame.x);
		fr = Math.floor(frame.y);
	} else {
		f = Math.floor(frame);
	}
	
	Renderer.layers[Renderer.layer].push({
		"type" : 0,
		"sprite" : sprite,
		"x" : pos.x,
		"y" : pos.y,
		"frame" : f,
		"frame_row" : fr,
		"flip" : flip,
		"filter" : filter
	});
}
Renderer.scaleFillRect = function(x,y,w,h){
	Renderer.layers[Renderer.layer].push({
		"type" : 1,
		"color" : [Renderer.color[0],Renderer.color[1],Renderer.color[2],Renderer.color[3]],
		"x" : x,
		"y" : y,
		"w" : w,
		"h" : h
	});
}

RENDER_STEPS = ["prerender","render","postrender","hudrender"];

//////////////////
//Game controller
//////////////////

function Game(){
	this.camera = new Point(0,0);
	this.resolution = new Point(320,240);
	this.tiles = [null,null,null,null];
	this.objects = new Array();
	this.cycleTime = new Date() * 1;
	this.interval = 7;
	
	this.delta = 1;
	this.deltaUnscaled = 1;
	this.deltaScale = 1.0;
}

Game.prototype.update = function(){
	//Interval lock
	while((new Date() * 1)-this.cycleTime < this.interval){}
	
	var newTime = new Date() * 1;
	this.deltaUnscaled = (newTime - this.cycleTime) * (0.001);
	this.delta = this.deltaUnscaled * this.deltaScale;
	this.cycleTime = newTime;
	
	for(var i=0; i < this.objects.length; i++){
		var obj = this.objects[i];
		
		obj.idle();
		if( obj.awake ) {
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
				for ( var j = 0; j < mods.length; j++ ) {
					if ( mods[j].update instanceof Function ) {
						mods[j].update.apply(obj);
					}
				}
			} else {
				obj.update();
			}
		}
		
		for(var j=0; j < RENDER_STEPS.length; j++){
			var step = RENDER_STEPS[j];
			if(obj[step] instanceof Function){
				obj[step](Renderer, this.camera);
			}
			
			for(var m=0; m < obj.modules.length; m++){
				if(step in obj.modules[m] ){
					obj.modules[m][step](Renderer, this.camera);
				}
			}
		}
	}
	
	postMessage(Renderer.serialize());
	Renderer.clear();
}

Game.prototype.addObject = function(obj){
	if(obj instanceof GameObject && this.objects.indexOf(obj) < 0){
		this.objects.push(obj);
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
	this.collisions = [];
	this.bounds = new Line(0,0,0,0);
	this.tileDimension = new Line(0,0,0,0);
	this.tiles = [[],[],[]];
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
Game.prototype.t_move = function(obj, x, y){
	obj.position.x += x;
	obj.position.y += y;
}
Game.DELTASECOND = 1.0;
Game.DELTADAY = 60 * 60 * 24 * Game.DELTASECOND;
Game.DELTAYEAR = Game.DELTADAY * 365.25;

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
	var corners = this.corners();
	var margin = 32;
	
	this.awake = (
		corners.right + margin > game.camera.x &&
		corners.left - margin < game.camera.x + game.resolution.x &&
		corners.bottom + margin > game.camera.y &&
		corners.top - margin < game.camera.y + game.resolution.y
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
		
		if( this.ttest instanceof Line ){
			g.scaleFillRect(this.ttest.start.x - camera.x, this.ttest.start.y - camera.y, this.ttest.width(), this.ttest.height() );
		}
	}
	
	if ( this.sprite ) {
		g.renderSprite(
			this.sprite, 
			this.position.subtract(camera),
			this.zIndex,
			this.frame,
			this.flip,
			this.filter
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
game.addObject(new Test(32,32));

var input = {
	"states" : {},
	"state" : function(name){
		return this.states[name];
	}
}

self.onmessage = function(event){
	if("input" in event.data){
		//general update
		input.states = event.data.input;
		if(game instanceof Game){
			game.resolution.x = event.data.resolution.x;
			game.resolution.y = event.data.resolution.y;
		}
	} else {
		//New map
		console.log(event.data);
	}
	game.update();
}

/*
while(1){
	//Main loop
	game.update();
}*/