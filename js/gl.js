window.materials = {
	
};

class Material{
	constructor(options){
		
		let gl = game.g;
		this.gl = gl;
		
		let fshader = "2d-fragment-shader";
		let vshader = "2d-vertex-default";
		
		if("fs" in options){
			fshader = options["fs"];
		}
		if("vs" in options){
			vshader = options["vs"];
		}
		
		
		var fragmentMaterial = this.getShader(gl, shaders[fshader], gl.FRAGMENT_SHADER);
		var vertexMaterial = this.getShader(gl, shaders[vshader], gl.VERTEX_SHADER);

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
		
		this.properties = {};
		//this.textureSlots = {};
		
		this.mixtype = Material.MIX_ALPHA;
		if("mixtype" in options){ 
			this.mixtype = options["mixtype"];
		}
		
		this.settings = [];
		if( "settings" in options ) for( var i in options.settings ){
			if(options.settings[i] instanceof Array){
				options.settings[i].unshift(i);
				this.settings.push( options.settings[i] );
			} else{
				this.settings.push( [i, options.settings[i]] );
			}
		}
		
		//Find exposed Uniforms and attributes
		this.gatherProperties();
		
		//All shaders use the same uvs
		this.geometryBuffer = gl.createBuffer();
		this.textcordBuffer = gl.createBuffer();
	}
	
	getShader(gl, source, type) {	
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
	
	gatherProperties() {
		//Gather Uniforms
		for(var j=0; j < 2; j++){
			
			//Determine if we're checking for attributes or uniforms
			var isUniform = j == 0;
			var activeType = isUniform ? this.gl.ACTIVE_UNIFORMS : this.gl.ACTIVE_ATTRIBUTES
			
			var count = this.gl.getProgramParameter(this.program, activeType);
			var textureCount = 0;
			for(var i=0; i < count; i++){
				let textureSlot = 0;
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
					"type" : details.type,
					"location" : location,
					"texture" : textureSlot
				}
			}
		}
	}
	
	set(name, a,b,c,d) {
		if(!(name in this.properties )) return;
		var prop = this.properties[name];

		if(prop.location < 0){
			return;
		} else if( prop.uniform ) {
			switch(prop.type){
				case WebGLRenderingContext.FLOAT:
					this.gl.uniform1f(prop.location, a);
				break; case WebGLRenderingContext.FLOAT_VEC2:
					this.gl.uniform2f(prop.location, a, b);
				break; case WebGLRenderingContext.FLOAT_VEC3:
					this.gl.uniform3f(prop.location, a, b, c);
				break; case WebGLRenderingContext.FLOAT_VEC4:
					this.gl.uniform4f(prop.location, a, b, c, d);
				break; case WebGLRenderingContext.FLOAT_MAT3:
					this.gl.uniformMatrix3fv(prop.location, false, a);
				break; case WebGLRenderingContext.FLOAT_MAT4:
					this.gl.uniformMatrix4fv(prop.location, false, a);
				break; case WebGLRenderingContext.SAMPLER_2D:
					this.gl.uniform1i(prop.location, prop.texture);
					this.setTexture(name, a, this.gl["TEXTURE" + prop.texture]);
				break;
			}
		} else {
			switch(prop.type){
				case WebGLRenderingContext.FLOAT:
					this.gl.vertexAttribPointer(prop.location, 1, this.gl.FLOAT, false, 0, 0);
				break; default:
					this.gl.vertexAttribPointer(prop.location, a, this.gl.FLOAT, false, 0, 0);
			}
		}
	}
	setTexture(name, img, slot){
		if(!(img instanceof WebGLTexture)){
			img = sprites[img].gl_tex;
		}
		
		if(Material.currentTexture !== img){
			this.gl.activeTexture(slot);
			this.gl.bindTexture(this.gl.TEXTURE_2D, img);
			Material.currentTexture = img;
		}
	}
	
	use(){
		this.gl.useProgram(this.program);
		for(var i = 0; i < this.settings.length; i++){
			this.set.apply(this, this.settings[i]);
		}
		
		if(this.mixtype == Material.MIX_ADDITIVE){
			//Additive
			this.gl.blendFunc(this.gl.ONE, this.gl.ONE );
			
		} else if(this.mixtype == Material.MIX_ALPHA){
			//Alpha
			this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );
			
		} else if(this.mixtype == Material.MIX_MULTIPLY){
			//Multiply
			this.gl.blendFunc(this.gl.DST_COLOR, this.gl.Zero );
		}
		
		return this;
	}
	
	render(){}
}
Material.MIX_ALPHA = 0;
Material.MIX_ADDITIVE = 1;
Material.MIX_MULTIPLY = 2;
/*
Material.prototype.setOptions = function(ops) {
	for(var i in ops){
		if(i == "shader"){
			//Do nothing
		} else if(ops[i] instanceof Array){
			this.set.apply(this, [i].concat(ops[i]));
		} else {
			this.set(i, ops[i]);
		}
	}
}
Material.prototype.use = function() {
	//if(this == Material.current){
	//	return this;
	//}
	//game.shader = this;
	this.gl.useProgram(this.program);
	
	
	//this.textureSlots = {};
	
	//var textureCount = 0;
	//for(var j in this.properties) {
	//	if(this.properties[j].type == 6){
	//		this.properties[j].texture = textureCount;
	//		this.gl.uniform1i(this.properties[j].location, textureCount);
	//		this.textureSlots[j] = this.gl["TEXTURE" + textureCount];
	//		textureCount++;
	//	}
	//}
	
	for(var i = 0; i < this.settings.length; i++){
		this.set.apply(this, this.settings[i]);
	}
	//Material.current = this;
	//Material.currentTexture = null;
	return this;
}
*/
Material.current = null;
Material.currentTexture = null;
Material.SHADER_FRAGMENT = 0;
Material.SHADER_FRAGMENT = 1;

class Mesh extends Material{
	constructor(url, options){
		
		options = options || {};
		
		if(!("fs" in options)){
			options["fs"] = "fragment-mesh";
		}
		if(!("vs" in options)){
			options["vs"] = "3d-vertex-default";
		}
		super(options);
		
		this.url = url;
		this.ready = false;
		
		this.vertices = null;
		this.uvs = null;
		this.tries = null;
		
		this.vertCount = 0;
		this.uvCount = 0;
		
		var self = this;
		ajax(this.url, function(response){
			self.parseMesh(JSON.parse(response));
		});
		
		this.sprite_name = "white";
		
		if("image" in options){
			this.sprite_name = options["image"];
		}
	}
	
	parseMesh(data){
		var gl = game.g;
		
		this.vertices = data.data.attributes.position.array;
		this.uvs = data.data.attributes.uv.array;
		this.tries = data.data.index.array;
		
		this.vertCount = this.vertices.length / data.data.attributes.position.itemSize;
		this.uvCount = this.uvs.length / data.data.attributes.uv.itemSize;
		this.triesCount = this.tries.length / 3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.DYNAMIC_DRAW);
		this.set("a_texCoord", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);
		this.set("a_position", 3);
		
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.tries), gl.STATIC_DRAW);
		
		this.ready = true;
	}
	
	render(position, options){
		if(this.ready){
			var gl = this.gl;
			gl.cullFace(gl.BACK);
			this.use();
			
			var scale = new Vector(1,1,1);
			var rotate = {x:0,y:0,z:0};
			
			if("scale" in options){
				scale.x = options["scale"][0];
				scale.y = options["scale"][1];
				scale.z = options["scale"][2];
			}
			if("rotate" in options){
				rotate.x = options["rotate"][0];
				rotate.y = options["rotate"][1];
				rotate.z = options["rotate"][2];
			}
			if("flip" in options && options["flip"]){
				scale.x *= -1.0;
				gl.cullFace(gl.FRONT);
			}
			
			//this.material.setOptions(options);
			for(var op in options){
				if(options[op] instanceof Array){
					this.set.apply(this, [op].concat(options[op]));
				} else {
					this.set(op, options[op]);
				}
			}
			
			if(this.sprite_name in sprites && sprites[this.sprite_name].loaded){
				this.set("u_image",sprites[this.sprite_name].gl_tex);
			}
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
			this.set("a_texCoord", 2);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
			this.set("a_position", 3);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			
			//Set transformation matrices for vertex shader
			let mat_trn = new Matrix4x4().transition(position.x,position.y,position.z);
			let mat_scl = new Matrix4x4().scale(scale.x,scale.y,scale.z);
			let mat_rot = new Matrix4x4().rotate(rotate.x,rotate.y,rotate.z);
			
			//this.material.set("u_world", mat_trn.multiply(mat_rot).multiply(mat_scl).toFloatArray());
			//this.material.set("u_world", mat_trn.multiply(mat_rot).multiply(mat_scl).toFloatArray());
			this.set("u_world", mat_scl.multiply(mat_rot).multiply(mat_trn).toFloatArray());
			this.set("u_camera", game.cameraMatrix.convert4x4().toFloatArray());
			
			gl.enable(gl.CULL_FACE);
			gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
		}
	}
}

/* Object for wrapping sprites */
class Sprite extends Material {
	
	constructor(url, options) {
		options = options || {};
		
		options["settings"] = {
			"u_color" : [1,1,1,1]
		}
		
		super(options);
	
	
		
	
		this.loaded = false;
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
		
	
		this.frame_width = options['width'] || 0;
		this.frame_height = options['height'] || 0;
		this.custom_offset = false;
		
		if("custom_offset" in options){
			this.custom_offset = options["custom_offset"];
		}
		
		var offset = options['offset'] || new Point();
		this.setOffset(offset);
		
		this.name = "";
	}
	setOffset(os) {
		//Set offset and create mesh
		let gl = this.gl;
		
		this.offset = os;
		this.mesh = new Float32Array([
			-this.offset.x, -this.offset.y,
			this.frame_width-this.offset.x, -this.offset.y,
			-this.offset.x,  this.frame_height-this.offset.y,
			-this.offset.x,  this.frame_height-this.offset.y,
			this.frame_width-this.offset.x, -this.offset.y,
			this.frame_width-this.offset.x, this.frame_height-this.offset.y
		]);
		
		//Set UVs
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, Sprite.SQUARE, gl.DYNAMIC_DRAW);
		this.set("a_texCoord", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.mesh, gl.DYNAMIC_DRAW);
		this.set("a_position", 2);
		
	}
	isCorrectSize() {
		if( this.img.width != this.img.height ) return false;
		if( [1,2,4,8,16,32,64,128,256,512,1024,2048,4096].indexOf(this.img.width) < 0 ) return false;
		return true;
	}
	
	resize() {
		//Create a canvas for resizing the images
		var max = Math.min( Math.max( this.img.width, this.img.height ), 4096 );
		var size = 2; while( size < max ) size = size * 2;

		var temp_c = document.createElement('canvas'); temp_c.width = size; temp_c.height = size;
		var temp_g = temp_c.getContext('2d');
		temp_g.drawImage( this.img,0,0,this.img.width,this.img.height);
		this.img.src = temp_c.toDataURL();
	}
	imageLoaded() {
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
		
		//this.set("u_image",this.gl_tex);
	}
	
	render(p, frame_x, frame_y, flip, shaderOps ) {
		let gl = this.gl;
		
		if( !this.loaded  ) return;
		
		shaderOps = shaderOps || {};
		
		//Set default shader, scale and rotation
		//var shader = this.material;
		var scale = new Point(1,1);
		var rotate = 0.0;
		
		//Choose shader
		/*
		if( "shader" in shaderOps){
			if( shaderOps["shader"] instanceof Material ){
				//Correct shader already selected
			} else if( shaderOps["shader"] in window.materials ){
				shader = window.materials[shaderOps["shader"]]
			}
		}
		*/
		
		if(this.custom_offset){
			var coffname = Math.floor(frame_x)+"_"+Math.floor(frame_y);
			if(coffname in this.custom_offset){
				p = new Point(
					p.x + this.custom_offset[coffname].x,
					p.y + this.custom_offset[coffname].y
				);
			}
		}
		
		this.use();
		
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
		}
		if("rotation" in shaderOps){
			rotate = shaderOps["rotation"] / 180 * Math.PI;
		}
		for(var i in shaderOps){
			if(i == "shader"){
				//Do nothing
			} else if(shaderOps[i] instanceof Array){
				this.set.apply(this, [i].concat(shaderOps[i]));
			} else {
				this.set(i, shaderOps[i]);
			}
		}
		
		//texture is mirrored in negative index, flip inverts UVs
		if( flip ) {
			frame_x = -(frame_x + 1);
			p.x += this.offset.x * 2 - this.frame_width;
		}
		
		this.set("u_image",this.gl_tex);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
		this.set("a_texCoord", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
		this.set("a_position", 2);
		
		//Set transformation matrices for vertex shader
		this.set("u_frame", frame_x, frame_y, this.frame_width/this.img.width, this.frame_height/this.img.height);
		this.set("u_world", new Matrix2D().transition(p.x,p.y).rotate(rotate).multiply(new Matrix2D().scale(scale.x,scale.y)).toFloatArray());
		this.set("u_camera", game.cameraMatrix.toFloatArray());
		
		gl.disable(gl.CULL_FACE);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
	}
}

class Tilesheet extends Material{
	constructor(url, options){
		options = options || {};
		
		options["vs"] = "2d-vertex-tile";
		options["settings"] = {
			"u_color" : [1,1,1,1],
		};
		
		super(options);
		
		
		this.ts = 16;
		this.loaded = false;
		this.img = new Image();
		this.img.src = url;
		this.img.sprite = this;
		this.img.onload = function(){ 
			this.sprite.buildGeometry();
			/*
			if( this.sprite.isCorrectSize() ) {
				this.sprite.imageLoaded(); 
			} else {
				this.sprite.resize(); 
			}
			*/
		}
		this.animations = options["animations"] || {};
	}
	
	buildGeometry() {
		//Set offset and create mesh
		let gl = this.gl;
		let tileSize = this.ts / this.img.width;
		
		var verts = [];
		var uvs = [];
		var indcies = [];
		
		this.vertCount = 0;
		for(var x=0; x < 28; x++) for(var y=0; y < 16; y++){	
		
			verts.push((x+0)*this.ts); verts.push((y+0)*this.ts);
			verts.push((x+1)*this.ts); verts.push((y+0)*this.ts);
			verts.push((x+0)*this.ts); verts.push((y+1)*this.ts);
			verts.push((x+1)*this.ts); verts.push((y+0)*this.ts);
			verts.push((x+1)*this.ts); verts.push((y+1)*this.ts);
			verts.push((x+0)*this.ts); verts.push((y+1)*this.ts);
			
			uvs.push(0); uvs.push(0);
			uvs.push(tileSize); uvs.push(0);
			uvs.push(0); uvs.push(tileSize);
			uvs.push(tileSize); uvs.push(0);
			uvs.push(tileSize); uvs.push(tileSize);
			uvs.push(0); uvs.push(tileSize);
			
			indcies.push(0); indcies.push(0); 
			indcies.push(0); indcies.push(0); 
			indcies.push(0); indcies.push(0); 
			indcies.push(0); indcies.push(0); 
			indcies.push(0); indcies.push(0); 
			indcies.push(0); indcies.push(0); 
			
			this.vertCount += 6;
		}
		
		
		this.mesh = new Float32Array(verts);
		this.uvs = new Float32Array(uvs);
		
		this.tileBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tileBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indcies), gl.DYNAMIC_DRAW);
		this.set("a_tiles", 2);
		
		//Set UVs
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
		this.set("a_texCoord", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.mesh, gl.DYNAMIC_DRAW);
		this.set("a_position", 2);
		
		//Create WebGL context for texture
		this.gl_tex = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.gl_tex );
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		//gl.generateMipmap(gl.TEXTURE_2D);
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
		
		this.loaded = true;
	}
	
	cropTileAsArray(pos, map, layer){
		let tiles = [];
		let layer = map[layer];
		
		for(var x=0; x < 27; x++) for(var y=0; y < 16; y++){
			//let index = x + 64 * y;
			
			let mapIndex = Math.floor( (pos.x / this.ts) + (pos.y / this.ts) * map.width );
			let index = layer[mapIndex];
			
			tiles.push(index); 
			tiles.push(index);
			tiles.push(index); 
			tiles.push(index);
			tiles.push(index); 
			tiles.push(index);
		}
		return new Float32Array(tiles);
	}
	
	render(pos, map, layer, options){
		let gl = this.gl;
		
		if( !this.loaded ) return;
		
		this.use();
		
		for(var i in options){
			if(shaderOps[i] instanceof Array){
				this.set.apply(this, [i].concat(shaderOps[i]));
			} else {
				this.set(i, shaderOps[i]);
			}
		}
		
		
		var p = new Point(
			Math.floor(Math.mod(-pos.x, this.ts)) - this.ts,
			Math.floor(Math.mod(-pos.y, this.ts)) - this.ts
		);
		
		
		let tilesIndices = new Array();
		let cLayer = map.layers[layer];
		
		
		for(var x=0; x < 28; x++) for(var y=0; y < 16; y++){
			//let index = x + 64 * y;
			
			let fpos = new Point(
				pos.x == 0 ? (pos.x - this.ts) : pos.x, 
				pos.y == 0 ? (pos.y - this.ts) : pos.y
			);
			let mapIndex = Math.floor( x + (fpos.x / this.ts) + (y + Math.floor(fpos.y / this.ts)) * map.width );
			let tile = getTileData(cLayer[mapIndex]);
			let index = tile.tile;
			
			if(index in this.animations){
				let tanim = this.animations[index];
				let findex = Math.floor( game.gameTimeScaled * tanim.speed ) % tanim.frames.length;
				index = tanim.frames[findex];
			}
			
			if(index <= 0) index = 1024;
			index--;
			
			tilesIndices.push(index); tilesIndices.push(tile.flags);
			tilesIndices.push(index); tilesIndices.push(tile.flags);
			tilesIndices.push(index); tilesIndices.push(tile.flags);
			tilesIndices.push(index); tilesIndices.push(tile.flags);
			tilesIndices.push(index); tilesIndices.push(tile.flags);
			tilesIndices.push(index); tilesIndices.push(tile.flags);
		}
		
		
		this.set("u_image",this.gl_tex);
		
		this.set("u_uvtilewidth", this.img.width);
		this.set("u_tilesize", this.ts);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tileBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tilesIndices), gl.DYNAMIC_DRAW);
		this.set("a_tiles", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textcordBuffer);
		this.set("a_texCoord", 2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
		this.set("a_position", 2);
		
		//Set transformation matrices for vertex shader
		this.set("u_world", new Matrix2D().transition(p.x,p.y).toFloatArray());
		this.set("u_camera", game.cameraMatrix.toFloatArray());
		
		gl.disable(gl.CULL_FACE);
		gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
	}
}

/*
Sprite.prototype.renderTiles = function(gl,tiles,width,x,y,animation){
	if( !this.loaded ) return;
	
	var camera = new Point(x,y);
	
	//var tileVerts = new Array();
	var material = window.materials["tiles"].use();
	var uvVerts = new Array();
	var ts = this.frame_width;
	
	//create grid
	var verts = [];
	var uvs = [];
	var tiles = [];
	for(var x=0; x < 27; x++) for(var y=0; y < 15; y++) {
		verts.push((x+0) * ts); verts.push((y+0) * ts); 
		verts.push((x+1) * ts); verts.push((y+0) * ts); 
		verts.push((x+0) * ts); verts.push((y+1) * ts); 
		verts.push((x+1) * ts); verts.push((y+0) * ts); 
		verts.push((x+1) * ts); verts.push((y+1) * ts); 
		verts.push((x+0) * ts); verts.push((y+1) * ts); 
		
		uvs.push(0); uvs.push(0); 
		uvs.push(1); uvs.push(0); 
		uvs.push(0); uvs.push(1); 
		uvs.push(1); uvs.push(0); 
		uvs.push(1); uvs.push(1); 
		uvs.push(0); uvs.push(1); 
		
		tiles.push(0);
		tiles.push(0);
		tiles.push(0);
		tiles.push(0);
		tiles.push(0);
		tiles.push(0);
	}
	
	
		
	var campos = new Point(
		0-Math.round(Math.mod(camera.x,ts)),
		0-Math.round(Math.mod(camera.y,ts))
	);
	
	material.set("u_resolution", game.resolution.x, game.resolution.y);
	material.set("u_camera", campos.x, campos.y);
	material.set("u_image", this.gl_tex);
	//material.set("u_color", [0,0,0,0]);
	
	
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
*/
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

/*
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
*/

/*

*/
class BackBuffer extends Material{
	constructor(size, options){
		options = options || {};
		options["fs"] = "2d-fragment-shader";
		options["vs"] = "back-vertex-shader";
		super(options);
		
		let gl = this.gl;
		
		//Create a Frame Buffer
		this.buffer = gl.createFramebuffer();
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.buffer );
		this.buffer.width = size || 512;
		this.buffer.height = size || 512;
		
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.buffer.width, this.buffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
		var rb = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.buffer.width, this.buffer.height);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
		
		//Reset
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	useBuffer(){
		let gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
	}
	reset(){
		let gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
	render(tint, ops){
		var top = game.resolution.y / 512;
		var lef = game.resolution.x / 512;
		
		var geo = createRectBuffer(new Point(-1, -1),2 ,2);
		var tex = createRectBuffer(new Point(),lef ,top);
		
		let gl = this.gl;
		
		ops = ops || {};
		
		this.use();
		
		for(var i in ops){
			if(ops[i] instanceof Array){
				shader.set.apply(shader, [i].concat(ops[i]));
			} else {
				shader.set(i, ops[i]);
			}
		}
		
		this.set("u_image", this.texture);
		
		if(tint == undefined){
			tint = [1.0,1.0,1.0,1.0];
		}
		
		var buffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, geo, gl.STATIC_DRAW);
		this.set("a_position", 2);
		
		var tbuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, tbuffer );
		gl.bufferData( gl.ARRAY_BUFFER, tex, gl.STATIC_DRAW);
		this.set("a_texCoord", 2);
		
		this.set("u_color", tint[0],tint[1],tint[2],tint[3]);
		this.set("u_resolution", game.resolution.x, game.resolution.y);
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, geo.length/2);
	}
}
WebGLRenderingContext.prototype.scaleFillRect = function(x,y,w,h,ops){
	ops = ops || {};
	ops["scalex"] = w;
	ops["scaley"] = h;
	ops["u_color"] = this["color"];
	sprites["white"].render(
		new Point(x,y), 0, 0, false, ops
	);
	/*
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
	*/
}


createRectBuffer = function(p, w, h, r, o){
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