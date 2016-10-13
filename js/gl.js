window.materials = {
	
};

function Material(gl,name,ops){
	var fragmentMaterial = this.getShader(gl, ops["fs"], gl.FRAGMENT_SHADER);
	var vertexMaterial = this.getShader(gl, ops["vs"], gl.VERTEX_SHADER);

	// Create the shader program

	this.program = gl.createProgram();	
	
	gl.attachShader(this.program, vertexMaterial);
	gl.attachShader(this.program, fragmentMaterial);
	gl.linkProgram(this.program);

	// If creating the shader program failed, alert

	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		console.error("Cannot load shader");
		return;
	}
		
	//Fetch properties
	this.gl = gl;
	this.properties = {};
	
	this.settings = [];
	if( "settings" in ops ) for( var i in ops.settings ){
		ops.settings[i].unshift(i);
		this.settings.push( ops.settings[i] );
	}
	
	//Find exposed Uniforms and attributes
	this.gatherProperties();
	
	//All shaders use the same uvs
	this.geometryBuffer = gl.createBuffer();
	this.textcordBuffer = gl.createBuffer();
	
	window.materials[name] = this;
	if( !("default" in window.materials ) ){
		window.materials["default"] = this
	}
}

Material.prototype.gatherProperties = function() {
	//Gather Uniforms
	for(var j=0; j < 2; j++){
		
		//Determine if we're checking for attributes or uniforms
		var isUniform = j == 0;
		var activeType = isUniform ? this.gl.ACTIVE_UNIFORMS : this.gl.ACTIVE_ATTRIBUTES
		
		var count = this.gl.getProgramParameter(this.program, activeType);
		for(var i=0; i < count; i++){
			if(isUniform){
				var details = this.gl.getActiveUniform(this.program,i);
				var location = this.gl.getUniformLocation(this.program, details.name);
				this.gl.enableVertexAttribArray(location);
			} else {
				var details = this.gl.getActiveAttrib(this.program,i);
				var location = this.gl.getAttribLocation(this.program, details.name);
				this.gl.enableVertexAttribArray(location);
			}
			
			this.properties[details.name] = {
				"uniform" : isUniform,
				"type" : Material.propertyTypes.indexOf(details.type),
				"location" : location,
				"texture" : 0
			}
		}
	}
}
Material.propertyTypes = [
	WebGLRenderingContext.FLOAT,
	WebGLRenderingContext.FLOAT_VEC2,
	WebGLRenderingContext.FLOAT_VEC3,
	WebGLRenderingContext.FLOAT_VEC4,
	WebGLRenderingContext.FLOAT_MAT3,
	WebGLRenderingContext.FLOAT_MAT4,
	WebGLRenderingContext.SAMPLER_2D,
	WebGLRenderingContext.INT,
	WebGLRenderingContext.UNSIGNED_INT
];
Material.prototype.set = function(name, a,b,c,d) {
	if(!(name in this.properties )) return;
	var prop = this.properties[name];
	
	if(prop.location < 0){
		return;
	} else if( prop.uniform ) {
		switch(prop.type){
			case 0:
				this.gl.uniform1f(prop.location, a);
			break; case 1:
				this.gl.uniform2f(prop.location, a, b);
			break; case 2:
				this.gl.uniform3f(prop.location, a, b, c);
			break; case 3:
				this.gl.uniform4f(prop.location, a, b, c, d);
			break; case 4:
				this.gl.uniformMatrix3fv(prop.location, false, a);
			break; case 5:
				this.gl.uniformMatrix4fv(prop.location, false, a);
			break; case 6:
				this.setTexture(a, this.gl["TEXTURE"+prop.texture]);
			break;
		}
	} else {
		switch(prop.type){
			case 0:
				this.gl.vertexAttribPointer(prop.location, 1, this.gl.FLOAT, false, 0, 0);
			break; default:
				this.gl.vertexAttribPointer(prop.location, a, this.gl.FLOAT, false, 0, 0);
		}
	}
}
Material.prototype.setTexture = function(img, slot){
	//if(img != Material.currentTexture){
		//Material.currentTexture = img;
		if(slot === undefined){
			slot = this.gl.TEXTURE0;
		}
		if(!(img instanceof WebGLTexture)){
			img = sprites[img].gl_tex;
		}
		
		if(Material.currentTexture !== img){
			this.gl.activeTexture(slot);
			this.gl.bindTexture(this.gl.TEXTURE_2D, img);
			Material.currentTexture = img;
		}
	//}
}
Material.prototype.use = function() {
	/*if(this == Material.current){
		return this;
	}*/
	game.shader = this;
	this.gl.useProgram(this.program);
	
	var textureCount = 0;
	for(var j in this.properties) {
		if(this.properties[j].type == 6){
			this.properties[j].texture = textureCount;
			this.gl.uniform1i(this.properties[j].location, textureCount);
			textureCount++;
		}
	}
	
	for(var i = 0; i < this.settings.length; i++){
		this.set.apply(this, this.settings[i]);
	}
	//Material.current = this;
	//Material.currentTexture = null;
	return this;
}
Material.current = null;
Material.currentTexture = null;
Material.SHADER_FRAGMENT = 0;
Material.SHADER_FRAGMENT = 1;
Material.prototype.getShader = function(gl, source, type) {	
	var shader = gl.createShader(type);
	
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);  

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
		alert("An error occurred compiling the materials: " + gl.getShaderInfoLog(shader));  
		return null;  
	}

	return shader;
}

/* Object for wrapping sprites */
function Sprite(url, options) {
	options = options || {};
	
	var offset = options['offset'] || new Point();
	
	this.img = new Image();
	this.img.src = url;
	this.img.sprite = this;
	this.img.onload = function(){ 
		if( this.sprite.isCorrectSize() ) {
			this.sprite.imageLoaded(); 
		} else {
			this.sprite.resize(); 
		}
	}
	this.loaded = false;
	
	this.frame_width = options['width'] || 0;
	this.frame_height = options['height'] || 0;
	this.material = new Material(
		game.g, url, 
		{
			"fs":shaders["2d-fragment-shader"],
			"vs":shaders["2d-vertex-default"], 
			"settings":{
				"u_color":[1.0,1.0,1.0,1.0]
			}
		}
	);
	
	this.setOffset(offset);
	
	this.name = "";
}
Sprite.prototype.setOffset = function(os) {
	//Set offset and create mesh
	this.offset = os;
	this.mesh = new Float32Array([
		-this.offset.x, -this.offset.y,
		this.frame_width-this.offset.x, -this.offset.y,
		-this.offset.x,  this.frame_height-this.offset.y,
		-this.offset.x,  this.frame_height-this.offset.y,
		this.frame_width-this.offset.x, -this.offset.y,
		this.frame_width-this.offset.x, this.frame_height-this.offset.y
	]);
	
	var gl = game.g;
	
	//Set UVs
	gl.bindBuffer(gl.ARRAY_BUFFER, this.material.textcordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, Sprite.SQUARE, gl.DYNAMIC_DRAW);
	this.material.set("a_texCoord", 2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.material.geometryBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, this.mesh, gl.DYNAMIC_DRAW);
	this.material.set("a_position", 2);
	
}
Sprite.prototype.isCorrectSize = function() {
	if( this.img.width != this.img.height ) return false;
	if( [1,2,4,8,16,32,64,128,256,512,1024,2048,4096].indexOf(this.img.width) < 0 ) return false;
	return true;
}
Sprite.prototype.resize = function() {
	//Create a canvas for resizing the images
	var max = Math.min( Math.max( this.img.width, this.img.height ), 4096 );
	var size = 2; while( size < max ) size = size * 2;

	var temp_c = document.createElement('canvas'); temp_c.width = size; temp_c.height = size;
	var temp_g = temp_c.getContext('2d');
	temp_g.drawImage( this.img,0,0,this.img.width,this.img.height);
	this.img.src = temp_c.toDataURL();
}
Sprite.prototype.imageLoaded = function() {
	this.loaded = true;
	this.width = this.img.width;
	this.height = this.img.height;
	
	if ( this.frame_width < 1 ) {
		this.frame_width = this.width;
	}
	if ( this.frame_height < 1 ) {
		this.frame_height = this.height;
	}
	
	var gl = game.g;
	
	//Create WebGL context for texture
	this.gl_tex = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, this.gl_tex );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	//gl.generateMipmap(gl.TEXTURE_2D);
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
	
	this.material.set("u_image",this.gl_tex);
}
	
Sprite.prototype.render = function( gl, p, frame_x, frame_y, flip, shaderOps ) {
	if( !this.loaded  ) return;
	
	shaderOps = shaderOps || {};
	
	//Set default shader, scale and rotation
	var shader = this.material;
	var scale = new Point(1,1);
	var rotate = 0.0;
	
	//Choose shader
	if( "shader" in shaderOps){
		if( shaderOps["shader"] instanceof Material ){
			//Correct shader already selected
		} else if( shaderOps["shader"] in window.materials ){
			shader = window.materials[shaderOps["shader"]]
		}
	}
	
	shader.use();
	
	//Set shader options
	if("scalex" in shaderOps){
		scale.x *= shaderOps["scalex"];
	}
	if("scaley" in shaderOps){
		scale.y *= shaderOps["scaley"];
	}
	if("scale" in shaderOps){
		scale = scale.scale(shaderOps["scale"] * 1);
	}
	if("rotate" in shaderOps){
		rotate = shaderOps["rotate"] / 180 * Math.PI;
		//r = r / 180 * Math.PI;
	}
	for(var i in shaderOps){
		if(i == "shader"){
			//Do nothing
		} else if(shaderOps[i] instanceof Array){
			shader.set.apply(shader, [i].concat(shaderOps[i]));
		} else {
			shader.set(i, shaderOps[i]);
		}
	}
	
	//texture is mirrored in negative index, flip inverts UVs
	if( flip ) {
		frame_x = -(frame_x + 1);
		p.x += this.offset.x * 2 - this.frame_width;
	}
	
	shader.set("u_image",this.gl_tex);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.material.textcordBuffer);
	shader.set("a_texCoord", 2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.material.geometryBuffer);
	shader.set("a_position", 2);
	
	//Set transformation matrices for vertex shader
	shader.set("u_frame", frame_x, frame_y, this.frame_width/this.img.width, this.frame_height/this.img.height);
	shader.set("u_world", new Matrix2D().transition(p.x,p.y).rotate(rotate).multiply(new Matrix2D().scale(scale.x,scale.y)).toFloatArray());
	shader.set("u_camera", game.cameraMatrix.toFloatArray());
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}
Sprite.prototype.renderTiles = function(gl,tiles,width,x,y,animation){
	if( !this.loaded ) return;
	
	var camera = new Point(x,y);
	
	//var tileVerts = new Array();
	var material = window.materials["tiles"].use();
	var uvVerts = new Array();
	var ts = this.frame_width;
	
	
		
	var campos = new Point(
		0-Math.round(Math.mod(camera.x,ts)),
		0-Math.round(Math.mod(camera.y,ts))
	);
	
	material.set("u_resolution", game.resolution.x, game.resolution.y);
	material.set("u_camera", campos.x, campos.y);
	material.set("u_image", this.gl_tex);
	
	if(!Sprite.gridBuffer){
		Sprite.gridBuffer = gl.createBuffer();
		Sprite.gridUVBuffer = gl.createBuffer();
		Sprite.tilebuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, Sprite.gridBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, Sprite.createTileGrid(16,1), gl.STATIC_DRAW);
		material.set("a_tilegrid", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, Sprite.gridUVBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, Sprite.createTileGrid(1,0), gl.STATIC_DRAW);
		material.set("a_tileuvs", 2);
	} else {
		gl.bindBuffer(gl.ARRAY_BUFFER, Sprite.gridBuffer);
		material.set("a_tilegrid", 2);
		gl.bindBuffer(gl.ARRAY_BUFFER, Sprite.gridUVBuffer);
		material.set("a_tileuvs", 2);
	}
	
	var cam = new Point(Math.floor(camera.x/ts),Math.floor(camera.y/ts));
	var time = new Date() * 0.001;
	
	for(var _x=0; _x < 28; _x++) for(var _y=0; _y < 16; _y++) {
		var tile_index = (_x+cam.x) + ((_y+cam.y) * width);
		var tile = tiles[tile_index];
		if( tile == 0 || tile === undefined) tile = window.BLANK_TILE;
		
		var tileData =  getTileData(tile);
		
		if(animation != undefined){
			if(tileData.tile in animation){
				var anim = animation[tileData.tile];
				var f = Math.floor((anim.speed * time) % anim.frames.length);
				tileData.tile = anim.frames[f];
			}
		}
		
		var flags = Math.abs(tile >> 28) << 2;
		
		uvVerts.push(tileData.tile); uvVerts.push(flags+0); //topleft
		uvVerts.push(tileData.tile); uvVerts.push(flags+1); //topright
		uvVerts.push(tileData.tile); uvVerts.push(flags+2); //botleft
		uvVerts.push(tileData.tile); uvVerts.push(flags+2); //botleft
		uvVerts.push(tileData.tile); uvVerts.push(flags+1); //topright
		uvVerts.push(tileData.tile); uvVerts.push(flags+3); //botright
	}
		
	gl.bindBuffer(gl.ARRAY_BUFFER, Sprite.tilebuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvVerts), gl.DYNAMIC_DRAW);
	material.set("a_tile",2);
	
	gl.drawArrays(gl.TRIANGLES, 0, Math.floor(Sprite.tileVertLength/2));
}

Sprite.gridBuffer = 0;
Sprite.gridUVBuffer = 0;
Sprite.tilebuffer = 0;
Sprite.tileVertLength = 0;

Sprite.createTileGrid = function(ts,offset){
	var tileVerts = new Array();
	
	for(var _x=0; _x < 28; _x++) for(var _y=0; _y < 16; _y++) {
		var x = _x*ts*offset;
		var y = _y*ts*offset;
		tileVerts.push(x); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x); tileVerts.push(y+ts);
		tileVerts.push(x+ts); tileVerts.push(y);
		tileVerts.push(x+ts); tileVerts.push(y+ts);
	}
	
	Sprite.tileVertLength = tileVerts.length;
	return new Float32Array(tileVerts);
}

Sprite.SQUARE = new Float32Array([
	0, 0,
	1, 0,
	0, 1,
	0, 1,
	1, 0,
	1, 1
]);

Sprite.prototype.getTileUVMap = function(tileData, uvVerts){
	var tileUV = this.uv(tileData.tile-1);
		
	if(tileData.dflip){
		if(tileData.hflip){
			if(tileData.vflip){
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
			} else {
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
			}
		} else {
			if(tileData.vflip){
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
			} else {
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]); //topleft
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]); //topright
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]); //botleft
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]); //botleft
				uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]); //topright
				uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]); //botright
			}
		}
		
	} else {
		if(tileData.hflip){
			var a = tileUV[0];
			tileUV[0] = tileUV[2];
			tileUV[2] = a;
		}
		if(tileData.vflip){
			var a = tileUV[1];
			tileUV[1] = tileUV[3];
			tileUV[3] = a;
		}
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
		uvVerts.push(tileUV[0]); uvVerts.push(tileUV[3]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[1]);
		uvVerts.push(tileUV[2]); uvVerts.push(tileUV[3]);
	}
	
	return uvVerts;
}

Sprite.RectBuffer = function(p, w, h, r, o){
	//creates a set of data for a generic rectangle
	if( r == undefined ) r = 0;
	if( o == undefined ) o = new Point();
	r = r / 180 * Math.PI;
	var s = Math.sin(r); 
	var c = Math.cos(r); 
	
	var topleft = p.add(new Point(0,0).rotate(r,o));
	var topRight = p.add(new Point(w,0).rotate(r,o));
	var botLeft = p.add(new Point(0,h).rotate(r,o));
	var botRight = p.add(new Point(w,h).rotate(r,o));
	
	return new Float32Array([
		topleft.x, topleft.y,
		topRight.x, topRight.y,
		botLeft.x, botLeft.y,
		botLeft.x, botLeft.y,
		topRight.x, topRight.y,
		botRight.x, botRight.y
	]);
}

WebGLRenderingContext.prototype.createF = function(size){
	//Create a Frame Buffer
	var fb = this.createFramebuffer();
	this.bindFramebuffer( this.FRAMEBUFFER, fb );
	fb.width = size || 512;
	fb.height = size || 512;
	
	var ft = this.createTexture();
	this.bindTexture(this.TEXTURE_2D, ft);
	this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE);
	this.texParameteri(this.TEXTURE_2D, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE);
	this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.NEAREST);
	this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.NEAREST);
	
	this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, fb.width, fb.height, 0, this.RGBA, this.UNSIGNED_BYTE, null);
	
	var rb = this.createRenderbuffer();
	this.bindRenderbuffer(this.RENDERBUFFER, rb);
	this.renderbufferStorage(this.RENDERBUFFER, this.DEPTH_COMPONENT16, fb.width, fb.height);
	
	this.framebufferTexture2D(this.FRAMEBUFFER, this.COLOR_ATTACHMENT0, this.TEXTURE_2D, ft, 0);
	this.framebufferRenderbuffer(this.FRAMEBUFFER, this.DEPTH_ATTACHMENT, this.RENDERBUFFER, rb);
	
	//Reset
	this.bindTexture(this.TEXTURE_2D, null);
	this.bindRenderbuffer(this.RENDERBUFFER, null);
	this.bindFramebuffer(this.FRAMEBUFFER, null);
	
	return {
		"texture" : ft,
		"buffer" : fb,
		"use" : function(gl){
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
		},
		"reset" : function(gl){
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}
}
WebGLRenderingContext.prototype.scaleFillRect = function(x,y,w,h,ops){
	geo = new Float32Array(Sprite.SQUARE);
	
	var shader = window.materials["solid"];
	var buffer = this.createBuffer();
	var color = this.color || [0.0,0.0,0.0,1.0];
	
	shader.use();
	shader.set("u_color", color[0], color[1], color[2], color[3]);
	this.bindBuffer( this.ARRAY_BUFFER, buffer );
	this.bufferData( this.ARRAY_BUFFER, new Float32Array(geo), this.DYNAMIC_DRAW);
	shader.set("a_position", 2);
		
	shader.set("u_frame", 0, 0, 1, 1);
	shader.set("u_world", new Matrix2D().transition(x,y).rotate(0).multiply(new Matrix2D().scale(w,h)).toFloatArray());
	shader.set("u_camera", game.cameraMatrix.toFloatArray());
	
	this.drawArrays(this.TRIANGLE_STRIP, 0, geo.length/2);
}

WebGLRenderingContext.prototype.renderBackbuffer = function(image, tint, ops){
	var top = game.resolution.y / 512;
	var lef = game.resolution.x / 512;
	
	var geo = Sprite.RectBuffer(new Point(-1, -1),2 ,2);
	var tex = Sprite.RectBuffer(new Point(),lef ,top);
	
	ops = ops || {};
	
	var shader = window.materials["backbuffer"];
	
	if("shader" in ops){
		shader = window.materials[ops["shader"]];
	}
	shader.use();
	
	for(var i in ops){
		if(ops[i] instanceof Array){
			shader.set.apply(shader, [i].concat(ops[i]));
		} else {
			shader.set(i, ops[i]);
		}
	}
	
	this.bindTexture(this.TEXTURE_2D, image);
	
	if(tint == undefined){
		tint = [1.0,1.0,1.0,1.0];
	}
	
	var buffer = this.createBuffer();
	this.bindBuffer( this.ARRAY_BUFFER, buffer );
	this.bufferData( this.ARRAY_BUFFER, geo, this.DYNAMIC_DRAW);
	shader.set("a_position", 2);
	
	var tbuffer = this.createBuffer();
	this.bindBuffer( this.ARRAY_BUFFER, tbuffer );
	this.bufferData( this.ARRAY_BUFFER, tex, this.DYNAMIC_DRAW);
	shader.set("a_texCoord", 2);
	shader.set("u_color", tint[0],tint[1],tint[2],tint[3]);
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	
	this.drawArrays(this.TRIANGLE_STRIP, 0, geo.length/2);
}
