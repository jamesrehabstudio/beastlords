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
	this.sealevel = 240;
	
	this.ambience = [0.3,0.3,0.5];
	this.ambienceStrength = 0.0;
	this.darknessFunction = function(c){
		return (c.y-720) / 720;
	}
	
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
	
	//Render ambience
	this.lightBuffer.use(gl);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA );
	
	//Calculate strength
	this.ambienceStrength = Math.min(Math.max(this.darknessFunction(c),0),1);
	gl.color = [
		Math.lerp(1.0,this.ambience[0],this.ambienceStrength),
		Math.lerp(1.0,this.ambience[1],this.ambienceStrength),
		Math.lerp(1.0,this.ambience[2],this.ambienceStrength),
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
	var backgroundTiles = _map_backdrops[1];
	var tileset = sprites[backgroundTiles.tileset];
	
	var zero = game.tileDimension.start;
	var strength = 1.0;
	if(
		game.tileDimension.width()*16 - game.resolution.x > 
		game.tileDimension.height()*16 - game.resolution.y
	){
		var largest = game.tileDimension.width()*16 - game.resolution.x
		strength = (48*16 - game.resolution.x) / largest;
	}else{
		var largest = game.tileDimension.width()*16 - game.resolution.x
		strength = (48*16 - game.resolution.y) / largest;
	}
	
	
	if(c.y < this.sealevel){
		var x = ((c.x) - zero.x*16) * strength;
		var y = (c.y * strength) + (48*16 - game.resolution.y);
		
		if("upper3" in backgroundTiles){
			tileset.renderTiles(gl,backgroundTiles["upper3"],48,0,0);
		}
		if("upper2" in backgroundTiles){
			tileset.renderTiles(gl,backgroundTiles["upper2"],48,x*0.6666666666,y*0.66666666);
		}
		if("upper1" in backgroundTiles){
			tileset.renderTiles(gl,backgroundTiles["upper1"],48,x,y);
		}
	}
	if(c.y > this.sealevel){
		
		
		var x = ((c.x) - zero.x*16) * strength;
		var y = ((c.y) - zero.y*16) * strength;
		
		if("under1" in backgroundTiles){
			tileset.renderTiles(gl,backgroundTiles["under1"],48,x,y);
		}
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
Background.lights = new Array();
Background.pushLight = function(p,r,c){
	if( Background.lights.length < 20 ) {
		p = p || new Point();
		r = r || 0;
		c = c || [1.0,1.0,1.0,1.0];
		Background.lights.push([p,r,c]);
	}
}