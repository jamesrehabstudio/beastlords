window.shaders = {
	
};

function Shader(gl,name,ops){
	var fragmentShader = this.getShader(gl, ops["fs"]);
	var vertexShader = this.getShader(gl, ops["vs"]);

	// Create the shader program

	this.program = gl.createProgram();
	gl.attachShader(this.program, vertexShader);
	gl.attachShader(this.program, fragmentShader);
	gl.linkProgram(this.program);

	// If creating the shader program failed, alert

	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		console.error("Cannot load shader");
		return;
	}
		
	//Fetch properties
	this.gl = gl;
	this.properties = {};
	//Find exposed Uniforms
	
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
	
	window.shaders[name] = this;
	if( !("default" in window.shaders ) ){
		window.shaders["default"] = this
	}
}

Shader.prototype.addProperty = function(prop) {
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
				"type" : Shader.propertyTypes.indexOf(type),
				"location" : location
			}
		}
	} catch ( err ){
		console.error("Error reading property: " + prop);
	}
}

Shader.propertyTypes = [
	"vec2",
	"vec4"
];
Shader.prototype.set = function(name) {
	if(!(name in this.properties )) return;
	var prop = this.properties[name];
	var args = Array.prototype.slice.apply(arguments, [1]);
	
	if( prop.uniform ) {
		if( prop.type == 0 ) {
			this.gl.uniform2f(prop.location, args[0], args[1]);
		} else if( prop.type == 1 ){
			this.gl.uniform4f(prop.location, args[0], args[1], args[2], args[3]);
		}
	} else {
		if( prop.type == 0 ) {
			this.gl.vertexAttribPointer(prop.location, 2, this.gl.FLOAT, false, 0, 0);
		} else if ( prop.type == 1 ) {
			
		}
	}
}

Shader.prototype.use = function() {
	game.shader = this;
	this.gl.useProgram(this.program);
}
Shader.prototype.getShader = function(gl, id) {
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
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
		return null;  
	}

	return shader;
}
/*
window.loadShader = function(gl,name,ops){
	var fragmentShader = getShader(gl, ops["fs"]);
	var vertexShader = getShader(gl, ops["vs"]);

	// Create the shader program

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Cannot load shader");
		return;
	}

	gl.useProgram(shaderProgram);
	
	var pos = gl.getAttribLocation(shaderProgram, "a_position");
	gl.enableVertexAttribArray(pos);
	var res = gl.getUniformLocation(shaderProgram, "u_resolution");
	gl.enableVertexAttribArray(res);
	var cam = gl.getUniformLocation(shaderProgram, "u_camera");
	gl.enableVertexAttribArray(cam);
	//var texture = gl.getAttribLocation(shaderProgram, "a_position");
	var uvs = gl.getAttribLocation(shaderProgram, "a_texCoord");
	gl.enableVertexAttribArray(uvs);
	
	window.shaders[ name ] = {
		"program":shaderProgram,
		"properties" : {
			"position" : pos,
			"uvs" : uvs,
			"resolution" : res,
			"camera" : cam
		}
	};
}

function getShader(gl, id) {
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
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
		return null;  
	}

	return shader;
}
*/
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
	
Sprite.prototype.render = function( gl, p, frame, row, flip, shader ) {
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
	
	var shader = window.shaders["default"];
	shader.use();
	
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
	//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);
	shader.set("a_texCoord");
	
	gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
	if( !this.buffer ) this.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	
	gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
	shader.set("a_position");
	shader.set("u_resolution",game.resolution.x, game.resolution.y);
	shader.set("u_camera", Math.floor(p.x-this.offset.x), Math.floor(p.y-this.offset.y));
	
	//gl.uniform2f(res, game.resolution.x, game.resolution.y);
	//gl.uniform2f(cam, Math.floor(p.x-this.offset.x), Math.floor(p.y-this.offset.y));
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}
Sprite.renderBuffer = function( gl, p, geo, tex ) {
	/*
	var pos = window.shaders["test"]["properties"]["position"];
	var uvs = window.shaders["test"]["properties"]["uvs"];
	var res = window.shaders["test"]["properties"]["resolution"];
	var cam = window.shaders["test"]["properties"]["camera"];
	
	if( geo instanceof Array ) {
		geo = new Float32Array(geo);
	}
	if( tex instanceof Array ) {
		tex = new Float32Array(tex);
	}
	
	var buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(geo), gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
	window.shaders["test"].set("a_position");
	
	var tbuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(tex), gl.DYNAMIC_DRAW);
	//gl.vertexAttribPointer(uvs, 2, gl.FLOAT, false, 0, 0);		
	window.shaders["test"].set("a_position");	
	
	gl.uniform2f(res, game.resolution.x, game.resolution.y);
	gl.uniform2f(cam, p.x, p.y);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, geo.length/2);
	*/
}
Sprite.prototype.renderScale = function( g, cover, frame, row, flip, filter ) {
	/*
	if(frame == undefined ){
		x_off = y_off = 0;
	} else if ( row == undefined ) {
		x_off = (frame % this.width) * this.frame_width;
		y_off = Math.floor(frame / this.width) * this.frame_height;
	} else {
		x_off = ~~frame * this.frame_width;
		y_off = ~~row * this.frame_height;
	}
	
	var img = filter in this.altimg ? this.altimg[filter] : this.img;
	
	g.beginPath();
	if( flip ) {
		g.save();
		g.scale(-1,1);
		cover.start.x = g.canvas.width + (g.canvas.width * -1) - cover.start.x;
	}
	try{
		g.drawImage( 
			img, 
			x_off, y_off, 
			this.frame_width, 
			this.frame_height,
			pixel_scale * cover.start.x,
			pixel_scale * cover.start.y,
			pixel_scale * cover.width(),
			pixel_scale * cover.height()
			
		);
	} catch (err) {}
	g.restore();
	g.closePath();
	*/
}

WebGLRenderingContext.prototype.scaleFillRect = function(x,y,w,h){
	//var pos = window.shaders["test"]["properties"]["position"];
	//var uvs = window.shaders["test"]["properties"]["uvs"];
	//var res = window.shaders["test"]["properties"]["resolution"];
	//var cam = window.shaders["test"]["properties"]["camera"];
	
	geo = new Float32Array([
		x,y,
		x+w,y,
		x,y+h,
		x,y+h,
		x+w,y,
		x+w,y+h
	]);
	
	var shader = window.shaders["solid"];
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