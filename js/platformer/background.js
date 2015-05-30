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
}
Background.prototype.render = function(gl,c){}
Background.prototype.prerender = function(gl,c){
	gl.bindTexture( gl.TEXTURE_2D, game.tileSprite.gl_tex );
	var shader = window.materials["default"].use();
	
	if( c.y > 32 && this.walls ) {
		//Background wall
		var tiles = new Array();
		var textr = new Array();
		var ts = 32;
		for(var x=-ts; x < game.width+ts; x+=ts) for(var y=-ts; y < game.height+ts; y+=ts){
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
		
		var offcam = new Point(
			(c.x * -0.3) % ts,
			(c.y * -0.3) % ts
		);
		
		shader.set("u_resolution", game.resolution.x, game.resolution.y);
		shader.set("u_camera", offcam.x, offcam.y);
		
		gl.drawArrays(gl.TRIANGLES, 0, tiles.length/2);
	} else {
		//Clouds
		//cloud length = 128
		this.sprite.renderSize(gl,0,0,game.width,176,203);
		
		var cloudVerts = new Array();
		var sky_offset = this.animation / 20.0;
		var draws = Math.ceil(game.width / 128.0) + 1;
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
			for(var i=0; i < game.width+ts; i+=ts){
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
Background.rooms = [
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,41,42,9,9,9,9,9,9,9,9,9,41,42,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,30,31,32,32,32,64,48,9,57,58,9,9,73,74,9,46,0,0,0,0,0,47,9,73,74,9,9,89,90,9,62,0,0,0,0,0,63,9,89,90,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,91,92,62,0,0,0,0,0,63,91,92,9,9,9,9,107,108,62,0,0,0,0,0,63,107,108,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,93,94,94,93,12,28,28,28,28,28,13,93,94,94,93,109,110,110,109,94,93,93,94,93,94,93,109,110,110,109]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,77,78,9,9,9,9,9,27,27,9,9,27,27,9,9,27,27,9,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,91,92,9,25,0,0,26,25,0,0,26,25,0,0,26,107,108,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,9,28,28,9,9,28,28,9,9,28,28,9,9,9,9,93,94,9,93,94,9,94,94,93,9,94,94,93,94,94,109,110,93,109,110,93,110,110,109,93,110,110,109,110,110,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,29,9,9,29,9,9,29,9,9,29,9,9,29,9,9,45,91,92,45,91,92,45,91,92,45,91,92,45,9,9,45,107,108,45,107,108,45,107,108,45,107,108,45,9,9,45,27,27,45,27,27,45,27,27,45,27,27,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,28,28,45,28,28,45,28,28,45,28,28,45,9,94,45,94,93,45,94,94,45,93,94,45,94,93,45,93,110,61,110,109,61,110,110,61,109,110,61,110,109,61,109,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,30,31,32,64,48,9,9,9,9,9,9,9,91,92,9,46,0,0,0,47,9,91,92,9,9,9,9,107,108,9,62,0,0,0,63,9,107,108,9,9,9,9,9,9,9,62,0,0,0,63,9,9,9,9,9,9,9,30,31,32,79,0,0,0,80,32,64,48,9,9,9,9,46,0,0,0,0,0,0,0,0,0,47,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,93,94,12,28,28,28,28,28,28,28,28,28,13,9,9,109,109,94,94,94,93,94,94,94,94,94,93,94,93,94,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110]}
	];