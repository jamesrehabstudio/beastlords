EffectExplosion.prototype = new GameObject();
EffectExplosion.prototype.constructor = GameObject;
function EffectExplosion(x, y, sound){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.sprite = "bullets";
	
	this.speed = 9.0;	
	sound = sound || "explode2";
	audio.play(sound,this.position);
	this.on("sleep",function(){ this.destroy(); } );
}

EffectExplosion.prototype.update = function(){
	this.frame.x = this.frame.x + (this.speed * game.deltaUnscaled);
	this.frame.y = 1;
	
	if(this.frame.x >= 3) {
		this.destroy();
		this.frame.x = 2;
	}
}

EffectBang.prototype = new GameObject();
EffectBang.prototype.constructor = GameObject;
function EffectBang(x, y, d){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.spread = 16;
	this.sprite = "bullets";
	
	shakeCamera(Game.DELTASECOND*0.3,8);
	audio.play("explode4", this.position);
	
	this.timeTotal = this.time = Game.DELTASECOND * 0.5;
	this.on("sleep",function(){ this.destroy(); } );
}

EffectBang.prototype.render = function(g,c){
	var progress = 1 - this.time / this.timeTotal;
	this.frame.x = progress * 5;
	this.frame.y = 5;
	
	Background.pushLight(this.position, (this.time/this.timeTotal)*160, COLOR_FIRE);
	
	for(var i=0; i < 4; i++){
		var pos = new Point(
			this.spread * (i == 0 || i == 3 ? -1 : 1),
			this.spread * (i < 2 ? -1 : 1)
		);
		g.renderSprite(
			this.sprite,
			this.position.add(pos).subtract(c),
			this.zIndex,
			this.frame,
			false,
			{"rotate" : i * 90}
		);
	}
	
	this.time -= this.delta;
	if(this.time <= 0){
		this.destroy();
	}
}

EffectSmoke.prototype = new GameObject();
EffectSmoke.prototype.constructor = GameObject;
function EffectSmoke(x, y, d, ops){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 2;
	this.sprite = "bullets";
	this.time = Game.DELTASECOND * Math.max(Math.random(),0.7);
	this.speed = 30 + Math.random() * 9.0;
	this.interactive = false;
	this.frame.x = 0;
	this.frame.y = 2;
	
	ops = ops || {};
	if( "frame" in ops ) this.frame.x = ops.frame*1;
	if( "frame_row" in ops ) this.frame.y = ops.frame_row*1;
	if( "speed" in ops ) this.speed = ops.speed;
	if( "time" in ops ) this.time = ops.time;
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectSmoke.prototype.update = function(){
	this.time -= game.deltaUnscaled;
	
	this.position.y -= game.deltaUnscaled * this.speed;
	
	if(this.time <=0 ) this.destroy();
}

EffectIce.prototype = new GameObject();
EffectIce.prototype.constructor = GameObject;
function EffectIce(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 2;
	this.sprite = "bullets";
	this.time = Game.DELTASECOND * Math.max(Math.random(),0.7);
	this.speed = 1 + Math.random()*0.3;
	this.interactive = false;
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectIce.prototype.update = function(){
	this.frame = Math.max((this.frame+game.deltaUnscaled*0.2)%7,3);
	this.frame_row = 3;
	this.time -= game.deltaUnscaled;
	
	this.position.y += game.deltaUnscaled * this.speed;
	
	if(this.time <=0 ) this.destroy();
}

EffectStatus.prototype = new GameObject();
EffectStatus.prototype.constructor = GameObject;
function EffectStatus(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 23;
	this.sprite = "bullets";
	this.time = Game.DELTASECOND;
	this.timeMax = this.time;
	this.interactive = false;
	this.frame.y = 4;
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectStatus.prototype.update = function(){
	var progress = this.time / this.timeMax;
	if( this.frame.x == 0 ) {
		this.position.y -= game.deltaUnscaled * 0.5;
	} else if ( this.frame.x == 1 ){ 
		this.position.y -= game.deltaUnscaled * 0.7;
		this.position.x += Math.sin(this.time*0.3);
	} else if ( this.frame.x == 2 ){ 
		this.position.y += 4 * (Math.random() - .5);
		this.position.x += 4 * (Math.random() - .5);
	} else if ( this.frame.x == 3 ){ 
		this.position.y += 0.2;
	} else if ( this.frame.x == 4 ){ 
		this.position.y += 0.5;
	} else if ( this.frame.x == 5 ) {
		this.position.y -= 0.5;
		this.position.x += 4 * (Math.random() - .5);
	} else {
		this.position.y += Math.cos(progress*9)*0.25;
		this.position.x += Math.sin(progress*9)*1.0;
	}
	
	this.time -= game.deltaUnscaled;
	if(this.time <=0 ) this.destroy();
}

EffectBlood.prototype = new GameObject();
EffectBlood.prototype.constructor = GameObject;
function EffectBlood(x, y, dir, dam){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	this.zIndex = 2;
	this.sprite = "bullets";
	
	this.frame = new Point(3,1);
	
	this.drops = [];
	for(var i=0; i < Math.min(Math.max(dam/3,3),10); i++){
		var speed = Math.min(dam*0.2,3.0) + 0.3 + Math.random()*2.0;
		this.drops.push({
			"time" : Game.DELTASECOND * (0.1 + Math.random()*0.2),
			"vector" : new Point(dir.x*speed, dir.y*speed),
			"pos" : new Point(Math.random()*6, Math.random()*6),
			"frame" : 3 + Math.floor(Math.random() * 2)
		});
	}
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectBlood.prototype.update = function(){
	var kill = true;
	
	for(var i=0; i < this.drops.length; i++){
		this.drops[i].time -= this.delta;
		this.drops[i].vector.x = this.drops[i].vector.x * (1.0-0.05*this.delta);
		this.drops[i].vector.y = this.drops[i].vector.y + this.delta * 0.3;
		this.drops[i].pos.x += this.drops[i].vector.x * this.delta;
		this.drops[i].pos.y += this.drops[i].vector.y * this.delta;
		if(this.drops[i].time > 0) kill = false;
	}
	if(kill) this.destroy();
}

EffectBlood.prototype.render = function(g,c){
	for(var i=0; i < this.drops.length; i++){
		g.renderSprite(
			this.sprite,
			this.drops[i].pos.add(this.position).subtract(c),
			this.zIndex,
			new Point(this.drops[i].frame, this.frame.y)
		);
	}
}

EffectNumber.prototype = new GameObject();
EffectNumber.prototype.constructor = GameObject;
function EffectNumber(x, y, value){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	this.zIndex = 99;
	this.sprite = "numbers";
	this.value = Math.floor(value);
	this.progress = 0.0;
	this.timelimit = Game.DELTASECOND * 2.0;
	this.sleep = true;
	
	this.on("sleep",function(){ this.destroy(); } );
	this.on("destroy",function(){ this.sleep = true; this.value = 0; } );
	this.on("added",function(){ this.sleep = false; this.progress = 0.0; } );
}

EffectNumber.prototype.render = function(g,c){
	var v = "" + this.value;
	var center = v.length * 3;
	for(var i=0; i < v.length; i++){
		let p = this.progress / this.timelimit;
		let b = Math.PI * Math.clamp01(p * 3 - i * 0.125);
		var bounce = Math.sin(b) * 8;
		
		if(b > 0){
			this.frame.x = v[i] * 1;
			this.frame.y = 1;
			let offset = new Point(i*6 - center, -bounce );
			g.renderSprite(this.sprite,this.position.subtract(c).add(offset),this.zIndex,this.frame);
		}
	}
	
	if(this.progress > this.timelimit){
		this.destroy();
	}
	
	this.progress += game.deltaUnscaled;
}

EffectCritical.prototype = new GameObject();
EffectCritical.prototype.constructor = GameObject;
function EffectCritical(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	this.zIndex = 99;
	this.sprite = "bullets";
	this.frame = new Point(2,2);
	
	this.progress = 0;
	
	this.on("sleep",function(){ this.destroy(); } );
	Background.flash = [1,1,1,1];
}

EffectCritical.prototype.update = function(){
	this.progress += this.delta;
	if(this.progress > Game.DELTASECOND * 0.25){
		this.destroy();
	}
}

EffectCritical.prototype.render = function(g,c){
	var radius = this.progress * 2.5;
	var points = 16;
	for(var i=0; i < points; i++){
		var angle = (i/points) * Math.PI * 2;
		var p = new Point(radius*Math.sin(angle),radius*Math.cos(angle));
		g.renderSprite(this.sprite,p.add(this.position).subtract(c),this.zIndex,this.frame);
	}
}

EffectHurt.prototype = new GameObject();
EffectHurt.prototype.constructor = GameObject;
function EffectHurt(x, y, obj){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "effect_hurt";
	this.zIndex = 99;
	this.frame.x = 0;
	this.frame.y = 0;
	this._frame = 0;
	this.speed = 12.0;
	this.intensity = 0.5;
	this.rotation = 0.0;
}
EffectHurt.prototype.render = function(g,c){
	//if(input.state("left")==1) this.intensity -= 0.05;
	//if(input.state("right")==1) this.intensity += 0.05;
	
	this._frame += game.deltaUnscaled * this.speed;
	this.frame.x = this._frame / 4;
	this.frame.y = this._frame % 4;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"u_color_edge" : [1.0,0.8,0.8,1.0],
			"u_color" : [0.8,0.0,0.0,1.0],
			"u_size" : [1/256.0,1/256.0],
			"u_intensity" : this.intensity,
			"rotate" : this.rotation
		}
	);
	
	if(this._frame > 8){
		//this._frame = 0.0;
		this.destroy();
	}
}

EffectBlock.prototype = new GameObject();
EffectBlock.prototype.constructor = GameObject;
function EffectBlock(x, y, obj){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "effect_block";
	this.zIndex = 99;
	this.frame.x = 0;
	this.frame.y = 0;
	this.speed = 11.5;
	this.intensity = 0.5;
}
EffectBlock.prototype.render = function(g,c){
	this.frame.x = (this.frame.x + this.delta * this.speed) % 6;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"u_color_edge" : [1.0,1.0,1.0,1.0],
			"u_color" : [0.4,0.5,1.0,1.0],
			"u_size" : [1/256.0,1/256.0],
			"u_intensity" : this.intensity
		}
	);
	
	if(this.frame.x >= 5){
		this.destroy();
	}
}

EffectAfterImage.prototype = new GameObject();
EffectAfterImage.prototype.constructor = GameObject;
function EffectAfterImage(x, y, obj){
	/*
	this.constructor();
	
	this.life = Game.DELTASECOND;
	this.lifeMax = this.life;
	
	this.size = 64;
	this.resolution = new Point(this.size, -this.size);
	this.position.x = x - this.size * 0.5;
	this.position.y = y - this.size * 0.5;
	this.interactive = false;
	
	
	var gl = game.g;
	this.buffer = gl.createF(this.size);
	
	this.on("sleep", function(){ this.destroy(); } );

	this.buffer.use(gl);
	var tempres = game.resolution;
	game.resolution = this.resolution;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0,0,this.size,this.size);
	
	obj.render(gl, new Point(this.size*-0.5, this.size*0.5).add(obj.position));
	
	game.backBuffer.use(gl);
	game.resolution = tempres;
	gl.viewport(0,0,game.resolution.x,game.resolution.y);
	*/
}

EffectAfterImage.prototype.render = function(g,c){
	/*
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_CONSTANT_ALPHA );
	
	var geo = Sprite.RectBuffer(this.position.subtract(c), 64,64);
	var tex = Sprite.RectBuffer(new Point(), 1,1);
	var shader = window.materials["color"].use();
	
	var buffer = g.createBuffer();
	g.bindBuffer( g.ARRAY_BUFFER, buffer );
	g.bufferData( g.ARRAY_BUFFER, geo, g.DYNAMIC_DRAW);
	shader.set("a_position");
	
	var tbuffer = g.createBuffer();
	g.bindBuffer( g.ARRAY_BUFFER, tbuffer );
	g.bufferData( g.ARRAY_BUFFER, tex, g.DYNAMIC_DRAW);
	shader.set("a_texCoord");
	
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	shader.set("u_camera", 0,0);
	g.bindTexture(g.TEXTURE_2D, this.buffer.texture);
	
	var progress = Math.max(this.life / this.lifeMax, 0);
	shader.set("u_color", [progress,progress,1,0.5*Math.sqrt(progress)]);
	
	g.drawArrays(g.TRIANGLE_STRIP, 0, geo.length/2);
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA );
	
	this.life -= this.delta;
	if( this.life <= 0 ) this.destroy();
	*/
	this.destroy();
}

EffectItemPickup.prototype = new GameObject();
EffectItemPickup.prototype.constructor = GameObject;
function EffectItemPickup(x, y, message){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 8;
	this.height = 8;
	this.zIndex = 99;
	this.sprite = "ring";
	
	this.time = 0;
	this.flash = true;
	this.phase1Time = Game.DELTASECOND * 0.7;
	this.totalTime = Game.DELTASECOND;
	
	this.on("sleep",function(){ this.destroy(); } );
	
	this.particles = new Array();
	for(var i=0; i < 12; i++){
		this.particles.push({
			"angle" : Math.random() * 2 * Math.PI,
			"radius" : 64 + Math.random() * 32
		})
	}
	
	audio.play("powerup");
	game.slow(0.01, this.totalTime);
}

EffectItemPickup.prototype.render = function(g,c){
	this.time += game.deltaUnscaled;
	
	if(this.time > this.phase1Time){
		//Explode out
		if(!this.flash){
			Background.flash = [1.0,1.0,1.0,1.0];
			this.flash = true;
		}
		var progress = (this.time-this.phase1Time) / (this.totalTime-this.phase1Time);
		var scale = (1-progress);
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"scale":2*progress});
		
		Background.pushLight(this.position,240*scale);
	} else {
		//Suck in
		var progress = this.time / this.phase1Time;
		var scale = (1-progress);
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"scale":.1 + 0.5*scale});
		
		g.renderSprite("lighthalo",this.position.subtract(c),this.zIndex,this.frame,false,{"scale":0.5*progress});
		
		for(var i=0; i < this.particles.length; i++){
			var p = this.particles[i];
			var r = p.radius * scale;
			var pos = new Point(r * Math.sin(p.angle), r * Math.cos(p.angle));
			g.renderSprite("lighthalo",this.position.add(pos).subtract(c),this.zIndex,this.frame,false,{"scale":0.06*scale});
		}
		
		Background.pushLight(this.position,progress*360);
	}
	if( this.time > Game.DELTASECOND ){
		this.destroy();
	}
}

EffectFlash.prototype = new GameObject();
EffectFlash.prototype.constructor = GameObject;
function EffectFlash(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.sprite = "ring";
	
	this.time = 0.0;
	this.timeMax = Game.DELTASECOND * 0.5;
}

EffectFlash.prototype.render = function(g,c){
	this.time += this.delta;
	
	var scale = 5 * this.time / this.timeMax;
	
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":scale});
	
	if(this.time >= this.timeMax){
		this.destroy();
	}
}

EffectAbsorb.prototype = new GameObject();
EffectAbsorb.prototype.constructor = GameObject;
function EffectAbsorb(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.sprite = "bullets";
	this.frame = new Point(4,1);
	
	this.speed = 10.0;
}

EffectAbsorb.prototype.render = function(g,c){
	var dir = this.position.subtract(_player.position);
	var speed = this.speed * this.delta;
	
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false);
	
	if(dir.magnitude() < speed){
		this.destroy();
	} else {
		this.position = this.position.subtract(dir.normalize(speed));
	}
}

var EffectList = {
	"charge" : function(g,p,progress){		
		if( progress > 0.2 && progress < 1.0 ) {
			
			var r = 12.0 * (1.0-progress);
			
			for(var i=0; i < 5; i++) {
				var off = new Point(r*Math.sin(i), r*Math.cos(i));
				g.renderSprite("bullets",p.add(off),this.zIndex+1,new Point(3,2));
			}
		}
	}
};

class SparkEffect extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.thickness = 1.0;
		this.color = [1.0,1.0,1.0,1.0];
		this.radius = 12;
		this.speed = 4.0;
		
		this._progress = 0.0;
	}
	update(){
		if(this._progress < 1){
			this._progress = this._progress + game.deltaUnscaled * this.speed;
		} else {
			this.destroy();
		}
	}
	render(g,c){}
	postrender(g,c){
		for(let i=0; i < SparkEffect.ring.length; i++){
			let radius = this.radius * (0.5 + this._progress ** 0.8);
			let seg = radius * (3.14 / 512);
			let thickness =  this.thickness * (1-this._progress);
			let range = SparkEffect.ring[i].range * (1 - this._progress * 0.8);
			let start = SparkEffect.ring[i].angle - range * 0.5;
			
			for(let j=0; j < range; j+= seg){
				let _a = new Point( Math.cos(start+j), Math.sin(start+j) ).scale(radius);
				let _b = new Point( Math.cos(start+j+seg), Math.sin(start+j+seg) ).scale(radius);
				
				g.renderLine(
					_a.add(this.position).subtract(c),
					_b.add(this.position).subtract(c),
				
					this.thickness,
					this.color
				);
				
				let burst = SparkEffect.ring[i].burst;
				let _p = this._progress ** 0.6;
				let _c = new Point( Math.cos(start), Math.sin(start) ).scale(radius * (_p * burst + 0.25) );
				let _d = new Point( Math.cos(start), Math.sin(start) ).scale(radius * (_p * 0.25 + 1.0) );
				
				g.renderLine(
					_c.add(this.position).subtract(c),
					_d.add(this.position).subtract(c),
					
					thickness,
					this.color
				)
			}
			
		}
	}
}
SparkEffect.create = function(pos, radius = 12){
	var se = new SparkEffect(pos.x, pos.y);
	se.radius = radius;
	game.addObject(se);
	
}
SparkEffect.ring = [
	{angle: 1.1, range: 0.4, burst:1.50},
	{angle: 0.1, range: 0.2, burst:2.50},
	{angle: 0.55, range: 0.3, burst:2.00},
	{angle: 1.8, range: 0.7, burst:1.00},
	{angle: 2.5, range: 0.4, burst:1.50},
	{angle: 3, range: 0.3, burst:3.00},
	{angle: 3.7, range: 0.9, burst:1.50},
	{angle: 4, range: 0.1, burst:1.50},
	{angle: 4.6, range: 0.6, burst:1.50},
	{angle: 5.2, range: 0.2, burst:3.00},
	{angle: 5.8, range: 0.7, burst:1.00}
];
self["SparkEffect"] = SparkEffect;


COLOR_WHITE = [1.0,1.0,1.0,1.0];
COLOR_BLACK = [0.0,0.0,0.0,1.0];
COLOR_LIGHTNING = [0.5,0.7,1.0,1.0];
COLOR_FIRE = [1,0.8,0,1];
COLOR_HURT = [0.8,0.1,0.2,1];