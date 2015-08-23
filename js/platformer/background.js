Background.prototype = new GameObject();
Background.prototype.constructor = GameObject;
function Background(x,y){
	this.constructor();
	
	this.sprite = game.tileSprite;
	this.backgrounds = [
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,41,42,9,9,9,9,9,9,9,9,9,41,42,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,30,31,32,32,32,64,48,9,57,58,9,9,73,74,9,46,0,0,0,0,0,47,9,73,74,9,9,89,90,9,62,0,0,0,0,0,63,9,89,90,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,91,92,62,0,0,0,0,0,63,91,92,9,9,9,9,107,108,62,0,0,0,0,0,63,107,108,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,93,94,94,93,12,28,28,28,28,28,13,93,94,94,93,109,110,110,109,94,93,93,94,93,94,93,109,110,110,109]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,77,78,9,9,9,9,9,27,27,9,9,27,27,9,9,27,27,9,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,91,92,9,25,0,0,26,25,0,0,26,25,0,0,26,107,108,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,9,28,28,9,9,28,28,9,9,28,28,9,9,9,9,93,94,9,93,94,9,94,94,93,9,94,94,93,94,94,109,110,93,109,110,93,110,110,109,93,110,110,109,110,110,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,29,9,9,29,9,9,29,9,9,29,9,9,29,9,9,45,91,92,45,91,92,45,91,92,45,91,92,45,9,9,45,107,108,45,107,108,45,107,108,45,107,108,45,9,9,45,27,27,45,27,27,45,27,27,45,27,27,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,28,28,45,28,28,45,28,28,45,28,28,45,9,94,45,94,93,45,94,94,45,93,94,45,94,93,45,93,110,61,110,109,61,110,110,61,109,110,61,110,109,61,109,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,30,31,32,64,48,9,9,9,9,9,9,9,91,92,9,46,0,0,0,47,9,91,92,9,9,9,9,107,108,9,62,0,0,0,63,9,107,108,9,9,9,9,9,9,9,62,0,0,0,63,9,9,9,9,9,9,9,30,31,32,79,0,0,0,80,32,64,48,9,9,9,9,46,0,0,0,0,0,0,0,0,0,47,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,93,94,12,28,28,28,28,28,28,28,28,28,13,9,9,109,109,94,94,94,93,94,94,94,94,94,93,94,93,94,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110]}
	];
	
	this.saved_rooms = {};
	this.animation = 0;
	this.walls = true;
	this.zIndex = -999;
	
	this.time = 0;
	
	this.lightbeamLoop = 16;
	this.dustSpeed = 0.25;
	this.dustAmount = 10;
	this.dust = new Array();
	for(var i=0; i < 30; i++){
		this.dust.push( {
			"position" : new Point(Math.random()*game.resolution.x, Math.random()*game.resolution.y),
			"direction" : new Point(2*Math.random()-1, 2*Math.random()-1),
			"scale" : 1.0 + Math.random() * 2,
			"lapse" : Math.random() * 500
		});
	}
	
	this.lightBuffer = game.g.createF();
}
Background.prototype.render = function(gl,c){
	this.time += this.delta;
}

Background.prototype.postrender = function(gl,c){
	this.renderDust(gl,c);
	
	if( c.y < 480 ) {
		//Render light beams when player is above ground
		var offset = Math.mod( -c.x / this.lightbeamLoop, 32 );
		var lightIntensity = Math.min( (480 - c.y) / 480.0, 1.0) * 0.5;
		var depthangle = Math.max( 315 + c.y * 0.1, 315);
		for(var i=0; i < 4; i++){
			var p = offset + i * 32;
			var r = depthangle - ( offset * 0.25 + i * 8 );
			var a = 1.0;
			if(i==0) a = offset / 32;
			if(i==3) a = 1.0 - offset / 32;
			this.renderLightbeam(gl,p,r,a*lightIntensity);
		
		}
	}
	
	if( c.y > 720 ) {
		//Render onto different layer
		var depth = Math.min((c.y - 720) / 720, 1);
		
		this.lightBuffer.use(gl);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA );
		
		//fill basic colour
		gl.color = [
			Math.lerp(1.0,0.3,depth),
			Math.lerp(1.0,0.3,depth),
			Math.lerp(1.0,0.5,depth),
			1.0
		];
		gl.scaleFillRect(0,0,game.resolution.x, game.resolution.y);
		
		//render lights
		while( Background.lights.length > 0 ) {
			var light = Background.lights.pop();
			var position = light[0];
			var radius = light[1];
			sprites.halo.renderSize(
				gl, 
				position.x - (radius*0.5), 
				position.y - (radius*0.5), 
				radius, 
				radius,
				0,
				0
			);
		}
		
		//Done, switch back to back buffer
		game.backBuffer.use(gl);
		
		
		gl.blendFunc( gl.ZERO, gl.SRC_COLOR );
		gl.renderBackbuffer(this.lightBuffer.texture);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	}
	Background.lights = new Array();
}

Background.prototype.renderLightbeam = function(g,p,r,a){
	g.blendEquation( g.FUNC_ADD );
	g.blendFunc( g.SRC_ALPHA, g.ONE_MINUS_CONSTANT_ALPHA );
	
	var shader = window.materials["lightbeam"].use();
	
	var data = Sprite.RectBuffer(new Point(p, 0), 32, 128, r);
	var tdata = Sprite.RectBuffer(new Point(), 1, 1);
	
	var buffer = g.createBuffer();
	var tbuffer = g.createBuffer();
	
	g.bindBuffer( g.ARRAY_BUFFER, buffer);
	g.bufferData( g.ARRAY_BUFFER, data, g.DYNAMIC_DRAW );
	shader.set("a_position");
	g.bindBuffer( g.ARRAY_BUFFER, tbuffer);
	g.bufferData( g.ARRAY_BUFFER, tdata, g.DYNAMIC_DRAW );
	shader.set("a_texCoord");
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	shader.set("u_camera", 0, 0);
	
	shader.set("u_color", 1.0, 1.0, 0.8, a);
	
	g.drawArrays(g.TRIANGLE_STRIP, 0, 6);
	
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA );
}
Background.prototype.renderDust = function(g,c){
	for(var i=0; i < Math.min(this.dustAmount, this.dust.length); i++){
		var dust = this.dust[i];
		var x = Math.sin( dust.lapse * dust.direction.x );
		var y = Math.sin( dust.lapse * dust.direction.y );
		dust.lapse += 0.1 * this.delta * this.dustSpeed;
		
		dust.position.x += x * this.delta * dust.scale * this.dustSpeed;
		dust.position.y += y * this.delta * dust.scale * this.dustSpeed;
		
		game.tileSprite.render(
			g, 
			new Point(
				Math.mod( dust.position.x - c.x * dust.scale, game.resolution.x ),
				Math.mod( dust.position.y - c.y * dust.scale,  game.resolution.y ) 
			),
			11, 13, false, 
			"blur", {"blur":Math.min(0.004 * dust.scale, 0.008), "scale": [0.3*dust.scale, 0.3*dust.scale]}
		);
	}
}
Background.prototype.prerender = function(gl,c){
	gl.bindTexture( gl.TEXTURE_2D, game.tileSprite.gl_tex );
	var shader = window.materials["default"].use();
	
	
	if( c.y < game.resolution.y / Background.wallEffect ) {
		//Clouds
		//cloud length = 128
		this.sprite.renderSize(gl,0,0,game.resolution.x,176,203);
		
		var cloudVerts = new Array();
		var sky_offset = this.animation / 20.0;
		var draws = Math.ceil(game.resolution.x / 128.0) + 1;
		for(var i = 0; i < draws; i++){
			var offsetx = Math.floor((i * 128)-(sky_offset%128));
			var buffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
			gl.bufferData( gl.ARRAY_BUFFER, Background.cloudBuffer, gl.DYNAMIC_DRAW);
			//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
			shader.set("a_position");
			
			var tbuffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
			gl.bufferData( gl.ARRAY_BUFFER, Background.cloudTexture, gl.DYNAMIC_DRAW);
			//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);			
			shader.set("a_texCoord");
			
			//gl.uniform2f(res, game.resolution.x, game.resolution.y);
			//gl.uniform2f(cam, offsetx, 144);
			shader.set("u_resolution", game.resolution.x, game.resolution.y);
			shader.set("u_camera", offsetx, 144);
			
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
		}
		
		for(var l=0; l < 3; l++) {
			var tiles = [];
			var textr = [];
			var ts = 16;
			for(var i=0; i < game.resolution.x+ts; i+=ts){
				tiles.push(i); tiles.push(0); 
				tiles.push(i+ts); tiles.push(0); 
				tiles.push(i); tiles.push(32); 
				tiles.push(i); tiles.push(32); 
				tiles.push(i+ts); tiles.push(0); 
				tiles.push(i+ts); tiles.push(32);
				
				var txoff = (2-l)*0.0625
				textr.push(txoff+0.5); textr.push(0.75);
				textr.push(txoff+0.5625); textr.push(0.75);
				textr.push(txoff+0.5); textr.push(0.875);
				textr.push(txoff+0.5); textr.push(0.875);
				textr.push(txoff+0.5625); textr.push(0.75);
				textr.push(txoff+0.5625); textr.push(0.875);
			}
			var buffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(tiles), gl.DYNAMIC_DRAW);
			//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
			shader.set("a_position");
			
			var tbuffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(textr), gl.DYNAMIC_DRAW);
			//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);
			shader.set("a_texCoord");
			
			var offcam = new Point(
				(c.x<0?-ts:0) + (Math.floor((0.2*(l+0.1))*-c.x)%ts),
				Math.floor(168+l*8+l*(c.y*-0.003))
			);
			
			//gl.uniform2f(res, game.resolution.x, game.resolution.y);
			//gl.uniform2f(cam, offcam.x, offcam.y);
			shader.set("u_resolution", game.resolution.x, game.resolution.y);
			shader.set("u_camera", offcam.x, offcam.y);
			
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, tiles.length/2);
		}
	}
	
	//if( c.y > 32 && this.walls ) {
	if( c.y > -64 ) {
		//Background wall
		var tiles = new Array();
		var textr = new Array();
		var ts = 32;
		var starty = 0;
		for(var x=-ts; x < game.resolution.x+ts; x+=ts) 
		for(var y=-ts; y < game.resolution.y+ts; y+=ts){
			tiles.push(x); tiles.push(y); 
			tiles.push(x+ts); tiles.push(y); 
			tiles.push(x); tiles.push(y+ts); 
			tiles.push(x); tiles.push(y+ts); 
			tiles.push(x+ts); tiles.push(y); 
			tiles.push(x+ts); tiles.push(y+ts);
			
			textr.push(0.5); textr.push(0.375);
			textr.push(0.625); textr.push(0.375);
			textr.push(0.5); textr.push(0.5);
			textr.push(0.5); textr.push(0.5);
			textr.push(0.625); textr.push(0.375);
			textr.push(0.625); textr.push(0.5);
		}
		var buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(tiles), gl.DYNAMIC_DRAW);
		shader.set("a_position");
		
		var tbuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(textr), gl.DYNAMIC_DRAW);
		shader.set("a_texCoord");
		
		var y_offset = (c.y * -Background.wallEffect) % ts
		if( c.y < game.resolution.y / Background.wallEffect ) {
			y_offset = game.resolution.y - c.y * Background.wallEffect;
		}
		var offcam = new Point(
			Math.round((c.x * -Background.wallEffect) % ts),
			Math.round(y_offset)
		);
		
		shader.set("u_resolution", game.resolution.x, game.resolution.y);
		shader.set("u_camera", offcam.x, offcam.y);
		
		gl.drawArrays(gl.TRIANGLES, 0, tiles.length/2);
	} 
	
	
	this.animation += this.delta;
}
Background.prototype.roomAtLocation = function(x,y){
	if(y==0 && (x==0||x==1)) return -1;
	
	try {
	var code = x+"_"+y;
		if( code in this.saved_rooms ) {
			return this.saved_rooms[code];
		} else if( code in dataManager.slices.peek().data ) {
			var tags = ["normal"];
			var total = 0;
			for(var i=0; i<this.backgrounds.length; i++) if(this.backgrounds[i].tags.intersection(tags).length>0) total += this.backgrounds[i].rarity;
			var roll = Math.random() * total;
			for(var i=0; i<this.backgrounds.length; i++) if(this.backgrounds[i].tags.intersection(tags).length>0) {
				if( roll < this.backgrounds[i].rarity ) {
					this.saved_rooms[code] = i;
					return i;
				}
				roll -= this.backgrounds[i].rarity;
			}
		}
	} catch (err) {
		return -1;
	}
}
Background.prototype.idle = function(){}
Background.lightbeam = function(p, r, w, h){
	r = r / 180 * Math.PI;
	var s = Math.sin(r); //-0.707
	var c = Math.cos(r); //0.707
	return new Float32Array([
		p.x, p.y,
		p.x+(w*c), p.y+(w*s),
		p.x-(h*s), p.y+(h*c),
		p.x-(h*s), p.y+(h*c),
		p.x+(h*s), p.y+(h*c),
		p.x+(w*c)-(h*s), p.y+(w*s)+(h*c),
	]);
}
Background.cloudBuffer = new Float32Array([
	0, 0,
	128, 0,
	0, 32,
	0, 32,
	128, 0,
	128, 32
]);
Background.cloudTexture = new Float32Array([
	0.5, 0.875, 1.0, 0.875, 0.5, 1.0, 0.5, 1.0, 1.0, 0.875, 1.0, 1.0
]);
Background.wallEffect = 0.5;
Background.rooms = [
	{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,9,10,10,10,10,10,11,26,26,26,26,26,12,13,14,25,0,0,0,0,0,27,12,13,14,26,26,28,29,30,25,0,0,0,0,0,27,28,29,30,26,26,44,45,46,25,0,0,0,0,0,27,44,45,46,26,26,60,61,62,25,0,0,0,0,0,27,60,61,62,26,26,76,77,78,25,0,0,0,0,0,27,76,77,78,26,26,26,26,26,41,42,42,42,42,42,43,26,26,26,26,26,12,13,14,9,10,10,10,10,10,11,12,13,14,26,26,28,29,30,25,0,0,0,0,0,27,28,29,30,26,26,44,45,46,25,0,0,0,0,0,27,44,45,46,26,26,60,61,62,25,0,0,0,0,0,27,60,61,62,26,26,76,77,78,41,42,42,42,42,42,43,76,77,78,26,93,94,93,94,93,94,93,94,93,94,93,94,93,94,93,109,110,109,110,109,110,109,110,109,110,109,110,109,110,109]},
	{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,9,10,10,11,9,10,10,10,11,9,10,10,11,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,25,0,0,27,25,0,0,0,27,25,0,0,27,26,26,41,42,42,43,41,42,42,42,43,41,42,42,43,26,93,94,93,94,93,94,93,94,93,94,93,94,93,94,93,109,110,109,110,109,110,109,110,109,110,109,110,109,110,109]},
	{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,12,13,14,26,26,12,13,14,26,26,12,13,14,26,26,28,29,30,26,26,28,29,30,26,26,28,29,30,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,44,45,46,26,26,60,61,62,26,26,60,61,62,26,26,60,61,62,26,26,76,77,78,26,26,76,77,78,26,26,76,77,78,26,93,94,93,94,93,94,93,94,93,94,93,94,93,94,93,109,110,109,110,109,110,109,110,109,110,109,110,109,110,109]},
	{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,59,26,26,26,26,26,26,59,26,26,26,59,26,26,26,9,10,11,26,26,26,26,26,26,26,26,26,26,59,26,25,0,27,26,26,26,26,26,26,26,26,26,26,26,9,74,0,73,11,59,26,26,26,26,26,9,10,11,26,25,0,0,0,27,26,9,10,11,26,26,25,0,27,26,25,0,0,0,27,26,25,0,27,26,9,74,0,73,11,25,0,0,0,27,9,74,0,73,11,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,25,0,0,0,27,41,42,42,42,43,41,42,42,42,43,41,42,42,42,43,93,94,93,94,93,94,93,94,93,94,93,94,93,94,93,109,110,109,110,109,110,109,110,109,110,109,110,109,110,109]}
];
Background.areaFree = function(pos,g){
	//check base
	var y = 2;
	var ts = 16;
	for(var x=-2; x < 2; x++){
		if( g.getTile(pos.x + ts * x, pos.y + ts * y, g.tileCollideLayer) <= 0 ){
			return false;
		}
	}
	for(var x=-2; x < 2; x++) for(var y=-2; y < 2; y++){
		if( g.getTile(pos.x + ts * x, pos.y + ts * y, g.tileCollideLayer) > 0 ){
			return false;
		}
	}
	return true;
}
Background.lights = new Array();
Background.pushLight = function(p,r,c){
	if( Background.lights.length < 20 ) {
		p = p || new Point();
		r = r || 0;
		c = c || [1.0,1.0,1.0,1.0];
		Background.lights.push([p,r,c]);
	}
}