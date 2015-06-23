window.materials = {
	
};

function Material(gl,name,ops){
	var fragmentMaterial = this.getShader(gl, ops["fs"]);
	var vertexMaterial = this.getShader(gl, ops["vs"]);

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
	var props = [
		document.getElementById(ops["fs"]).innerHTML.match(/\s*uniform\s+([^\s]+)\s+([^\s]+)/g),
		document.getElementById(ops["vs"]).innerHTML.match(/\s*uniform\s+([^\s]+)\s+([^\s]+)/g),
		document.getElementById(ops["fs"]).innerHTML.match(/\s*attribute\s+([^\s]+)\s+([^\s]+)/g),
		document.getElementById(ops["vs"]).innerHTML.match(/\s*attribute\s+([^\s]+)\s+([^\s]+)/g)
	];
	for(var i=0; i < props.length; i++){
		if( props[i] instanceof Array ) for(var j=0; j < props[i].length; j++) {
			this.addProperty(props[i][j]);
		}
	}
	
	window.materials[name] = this;
	if( !("default" in window.materials ) ){
		window.materials["default"] = this
	}
}

Material.prototype.addProperty = function(prop) {
	try{
		prop = prop.trim().replace(";","");
		var props = prop.split(" ");
		
		if( props.length >= 3 ) {
			var isUniform = props[0]=="uniform";
			var type = props[1];
			var name = props[2];
			var location;
			if( isUniform ) {
				location = this.gl.getUniformLocation(this.program, name);
				this.gl.enableVertexAttribArray(location);
			} else {
				location = this.gl.getAttribLocation(this.program, name);
				this.gl.enableVertexAttribArray(location);
			}
			this.properties[name] = {
				"uniform" : isUniform,
				"type" : Material.propertyTypes.indexOf(type),
				"location" : location
			}
		}
	} catch ( err ){
		console.error("Error reading property: " + prop);
	}
}

Material.propertyTypes = [
	"float",
	"vec2",
	"vec4"
];
Material.prototype.set = function(name, args) {
	if(!(name in this.properties )) return;
	var prop = this.properties[name];
	
	if( !(args instanceof Array )) {
		args = Array.prototype.slice.apply(arguments, [1]);
	}
	
	if( prop.uniform ) {
		if( prop.type == 0 ) {
			this.gl.uniform1f(prop.location, args[0]);
		} else if( prop.type == 1 ) {
			this.gl.uniform2f(prop.location, args[0], args[1]);
		} else if( prop.type == 2 ){
			this.gl.uniform4f(prop.location, args[0], args[1], args[2], args[3]);
		}
	} else {
		this.gl.vertexAttribPointer(prop.location, 2, this.gl.FLOAT, false, 0, 0);
	}
}

Material.prototype.use = function() {
	game.shader = this;
	this.gl.useProgram(this.program);
	
	for(var i = 0; i < this.settings.length; i++){
		this.set.apply(this, this.settings[i]);
	}
	return this;
}
Material.prototype.getShader = function(gl, id) {
	var shaderScript, theSource, currentChild, shader;

	shaderScript = document.getElementById(id);

	if (!shaderScript) {
		return null;
	}

	theSource = "";
	currentChild = shaderScript.firstChild;

	while(currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) {
			theSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}
	
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		// Unknown shader type
		return null;
	}
	gl.shaderSource(shader, theSource);

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
	this.offset = offset;
	this.loaded = false;
	
	this.frame_width = options['width'] || 0;
	this.frame_height = options['height'] || 0;
	
	//Create buffers
	this.bufferData = new Float32Array([
		0, 0,
		this.frame_width, 0,
		0,  this.frame_height,
		0,  this.frame_height,
		this.frame_width, 0,
		this.frame_width, this.frame_height
	]);
	this.buffer = false;	
	
	this.name = "";
}
Sprite.prototype.isCorrectSize = function() {
	if( this.img.width != this.img.height ) return false;
	if( [1,2,4,8,16,32,64,128,256,512,1024,2048].indexOf(this.img.width) < 0 ) return false;
	return true;
}
Sprite.prototype.resize = function() {
	//Create a canvas for resizing the images
	var max = Math.min( Math.max( this.img.width, this.img.height ), 1024 );
	var size = 2; while( size < max ) size = size * 2;
//	console.log( size, this.name, max );

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
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	//gl.generateMipmap(gl.TEXTURE_2D);
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
	
	//gl.bindTexture( gl.TEXTURE_2D, null );
}

Sprite.prototype.uv = function( frame, row ) {
	if(frame == undefined ){
		frame = row = 0;
	} else if ( row == undefined ) {
		var f = Math.floor(frame);
		frame = f % Math.floor(this.width/this.frame_width);
		row = Math.floor(f / Math.floor(this.width/this.frame_width));
	} else {
		frame = ~~frame;
		row = ~~row;
	}
	
	var xinc = this.frame_width / (this.width * 1.0);
	var yinc = this.frame_height / (this.height * 1.0);
	
	return [frame * xinc, row * yinc, (frame+1) * xinc, (row+1) * yinc];
}
	
Sprite.prototype.render = function( gl, p, frame, row, flip, shader, shaderOps ) {
	if( !this.loaded  ) return;
	
	if(frame == undefined ){
		frame = row = 0;
	} else if ( row == undefined ) {
		var f = Math.floor(frame);
		frame = f % Math.floor(this.width/this.frame_width);
		row = Math.floor(f / Math.floor(this.width/this.frame_width));
	} else {
		frame = ~~frame;
		row = ~~row;
	}
	
	if( shader instanceof Material ){
		//Correct shader already selected
	} else if( shader in window.materials ){
		shader = window.materials[shader].use();
	} else { 
		shader = window.materials["default"].use();
	}
	
	shaderOps = shaderOps || {};
	for(var i in shaderOps){
		shader.set(i, shaderOps[i]);
	}
	
	var xinc = this.frame_width / (this.img.width * 1.0);
	var yinc = this.frame_height / (this.img.height * 1.0);
	
	var x1 = frame * xinc;
	var x2 = (frame+1) * xinc;
	var y1 = row * yinc;
	var y2 = (row+1) * yinc;
	var offset = new Point(this.offset.x, this.offset.y);
	if( flip ) {
		var temp = x1;
		x1 = x2;
		x2 = temp;
		offset.x = this.frame_width - offset.x;
	}
	
	var texbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2
	]), gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);
	shader.set("a_texCoord");
	
	gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
	if( !this.buffer ) this.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	
	gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
	shader.set("a_position");
	shader.set("u_resolution",game.resolution.x, game.resolution.y);
	shader.set("u_camera", Math.round(p.x-offset.x), Math.round(p.y-offset.y));
	//shader.set("u_camera", p.x-offset.x, p.y-offset.y);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}
Sprite.prototype.renderSize = function( gl, x,y,w,h, frame, row, flip ) {
if( !this.loaded  ) return;
	
	if(frame == undefined ){
		frame = row = 0;
	} else if ( row == undefined ) {
		var f = Math.floor(frame);
		frame = f % Math.floor(this.width/this.frame_width);
		row = Math.floor(f / Math.floor(this.width/this.frame_width));
	} else {
		frame = ~~frame;
		row = ~~row;
	}
	
	var shader = window.materials["default"].use();
	
	var xinc = this.frame_width / (this.img.width * 1.0);
	var yinc = this.frame_height / (this.img.height * 1.0);
	
	var x1 = frame * xinc;
	var x2 = (frame+1) * xinc;
	var y1 = row * yinc;
	var y2 = (row+1) * yinc;
	
	if( flip ) {
		var temp = x1;
		x1 = x2;
		x2 = temp;
	}
	
	var texbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2
	]), gl.DYNAMIC_DRAW);
	shader.set("a_texCoord");
	
	gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
	if( !this.buffer ) this.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	
	var bufferData = new Float32Array([
		x, y,
		x+w, y,
		x, y+h,
		x, y+h,
		x+w, y,
		x+w, y+h
	]);
	gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
	shader.set("a_position");
	shader.set("u_resolution",game.resolution.x, game.resolution.y);
	shader.set("u_camera", 0, 0);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}

WebGLRenderingContext.prototype.createF = function(){
	var fb = this.createFramebuffer();
	this.bindFramebuffer( this.FRAMEBUFFER, fb );
	fb.width = 512;
	fb.height = 512;
	
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
WebGLRenderingContext.prototype.scaleFillRect = function(x,y,w,h){
	//var pos = window.materials["test"]["properties"]["position"];
	//var uvs = window.materials["test"]["properties"]["uvs"];
	//var res = window.materials["test"]["properties"]["resolution"];
	//var cam = window.materials["test"]["properties"]["camera"];
	
	geo = new Float32Array([
		x,y,
		x+w,y,
		x,y+h,
		x,y+h,
		x+w,y,
		x+w,y+h
	]);
	
	var shader = window.materials["solid"];
	var buffer = this.createBuffer();
	var color = this.color || [0.0,0.0,0.0,1.0];
	
	shader.use();
	shader.set("u_color", color[0], color[1], color[2], color[3]);
	this.bindBuffer( this.ARRAY_BUFFER, buffer );
	this.bufferData( this.ARRAY_BUFFER, new Float32Array(geo), this.DYNAMIC_DRAW);
	//this.vertexAttribPointer(pos, 2, this.FLOAT, false, 0, 0);
	shader.set("a_position");
	
	//var tbuffer = gl.createBuffer();
	//gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
	//gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(tex), gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);			
	
	//this.uniform2f(res, game.resolution.x, game.resolution.y);
	//this.uniform2f(cam, 0, 0);
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	shader.set("u_camera", 0, 0);
	
	this.drawArrays(this.TRIANGLE_STRIP, 0, geo.length/2);
}

WebGLRenderingContext.prototype.renderBackbuffer = function(image){
	var geo = new Float32Array([
		-1,-1,
		+1,-1,
		-1,+1,
		-1,+1,
		+1,-1,
		+1,+1
	]);
	var top = game.resolution.y / 512;
	var lef = game.resolution.x / 512;
	var tex = new Float32Array([
		0,0,
		lef,0,
		0,top,
		0,top,
		lef,0,
		lef,top
	]);
	
	var shader = window.materials["backbuffer"].use();
	
	var buffer = this.createBuffer();
	
	this.bindTexture(this.TEXTURE_2D, image);
	//shader.set("u_color", color[0], color[1], color[2], color[3]);
	this.bindBuffer( this.ARRAY_BUFFER, buffer );
	this.bufferData( this.ARRAY_BUFFER, new Float32Array(geo), this.DYNAMIC_DRAW);
	//this.vertexAttribPointer(pos, 2, this.FLOAT, false, 0, 0);
	shader.set("a_position");
	
	var tbuffer = this.createBuffer();
	this.bindBuffer( this.ARRAY_BUFFER, tbuffer );
	this.bufferData( this.ARRAY_BUFFER, new Float32Array(tex), this.DYNAMIC_DRAW);
	shader.set("a_texCoord");
	
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	
	this.drawArrays(this.TRIANGLE_STRIP, 0, geo.length/2);
}