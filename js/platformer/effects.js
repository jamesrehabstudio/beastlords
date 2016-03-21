EffectExplosion.prototype = new GameObject();
EffectExplosion.prototype.constructor = GameObject;
function EffectExplosion(x, y, sound){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 2;
	this.sprite = sprites.bullets;
	
	this.speed = 0.3;	
	sound = sound || "explode2";
	audio.playLock(sound,0.1);
	this.on("sleep",function(){ this.destroy(); } );
}

EffectExplosion.prototype.update = function(){
	this.frame = this.frame + (this.speed * game.deltaUnscaled);
	this.frame_row = 1;
	
	if(this.frame >= 3) {
		this.destroy();
		this.frame = 2;
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
	this.sprite = sprites.bullets;
	this.time = Game.DELTASECOND * Math.max(Math.random(),0.7);
	this.speed = 1 + Math.random()*0.3;
	this.interactive = false;
	this.frame = 0;
	this.frame_row = 2;
	
	ops = ops || {};
	if( "frame" in ops ) this.frame = ops.frame;
	if( "frame_row" in ops ) this.frame_row = ops.frame_row;
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
	this.sprite = sprites.bullets;
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
	this.zIndex = 2;
	this.sprite = sprites.bullets;
	this.time = Game.DELTASECOND * Math.max(Math.random(),0.7);
	this.interactive = false;
	this.frame_row = 4;
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectStatus.prototype.update = function(){
	if( this.frame == 0 ) {
		this.position.y -= game.deltaUnscaled * 0.5;
	} else if ( this.frame == 1 ){ 
		this.position.y -= game.deltaUnscaled * 0.7;
		this.position.x += Math.sin(this.time*0.3);
	} else if ( this.frame == 2 ){ 
		this.position.y += 4 * (Math.random() - .5);
		this.position.x += 4 * (Math.random() - .5);
	} else if ( this.frame == 3 ){ 
		this.position.y += 0.2;
	} else if ( this.frame == 4 ){ 
		this.position.y += 0.5;
	} else {
		this.position.y -= 0.5;
		this.position.x += 4 * (Math.random() - .5);
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
	this.sprite = sprites.bullets;
	
	this.frame = 3
	this.frame_row = 1;
	
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
		this.sprite.render(
			g,
			this.drops[i].pos.add(this.position).subtract(c),
			this.drops[i].frame,
			this.frame_row
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
	this.zIndex = 2;
	this.sprite = sprites.numbers;
	this.value = Math.floor(value);
	this.progress = 0.0;
	
	this.on("sleep",function(){ this.destroy(); } );
}

EffectNumber.prototype.render = function(g,c){
	var v = "" + this.value;
	var x_off = v.length * 3;
	for(var i=0; i < v.length; i++){
		var offset = Math.min(this.progress-(i*2),Math.PI);
		var bounce = Math.sin(offset) * 8;
		if(offset > 0){
			this.frame = v[i] * 1;
			this.frame_row = 1;
			this.sprite.render(g,this.position.subtract(c).add(new Point(i*6-x_off,-bounce)),this.frame,this.frame_row);
		}
	}
	
	if(this.progress > Game.DELTASECOND * 1.5){
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
	this.sprite = sprites.bullets;
	
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
		this.sprite.render(g,p.add(this.position).subtract(c),2,2);
	}
}

EffectAfterImage.prototype = new GameObject();
EffectAfterImage.prototype.constructor = GameObject;
function EffectAfterImage(x, y, obj){	
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
}

EffectAfterImage.prototype.render = function(g,c){
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
	this.sprite = sprites.bullets;
	
	this.time = 0;
	this.flash = true;
	
	this.on("sleep",function(){ this.destroy(); } );
	
	audio.play("powerup");
	game.slow(0.01, Game.DELTASECOND);
}

EffectItemPickup.prototype.render = function(gl,c){
	this.time += game.deltaUnscaled;
	var p1 = this.time / (Game.DELTASECOND * 0.7);
	var p2 = (this.time-(Game.DELTASECOND * 0.7)) / (Game.DELTASECOND * 0.3);
	
	gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA );
	
	var shader = window.materials["lightbeam"].use();
	var distance = 16 + Math.max(24 * (1-p1),0);
	var length = Math.min(32 * p1, 24*(1-p2));
	for(var i=0; i < 16; i++ ){
		var rotation = ((Math.PI * 2) / 16) * i;
		var degrees = (rotation / Math.PI) * 180;
		var variation = 1 - Math.sin( Math.PI * ((degrees / 90) % 1));
		variation = 0.5 + variation / 2;
		var pos = new Point(
			variation * distance * Math.cos(rotation),
			variation * distance * Math.sin(rotation)
		);
		var data = Sprite.RectBuffer(pos.add(this.position).subtract(c), variation * length, 1, degrees);
		var tdata = Sprite.RectBuffer(new Point(), 1, 1);
		
		var buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
		//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
		shader.set("a_position");
		
		var tbuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
		gl.bufferData( gl.ARRAY_BUFFER, tdata, gl.DYNAMIC_DRAW);
		//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);			
		shader.set("a_texCoord");
		
		//gl.uniform2f(res, game.resolution.x, game.resolution.y);
		//gl.uniform2f(cam, offsetx, 144);
		shader.set("u_resolution", game.resolution.x, game.resolution.y);
		shader.set("u_camera", 0, 0);
		shader.set("u_color", 1.0, 1.0, 1.0, variation * 0.5);
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
	}
	
	shader = window.materials["default"].use();
	if( p2 <= 0 ) {
		var r = 24 * p1;
		sprites.halo.renderSize(gl, 
			this.position.x - r - c.x, this.position.y - r - c.y,
			r * 2, r * 2, 0, 0 
		);
	}
	
	r = 240 * Math.max(p2,0);
	sprites.ring.renderSize(gl, 
		this.position.x - r - c.x, this.position.y - r - c.y,
		r * 2, r * 2, 0, 0 
	);
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	
	if( this.time > Game.DELTASECOND ){
		this.destroy();
	}
}

var EffectList = {
	"charge" : function(g,p,d){
		if(d < Game.DELTASECOND * 0.2) return;
		
		var progress = (d - Game.DELTASECOND * 0.2) / (Game.DELTASECOND * 0.3);
		var r = 10.0 * (1.0-progress);
		
		if( progress < 1.0 ) {
			audio.playLock("charge",0.5);
			for(var i=0; i < 5; i++) {
				var off = new Point(r*Math.sin(i), r*Math.cos(i));
				sprites.bullets.render(g,p.add(off),3,2);
			}
		}
		
		if( progress > 1.0 && progress < 1.2 ) {
			audio.playLock("chargeready",0.5);
			var flashprogress = Math.floor((progress - 1.0) * 10);
			sprites.bullets.render(g,p,flashprogress,1);
		}
	}
};