/* Shader list */
window.shaders = {};



 /* platformer\alter.js*/ 

Alter.prototype = new GameObject();
Alter.prototype.constructor = GameObject;
function Alter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.alter;
	this.width = 64;
	this.height = 128;
	this.zIndex = -1;
	this.life = 1;
	this.origin.y = 1.0;
	
	this.addModule(mod_talk);
	
	var tresure = dataManager.randomTreasure(Math.random(),["treasure","alter"]);
	tresure.remaining--;
	
	this.item = new Item(this.position.x, this.position.y-104, tresure.name);
	this.item.addModule(mod_rigidbody);
	this.item.gravity = 0;
	this.item.interactive = false;
	game.addObject(this.item);
	
	this.on("open",function(obj){
		game.pause = true;
		audio.playLock("pause",0.3);
		this.cursor = 0;	
	});
	this.message = [
		"Sacrifice permanent life for an item?"
	];
	this.cursor = 0;
}
Alter.prototype.update = function(g,c){
	if( this.open > 0 && this.item instanceof Item ) {
		if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 ) {
				_player.lifeMax = Math.max(_player.lifeMax-25, 1);
				_player.life = Math.min( _player.life, _player.lifeMax );
				audio.play("equip");
				this.item.gravity = 1.0;
				this.item.interactive = true;
				this.item = false;
				this.interactive = false;
			}
			this.close();
			game.pause = false;
			
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.close();
			game.pause = false;
		}
	}
	this.canOpen = this.item instanceof Item;
}
Alter.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		renderDialog(g,this.message[0]);
		
		
		boxArea(g,16,120,64,56);
		textArea(g," Yes",32,136);
		textArea(g," No",32,152);
		
		sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
	}
}

 /* platformer\arena.js*/ 

Arena.prototype = new GameObject();
Arena.prototype.constructor = GameObject;
function Arena(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.arena;
	this.width = 64;
	this.height = 128;
	this.zIndex = -1;
	this.life = 1;
	this.origin.y = 1.0;
	this.wave_cooldown = Game.DELTASECOND;
	this.enemies_ready = Game.DELTASECOND
	
	this.addModule(mod_boss);
	this.addModule(mod_talk);
	
	this.items = new Array();
	for(var i=0; i < 2; i++ ){
		var treasure = dataManager.randomTreasure(Math.random(),["treasure","chest"]); 
		treasure.remaining--;
		
		item = new Item(this.position.x-26+(i*52), this.position.y-104, treasure.name);
		item.addModule(mod_rigidbody);
		item.gravity = 0;
		item.interactive = false;
		
		this.items.push(item);
		game.addObject(item);
	}
	
	this.enemies = new Array();
	this.waves = Math.floor(2 + Math.random()*3);
	this._boss_is_active = function(){};
	
	this.on("open",function(obj){
		game.pause = true;
		audio.playLock("pause",0.3);
		this.cursor = 0;	
	});
	this.message = [
		"Choose one item to begin the arena."
	];
	this.cursor = 0;
}
Arena.prototype.update = function(g,c){
	if( this.open > 0 && !this.active ) {
		if( input.state("left") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("right") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		
		if( input.state("fire") == 1 ){
			for(var i=0; i < this.items.length; i++){
				var item = this.items[ i ];
				if(i == this.cursor){
					item.interactive = true;
					item.gravity = 1.0;
				} else {
					game.addObject(new EffectSmoke(item.position.x, item.position.y));
					item.destroy();
				}
			}
			this.active = true;
			this.trigger("activate");
			this.items = false;
			this.canOpen = false;
			this.close();
			game.pause = false;
			
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.close();
			game.pause = false;
		}
	}
	
	if( this.active ) {
		var total_life = 0;
		this.enemies_ready -= this.delta;
		for(var i=0; i < this.enemies.length; i++){
			if(this.enemies[i].awake && game.objects.indexOf(this.enemies[i]) >= 0){
				total_life += Math.max(this.enemies[i].life, 0);
				this.enemies[i].interactive = this.enemies_ready <= 0;
			}
		}
		
		if( total_life <= 0 ) {
			if( this.wave_cooldown <= 0 ) {
				if( this.waves > 0 ) {
					//spawn new wave
					this.enemies_ready = Game.DELTASECOND;
					var current_temple = dataManager.temples[dataManager.currentTemple];
					var current_wave = Arena.Waves[ this.waves ];
					this.enemies = new Array();
					this.waves--;
					for(var i=0; i < current_wave.count; i++){
						var x_off = i*(232/current_wave.count)-116;
						var enemy_list = current_temple[current_wave["type"]];
						var enemy_name = enemy_list[Math.floor(Math.random()*enemy_list.length)];
						var enemy = new window[enemy_name](this.position.x+x_off, this.position.y-16);
						enemy.interactive = false;
						this.enemies.push( enemy );
						game.addObject( enemy );
					}
				} else {
					//End
					this.active = false;
					this.trigger("death");
				}
			} else {
				this.wave_cooldown -= this.delta;
			}
		} else {
			this.wave_cooldown = Game.DELTASECOND;
		}
	}
}
Arena.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		boxArea(g,16,16,224,64);
		textArea(g,this.message[0],32,32,192,64);
		
		for(var i=0; i < this.items.length; i++ ){
			var item = this.items[i];
			var position = item.position.subtract(c).add( new Point(-16,-16));
			if(this.cursor == i){
				boxArea(g,position.x,position.y,32,32);
			}
		}
	}
}
Arena.Waves = [
	{"type":"miniboss", "count":1},
	{"type":"majormonster", "count":2},
	{"type":"minormonster", "count":3},
	{"type":"minormonster", "count":4},
	{"type":"minormonster", "count":3},
	{"type":"majormonster", "count":3}
];

 /* platformer\background.js*/ 

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

 /* platformer\boss_ammit.js*/ 

Ammit.prototype = new GameObject();
Ammit.prototype.constructor = GameObject;
function Ammit(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.sprite = sprites.ammit;
	this.speed = 0.075;
	
	this.start_x = x;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 4;
	this.bossface_frame_row = 0;
	
	this.states = {
		"drink" : 0,
		"attack" : 0,
		"cooldown" : Game.DELTASECOND * 2,
		"direction" : 1,
		"spit" : false
	};
	this.attacks = {
		"warm" : Game.DELTASECOND * 0.5,
		"release" : Game.DELTASECOND * 0.33,
		"drink_time" : Game.DELTASECOND * 4,
		"spit_time" : Game.DELTASECOND * 1
	}
	
	this.life = dataManager.life(24);
	this.mass = 5.0;
	this.damage = 25;
	this.collideDamage = 25;
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("collideHorizontal", function(){
		if( this.states.cooldown <= 0 ) 
			this.states.drink = this.attacks.drink_time;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) 
			obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,35);
		this.destroy();
	});
	this.calculateXP();
}
Ammit.prototype.update = function(){	
	if ( this.active && this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.drink > 0 ) {
			this.states.drink -= this.delta;
			this.states.cooldown = Game.DELTASECOND * 8;
			this.states.attack = 0;
			if( this.states.drink <= this.attacks.spit_time && !this.states.spit ) {
				//Fire balls!
				this.states.spit = true;
				for(var i=4; i<9; i++ ){
					var fire = new Fire(this.position.x, this.position.y);
					fire.force.x = (this.flip ? -1 : 1) * (i*2.5);
					fire.force.y = -9;
					fire.deltaScale = 0.3;
					fire.life *= fire.deltaScale;
					game.addObject(fire);
				}
			}
		} else {
			this.states.spit = false;
			if( this.states.attack > 0 ) {
				//Swing and attack
				this.states.attack -= this.delta;
				this.states.cooldown -= this.delta * 0.5;
			} else if( this.states.cooldown <= 0 ) {
				//Back into a corner for drinking
				var direction = dir.x > 0 ? 1 : -1;
				this.flip = dir.x > 0;
				this.force.x += direction * this.speed;
			} else {
				//Attack the player
				if( Math.abs( dir.x ) < 40 ) {
					this.states.attack = this.attacks.warm;
				} else { 
					if( this.position.x - this.start_x < -56 ) this.states.direction = 1.0;
					if( this.position.x - this.start_x > 56 ) this.states.direction = -1.0;
					this.flip = dir.x > 0;
					
					this.force.x += this.states.direction * this.speed;
					this.states.cooldown -= this.delta;
				}
			}
		}
		
		if( this.states.attack > 0 && this.states.attack <= this.attacks.release ){
			this.strike( new Line(0,10,32,-8) );
		}
	}
	
	/* Animation */
	if( this.states.drink > 0 ) {
		var range = this.attacks.drink_time - this.attacks.spit_time;
		var pos = (this.states.drink - this.attacks.spit_time) / range;
		this.frame = Math.min( Math.floor((1-pos)*4), 3); 
		this.frame_row = 2;
	} else if( this.states.attack > 0 ) {
		this.frame = this.states.attack <= this.attacks.release ? 1 : 0;
		this.frame_row = 1;
	} else {
		this.frame = (this.frame + (this.delta * 0.3 * Math.abs(this.force.x))) % 3;
		this.frame_row = 0;
	}
}

 /* platformer\boss_chort.js*/ 

Chort.prototype = new GameObject();
Chort.prototype.constructor = GameObject;
function Chort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = sprites.pigboss;
	this.speed = .9;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(26);
	this.collideDamage = 5;
	this.damage = dataManager.damage(4);
	this.landDamage = dataManager.damage(6);
	
	this.mass = 6.0;
	this.gravity = 0.4;
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 100.0,
		"bounce" : 0.0,
		"bounceCount" : 0,
		"direction" : 1.0,
	}
	
	this.attack_times = {
		"warm" : 24,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			//else
			//	obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
}
Chort.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.active ) {
		if( this.states.bounce > 0 ) {
			if( this.grounded ) {
				this.collideDamage = 5;
				this.criticalChance = 0.0;
				if( this.states.bounceCount > 0 ) {
					this.force.y = -9;
					this.states.bounceCount--;
				} else {
					this.states.bounce -= this.delta;
				}
			} else {
				if( this.force.y < 0 ) {
					//Target player
					this.force.x += ( dir.x > 0 ? -1 : 1 ) * this.speed * this.delta * 0.5;
				} else {
					this.collideDamage = this.landDamage;
					this.criticalChance = 1.0;
				}
			}
		} else {
			if( this.states.attack > 0 ) {
				//Swing at player
				this.states.attack -= this.delta;
			} else if( Math.abs(dir.x) < 32 ) {
				//Start punch
				this.states.attack = this.attack_times.warm;
				this.force.x = 0;
			} else {
				//Walking phase
				if(this.position.x - this.start_x < -64 ) this.states.direction = 1;
				if(this.position.x - this.start_x > 64 ) this.states.direction = -1;
				
				this.flip = dir.x > 0;
				this.force.x = this.speed * this.states.direction * this.delta;
				this.states.cooldown -= this.delta;
				if( this.states.cooldown <= 0 ){
					this.states.bounce = Game.DELTASECOND * 3;
					this.states.bounceCount = 3 + Math.floor(Math.random() * 3);
					this.states.cooldown = Game.DELTASECOND * (2+(Math.random()*3));
				}
			}
		}
		
		if( this.states.attack <= this.attack_times.release && this.states.attack > this.attack_times.cool ) {
			this.strike( new Line(12,-6,32,10) );
		}
	}
	
	/* animation */
	
	//28, 48
	if( this.states.bounce > 0 ) {
		this.width = 48;
		this.frame_row = 1;
		this.frame = 1;
		if( this.grounded ) {
			this.frame = 3;
		} else if ( this.force.y < 0 ) {
			this.frame = 2;
		}
	}else if ( this.states.attack > 0 ){
		this.width = 28;
		this.frame_row = 2; 
		this.frame = 0; 
		if( this.states.attack <= this.attack_times.release ) this.frame = 1;
		if( this.states.attack <= this.attack_times.cool ) this.frame = 2;
	} else {
		this.width = 28;
		this.frame = (this.frame + this.delta * 0.3 * Math.abs(this.force.x)) % 3;
		this.frame_row = 0;
	}
}

 /* platformer\boss_frog.js*/ 

FrogBoss.prototype = new GameObject();
FrogBoss.prototype.constructor = GameObject;
function FrogBoss(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 120;
	this.height = 180;
	this.team = 0;
	this.sprite = sprites.frogmonster;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.life = dataManager.life(35);
	this.gravity = 0.5;
	this.friction = 0.2;
	this.mass = 20.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.damage = dataManager.damage(5);
	
	this.times = {
		"stump" : Game.DELTASECOND * 1.1,
		"flySpawn" : Game.DELTASECOND * 1.5,
		"jump" : Game.DELTASECOND * 9.0,
		"rockSpawn" : Game.DELTASECOND * 3.0,
	};
	this.states = {
		"stump" : 0.0,
		"flySpawn" : 0.0,
		"jump" : 0.0,
		"rockSpawn" : Game.DELTASECOND * 3.0,
		"ceilingCollapse" : false
		
	};
	
	//Find rock spawning limits
	this.rockBox = new Line(this.position.x, this.position.y, this.position.x, this.position.y);
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x, this.position.y - i*16, game.tileCollideLayer) > 0 ){
			this.rockBox.start.y = this.position.y - i * 16 + 24;
			break;
		}
	}
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x - i*16, this.rockBox.start.y, game.tileCollideLayer) > 0 ){
			this.rockBox.start.x = this.position.x - i * 16 + 24;
			break;
		}
	}
	for(var i=0; i < 32; i++){
		if( game.getTile( this.position.x + i*16, this.rockBox.start.y, game.tileCollideLayer) > 0 ){
			this.rockBox.end.x = this.position.x + i * 16 - 24;
			break;
		}
	}
	this.rockBox.end.y = this.rockBox.start.y + 64;
	
	//Array for tracking flies
	this.flies = new Array();
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});

	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
}
FrogBoss.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		this.flip = dir.x > 0;
		
		this.states.stump += this.delta;
		this.states.flySpawn += this.delta;
		this.states.jump += this.delta;
		
		this.states.rockSpawn -= this.delta;
		
		if( this.states.ceilingCollapse && this.grounded ){
			window.audio.play("explode1");
			window.shakeCamera(new Point(0,8));
			for(var i=0; i < 8; i++ ) {
				var rock = new FallingRock( 
					this.rockBox.start.x + this.rockBox.width() * Math.random(),
					this.rockBox.start.y + this.rockBox.height() * Math.random()
				);
				rock.damage = Math.round(this.damage * 0.25);
				game.addObject( rock );
			}
			this.states.ceilingCollapse = false;
		}
		if( this.states.jump > this.times.jump && this.grounded) {
			this.force.y = -6;
			this.states.jump = 0;
			this.grounded = false;
			this.states.ceilingCollapse = true;
		}
		if( this.states.flySpawn > this.times.flySpawn ) {
			this.states.flySpawn = -Game.DELTASECOND * 2;
			//Spawn some flies
			for(var i=0; i < 3; i++ ){
				if( i < this.flies.length && this.flies[i].life > 0 ) {
					//Don't spawn a fly
				} else {
					var fly = new Fly( this.position.x, this.position.y - 64);
					fly.itemDrop = false;
					this.flies[i] = fly;
					game.addObject( fly );
					break;
				}
			}
		}
		if( this.states.stump > this.times.stump ) {
			audio.play("explode2");
			this.states.stump = -Game.DELTASECOND * 2;
			this.strike( new Line(-72, 60, 72, 90) );
		}
	}
	
	this.frame = (this.frame + this.delta * 0.05) % 1.0;
}
FrogBoss.prototype.render = function(g,c){
	var llegFrame = this.frame < 0.33 ? 1 : 0;
	var rlegFrame = this.frame >= 0.5 && this.frame < 0.833  ? 1 : 0;
	var headFrame = 0;
	
	var bob1 = new Point(0, 4*Math.sin(this.frame * Math.PI + 3.0 ));
	var bob2 = new Point(0, 2*Math.sin(this.frame * Math.PI + 1.5 ));
	var bob3 = new Point(0, 3*Math.sin(this.frame * Math.PI));
	
	var larm = FrogBoss.pos.larm.add(bob2);
	var lleg = FrogBoss.pos.lleg.add(new Point());
	var body = FrogBoss.pos.body.add(bob3);
	var head = FrogBoss.pos.head.add(bob1);
	var rleg = FrogBoss.pos.rleg.add(new Point());
	var rarm = FrogBoss.pos.rarm.add(bob2);
	
	var flySpawnProgress = this.states.flySpawn / this.times.flySpawn;
	headFrame = Math.max( Math.floor(flySpawnProgress * 3), 0);
	
	var stumpProgress = this.states.stump / this.times.stump;
	if( stumpProgress > 0 ) {
		llegFrame = 2;
		rlegFrame = 0;
		larm.x += Math.lerp(0,-8,stumpProgress); larm.y += Math.lerp(0,-12,stumpProgress);
		rarm.x += Math.lerp(0,-8,stumpProgress); rarm.y += Math.lerp(0,-12,stumpProgress);
		head.x += Math.lerp(0,-8,stumpProgress); head.y += Math.lerp(0,-12,stumpProgress);
		body.x += Math.lerp(0,-8,stumpProgress); body.y += Math.lerp(0,-12,stumpProgress);
		lleg.x += Math.lerp(0,-6,stumpProgress); lleg.y += Math.lerp(0,-16,stumpProgress);
	}
	
	if( this.force.y < 0 && !this.grounded ) {
		llegFrame = 1;
		rlegFrame = 1;
		lleg.y += Math.max( 2 * this.force.y, -8);
		rleg.y += Math.max( 2 * this.force.y, -8);
	}
	
	if( this.flip ) {
		larm.x *= -1; lleg.x *= -1; body.x *= -1;
		head.x *= -1; rleg.x *= -1; rarm.x *= -1;
	}
	
	this.sprite.render(g,this.position.add(larm).subtract(c), 0, 4, this.flip, this.filter);
	this.sprite.render(g,this.position.add(lleg).subtract(c), llegFrame, 5, this.flip, this.filter);
	this.sprite.render(g,this.position.add(body).subtract(c), 0, 1, this.flip, this.filter);
	this.sprite.render(g,this.position.add(head).subtract(c), headFrame, 0, this.flip, this.filter);
	this.sprite.render(g,this.position.add(rleg).subtract(c), rlegFrame, 2, this.flip, this.filter);
	this.sprite.render(g,this.position.add(rarm).subtract(c), 0, 3, this.flip, this.filter);
	
	//pupils
	if( window._player instanceof Player ) {
		var dir = window._player.position.normalize(4)
		this.sprite.render(g,this.position.add(head).subtract(c).subtract(dir), 0, 6, this.flip);
	}
	
	g.color = [1.0,0,0,1.0];
	g.scaleFillRect(this.rockBox.start.x - c.x, this.rockBox.start.y - c.y, this.rockBox.width(), this.rockBox.height() );
	
}

FrogBoss.pos = {
	"head" : new Point(36,-70),
	"body" : new Point(0,8),
	"larm" : new Point(56,8),
	"rarm" : new Point(-28,-20),
	"lleg" : new Point(40,18),
	"rleg" : new Point(-32,18)
}

 /* platformer\boss_garmr.js*/ 

Garmr.prototype = new GameObject();
Garmr.prototype.constructor = GameObject;
function Garmr(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.garmr;
	this.speed = 1.8;
	
	this.active = false;
	this.closeToBoss = false;
	
	this.projection = new Point(x,y);
	this.projection_frame = 0;
	this.projection_frame_row = 0;
	this.projection_flip = false;
	this.projection_goto = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 2;
	this.bossface_frame_row = 0;
	
	this.states = {
		"troll_cooldown" : Game.DELTASECOND * 16,
		"troll_timer" : 0,
		"troll_release" : false,
		"cooldown" : 0,
		"attack_type" : 1,
		"fireballCount" : new Timer(0, Game.DELTASECOND * 0.1)
	}
	
	this.life = dataManager.life(0);
	this.mass = 5.0;
	this.damage = dataManager.damage(4);
	this.collideDamage = dataManager.damage(1);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("activate", function() {
		var dir = this.position.subtract( _player.position );
		_player.force.x = (dir.x > 0 ? -1 : 1) * 4;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,40);
		this.destroy();
	});
	this.calculateXP();
}
Garmr.prototype.update = function(){	
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		this.closeToBoss = false;
		
		if( this.active ) {
			
			if( this.states.attack_type == 0 ) {
				//Fire missiles at player
				
			} else if ( this.states.attack_type == 1 ) {
				//Fire wall of bullets at player
				
				if( this.states.fireballCount.time <= 0 ) {
					//Break cycle
					this.states.fireballCount.set( Game.DELTASECOND * 10 );
					this.projection_goto.y = _player.position.y - 16;
					this.projection_flip = dir.x > 0;
				} else if( this.states.fireballCount.status(this.delta) ) {
					for(var i= 0; i < 2; i++){
						var pos = Math.sin( this.states.fireballCount.time * 0.075 );
						var bullet = new PhantomBullet(this.projection.x, pos*32 + this.projection.y + i * 72 - 36);
						
						bullet.force.x = this.projection_flip ? -4 : 4;
						bullet.force.y = 0;
						game.addObject( bullet );
						
					}
				}
				
			} else if ( this.states.attack_type == 2 ) {
				//Fire rods down at player
				
			}
			
			this.projection = Point.lerp(this.projection, this.projection_goto, this.delta * 0.01);
		} else {
			//Troll player
			if( Math.abs( dir.x ) < 240 && Math.floor(_player.position.y/256) == Math.floor(this.position.y/256)){
				this.projection.x = this.position.x;
				this.projection.y = this.position.y - 80;
				this.closeToBoss = true;
			} else if( this.states.troll_timer > 0 ){
				if( this.states.troll_timer < Game.DELTASECOND * 3 && !this.states.troll_release ){
					this.states.troll_release = true;
					var bullet = new Bullet(this.projection.x, this.projection.y);
					bullet.force = _player.position.subtract(this.projection).normalize(8);
					bullet.blockable = false;
					bullet.damage = this.damage;
					bullet.effect = EffectSmoke;
					bullet.team = this.team;
					game.addObject(bullet);
				}
				this.states.troll_timer -= this.delta;
				this.states.troll_cooldown = Game.DELTASECOND * (15+Math.random()*10);
			} else {
				if( this.states.troll_cooldown <= 0 ) {
					this.states.troll_release = false;
					this.states.troll_timer = Game.DELTASECOND * 6;
					this.projection.x = _player.position.x + (_player.flip ? -80 : 80);
					this.projection.y = Math.floor(this.position.y/256)*256 + 80;
				}
				this.states.troll_cooldown -= this.delta;
			}
		}
	}
	
	/* Animation */
	this.frame = 0;
	this.frame_row = 3;
	if( this.active ) {
		this.projection_frame = Math.max( (this.projection_frame + this.delta * 0.3) % 3, 1);
		this.projection_frame_row = 2;
	} else if( this.closeToBoss ){
		this.projection_frame = 0;
		this.projection_frame_row = 2;
	} else if( this.states.troll_timer > Game.DELTASECOND * 3 && this.states.troll_timer < Game.DELTASECOND * 4 ) {
		this.projection_frame = 0;
		this.projection_frame_row = 1;
	} else {
		this.projection_frame = (this.projection_frame + (this.delta * 0.2)) % 3;
		this.projection_frame_row = 0;
	}
}
Garmr.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	try {
		if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
			var flip = this.projection.x - _player.position.x > 0;
			this.sprite.render(g,this.projection.subtract(c),this.projection_frame,this.projection_frame_row, this.projection_flip);
		}
	} catch (err){}
}
Garmr.prototype.idle = function(){}

 /* platformer\boss_marquis.js*/ 

Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = sprites.megaknight;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 1;
	this.bossface_frame_row = 1;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0,
		"direction" : 1,
		"attack_down" : false
	}
	
	this.attack_times = {
		"warm" : Game.DELTASECOND * 3,
		"attack" : Game.DELTASECOND * 2,
		"rest" : Game.DELTASECOND * 1.0
	};
		
	this.life = dataManager.life(24);
	this.mass = 4.0;
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(3);
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 3;
	
	this.guard.active = true;
	this.guard.y = 8;
	this.guard.h = 48;
	this.guard.x = 0;
	this.guard.w = 28;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("critical", function(){
		this.states.attack = 0;
		this.states.cooldown = this.attack_times.warm;
	});
	this.on("struckTarget", function(){
		this.states.attack = 0;
		this.states.cooldown = this.attack_times.warm;
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team || this.inviciple > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,30);
		this.destroy();
	});
	this.on("player_death", function(){
		this.states["attack"] = 0;
		this.states["cooldown"] = 100.0;
		this.states["attack_type"] = 0;
		this.states["direction"] = 1;
		this.states["attack_down"] = false;
	});
	this.calculateXP();
}
Marquis.prototype.update = function(){	
	this.sprite = sprites.megaknight;
	if ( this.stun <= 0  && this.life > 0 && this.active) {
		var dir = this.position.subtract( _player.position );
				
		if( this.states.attack <= 0 ) {
			this.criticalChance = 0.0;
			if(this.position.x - this.start_x > 64) this.states.direction = -1;
			if(this.position.x - this.start_x < -64) this.states.direction = 1;
			
			this.force.x += this.speed * this.delta * this.states.direction;
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			
			if( this.states.cooldown <= 0 ){
				this.states.attack = this.attack_times.warm;
				this.states.cooldown = this.attack_times.warm * (1+Math.random()*2);
				this.states.direction = dir.x > 0 ? -1 : 1;
				this.states.attack_down = Math.random() > 0.5;
			}
		} else {
			if( this.states.attack < this.attack_times.attack ) {
				this.criticalChance = 1.0;
				var y_offset = this.states.attack_down ? 18 : 0;
				this.strike(new Line(
					new Point( 16, y_offset+8 ),
					new Point( 64, y_offset+16 )
				) );
				if ( this.states.attack > this.attack_times.rest ){
					this.force.x += this.speed * 4.0 * this.delta * this.states.direction;
				}
			}
			this.states.attack -= this.delta;
		}
	}
	
	/* Animation */
	if(this.states.attack > 0 ) {
		this.frame_row = 1;
		this.frame = 0;
		if( this.states.attack_down ) this.frame_row = 2;
		if( this.states.attack < this.attack_times.attack ) this.frame = 1; 
	} else {
		this.frame = (this.frame+this.delta*0.2*Math.abs(this.force.x))%3;
		this.frame_row = 0;
	}
}

 /* platformer\boss_minotaur.js*/ 

Minotaur.prototype = new GameObject();
Minotaur.prototype.constructor = GameObject;
function Minotaur(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 64;
	this.sprite = sprites.minotaur;
	this.speed = 1.8;
	this.active = false;
	this.origin = new Point(.5,1);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 3;
	this.bossface_frame_row = 0;
	
	this.states = {
		"attack" : 0,
		"prep" : 0,
		"cooldown" : Game.DELTASECOND * 2,
		"dizzy" : 0
	}
	
	this.life = dataManager.life(30);
	this.mass = 5.0;
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(5);
	this.inviciple_tile = this.stun_time;
	this.collisionReduction = -1.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) 
			if( this.states.attack > 0 ) {
				obj.hurt( this, this.damage );
			}
	});
	this.on("collideHorizontal", function(dir){
		if( this.states.attack > 0 && Math.abs(this.force.x) > 1.0 ) {
			this.states.attack = 0;
			this.states.cooldown = Game.DELTASECOND;
			this.states.dizzy = Game.DELTASECOND * 2.5;
			
			if( dir > 0 ) {
				game.addObject(new EffectExplosion(this.position.x + 20, this.position.y-32));
			} else {
				game.addObject(new EffectExplosion(this.position.x - 20, this.position.y-32));
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,35);
		this.destroy();
	});
	this.calculateXP();
}
Minotaur.prototype.update = function(){	
	if ( this.stun <= 0  && this.life > 0) {
		var dir = this.position.subtract( _player.position );
				
		if( this.active ) {
			if( this.states.cooldown <= 0 ) {
				if( this.states.attack > 0 ) {
					this.force.x = (this.flip ? -1 : 1) * this.delta * this.speed * 4;
				} else {
					//Prep charge
					this.states.prep -= this.delta;
					if( this.states.prep <= 0 ) this.states.attack = Game.DELTASECOND * 3;
				}
			} else {
				if( this.states.dizzy > 0 ){
					//dizzy
					this.states.dizzy -= this.delta;
				} else {
					this.states.prep = Game.DELTASECOND;
					this.flip = dir.x > 0;
					this.force.x = (dir.x > 0 ? 1 : -1) * this.delta * this.speed;
					this.states.cooldown -= this.delta;
				}
			}
		}
	}
	
	/* Animation */
	this.width = 32;
	this.height = 64;
	if(this.states.cooldown > 0){
		if( this.states.dizzy > 0){
			this.frame_row = 2;
			this.frame = (this.frame + (this.delta * 0.1)) % 3;
		} else {
			this.frame_row = 0;
			this.frame = (this.frame + (this.delta * 0.2 * Math.abs(this.force.x))) % 3;
		}
	} else {
		if( this.states.attack > 0 ){
			this.frame = Math.max( (this.frame + (this.delta * 0.133 * Math.abs(this.force.x))) % 3, 1 );
			this.frame_row = 1;
			this.width = 40;
			this.height = 32;
		} else {
			this.frame = 0;
			this.frame_row = 1;
		}
	}
	
}

 /* platformer\boss_poseidon.js*/ 

Poseidon.prototype = new GameObject();
Poseidon.prototype.constructor = GameObject;
function Poseidon(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 96;
	this.sprite = sprites.poseidon;
	this.speed = .3;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 1;
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(30);
	this.collideDamage = 5;
	this.damage = dataManager.damage(4);
	this.landDamage = dataManager.damage(6);
	this.stun_time = 0;
	this.interactive = false;
	
	this.mass = 6.0;
	this.gravity = 0.4;
	this.begin = Game.DELTASECOND * 6;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_type" : 0, //0 nothing, 1 ground pound, 2 fireballs, 3 lunge
		"attack_counter" : 0,
		"recover" : 0.0,
		"direction" : 1.0,
		"next" : 0
	}
	
	this.attack_times = {
		"warm" : 43,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideVertical", function(y){
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			//else
			//	obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		game.addObject(new SceneEnding());
	});
}
Poseidon.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.active && this.begin > 0 ) {
		this.begin -= this.delta;
		this.interactive = false;
	}
	
	if( this.life > 0 && this.active && this.begin <= 0 ) {
		this.interactive = true;
		if( this.states.attack_type == 1 ) {
			//Ground pound
			if( this.force.y < 0 ) {
				//track player in mid air
				this.force.x += ( dir.x > 0 ? -1 : 1 ) * this.speed * this.delta;
			}
			if( this.states.attack_counter > 0 ) {
				if( this.grounded ) {
					if( this.states.cooldown <= 0 ) {
						this.states.attack_counter--;
						this.force.y = -9;
						this.states.cooldown = Game.DELTASECOND * 0.25;
						this.grounded = false;
					} else { 
						this.states.cooldown -= this.delta;
					}
				}
			} else {
				if( this.grounded ) {
					this.frame = 0; //animation fix for landing
					this.states.attack_type = 0;
					this.states.recover = Game.DELTASECOND * 1.2;
				}
			}
		} else if ( this.states.attack_type == 2 ){
			//Blow the player back with fireballs
			if( this.states.attack > 0 ){
				this.states.attack -= this.delta;
			} else if( this.states.attack_counter > 0 ) {
				if( this.states.cooldown <= 0 ) {
					this.states.cooldown = Game.DELTASECOND * 0.6;
					this.states.attack_counter--;
					var offset = Math.random() > 0.5 ? 28 : 42;
					var bullet = new Bullet(this.position.x, this.position.y + offset);
					bullet.blockable = true;
					bullet.team = this.team;
					bullet.force = new Point((this.flip?-1:1)*5, 0);
					game.addObject(bullet);
				}
				_player.force.x += (this.flip ? -1 : 1) * 0.6;
				this.states.cooldown -= this.delta;
			} else {
				this.states.attack_type = 0;
				this.states.recover = Game.DELTASECOND * 2;
			}
		} else if ( this.states.attack_type == 3 ){
			//Fire ball
			if( this.states.attack <= Game.DELTASECOND * 0.5 && this.states.attack_counter > 0 ) {
				this.states.attack_counter--;
				var bullet = new Bullet(this.position.x, this.position.y + 32);
				bullet.blockable = false;
				bullet.effect = EffectExplosion;
				bullet.team = this.team;
				bullet.force = new Point((this.flip?-1:1)*7, 0);
				game.addObject(bullet);
			}
			if( this.states.attack <= 0 ) {
				this.states.attack_type = 0;
				this.states.recover = Game.DELTASECOND * 1.5;
			}
			this.states.attack -= this.delta;
		} else {
			if ( this.states.recover <= 0 ) {
				this.flip = dir.x > 0;
				if( this.states.next == 0 ) {
					//March back and forth until counter runs down
					if( this.position.x - this.start_x > 40 ) this.states.direction = -1;
					if( this.position.x - this.start_x < -40 ) this.states.direction = 1;
					this.force.x += this.speed * this.delta * this.states.direction * 0.5;
					if( this.states.cooldown <= 0 ) {
						this.states.next = Math.floor( 1 + Math.random() * 3 );
					}
					this.states.cooldown -= this.delta;
				} else {
					//Move into position for next attack
					if( this.states.next == 1 ) {
						this.states.attack_type = this.states.next;
						this.states.next = 0;
						this.states.attack_counter = Math.floor(3 + Math.random() * 3);
						this.states.cooldown = Game.DELTASECOND * 0.25;
					} else {
						var goto_position = this.flip ? (this.start_x+64) : (this.start_x-64);
						if( this.states.next == 3 ) goto_position = this.start_x;
						
						if( Math.abs( this.position.x - goto_position ) < 16 ) {
							this.states.attack_type = this.states.next;
							this.states.next = 0;
							this.states.cooldown = 0;
							this.states.attack = Game.DELTASECOND*1.5;
							this.states.attack_counter = Math.floor(8 + Math.random() * 8);
							if( this.states.attack_type == 3 ) this.states.attack_counter = 1;
						} else { 
							this.force.x += this.speed * this.delta * (this.position.x - goto_position > 0 ? -1 : 1);
						}
					}
				}
			} else {
				this.states.recover -= this.delta;
				this.states.cooldown = Game.DELTASECOND * 1.5;
			}
		}
	}
	
	/* animation */
	if(this.states.recover > 0 ) {
		//Do nothing, hold the frame
	} else if(this.states.attack_type == 1) {
		this.frame = this.force.y > 0 ? 2 : 1;
		this.frame_row = 3;
		if( this.grounded ) this.frame = 0;
	}else if( this.states.attack_type == 2 ) {
		this.frame = this.states.attack > 0 ? 0 : 1;
		this.frame_row = 1;
	} else if( this.states.attack_type == 3 ) {
		this.frame = (this.states.attack_counter > 0 ? 0 : 1);
		this.frame_row = 2;
	} else {
		this.frame_row = 0;
		this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.1) % 3;
	}
}

Poseidon.prototype.render = function(g,c){
	if(!this.active || this.begin > 0 ) {
		if(this.begin < Game.DELTASECOND * 2 ) {
			this.sprite.render(g,this.position.subtract(c),2,1);
		}
		sprites.characters.render(g,this.position.subtract(c).add(new Point(0,32)),3,0);
	} else {
		GameObject.prototype.render.apply(this,[g,c]);
	}
}

 /* platformer\boss_zoder.js*/ 

Zoder.prototype = new GameObject();
Zoder.prototype.constructor = GameObject;
function Zoder(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = sprites.zoder;
	this.speed = 0.4;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guardUpdate" : 0.0,
		"backup" : 0
	}
	
	this.attack_warm = 34.0;
	this.attack_time = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 6;
	
	this.life = dataManager.life(24);
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(3);
	this.mass = 5.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 3;
	this.stun_time = 0;
	
	this.cooldown_time = Game.DELTASECOND * 1.6;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		if( Math.random() > 0.2 ) {
			this.states.guardUpdate = Game.DELTASECOND * 2.0;
			this.states.guard = _player.states.duck ? 1 : 2;
		}
	});
	this.on("death", function(){
		Item.drop(this,40);
		_player.addXP(50);
		audio.play("kill");
		this.destroy();
	});
}
Zoder.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.active /*&& this.states.attack <= 0*/ ) {
			var direction = 1;
			if( Math.abs(_player.position.x - this.start_x ) < 128 ){
				//Player in the attack area, advance at player
				direction = dir.x > 0 ? -1.0 : 1.0;
				direction *= (Math.abs(dir.x) > 48 ? 1.0 : -1.0);
			} else {
				direction = this.position.x - this.start_x > 0 ? -1.0 : 1.0;
			}
			
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			if( Math.random() > 0.6 ) {
				//Pick a random area to attack
				this.states.attack_down = Math.random() > 0.5;
			} else {
				//Aim for the player's weak side
				this.states.attack_down = !_player.states.duck;
			}
			
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if( this.states.guardUpdate < 0 && this.states.attack < 0 ){
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guardUpdate = Game.DELTASECOND * 0.3;
		}
		if( this.states.attack <= 0 ) this.states.attack_counter = 0;
			
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ){
			if( this.states.attack_counter == 0 ){
				audio.play("swing");
				this.states.attack_counter = 1;
				this.force.x += (dir.x > 0 ? -1 : 1) * this.thrust_power;
			}
			this.strike(new Line(
				new Point( 0, (this.states.attack_down ? 24 : 4) ),
				new Point( 48, (this.states.attack_down ? 24 : 4)+4 )
			) );
		}
	}
	/* guard */
	this.guard.active = this.states.guard > 0;
	this.guard.y = this.states.guard == 1 ? 16 : 0;
	this.guard.x = 24;
	this.guard.h = 24;
	
	/* counters */
	this.states.attack -= this.delta;
	this.states.guardUpdate -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = 0;
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ) this.frame = 1;
		this.frame_row = this.states.attack_down == 1 ? 3 : 2;
	} else {
		if( Math.abs( this.force.x ) > 0.1 && false) {
			this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3, 0 );
		} else {
			this.frame = 0;
		}
		this.frame_row = 0;
	}
}
Zoder.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			this.position.subtract(c), 
			2, (this.states.guard > 1 ? 3 : 2 ), this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
}

 /* platformer\bullet.js*/ 

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	this.blockable = true;
	this.range = 512;
	
	this.delay = 0;
	
	this.effect = null;
	this.effect_time = 0;
	
	this.attackEffects = {
		"slow" : [0,10],
		"poison" : [0,10],
		"cursed" : [0,15],
		"weaken" : [0,30],
		"bleeding" : [0,30],
		"rage" : [0,30]
	};
	
	this.speed = 6.0;
	this.sprite = sprites.bullets;
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !this.blockable ) {
				obj.hurt( this, this.damage );
			} else {
				if( "_shield" in obj && game.overlaps(this.bounds()).indexOf(obj._shield) > -1 ){
					obj.trigger("block",this,this.position,this.damage);
				} else {
					obj.hurt( this, this.damage );
				}
				
			}
			this.trigger("death");
		} 
	});
	this.on("collideVertical", function(dir){ this.trigger("death"); });
	this.on("collideHorizontal", function(dir){ this.trigger("death"); });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy();});
	this.on("struck", function(obj){ 
		if(this.blockable && obj.team!=this.team) {
			this.trigger("death");
			audio.play("slash");
			game.slow(0,Game.DELTASECOND*0.1);
		}
	});
	
	this.team = 0;
	this.damage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
}
Bullet.prototype.update = function(){
	this.range -= this.force.length() * this.delta;
	this.flip = this.force.x < 0;
	if( this.range <= 0 ) this.destroy();
	
	if( this.delay > 0 ) {
		this.deltaScale = 0.0;
		this.delay -= this.deltaUnscaled;
		if( this.delay <= 0 ) this.deltaScale = 1.0;
	}
	
	if(this.frames != undefined ) {
		var f = ( 99999 - this.range) % this.frames.length;
		this.frame = this.frames[Math.floor(f)];
	}
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
	}
}

PhantomBullet.prototype = new GameObject();
PhantomBullet.prototype.constructor = GameObject;
function PhantomBullet(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	
	this.sprite = sprites.bullets;
	this.frame = 0;
	this.frame_row = 0;
	
	this.blockable = true;
	this.force = new Point();
	this.team = 0;
	
	this.on("sleep", function(){ this.destroy(); } );
}
PhantomBullet.prototype.update = function(){
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
}
	

Fire.prototype = new GameObject();
Fire.prototype.constructor = GameObject;
function Fire(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 10;
	this.team = 0;
	this.damage = 10;
	this.pushable = false;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = sprites.bullets;
	this.frame = 0;
	this.frame_row = 3;
	this.life = Game.DELTASECOND * 8;
	
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.life = 0;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		this.life = 0;
		if( obj.hurt instanceof Function ) 
			obj.hurt( this, this.damage );
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
Fire.prototype.update = function(){
	this.frame = (this.frame + (this.delta * 0.5)) % 3;
	this.life -= this.delta;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

FallingRock.prototype = new GameObject();
FallingRock.prototype.constructor = GameObject;
function FallingRock(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.team = 0;
	this.damage = 10;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = sprites.bullets;
	this.gravity = 0.333;
	this.pushable = false;
	this.frame = 3;
	this.frame_row = 0;
	
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.trigger("death");
	});
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hurt instanceof Function ){
			obj.hurt( this, this.damage );
		}
	});
	this.on("collideVertical", function(obj){ this.trigger("death");});
	this.on("collideHorizontal", function(obj){ this.trigger("death");});
	this.on("death", function(){
		window.audio.play("explode2");
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
FallingRock.prototype.idle = function(){}

ExplodingEnemy.prototype = new GameObject();
ExplodingEnemy.prototype.constructor = GameObject;
function ExplodingEnemy(x,y, direction, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	this.speed = ops.speed || 20;
	this.sprite = ops.sprite || sprites.bullets;
	this.frame = ops.frame || 0;
	this.frame_row = ops.frame_row || 0;
	this.flip = ops.flip || false;
	this.filter = ops.filter || "hurt";
	
	this.addModule( mod_rigidbody );
	
	this.gravity = 0.1;
	this.friction = 0;
	this.pushable = false;
	this.launch = false;
	this.force = direction.normalize(this.speed);
	
	this.life = Game.DELTASECOND * 0.5;

	this.on("collideVertical", function(obj){ this.life = 0; });
	this.on("collideHorizontal", function(obj){ this.life = 0; });
		
	this.on("collideObject", function(obj){
		if( this.launch && obj.hurt instanceof Function && this.team != obj.team ) {
			this.life = 0;
			obj.hurt( this, this.damage );
		}
	});
	this.on("death", function(){
		game.addObject(new Explosion(
			this.position.x, 
			this.position.y,
			null,
			{"damage" : Math.floor( this.damage * 0.6666 ) }
		));
		this.destroy();
	});
}
ExplodingEnemy.prototype.idle = function(){}
ExplodingEnemy.prototype.update = function(){
	this.life -= this.delta;
	this.launch = true;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

Explosion.prototype = new GameObject();
Explosion.prototype.constructor = GameObject;
function Explosion(x,y, d, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.width = 96;
	this.height = 96;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	
	this.sprite = sprites.explosion;
	
	this.totalTime = Game.DELTASECOND * 0.5;
	this.time = this.totalTime;

	this.on("collideObject", function(obj){
		if( obj.hurt instanceof Function && this.team != obj.team ) {
			obj.hurt( this, this.damage );
		}
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
	
	try{
		//Shake screen
		var dir = this.position.subtract(_player.position).normalize(20);
		window.shakeCamera(dir);
	} catch (err) {}
}
Explosion.prototype.idle = function(){}
Explosion.prototype.update = function(){
	var progress = 1.0 - (this.time / this.totalTime);
	
	this.frame = Math.floor( progress * 8 ) % 4;
	this.frame_row = Math.floor( progress * 2 );
	
	this.time -= this.delta;
	if( this.time <= 0 ){
		this.trigger("death");
	}
}

Explosion.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this, [g,c]);
	
	var progress = this.time / this.totalTime;
	Background.pushLight( this.position.subtract(c), 360 * progress );
}

 /* platformer\chancellor.js*/ 

Chancellor.prototype = new GameObject();
Chancellor.prototype.constructor = GameObject;
function Chancellor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y+8;
	this.sprite = sprites.characters2;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("chancellor_intro");
	this.text_progress = 0;
	
	this.money = 0;
	this.moneyMax = 0;
	this.rate = 1;
	this.pay_timer = 0;
	this.rate_timer = 0;
	
	this.on("open", function(){
		this.money = 0;
		this.moneyMax = 0;
		game.pause = true;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}

Chancellor.prototype.update = function(){
	if( this.open ) {
		if( Chancellor.introduction ) {
			if( input.state("fire") == 1 ) {
				this.text_progress++;
				if( this.text_progress >= this.text.length){
					this.close();
					Chancellor.introduction = false;
				}
			}
		} else {
			if( input.state("jump") == 1 || input.state("pause") == 1 ) {
				this.close();
				audio.play("negative");
			} else if( input.state("fire") == 1 ) {
				_world.town.money += this.money;
				_player.money -= this.money;
				this.money = 0;
				this.close();
				audio.play("unpause");
			} else if ( input.state("up") > 0 ) {
				if( this.pay_timer <= 0 || input.state("up") == 1) {
					this.money = Math.min( this.money + this.rate, _player.money);
					this.pay_timer = Math.max(Game.DELTASECOND * 0.125, this.pay_timer);
					audio.play("coin");
				}
				if( this.rate_timer <= 0 ) {
					this.rate *= 2;
					this.rate_timer = Game.DELTASECOND;
				}
				this.pay_timer -= game.deltaUnscaled;
				this.rate_timer -= game.deltaUnscaled;
			} else if ( input.state("down") > 0 ) {
				if( this.pay_timer <= 0 || input.state("down") == 1 ) {
					this.money = Math.max( this.money - this.rate, 0);
					this.pay_timer = Math.max(Game.DELTASECOND * 0.125, this.pay_timer);
					audio.play("coin");
				}
				if( this.rate_timer <= 0 ) {
					this.rate *= 2;
					this.rate_timer = Game.DELTASECOND;
				}
				this.pay_timer -= game.deltaUnscaled;
				this.rate_timer -= game.deltaUnscaled;
			} else {
				this.pay_timer = Game.DELTASECOND * 0.5;
				this.rate_timer = Game.DELTASECOND;
				this.rate = 1;
			}
		}
		this.moneyMax = Math.max(this.moneyMax, this.money);
	}
	
	//Animation
	if( this.open ) {
		if( this.money > 99 ) {
			//Jump excitedly
			this.frame = (this.frame + game.deltaUnscaled * 0.3) % 3;
			this.frame_row = 2;
		} else if( this.moneyMax > 99 ) {
			//Look disappointed
			this.frame = 4;
			this.frame_row = 2;
		} else {
			if( this.money > 10 ) {
				this.frame = 4;
				this.frame_row = 1;
			} else {
				this.frame = 0;
				this.frame_row = 1;				
			}
		}
	} else {
		this.frame = (this.frame + this.delta * 0.125) % 4;
		this.frame_row = 1;
	}
}

Chancellor.prototype.postrender = function(g,c){
	if( this.open ) {
		if( Chancellor.introduction ) {
			renderDialog(g, this.text[this.text_progress]);
		} else {
			var left = game.resolution.x / 2 - 112;
			renderDialog(g, i18n("chancellor_howmuch"));
			textBox(g, "$"+this.money, left, 120, 128, 40);
		}
	}
}

Chancellor.introduction = true;

 /* platformer\cornerstone.js*/ 

CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y,parm,options){
	options = options || {};
	
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	this.gate = "gate" in options;
	this.gate_number = this.gate ? options.gate-0 : dataManager.currentTemple;
	this.broken = false;
	
	this.play_fanfair = false;
	
	if( this.gate_number in _world.temples ){
		this.broken = _world.temples[this.gate_number].complete
	}
	
	
	this.frame = this.broken ? 2 : 0;
	this.frame_row = this.gate_number;
	
	this.active = false;
	this.progress = 0.0;
	this.on("struck",function(obj,pos,damage){
		if( !this.gate && !this.active && obj instanceof Player ) {
			_world.temples[this.gate_number].complete = true;
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
			ga("send","event","cornerstone","completed temple:"+dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : window.BLANK_TILE;
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
			-32 + x + _x,
			-32 + y +_y,
			game.tileCollideLayer, 
			tile
		);
	}
	
	this.addModule(mod_combat);
}
CornerStone.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		this.frame = 1;
		
		if( this.progress > 33.333 ) {
			if( !this.play_fanfair ){
				this.play_fanfair = true;
				audio.playAs("fanfair","music");
			}
			audio.playLock("explode1",10.0);
			this.frame = 2;
		}
		
		if( this.progress > 233.333 ) {
			game.pause = false;
			_player.addXP(40);
			window._world.trigger("activate");
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}

 /* platformer\damagetrigger.js*/ 

DamageTrigger.prototype = new GameObject();
DamageTrigger.prototype.constructor = GameObject;
function DamageTrigger(x,y,p,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 18;
	
	this.damage = 25;
	
	o = o || {};
	this.width = o.width || this.width;
	this.height = o.height || this.height;
	this.damage = o.damage || this.damage;
	this.restTimer = 0.0;
	
	this.position.x += this.width * 0.5;
	
	this.on("collideObject", function(obj){
		if( this.restTimer <= 0 && obj instanceof Player ) {
			obj.hurt( this, Math.floor( this.damage ) );
			this.restTimer = Game.DELTASECOND * 3;
		}
	});
}
DamageTrigger.prototype.update = function(){
	this.restTimer -= this.delta;
}

 /* platformer\deathtrigger.js*/ 

DeathTrigger.prototype = new GameObject();
DeathTrigger.prototype.constructor = GameObject;
function DeathTrigger(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 256;
	this.height = 18;
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			obj.invincible = -999;
			obj.position.x = obj.checkpoint.x;
			obj.position.y = obj.checkpoint.y;
			obj.hurt( this, Math.floor( obj.lifeMax * .2) );
		} else if( obj instanceof Item ){
			if( obj.name.match(/coin_\d+/) || obj.name.match(/waystone/) ) {
				obj.trigger("collideObject", _player);
			}
		} else if( obj.hasModule(mod_combat) ) {
			obj.invincible = -999;
			obj.hurt( this, 9999 );
		}
		if(obj instanceof Item){
			obj.destroy();
		}
	});
}


 /* platformer\debugger.js*/ 

Debuger.prototype = new GameObject();
Debuger.prototype.constructor = GameObject;
function Debuger(x, y){	
	this.sprite = sprites.player;
	this.width = 14;
	this.height = 30;
	this.speed = 10;
	
	window._player = this;
	this.addModule( mod_camera );
	
	window.pixel_scale = 0.25;
}
Debuger.prototype.idle = function(){}
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}

 /* platformer\detritus.js*/ 

Detritus.prototype = new GameObject();
Detritus.prototype.constructor = GameObject;
function Detritus(x, y, d, ops){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.zIndex = -2;
	
	ops = ops || {};
	
	switch( game.tileSprite.name ) {
		case "tiles0": this.sprite = sprites.detritus0; break;
		case "tiles1": this.sprite = sprites.detritus1; break;
		case "tiles2": this.sprite = sprites.detritus2; break;
		case "tiles3": this.sprite = sprites.detritus3; break;
		case "tiles4": this.sprite = sprites.detritus4; break;
		case "tiles5": this.sprite = sprites.detritus5; break;
		case "tiles6": this.sprite = sprites.detritus6; break;
		case "tiles7": this.sprite = sprites.detritus7; break;
		case "tiles8": this.sprite = sprites.detritus8; break;
		case "tiles9": this.sprite = sprites.detritus9; break;
		default: this.sprite = sprites.detritus0; break;
	}
	this.interactive = false;
	
	this.frame = 1 + Math.floor( Math.random() * 6 );
	this.frame_row = 0;
	
	if( "side" in ops ) {
		if( ops.side == "r" ) {
			this.frame = 7;
			this.position.x -= 8;
		} else { 
			this.frame = 0;
			this.position.x += 8;
		}
	}
}

Statue.prototype = new GameObject();
Statue.prototype.constructor = GameObject;
function Statue(x, y, d, ops){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.zIndex = -3;
	
	ops = ops || {};
	var tilesetNumber = game.tileSprite.name.match(/\d+/)-0;
	
	this.sprite = sprites.statues;
	this.frame = Math.floor( Math.random() * 2 );
	this.frame_row = tilesetNumber-1;
	
	this.interactive = false;
}

 /* platformer\door.js*/ 

Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.isOpen = false;
	this.openAnimation = 0;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, window.BLANK_TILE);
	}
	
	this.on("collideObject", function(obj){
		if( !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					this.open();
				}
			}
		}
	});
	
	ops = ops || {};
	if("name" in ops) this.name = ops.name;
}
Door.prototype.open = function(){
	audio.play("open");
	
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -20;
	this.isOpen = true;
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 4;
	this.frame_row = Math.floor( r / 4 );
	
	if( this.isOpen ) {
		this.openAnimation = Math.min(this.openAnimation + this.delta * 0.5, 3);
	}
}
Door.prototype.render = function(g,c){
	this.sprite.render(g, this.position.subtract(c), this.openAnimation, 3);
	
	if( !this.isOpen ) {
		this.sprite.render(g, this.position.subtract(c).add(new Point(10,36)), this.frame, this.frame_row);
	}
}

 /* platformer\effects.js*/ 

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
	this.flash = true;
	
	this.on("sleep",function(){ this.destroy(); } );
	
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
	
	if( this.flash ) {
		g.color = [1.0,1.0,1.0,1.0];
		g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
		this.flash = false;
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

 /* platformer\enemy_amon.js*/ 

Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.lilghost;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(0);
	this.collisionReduction = -1.0;
	this.bounce = 1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	this.damage = dataManager.damage(2);
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame = ( this.frame + this.delta * 0.2 ) % 3;
	
	if( this.stun < 0 ) {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.force.x = this.speed * (this.force.x > 0 ? 1 : -1);
			this.force.y = this.speed * (this.force.y > 0 ? 1 : -1);
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
		this.strike( new Line(-8,0,8,4) );
	} else {
		this.force.x = this.force.y = 0;
	}
}

 /* platformer\enemy_axedog.js*/ 

Axedog.prototype = new GameObject();
Axedog.prototype.constructor = GameObject;
function Axedog(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.axedog;
	this.speed = 0.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"attack" : 0.0,
		"direction" : 1.0
	};
	this.attacks = {
		"charge" : Game.DELTASECOND,
		"release" : Game.DELTASECOND * 0.4,
		"rest" : Game.DELTASECOND * 0.25,
	}
	
	this.life = dataManager.life(4);
	this.lifeMax = dataManager.life(4);
	this.damage = dataManager.life(3);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Axedog.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack > 0 ) {
			if(this.states.attack < this.attacks.release && this.states.attack > this.attacks.rest) {
				this.strike( new Line(0,-16,24,16) );
			}
			this.states.attack -= this.delta;
		} else {
			if( game.getTile( 
				16 * this.states.direction + this.position.x, 
				this.position.y + 24, game.tileCollideLayer) == 0 
			){
				//Turn around, don't fall off the edge
				this.force.x = 0;
				this.states.direction *= -1.0;
			}
			
			if( Math.abs( dir.x ) > 24 ) {
				this.force.x += this.speed * this.delta * this.states.direction;
			}
			this.states.cooldown -= this.delta;
			this.flip = this.states.direction < 0;
			
			if( this.states.cooldown <= 0 && Math.abs( dir.x ) < 64 ) {
				this.states.attack = this.attacks.charge;
				this.states.cooldown = Game.DELTASECOND * 2.0;
				this.flip = dir.x > 0;
			}
		}
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame = 2;
		this.frame_row = 2;
	} else if( this.states.attack > 0 ) {
		if( this.states.attack < this.attacks.rest ) {
			this.frame = 0;
			this.frame_row = 1;
		} else if (this.states.attack < this.attacks.release ){
			this.frame = 1;
			this.frame_row = 2;
		} else {
			this.frame = 3;
			this.frame_row = 1;
		}
	} else {
		this.frame_row = 1;
		this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 3;
	}
}

 /* platformer\enemy_baller.js*/ 

Baller.prototype = new GameObject();
Baller.prototype.constructor = GameObject;
function Baller(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 72;
	this.sprite = sprites.baller;
	
	this.ball = new BallerBall(x-48,y);
	game.addObject( this.ball );
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"swing" : 0.0,
		"release" : 0.0,
		"retrieve" : 0.0,
	};
	this.timers = {
		"swing" : Game.DELTASECOND * 3.0,
		"release" : Game.DELTASECOND * 1.5,
		"retrieve" : Game.DELTASECOND * 3.0,
	}
	
	this.death_time = Game.DELTASECOND * 3.0;
	this.life = dataManager.life(28);
	this.lifeMax = dataManager.life(28);
	this.damage = dataManager.life(5);
	this.mass = 4.0;
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("pre_death", function(){
		this.ball.destroy();
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Baller.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = dir.x > 0;
		
		if( this.ball.reflect ) {
			this.ball.gravity = 0;
			var balldir = this.ball.position.subtract( this.position );
			balldir = balldir.normalize();
			this.ball.force.x = -balldir.x * 4.0;
			this.ball.force.y = -balldir.y * 4.0;
		} else if( this.states.retrieve > 0 ) {
			this.states.retrieve -= this.delta;
			if( this.ball.position.x < this.position.x ) {
				this.ball.force.x += this.delta * 0.5;
				this.ball.flip = false;
			} else { 
				this.ball.force.x -= this.delta * 0.5;
				this.ball.flip = true;
			}
		} else if ( this.states.release > 0 ) {
			this.states.release -= this.delta;
			if( this.position.distance( this.ball.position ) > 200 ) {
				this.force.x *= -1.0;
				this.force.y *= -1.0;
			}
			if( this.states.release <= 0 ) {
				this.states.retrieve = this.timers.retrieve;
				this.ball.pushable = true;
				this.ball.damage = 0;
			}
		} else if ( this.states.swing > 0 ) { 
			this.states.swing -= this.delta;
			//Spin ball around head
			var ball_position = Math.sin( this.states.swing * 0.2 );
			var ball_height = Math.max( Math.min( 32-Math.abs(dir.x*0.4), 32), -32);
			this.ball.frame = 1 + Math.floor((1-Math.abs(ball_position))*3);
			this.ball.flip = ball_position < 0;
			this.ball.position.x = this.position.x + ball_position * 96;
			this.ball.position.y = this.position.y + ball_height;
			
			if( this.states.swing <= 0 ) {
				this.states.release = this.timers.release;
				//Fling the ball
				this.ball.frame = 0;
				this.ball.gravity = 0.5;
				this.ball.force.x = 10 * (dir.x > 0 ? -1.0 : 1.0);
				this.ball.force.y = -3;
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) {
				this.states.swing = this.timers.swing;
				//Stop ball from moving
				this.ball.pushable = false;
				this.ball.gravity = 0;
				this.ball.force.x = this.ball.force.y = 0;
				this.ball.damage = this.damage;
			}
		}
	}
	
	/* Animation */
	if( this.ball.reflect || this.stun > 0 ) {
		this.frame = 3;
		this.frame_row = 1;
	} else if( this.states.retrieve > 0 ) {
		this.frame = Math.max((this.frame + this.delta * 0.1) % 3, 1);
		this.frame_row = 1;
	} else if ( this.states.release > 0 ) {
		this.frame = 0;
		this.frame_row = 1;
	} else if ( this.states.swing > 0 ) { 
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 0;
	} else {
		this.frame = 1;
		this.frame_row = 1;
	}
}


BallerBall.prototype = new GameObject();
BallerBall.prototype.constructor = GameObject;
function BallerBall(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 48;
	this.sprite = sprites.baller;
	this.damage = 0;
	this.reflect = false;
	
	this.strikeBox = this.bounds().transpose(this.position.scale(-1.0));
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.friction = 0.04;
	this.on("hurt_other", function(obj, damage){
		if( obj instanceof Player && damage > 0 ) {
			obj.force.x += this.force.x;
			obj.hurt( this, this.damage );
		}
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Baller && this.reflect ) {
			this.reflect = false;
			this.gravity = 1.0;
			obj.force.x += this.force.x;
			obj.hurt( this, this.damage * 2.0 );
		}
	});
	this.on("struck", function(obj) {
		if( !this.reflect && Math.abs( this.force.x ) > 1 && this.damage > 0 ) {
			this.reflect = true;
			audio.play("critical");
			game.slow(0.1, Game.DELTASECOND * 0.5 );
		}
	});
	
	this.mass = 3.0;
	this.frame = 0
	this.frame_row = 2;
}
BallerBall.prototype.update = function(){
	if( this.damage > 0 ) {
		this.strike( this.strikeBox );
	}
}

 /* platformer\enemy_batty.js*/ 

Batty.prototype = new GameObject();
Batty.prototype.constructor = GameObject;
function Batty(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.batty;
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 1,
		"lockon": false,
		"attack" : 0,
		"direction" : 0
	}
	
	this.life = dataManager.life(0);
	this.lifeMax = dataManager.life(0);
	this.mass = 0.8;
	this.collideDamage = this.damage = dataManager.damage(2);
	this.inviciple_tile = this.stun_time;
	this.gravity = -0.6;
	this.fuse = dataManager.currentTemple >= 4;
	
	this.on("collideObject", function(obj){
		if( this.fuse && obj instanceof Batty ) {
			//Fuse with other batty
			this.destroy();
			obj.destroy();
			this.fuse = obj.fuse = false;
			game.addObject(new Deckard( this.position.x, this.position.y ));
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.attack = 0;
		
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
		else this.states.lockon = true;
		
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		//this.visible = true;
		//this.interactive = true;
		this.states.cooldown = Game.DELTASECOND * 1;
		this.states.lockon = false;
		this.states.attack = 0;
		//this.life = this.lifeMax;
		this.gravity = -0.6;
		
	});
	this.on("death", function(){
		//this.visible = false;
		//this.interactive = false;
		this.destroy();
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
	});
	
	this.calculateXP();
}
Batty.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			var batty = null;
			if( this.fuse ){
				var batties = game.getObjects(Batty);
				for(var i=0; i < batties.length; i++ ) if( batties[i] != this && batties[i].awake ) 
					batty = batties[i];
			}
			
			if( batty != null ){
				var batty_dir = this.position.subtract(batty.position);
				this.gravity = batty_dir.y > 0 ? -0.5 : 0.5;
				this.force.x += this.speed * this.delta * (batty_dir.x > 0 ? -1 : 1);
			} else {
				if( this.states.lockon ) {
					this.gravity = 0;
					this.force.y = 0;
					this.force.x += this.speed * this.delta * this.states.direction;
					this.flip = this.force.x < 0; 
				} else {
					this.gravity = 0.6;
					this.criticalChance = 1.0;
					if( dir.y + 16.0 > 0 ) {
						this.states.lockon = true;
						this.criticalChance = 0.0;
						this.states.direction = dir.x > 0 ? -1 : 1;
					}
				}
				
				if( this.states.attack <= 0 ){
					this.gravity = -0.6;
					this.states.cooldown = Game.DELTASECOND * 2;
					this.states.lockon = false;
				} else {
					this.states.attack -= this.delta
				}
				
				this.strike( new Line(-8,-4,8,4) );
			}
		} else {
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) this.states.attack = Game.DELTASECOND * 2.5;
			this.states.direction = dir.x > 0 ? -1 : 1;
		}
	} 
	
	/* Animation */
	if( Math.abs(this.force.y) < 0.2 && Math.abs(this.force.x) < 0.2  ) {
		this.frame = 1;
	} else {
		if( this.force.y > 1.0 ) {
			this.frame = 0;
		} else {
			this.frame = Math.max( (this.frame + this.delta * 0.3) % 5, 2);
		}
	}
}

 /* platformer\enemy_beaker.js*/ 

Beaker.prototype = new GameObject();
Beaker.prototype.constructor = GameObject;
function Beaker(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.beaker;
	this.speed = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"backwards": false,
		"jumps" : 0
	}
	
	this.life = dataManager.life(3);
	this.lifeMax = dataManager.life(3);
	this.mass = 0.8;
	this.collideDamage = dataManager.damage(2);
	this.inviciple_tile = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = !this.states.backwards;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("wakeup", function(){
		//this.visible = true;
		//this.interactive = true;
		this.states.cooldown = 50;
		this.states.jumps = 0;
		//this.life = this.lifeMax;
	});
	this.on("death", function(){
		//this.visible = false;
		//this.interactive = false;
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Beaker.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (this.states.backwards ? -1.0 : 1.0);
			
			var speed = 2;
			var jump = 3;
			this.states.cooldown = Game.DELTASECOND;
			this.states.jumps++;
			
			if( this.states.jumps > 2 ) {
				speed = 7;
				jump = 7;
				this.grounded = false;
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.jumps = 0;
				this.criticalChance = 1.0;
			}
			this.force.x += direction * speed;
			this.force.y = -jump;
		}
		
		if( Math.abs( this.force.x ) > 0.5 ) this.flip = this.force.x < 0;
		if( Math.abs(dir.x) > 100 ) this.states.backwards = false;
		
		/* counters */
		this.states.cooldown -= this.delta;
		
		if( this.criticalChance > 0 ) {
			this.strike( new Line(-8,-4,8,4) );
		}
	}
	
	if(this.grounded) this.criticalChance = 0.0;
	this.friction = this.grounded ? 0.4 : 0.025;
	
	/* Animation */
	this.frame = 0;
	if( this.states.cooldown < 5 ) this.frame = 1;
	if( !this.grounded ) this.frame = 2;
}

 /* platformer\enemy_bear.js*/ 

Bear.prototype = new GameObject();
Bear.prototype.constructor = GameObject;
function Bear(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.bear;
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"attack_down" : false,
		"guard" : 2 //0 none, 1 bottom, 2 top
	}
	
	this.attack_warm = 40.0;
	this.attack_time = 23.0;
	this.attack_rest = 0.0;
	
	this.life = dataManager.life(6);
	this.damage = dataManager.damage(3);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		this.states.cooldown = Math.random() > 0.6 ? 0 : 30;
		this.states.guard = Math.random() > 0.5 ? 1 : 2;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Bear.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active && this.states.attack <= 0 ) {
			var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 ){
			this.states.attack_down = Math.random() > 0.5;
			this.states.guard = 0;
			this.states.attack = this.attack_warm;
			this.states.cooldown = 70.0;
		}
		
		if( this.states.guard == 0 && this.states.attack <= 0 ){
			this.states.guard = Math.random() > 0.5 ? 1 : 2;
		}
		
		if ( this.states.attack > 0 && this.states.attack < this.attack_time && this.states.attack > this.attack_rest ){
			this.strike(new Line(
				new Point( 15, (this.states.attack_down ? 8 : -8) ),
				new Point( 27, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* guard */
	this.guard.active = this.states.guard != 0;
	this.guard.x = 8;
	this.guard.y = this.states.guard == 1 ? 6 : -5;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame_row = 1;
			this.criticalChance = 1.0;
		} else {
			this.criticalChance = 0.0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.2) % 4, 1 );
			} else {
				this.frame = 0;
			}
			this.frame_row = 0;
		}
	}
}
Bear.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 2 : 3 ), 2, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Sword
	var _x = 0
	if( this.states.attack > 0 )
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	this.sprite.render( g, 
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.frame, this.frame_row+3, this.flip
	);
}

 /* platformer\enemy_bigbone.js*/ 

BigBones.prototype = new GameObject();
BigBones.prototype.constructor = GameObject;
function BigBones(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 40;
	this.sprite = sprites.bigbones;
	this.speed = .3;
	this.active = true;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	//this.guard.active = true;
	
	this.attacktimes = {
		"warm" : 30.0,
		"release" : 14.0,
		"rest" : 10.0
	};
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = dataManager.life(9);
	this.mass = 2.0;
	this.damage = dataManager.damage(3);
	this.stun_time = Game.DELTASECOND * 0.25;
	
	//Set options
	ops = ops || {};
	if( "active" in ops ) this.active = ops.active.toLowerCase() == "true";
	if( "flip" in ops ) this.flip = ops.flip.toLowerCase() == "true";
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if(this.team == obj.team) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = 30.0;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
BigBones.prototype.update = function(){	
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -10.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attacktimes.warm;
			this.states.cooldown = Game.DELTASECOND;
		}
		
		if ( this.states.attack > this.attacktimes.rest && this.states.attack <= this.attacktimes.release ){
			this.strike(new Line(
				new Point( 12, -1 ),
				new Point( 32, 3 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 3;
	} else { 
		if( this.states.attack > this.attacktimes.rest ) {
			if( this.states.attack <= this.attacktimes.release ) {
				this.frame_row = 1;
				this.frame = 1;
			} else { 
				this.frame_row = 0;
				var progress = (this.attacktimes.warm - this.states.attack) / Math.abs(this.attacktimes.release-this.attacktimes.warm);
				this.frame = Math.floor(progress * 4);
			}
		} else {
			var progress = (1000-this.states.cooldown*0.1) % 6;
			this.frame = (progress+2) % 4;
			this.frame_row = progress >= 2 ? 2 : 1;
		}
	}
}
BigBones.prototype.render = function(g,c){
	this.sprite.render(g,this.position.subtract(c),4,0,this.flip);
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\enemy_chaz.js*/ 

Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = sprites.chaz;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
	
	this.life = dataManager.life(7);
	this.collideDamage = dataManager.damage(1);
	this.damage = dataManager.damage(3);
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 15
	};
}
Chaz.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( this.position.x - this.start_x > 24 ) this.states.backup = true;
		if( this.position.x - this.start_x < -24 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 50;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new Bullet(this.position.x, this.position.y+10, (this.flip?-1:1) );
				} else {
					missle = new Bullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				missle.damage = this.damage;
				missle.frame = 4;
				missle.frame_row = 0;
				game.addObject( missle ); 
			}
		} else {
			this.states.thrown = false;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 3;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame_row = this.states.attack_lower ? 2 : 1;
		} else {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

 /* platformer\enemy_chazbike.js*/ 

ChazBike.prototype = new GameObject();
ChazBike.prototype.constructor = GameObject;
function ChazBike(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
	this.height = 32;
	this.start_x = x;
	
	this.speed = 0.15;
	this.sprite = sprites.chazbike;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		this.states.backwards = Game.DELTASECOND * 0.75;
	});
	this.on("collideObject", function(obj){
		if( this.states.collideCooldown > 0 || this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			this.states.collideCooldown = Game.DELTASECOND;
			obj.hurt( this, this.collideDamage );
		}
	});
	this.on("pre_death", function(obj,pos,damage){
		var rider = new Chaz(this.position.x, this.position.y);
		rider.force.y = - 6;
		rider.force.x = this.flip ? 6 : -6;
		game.addObject( rider );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.calculateXP();
	
	this.life = dataManager.life(6);
	this.collideDamage = dataManager.damage(3);
	this.mass = 5.3;
	this.friction = 0.01;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"collideCooldown" : 0,
		"backwards" : 0,
		"direction" : 1
	};
	
}
ChazBike.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 && this.life > 0 ) {
		this.flip = this.force.x < 0;
		var direction = dir.x < 0 ? 1 : -1;
		this.force.x += this.speed * this.delta * direction * this.states.direction;
		this.states.collideCooldown -= this.delta;
		this.states.backwards -= this.delta;
		this.states.direction = this.states.backwards <= 0 ? 1 : -1;
	} else {
		this.force.x = 0;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		if( Math.abs( this.force.x ) > 2 ) {
			this.frame_row = 0;
			this.frame = (this.frame + (Math.abs(this.force.x) * 0.3 * this.delta) ) % 3;
		} else {
			this.frame_row = 1;
			this.frame = 0;
			if( Math.abs(this.force.x) < 1 ) this.frame = 1;
		}
	}
}

 /* platformer\enemy_crusher.js*/ 

Crusher.prototype = new GameObject();
Crusher.prototype.constructor = GameObject;
function Crusher(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 48;
	this.sprite = game.tileSprite;
	this.speed = 0.2;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.gravity = 0;
	this.pushable = false;
	
	this.states = {
		"phase" : 0,
		"cooldown" : 0,
		"active" : true
	}
	
	this.damage = dataManager.damage(5);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideVertical", function(dir){
		if( dir < 0 ) {
			this.states.phase = 0;
			this.states.active = true;
		}
	});
	this.on("collideObject", function(obj){
		if( !this.states.active ) return;
		if( obj.hurt instanceof Function ) {
			if( this.force.y > 5 ) obj.hurt( this, this.damage );
			else obj.hurt( this, this.collideDamage );
			this.states.active = false;
		}
	});
}
Crusher.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.states.phase == 0 && Math.abs(dir.x) <= 32 ){
		this.states.phase = 1;
		this.states.cooldown = Number.MAX_VALUE;
		this.force.y = 0;
		this.gravity = 1.0;
	}
	
	if( this.grounded && this.states.phase == 1 ) {
		this.states.phase = 2;
		this.states.cooldown = Game.DELTASECOND;
		audio.play("burst1");
	}
	
	if( this.states.cooldown <= 0 ) {
		this.force.y = -1;
		this.gravity = 0.0;
	}
	
	this.states.cooldown -= this.delta;
}
Crusher.prototype.render = function(g,c){
	for(var x=0; x < 2; x++ ) for(var y=0; y < 3; y++ ) {
		this.sprite.render(g,
			new Point( x*16 + -16 + this.position.x - c.x, y*16 + -24 + this.position.y - c.y ),
			x+2, y+13
		);
	}
}

 /* platformer\enemy_deckard.js*/ 

Deckard.prototype = new GameObject();
Deckard.prototype.constructor = GameObject;
function Deckard(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 36;
	this.sprite = sprites.deckard;
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"combo": 0,
		"fly" : 0,
		"attack" : 0,
		"attack_counter":0,
		"attack_lower" : false,
		"direction" : 1
	}
	this.attack_time = Game.DELTASECOND * 0.6;
	this.jump_start_y = 0;
	
	this.life = dataManager.life(6);
	this.lifeMax = dataManager.life(6);
	this.mass = 4;
	this.damage = dataManager.damage(3);
	this.collideDamage = dataManager.damage(1);
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 2;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) {
			//obj.hurt( this, this.collideDamage );
			//this.states.attack = 0;
		}
	});
	this.on("collideHorizontal", function(x){
	});
	this.on("collideVertical", function(x){
		if( x < 0 ) {
			this.gravity = 0;
			this.force.y = 0;
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		this.destroy();
		_player.addXP(this.xp_award);
		Item.drop(this,20);
		audio.play("kill");
		
		for(var i=0; i < 2; i++ ){
			//Spawn bats on death
			var batty = new Batty(this.position.x, this.position.y);
			batty.fuse = false;
			batty.invincible = batty.invincible_time;
			batty.force.x = i <= 0 ? -8 : 8;
			game.addObject(batty);
		}
	});
	
	this.calculateXP();
}
Deckard.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if( this.states.combo > 0 ) {
			if( this.states.attack < 0 ) {
				this.states.attack = this.attack_time;
				this.states.attack_lower = Math.random() >= 0.5;
			}
			
			if( this.states.attack < this.attack_time * 0.3 ) {
				if( this.states.attack_counter == 0 ) {
					this.states.attack_counter = 1;
					this.force.x += this.speed * 10.0 * this.states.direction;
					audio.play("swing");
				}
			} else {
				this.states.attack_counter = 0;
			}
			
			this.states.combo -= this.delta;
			this.states.attack -= this.delta;
		} else if ( this.states.fly > 0 ) {
			this.states.fly -= this.delta;
			if( this.states.fly < this.states.attack_counter ) {
				//Fire fireball
				this.states.attack_counter = this.states.fly - Game.DELTASECOND * .5;
				var bullet = new Bullet(this.position.x, this.position.y);
				bullet.force = _player.position.subtract(this.position).normalize(6);
				bullet.blockable = false;
				bullet.damage = this.damage;
				bullet.effect = EffectSmoke;
				bullet.team = this.team;
				game.addObject(bullet);
			}
			if( this.position.y - this.jump_start_y < -64 ) {
				this.gravity = 0;
				this.force.y = 0;
				this.force.x += this.speed * this.delta * this.states.direction;
			}
		} else {
			//walk towards player
			this.states.cooldown -= this.delta;
			this.states.attack = 0;
			this.flip = dir.x > 0;
			this.states.direction = (dir.x < 0 ? 1 : -1) * (this.states.cooldown<Game.DELTASECOND?1:-1);
			this.gravity = 1.0;
			this.jump_start_y = this.position.y;
			
			if( Math.abs(dir.x) > 48 ) {
				this.force.x += this.speed * this.delta * this.states.direction;
			}
			
			if( this.states.cooldown <= 0 ) {
				if( Math.abs(dir.x) > 64 || Math.random() < 0.2 ) {
					this.states.fly = Game.DELTASECOND * 5;
					this.states.attack_counter = this.states.fly - Game.DELTASECOND;
					this.states.direction = (dir.x < 0 ? 1 : -1);
					this.gravity = 0.4;
					this.force.y = -8;
					this.force.x = this.states.direction * -8;
				} else {
					this.states.direction = (dir.x < 0 ? 1 : -1);
					this.states.combo = this.attack_time * 5;
					this.force.x = 0;
					this.states.attack_counter = 0;
				}
				this.states.cooldown = Game.DELTASECOND * 3;
			}
		}
	} 
	
	if( this.states.attack > 0 && this.states.attack < this.attack_time * 0.3 ) {
		this.strike( new Line(
			0, this.states.attack_lower ? 8 : -4,
			40, this.states.attack_lower ? 12 : 0
		) );
	}
	
	/* Animation */
	if( this.states.attack > 0 ){
		this.frame = this.states.attack < this.attack_time * 0.3 ? 1 : 0;
		this.frame_row = this.states.attack_lower ? 2 : 1;
	} else {
		if( this.grounded ) {
			this.frame = 0;
			this.frame_row = 0;
		} else {
			this.frame = (this.frame + (this.delta * Math.abs(this.force.x) * 0.2)) % 2;
			this.frame_row = 3;
		}
	}
}

 /* platformer\enemy_derring.js*/ 

Derring.prototype = new GameObject();
Derring.prototype.constructor = GameObject;
function Derring(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = sprites.amon;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x = this.force.x > 0 ? -2.5 : 2.5;
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(0);
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Derring.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	this.flip = this.force.x < 0;
}

 /* platformer\enemy_dropper.js*/ 

Dropper.prototype = new GameObject();
Dropper.prototype.constructor = GameObject;
function Dropper(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.origin = new Point();
	this.frame = 6;
	this.frame_row = 12;
	
	
	this.sprite = game.tileSprite;
	this.cooldown = 50;
}
Dropper.prototype.update = function(){
	if( this.cooldown < 0 ) {
		this.cooldown = Game.DELTASECOND;
		var bullet = new Bullet(this.position.x + 8, this.position.y + 16, 0);
		bullet.damage = dataManager.damage(2);
		bullet.blockable = false;
		bullet.gravity = 1.0;
		bullet.frame = 2;
		bullet.frame_row = 0;
		game.addObject( bullet );
	}
	this.cooldown -= this.delta;
}

 /* platformer\enemy_father.js*/ 

Father.prototype = new GameObject();
Father.prototype.constructor = GameObject;
function Father(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.characters;
	this.speed = 0.05;
	this.active = false;
	
	this.limit = 512;
	this.start_x = x;
	this.addModule( mod_rigidbody );
	this.temple = dataManager.temples[Math.max(dataManager.currentTemple,0)];
	
	this.states = {
		"cooldown" : Game.DELTASECOND,
		"touch" : 0,
		"direction" : 1
	};
	
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		
	});
	this.on("player_death", function(){
		this.active = false;
	});
}
Father.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.active ) {
		this.force.x += this.delta * this.states.direction * this.speed;
		
		if( Math.abs( dir.x ) < 64 ){
			var force_push = (64-Math.abs( dir.x ))/24;
			_player.force.x += this.delta * force_push * this.states.direction * -1.0;
			this.states.cooldown -= this.delta;
		}
		
		if( this.states.direction > 0 ) {
			if(this.position.x-this.start_x > this.limit) this.destroy();
		} else {
			if(this.position.x-this.start_x < -this.limit) this.destroy();
		}
		
		if( this.states.cooldown <= 0 ) {
			//Spawn Monster
			this.states.cooldown = Game.DELTASECOND * 4;
			var monster_list = dir.y > 32 ? this.temple.minorfly : this.temple.majormonster;
			var name = monster_list[Math.floor(monster_list.length*Math.random())];
			var enemy = new window[name]((this.position.x+_player.position.x)*0.5, (this.position.y+_player.position.y)*0.5);
			enemy.on("sleep", function(){ this.destroy(); });
			game.addObject(enemy);
			game.addObject(new EffectSmoke(this.position.x,this.position.y));
		}
		this.states.cooldown -= this.delta;
	} else {
		if( Math.abs(dir.x) < 128 && Math.abs(dir.y) < 64 ) {
			this.active = true;
			this.states.direction = dir.x > 0 ? 1 : -1;
			this.flip = this.states.direction < 0;
		}
		var _dir = _player.position.x > this.start_x ? 1 : -1;
		this.position.x = this.start_x + (this.limit - 32)*_dir;
	}
	
	this.frame = (this.frame + this.delta * 0.2 * Math.abs(this.force.x)) % 3;
	this.frame_row = 0;
}
Father.prototype.idle = function(){}

 /* platformer\enemy_flederknife.js*/ 

Flederknife.prototype = new GameObject();
Flederknife.prototype.constructor = GameObject;
function Flederknife(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.flederknife;
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1.0,
	};
	
	this.life = dataManager.life(3);
	this.lifeMax = dataManager.life(3);
	this.damage = dataManager.life(2);
	this.mass = 1.0;
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("collideHorizontal", function(dir){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract( _player.position );
		this.states.direction = dir.x > 0 ? -1.0 : 1.0;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Flederknife.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = this.states.direction < 0;
		
		this.force.x += this.delta * this.speed * this.states.direction;
		this.strike( new Line(0, -2, 12, 2) );
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 4;
		this.frame_row = 1;
	}
}

 /* platformer\enemy_fly.js*/ 

Fly.prototype = new GameObject();
Fly.prototype.constructor = GameObject;
function Fly(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.sprite = sprites.amon;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 0.25;
	this.frame = 0;
	this.frame_row = 1;
	this.life = dataManager.life(1);
	this.gravity = 0.0;
	this.friction = 0.1;
	this.mass = 0.7;
	this.itemDrop = true;
	
	this.times = {
		"attackWarm" : Game.DELTASECOND,
		"attack" : Game.DELTASECOND * 0.25,
	};
	this.states = {
		"attackWarm" : 0.0,
		"attack" : 0.0
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		if( this.itemDrop ){
			Item.drop(this);
		}
		this.destroy();
	});
}

Fly.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		
		this.flip = dir.x > 0;
		
		if(this.states.attackWarm > 0) {
			this.states.attackWarm -= this.delta;
			this.force = this.force.scale(1 - this.delta*0.5);
			if( this.states.attackWarm <= 0) {
				this.force.x = -10 * (dir.x < 0 ? -1.0 : 1.0);
				this.states.attack = this.times.attack;
			}
		} else if(this.states.attack > 0) {
			this.states.attack -= this.delta;
			this.strike( new Line(0,-6,16,12) );
		} else {
			if( Math.abs(dir.x) > 32 || Math.abs(dir.y) > 32 ){
				this.force = this.force.subtract( dir.normalize( this.speed ) );
			}
			if( Math.abs(dir.x) < 64 && Math.abs(dir.y) < 24 ){
				this.states.attackWarm = this.times.attackWarm;
			}
		}
	}
	
	this.frame = (this.frame + this.delta * 0.5) % 2.0;
}

 /* platformer\enemy_ghoul.js*/ 

Ghoul.prototype = new GameObject();
Ghoul.prototype.constructor = GameObject;
function Ghoul(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 30;
	this.sprite = sprites.ghoul;
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 0,
		"backwards" : 0,
		"upwards" : 0
	}
	
	this.life = dataManager.life(2);
	this.mass = 0.2;
	this.collideDamage = dataManager.damage(2);
	this.inviciple_tile = this.stun_time;
	this.gravity = 0;
	this.attackEffects.weaken = [1.0,20];
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			obj.hurt( this, this.collideDamage );
			this.states.cooldown = Game.DELTASECOND * 5;
		}
	});
	this.on("collideVertical", function(x){
		if( x > 0 ) {
			this.states.upwards = Game.DELTASECOND * 3;
		} else {
			this.states.upwards = 0;
		}
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = Game.DELTASECOND * 3;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Ghoul.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		if( this.states.upwards > 0 ){
			this.force.y -= this.speed * this.delta;
		} else if( Math.abs( dir.y ) > 16 ) {
			this.force.y += this.speed * this.delta * (dir.y > 0 ? -1 : 1);
		}
		var backwards = this.states.cooldown > 0 || this.states.backwards > 0;
		this.force.x += (dir.x > 0 ? -1 : 1) * (backwards ? -1 : 1) * this.delta * this.speed;
		this.flip = this.force.x < 0;
		
		this.states.cooldown -= this.delta;
		this.states.backwards -= this.delta;
		this.states.upwards -= this.delta;
	} 
	
	this.frame = (this.frame + (this.delta * 0.2)) % 4;
	this.frame_row = 0;
}

 /* platformer\enemy_hammer.js*/ 

HammerMathers.prototype = new GameObject();
HammerMathers.prototype.constructor = GameObject;
function HammerMathers(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.sprite = sprites.hammermather;
	this.speed = 10;
	this.jump = 8;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.collisionReduction = -1.0;
	this.gravity = 0.7;
	this.friction = 0.05;
	this.states = {
		"cooldown" : 50.0,
		"inair" : false,
		"jumps" : 0
	}
	
	this.life = dataManager.life(2);
	this.lifeMax = dataManager.life(2);
	this.damage = dataManager.life(3);
	this.mass = 1.2;
	
	this.on("collideVertical", function(x){
		if( x < 0 ) this.force.x = 0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
HammerMathers.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ) {
			this.criticalChance = 1.0;
			this.strike( new Line(0,-16,32,-4) );
			if( this.grounded ) {
				this.states.cooldown = Game.DELTASECOND;
			}
		} else {
			this.criticalChance = 0.0;
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			if( this.states.cooldown <= 0 ) {
				this.grounded = false;
				this.force.x = this.speed * (this.flip ? -1.0 : 1.0);
				this.force.y = -this.jump;
			}
		}
	}
	
	/* Animation */
	if( this.grounded ) {
		if( this.states.cooldown <= Game.DELTASECOND * 0.5 ) {
			var anim_progress = 1.0 - (this.states.cooldown / (Game.DELTASECOND * 0.5));
			if( anim_progress < 0.55 ) { this.frame_row = 0; this.frame = 1; }
			else if( anim_progress < 0.7 ) { this.frame_row = 0; this.frame = 2; }
			else if( anim_progress < 0.85 ) { this.frame_row = 0; this.frame = 3; }
			else { this.frame_row = 1; this.frame = 0; }
		} else {
			this.frame_row = this.frame = 0;
		}
	} else {
		this.frame_row = 1;
		if( Math.abs( this.force.y ) > 1.0 ) {
			this.frame = this.force.y > 0 ? 3 : 1;
		} else {
			this.frame = 2;
		}
	}
}

 /* platformer\enemy_igbo.js*/ 

Igbo.prototype = new GameObject();
Igbo.prototype.constructor = GameObject;
function Igbo(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 46;
	this.sprite = sprites.igbo;
	this.speed = 0.3;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"backup" : 1
	}
	
	this.attack_warm = Game.DELTASECOND * 2.5;
	this.attack_time = Game.DELTASECOND * 1.5;
	this.attack_rest = Game.DELTASECOND * 1.4;
	
	this.guard.active = true;
	this.guard.x = 20;
	this.guard.y = 0;
	this.guard.w = 16;
	this.guard.h = 46;	
	
	this.life = dataManager.life(8);
	this.damage = dataManager.damage(4);
	this.collideDamage = dataManager.damage(2);
	this.mass = 3.0;
	this.friction = 0.3;
	this.inviciple_time = this.stun_time;
	
	this.cooldown_time = Game.DELTASECOND * 1.6;
	
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		this.states.cooldown -= 20;
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,40);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Igbo.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack <= 0 ) {
			var direction = 1;
			
			if( this.position.x - this.start_x > 48 ) this.states.backup = -1;
			if( this.position.x - this.start_x < -48 ) this.states.backup = 1;
			
			var direction = this.states.backup;
			if( Math.abs( dir.x ) < 32 ) direction = dir.x > 0 ? 1 : -1;
			
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
		
		if( Math.abs( dir.x ) < 32 && this.states.attack <= 0 ) {
			//this.states.attack = this.attack_time;
			//this.states.attack_down = true;
		}
		
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 48 ){
			this.states.attack_down = false;
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if ( this.states.attack > this.attack_rest && this.states.attack < this.attack_time ){
			var range = this.states.attack_down ? 20 : 35;
			this.strike(new Line(
				new Point( 10, (this.states.attack_down ? 0: 0) ),
				new Point( range, (this.states.attack_down ? 8 : 24) ) )
			);
		}
		
		this.guard.active = this.states.attack <= 0 || this.states.attack > this.attack_time;
	}
	
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = 0;
		if( this.states.attack <= this.attack_time ) this.frame = 1;
		if( this.states.attack <= this.attack_rest ) this.frame = 2;
		this.frame_row = (this.states.attack_down ? 2 : 1);
	} else {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3;
		} else {
			this.frame = 0;
		}
		this.frame_row = 0;
	}
}

Igbo.prototype.render = function(g,c){
	//Shield
	var _f = this.frame;
	var _fr = this.frame_row;
	
	this.frame = 1;
	this.frame_row = 3;
	if( this.guard.active ) this.frame = 0;
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Body
	this.frame = _f;
	this.frame_row = _fr;
	GameObject.prototype.render.apply(this, [g,c]);
}


 /* platformer\enemy_knight.js*/ 

Knight.prototype = new GameObject();
Knight.prototype.constructor = GameObject;
function Knight(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.knight;
	this.speed = 0.4;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND * 3.0,
		"combo_cooldown" : 0.0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guardUpdate" : 0.0,
		"backup" : 0
	}
	
	this.attack_warm = 24.0;
	this.attack_time = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 6;
	
	this.life = dataManager.life(7);
	this.damage = dataManager.damage(3);
	this.collideDamage = dataManager.damage(1);
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	this.xp_award = 18;
	this.money_award = 8;
	
	this.level = 1 + Math.floor( dataManager.currentTemple / 3 );
	this.fr_offset = 0;
	this.cooldown_time = Game.DELTASECOND * 2.4;
	
	if( this.level == 2 ){
		this.life = dataManager.life(8);
		this.damage = dataManager.damage(4);
		this.fr_offset = 3;
		this.cooldown_time = Game.DELTASECOND * 2.0;
		this.attack_warm = 22.0;
		this.attack_time = 6.5;
		this.attack_rest = 3.0;
		this.speed = 0.42;
		this.thrust_power = 8;
		this.death_time = Game.DELTASECOND * 2;
		this.xp_award = 39;
		this.money_award = 12;
	} else if ( this.level >= 3 ) {
		this.life = dataManager.life(10);
		this.damage = dataManager.damage(5);
		this.fr_offset = 6;
		this.cooldown_time = Game.DELTASECOND * 1.8;
		this.attack_warm = 20.0;
		this.attack_time = 6.5;
		this.attack_rest = 3.0;
		this.speed = 0.45;
		this.thrust_power = 10;
		this.death_time = Game.DELTASECOND * 3;
		this.xp_award = 57;
		this.money_award = 24;
	}
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		if( Math.random() > 0.2 ) {
			this.states.guardUpdate = Game.DELTASECOND * 2.0;
			this.states.guard = _player.states.duck ? 1 : 2;
		}
	});
	this.on("death", function(){
		Item.drop(this,this.money_award);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Knight.prototype.update = function(){	
	//this.sprite = sprites.knight;
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active /*&& this.states.attack <= 0*/ ) {
			var direction = 1;
			if( Math.abs(_player.position.x - this.start_x ) < 128 ){
				//Player in the attack area, advance at player
				direction = dir.x > 0 ? -1.0 : 1.0;
				direction *= (Math.abs(dir.x) > 20 ? 1.0 : -1.0);
			} else {
				direction = this.position.x - this.start_x > 0 ? -1.0 : 1.0;
			} 
			
			//if( this.position.x - this.start_x > 64 ) this.states.backup = -1;
			//if( this.position.x - this.start_x < -64 ) this.states.backup = 1;
			
			this.force.x += direction * this.delta * this.speed;
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 40 ){
			if( Math.random() > 0.6 ) {
				//Pick a random area to attack
				this.states.attack_down = Math.random() > 0.5;
			} else {
				//Aim for the player's weak side
				this.states.attack_down = !_player.states.duck;
			}
			
			this.states.attack = this.attack_warm;
			this.states.cooldown = this.cooldown_time;
		}
		
		if( this.states.guardUpdate < 0 && this.states.attack < 0 ){
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guardUpdate = Game.DELTASECOND * 0.3;
		}
		if( this.states.attack <= 0 ) this.states.attack_counter = 0;
			
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ){
			if( this.states.attack_counter == 0 ){
				audio.play("swing");
				this.states.attack_counter = 1;
				this.force.x += (dir.x > 0 ? -1 : 1) * this.thrust_power;
			}
			this.strike(new Line(
				new Point( 10, (this.states.attack_down ? 8 : -8) ),
				new Point( 29, (this.states.attack_down ? 8 : -8)+4 )
			) );
		}
	}
	/* guard */
	this.guard.active = this.states.guard > 0;
	this.guard.y = this.states.guard == 1 ? 6 : -5;
	this.guard.x = 12;
	
	/* counters */
	this.states.attack -= this.delta;
	this.states.guardUpdate -= this.delta;
	
	/* Animation */
	if( this.states.attack > 0 ) {
		this.frame = 0;
		if ( this.states.attack <= this.attack_time && this.states.attack > this.attack_rest ) this.frame = 1;
		this.frame_row = this.fr_offset + (this.states.attack_down == 1 ? 2 : 1);
	} else {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.frame = Math.max( (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3, 0 );
		} else {
			this.frame = 0;
		}
		this.frame_row = this.fr_offset;
	}
}
Knight.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		this.sprite.render( g, 
			new Point(this.position.x - c.x, this.position.y - c.y), 
			(this.states.guard > 1 ? 3 : 4 ), this.fr_offset, this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
}

 /* platformer\enemy_laughing.js*/ 

Laughing.prototype = new GameObject();
Laughing.prototype.constructor = GameObject;
function Laughing(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = dataManager.damage(2);
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.sprite = sprites.laughing;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 0.225;
	this.frame = 0;
	this.frame_row = 0;
	this.life = dataManager.life(0);
	this.gravity = 0.0;
	this.friction = 0.08;
	
	this.cooldown = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			
		} else if ( obj.hasModule(mod_combat) ) {
			var dif = this.position.subtract( obj.position ).normalize();
			this.force.x += dif.x * this.speed * this.delta;
			this.force.y += dif.y * this.speed * this.delta;
		}
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Laughing.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.stun <= 0 ) {
		this.flip = dir.x > 0;
		
		var gotopos = this.position;
		
		if( this.cooldown <= 0 ) {
			gotopos = new Point(
				_player.position.x,
				_player.position.y
			);
			if( this.cooldown < -Game.DELTASECOND * 2){
				this.cooldown = Game.DELTASECOND * 3
			}
		} else {
			//Hover around the player
			gotopos = new Point(
				_player.position.x + (this.flip?1:-1) * 96,
				_player.position.y - 56
			);
			this.strike( new Line(-8,-4,8,4) );
		}
		
		this.cooldown -= this.delta;
		var direction = gotopos.subtract(this.position).normalize();
		this.force.x += direction.x * this.delta * this.speed;
		this.force.y += direction.y * this.delta * this.speed;
	}
	
	//Animation
	this.frame = (this.frame + this.delta * 0.2 ) % 3;
}

 /* platformer\enemy_lilghost.js*/ 

LilGhost.prototype = new GameObject();
LilGhost.prototype.constructor = GameObject;
function LilGhost(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.sprite = sprites.lilghost;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.start = new Point(x,y);
	this.speed = 0.25;
	this.frame = 0;
	this.frame_row = 0;
	this.life = 1;
	this.gravity = 0.0;
	this.friction = 0.1;
	this.mass = 0.3;
	this.maxForce = 2.0;
	
	this.force.y = this.maxForce;
	
	this.on("struck", EnemyStruck);
	
	this.on("wakeup", function(){
		this.life = 1;
		this.dead = false;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	
	this.on("death", function(){
		this.gravity = 1.0;
	});
}

LilGhost.prototype.update = function(){
	
	if( this.life > 0 && this.stun <= 0 ) {
		if( this.position.y > this.start.y ) {
			this.gravity = -0.25;
		} else { 
			this.gravity = 0.25;
		}
		
		if( this.position.x < this.start.x - 8 ) {
			this.force.x += this.speed * this.delta;
		}
		if( this.position.x > this.start.x + 8 ) {
			this.force.x -= this.speed * this.delta;
		}
		this.force.y = Math.max(Math.min(this.force.y,this.maxForce),-this.maxForce);
	}
	
	if( this.life <= 0 ) {
		this.frame_row = 1;
		this.frame = this.force.y > 0.1 ? 0 : 1;
	} else { 
		this.frame_row = 0;
		this.frame = 0;
		
		if( this.force.y > 0.5 ) this.frame = 2;
		if( this.force.y < -0.5 ) this.frame = 1;
	}
}

LilGhost.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if( this.life > 0 ) {
		Background.pushLight( this.position.subtract(c), 100 );
	}
}

 /* platformer\enemy_malphas.js*/ 

Malphas.prototype = new GameObject();
Malphas.prototype.constructor = GameObject;
function Malphas(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.malphas;
	this.speed = 0.3;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.life = dataManager.life(6);
	
	this.states = {
		"active" : false,
		"direction" : -1,
		"combo_timer" : Game.DELTASECOND * 2,
		"cooldown" : 0,
		"combo" : 0,
		"attack" : 0
	}
	this.attack_time = Game.DELTASECOND * 0.6;
	
	this.damage = dataManager.damage(4);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.cooldown -= 10;
		this.states.active = true
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Malphas.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 64 ) this.states.active = true;
	
	if( this.stun <= 0 && this.states.active ) {
		if( this.states.combo > 0 ) {
			//Attack
			this.states.attack -= this.delta;
			this.states.combo -= this.delta;
			this.criticalChance = 1.0;
			if( this.states.attack <= 0 ) {
				this.states.attack_low = Math.random() < 0.75 ? !this.states.attack_low : this.states.attack_low;
				this.states.attack = this.attack_time;
			}
			if( this.states.combo <= 0 ) {
				//End combo
				this.states.cooldown = Game.DELTASECOND * 2;
				this.states.combo_timer = Game.DELTASECOND * 4;
				this.states.attack_low = false;
				this.criticalChance = 0.0;
			}
			this.force.x += (dir.x > 0 ? -1 : 1) * this.delta * this.speed * 0.3;
		} else if ( this.states.cooldown > 0 ) {
			//Do nothing, recover
			this.states.cooldown -= this.delta;
		} else { 
			//Move
			if( (this.position.x - this.start_x) < -48 ) this.states.direction = 1;
			if( (this.position.x - this.start_x) > 48 ) this.states.direction = -1;
			
			this.force.x += this.states.direction * this.delta * this.speed;
			this.states.combo_timer -= this.delta;
			
			if( this.states.combo_timer <= 0 && Math.abs(dir.x) < 48 ) {
				this.states.combo = this.attack_time * (4 + Math.floor(Math.random()*4));
			}
			this.strike( new Line(0,-12,32,-8) );
		}
		this.flip = dir.x > 0;
		
		if( this.states.attack > this.attack_time * 0.333 && this.states.attack < this.attack_time * 0.6666 ) {
			this.strike( new Line(
				0, this.states.attack_low ? 8 : -12,
				32, this.states.attack_low ? 12 : -8
			) );
		}
	}
	
	if(!this.states.active || this.states.cooldown > 0) {
		this.frame = 0;
		this.frame_row = 0;
	} else {
		if( this.states.combo > 0 ) {
			this.frame_row = this.states.attack_low ? 3 : 2;
			this.frame = 2 - Math.min( Math.floor( 3 * (this.states.attack / this.attack_time) ), 2 );
		} else {
			this.frame_row = 1;
			this.frame = (this.frame+(this.delta*0.2*Math.abs(this.force.x))) % 3;
		}
	}
	
}

 /* platformer\enemy_malsum.js*/ 

Malsum.prototype = new GameObject();
Malsum.prototype.constructor = GameObject;
function Malsum(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = sprites.bear;
	this.speed = 0.3;
	
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.life = dataManager.life(4);
	
	this.states = {
		"direction" : -1,
	}
	
	this.damage = dataManager.damage(1);
	this.collideDamage = dataManager.damage(3);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Malsum.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.stun <= 0 ) {
		if( this.position.x - this.start_x < -48 ) this.states.direction = 1;
		if( this.position.x - this.start_x > 48 ) this.states.direction = -1;
		
		this.force.x += this.states.direction * this.delta * this.speed;
	}
	
	this.frame = 0;
	this.frame_row = 0;
}

 /* platformer\enemy_oriax.js*/ 

Oriax.prototype = new GameObject();
Oriax.prototype.constructor = GameObject;
function Oriax(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	
	this.speed = 0.1;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.life =  dataManager.life(8);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.0;
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 1;
	
	SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : 0,
		"thrown" : false,
		"backup" : false,
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 45,
		"release" : 25
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 && this.life > 0 ) {
		if( this.states.attack < 0 ){
			var direction = (this.flip ? -1 : 1) * (this.states.backup ? -1 : 1);
			this.force.x += this.speed * this.delta * direction;
		}
		this.flip = dir.x > 0;
		if( Math.abs(dir.x) < 32 ) this.states.backup = true;
		if( Math.abs(dir.x) > 104 ) this.states.backup = false;
		
		if( this.states.cooldown < 0 ){
			this.states.attack = this.attack.warm;
			this.states.cooldown = 60;
			this.states.attack_lower = Math.random() > 0.5;
		}
		
		if( this.states.attack > 0 ){
			if( this.states.attack < this.attack.release && !this.states.thrown ){
				this.states.thrown = true;
				var missle;
				if( this.states.attack_lower ) {
					missle = new SnakeBullet(this.position.x, this.position.y+8, (this.flip?-1:1) );
				} else {
					missle = new SnakeBullet(this.position.x, this.position.y-8, (this.flip?-1:1) );
				}
				game.addObject( missle ); 
				this.criticalChance = 1.0;
			}
		} else {
			this.states.thrown = false;
			this.criticalChance = 0.0;
		}
		
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
	}
	
	/* Animate */
	if( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else {
		if( this.states.attack > 0 ) {
			this.frame = this.states.attack > this.attack.release ? 0 : 1;
			this.frame += this.states.attack_lower ? 2 : 0;
			this.frame_row = 1;
		} else {
			this.frame = Math.max(this.frame + this.delta * Math.abs(this.force.x) * 0.3, 1 ) % 4;
			if( Math.abs( this.force.x ) < 0.1 ) this.frame = 0;
			this.frame_row = 0;
		}
	}
}

 /* platformer\enemy_ratgut.js*/ 

Ratgut.prototype = new GameObject();
Ratgut.prototype.constructor = GameObject;
function Ratgut(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.ratgut;
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 5,
		"attack" : 0,
		"runaway" : 0,
		"move_cycle" : 0,
		"direction" : 1
	}
	
	this.life = dataManager.life(2);
	this.mass = 1.2;
	this.collideDamage = dataManager.damage(4);
	this.damage = dataManager.damage(6);
	this.stun_time = Game.DELTASECOND;
	this.attackEffects.poison = [1.0,30.0];
	
	this.attack_release = Game.DELTASECOND * 1.2;
	this.attack_time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			//obj.hurt( this, this.collideDamage );
			
			//this.states.cooldown = Game.DELTASECOND * 3;
			//this.states.runaway = Game.DELTASECOND * 1.5;
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.runaway = Game.DELTASECOND * 1.5;
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Ratgut.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.attack > 0 ) {
			//Do nothing
			this.states.attack -= this.delta;
		} else if( this.states.cooldown <= 0 ){
			//Charge at player
			this.flip = dir.x > 0;
			this.force.x += this.delta * this.speed * (this.flip?-1:1);
			this.states.runaway = Game.DELTASECOND * 1.5;
			if( Math.abs( dir.x ) < 64 ) {
				//Attack player
				this.states.attack = Game.DELTASECOND * 2;
				this.force.x = (this.flip ? -1 : 1) * 7;
				this.force.y = -3;
				this.states.cooldown = Game.DELTASECOND * 5;
			}
			this.strike( new Line(-8,-16,8,16) );
		} else {
			//wander
			if( this.states.runaway > 0 ) {
				this.flip = dir.x < 0;
				this.force.x += this.delta * this.speed * (this.flip?-1:1);
				this.states.runaway -= this.delta;
			} else {
				if( this.states.move_cycle > Game.DELTASECOND * 0.5 ) {
					this.flip = this.states.direction < 0;
					this.force.x += this.delta * 0.5 * this.speed * (this.flip?-1:1);
				} else {
					this.force.x = 0;
				}
				
				if( this.states.move_cycle <= 0 ){
					this.states.direction = Math.random() > 0.5 ? -1 : 1;
					this.states.move_cycle = Game.DELTASECOND * 1.0;
				}
				this.states.cooldown -= this.delta;
			}
		}
	} 
	
	this.friction = this.grounded ? 0.1 : 0.02;
	this.gravity = this.states.attack > 0 ? 0.2 : 1.0;
	this.criticleChance = this.grounded ? 0.0 : 1.0;
	
	if( this.states.attack > 0 ){
		this.frame_row = 2;
		this.frame = this.grounded ? 2 : 1;
	} else {
		if( Math.abs( this.force.x ) < 0.1 ){
			this.frame = this.frame_row = 0;
		} else {
			this.frame = (this.frame + (this.delta * 0.2  * Math.abs(this.force.x))) % 3;
			this.frame_row = 1;
		}
	}
}

 /* platformer\enemy_sentry.js*/ 

Sentry.prototype = new GameObject();
Sentry.prototype.constructor = GameObject;
function Sentry(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	
	this.speed = 0.0;
	this.sprite = sprites.chaz;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	this.calculateXP();
	
	this.life = dataManager.life(3);
	this.damage = dataManager.damage(3);
	this.mass = 1.3;
	
	this.states = {
		"cooldown" : 33,
		"attack" : 0,
		"bullet" : 0,
		"attack_lower" : true
	};
	this.attack = {
		"warm" : Game.DELTASECOND * 3.5,
		"release" : Game.DELTASECOND * 3.0
	};
}
Sentry.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.stun < 0 ) {
		if( this.states.cooldown <= 0 ) {
			if( this.states.attack <= 0 ) {
				this.states.cooldown = Game.DELTASECOND;
			} else if( this.states.attack <= this.attack.release ) {
				if( this.states.attack <= this.states.bullet ) {
					this.states.bullet = this.states.attack - Game.DELTASECOND * 0.25;
					var direction = this.flip ? -1 : 1;
					var bullet = new Bullet(this.position.x, this.position.y, direction);
					bullet.team = this.team;
					bullet.position.y += this.states.attack_lower ? 10 : -8;
					bullet.damage = this.damage;
					bullet.knockbackScale = 5;
					game.addObject(bullet);
				}
			}
			this.states.attack -= this.delta;
		} else {
			this.states.cooldown -= this.delta;
			this.flip = dir.x > 0;
			if( this.states.cooldown <= 0 ) {
				this.states.attack_lower = !this.states.attack_lower;
				this.states.bullet = this.states.attack = this.attack.warm;
			}
		}
	}
	
	/* Animate */
	this.frame_row = 4;
	if( this.states.attack > 0 && this.states.attack <= this.attack.release ) {
		this.frame = (this.frame + this.delta * 0.5) % 2;
	} else {
		this.frame = 0;
	}
}

 /* platformer\enemy_shell.js*/ 

Shell.prototype = new GameObject();
Shell.prototype.constructor = GameObject;
function Shell(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	
	this.speed = 0.5;
	this.sprite = sprites.shell;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1
	}
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			//obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.states.direction *= -1;
		this.force.x = 0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(1);
	this.collisionReduction = -1.0;
	this.friction = 0.2;
	this.stun_time = Game.DELTASECOND * 0.75;
	this.invincible_time = 30.0;
	this.damage = dataManager.damage(2);
	
	this.mass = 1.0;
	this.gravity = 1.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Shell.prototype.update = function(){
	this.frame = (this.frame + Math.abs(this.force.x) * this.delta * 0.2) % 4;
	if( this.stun < 0 ) {
		this.force.x += this.speed * this.delta * this.states.direction;
		this.flip = this.force.x < 0;
		
		//Stop at edges
		if( game.getTile( 
			16 * this.states.direction + this.position.x, 
			this.position.y + 16, game.tileCollideLayer) == 0 
		){
			//Turn around, don't fall off the edge
			this.force.x = 0;
			this.states.direction *= -1.0;
		}
	} else {
		this.force.x = this.force.y = 0;
	}
	
	this.strike( new Line(-8,-4,8,4) );
}

 /* platformer\enemy_shooter.js*/ 

Shooter.prototype = new GameObject();
Shooter.prototype.constructor = GameObject;
function Shooter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.collideDamage = dataManager.damage(2);
	this.damage = dataManager.damage(2);
	this.team = 0;
	this.start_x = x;
	this.sprite = sprites.shooter;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.life = 1;
	this.gravity = 0.5;
	this.friction = 0.2;
	
	this.bullet_y_pos = [-16,0,18];
	this.cooldown = Game.DELTASECOND;
	this.death_time = Game.DELTASECOND;
	this.max_distance = 360;
	
	this.aim_direction = 0;
	
	this.parts = {
		"body" : new Point(),
		"wing" : new Point(-16,0),
		"neck1" : new Point(),
		"neck2" : new Point(),
		"neck3" : new Point(),
		"head" : new Point(32,0)
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 128 ) {
		this.flip = dir.x > 0;
		if( Math.abs( dir.x ) < 112 ) {
			if( this.flip ) {
				//Move to the right
				if( this.position.x - this.start_x < this.max_distance ) {
					this.force.x += this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			} else {
				//Move to the left
				if( this.position.x - this.start_x > -this.max_distance ) {
					this.force.x -= this.delta * this.speed;
				} else {
					//Move up
					this.force.y -= this.delta * this.speed;
				}
			}
		} 
		
		//Attack
		if( this.cooldown <= 0 ) {
			//Fire
			var direction = this.flip ? 1 : -1;
			this.cooldown = Game.DELTASECOND * 0.6;
			var y = this.bullet_y_pos[ this.aim_direction ];
			var bullet = new Bullet(
				this.position.x,
				this.position.y + y, 
				-direction
			);
			bullet.damage = this.damage;
			game.addObject( bullet );
			
			//Choose next direction
			this.aim_direction = Math.floor( Math.random() * this.bullet_y_pos.length);
		}
		this.cooldown -= this.delta;
	} else if ( Math.abs( this.position.x - this.start_x ) < this.max_distance ){
		this.flip = dir.x > 0;
		var direction = this.flip ? -1 : 1;
		this.force.x += this.delta * this.speed * direction;
	}
	
	//Animation
	this.frame = (this.frame + this.delta * 0.1) % 3;
	
	//Move head position
	var head_y = this.bullet_y_pos[ this.aim_direction ];
	this.parts.head.y = Math.lerp(this.parts.head.y, head_y, this.delta * 0.1);
	var stem = new Point(8,-16);
	this.parts.neck1 = Point.lerp(stem, this.parts.head, 0.666);
	this.parts.neck2 = Point.lerp(stem, this.parts.neck1, 0.666);
	this.parts.neck3 = Point.lerp(stem, this.parts.neck2, 0.5);
}
Shooter.prototype.render = function(g,c){
	for(var i in this.parts ) {
		var pos = new Point(this.parts[i].x, this.parts[i].y);
		var f = 0; var fr = 0;
		if( i == "head" ) {
			f = 0; fr = 0;
		} else if ( i == "body" ){
			f = 0; fr = 1;
		} else if ( i == "wing" ){
			f = this.frame; fr = 2;
			if( f < 1 ) { 
				pos.y -= 48;
			} else if( f < 2 ) { 
				pos.y -= 8;
			} else {
				pos.y -= 32;
			}
		} else {
			f = 2; fr = 0;
		}
		if( this.flip ){
			pos.x *= -1;
		}
		this.sprite.render(g,this.position.add(pos).subtract(c),f,fr, this.flip, this.filter);
	}
}
Shooter.prototype.idle = function(){}

 /* platformer\enemy_skeleton.js*/ 

Skeleton.prototype = new GameObject();
Skeleton.prototype.constructor = GameObject;
function Skeleton(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = sprites.skele;
	this.speed = .3;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND,
		"block_down" : false,
		"attack_down" : false,
		"prep_jump" : false
	}
	
	this.guard.active = true;
	
	this.attacktimes = {
		"warm" : 30.0,
		"release" : 14.0,
		"rest" : 10.0
	};
	this.attack_warm = 30.0;
	this.attack_time = 10.0;
	
	this.life = dataManager.life(5);
	this.mass = 0.8;
	this.damage = dataManager.damage(3);
	this.collideDamage = dataManager.damage(1);
	this.stun_time = 0;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ){
			if( !this.grounded && this.position.y < obj.position.y ) 
				obj.hurt( this, this.damage );
			//else 
			//	obj.hurt( this, this.collideDamage );
		}
	});
	this.on("collideHorizontal", function(x){
		this.states.prep_jump = true;
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if(this.team == obj.team) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		//this.states.attack = -1.0;
		//this.states.cooldown = 30.0;
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Skeleton.prototype.update = function(){	
	this.sprite = sprites.skele;
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.active = this.active || Math.abs( dir.x ) < 120;
		
		if( this.active ) {
			if( this.states.attack <= 0 ) {
				var direction = (dir.x > 0 ? -1.0 : 1.0) * (Math.abs(dir.x) > 24 ? 1.0 : -1.0);
				this.force.x += direction * this.delta * this.speed;
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				
				if( this.states.prep_jump && this.grounded ) {
					this.force.y = -10.0;
					this.states.prep_jump = false;
				}
			} else {
				this.force.x = 0;
			}
		}
	
		if( this.states.cooldown < 0 && Math.abs(dir.x) < 64 ){
			this.states.attack = this.attacktimes.warm;
			this.states.cooldown = Game.DELTASECOND;
		}
		
		if ( this.states.attack > this.attacktimes.rest && this.states.attack <= this.attacktimes.release ){
			this.strike(new Line(
				new Point( 12, -6 ),
				new Point( 24, -10 )
			) );
		}
	}
	/* counters */
	this.states.attack -= this.delta;
	
	/* Animation */
	if ( this.stun > 0 ) {
		this.frame = 0;
		this.frame_row = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame = 0;
			if( this.states.attack <= this.attacktimes.release ) this.frame = 1;
			if( this.states.attack <= this.attacktimes.rest ) this.frame = 2;
			this.frame_row = 1
		} else if( !this.grounded ) {
			this.frame = 3;
			this.frame_row = 1;
		} else {
			this.frame_row = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = (this.frame + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4;
			}
		}
	}
}
Skeleton.prototype.render = function(g,c){
	this.sprite.render(g,this.position.subtract(c),4,0,this.flip);
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\enemy_snakebullet.js*/ 

SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	this.origin.y = 0.7;
	
	this.speed = 0.2;
	this.sprite = sprites.oriax;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.states.landed && obj instanceof Oriax ){
			this.trigger("death");
		}
	});
	this.on("collideVertical", function(dir){
		if( !this.states.landed ){
			this.states.landed = true;
			this.flip = !this.flip;
		}
	});
	this.on("hurt_other",function(obj, damage){
		this.trigger("death");
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	this.flip = d < 0;
	this.force.x = d * 8;
	this.life = dataManager.life(0);
	this.collideDamage = dataManager.damage(1);
	this.damage = dataManager.damage(2);
	this.pushable = false;
	this.mass = 0.0;
	this.gravity = 0.1;
	
	this.states = {
		"landed" : false,
		"life" : 200
	}
}
SnakeBullet.prototype.update = function(){
	this.frame = Math.max( (this.frame + this.delta * 0.2) % 4, 2);
	this.frame_row = 2;
	this.friction = this.grounded ? 0.2 : 0.05;
	
	this.states.life -= this.delta;
	
	if( this.stun < 0 && this.states.landed && this.states.dieOnTouch ) {
		this.gravity = 1.0;
		var direction = (this.flip ? -1 : 1);
		this.force.x += this.speed * this.delta * direction;
	}
	
	this.strike( new Line(-8,-4,8,4) );
	
	if( this.states.life < 0 ){
		this.trigger("death");
	}
}

 /* platformer\enemy_svarog.js*/ 

Svarog.prototype = new GameObject();
Svarog.prototype.constructor = GameObject;
function Svarog(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 40;
	
	this.speed = 2.5;
	this.sprite = sprites.svarog;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			//obj.hurt( this, this.damage );
			//this.force.x *= -1;
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
		this.force.x = dir.x > 0 ? -this.speed : this.speed; 
	});
	
	this.life = dataManager.life(1);
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.collideDamage = dataManager.damage(1);
	this.damage = dataManager.damage(2);
	
	this.states = {
		"cooldown" : 0
	};
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Svarog.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 3;
	this.frame_row = 0;
	this.flip = this.force.x < 0;
	
	var dir = this.position.subtract(_player.position);
	this.force.y += ( dir.y > -56 ? -.2 : .2 ) * this.delta;
	
	if( this.states.cooldown <= 0 ) {
		this.states.cooldown = Game.DELTASECOND * 1.0;
		var fire = new Fire(this.position.x, this.position.y);
		fire.team = this.team;
		fire.damage = this.damage;
		game.addObject(fire);
	}
	this.states.cooldown -= this.delta;
}

 /* platformer\enemy_yakseyo.js*/ 

Yakseyo.prototype = new GameObject();
Yakseyo.prototype.constructor = GameObject;
function Yakseyo(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 14;
	this.sprite = sprites.yakseyo;
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"phase" : 0,
		"attack" : -1,
		"cooldown" : 0,
		"smoke_timer" : 0
	};
	
	this.life = dataManager.life(10);
	this.damage = dataManager.damage(4);
	this.collideDamage = dataManager.damage(1);
	this.mass = 1.0;
	this.inviciple_time = this.stun_time;
	this.pushable = false;
	
	this.on("collideVertical", function(dir){
		if( dir < 0 ) {
			this.states.phase = 0;
			this.states.active = true;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj instanceof Player ) {
			if(this.states.phase == 2) {
				if( this.states.attack > 0 ) 
					obj.hurt( this, this.damage );
				else
					obj.hurt( this, this.collideDamage );
			}
			if( this.states.phase == 0 ) {
				this.states.phase = 1;
				this.states.cooldown = Game.DELTASECOND * .5;
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,24);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	SpecialEnemy(this);
	this.calculateXP();
}
Yakseyo.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if( this.states.phase == 0 ) {
		//Find target
		var direction = dir.x > 0 ? -1 : 1;
		this.force.x += direction * this.speed * this.delta;
		this.states.smoke_timer -= this.delta;
		this.visible = false;
		if(this.states.smoke_timer <= 0 ){
			game.addObject(new EffectSmoke(this.position.x, this.position.y));
			this.states.smoke_timer = Game.DELTASECOND * 0.25;
		}
		this.height = 14;
	} else if ( this.states.phase == 1 ) {
		//Wait for attack
		if( this.states.cooldown <= 0 ) {
			this.states.attack = 4;
			this.states.cooldown = Game.DELTASECOND * 2;
			this.states.phase = 2;
		}
		this.visible = false;
		this.states.cooldown -= this.delta;
		this.height = 14;
	} else if ( this.states.phase == 2 ) {
		//Attack and wait
		if( this.states.cooldown <= 0 ) this.states.phase = 0;
		this.states.attack -= this.delta;
		this.states.cooldown -= this.delta;
		this.frame = this.states.attack > 0 ? 0 : 1;
		this.visible = true;
		this.height = 32;
	}
}

 /* platformer\enemy_yeti.js*/ 

Yeti.prototype = new GameObject();
Yeti.prototype.constructor = GameObject;
function Yeti(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = sprites.yeti;
	this.speed = 0.1;
	this.origin.y = 0.45;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND,
		"attack" : 0,
		"attack_type" : 0,
		"attack_release" : false
	};
	
	this.life = dataManager.life(6);
	this.mass = 2.2;
	this.collideDamage = dataManager.damage(2);
	this.damage = dataManager.damage(4);
	this.stun_time = 0;
	
	this.attack_release = Game.DELTASECOND * 1.2;
	this.attack_time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			//obj.hurt( this, this.collideDamage );
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	SpecialEnemy(this);
	this.calculateXP();
}
Yeti.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ){
			if( !this.states.attack_release && this.states.attack < this.attack_release ) {
				this.states.attack_release = true;
				this.criticalChance = 0.0;
				if( this.states.attack_type > 0 ) {
					//missle
					var y_offset = this.states.attack_type == 1 ? 4 : 17;
					bullet = new Bullet(this.position.x, this.position.y+y_offset, (this.flip?-1:1));
					bullet.blockable = true;
					bullet.attackEffects.slow[0] = 1.0;
					bullet.team = this.team;
					bullet.damage = this.damage;
					game.addObject(bullet);
				} else {
					//Area of effect
					for(var i=0; i < 2; i++ ) {
						bullet = new Bullet(this.position.x, this.position.y+16, (i==0?-0.5:0.5));
						bullet.blockable = false;
						bullet.attackEffects.slow[0] = 1.0;
						bullet.team = this.team;
						bullet.damage = this.damage;
						bullet.frame_row = 2;
						bullet.frames = [4,5,6];
						bullet.range = 64;
						bullet.effect = EffectIce;
						game.addObject(bullet);
					}
				}
			}
			this.states.attack -= this.delta;
			if( this.states.attack <= 0 ) this.states.cooldown = Game.DELTASECOND * 1.5;
		} else {
			if(Math.abs(dir.x) > 32) this.force.x += this.delta * this.speed * (dir.x>0?-1:1);
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ) {
				this.states.attack = this.attack_time;
				this.states.attack_type = Math.abs( dir.x ) < 64 ? 0 : (Math.random() > .5 ? 1 : 2);
				this.states.attack_release = false;
				this.criticalChance = 1.0;
			}
		}
	} 
	
	if( this.states.attack > 0 ){
		if( this.states.attack_type == 0 ) { this.frame = 0; this.frame_row = 2; }
		if( this.states.attack_type == 1 ) { this.frame = 0; this.frame_row = 1; }
		if( this.states.attack_type == 2 ) { this.frame = 2; this.frame_row = 1; }
		if( this.states.attack < this.attack_release ) this.frame++;
	} else {
		this.frame = (this.frame + (this.delta * 0.2  * Math.abs(this.force.x))) % 3;
		this.frame_row = 0;
	}
}

 /* platformer\exit.js*/ 

Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y,t,o){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 16;
	this.height = 240;
	
	var options = o || {};
	this.visible = false;
	this.offset = new Point();
	
	if("direction" in options){
		if( options.direction == "e" ) this.offset.x += 16;
		if( options.direction == "w" ) this.offset.x -= 16;
		if( options.direction == "s" ) this.offset.y += 16;
		if( options.direction == "n" ) this.offset.y -= 16;
	}
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			window._world.player.x += this.offset.x;
			window._world.player.y += this.offset.y;
			window._world.trigger("activate");
		}
	});
}
Exit.prototype.idle = function(){}

 /* platformer\gate.js*/ 

//transform

Gate.prototype = new GameObject();
Gate.prototype.constructor = GameObject;
function Gate(x,y,d,ops){
	x -= 8;
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = sprites.gate;
	this.open = false;
	this.progress = 0;
	
	this.addModule( mod_combat );
	
	this.on("struck", function(obj,pos,damage){
		if(this.team == obj.team) return;
		if( damage >= this.minDamage ) {
			this.unlock();
		} else {
			var dir = this.position.subtract(obj.position);
			audio.playLock("block",0.25);
		}
	});
	
	this.lock = function(){
		this.open = false;
		for(var i=0; i<this.tiles.length; i++){
			game.setTile(this.tiles[i], game.tileCollideLayer, BLANK_TILE);
		}
	};
	this.unlock = function(){
		if( !this.open ) {
			this.open = true;
			audio.play("open");
			for(var i=0; i<this.tiles.length; i++){
				game.setTile(this.tiles[i], game.tileCollideLayer, 0);
			}
		}
	};
	
	this.tiles = [
		new Point(x-8, y-24),
		new Point(x-8, y-8),
		new Point(x-8, y+8),
		new Point(x+8, y-24),
		new Point(x+8, y-8),
		new Point(x+8, y+8)
	];
	
	this.minDamage = 0;
	this.lock();
	
	ops = ops || {};
	if( "min_damage" in ops ) this.minDamage = ops.min_damage;
}
Gate.prototype.update = function(){
	var increment = this.delta / (Game.DELTASECOND*0.5);
	if( this.open ) {
		this.progress = Math.min( this.progress + increment, 1.0 );
	} else { 
		this.progress = Math.max( this.progress - increment, 0.0 );
	}
	this.frame = Math.floor(Math.min(this.progress*5,4));
}

 /* platformer\healer.js*/ 

Healer.prototype = new GameObject();
Healer.prototype.constructor = GameObject;
function Healer(x,y,n,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.characters;
	this.width = 16;
	this.height = 32;
	this.zIndex = 5;
	this.life = 1;
	
	this.frame = 3;
	this.frame_row = 3;
	this.frame_start = 3;
	
	//Type 0: Mana Recovery
	//Type 1: Life Recovery
	//Type 2: Item upgrade
	this.type = 0;
	this.price = 0;
	this.cursor = 0;
	
	options = options || {};
	if("price" in options ) this.price = options.price-0;
	if("type" in options ) this.type = options.type-0;
	this.currency = this.type == 2 ? "waystones" : "money";
	
	this.on("open",function(obj){
		game.pause = true;
		this.cursor = 0;
		audio.playLock("pause",0.3);
	});
	this.message = [	
		"Let me bless you, weary traveller, so I may restore your spirit.",
		"You can stay here and rest.",
		"I can improve that weapon. Add +\v1 for #%PRICE%. Interested?"
	];
	this.addModule(mod_rigidbody);
	this.addModule(mod_talk);
	this.friction = 0.9;
	this.mass = 0;
	this.pushable = false;
}
Healer.prototype.update = function(g,c){
	var dir = this.position.subtract(_player.position);
	this.flip = dir.x > 0;
	
	if( this.type == 2 && "level" in _player.equip_sword)
		this.price = Math.floor( 2 * Math.pow(_player.equip_sword.level, 1.5) );
	
	
	if( this.open > 0 ) {
		if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 ) {
				if( this.price <= _player[this.currency] ) {
					if( this.type == 0 ){ 
						_player.manaHeal = Number.MAX_VALUE;
						audio.play("item1");
					} else if ( this.type == 1 ){
						game.addObject(new Dream(0,0,0));
						if( this.cursor == 0 ) _player.life = _player.lifeMax;
					} else if ( this.type == 2 ){
						_player.equip_sword.bonus_att++;
						_player.equip_sword.level++;
						_player.equip_sword.filter = "gold";
						_player.levelUp(-1);
						audio.play("item1");
					}
					_player[this.currency] -= this.price;
					this.close();
					game.pause = false;
				} else {
					//Cannot afford it
					audio.play("negative");
				}
			} else {
				//Player selected no
				this.close();
				game.pause = false;
			}
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.close();
			game.pause = false;
		}
	}
	this.frame = Math.max((this.frame + this.delta * 0.1) % this.frame_start+3, this.frame_start);
}
Healer.prototype.postrender = function(g,c){	
	if( this.open > 0 ) {
		boxArea(g,16,48,224,64);
		textArea(g,this.message[this.type].replace("%PRICE%",this.price),32,64,192,64);
		
		boxArea(g,16,120,64,56);
		textArea(g," Yes",32,136);
		textArea(g," No",32,152);
		
		sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
	}
}

 /* platformer\i18n.js*/ 

window.language = "english";
window._messages = {
	"intro_text" : {
		"english" : "A distant war has torn the land to pieces. Forced from their homes your people search for a new land to settle far away from the conflict. Though peace reigns so too does poverty. To save your new homeland you journey to the castles of the mysterious Beast Lords who want for nothing to take what you need for your people to survive.",
		"engrish" : "Distant war has hurt the land. The people will search for their home to a new land is safe from a distance dispute. Look out for poverty. In the castle of a mysterious Beast Lords take what is necessary for what is needed to survive. You will save the new home."
	},
	"introduction" : {
		"english" : "Intro",
		"engrish" : "Learning"
	},
	"new_game" : {
		"english" : "New game",
		"engrish" : "Game new"
	},
	"press_start" : {
		"english" : "Press start",
		"engrish" : "Start button"
	},
	"introduction_help" : {
		"english" : "See how this story began.",
		"engrish" : "You will learn How to play. Please enjoy to the story of origin."
	},
	"start_help" : {
		"english" : "Enter the world of Beast Lords. Beware, death will end the game.",
		"engrish" : "Play the game. Please note, death is permanent."
	},
	"templenames" : {
		"english" : ["Anahilt Fortress","The Gardens of Benburb", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"],
		"engrish" : ["Anahilt Fortress","Benburb Gardens", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"]
	},
	"mayor_intro" : {
		"english" : [
			"Hello. I'm the Mayor of our town. Life is hard here.",
			"If we all work together we can make this a better place to live.",
			"Truth is... I have no idea what I'm doing.",
			"You look like a smart guy, maybe you can help.",
			"If you speak to me you can assign people to different projects",
			"Projects will cost money, the chancellor handles that."
		],
		"engrish" : [
			"Hello. My name is mayor.",
			"Help me this town better.",
			"I know nothing.",
			"You are smart.",
			"Press people to other construction.",
			"Donate to make the construction into a new with chancellor."
		]
	},
	"chancellor_howmuch" :{
		"english" : "How much would you like to donate?",
		"engrish" : "Money is of no object.",
	},
	"chancellor_intro" : {
		"english" : [
			"I'm the chancellor of this town. I manage the money.",
			"It turns out I don't manage it very well at all.",
			"Say, you wouldn't want to donate a little to our good town?",
			"I promise, every single penny will go to good projects!"
		],
		"engrish" : [
			"My name is Chancellor. I make good with the money.",
			"The money is trouble.",
			"You can donate your money to the town through me.",
			"I'll spend your money correctly.",
			"Press people to other construction.",
			"Donate to make the construction into a new with my assistant."
		]
	},
	"builder0" : {
		"english" : "We're just just gettin' started on this one, buddy.",
		"engrish" : "Play the game. Please note, death is permanent."
	},
	"builder1" : {
		"english" : "It's lookin' good. We'll be done in no time.",
		"engrish" : "The structure is half way complete."
	},
	"builder2" : {
		"english" : "We're nearly done building this one, buddy.",
		"engrish" : "We will complete this structure in short time."
	},
	"building_names" : {
		"english" : {
			"hall" : "Town hall",
			"mine" : "Gold mine",
			"lab" : "Wizard laboratory",
			"hunter" : "Hunter's shack",
			"mill" : "Wheat mill",
			"library" : "Library",
			"inn" : "Halfway house",
			"farm" : "Farm",
			"smith" : "Black smith",
			"bank" : "Bank"
		},
		"engrish" : {
			"hall" : "Town hall",
			"mine" : "Mine",
			"lab" : "Laboratory",
			"hunter" : "Bounty",
			"mill" : "Mill",
			"library" : "Library",
			"inn" : "Inn",
			"farm" : "Farm",
			"smith" : "Black smith",
			"bank" : "Bank"
		}
	},
	"quest_names" : {
		"english" : {
			"q1" : "The lost Egg",
			"q2" : "Quest 2"
		},
		"engrish" : {
			"q1" : "The lost Egg",
			"q2" : "Quest 2"
		}
	}
	
};
function i18n(name,replace){
	replace = replace || {};
	var out = "";
	if( name in window._messages ){
		if( window.language in window._messages[name] ){
			out = window._messages[name][window.language];
		}else {
			for(var i in window._messages[name]){
				out = window._messages[name][i];
				break;
			}
		}
	}
	for(var i in replace){
		out = out.replace(i, replace[i]);
	}
	return out;
}

 /* platformer\item.js*/ 

Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	this.sleep = null;
	
	this.glowing = false;
	this.glow = 0.0;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 0.25;
	this.enchantChance = 0.8;
	
	ops = ops || {};	
	if( name != undefined ) {
		this.setName( name );
	}
	if( "enchantChance" in ops ) this.enchantChance = ops["this.enchantChance"];
	if( "name" in ops ) this.setName( ops.name );
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 20; obj.heal += 20; }
			if( this.name == "life_small" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 20; }
			if( this.name == "mana_small" ) { if(obj.mana >= obj.manaMax) return; obj.manaHeal = 3; audio.play("gulp"); }
			if( this.name == "money_bag" ) { obj.money += Math.floor(30*(1+dataManager.currentTemple*0.33)); audio.play("pickup1"); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			
			if( this.isWeapon ) {
				obj.equip(this, obj.equip_shield);
				audio.play("equip");
			}
			
			if( this.isShield ) {
				if( obj.equip_sword instanceof Item && obj.equip_sword.twoHanded ) {
					//Cant equip shield with a two handed weapon
					return false;
				}
				obj.equip(obj.equip_sword, this); 
				audio.play("equip");
			}
			
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			//Enchanted items
			if( this.name == "intro_item") { obj.stats.attack+=3; game.addObject(new SceneTransform(obj.position.x, obj.position.y)); obj.sprite = sprites.player; audio.play("levelup"); }
			
			
			if( this.name == "seed_oriax") { obj.stats.attack+=1; this.pickupEffect(); }
			if( this.name == "seed_bear") { obj.stats.defence+=1; this.pickupEffect(); }
			if( this.name == "seed_malphas") { obj.stats.technique+=1; this.pickupEffect(); }
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; this.pickupEffect(); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; this.pickupEffect(); }
			if( this.name == "seed_minotaur") { 
				obj.on("collideObject", function(obj){ 
					if( this.team != obj.team && obj.hurt instanceof Function && Math.abs(this.force.x) > 4) {
						this.force.x *= -0.5;
						obj.hurt( this, Math.ceil(this.damage/2) ); 
					}
				});
				this.pickupEffect();
			}
			if( this.name == "seed_plaguerat") { 
				obj.attackEffects.poison[0] = 1.0; 
				obj.life_steal += 0.2
				obj.on("added",function(){ this.addEffect("poison", 1.0, Game.DELTAYEAR);}); 
				this.pickupEffect();
			}
			if( this.name == "seed_marquis") { obj.stun_time = 0; this.pickupEffect(); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "seed_chort") { obj.lifeMax += 20; obj.heal += 20; obj.stats.defence+=1; this.pickupEffect(); }
			if( this.name == "seed_poseidon") { obj.stats.attack+=1; obj.stats.defence+=1; obj.stats.technique+=1; this.pickupEffect(); }
			if( this.name == "seed_tails") { obj.on("money", function(v){this.life = Math.min(this.lifeMax, this.life+v);}); this.pickupEffect(); }
			if( this.name == "seed_mair") { obj.stats.attack=Math.max(obj.stats.attack-1,1); obj.stats.defence=Math.max(obj.stats.defence-1,1); obj.stats.technique+=4; this.pickupEffect(); }
			if( this.name == "seed_igbo") { obj.stats.defence+=3; this.pickupEffect(); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "haft") { obj.criticalMultiplier += 2.0; this.pickupEffect(); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; this.pickupEffect(); }
			if( this.name == "fangs") { obj.life_steal += 0.1; this.pickupEffect(); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("gulp"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; this.pickupEffect(); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); this.pickupEffect(); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; this.pickupEffect(); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; this.pickupEffect(); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; this.pickupEffect(); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; this.pickupEffect(); }
			if( this.name == "chort_nose") { obj.waystone_bonus *= 2.0; this.pickupEffect(); }
			if( this.name == "plague_mask") { obj.statusEffects.poison=0; obj.statusResistance.poison = 1.0; this.pickupEffect(); }
			if( this.name == "spiked_shield") { obj.on("block", function(o,p,d){ if(o.hurt instanceof Function) o.hurt(this,Math.floor(d/2)); }); this.pickupEffect(); }
			if( this.name == "black_heart") { obj.stats.attack+=1; obj.stats.defence+=2; obj.stats.technique+=1; obj.lifeMax -= 20; obj.life = Math.min(obj.lifeMax,obj.life); this.pickupEffect(); }
			if( this.name == "treasure_map") { game.getObject(PauseMenu).revealMap(2); audio.play("pickup1"); }
			if( this.name == "life_fruit") { obj.lifeMax += 20; obj.heal = 9999; audio.play("gulp"); }
			if( this.name == "mana_fruit") { obj.manaMax += 2; obj.manaHeal = 999; audio.play("gulp"); }
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			
			dataManager.itemGet(this.name);
			
			if( "equip" in obj ){
				obj.equip();
			}
			
			var pm = game.getObject(PauseMenu);
			if( pm != null && this.message != undefined ) {
				pm.message( this.getMessage() );
			}
			this.interactive = false;
			this.destroy();
		}
	});
}
Item.prototype.pickupEffect = function(){
	game.addObject(new EffectItemPickup(
		_player.position.x, 
		_player.position.y
	));
}
Item.prototype.setName = function(n){
	this.name = n;
	
	//Equipment
	if(n == "short_sword") { 
		this.frame = 0; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":12, "sprite":sprites.sword1 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "long_sword") { 
		this.frame = 1; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":11,"rest":8.0,"range":18, "sprite":sprites.sword2 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "broad_sword") { 
		this.frame = 3; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":18, "sprite":sprites.sword2 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "spear") { 
		this.frame = 2; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":21.5, "strike":17.5,"rest":12.0,"range":27, "sprite":sprites.sword3 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "warhammer") { 
		this.frame = 6; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = true;
		this.level=1; this.bonus_att=5; 
		this.stats = {"warm":24.5, "strike":15.5,"rest":12.0,"range":27, "sprite":sprites.sword4 };
		this.message = Item.weaponDescription;
		if( dataManager.currentTemple >= 0 ) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "small_shield") { 
		this.frame = 0; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.0,"guardlife":30,"height":11, "frame":0, "frame_row":0}
		return; 
	}
	if(n == "large_shield") { 
		this.frame = 1; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":16, "frame":0, "frame_row":1}
		return; 
	}
	if(n == "kite_shield") { 
		this.frame = 2; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":0, "frame_row":2}
		return; 
	}
	if(n == "broad_shield") { 
		this.frame = 3; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.4,"guardlife":50,"height":18, "frame":0, "frame_row":3}
		return; 
	}
	if(n == "knight_shield") { 
		this.frame = 4; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":17, "frame":2, "frame_row":0}
		return; 
	}
	if(n == "spiked_shield") { 
		this.frame = 5; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":2, "frame_row":1}
		return; 
	}
	if(n == "heavy_shield") { 
		this.frame = 6; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.2,"guardlife":60,"height":17, "frame":2, "frame_row":2}
		return; 
	}
	if(n == "tower_shield") { 
		this.frame = 7; this.frame_row = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.5,"guardlife":70,"height":30, "frame":2, "frame_row":3}
		return; 
	}
	
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; this.message = "Map\nReveals unexplored areas on the map."; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "mana_small") { this.frame = 4; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "money_bag") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame_row = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame = 13; this.frame_row = 0; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.0; return; }
	
	//Charms
	if( this.name == "charm_sword") { this.frame = 0; this.frame_row = 8; this.message = "Sword Charm\nEnchanted attack.";}
	if( this.name == "charm_mana") { 
		this.frame = 1; 
		this.frame_row = 8;
		this.message = "Mana Charm\nLarger supply of mana.";
		this.on("equip",function(){ 
			_player.manaMax += 3;
			_player.mana += 3;
		});
		this.on("unequip",function(){
			_player.manaMax = Math.max(_player.manaMax-3,0);
			_player.mana = Math.max(_player.mana-3,0);
		});
	}
	if( this.name == "charm_alchemist") { this.frame = 2; this.frame_row = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame = 3; this.frame_row = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame = 4; this.frame_row = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame = 5; this.frame_row = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame = 6; this.frame_row = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame = 7; this.frame_row = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	
	//All items below this point glow!
	this.glowing=true;
		
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	if( this.name == "intro_item") { this.frame = 0; this.frame_row = 4; this.message = "Mysterious drink.";}
	
	if( this.name == "seed_oriax") { this.frame = 0; this.frame_row = 4; this.message = "Oriax Seed\nAttack up.";}
	if( this.name == "seed_bear") { this.frame = 1; this.frame_row = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame = 2; this.frame_row = 4; this.message = "Malphas Seed\nTechnique up.";}
	if( this.name == "seed_cryptid") { this.frame = 3; this.frame_row = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame = 4; this.frame_row = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame = 5; this.frame_row = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame = 6; this.frame_row = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame = 7; this.frame_row = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame = 8; this.frame_row = 4; this.message = "Batty Seed\nYou can fly.";}
	if( this.name == "seed_chort") { this.frame = 9; this.frame_row = 4; this.message = "Chort Seed\nYour body is a tank.";}
	if( this.name == "seed_poseidon") { this.frame = 10; this.frame_row = 4; this.message = "Poseidon Seed\nAll attributes up.";}
	if( this.name == "seed_tails") { this.frame = 11; this.frame_row = 4; this.message = "Tails Seed\nGold runs in your veins.";}
	if( this.name == "seed_mair") { this.frame = 12; this.frame_row = 4; this.message = "Mair Seed\nTrades attack and defence for technique.";}
	if( this.name == "seed_igbo") { this.frame = 13; this.frame_row = 4; this.message = "Igbo Seed\nDefence very up.";}
	
	if( this.name == "pedila") { this.frame = 0; this.frame_row = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame = 2; this.frame_row = 5; this.message = "Haft\nIncreased critical damage.";}
	if( this.name == "zacchaeus_stick") { this.frame = 3; this.frame_row = 5; this.message = "Zacchaeus'\nMore money.";}
	if( this.name == "fangs") { this.frame = 4; this.frame_row = 5; this.message = "Fangs\nLife steal.";}
	if( this.name == "passion_fruit") { this.frame = 5; this.frame_row = 5; this.message = "Passion Fruit\nFull restoration.";}
	if( this.name == "shield_metal") { this.frame = 6; this.frame_row = 5; this.message = "Shield Metal\nCurrent shield improved.";}
	if( this.name == "magic_gem") { this.frame = 7; this.frame_row = 5; this.message = "Magic Gem\nEnchanted attack.";}
	if( this.name == "snake_head") { this.frame = 8; this.frame_row = 5; this.message = "Snake Head\nAdds poison chance to attack.";}
	if( this.name == "broken_banana") { this.frame = 9; this.frame_row = 5; this.message = "Broken Banana\nWeakens enemies.";}
	if( this.name == "blood_letter") { this.frame = 10; this.frame_row = 5; this.message = "Blood letter\nAdds bleed chance to attack.";}
	if( this.name == "red_cape") { this.frame = 11; this.frame_row = 5; this.message = "Red cape\nAdds rage chance to attack.";}
	if( this.name == "chort_nose") { this.frame = 12; this.frame_row = 5; this.message = "Chort Nose\nSniffs out Waystones.";}
	if( this.name == "plague_mask") { this.frame = 13; this.frame_row = 5; this.message = "Plague Mask\nImmune to poison.";}
	if( this.name == "spiked_shield") { this.frame = 14; this.frame_row = 5; this.message = "Spiked Shield\nInflicts damage on attackers.";}
	if( this.name == "black_heart") { this.frame = 15; this.frame_row = 5; this.message = "Black Heart\nLess life, more attributes.";}
	if( this.name == "treasure_map") { this.frame = 0; this.frame_row = 6; this.message = "Treasure Map\nReveals secrets areas on map.";}
	if( this.name == "life_fruit") { this.frame = 1; this.frame_row = 6; this.message = "Life fruit\nLife up.";}
	if( this.name == "mana_fruit") { this.frame = 2; this.frame_row = 6; this.message = "Mana fruit\nMana up.";}
}
Item.prototype.getMessage = function(){
	if( "message" in this ) {
		if( this.message instanceof Function){
			return this.message();
		} else {
			return this.message;
		}
	} else {
		return this.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); })
	}
}
Item.prototype.update = function(){
	if( this.sleep != null ){
		this.sleep -= this.delta;
		this.interactive = this.sleep <= 0;
		if(this.sleep > 0 ){
			this.visible = !this.visible;
		} else {
			this.visible = true;
		}
	}
	if( this.frames.length > 0 ) {
		this.animation_frame = (this.animation_frame + this.delta * this.animation_speed) % this.frames.length;
		this.frame = this.frames[ Math.floor( this.animation_frame ) ];
		this.flip = this.frame < 0;
		this.frame = Math.abs(this.frame);
	}
}

Item.prototype.render = function(g,c){
	if( !this.glowing ) {
		GameObject.prototype.render.apply(this,[g,c]);
	} else {
		this.glow += this.delta * 0.05;
		
		var a = (1.0 + Math.sin(this.glow)) * 0.5;
		var o = new Point(0, (a-0.5) * 2);
		
		this.sprite.render(g, 
			this.position.subtract(c).add(o), 
			this.frame, 
			this.frame_row,
			false,
			"item",
			{"u_color":[0.8,0.1,1.0,a]}
		);
	}
}

Item.drop = function(obj,money,sleep){
	var money_only = obj.hasModule(mod_boss);
	if(Math.random() > (_player.life / _player.lifeMax) && !money_only){
		var item = new Item( obj.position.x, obj.position.y, "life_small" );
		if( sleep != undefined ) item.sleep = sleep;
		game.addObject( item );
	} else {
		var bonus = _player.money_bonus || 1.0;
		//money = money == undefined ? (Math.max(dataManager.currentTemple*2,0)+(2+Math.random()*4)) : money;
		money = money == undefined ? (1+Math.random()*3) : money;
		money = Math.floor( money * bonus );
		while(money > 0){
			var coin;
			var off = new Point((Math.random()-.5)*8,(Math.random()-.5)*8);
			if(money > 40){
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_3" );
				money -= 10;
			} else if( money > 10 ) {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_2" );
				money -= 5;
			} else {
				coin = new Item( obj.position.x+off.x, obj.position.y+off.y, "coin_1" );
				money -= 1;
			}
			coin.force.y -= 5.0;
			if( sleep != undefined ) coin.sleep = sleep;
			game.addObject(coin);
		}
		if (Math.random() < _player.waystone_bonus && !money_only) {
			var item = new Item( obj.position.x, obj.position.y, "waystone" );
			if( sleep != undefined ) item.sleep = sleep;
			game.addObject( item );
		}
	}
}

Item.weaponDescription = function(){
	var out = "";
	var att = this.bonus_att || 0;
	var def = this.bonus_def || 0;
	if( "weaponProperties" in this ){
		if("prefix" in this.weaponProperties) out += this.weaponProperties.prefix + " ";
		if("title" in this.weaponProperties) out += this.weaponProperties.title + " ";
		if("suffix" in this.weaponProperties) out += this.weaponProperties.suffix;
		out += "\n\v" + att + " ";
		if( def > 0 ) out += "\b" + def;
		out += "\n";
		
		if("props" in this.weaponProperties){
			for(var i=0; i < this.weaponProperties.props.length && i < 2; i++){
				out += this.weaponProperties.props[i] + "\n";
			}
		}
	} else { 
		out += this.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); })
		out += "\n\v" + att + " ";
		if( def > 0 ) out += "\n\b" + def;
		out += "\n";
	}
	return out;
}
Item.enchantWeapon = function(weapon){
	if(!("weaponProperties" in weapon)){
		weapon.message = Item.weaponDescription;
		weapon.weaponProperties = {
			"prefix" : "",
			"title" : weapon.name.replace("_", " ").replace(/(^|\s)(.)/g, function($1) { return $1.toUpperCase(); }),
			"suffix" : "",
			"props" : []
		};
	}
	
	
	var enchantments = {
		"lifesteal":{"prefix":"Bloody","suffix":"of Blood","rarity":0.1,"description":"Life steal"},
		"sharp":{"prefix":"Sharp","suffix":"of Sharpness","rarity":2.0},
		"deadly":{"prefix":"Deadly","suffix":"of Death","rarity":1.3},
		"cruel":{"prefix":"Cruel","suffix":"of Cruelty","rarity":0.9},
		"savage":{"prefix":"Savage","suffix":"of Savagery","rarity":0.5},
		"phantom":{"prefix":"Phantom","suffix":"of Phantom","rarity":0.01,"description":"Ignores shields"},
		"swiftness":{"prefix":"Swift","suffix":"of Swiftness","rarity":0.5},
		"wise":{"prefix":"Wise","suffix":"of Wisdom","rarity":0.3,"description":"Increased Mana"},
		"slayer":{"prefix":"Slayer's","suffix":"of Slaying","rarity":0.2},
		"guard":{"prefix":"Guardian's","suffix":"of the guardian","rarity":0.5},
		"poison":{"prefix":"Poisonous","suffix":"of Poison","rarity":0.2,"description":"Poison chance"},
		"slow":{"prefix":"Frozen","suffix":"of Frost","rarity":0.2,"description":"Freeze chance"},
		"weakness":{"prefix":"Weakening","suffix":"of Weakness","rarity":0.2,"description":"Weakness chance"}
	};
	var total=0; for(var i in enchantments) total += enchantments[i].rarity;
	roll = Math.random() * total;
	
	var i = "sharp";
	var enchantment = enchantments[i];
	
	for(i in enchantments){
		if(roll <= enchantments[i].rarity){
			enchantment = enchantments[i];
			break;
		} else {
			roll -= enchantments[i].rarity;
		}
	}
	
	if(i=="lifesteal"){
		weapon.level += 3;
		weapon.on("equip",function(player){ player.life_steal += 0.1; } );
		weapon.on("unequip",function(player){ player.life_steal -= 0.1; } );
	} else if(i=="sharp"){
		weapon.bonus_att += 1;
		weapon.level += 1;
	} else if(i=="deadly"){
		weapon.bonus_att += 2;
		weapon.level += 1;
	} else if(i=="cruel"){
		weapon.bonus_att += 3;
		weapon.level += 1;
	} else if(i=="savage"){
		weapon.bonus_att += 4;
		weapon.level += 1;
	} else if(i=="phantom"){
		weapon.level += 5;
		weapon.ignore_shields = true;
	} else if(i=="swiftness"){
		var hold = weapon.stats.strike - weapon.stats.rest;
		weapon.stats.warm = Math.max(weapon.stats.warm*0.75, hold);
		weapon.stats.strike = Math.max(weapon.stats.strike*0.75, hold);
		weapon.stats.rest = Math.max(weapon.stats.rest*0.75, 0);
		weapon.level += 1;
	} else if(i=="wise"){
		weapon.on("equip",function(player){ player.manaMax += 2; } );
		weapon.on("unequip",function(player){ player.manaMax -= 2; player.mana = Math.min(player.mana, player.manaMax); } );
		weapon.level += 1;
	} else if(i=="slayer"){
		weapon.bonus_att += 1;
		weapon.level += 1;
	} else if(i=="guard"){
		weapon.bonus_def = weapon.bonus_def || 0;
		weapon.bonus_def += 2;
		weapon.level += 1;
	} else if(i=="poison"){
		weapon.on("equip",function(player){ player.attackEffects.poison[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.poison[0] -= 0.2; } );
		weapon.level += 2;
	} else if(i=="slow"){
		weapon.on("equip",function(player){ player.attackEffects.slow[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.slow[0] -= 0.2; } );
		weapon.level += 3;
	} else if(i=="weakness"){
		weapon.on("equip",function(player){ player.attackEffects.weaken[0] += 0.2; } );
		weapon.on("unequip",function(player){ player.attackEffects.weaken[0] -= 0.2; } );
		weapon.level += 1;
	}
	
	if(weapon.weaponProperties.prefix == ""){
		weapon.weaponProperties.prefix = enchantment.prefix;
	} else if(weapon.weaponProperties.suffix == ""){
		weapon.weaponProperties.suffix = enchantment.suffix;
		weapon.suffix = enchantment.suffix
	}
	if("description" in enchantment){
		weapon.weaponProperties.props.push( enchantment.description );
	}
	
	weapon.filter = "gold";
}

 /* platformer\lamp.js*/ 

Lamp.prototype = new GameObject();
Lamp.prototype.constructor = GameObject;
function Lamp(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = sprites.lamps;
	this.zIndex = -21;
	
	this.frame = 0;
	this.frame_row = 0;
}
Lamp.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.3) % 4;
}
Lamp.prototype.render = function(g,c){	
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), 180 );
}

 /* platformer\lift.js*/ 

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y,d,ops){
	this.constructor();
	this.start_x = x + 8;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	this.sprite = game.tileSprite;
	
	this.onboard = false;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = true;
			obj.position.y = this.position.y;
			obj.checkpoint = this.position;
			obj.trigger( "collideVertical", 1);
			this.position.x = this.start_x;
		} else if ( obj instanceof Lift && this.awake ) {
			obj.awake = false;
			obj.visible = false;
			obj.interactive = false;
		}
	});
	
	this.pushable = false;
	this.gravity = 0.0;
	
	ops = ops || {};
	this.trackPlayer = !("rest" in ops);
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 200 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard ) {
		this.trackPlayer = true;
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		if( this.trackPlayer ) {
			var speed = Math.min(Math.max(goto_y - this.position.y,-4.5),4.5);
			this.force.y = speed;
		}
	}
	
	this.onboard = false;
}
Lift.prototype.render = function(g,c){
	for(var x=0; x < 2; x++ ) for(var y=0; y < 3; y++ ) {
		this.sprite.render(g,
			new Point( x*16 + -16 + this.position.x - c.x, y*16 + -24 + this.position.y - c.y ),
			x, y+13
		);
	}
	
}

 /* platformer\mapdebug.js*/ 

MapDebug.prototype = new GameObject();
MapDebug.prototype.constructor = GameObject;
function MapDebug(x,y){
	this.slice = 0;
	this.offset = new Point(-104,-96);
}
MapDebug.prototype.update = function(){
	if( input.state("up") == 1) this.offset.y -= 8;
	if( input.state("down") == 1) this.offset.y += 8;
	if( input.state("left") == 1) this.offset.x -= 8;
	if( input.state("right") == 1) this.offset.x += 8;
	
	if( input.state("fire") == 1) this.slice--;
	if( input.state("jump") == 1) this.slice++;
}
MapDebug.prototype.render = function(g,c){
	try {
		var size = new Point(8,8);
		
		var slice = dataManager.slices[this.slice].data;
		for(var i in slice ){
			if( slice[i].room != -1 ) {
				var pos = MapSlice.idToLoc(i);
				for(var w=0; w < slice[i].width; w++) for(var h=0; h < slice[i].height; h++) {
					var pos = MapSlice.idToLoc(i);
					var tileY = 0;
					if( h > 0) tileY += 8;
					if( h >= slice[i].height-1) tileY += 4;
					if( w > 0) tileY += 2;
					if( w < slice[i].width-1) tileY += 1;
					var mpos = pos.add(new Point(w,h)).scale(8).subtract(this.offset);
					sprites.map.render(g,mpos,0,tileY);
				}
			}
		}
	} catch (err) {}
}
MapDebug.prototype.idle = function(){}

 /* platformer\mayor.js*/ 

Mayor.prototype = new GameObject();
Mayor.prototype.constructor = GameObject;
function Mayor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y+8;
	this.sprite = sprites.characters2;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("mayor_intro");
	this.text_progress = 0;
	this.cursor = 0;
	this.peopleFree = 0;
	
	this.projects = {};
	this.projectCount = 0;
	this.fetchProjects();
	
	this.on("open", function(){
		game.pause = true;
		audio.play("pause")
	});
	this.on("close", function(){
		game.pause = false;
		audio.play("unpause")
	});
}

Mayor.prototype.fetchProjects = function(){
	this.projects = {};
	this.projectCount = 0;
	
	if( window._world instanceof WorldMap ) {
		this.peopleFree = window._world.town.people;
		
		for(var i in window._world.town.buildings ){
			var building = window._world.town.buildings[i];
			this.peopleFree -= building.people;
			
			if( building.complete && Mayor.ongoingProjects.indexOf(i) >= 0 ){
				this.projects[i] = building;
				this.projectCount++;
			} else if ( !building.complete && building.unlocked ) {
				this.projects[i] = building;
				this.projectCount++;
			}
		}
	}
}

Mayor.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 4;
	
	if( this.open ) {
		game.pause = true;
		if( Mayor.disabled ) {
			if( input.state("fire") == 1 || input.state("pause") == 1 || input.state("jump") == 1 ) {
				this.close();
			}
		} else if( Mayor.introduction ) {
			if( input.state("fire") == 1 ) {
				this.text_progress++;
				if( this.text_progress >= this.text.length){
					this.close();
					Mayor.introduction = false;
				}
			}
		} else { 
			var selected = null;
			var j = 0;
			for(var i in this.projects ) {
				if( j == this.cursor ) {
					selected = this.projects[i]; break;
				}
				j++
			}
			if( input.state("pause") == 1 || input.state("jump") == 1 ) {
				this.close();
			}
			if( input.state("up") == 1 ) {
				this.cursor = Math.max(this.cursor-1, 0);
				audio.play("cursor")
			}
			if( input.state("down") == 1 ) {
				this.cursor = Math.min(this.cursor+1, this.projectCount-1);
				audio.play("cursor")
			}
			if( selected ) {
				if( input.state("left") == 1 && selected.people > 0) {
					selected.people--;
					this.peopleFree++;
					audio.play("cursor")
				}
				if( input.state("right") == 1 && this.peopleFree > 0) {
					selected.people++;
					this.peopleFree--;
					audio.play("cursor")
				}
			}
		}
	}
}

Mayor.prototype.postrender = function(g,c){
	if( this.open ) {
		if( Mayor.disabled ) {
			renderDialog(g, "Sorry, you cannot build your town in this demo.");
		} else if( Mayor.introduction ) {
			renderDialog(g, this.text[this.text_progress]);
		} else {
			var left = game.resolution.x / 2 - 128;
			boxArea(g, left-16, 8, 256+32, 224);
			textArea(g, "$"+_world.town.money, left, 24);
			textArea(g, "People: "+ this.peopleFree, left, 36);
			
			var j = 0;
			for(var i in this.projects ) {
				//List projects
				var name = i18n("building_names")[i];
				
				textArea(g, name, left+16, j*12+56);
				textArea(g, "People: "+ this.projects[i].people, left+160, j*12+56);
				j++;
			}
			//Draw cursor
			textArea(g, "@", left, this.cursor*12+56);
		}
	}
}


Mayor.ongoingProjects = ["farm", "mine"];
Mayor.introduction = true;
Mayor.disabled = true;

 /* platformer\menu_item.js*/ 

ItemMenu.prototype = new GameObject();
ItemMenu.prototype.constructor = GameObject;
function ItemMenu(unlocks){
	this.constructor();
	this.sprite = sprites.items;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.progress = 0;
	
	game.pause = true;
	
	this.unlocks = unlocks || [];
	this.complete = this.unlocks.length <= 0;
	
	this.burst = null;
	this.burstProgress = 999;
	this.scrollProgress = 1;
	
	if( !this.complete ){
		this.burst = this.itemPosition( this.unlocks.peek() );
		this.scrollProgress = 0;
	}
	
	this.scroll = new Point(0,0);
}
ItemMenu.prototype.idle = function(){}
ItemMenu.prototype.update = function(){
	this.burstProgress += game.deltaUnscaled / Game.DELTASECOND;
	
	if( this.scrollProgress < 1.0 ) {
		var scrollTo = this.burst.y - 120;
		this.scroll.y = Math.lerp(this.scroll.y, scrollTo, this.scrollProgress);
		this.scrollProgress += game.deltaUnscaled / (Game.DELTASECOND*0.5);
	} else if( this.complete ) {
		if( (input.state("pause") == 1 || input.state("jump") == 1 ) && this.complete) {
			game.pause = false;
			this.destroy();
		} else if( input.state("up") > 0 ) {
			this.scroll.y -= game.deltaUnscaled * 3.0;
		} else if ( input.state("down") > 0 ) {
			this.scroll.y += game.deltaUnscaled * 3.0;
		}
	} else {
		this.progress += game.deltaUnscaled / Game.DELTASECOND;
		
		if( this.progress >= 1 ) {
			audio.play("spell");
			this.burstProgress = 0;
			this.burst = this.itemPosition(this.unlocks.pop()).add(new Point(12,12));
			
			if( this.unlocks.length > 0 ) {
				this.progress = 0;
				this.scrollProgress = 0;
			} else { 
				this.complete = true;
			}
		}
	}
}
ItemMenu.prototype.itemPosition = function(name){
	var columnWidth = 6;
	var index = 0;
	for(var i=0; i < dataManager.treasures.length; i++) 
		if( dataManager.treasures[i].name == name )
			index = i;
		
	var colmpos = (index % columnWidth);
	var x = 16 + colmpos * 40;
	var y = 24 + Math.floor(index / columnWidth) * 40;
	return new Point(x,y);
}
ItemMenu.prototype.postrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
	
	g.color = [0.0,0.3,0.4,1.0];
	g.scaleFillRect(xpos,0,256,240);
	
	var columnWidth = 6;
	var scrollHeight = Math.max( 
		Math.ceil( (dataManager.treasures.length+1) / columnWidth ) * 40 - (240-24), 0 
	);
	
	this.scroll.y = Math.min(Math.max(this.scroll.y,0), scrollHeight);
	
	textArea(g,"Unlocked Items", xpos+72+this.scroll.x,8-this.scroll.y);
	
	for(var i=0; i < dataManager.treasures.length; i++) {
		var name = dataManager.treasures[i].name;
		
		switch(dataManager.treasures[i].unlocked * 1) {
			case 1 : g.color = [0.8,0.6,0.9,1.0]; break;
			case 2 : g.color = [1.0,1.0,1.0,1.0]; break;
			default : g.color = [0.2,0.1,0.6,1.0]; break;
		}
		
		var colmpos = (i % columnWidth);
		var x = 16 + colmpos * 40;
		var y = 24 + Math.floor(i / columnWidth) * 40;
		var pos = new Point(xpos+x+12,y+12);
		g.scaleFillRect(xpos+x,y-this.scroll.y,24,24);
		
		if( dataManager.treasures[i].unlocked > 0 && this.unlocks.indexOf(name) < 0  ){
			Item.prototype.setName.apply(this, [ name ] );
			this.sprite.render(g,pos.subtract(this.scroll),this.frame, this.frame_row);
		} else {
			this.sprite.render(g,pos.subtract(this.scroll),12, 0);
		}
	}
	
	if( this.burst instanceof Point && this.burstProgress <= 1.0 ) {
		//Animation
		var radius = this.burstProgress * 48;
		var points = 16;
		for(var j=0; j < points; j++){
			var angle = (j/points) * Math.PI * 2;
			var p = new Point(xpos+radius*Math.sin(angle),radius*Math.cos(angle));
			sprites.bullets.render(g,p.add(this.burst).subtract(this.scroll),2,2);
		}
	}
}

 /* platformer\menu_pause.js*/ 

PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.pageCount = 5;
	this.cursor = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
	this.message_text = false;
	this.message_time = 0;
}
PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){	
	if( this.open ) {
		game.pause = true;
		this.message_time = 0;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				if( window._world instanceof WorldMap ) {
					_world.trigger("reset");
				} else {
					game.clearAll();
					game.addObject(new TitleMenu());
				}
				return;
			}
		} else if( this.page == 0 ) {
			//Option page
			
			if( input.state("up") == 1 ) { this.cursor-=1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=1; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, 3), 0 );
			
			if( input.state("fire") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.fullscreen(!game.isFullscreen());
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) audio.sfxVolume.gain.value = Math.min(audio.sfxVolume.gain.value+0.1,1);
				if(this.cursor == 3 ) audio.musVolume.gain.value = Math.min(audio.musVolume.gain.value+0.1,1);
				
				localStorage.setItem("sfxvolume",audio.sfxVolume.gain.value);
				localStorage.setItem("musvolume",audio.musVolume.gain.value);
			} else if( input.state("jump") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.fullscreen(!game.isFullscreen());
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) audio.sfxVolume.gain.value = Math.max(audio.sfxVolume.gain.value-0.1,0);
				if(this.cursor == 3 ) audio.musVolume.gain.value = Math.max(audio.musVolume.gain.value-0.1,0);
				
				localStorage.setItem("sfxvolume",audio.sfxVolume.gain.value);
				localStorage.setItem("musvolume",audio.musVolume.gain.value);
			}
		} else if( this.page == 1 ) {
			//Map page
			if( input.state("fire") ) {
				if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
				if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }
			}

		} else if( this.page == 2 ){
			//attributes page
			if( _player.stat_points > 0 ) {
				if( input.state("up") == 1 ) { this.stat_cursor -= 1; audio.play("cursor"); }
				if( input.state("down") == 1 ) { this.stat_cursor += 1; audio.play("cursor"); }
				this.stat_cursor = Math.max( Math.min( this.stat_cursor, Object.keys(_player.stats).length-1 ), 0 );
				
				if( input.state("fire") == 1 ) _player.levelUp(this.stat_cursor);
			}
		} else if ( this.page == 3 ) {
			var unlocked = Object.keys( _player.spellsUnlocked );
			if( unlocked.length > 0 ) {
				//Select a spell, if one hasn't already been selected
				if( !(_player.selectedSpell in _player.spellsUnlocked ) ) _player.selectedSpell = unlocked[0];
				
				//Control Menu
				if( input.state("up") == 1 ) {
					var pos = Math.max( unlocked.indexOf( _player.selectedSpell ) - 1, 0 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("down") == 1 ) { 
					var pos = Math.min( unlocked.indexOf( _player.selectedSpell ) + 1, unlocked.length-1 );
					_player.selectedSpell = unlocked[pos];
					audio.play("cursor"); 
				}
				if( input.state("fire") == 1 ) { 
					_player.castSpell(_player.selectedSpell);
				}
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 || input.state("select") == 1 ) {
				this.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( this.page != 1 || input.state("fire") <= 0 ) {
				if( input.state("left") == 1 ) { this.page = ( this.page + 1 ) % this.pageCount; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.page = (this.page<=0 ? (this.pageCount-1) : this.page-1); audio.play("cursor"); }
			}
		}
	} else {
		if( ( input.state("pause") == 1 || input.state("select") == 1 ) && _player instanceof Player && _player.life > 0 ) {
			this.open = true;
			//_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			this.page = 1;
			if( _player.stat_points > 0 ) this.page = 2;
			if( input.state("select") == 1 ) this.page = 3;
			audio.play("pause");
		}
	}
	
	//Reveal map
	if( this.mapDimension instanceof Line ) {
		var map_index = (
			( Math.floor(_player.position.x / 256) - this.mapDimension.start.x ) + 
			( Math.floor(_player.position.y / 240) - this.mapDimension.start.y ) * this.mapDimension.width()
		);
		this.map_reveal[map_index] = 2;
		
		var lock;
		switch( Math.abs(this.map[map_index]) % 16 ){
			case 0: lock = new Line(0,0,256,480); break;
			case 1: lock = new Line(0,0,512,480); break;
			case 2: lock = new Line(-256,0,256,480); break;
			case 3: lock = new Line(-256,0,512,480); break;
			case 4: lock = new Line(0,0,256,240); break;
			case 5: lock = new Line(0,0,512,240); break;
			case 6: lock = new Line(-256,0,256,240); break;
			case 7: lock = new Line(-256,0,512,240); break;
			case 8: lock = new Line(0,-240,256,480); break;
			case 9: lock = new Line(0,-240,512,480); break;
			case 10: lock = new Line(-256,-240,256,480); break;
			case 11: lock = new Line(-256,-240,512,480); break;
			case 12: lock = new Line(0,-240,256,240); break;
			case 13: lock = new Line(0,-240,512,240); break;
			case 14: lock = new Line(-256,-240,256,240); break;
			case 15: lock = new Line(-256,-240,512,240); break;
			default: lock = new Line(-256,-240,256,480); break;
		}
		lock = lock.transpose( Math.floor(_player.position.x / 256)*256,  Math.floor(_player.position.y / 240)*240 );
		_player.lock = lock;
	}
	
	this.message_time -= game.deltaUnscaled;
}
PauseMenu.prototype.message = function(m){
	this.message_text = m;
	this.message_time = Game.DELTASECOND*2;
}
PauseMenu.prototype.revealMap = function(secrets){
	secrets = secrets || 0;
	for(var i=0; i < this.map.length; i++ ) {
		if( secrets > 0 || this.map[i] >= 0 ){
			if( this.map_reveal[i] == undefined ) this.map_reveal[i] = 0;
			this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
		}
	}
}
PauseMenu.prototype.hudrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	sprites.pig.render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	/* mini map */
	
	if( _player instanceof Player ) {
		g.color = [1.0,1.0,1.0,1.0];
		g.scaleFillRect(game.resolution.x-41,7,34,26);
		g.color = [0.0,0.0,0.0,1.0];
		g.scaleFillRect(game.resolution.x-40,8,32,24);
		this.renderMap(g,
			new Point(Math.floor(-_player.position.x/256), Math.floor(-_player.position.y/240)),
			new Point(game.resolution.x-24,24), 
			new Line(-16,-16,16,8)
		);
	}
	
	if( this.message_time > 0 ) {
		var left = game.resolution.x * 0.5 - 224 * 0.5;
		boxArea(g,left,16,224,64);
		textArea(g,this.message_text,left+16,32,192);
	}
	var leftx = 0;
	if( this.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			g.color = [0,0,0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
			
			var gamex = game.resolution.x * 0.5 - 427 * 0.5;
			sprites.title.render(g,new Point(gamex,0), 0,3);
			
			boxArea(g,xpos+68,168,120,40);
			textArea(g,i18n("press_start"),xpos+84,184);
		} else if( this.page == 0 ) {
			//Option 68
			leftx = game.resolution.x*0.5 - 120*0.5;
			
			boxArea(g,leftx,8,120,224);
			textArea(g,"Settings",leftx+30,20);
			
			textArea(g,"Screen",leftx+16,40);
			textArea(g,(game.isFullscreen()?"Fullscreen":"Windowed"),leftx+20,52);
			
			textArea(g,"Guard Style",leftx+16,72);
			textArea(g,(_player.autoblock?"Automatic":"Manual"),leftx+20,84);
			
			textArea(g,"SFX Volume",leftx+16,104);
			//g.fillStyle = "#e45c10";
			g.color = [0.8,0.6,0.1,1.0];
			for(var i=0; i<audio.sfxVolume.gain.value*20; i++)
				g.scaleFillRect(leftx+20+i*4, 116, 3, 8 );
			
			textArea(g,"MUS Volume",leftx+16,136);
			g.color = [0.8,0.6,0.1,1.0];
			for(var i=0; i<audio.musVolume.gain.value*20; i++)
				g.scaleFillRect(leftx+20+i*4, 148, 3, 8 );
			
			//Draw cursor 84
			textArea(g,"@",leftx+12, 52 + this.cursor * 32 );
		} else if ( this.page == 1 ) {
			//Map
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Map",leftx+102,20);
			this.renderMap(g,this.mapCursor,new Point(leftx+16,24), new Line(0,0,24*8,24*8) );
			
		} else if ( this.page == 2 ) {
			//Stats page
			leftx = game.resolution.x*0.5 - 120*0.5;
			
			boxArea(g,leftx,8,120,224);
			
			textArea(g,"Attributes",leftx+20,20);
			
			textArea(g,"Points: "+_player.stat_points ,leftx+20,36);
			
			var attr_i = 0;
			for(attr in _player.stats) {
				var y = attr_i * 28;
				textArea(g,attr ,leftx+20,60+y);
				g.color = [0.8,0.6,0.1,1.0];
				for(var i=0; i<_player.stats[attr]; i++)
					g.scaleFillRect(leftx+20+i*4, 72 + y, 3, 8 );
				
				if( _player.stat_points > 0 ) {
					//Draw cursor
					g.color = [1.0,1.0,1.0,1.0];
					if( this.stat_cursor == attr_i ){
						g.scaleFillRect(leftx+12, 62 + y, 4, 4 );
					}
				}
				attr_i++;
			}
		} else if ( this.page == 3 ) {
			//Spells
			leftx = game.resolution.x*0.5 - 152*0.5;
			
			boxArea(g,leftx,8,152,224);
			textArea(g,"Spells",leftx+52,20);
			
			var spell_i = 0;
			for(spell in _player.spellsUnlocked) {
				var y = spell_i * 16;
				textArea(g,_player.spellsUnlocked[spell] ,leftx+20,36+y);
				if(_player.selectedSpell == spell ) textArea(g,"@",leftx+10,36+y);
				if( spell in _player.spellsCounters && _player.spellsCounters[spell] > 0 ) {
					var remaining = Math.min( Math.floor((8*_player.spellsCounters[spell]) / _player.spellEffectLength), 8);
					var y_offset = 8 - remaining;
					g.color = [0.1,0.7,0.98,1.0];
					g.scaleFillRect(leftx+132, 36+y+y_offset, 8, remaining );
					sprites.text.render(g,new Point(leftx+132,36+y), 5, 6);
				}
				
				spell_i++;
			}
		} else if ( this.page == 4 ){
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Quests",leftx+52,20);
			
			var y_pos = 0;
			for(var q in window._world.quests){
				if(window._world.quests[q]){
					var name = i18n("quest_names")[q];
					var complete = window._world.quests[q] == "complete";
					if( complete ) textArea(g,"@",leftx+16,40+y_pos);
					textArea(g,name,leftx+32,40+y_pos);
					y_pos += 12;
				}
			}
		}
	}
}

PauseMenu.prototype.renderMap = function(g,cursor,offset,limits){
	try {
		var size = new Point(8,8);
		//var offset = new Point(32,24);
		var doors = game.getObjects(Door);
		var shop = game.getObject(Shop);
		
		for(var i=0; i < this.map.length; i++ ){
			if( this.map[i] != undefined && this.map_reveal[i] > 0 )  {
				var tile = new Point(
					this.mapDimension.start.x + (i%this.mapDimension.width() ),
					this.mapDimension.start.y + Math.floor(i/this.mapDimension.width() )
				);
				var pos = new Point( 
					(this.mapDimension.start.x*8) + (cursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
					(this.mapDimension.start.y*8) + (cursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
				);
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					//sprites.map.render(g,pos.add(offset),Math.abs(this.map[i])-1,(this.map_reveal[i]>=2?0:1));
					var xtile = Math.floor(this.map[i] / 16);
					var ytile = this.map[i] % 16;
					if( this.map_reveal[i] < 2 ) xtile += 4;
					sprites.map.render(g,pos.add(offset),xtile,ytile);
					
					if( this.map_reveal[i] >= 2 ) {					
						for(var j=0; j < doors.length; j++ ){
							if( tile.x == Math.floor(doors[j].position.x/256) && tile.y == Math.floor(doors[j].position.y/240) ){
								var door_id = doors[j].name.match(/(\d+)/)[0] - 0;
								sprites.map.render(g,pos.add(offset),8,door_id);
							}
						}
						if( shop != null && tile.x == Math.floor(shop.position.x/256) && tile.y == Math.floor(shop.position.y/240) ){
							sprites.text.render(g,pos.add(offset),4,0);
						}
					}
				}
			}
		}
		//Draw player
		var pos = new Point(
			1+cursor.x*8 + Math.floor(_player.position.x/256)*8, 
			2+(cursor.y*8) + Math.floor(_player.position.y/240)*8
		);
		if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
			g.color = [1.0,0.0,0.0,1.0];
			g.scaleFillRect(1 + pos.x + offset.x, 1 + pos.y + offset.y, 4, 3 );
		}
	} catch (err) {}
}

PauseMenu.convertTileDataToMapData = function(data){
	//Used to convert raw map data to something useable by the map engine
	out = new Array(data.length);
	for(var i=0; i < data.length; i++){
		if(data[i]==0){
			out[i] = null;
		}else{
			var d = data[i] - 1;
			out[i] = Math.floor(d/16)+(d%16)*16;
		}
	}
	return out;
}

 /* platformer\menu_title.js*/ 

TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = sprites.title;
	this.zIndex = 999;
	this.visible = true;
	this.start_options = false;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 0;
	this.loading = true;
	
	this.starPositions = [
		new Point(84,64),
		new Point(102,80),
		new Point(99,93),
		new Point(117,99),
		new Point(117,111),
		new Point(128,71),
		new Point(191,41),
		new Point(64,108 ),
		new Point(158,65),
		new Point(15,5),
		new Point(229,69)
	]
	
	this.stars = [
		{ "pos" : new Point(), "timer" : 10 },
		{ "pos" : new Point(), "timer" : 20 },
		{ "pos" : new Point(), "timer" : 0 }
	];
	
	this.playedIntro = !!localStorage.getItem("playedintro");
	if( this.playedIntro ) this.cursor = 1;
	this.playedIntro = true;
	
	//this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"introduction_help",
		"start_help"
	];
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		//Display game object
		game.element.style.display = "block";
		
		this.loading = false;
		if( this.progress == 0 ) audio.playAs("music_intro","music");
		
		if( this.start_options ) {
			this.progress = 10.0;
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
			if( !this.playedIntro ) this.cursor = 0;
		} else {
			this.progress += this.delta / Game.DELTASECOND;
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) {
			if( this.progress < 9.0 || this.progress > 24.0 ) {
				this.progress = 9.0;
			} else if( this.start_options ) {
				//Start game
				this.startGame();
			} else {
				this.start_options = true;
			}
		}
		
		if( this.progress > 52 ) this.progress = 9.0;
		
	}
}

TitleMenu.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	if( this.loading ){ 
		//g.font = (30*pixel_scale)+"px monospace";
		//g.fillStyle = "#FFF";
		//g.fillText("Loading", 64*pixel_scale, 120*pixel_scale);
	} else if( this.start ) {
		sprites.loading.render(g,new Point(game.resolution.x*0.5,game.resolution.y*0.5),0,0);
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(xpos,0),0,2);
		
		//Random twinkling stars
		for(var i=0; i<this.stars.length; i++) {
			var frame = 2;
			if( 
				this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
				this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
			) frame = 3;
				
			sprites.bullets.render(g,this.stars[i].pos.add(new Point(xpos,0)),frame,2);
			this.stars[i].timer -= this.delta;
			if( this.stars[i].timer <= 0 ){
				this.stars[i].timer = Game.DELTASECOND * 1.0;
				this.stars[i].pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
			}			
		}
		this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
		if( this.progress > this.stars.timer ) {
			this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
			this.stars.timer += this.stars.reset;
		}
		
		this.sprite.render(g,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),0,1);
		this.sprite.render(g,new Point(xpos,Math.lerp( this.title_position, 0, pan)),0,0);
		
		textArea(g,"Copyright Pogames.uk 2015",8,4);
		textArea(g,"Version "+window._version,8,228);
		
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			if( this.start_options ) {
				var x_pos = game.resolution.x * 0.5 - 192 * 0.5;
				boxArea(g,x_pos,32,192,88);
				textArea(g,i18n(this.options[this.cursor]),x_pos+16,48,160);
				
				var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
				boxArea(g,x_pos,146,120,56);
				textArea(g,i18n("introduction"),x_pos+24,162);
				if( this.playedIntro ) textArea(g,i18n("new_game"),x_pos+24,178);
				
				sprites.text.render(g, new Point(x_pos+16,162+(16*this.cursor)),15,5);
			} else { 
				var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
				boxArea(g,x_pos,168,120,40);
				textArea(g,i18n("press_start"),x_pos+16,184);
			}
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,16, Math.min( (this.progress-24)/8, 1) );
			var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
			boxArea(g,0,y_pos-16,game.resolution.x,game.resolution.y);
			textArea(g,i18n("intro_text"),x_pos,y_pos,256,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	
	if(this.cursor == 1) {
		this.start = true;
		audio.play("pause");
		dataManager.reset();
		
		var world = new WorldMap(0,0);
		world.mode = this.cursor > 0 ? 1 : 0;
		
		ga("send","event","start_game");
		
		game.clearAll();
		game.addObject(world);
		audio.stop("music_intro");
		
		world.trigger("activate");
	} else { 
		audio.play("negative");
		//ga("send","event","start_intro");
		//dataManager.loadMap(game,_map_maps[0]);
		//audio.stop("music_intro");
	}
}

 /* platformer\millblades.js*/ 

MillBlades.prototype = new GameObject();
MillBlades.prototype.constructor = GameObject;
function MillBlades(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 96;
	this.height = 64;
	this.zIndex = 0;
	this.sprite = sprites.tiles0;
	
	this.speed = 1.3;	
	this.rotation = 0;
}

MillBlades.prototype.render = function(g,c){
	this.rotation += this.speed * this.delta;
	var p = this.position.subtract(c);
	var material = window.materials["default"].use();
	g.bindTexture( g.TEXTURE_2D, this.sprite.gl_tex );
	
	for(var i=0; i < 4; i++) {
		var r = this.rotation + i * 90;
		var geo = Sprite.RectBuffer(p, this.width, 32, r);
		var tex = Sprite.RectBuffer(new Point(), 1, 1);
		
		var buffer = g.createBuffer();
		var tbuffer = g.createBuffer();
		
		g.bindBuffer( g.ARRAY_BUFFER, buffer);
		g.bufferData( g.ARRAY_BUFFER, geo, g.DYNAMIC_DRAW );
		material.set("a_position");
		g.bindBuffer( g.ARRAY_BUFFER, tbuffer);
		g.bufferData( g.ARRAY_BUFFER, tex, g.DYNAMIC_DRAW );
		material.set("a_texCoord");
		material.set("u_resolution", game.resolution.x, game.resolution.y);
		material.set("u_camera", 0, 0);
		
		g.drawArrays(g.TRIANGLE_STRIP, 0, 6);
	}
}

 /* platformer\modules.js*/ 

var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.grounded = false;
		this._groundedTimer = 0;
		this.friction = 0.1;
		this.bounce = 0.0;
		this.collisionReduction = 0.0;
		this.pushable = true;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				this.grounded = true;
				this._groundedTimer = 2;
				if( this.force.y > 5.0 ) this.trigger("land");
			}
			this.force.y *= -this.bounce;
		});
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) && this.pushable && obj.pushable ) {
				var dir = this.position.subtract( obj.position ).normalize();
				/*
				var b = this.bounds();
				var c = obj.bounds();
				var overlap = new Point(
					dir.x > 0 ? (c.end.x-b.start.x) : (b.end.x-c.start.x),
					dir.y > 0 ? (c.end.y-b.start.y) : (b.end.y-c.start.y)
				);
				var percent = new Point(
					Math.min(Math.abs(overlap.x) / Math.max(this.width*0.5,0.0001),1.0),
					Math.min(Math.abs(overlap.y) / Math.max(this.height*0.5,0.0001),1.0)
				);
				*/
				if( this.mass - obj.mass > 1.0 ){
					obj.force.x += this.force.x * 0.8;
				} else if( obj.mass > 0.5 ) {
					if( (this.force.x < 0 && dir.x > 0) || (this.force.x > 0 && dir.x < 0) ){
						this.force.x = dir.x;
					}
				} else { 
					this.force.x += dir.x * 0.2 * this.delta;
					this.force.y += dir.y * 0.2 * this.delta;
				}
			}
		});
	},
	'update' : function(){
		this.force.y += this.gravity * this.delta;
		//Max speed 
		this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
		this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
		
		if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
		if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
		
		//Add just enough force to lock them to the ground
		if(this.grounded ) this.force.y += 0.1;
		
		//The timer prevents landing errors
		this._groundedTimer -= this.grounded ? 1 : 10;
		this.grounded = this._groundedTimer > 0;
		game.t_move( this, this.force.x * this.delta, this.force.y * this.delta );
		
		var friction_x = 1.0 - this.friction * this.delta;
		this.force.x *= friction_x;
	},
}

var mod_camera = {
	'init' : function(){
		this.lock = false;
		this.lock_overwrite = false;
		this._lock_current = false;
		this.camerShake = new Point();
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
		
		var self = this;
		window.shakeCamera = function(p,y){
			if(!(p instanceof Point)) p = new Point(p,y);
			self.camerShake = p;
		};
	},
	'update' : function(){
		var screen = game.resolution;
		game.camera.x = this.position.x - (game.resolution.x / 2);
		game.camera.y = this.position.y - (game.resolution.y / 2);
		//game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		
		game.camera.x += this.camerShake.x;
		this.camerShake = this.camerShake.scale(1-(0.07*game.deltaUnscaled));
		
		//Set up locks
		if( this.lock_overwrite instanceof Line ) {
			if( this._lock_current instanceof Line ) {
				var transition = this.delta * 0.1;
				this._lock_current.start.x = Math.lerp( this._lock_current.start.x, this.lock_overwrite.start.x, transition );
				this._lock_current.start.y = Math.lerp( this._lock_current.start.y, this.lock_overwrite.start.y, transition );
				this._lock_current.end.x = Math.lerp( this._lock_current.end.x, this.lock_overwrite.end.x, transition );
				this._lock_current.end.y = Math.lerp( this._lock_current.end.y, this.lock_overwrite.end.y, transition );
			} else {
				this._lock_current = this.lock_overwrite;
			}
		} else {
			if( this.lock instanceof Line ) {
				this._lock_current = new Line(this.lock.start.x, this.lock.start.y, this.lock.end.x, this.lock.end.y);
			} else {
				this._lock_current = false;
			}
		}
		
		if( this._lock_current instanceof Line ) {
			if( this._lock_current.width() < game.resolution.x ){
				var center = (this._lock_current.start.x + this._lock_current.end.x) / 2;
				this._lock_current.start.x = center - (game.resolution.x/2);
				this._lock_current.end.x = center + (game.resolution.x/2);
			}
			game.camera.x = Math.min( Math.max( game.camera.x, this._lock_current.start.x ), this._lock_current.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this._lock_current.start.y ), this._lock_current.end.y - screen.y );
		}
	},
	"render" : function(g,c){
		var viewWidth = Math.abs(this.lock.start.x - this.lock.end.x);
		if( viewWidth < game.resolution.x ){
			var excess = game.resolution.x - viewWidth;
			g.color = [0,0,0,1];
			g.scaleFillRect(0,0,excess*0.5, game.resolution.y);
			g.scaleFillRect(game.resolution.x-excess*0.5,0,excess*0.5, game.resolution.y);
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.criticalChance = 0.0;
		this.criticalMultiplier = 4.0;
		this.damage = 10;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = 10.0;
		this.death_time = 0;
		this.dead = false;
		this._hurt_strobe = 0;
		this._death_clock = new Timer(Number.MAX_VALUE, Game.DELTASECOND * 0.25);
		this.damage_buffer = 0;
		this.buffer_damage = false;
		this._damage_buffer_timer = 0;
		this.xp_award = 0;
		
		this.attackEffects = {
			"slow" : [0,10],
			"poison" : [0,10],
			"cursed" : [0,25],
			"weaken" : [0,30],
			"bleeding" : [0,30],
			"rage" : [0,30]
		};
		this.statusEffects = {
			"slow" : 0,
			"poison" : 0,
			"cursed" : 0,
			"weaken" : 0,
			"bleeding" : 0,
			"rage" : 0
		};
		this.statusEffectsTimers = {
			"slow" : 0,
			"poison" : 0,
			"cursed" : 0,
			"weaken" : 0,
			"bleeding" : 0,
			"rage" : 0
		};
		this.statusResistance = {
			"slow" : 0.0,
			"poison" : 0.0,
			"cursed" : 0.0,
			"weaken" : 0.0,
			"bleeding" : 0.0,
			"rage" : 0.0
		};
		
		var self = this;
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false,
			"life" : 99999,
			"lifeMax" : 99999,
			"restore" : 0.5,
			"invincible" : 0.0
		};
		this._shield = new GameObject();
		this._shield.life = 1;
		
		this.on("added",function(){ 
			for(var i in this.statusEffectsTimers )this.statusEffectsTimers[i] = -1;
			game.addObject(this._shield); 
		});
		/*
		this._shield.on("struck",function(obj,position,damage){
			if( obj != self ) 
				self.trigger("block",obj,position,damage);
		});*/
			
		this.strike = function(l,trigger,damage){
			trigger = trigger == undefined ? "struck" : trigger;
			damage = damage || this.damage;
			
			var out = new Array();
			var offset = new Line( 
				this.position.add( new Point( l.start.x * (this.flip ? -1.0 : 1.0), l.start.y) ),
				this.position.add( new Point( l.end.x * (this.flip ? -1.0 : 1.0), l.end.y) )
			);
			
			offset.correct();
			this.ttest = offset;
			
			var hits = game.overlaps(offset);
			for( var i=0; i < hits.length; i++ ) {
				if( hits[i].interactive && hits[i] != this && hits[i].life != null ) {
					this.trigger("struckTarget", hits[i], offset.center(), damage);
					
					if( trigger == "hurt" && hits[i].hurt instanceof Function ) {
						hits[i].hurt(this, damage);
						out.push(hits[i]);
					} else if( "_shield" in hits[i] && hits.indexOf( hits[i]._shield ) > -1 ) {
						//block?
						hits[i].trigger("block",this, offset.center(), damage);
						if( hits[i].guard.invincible <= 0 ) {
							if( damage > hits[i].guard.life ) {
								damage = Math.max( damage - hits[i].guard.life, 0);
								hits[i].guard.life = 0;
								hits[i].trigger("guardbreak", this, offset.center(), damage);
								hits[i].hurt(this, damage);
							} else {
								hits[i].guard.life -= damage;
								hits[i].guard.invincible = Game.DELTASECOND * 0.6;
							}
						}
					} else {
						hits[i].trigger(trigger, this, offset.center(), damage);
						out.push(hits[i]);
					}
				}
			}
			
			return out;
		}
		this.isDead = function(){
			if( this.life <= 0 ){
				//Remove effects
				for(var i in this.statusEffects ){
					this.statusEffects[i] = -1;
					this.statusEffectsTimers[i] = -1;
				}
				//Trigger death
				if( this.death_time > 0 ) {
					this.trigger("pre_death");
					this._death_clock.set(this.death_time);
					this.interactive = false;
				} else {
					if( !this.dead ){
						game.addObject(new EffectExplosion(this.position.x,this.position.y));
						this.trigger("death");
					}
				}
				this.dead = true;
			} else {
				this.dead = false;
			}
		}
		this.hasStatusEffect = function(){
			for(var i in this.statusEffects)
				if(this.statusEffects[i] > 0 )
					return true;
			return false;
		}
		this.addEffect = function(name, chance, time){
			var resistence = Math.random() + this.statusResistance[name];
			if( resistence < chance ){
				this.statusEffects[name] = Math.max( Game.DELTASECOND * time, this.statusEffects[name] );
				this.statusEffectsTimers[name] = Math.max( this.statusEffects[name] - Game.DELTASECOND * 0.5, this.statusEffectsTimers[name]);
				this.trigger("status_effect", name);
			}
		}
		this.hurt = function(obj, damage){
			if( this.statusEffects.bleeding > 0 ) damage *= 2;
			if( this.statusEffects.rage > 0 ) damage = Math.floor( damage * 1.5 );
			if( "statusEffects" in obj && obj.statusEffects.weaken > 0 ) damage = Math.ceil(damage/3);
			if( "statusEffects" in obj && obj.statusEffects.rage > 0 ) damage = Math.floor(damage*1.5);
			
			//Add effects to attack
			if( "attackEffects" in obj ){
				for( var i in obj.attackEffects ) {
					this.addEffect(i, obj.attackEffects[i][0], obj.attackEffects[i][1]);
				}
			}
			
			if( this.invincible <= 0 ) {
				//Determine if its a critical shot
				if( Math.random() < this.criticalChance ) {
					damage *= this.criticalMultiplier;
					audio.play("critical");
					game.slow(0.1, Game.DELTASECOND * 0.5 );
					this.trigger("critical",obj,damage);
					game.addObject(new EffectCritical(this.position.x, this.position.y));
				}
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.ceil( this.damageReduction * damage ), 1 );
				
				if( this.buffer_damage ) 
					this.damage_buffer += damage;
				else
					this.life -= damage;
				
				if(this.hasModule(mod_rigidbody)){
					var dir = this.position.subtract( obj.position ).normalize();
					var scale = ("knockbackScale" in obj) ? obj.knockbackScale : 1.0;
					this.force.x += dir.x * ( 3/Math.max(this.mass,0.3) ) * scale;
				}
				this.invincible = this.invincible_time;
				this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				this.isDead();
				obj.trigger("hurt_other",this,damage);
			}
		}
		this.calculateXP = function(scale){
			if(!this.filter && !(this instanceof Player) && !this.hasModule(mod_boss))
				this.filter = "t"+dataManager.currentTemple;
			
			scale = scale == undefined ? 1 : scale;
			this.xp_award = 0;
			this.xp_award += this.life / 8;
			this.xp_award += this.damage / 5;
			if( this.speed != undefined )
				this.xp_award += Math.max((this.speed-0.3)*3,0);
			this.xp_award += this.bounds().area() / 400;
			this.xp_award = Math.floor(this.xp_award * scale * this.deltaScale);
			return this.xp_award;
		}
		
		this.on("death", function(){
			this._shield.destroy();
		});
	},
	"update" : function(){
		if( this._base_filter == undefined ) {
			this._base_filter = this.filter;
		}
		if( this.invincible > 0 ) {
			this._hurt_strobe = (this._hurt_strobe + game.deltaUnscaled * 0.5 ) % 2;
			this.filter = this._hurt_strobe < 1 ? "hurt" : this._base_filter;
		} else {
			this.filter = this._base_filter;
		}
		
		this.deltaScale = this.statusEffects.slow > 0 ? 0.5 : 1.0;
		
		//Status Effects timers
		var j=0;
		for(var i in this.statusEffects ){
			if( this.statusEffects[i] > 0 ){
				this.statusEffects[i] -= this.deltaUnscaled;
				if( this.statusEffectsTimers[i] > this.statusEffects[i]/* || this.statusEffectsTimers[i] <= 0 */){
					this.statusEffectsTimers[i] = this.statusEffects[i] - Game.DELTASECOND * 0.5;
					if( i == "poison" ) {
						if( this instanceof Player ){
							if( this.life > 30 ) this.life -= 1;
						} else {
							this.life -= 3; 
							this.isDead(); 
						}
					}
					var effect = new EffectStatus(this.position.x+(Math.random()-.5)*this.width, this.position.y+(Math.random()-.5)*this.height);
					effect.frame = j;
					game.addObject(effect);
				}
			}
			j++;
		}
		
		this._damage_buffer_timer -= this.deltaUnscaled;
		if( this.damage_buffer > 0 && this._damage_buffer_timer <= 0 ){
			this.life -= 1;
			this.damage_buffer -= 1;
			this._damage_buffer_timer = Game.DELTASECOND * 0.3;
			this.isDead();
		}
		
		//Death clock explosion effect
		if( this.life <= 0 && this.death_time > 0) {
			if( this._death_clock.status(game.deltaUnscaled) ) {
				game.addObject(new EffectExplosion(
					this.position.x + this.width*(Math.random()-.5), 
					this.position.y + this.height*(Math.random()-.5)
				));
			}
			if( this._death_clock.time <= 0 ) this.trigger("death");
		}
		
		this._shield.interactive = this.guard.active;
		this._shield.team = this.team;
		this.guard.invincible -= this.deltaUnscaled;
		if( this.guard.active ) {
			this._shield.position.x = this.position.x+(this.flip?-1:1)*this.guard.x;
			this._shield.position.y = this.position.y+this.guard.y;
			this._shield.width = this.guard.w;
			this._shield.height = this.guard.h;
			this.guard.life = Math.min(this.guard.life + this.guard.restore * this.delta * 0.75, this.guard.lifeMax);
		} else {
			this._shield.position.x = -Number.MAX_VALUE;
			this._shield.position.y = -Number.MAX_VALUE;
			this.guard.life = Math.min(this.guard.life + this.guard.restore * this.delta, this.guard.lifeMax);
		}
		
		this.invincible -= this.deltaUnscaled;
		this.stun -= this.delta;
	}
}

var mod_boss = {
	"init" : function(){
		this.active = false;
		var x = this.position.x;
		var y = this.position.y;
		this.boss_starting_position = new Point(x,y);
		this.boss_intro = 0.0;
		this.bossface_frame = 0;
		this.bossface_frame_row = 0;
		this.bossdeatheffect = false;
		
		var corner = new Point(256*Math.floor(x/256), 240*Math.floor(y/240));
		this.boss_lock = new Line(
			corner.x,
			corner.y,
			256 + corner.x,
			240 + corner.y
		);
		this.boss_doors = [
			new Point(corner.x-8,corner.y+168),
			new Point(corner.x-8,corner.y+184),
			new Point(corner.x-8,corner.y+200),
			
			new Point(corner.x+256,corner.y+168),
			new Point(corner.x+256,corner.y+184),
			new Point(corner.x+256,corner.y+200)
		];
		
		this.reset_boss = function(){
			this.position.x = this.boss_starting_position.x;
			this.position.y = this.boss_starting_position.y;
			this.active = false;
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
			_player.lock_overwrite = false;
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 64 && Math.abs( dir.y ) < 64 ){
					game.slow(0.1, Game.DELTASECOND * 3);
					this.active = true;
					this.trigger("activate");
				}
			}
		}
		
		this.on("player_death", function(){
			this.reset_boss();
		});
		this.on("activate", function() {
			for(var i=0; i < this.boss_doors.length; i++ ) 
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, window.BLANK_TILE);
			_player.lock_overwrite = this.boss_lock;
			this.interactive = true;
		});
		this.on("death", function() {
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
			_player.lock_overwrite = false;
		});
	},
	"update" : function(){
		this._boss_is_active();
		if( this._death_clock.at(Game.DELTASECOND*0.7) ){
			game.addObject(new EffectItemPickup(this.position.x, this.position.y));
			this.bossdeatheffect = true;
		}
	},
	"postrender" : function(g,c){
		if( this.active && this.boss_intro < 1.0){
			this.boss_intro += game.deltaUnscaled / (Game.DELTASECOND * 3);
			g.color = [0.0,0.0,0.0,0.5];
			
			var slide = Math.min(Math.sin(Math.PI*this.boss_intro)*4, 1);
			var border = Math.min(Math.sin(Math.PI*this.boss_intro)*3, 1) * 64;
			g.scaleFillRect(0, 0, game.resolution.x, border);
			g.scaleFillRect(0, game.resolution.y-border, game.resolution.x, border);
			
			var porta = Point.lerp(new Point(-90,60), new Point(40,60), slide);
			var portb = Point.lerp(new Point(game.resolution.x+90,60), new Point(game.resolution.x-40,60), slide);
			
			sprites.bossface.render(g,porta,1,0,false);
			sprites.bossface.render(g,portb,this.bossface_frame,this.bossface_frame_row,true);
		}
	}
}

var mod_talk = {
	"init" : function(){
		this.open = 0;
		this.canOpen = true;
		this._talk_is_over = 0;
		
		if(window._dialogueOpen == undefined){
			window._dialogueOpen = false;
		}
		
		this.close = function(){
			this.open = 0;
			window._dialogueOpen = false;
			this.trigger("close");
		}
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				this._talk_is_over = 2;
			}
		});
	},
	"update" : function(){
		if( !window._dialogueOpen && this.canOpen && this.delta > 0 && this._talk_is_over > 0 && input.state("up") == 1 ){
			this.open = 1;
			window._dialogueOpen = true;
			this.trigger("open");
		}
		this._talk_is_over--;
	},
	"render" : function(g,c){
		if( this.canOpen && this._talk_is_over > 0 && this.open < 1){
			var pos = _player.position.subtract(c);
			pos.y -= 24;
			sprites.text.render(g,pos,4,6);
		}
	}
}

SpecialEnemy = function(enemy){
	if(Math.random() > 0.05) return;
	var effects = 1 + Math.floor(Math.random()*3);
	enemy.life = Math.floor(8 + enemy.life * 1.5);
	
	for(var i=0; i < effects; i++){
		try{			
			if(Math.random() < 0.1){
				enemy.life *= 2;
			} else if(Math.random() < 0.1){
				if("damage" in enemy) enemy.damage = Math.floor(enemy.damage*1.5);
				enemy.collideDamage = Math.floor(enemy.damage*1.5);
			} else if(Math.random() < 0.1){
				enemy.deltaScale = 1.3333;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.slow[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.poison[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.cursed[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.weaken[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.bleeding[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.attackEffects.rage[0] += 0.5;
			} else if(Math.random() < 0.1){
				enemy.invincible_time += Game.DELTASECOND;
			}
		} catch (err){
			console.error(err);
		}
	}
	enemy.filter = "special";
	console.log("SPECIAL: " + typeof(this));
}

EnemyStruck = function(obj,pos,damage){
	if( this.team == obj.team ) return;
	var clife = this.life;
	this.hurt( obj, damage );
	if(clife != this.life) game.addObject(new EffectBlood(
		pos.x, pos.y, this.position.subtract(obj.position).normalize(), clife - this.life)
	);
}

 /* platformer\movingplatform.js*/ 

MovingPlatform.prototype = new GameObject();
MovingPlatform.prototype.constructor = GameObject;
function MovingPlatform(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.width = 28;
	this.height = 16;
	
	this.speed = 1.3;
	this.direction = new Point(1,1);
	this.onboard = false;
	
	this.sprite = game.tileSprite;
	
	ops = ops || {};
	this.top = (ops.top || 0) - -y;
	this.bottom = (ops.bottom || 0) - -y;
	this.left = (ops.left || 0) - -x;
	this.right = (ops.right || 0) - -x;
	
	this.force = new Point();
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( obj.force.y > 0 ) {
				this.onboard = true;
				obj.position.y = this.position.y - 8;
				obj.trigger( "collideVertical", 1);
			}
		}
	});
}

MovingPlatform.prototype.idle = function(){}
MovingPlatform.prototype.update = function(){
	if( this.top != this.bottom ){
		if( this.position.y < this.top ) this.direction.y = 1.0;
		if( this.position.y > this.bottom ) this.direction.y = -1.0;
		this.force.y = this.direction.y * this.speed;
	}
	
	if( this.left != this.right ){
		if( this.position.x < this.left ) this.direction.x = 1.0;
		if( this.position.x > this.right ) this.direction.x = -1.0;
		this.force.x = this.direction.x * this.speed;
	}
	
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	
	if( this.onboard ) {
		_player.position.x += this.force.x * this.delta;
		_player.position.y += this.force.y * this.delta;
	}
	
	this.onboard = false;
}
MovingPlatform.prototype.render = function(g,c){
	game.tileSprite.render(g, new Point(this.position.x-16-c.x, this.position.y+8-c.y), 0, 15);
	game.tileSprite.render(g, new Point(this.position.x+0-c.x, this.position.y+8-c.y), 1, 15);
}

 /* platformer\platform_generator.js*/ 

PlatformGenerator.prototype = new GameObject();
PlatformGenerator.prototype.constructor = GameObject;
function PlatformGenerator(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	o = o || {};
	w = ("width" in o) ? o.width : 44;
		
	var start_y = 240 + Math.floor(y/240)*240;
	var space = 0;
	var continuous = 0;
	var y_offset = -1;
	for(var _x=0; _x < w; _x++){
		var start_x = (x)-(w*0.5*16);
		var c_x = start_x + (_x*16);
		var c_y = start_y+(y_offset*16);
		
		y_offset = Math.floor(Math.max(y_offset,-8*(w/(_x||1)-1)));
		y_offset = Math.min(y_offset,-1);
		
		if( space > 0 ) {
			space--;
			if( space == 2 && Math.random() < 0.7 ) {
				game.addObject(new Dropper(c_x,start_y-200));
			}
		} else {
			continuous++;
			game.addObject(new CollapseTile(c_x,c_y-8));
			if(Math.random() < 0.2){
				space = 2+Math.floor(Math.random()*4);
				var _y = Math.floor( Math.random() * 3 )
				y_offset += (Math.random()>0.5?-1:1)*_y;
				continuous = 0;
			}
		}
	}
}

 /* platformer\player.js*/ 

Player.prototype = new GameObject();
Player.prototype.constructor = GameObject;
function Player(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 30;
	this.zIndex = 1;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	//this.equipment = [new Item(0,0,"short_sword"), new Item(0,0,"small_shield")];
	this.spells = [];
	this.charm = false;
	this.knockedout = false;
	
	this.equip_sword = new Item(0,0,"short_sword",{"enchantChance":0});
	this.equip_shield = new Item(0,0,"small_shield",{"enchantChance":0});
	
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.jump_strength = 7.7;
	
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND,
		"guard_down" : false,
		"attack_charge" : 0,
		"charge_multiplier" : false,
		"rollPressCounter" : 0.0,
		"roll" : 0,
		"rollDirection" : 1.0,
		"effectTimer" : 0.0,
		"downStab" : false,
		"afterImage" : new Timer(0, Game.DELTASECOND * 0.125)
	};
	
	this.attackProperites = {
		"charge_start" : 0.2 * Game.DELTASECOND,
		"charge_end" : 0.5 * Game.DELTASECOND,
		"warm" : 8.5,
		"strike" : 8.5,
		"rest" : 5.0,
		"range" : 8.0,
		"sprite" : sprites.sword1
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	};
	
	
	this.speeds = {
		"inertiaGrounded" : 0.4,
		"inertiaAir" : 0.1,
		"frictionGrounded" : 0.1,
		"frictionAir" : 0.05,
		"airGlide" : 0.0,
		"breaks": 0.4
	};
	
	this.weapon = {
		"frame" : 0,
		"frame_row" : 0,
		"combo" : 0,
		"charge" : 0,
		"charge_ready" : false,
		"width" : 4
	};
	this.cape = {
		"active" : false,
		"frame" : 0,
		"frame_row" : 0,
		"sprite" : sprites.cape1,
		"cape" : null,
		"flip" : this.flip
	}
	
	this.on("pre_death", function(){
		this.heal = 0;
		game.slow(0,this.death_time);
		audio.stopAs("music");
	});
	this.on("death", function(){
		this.position.x = 128;
		this.position.y = 200;
		
		if( window._world instanceof WorldMap ){
			window._world.worldTick();
		}
		
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		game.getObject(PauseMenu).open = true;
		audio.play("playerdeath");
		this.destroy();
		
		ga("send","event", "death","died:"+dataManager.currentTemple+" at level:"+this.level);
	});
	this.on("land", function(){
		//Land from a height
		audio.play("land");
		var dust = Math.floor(2 + Math.random() * 3);
		for(var i=0; i < dust; i++ ){
			var offset = new Point(
				i * 5 + (Math.random()-0.5) * 3 - (dust*2),
				16 - Math.random() * 3
			);
			game.addObject( new EffectSmoke(
				offset.x + this.position.x, 
				offset.y + this.position.y,
				null,
				{
					"frame":1, 
					"speed":0.4 + Math.random() * 0.2,
					"time":Game.DELTASECOND * (0.3 + 0.4 * Math.random())
				}
			));
		}
	});
	this.on("collideVertical", function(v){
		if(v>0) this.knockedout = false;
	});
	this.on("guardbreak", function(obj,position,damage){
		dir = this.position.subtract(obj.position);
		this.knockedout = true;
		this.grounded = false;
		this.force.y = -8;
		this.force.x = 12 * (dir.x > 0 ? 1.0 : -1.0);
		
		this.guard.life = this.guard.lifeMax;
		
		game.slow(0.1, Game.DELTASECOND);
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 15.0;
		
		if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
		
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("hurt", function(obj, damage){
		var dir = this.position.subtract(obj.position).normalize(damage);
		window.shakeCamera(dir);
		if(this.stun_time > 0 ){
			this.states.attack = 0;
			game.slow(0,5.0);
		}
		
		audio.play("playerhurt");
	})
	this.on("struckTarget", function(obj, pos, damage){
		if( this.states.downStab && obj.hasModule(mod_combat) && this.force.y > 0 ) {
			this.states.downStab = false;
			this.force.y = -2;
			this.jump();
		}
	});
	this.on("hurt_other", function(obj, damage){
		var ls = Math.min(this.life_steal, 0.4);
		this.life = Math.min( this.life + Math.round(damage * ls), this.lifeMax );
		
		if( "life" in obj && obj.life <= 0 ) {
			//Glow after a kill
			this.states.afterImage.set(Game.DELTASECOND * 3);
		}
		
		if( !this.grounded && !this.states.downStab ) {
			//Add extra float
			this.force.y -= this.jump_strength * this.speeds.airGlide;
		}
		
		//Charge kill explosion!
		if( this.states.charge_multiplier && obj.mass < 2.0 && obj.life <= 0 ) {
			var dir = obj.position.subtract(this.position);
			game.slow(0.1, Game.DELTASECOND * 0.5);
			audio.playLock("explode3", 0.5);
			game.addObject( new ExplodingEnemy( 
				obj.position.x,
				obj.position.y,
				dir.add(new Point(0, -2)),
				{
					"damage" : this.damage * 4,
					"sprite" : obj.sprite,
					"flip" : obj.flip,
					"frame" : obj.frame,
					"frame_row" : obj.frame_row
				}
			));
			
		}
	});
	this.on("added", function(){
		this.damage_buffer = 0;
		this.lock_overwrite = false;
		this.checkpoint = new Point(this.position.x, this.position.y);
		this.force.x = this.force.y = 0;
		
		game.camera.x = this.position.x-128;
		game.camera.y = Math.floor(this.position.y/240)*240;
		
		for(var i in this.spellsCounters ){
			this.spellsCounters[i] = 0;
		}
		
		if( dataManager.temple_instance ) {
			this.keys = dataManager.temple_instance.keys;
		} else {
			this.keys = new Array();
		}
	})
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	this.life = 100;
	this.lifeMax = 100;
	this.mana = 3;
	this.manaMax = 3;
	this.money = 0;
	this.waystones = 0;
	this.heal = 0;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = Game.DELTASECOND;
	this.autoblock = true;
	this.rollTime = Game.DELTASECOND * 0.5;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if( this.spellsCounters.thorns > 0 && obj.hurt instanceof Function)
			obj.hurt(this,damage);
		if( this.spellsCounters.magic_armour > 0 )
			damage = Math.max( Math.floor( damage * 0.5 ), 1);
		this.superHurt(obj,damage);
	}
	
	//Stats
	this.stat_points = 0;
	this.experience = 0;
	this.level = 1;
	this.nextLevel = 0;
	this.prevLevel = 0;
	
	
	this.equip(this.equip_sword, this.equip_shield);
	
	this.spellsUnlocked = {};
	this.selectedSpell = "";
	this.spellEffectLength = Game.DELTASECOND * 60;
	this.spells = {
		"magic_strength" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.magic_strength <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_strength = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"invincibility" : function(){ 
			if( this.mana >= 2 && this.spellsCounters.invincibility <= 0 ){
				this.mana -= 2;
				this.invincible = Game.DELTASECOND * 20; 
				this.spellsCounters.invincibility = this.invincible; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"flight" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.flight <= 0 ){
				this.mana -= 1;
				this.spellsCounters.flight = Game.DELTAYEAR; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"haste" : function(){ 
			if( this.mana >= 1 && this.spellsCounters.haste <= 0 ){
				this.mana -= 1;
				this.spellsCounters.haste = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_sword" : function(){
			if( this.mana >= 1 && this.spellsCounters.magic_sword <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_sword = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_armour" : function(){
			if( this.mana >= 1 && this.spellsCounters.magic_armour <= 0 ){
				this.mana -= 1;
				this.spellsCounters.magic_armour = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"feather_foot" : function(){
			if( this.mana >= 1 && this.spellsCounters.feather_foot <= 0){
				this.mana -= 1;
				this.spellsCounters.feather_foot = Game.DELTAYEAR; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"thorns" : function(){
			if( this.mana > 1 && this.spellsCounters.thorns <= 0 ){
				this.mana -= 1;
				this.spellsCounters.thorns = this.spellEffectLength; 
				audio.play("spell");
			} else audio.play("negative");
		},
		"recover" : function(){
			if( this.mana >= 1 && this.hasStatusEffect() ){
				this.mana -= 1;
				for( var i in this.statusEffects ) this.statusEffects[i]=-1;
				audio.play("spell");
			} else audio.play("negative");
		},
		"transmute" : function(){
			if( this.mana >= 2 ){
				this.mana -= 2;
				var objs = game.overlaps(
					new Line(game.camera.x,game.camera.y,game.camera.x+256,game.camera.y+240)
				);
				for(var i=0; i<objs.length; i++) if( objs[i] instanceof Item){
					if( objs[i].name.match(/coin_\d*/) ) objs[i].setName("waystone");
				}
				audio.play("spell");
			} else audio.play("negative");
		},
		"magic_song" : function(){
			if( this.mana >= 3 && this.spellsCounters.magic_song <= 0 ){
				this.mana -= 3;
				var roll = Math.random();
				if(roll < 0.04){
					for(var i=0; i < game.objects.length; i++ ) 
						if( game.objects[i].hasModule(mod_combat) && !(game.objects[i] instanceof Player) )
							game.objects[i].statusEffectsTimers.slow = game.objects[i].statusEffects.slow = Game.DELTASECOND * 30;
				} else if(roll < 0.1) {
					for(var i=0; i < game.objects.length; i++ ) 
						if( game.objects[i].hasModule(mod_combat) && !(game.objects[i] instanceof Player) && game.objects[i]._magic_drop == undefined){
							game.objects[i].on("death",function(){ game.addObject(new Item(this.position.x, this.position.y, "waystone")); });
							game.objects[i]._magic_drop = true;
						}
				} else if(roll < 0.2){
					this.spellsCounters.magic_armour = Game.DELTAYEAR; 
					this.spellsCounters.thorns = Game.DELTAYEAR;
				} else if(roll < 0.5) {
					this.heal = 999;
				} else {
					var map = game.getObject(PauseMenu);
					if( map instanceof PauseMenu) map.revealMap(1);
				}
				this.spellsCounters.magic_song = this.spellEffectLength * 2; 
				audio.play("spell");
			} else audio.play("negative");
		},
	};
	this.spellsCounters = {
		"magic_strength" : 0,
		"flight" : 0,
		"haste" : 0,
		"magic_sword" : 0,
		"magic_armour" : 0,
		"invincibility" : 0,
		"feather_foot" : 0,
		"thorns" : 0,
		"magic_song" : 0
	};
	this.money_bonus = 1.0;
	this.waystone_bonus = 0.1;
	this.life_steal = 0.0;
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	if( this.spellsCounters.haste > 0 ) speed = 1.4;
	
	//Reset states
	this.states.guard = false;
	this.states.downStab = false;
	
	this.buffer_damage = this.hasCharm("charm_elephant");
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana += 2, this.manaMax);
		this.manaHeal-= 2;
		if( this.mana >= this.manaMax ) this.manaHeal = 0;
	}
	if( this.hasCharm("charm_methuselah") ){
		for(var i in _player.statusEffects)
			_player.statusEffects[i] = 0;
	}
	if( this.statusEffects.cursed > 0 ){
		this.heal = 0;
	}
	if( this.heal > 0 ){
		audio.play("heal");
		this.life += 2;
		this.heal -= 2;
		this.damage_buffer = 0;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	} else {
		if( this.life < this.lifeMax * .2 && this.delta > 0 ) audio.playLock("danger",1.00);
	}
	if ( this.life > 0 ) {
		var strafe = input.state('block') > 0;
		if( this.states.roll > 0 ) {
			this.force.x = this.states.rollDirection * 5;
			this.states.roll -= this.delta;
			
			//Create dust trail for roll
			if( this.states.effectTimer > Game.DELTASECOND / 16 ){
				this.states.effectTimer = 0;
				game.addObject( new EffectSmoke(
					this.position.x, this.position.y + 16, null, 
					{"frame":1, "speed":0.4,"time":Game.DELTASECOND*0.4}
				));
			}
		}else if( !this.knockedout && this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
			this.states.guard = ( input.state('block') > 0 || this.autoblock );
			
			if( !this.states.duck ) {
				if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; }
				if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; }
				
				//Come to a complete stop
				if ( input.state('right') <= 0 && input.state('left') <= 0 && this.grounded ) { 
					this.force.x -= this.force.x * Math.min(this.speeds.breaks*this.delta);
				}
			}
						
			if ( input.state("down") > 0 && !this.grounded) { 
				//Down spike
				this.states.downStab = true;
				this.states.guard = false;
				
			} else if ( input.state('fire') == 1 ) { 
				this.attack(); 
			} else if ( input.state('fire') > 0 ) { 
				this.states.attack_charge += this.delta; 
				if( this.states.attack_charge >= this.attackProperites.charge_start){
					strafe = true;
				}
			} else { 
				this.states.charge_multiplier = false;
				
				//Release charge if it has built up
				if( this.states.attack_charge > this.attackProperites.charge_end ){
					this.states.charge_multiplier = true;
					this.attack();
					strafe = true;
					if( !this.states.duck ) {
						this.force.x = 5.0 * (this.flip ? -1.0 : 1.0);
					}
				}
				this.states.attack_charge = 0; 
			}
			
			if ( input.state('block') <= 0 && input.state('jump') == 1 && this.grounded ) { 
				this.jump(); 
			}
			if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
				this.duck(); 
			} else { 
				this.stand(); 
			}
			
			if ( 
				(
					(this.states.rollDirection > 0 && input.state("right") == 1) || 
					(this.states.rollDirection < 0 && input.state("left") == 1)
				) && 
				this.states.rollPressCounter > 0 &&
				this.grounded
			) {
				//Dodge roll
				this.states.roll = this.invincible = this.rollTime;
			} else if (strafe) {
				//Limit speed and face current direction
				this.force.x = Math.min( Math.max( this.force.x, -2), 2);
				
			} else {
				//Change to face player's selected direction
				if ( input.state('left') > 0 ) { this.flip = true;}
				if ( input.state('right') > 0 ) { this.flip = false; }
			}
			
			//Prep roll
			this.states.rollPressCounter -= this.delta;
			if( input.state('left') == 1 || input.state('right') == 1 ){
				this.states.rollDirection = 1.0;
				this.states.rollPressCounter = Game.DELTASECOND * 0.25;
				if( input.state('left') ) this.states.rollDirection = -1.0;
			}
			
		}
		
		//Apply jump boost
		if( this.spellsCounters.flight > 0 ) {
			this.gravity = 0.2;
			if ( input.state('down') > 0 ) { this.force.y += speed * this.delta * 0.3 }
			if ( input.state('jump') > 0 ) { this.force.y -= speed * this.delta * 0.4 }
		} else { 
			this.gravity = 1.0; 
			if ( input.state('jump') > 0 && !this.grounded ) { 
				
				if( this.force.y > 0 ) {
					this.force.y -= 0.4 * this.speeds.airGlide * this.delta;
				}
			
				if( this.jump_boost ) {
					var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
					this.force.y -= this.gravity * boost * this.delta; 
				}
			} else {
				this.jump_boost = false;
			}
		}
		
		this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
		this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
		this.height = this.states.duck ? 24 : 30;
		
		
		if ( this.states.downStab ) {
			this.strike(new Line( 0, 8, 4, 8+Math.max( 12, this.attackProperites.range)));
		}
		
		if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
			//Play sound effect for attack
			if( !this.states.startSwing ) {
				audio.play("swing");
				if( !this.grounded ) {
					this.force.y *= Math.max(1.0 - this.speeds.airGlide, 0);
				}
				if( this.spellsCounters.magic_sword > 0 || this.hasCharm("charm_sword") ){
					var offset_y = this.states.duck ? 6 : -8;
					var bullet = new Bullet(this.position.x, this.position.y + offset_y, this.flip ? -1 : 1);
					bullet.team = this.team;
					bullet.speed = this.speed * 2;
					bullet.knockbackScale = 0.0;
					bullet.frame = 1;
					bullet.damage = Math.max( Math.floor( this.damage * 0.25 ), 1 );
					game.addObject(bullet);
				}
			}
			this.states.startSwing = true;
			
			//Create box to detect enemies
			var temp_damage = this.damage;
			var type = this.equip_sword.phantom ? "hurt" : "struck";
			var weapon_top = (this.states.duck ? 4 : -4) - this.weapon.width*.5;
			if( this.spellsCounters.magic_strength > 0 ) {
				temp_damage = Math.floor(temp_damage*1.25);
			}
			if( this.states.charge_multiplier ) {
				temp_damage *= 2.0;
			}
			this.strike(new Line(
				new Point( 12, weapon_top ),
				new Point( 12+this.attackProperites.range , weapon_top+this.weapon.width )
			), type, temp_damage );
		} else {
			this.states.startSwing = false;
		}
	}
	
	//Shield
	this.states.guard_down = this.states.duck;
	this.guard.active = this.states.guard;
	this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.knockedout ){
		this.frame_row = 4;
		this.frame = (this.frame + this.delta * 0.2 ) % 3;
	} else if ( this.stun > 0 || this.life < 0 ) {
		this.stand();
		this.frame = 3;
		this.frame_row = 0;
	} else if( this.states.roll > 0 ) {
		this.frame_row = 3;
		this.frame = 5 * (1 - this.states.roll / this.rollTime);
	} else if( this.states.downStab ){
		this.frame = 4;
		this.frame_row = 0; 
	} else {
		if( !this.grounded ) {
			this.frame_row = 2;
			this.frame = this.force.y < 1.0 ? 3 : 4;
		} else if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack_charge > this.attackProperites.charge_start || this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 && this.grounded ) {
				//Run animation
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack_charge > this.attackProperites.charge_start ) this.frame = 0;
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
	}
	
	//Animation Sword
	if(this.states.attack > 0){
		this.weapon.frame = this.frame;
		this.weapon.frame_row = 1 + this.weapon.combo;
	} else if (this.states.downStab) {
		this.weapon.frame = 3;
		this.weapon.frame_row = 0;
	} else if( this.states.attack_charge > 0 ){ 
		this.weapon.frame = 0;
		this.weapon.frame_row = 2;
	} else { 
		this.weapon.frame = this.frame % 3;
		this.weapon.frame_row = 0;
	}
	
	//Animation Cape
	if( this.cape.active ) {
		if( this.flip != this.cape.flip ){
			this.cape.flip = this.flip;
			this.cape.frame_row = 4;
			this.cape.frame = 0;
		}
		if( this.grounded || Math.abs(this.force.y) < 0.4) {
			if(this.states.duck) {
				//Ducking
				if( this.cape.frame_row != 1 ) this.cape.frame = 0;
				this.cape.frame = Math.min( this.cape.frame + this.delta * 0.2, 2);
				this.cape.frame_row = 1;
			} else if(this.cape.frame_row == 4) {
				//Turning
				this.cape.frame += this.delta * 0.2;
				if( this.cape.frame >= 2 ) {
					this.cape.frame = 0;
					this.cape.frame_row = 0;
				}
			} else if( input.state("left") > -0 || input.state("right") > 0 ) {
				//Running
				this.cape.frame = (this.cape.frame + this.delta * Math.abs(this.force.x) * 0.05 ) % 3;
				this.cape.frame_row = 0;
			} else {
				//Stopped or stopping
				this.cape.frame_row = 0;
				if( Math.abs( this.force.x ) > 0.3 ) {
					this.cape.frame = Math.abs( this.force.x ) > 1.0 ? 3 : 4;
				} else {
					this.cape.frame = 0;
				}
			}
		} else {
			//In air
			this.cape.frame = Math.abs(this.force.y) > 2.5 ? 1 : 0;
			this.cape.frame_row = this.force.y > 0 ? 3 : 2;
		}
	}
	
	//Timers
	var attack_decrement_modifier = this.spellsCounters.haste > 0 ? 1.3 : 1.0;
	this.states.attack -= this.delta * attack_decrement_modifier;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
	this.states.effectTimer += this.delta;
	
	if( this.states.afterImage.status(this.delta) ){
		game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
	}
}
Player.prototype.idle = function(){}
Player.prototype.stand = function(){
	if( this.states.duck ) {
		this.position.y -= 4;
		this.states.duck = false;
	}
}
Player.prototype.duck = function(){
	if( !this.states.duck ) {
		this.position.y += 3.0;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = this.jump_strength;
	
	if( this.spellsCounters.flight > 0 ) force = 2;
	
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		if( this.grounded ) {
			this.force.x = 0;
			if( this.states.attack > Game.DELTASECOND * -0.3 ) {
				//Next combo level
				this.weapon.combo = (this.weapon.combo + 1) % 3;
			} else {
				//Reset combo
				this.weapon.combo = 0;
			}
		} else {
			this.weapon.combo = 2;
		}
		this.weapon.width = this.weapon.combo == 2 ? 18 : 4;
		this.states.attack = this.attackProperites.warm;
	}
}
Player.prototype.castSpell = function(name){
	if( name in this.spells && name in this.spellsUnlocked ) {
		this.spells[name].apply(this);
	}
}
Player.prototype.equipCharm = function(c){
	if( this.charm instanceof Item ){
		//Drop Item
		this.charm.sleep = Game.DELTASECOND;
		this.charm.position.x = this.position.x;
		this.charm.position.y = this.position.y;
		if(!this.charm.hasModule(mod_rigidbody)) this.charm.addModule(mod_rigidbody);
		game.addObject(this.charm);
		this.charm.trigger("unequip");
	}
	this.charm = c;
	c.trigger("equip");
}
Player.prototype.equip = function(sword, shield){
	try {	
		if( sword.isWeapon && "stats" in sword ){
			this.attackProperites.warm =  sword.stats.warm;
			this.attackProperites.strike = sword.stats.strike;
			this.attackProperites.rest = sword.stats.rest;
			this.attackProperites.range = sword.stats.range;
			this.attackProperites.sprite = sword.stats.sprite;
			if( sword.twoHanded ) shield = null;
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( "stats" in shield){
				this.attackProperites.warm *= shield.stats.speed;
				this.attackProperites.strike *= shield.stats.speed;
				this.attackProperites.rest *= shield.stats.speed;
				this.shieldProperties.duck = -5.0 + (15 - (shield.stats.height/2));
				this.shieldProperties.stand = -5.0;
				this.guard.lifeMax = shield.stats.guardlife;
				this.guard.life = this.guard.lifeMax;
				this.guard.h = shield.stats.height;
				this.shieldProperties.frame = shield.stats.frame;
				this.shieldProperties.frame_row = shield.stats.frame_row;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
		
		//Drop old weapon
		if( this.equip_sword != undefined && this.equip_sword != sword ){
			this.equip_sword.trigger("unequip",this);
			this.equip_sword.sleep = Game.DELTASECOND * 2;
			this.equip_sword.position.x = this.position.x;
			this.equip_sword.position.y = this.position.y;
			game.addObject( this.equip_sword );
		}
		
		//Drop old shield
		if( this.equip_shield != undefined && this.equip_shield != shield ){
			this.equip_shield.trigger("unequip",this);
			this.equip_shield.sleep = Game.DELTASECOND * 2;
			this.equip_shield.position.x = this.position.x;
			this.equip_shield.position.y = this.position.y;
			game.addObject( this.equip_shield );
		}
		
		if( this.equip_sword != sword && sword instanceof Item ) sword.trigger("equip", this);
		if( this.equip_shield != shield && shield instanceof Item ) shield.trigger("equip", this);
		
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		//Calculate damage and defence
		var att_bonus = 0;
		var def_bonus = 0;
		var tec_bonus = 0;
		if( this.equip_sword instanceof Item ){
			att_bonus += (this.equip_sword.bonus_att || 0);
			def_bonus += (this.equip_sword.bonus_def || 0);
			tec_bonus += (this.equip_sword.bonus_tec || 0);
		}
		if( this.equip_shield instanceof Item ){
			att_bonus += (this.equip_shield.bonus_att || 0);
			def_bonus += (this.equip_shield.bonus_def || 0);
			tec_bonus += (this.equip_shield.bonus_tec || 0);
		}
		
		var att = Math.max( Math.min( att_bonus + this.stats.attack - 1, 19), 0 );
		var def = Math.max( Math.min( def_bonus + this.stats.defence - 1, 19), 0 );
		var tech = Math.max( Math.min( tec_bonus + this.stats.technique - 1, 19), 0 );
		
		this.guard.lifeMax += 3 * def;
		this.guard.restore = 0.4 + tech * 0.05;
		
		this.damage = 5 + att * 3 + Math.floor(tech*0.5);
		this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
		this.attackProperites.rest = Math.max( this.attackProperites.rest - tech*1.6, 0);
		this.attackProperites.strike = Math.max( this.attackProperites.strike - tech*1.6, 3.5);
		this.attackProperites.warm = Math.max( this.attackProperites.warm - tech*2.0, this.attackProperites.strike);		
		
	} catch(e) {
		this.equip( this.equip_sword, this.equip_shield );
	}
}
Player.prototype.hasEquipment = function(name){
	for(var i=0; i < this.equipment.length; i++ ){
		if( this.equipment[i].name == name ) return true;
	}
	return false
}
Player.prototype.levelUp = function(index){
	if( this.stat_points > 0 ) {
		var i=0;
		for(var attr in this.stats ){
			if( i == index && this.stats[attr] < 20) {
				this.stats[attr]++;
				this.stat_points--;
				audio.play("levelup");
			}
			i++;
		}
	}
	
	this.equip( this.equip_sword, this.equip_shield );
}
Player.prototype.addWaystone = function(value){
	this.waystones += value;
	if( this.hasCharm("charm_alchemist") ) {
		this.waystones += value;
	}
}
Player.prototype.addMoney = function(value){
	this.money += value;
	if( this.hasCharm("charm_musa") ) {
		this.life = Math.min( this.life + value*2, this.lifeMax );
	}
	this.trigger("money", value);
}
Player.prototype.addXP = function(value){
	this.nextLevel = Math.floor( Math.pow( this.level,1.8 ) * 50 );
	this.prevLevel = Math.floor( Math.pow( this.level-1,1.8 ) * 50 );
	
	if(this.hasCharm("charm_wise")) value += Math.floor(value*0.3);
	
	this.experience += value;
	
	if( this.experience >= this.nextLevel ) {
		this.stat_points++;
		this.level++;
		this.life = this.lifeMax;
		this.damage_buffer = 0;
		audio.playLock("levelup2",0.1);
		
		ga("send","event", "levelup","level:" + this.level);
		
		if(Math.random() < 0.1){
			var treasure = dataManager.randomTreasure(Math.random(),[],{"locked":true});
			dataManager.itemUnlock(treasure.name);
		}
		
		//Call again, just in case the player got more than one level
		this.addXP(0);
	}
}
Player.prototype.hasCharm = function(value){
	if( this.charm instanceof Item ) {
		return this.charm.name == value;
	}
	return false;
}
Player.prototype.render = function(g,c){	
	//Render shield behind the player
	if( !this.guard.active ){
		this.rendershield(g,c);
	}
	
	//Render player
	if( this.states.roll <= 0 ){
		//Spell effects
		if( this.spellsCounters.flight > 0 ){
			var wings_offset = new Point((this.flip?8:-8),0);
			var wings_frame = 3-(this.spellsCounters.flight*0.2)%3;
			if( this.grounded ) wings_frame = 0;
			sprites.magic_effects.render(g,this.position.subtract(c).add(wings_offset),wings_frame, 0, this.flip);
		}
		if( this.spellsCounters.magic_armour > 0 ){
			this.sprite.render(g,this.position.subtract(c),this.frame, this.frame_row, this.flip, "enchanted");
		}
		
		GameObject.prototype.render.apply(this,[g,c]);
		//Render caps
		if( this.cape.active ) {
			this.cape.sprite.render(g, this.position.subtract(c), this.cape.frame, this.cape.frame_row, this.flip, this.filter);
		}
		
		//Render current sword
		var weapon_filter = this.spellsCounters.magic_strength > 0 ? "enchanted" : _player.equip_sword.filter;
		var weaponDuckPosition = new Point(0, (this.states.duck?4:0));
		this.attackProperites.sprite.render(g, this.position.add(weaponDuckPosition).subtract(c), 
			this.weapon.frame, 
			this.weapon.frame_row, 
			this.flip, 
			weapon_filter
		);
	} else {
		//When rolling, ignore flip and shader
		this.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.force.x < 0);
	}
	
	if( this.spellsCounters.thorns > 0 ){
		sprites.magic_effects.render(g,this.position.subtract(c),3, 0, this.flip);
	}
	
	//Render shield after player if active
	if( this.guard.active ){
		this.rendershield(g,c);
	}
	
	//Charge effect
	if( this.states.attack_charge > 0 ) {
		var effectPos = new Point(this.position.x, this.position.y - 16);
		EffectList.charge(g, effectPos.subtract(c), this.states.attack_charge);
	}
}



Player.prototype.rendershield = function(g,c){
	//Render shield
	
	if( this.states.roll > 0 ) return;
	
	var frame = this.guard.active ? 0 : 1;
	
	//var shield_frame = (this.states.guard_down ? 1:0) + (this.states.guard ? 0:2);
	sprites.shields.render(g, 
		this.position.subtract(c).add(new Point(0, this.guard.y)), 
		this.shieldProperties.frame + frame, 
		this.shieldProperties.frame_row, 
		this.flip,
		"heat",
		{"heat" : 1 - (this.guard.life / ( this.guard.lifeMax * 1.0))}
	);
}
Player.prototype.hudrender = function(g,c){
	/* Render HP */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,Math.max(this.life/4,0),8);
	g.closePath();
	
	/* Render Buffered Damage */
	g.beginPath();
	g.color = [0.65,0.0625,0.0,1.0];
	var buffer_start = Math.max( 8 + (this.lifeMax-this.damage_buffer) / 4, 8)
	g.scaleFillRect(
		Math.max(this.life/4,0)+8,
		8,
		-Math.min(this.damage_buffer,this.life)/4,
		8
	);
	g.closePath();
	
	/* Render Mana */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,19,25+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,20,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(8,20,Math.floor(25*(this.mana/this.manaMax)),2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,25,25+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,"$"+this.money,8, 216 );
	textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 32 );
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, 
			new Point((game.resolution.x-33)+i*4, 40),
			this.keys[i].frame,
			this.keys[i].frame_row,
			false 
		);
	}
	
	//Charm
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-(this.lifeMax*0.25 + 20),-15));
	}
	
	//Create light
	Background.pushLight( this.position.subtract(c), 240 );
}

 /* platformer\prisoner.js*/ 

Prisoner.prototype = new GameObject();
Prisoner.prototype.constructor = GameObject;
function Prisoner(x,y,n,options){
	this.constructor();
	this.sprite = sprites.prisoner;
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 48;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.phase = 0;
	this.alert = 0;
	
	try {
		if( _world.temples[dataManager.currentTemple].instance ) {
			var instance = _world.temples[dataManager.currentTemple].instance;
			this.phase = instance.prisoner;
		}
	} catch (err) {}
	
	this.progress = 0.0;
	
	this.message_help = "Help, I'm trapped in here!";
	this.message_thanks = "Thank you for your help, brave traveller. Now receive your reward.";
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.phase == 0){
			this.phase = 1;
		}
	});
	this.on("wakeup", function(){
		if( this.alert == 0 ) this.alert = 1;
	});
	this.on("sleep", function(){
		if( this.alert > 0 ) this.alert = 2;
	});
	
	this.addModule(mod_rigidbody);
	this.friction = 0.9;
	this.mass = 0;
	this.pushable = false;
}
Prisoner.prototype.update = function(){
	this.flip = this.position.x - _player.position.x > 0;
	
	if( this.phase == 1 ) { 
		this.interactive = false;
		game.pause = true;
		if( input.state("fire") == 1 ) this.phase = 2;
	}
	
	if( this.phase >= 2 && this.phase < 4 ) {
		game.pause = true;
		
		if( this.phase == 2 && this.progress > 16 ) {
			this.phase = 3;
			audio.play("pause");
			var pauseMenu = game.getObject(PauseMenu);
			pauseMenu.page = 3;
			pauseMenu.open = true;
		}
		
		if( this.phase == 3 && this.progress > 50 ) {
			this.giveSpell();
			this.phase = 4;
		}
		
		this.progress += game.deltaUnscaled;
	}
	
	if( this.phase <= 0 ){
		this.frame = ( this.frame + this.delta * 0.2 ) % 3;
	} else {
		this.frame = 3;
	}
}
Prisoner.prototype.giveSpell = function(){
	var spell_list = {
		"magic_strength" : {"name":"Magic Strength","rarity":1.0},
		"transmute" : {"name":"Transmute","rarity":0.7},
		"flight" : {"name":"Flight","rarity":0.08},
		"haste" : {"name":"Haste","rarity":0.7},
		"magic_sword" : {"name":"Magic Sword","rarity":0.3},
		"magic_armour" : {"name":"Magic Armour","rarity":0.8},
		"feather_foot" : {"name":"Feather Foot","rarity":0.9},
		"thorns" : {"name":"Thorns","rarity":0.7},
		"recover" : {"name":"Recover","rarity":0.2},
		"invincibility" : {"name":"Invincibility","rarity":0.08},
		"magic_song" : {"name":"Magic Song","rarity":0.05}
	};
	var total = 0;
	for(var i in spell_list ) if( !( i in _player.spellsUnlocked ) ){ total += spell_list[i].rarity; }
	var roll = Math.random() * total;
	for(var i in spell_list ) {
		if( !( i in _player.spellsUnlocked ) ){
			if( roll <= spell_list[i].rarity ) {
				_player.spellsUnlocked[i] = spell_list[i].name;
				audio.play("item1");
				return;
			} else {
				roll -= spell_list[i].rarity;
			}
		}
	}
}
Prisoner.prototype.postrender = function(g,c){	
	if( this.phase == 1 ){
		boxArea(g,16,16,224,64);
		textArea(g, this.message_thanks, 32,32,192);
	}
	if( this.alert == 1 && this.phase == 0 ){
		boxArea(g,16,16,224,64);
		textArea(g, this.message_help, 32,32,192);
	}
}

 /* platformer\renderers.js*/ 

var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","}","\v","\b","@"
];
var text_size = 8;
var text_height = 12;

function boxArea(g,x,y,w,h){
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(x, y, w, h );
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(x+7, y+7, w-14, h-14 );
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(x+8, y+8, w-16, h-16 );
}
function textArea(g,s,x,y,w,h){
	var _x = 0;
	var _y = 0;
	if( w != undefined ) {
		w = Math.floor(w/8);
		var last_space = 0;
		var cursor = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( cursor >= w ) {
				//add line break
				s = s.substr(0,last_space) +"\n"+ s.substr(last_space+1,s.length)
				cursor = i -last_space;
			}
			cursor++;
			if( s[i] == "\n" ) cursor = 0;
		}
	}
	
	for(var i=0; i < s.length; i++ ){
		if(s[i] == "\n") {
			_x = 0; _y++;
		} else {
			var index = textLookup.indexOf(s[i]);
			if( index >= 0 ){
				sprites.text.render(g,new Point(
					_x*window.text_size+x,
					_y*window.text_height+y
				),index);
				_x++;
			}
		}
	}
}
function textBox(g,s,x,y,w,h){
	boxArea(g,x,y,w,h);
	textArea(g,s,x+16,y+16,w-32,h-32);
}
function renderDialog(g,s, top){
	if( top == undefined ) top = 48;
	
	var width = 224;
	var height = 64;
	var left = game.resolution.x * 0.5 - width * 0.5;
	boxArea(g,left,top,width,height);
	textArea(g,s,left+16,top+16,width-32, height-32);
}

 /* platformer\shop.js*/ 

Shop.prototype = new GameObject();
Shop.prototype.constructor = GameObject;
function Shop(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.shops;
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	
	this.anim_character = 0;
	
	this.addModule(mod_talk);
	window._shop = this;
	
	this.items = [];
	this.prices = [];
	
	this.on("open",function(obj){
		game.pause = true;
		audio.playLock("pause",0.3);
	});
	this.message = [
		"This is all we got. Don't like go some place else!",
		"I sold my entire stock. Nice doing business with you."
	];
	this.cursor = 0;	
	
	if( window.dataManager.currentTown >= 0 ){
		this.restockTown(window.dataManager);
		this.frame_row = 1;
	} else {
		this.restock(window.dataManager);
	}
}
Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( input.state("jump") == 1 || input.state("pause") == 1 || input.state("select") == 1){
			audio.playLock("unpause",0.3);
			this.close();
			game.pause = false;
		}
		
		if( input.state("left") == 1 ){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = ( this.cursor == 0 ? this.cursor = this.items.length : this.cursor )-1;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("right") == 1){
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1){
			this.purchase();
		}
	}
	
	/* animation */
	this.anim_character = (this.anim_character + this.delta * 0.2 ) % 3;
}
Shop.prototype.purchase = function(){
	if( this.items[ this.cursor ] instanceof Item ){
		if( _player.money >= this.getPrice(this.cursor) ) {
			var item = this.items[ this.cursor ];
			item.gravity = 1.0;
			item.interactive = true;
			this.items[ this.cursor ] = null;
			_player.money -= this.getPrice(this.cursor);
			audio.play("equip");
			
			for(var i=0; i < this.items.length; i++ ){
				this.cursor = (this.cursor+1) % this.items.length;
				if( this.items[ this.cursor ] instanceof Item ) break;
			}
			
			return true;
		} else {
			audio.play("negative");
		}
	}
	return false;
}
Shop.prototype.restock = function(data){
	this.items = new Array(3);
	this.prices = new Array(3);
	
	for(var i=0; i < this.items.length; i++) {
		tags = ["shop"];
		if(i==1) tags = ["goods"];
		if(i==2) tags = ["stone"];
		
		var treasure = data.randomTreasure(Math.random(),tags);
		treasure.remaining--;
		var x = this.position.x + (i*32) + -40;
		
		this.items[i] = new Item(x, this.position.y-80, treasure.name);
		this.prices[i] = treasure.price;
	
		if( !this.items[i].hasModule(mod_rigidbody) ) this.items[i].addModule(mod_rigidbody);
		this.items[i].gravity = 0;
		this.items[i].interactive = false;
		game.addObject(this.items[i]);
	}
}
Shop.prototype.restockTown = function(data){
	this.items = new Array(3);
	this.prices = new Array(3);
	var s = new Seed(_world.towns[dataManager.currentTown].seed);
	
	for(var i=0; i < this.items.length; i++) {
		tags = ["weapon"];
		
		var treasure = data.randomTreasure(s.random(),tags);
		var x = this.position.x + (i*32) + -40;
		
		/*
		for(var j=0; j<_player.equipment.length; j++){
			if( treasure != null ) {
				if( _player.equipment[j].name == treasure.name ){
					treasure = null;
					break;
				} else {
					for(var k=0; k<i; k++){
						if(this.items[k] != null && treasure.name == this.items[k].name){
							treasure = null;
							break;
						}
					}
				}
			}
		}
		*/
		
		//treasure.remaining--;
		if( treasure != null ) {
			this.items[i] = new Item(x, this.position.y-80, treasure.name);
			this.prices[i] = treasure.price;
		
			if( !this.items[i].hasModule(mod_rigidbody) ) this.items[i].addModule(mod_rigidbody);
			this.items[i].gravity = 0;
			this.items[i].interactive = false;
			game.addObject(this.items[i]);
		} else {
			this.items[i] = null;
		}
	}
}
Shop.prototype.getPrice = function(i){
	var price_adjust = 1.0;
	if( _player.hasCharm("charm_barter") ) price_adjust *= 0.7;
	return Math.max( Math.floor( this.prices[i] * price_adjust ), 1);
}
	
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	sprites.retailers.render(g,this.position.subtract(c),this.anim_character,0,false);
}

Shop.prototype.postrender = function(g,c){	
	if( this.open > 0 ){		
		this.soldout = true;
		for(var i=0; i < this.items.length; i++ ){
			if( this.items[i] instanceof Item ) {
				this.soldout = false;
				var p = this.items[i].position.subtract(c);
				if( i == this.cursor ) boxArea(g, p.x-16,p.y-16,32,32);
				textArea(g, "$"+this.getPrice(i), p.x-16, p.y+12);
			}
		}
		
		if( this.soldout ) {
			renderDialog(g,this.message[1],16);
		} else {
			if( this.items[this.cursor] instanceof Item && "message" in this.items[this.cursor] ){
				renderDialog(g,this.items[this.cursor].getMessage(),16);
			} else {
				renderDialog(g,this.message[0],16);
			}
		}
	}
}

 /* platformer\Spawn.js*/ 

Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = 16;
	this.height = 16;
	
	this.on("open",function(obj){
	});
	
	ops = ops || {};
	
	this.difficulty = ops.difficulty || dataManager.currentTemple;
	this.theme = ops.theme || "default";
	
	if( "tags" in ops ){
		this.tags = ops.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	
	this.enemies = [];
	
	this.spawn();
}

Spawn.prototype.spawn = function(){
	try{
		if(!(this.theme in Spawn.enemies )) {
			this.theme = "default";
		}
		
		var list = Spawn.enemies[this.theme];
		var indices = new Array();
		this.enemies = new Array();
		
		for(var i=0; i < list.length; i++){
			if( 
				list[i].difficulty[0] <= this.difficulty && 
				list[i].difficulty[1] >= this.difficulty && 
				this.tags.intersection(list[i].tags).length == this.tags.length
			){
				indices.push( i );
			}
		}
		var selected = list[indices[ Math.floor( Math.random() * indices.length ) ]];
		
		for(var j=0; j < selected.enemies.length; j++){
			var name = selected.enemies[j];
			try {
				var object = new window[ name ]( 
					this.position.x + j * 24,
					this.position.y 
				);
				game.addObject( object );
				this.enemies.push( object );
			} catch (e) {
				console.error( "cannot create object: " + name );
			}
		}
	} catch( err ) {
		console.error( "No valid enemy matching tags: " + this.tags );
	}
}

Spawn.enemies = {
	"boss" : [
		{"tags":[],"difficulty":[0,0],"enemies":["Chort"]},
		{"tags":[],"difficulty":[1,1],"enemies":["Marquis"]},
		{"tags":[],"difficulty":[2,2],"enemies":["Minotaur"]},
		{"tags":[],"difficulty":[2,2],"enemies":["Ammit"]},
		{"tags":[],"difficulty":[3,3],"enemies":["Garmr"]},
		{"tags":[],"difficulty":[3,3],"enemies":["Zoder"]},
		{"tags":[],"difficulty":[4,4],"enemies":["Poseidon"]}
	],
	"default" : [
		//{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]},
		
		{"tags":["miniboss"],"difficulty":[0,0],"enemies":["Skeleton"]},
		{"tags":["miniboss"],"difficulty":[0,0],"enemies":["Bear"]},
		{"tags":["miniboss"],"difficulty":[1,2],"enemies":["Oriax"]},
		{"tags":["miniboss"],"difficulty":[1,99],"enemies":["Knight"]},
		{"tags":["miniboss"],"difficulty":[3,3],"enemies":["Yeti"]},
		{"tags":["miniboss"],"difficulty":[3,4],"enemies":["Igbo"]},
		{"tags":["miniboss"],"difficulty":[4,99],"enemies":["ChazBike"]},
		{"tags":["miniboss"],"difficulty":[3,99],"enemies":["Baller"]},
		
		{"tags":["major"],"difficulty":[1,3],"enemies":["Skeleton"]},
		{"tags":["major"],"difficulty":[0,2],"enemies":["Bear"]},
		{"tags":["major"],"difficulty":[3,4],"enemies":["Oriax"]},
		{"tags":["major","ranged"],"difficulty":[2,99],"enemies":["Chaz"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Igbo"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Yeti"]},
		
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Flederknife"]},
		{"tags":["minor"],"difficulty":[1,99],"enemies":["HammerMathers"]},
		{"tags":["minor"],"difficulty":[3,99],"enemies":["Ratgut"]},
		{"tags":["minor"],"difficulty":[4,99],"enemies":["Skeleton"]},
		//{"tags":["major"],"difficulty":[0,99],"enemies":["Malsum"]},
		{"tags":["minor"],"difficulty":[4,99],"enemies":["Oriax"]},
		{"tags":["minor"],"difficulty":[0,2],"enemies":["Beaker"]},
		{"tags":["minor","ledge"],"difficulty":[0,1],"enemies":["Shell"]},
		{"tags":["minor","ledge"],"difficulty":[0,99],"enemies":["Axedog"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Batty"]},
		{"tags":["minor","flying"],"difficulty":[0,3],"enemies":["Amon"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Laughing","Laughing","Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Ghoul"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]}
		
		
	]
};

 /* platformer\start.js*/ 

function game_start(g){
	var shaders = window.shaders;
	
	new Material(g.g, "default", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "hurt", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"],"settings":{"u_color":[0.8,0.1,0.0,1.0]}} );
	new Material(g.g, "gold", {"fs":shaders["fragment-greytocolor"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,0.9,0.2,1.0]}} );
	new Material(g.g, "color", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "heat", {"fs":shaders["fragment-heat"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "blur", {"fs":shaders["2d-fragment-blur"],"vs":shaders["2d-vertex-scale"]} );
	new Material(g.g, "enchanted", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,0.0,0.3,1.0]}} );
	new Material(g.g, "item", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-shader"]} );
	
	new Material(g.g, "t1", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.1]}} );
	new Material(g.g, "t2", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[-0.1]}} );
	new Material(g.g, "t3", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.2]}} );
	new Material(g.g, "t4", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.3]}} );
	new Material(g.g, "t5", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.5]}} );
	
	new Material(g.g, "backbuffer", {"fs":shaders["2d-fragment-shader"],"vs":shaders["back-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "solid", {"fs":shaders["2d-fragment-solid"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "lightbeam", {"fs":shaders["2d-fragment-lightbeam"],"vs":shaders["2d-vertex-shader"]} );
	
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
}

 /* platformer\tiles.js*/ 

window.BLANK_TILE = 16;

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 0.5);
	this.width = this.height = 16;
	this.frame = 6;
	this.frame_row = 11;
	this.visible = false;
	
	this.center = new Point(this.position.x, this.position.y);
	
	this.timer = 20
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.4);
		}
	});
	this.on("wakeup",function(){
		this.visible = true; 
		this.active = false;
		this.position.x = this.center.x;
		this.position.y = this.center.y;
		game.setTile(this.position.x, this.position.y, game.tileCollideLayer, window.BLANK_TILE);
		this.timer = 20;
	});
}
CollapseTile.prototype.update = function(){
	if( this.active ) {
		//wobble
		this.position.x = this.center.x + ( -1 + Math.random() * 2 );
		this.position.y = this.center.y + ( -1 + Math.random() * 2 );
		this.timer -= this.delta;
		
		if(this.timer < 0) this.hide();
	}
}
CollapseTile.prototype.hide = function(){
	this.active = false;
	this.visible = false;
	this.position.x = this.center.x;
	this.position.y = this.center.y;
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
}
CollapseTile.prototype.destroy = function(){
	game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0);
	GameObject.prototype.destroy.apply(this);
}

BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y, d, ops){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	this.death_time = Game.DELTASECOND * 0.15;
	
	ops = ops || {};
	if( "item" in ops ) {
		this.item = new Item(x,y,ops.item);
	}
	
	this.on("struck", function(obj,pos,damage){
		if( obj instanceof Player){
			//break tile
			this.life = 0;
		}
	});
}
BreakableTile.prototype.update = function(){
	if( this.life <= 0 ) this.death_time -= this.delta;
	
	if( this.death_time <= 0 ) {
		var tile = game.getTile(this.position.x, this.position.y );
		if( tile != 0 && tile != BreakableTile.unbreakable ) {
			game.addObject(new EffectExplosion(this.position.x, this.position.y,"crash"));
			game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 0 );
			if( this.item instanceof Item){
				this.item.position.x = this.position.x;
				this.item.position.y = this.position.y;
				game.addObject( this.item );
			}
			//Set off neighbours
			var hits = game.overlaps(new Line(
				this.position.x - 8, this.position.y - 8,
				this.position.x + 24, this.position.y + 24
			));
			for(var i=0; i<hits.length; i++) if( hits[i] instanceof BreakableTile && hits[i].life > 0 ) {
				hits[i].trigger("struck", _player, this.position, 1);
			}
		}
		this.destroy();
	}
}

BreakableTile.unbreakable = 232;

 /* platformer\titlecard.js*/ 

TitleCard.prototype = new GameObject();
TitleCard.prototype.constructor = GameObject;
function TitleCard(x,y,p,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 128;
	
	this.progress = 0.0;
	this.play = false;
	this.text = "Place holder text";
	
	//Get title text
	try{
		var ct = dataManager.currentTemple;
		this.text = i18n("templenames")[ct];
	} catch (e){}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.play = true;
		}
	});
}

TitleCard.prototype.idle = function(g,c){return true;}

TitleCard.prototype.postrender = function(g,c){
	if( this.play ){
		this.progress += this.delta / (Game.DELTASECOND*3);
		
		var border = Math.min(Math.sin(Math.PI*this.progress)*3, 1) * 64;
		g.color = [0.0,0.0,0.0,0.5];
		g.scaleFillRect(0, 0, game.resolution.x, border);
		g.scaleFillRect(0, game.resolution.y-border, game.resolution.x, border);
		
		textArea(g,
			this.text,
			game.resolution.x * 0.5 - this.text.length * window.text_size * 0.5,
			game.resolution.y * 0.5 - window.text_size * 0.5
		);
		
		if( this.progress >= 1.0 ) {
			this.destroy();
		}
	}
}

 /* platformer\villager.js*/ 

Villager.prototype = new GameObject();
Villager.prototype.constructor = GameObject;
function Villager(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.start_x = x;
	this.sprite = sprites.characters;
	this.town = t || _world.towns[1];
	this.builder = false;
	
	o = o || {};
	
	this.state = 0;
	this.speed = 0.5 + Math.random() * 0.9;
	
	this.addModule(mod_talk);
	
	this.path = Math.floor(Math.random()*3); //0 back and forth, 1 loop, 2 still
	this.direction = Math.random()>0.5?1:-1;
	
	var m = Villager.getMessage(this.town);
	
	this.message = m.message;
	try{
		this.builder = "builder" in o;
		if( "path" in o ){
			this.path = 1 * o.path;
		}
		if( "message" in o ){
			this.message = i18n(o.message);
			if(!(this.message instanceof Array)){
				this.message = [this.message];
			}
		}
		if( this.builder ) {
			this.sprite = sprites.characters2;
			this.path = 2;
		}
	} catch(err){}

	this.base_frame = 0;
	this.frame_row = 1;
	
	if(m.frames.length > 0 ){
		var f = m.frames[ Math.floor( Math.random()*m.frames.length ) ];
		this.base_frame = f[0];
		this.frame_row = f[1];
	}
	
	this.frame = this.base_frame;
}
Villager.prototype.update = function(){
	if( this.open ){
		game.pause = true;
		if(input.state("fire") == 1){
			this.state++;
			if( this.state >= this.message.length ){
				this.state = 0;
				this.close();
				game.pause = false;
			}
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 || input.state("select") == 1){
			this.close();
			game.pause = false;
		}
	} else {
		if( this.builder ) {
			this.frame = (this.frame + this.delta * 0.125) % 3;
			this.frame_row = 3;
			this.direction = 0;
		} else if( this.path == 0 ){
			if(this.position.x-this.start_x < -64) this.direction = 1;
			if(this.position.x-this.start_x > 64) this.direction = -1;
		} else if( this.path == 1) {
			if(this.direction < 0 && this.position.x+32 < _player.lock.start.x) this.position.x = _player.lock.end.x + 32;
			if(this.direction > 0 && this.position.x-32 > _player.lock.end.x) this.position.x = _player.lock.start.x - 32;
		} else {
			this.direction = 0;
		}
		this.position.x +=this.direction * this.delta * this.speed;
		this.flip = this.direction < 0;
		
		this.frame = Math.max( (this.frame + Math.abs(this.direction) * this.delta * this.speed * 0.2) % (this.base_frame+3), this.base_frame);
	}
}
Villager.prototype.postrender = function(g,c){	
	if( this.open > 0 ) {
		var m = this.message[this.state].replace("%TOWNNAME%",this.town.name);
		renderDialog(g, m);
	}
}
Villager.prototype.idle = function(){}
Villager.getMessage = function(town){
	return Villager.TextOptions[0];
	
	var total = 0.0;
	for(var i=0; i < Villager.TextOptions.length; i++) {
		var conditions = Villager.TextOptions[i].conditions;
		if(
			(!("nation" in conditions ) || conditions.nation == town.nation) &&
			(!("faith" in conditions ) || conditions.faith == town.faith) &&
			(!("capital" in conditions ) || conditions.capital == town.capital) &&
			(!("min_size" in conditions ) || conditions.min_size <= town.size) &&
			(!("max_size" in conditions ) || conditions.max_size >= town.size) &&
			(!("min_town" in conditions ) || conditions.min_town <= town.id) &&
			(!("max_town" in conditions ) || conditions.max_town >= town.id)
		) {
			total += Villager.TextOptions[i].rarity;
		}
	}
	var roll = Math.random() * total;
	for(var i=0; i < Villager.TextOptions.length; i++) {
		var conditions = Villager.TextOptions[i].conditions;
		if(
			(!("nation" in conditions ) || conditions.nation == town.nation) &&
			(!("faith" in conditions ) || conditions.faith == town.faith) &&
			(!("capital" in conditions ) || conditions.capital == town.capital) &&
			(!("min_size" in conditions ) || conditions.min_size <= town.size) &&
			(!("max_size" in conditions ) || conditions.max_size >= town.size) &&
			(!("min_town" in conditions ) || conditions.min_town <= town.id) &&
			(!("max_town" in conditions ) || conditions.max_town >= town.id)
		) if(roll <= Villager.TextOptions[i].rarity) {
			return Villager.TextOptions[i];
		} else {
			roll -= Villager.TextOptions[i].rarity;
		}
	}
	return Villager.TextOptions[0];
}
Villager.TextOptions = [
{"rarity":1.0,"frames":[],"conditions":{"capital":true,"faith":1,"nation":1,"min_size":0,"max_size":5},"message":["Hello."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3],[0,4],[0,5]],"conditions":{},"message":["Good day."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["Good luck on your journey. Bring your father back safely."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["No matter how far you go, you'll always have a home here."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["When you return we'll have a celebration in your honour."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["All of %TOWNNAME% wishes you luck on your journey."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3],[0,4],[0,5]],"conditions":{"min_town":1,"max_size":1},"message":["What are you?"]},
{"rarity":1.0,"frames":[[0,1]],"conditions":{"min_town":1},"message":["You're a strange looking creature, aren't you?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["Welcome to the %TOWNNAME%."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["It's a fine day, is it not?"]},
{"rarity":1.0,"frames":[[0,4],[0,5]],"conditions":{"min_town":1},"message":["You're one of those creatures. You stole my brother.","I want him back!"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["My son was taken by the trance. I hope he's safe."]},
{"rarity":1.0,"frames":[[0,4],[0,5]],"conditions":{"min_town":4},"message":["Why are all the people taken by the trance always so weird?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":4,"min_size":2},"message":["My neighbour was taken by the trance.","He was a weird one. But he meant no harm to anyone.","He didn't deserve that."]},
{"rarity":1.0,"frames":[[0,1]],"conditions":{"min_town":3},"message":["My husband was taken by the trance.","What was worse is a few weeks later one of your kind broke into my home.","We put it right. It was hanged in the town square."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["Poor creature, is there any hope for something like you?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["Get to the church, maybe God can still save your soul."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["I will pray for you, poor forsaken beast."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Get away from me, vile thing."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Your kind is a blight to this world."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Do the only decent thing, end your sorry life."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":2},"message":["Your presence is corrupting. Get out of our fair town."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":2},"message":["The mere sight of you is harmful to my spirit."]},
{"rarity":1.0,"frames":[[0,2],[0,3]],"conditions":{"min_town":1,"nation":2},"message":["Strong warriors like you would serve well in the militias."]},
{"rarity":1.0,"frames":[[0,2],[0,3]],"conditions":{"min_town":1,"nation":2},"message":["You hold your weapon well. A sign of a true warrior."]}
];

 /* platformer\waterfall.js*/ 

Waterfall.prototype = new GameObject();
Waterfall.prototype.constructor = GameObject;
function Waterfall(x,y,t,o){
	this.constructor();
	this.position.x=x;
	this.position.y=y;
	this.width = 128;
	this.height = 240;
	this.sprite = sprites.waterfall;
	this.frame = 0;
	this.frame_row = t;
	this.zIndex = 1;
}
Waterfall.prototype.update = function(){
	this.frame = (this.frame+0.1*this.delta)%3;
}
Waterfall.prototype.render = function(){}
Waterfall.prototype.prerender = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\WaystoneChest.js*/ 

WaystoneChest.prototype = new GameObject();
WaystoneChest.prototype.constructor = GameObject;
function WaystoneChest(x,y,d,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.waystones;
	this.width = 32;
	this.height = 48;
	options = options || {};
	
	this.addModule(mod_talk);
	this.door = "door" in options;
	this.frame = 0;
	this.frame_row = 1;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16)
	];
	
	this.on("added",function(){
		if(this.door){
			this.frame_row = this.frame = 0;
			for(var i=0; i < this.door_blocks.length; i++){
				game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, window.BLANK_TILE);
			}
		}
	});
}
WaystoneChest.prototype.update = function(g,c){
	if( !this.interactive ) {
		this.frame = Math.min( this.frame + this.delta * 0.4, 3);
	}
	
	if( this.open > 0 ) {
		if( _player.waystones > 0 ) {
			_player.waystones -= 1;
			if(this.door){
				for(var i=0; i < this.door_blocks.length; i++){
					game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
				}
				Item.drop(this,15,Game.DELTASECOND);
			} else {
				if( Math.random() > 0.2 ) {
					treasure = dataManager.randomTreasure(Math.random(), ["chest"]);
					treasure.remaining--;
					var item = new Item(this.position.x, this.position.y, treasure.name);
					item.sleep = Game.DELTASECOND;
					game.addObject(item);
				} else {
					Item.drop(this,15,Game.DELTASECOND);
				}
			}
			audio.play("open");
			this.close();
			this.interactive = false;
		} else {
			audio.play("negative");
			this.close();
		}
	}
}

 /* platformer\well.js*/ 

Well.prototype = new GameObject();
Well.prototype.constructor = GameObject;
function Well(x,y,t){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 72;
	this.height = 72;
	
	this.addModule(mod_talk);
	this.unlocked = true;
	this.total = 0;
	
	this.progress = 0;
	this.coin = new Point();
	
	this.on("collideObject", function(obj){
		var dir = this.position.y - obj.position.y;
		if( dir < -24 && obj instanceof Player && !this.unlocked ) {
			obj.invincible = -999;
			obj.position.x = obj.checkpoint.x;
			obj.position.y = obj.checkpoint.y;
			obj.hurt( this, Math.floor( obj.lifeMax * .2) );
		}
	});
	
}
Well.prototype.update = function(){
	if( this.open ){
		if( _player.money > 0 ) {
			_player.money--;
			this.total++;
			audio.play("coin");
			this.progress = 1.0;
			this.coin = new Point(_player.position.x, _player.position.y);
			
			if(!this.unlocked && this.total >= 100) {
				this.unlocked = true;
			} else if(Math.random() < 0.03){
				var name = "life";
				
				if(Math.random() < 0.5) name = "waystone";
				else if(Math.random() < 0.2) name = dataManager.randomTreasure(Math.random(), ["chest"]).name;
				else if(Math.random() < 0.01) name = "life_up";
				
				var item = new Item(this.position.x, this.position.y - 48, name);
				item.sleep = Game.DELTASECOND;
				item.gravity = 0;
				item.pushable = false;
				item.force = new Point();
				game.addObject(item);
			}
		} else {
			audio.play("negative");
		}
		this.close();
	}
	
	this.progress -= this.delta / Game.DELTASECOND;
}
Well.prototype.render = function(g,c){
	if(this.progress > 0 ){
		var fall = (0.66 - this.progress)*20;
		var frame = (this.progress*10) % 3;
		this.coin.x = Math.lerp(this.position.x, this.coin.x, this.progress);
		this.coin.y += fall;
		
		sprites.items.render(g,this.coin.subtract(c),7+frame,1);
	}
}
Well.prototype.idle = function(){}

 /* platformer\worldmap.js*/ 

WorldMap.prototype = new GameObject();
WorldMap.prototype.constructor = GameObject;
function WorldMap(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	this.zIndex = 999;
	this.speed = 2.5;
	this.seed = "" + Math.random();
	//this.seed = "0.3662224621511996";
	this.active = true;
	this.mode = 0;
	
	this.dreams = 0;
	this.lastDream = 0;
	this.checkpoint = 0;
	
	window._world = this;
	new Player(0,0);
	
	this.camera = new Point();
	this.player_start = new Point(16*56,16*26);
	this.player = new Point(this.player_start.x,this.player_start.y);
	this.rest = 0;
	
	this.width = 112;
	this.height = 64;
	
	this.quests = {
		"q1" : 0
	}
	
	/*
	var block_list = [0,37,38,39,40,64,65,66,67,68,69,87,88,103,104];
	for(var i=0;i<this.tiles[0].length;i++){
		if(this.tiles[2][i]==0 && block_list.indexOf(this.tiles[1][i]-1) >= 0){
			this.tiles[2][i] = this.tiles[1][i];
		}
	}*/
	
	this.temples = [];
	for(var i=0; i<6; i++) this.temples.push({ "number":i, "complete":false, "position":new Point(), "seed":i+this.seed });
	this.temples[0].position.x = 47*16; this.temples[0].position.y = 22*16;
	this.temples[1].position.x = 16*16; this.temples[1].position.y = 20*16;
	this.temples[2].position.x = 31*16; this.temples[2].position.y = 14*16;
	this.temples[3].position.x = 59*16; this.temples[3].position.y = 18*16;
	this.temples[4].position.x = 27*16; this.temples[4].position.y = 38*16;
	this.temples[5].position.x = 84*16; this.temples[5].position.y = 59*16; 
	//this.temples[6].position.x = 52*16; this.temples[6].position.y = 1*16; this.temples[6].complete = true;
	//this.temples[7].position.x = 30*16; this.temples[7].position.y = 14*16; this.temples[7].complete = true;
	//this.temples[8].position.x = 66*16; this.temples[8].position.y = 36*16; this.temples[8].complete = true;
	
	this.towns = [];
	this.playerIcon = null;
	
	for(var i=0; i<1; i++) this.towns.push({ "id":i, "nation":Math.floor(Math.random()*3), "faith":Math.floor(Math.random()*3), "capital":false, "position":new Point(), "size":Math.floor(1+Math.random()*3), "seed":i+this.seed });
	this.towns[0].position.x = 36*16; this.towns[0].position.y = 27*16; this.towns[0].name = "Aghalee"; size = 1;
	
	this.locations = [
		{"position":new Point(61*16,59*16), "map":3}
	]
	
	this.town = {
		"people" : 5,
		"money" : 0,
		"science" : 0,
		"buildings" : {
			"hall" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : true },
			"mine" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"lab" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"hunter" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"mill" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"library" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"inn" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : false },
			"farm" : { "progress" : 1, "people" : 0, "unlocked" : true, "complete" : true },
			"smith" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : false },
			"bank" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false }
		}
	};
	this.loadTown();
	
	this.animation = 0;
	
	this.on("activate", function(){
		audio.playAs("music_world", "music");
		this.active = true;
		//game.addObject( this );
		
		/* Save instance of current temple */
		if( dataManager.currentTemple >= 0 && dataManager.currentTemple < this.temples.length ) {
			var shops = [];
			for(var i=0; i < WorldMap.Shops.length; i++) shops = shops.concat( game.getObjects(window[WorldMap.Shops[i]]) );
			var instance = {
				"keys" : _player.keys,
				"items" : game.getObjects(Item),
				"map" : game.getObject(PauseMenu).map_reveal,
				"shops" : shops
			};
			this.temples[dataManager.currentTemple].instance = instance;
		}
		
		this.showMap();
		game.pause = false;
	});
	
	this.on("reset", function(){
		if( this.mode == 0 ) {
			var keys = _player.keys;
			_player.life = _player.lifeMax;
			_player.mana = _player.manaMax;
			_player.position.x = 128;
			_player.position.y = 200;
			_player._death_clock = Number.MAX_VALUE;
			_player.interactive = true;
			_player.lock_overwrite = false;
			game.addObject(_player);
			_player.keys = keys;
			audio.playAs(audio.alias["music"],"music");
			try{ 
				game.pause = false;
				game.getObject(PauseMenu).open = false; 
			} catch(err){}
		} else {
			game.clearAll();
			this.seed = this.seed = "" + Math.random();
			for(var i=0; i < this.temples.length; i++ ) {
				this.temples[i].complete = false;
				this.temples[i].seed = i+this.seed;
				delete this.temples[i].instance;
			}
			this.player = new Point(this.player_start.x,this.player_start.y);
			
			var im = new ItemMenu(dataManager.unlocks);
			im.on("destroy", function(){
				new Player(0,0);
				_world.trigger("activate");
			});
			game.addObject(im);
			
			dataManager.reset();
		}
	});
}
WorldMap.prototype.buildtiles = function(){
	game.tiles = [
		new Array(window._map_world.front.data.length),
		window._map_world.back.data,
		window._map_world.front.data,
	];
	if( this.checkpoint >= 2 ){
		this.appendTiles(window._map_world.road0,1);
	}
	if( this.checkpoint >= 5 ){
		this.appendTiles(window._map_world.road1,1);
	}
	if( this.checkpoint >= 3 ){
		this.appendTiles(window._map_world.island0,1);
		this.appendTiles(window._map_world.island0front,2);
	}
	if( this.checkpoint >= 4 ){
		this.appendTiles(window._map_world.island1,1);
		this.appendTiles(window._map_world.island1front,2);
	}
}
WorldMap.prototype.appendTiles = function(layer,index){	
	for(var i=0; i < layer.data.length; i++){
		var x = layer.xoff + Math.floor(i%layer.width);
		var y = layer.yoff + Math.floor(i/layer.width);
		var j = x + y * this.width;
		if( layer.data[i] > 0 ){
			game.tiles[index][j] = layer.data[i];
			if (layer.data[i] == 143){
				game.tiles[index][j] = 0;
			}
		}
	}
}

WorldMap.prototype.showMap = function(){
	game.clearAll();
	game.addObject(this);
	this.buildtiles();
	game.tileDimension = new Line(0,0,this.width,this.height);
	game.bounds = new Line(0,0,this.width*16,this.height*16);
	game.tileSprite = sprites.world;
	
	game.addObject(new WorldPlayer(this.player.x, this.player.y));
	
	for(var i=0; i<window._map_world.objects.length; i++){
		var objdata = window._map_world.objects[i];
		var obj = new window[objdata[2]](objdata[0], objdata[1],"none",objdata[3]);
		game.addObject(obj);
	}
	/*
	for(var i=0; i<this.towns.length; i++){
		var wl = new WorldLocale(this.towns[i].position.x, this.towns[i].position.y,"town");
		wl.index = i; wl.frame = 2 + this.towns[i].size; wl.frame_row = 7;
		game.addObject(wl);
	}
	for(var i=0; i<this.locations.length; i++){
		var wl = new WorldLocale(this.locations[i].position.x, this.locations[i].position.y,"map");
		wl.index = this.locations[i].map; wl.visible = false;
		game.addObject(wl);
	}
	
	
	for(var i=0; i<50; i++){
		game.addObject(new WorldEncounter(Math.random()*16*this.width, Math.random()*16*this.height));
	}*/
}
WorldMap.prototype.encounter = function(){
	if(!this.active) return;
	
	this.active = false;
	var pl = game.getObject(WorldPlayer);
	this.player.x = pl.position.x;
	this.player.y = pl.position.y;
	
	var temple = dataManager.temples[ Math.floor(Math.random() * 3) ];
	dataManager.currentTemple = Math.floor(Math.random() * 2);
	
	game.clearAll();
	game.tiles = [ new Array(96*15), new Array(95*15) ];
	game.tileDimension = new Line(0,0,96,15);
	game.bounds = new Line(0,0,96*16,15*16);
	game.tileSprite = sprites.town;
	for(var x=0; x < 96; x++) for(var y=0; y<15;y++){
		var i = x + 96*y;
		if( y==0) game.tiles[1][i] = window.BLANK_TILE;
		if( y==13) game.tiles[1][i] = 177 + (x%8);
		if( y>13) game.tiles[1][i] = 193 + (x%8);
	}
	_player.position.x = 768;
	_player.position.y = 192;
	
	background = new Background(0,0);
	background.walls = false;
	game.addObject(background);
	
	game.addObject(_player);
	game.addObject(new Exit(8,120));
	game.addObject(new Exit(1528,120));
	game.addObject(new PauseMenu());
	_player.lock = game.bounds;
	_player.lock_overwrite = false;
	
	for(var x=32; x < 96*16; x+=64){
		if( Math.random() < 0.4 && Math.abs(x-768) > 80 ) {
			var monster;
			if( Math.random() < 0.3 ) {
				monster = temple.majormonster[Math.floor(Math.random()*temple.majormonster.length)];
			} else {
				monster = temple.minormonster[Math.floor(Math.random()*temple.minormonster.length)];
			}
			game.addObject(new window[monster](x, 180));
		}		
	}
	dataManager.currentTemple = -1;
	audio.playAs("music_temple1", "music");
}
	
WorldMap.prototype.update = function(){
	this.animation += this.delta * 0.1;
	this.rest -= this.delta;
}
WorldMap.prototype.enterLocale = function(locale, dir){
	if( !this.active ) return;
	if( this.rest > 0 ){
		this.rest = Game.DELTASECOND * 0.25;
		return;
	}
	var type = locale.type;
	var i = locale.index;
	var avatar = window.game.getObject(WorldPlayer);
	
	if( type == "boat" ){
		objs = window.game.getObjects(WorldLocale);
		for(var i=0; i<objs.length;i++){
			if(objs[i].type=="boat" && objs[i].index==locale.gotoIndex){
				avatar.position.x = objs[i].position.x;
				avatar.position.y = objs[i].position.y;
			}
		}
		this.rest = Game.DELTASECOND * 0.25;
	} else if( type == "temple" && !this.temples[i].complete ){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		dataManager.randomLevel(game, i, this.temples[i].seed);
		audio.playAs("music_temple1", "music");
	} else if(type == "town"){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		dataManager.randomTown(game, this.towns[i]);
		audio.playAs("music_town", "music");
	} else if(type == "map"){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		//Load new map
		dataManager.loadMap(
			locale.index,
			mergeLists(locale.properties,{"direction":dir})
		);
		audio.playAs("music_town", "music");
	}
}
WorldMap.prototype.passable = function(x,y){
	var block_list = [0,37,38,39,40,64,65,66,67,68,69,87,88,103,104];
	var index = Math.floor(x/16) + Math.floor((y/16)*this.width);
	var t = this.tiles[0][index]-1;
	var r = this.tiles[1][index];
	return block_list.indexOf( t ) < 0 && r == 0;
}
WorldMap.prototype.idle = function(){}

WorldMap.prototype.saveTown = function(){
	localStorage.setItem("town_people", this.town.people);
	localStorage.setItem("town_money", this.town.money);
	localStorage.setItem("town_science", this.town.science);
	for( var i in this.town.buildings ) {
		var building = this.town.buildings[i];
		localStorage.setItem("town_building_"+i+"_complete", building.complete);
		localStorage.setItem("town_building_"+i+"_people", building.people);
		localStorage.setItem("town_building_"+i+"_progress", building.progress);
		localStorage.setItem("town_building_"+i+"_unlocked", building.unlocked);
	}
}

WorldMap.prototype.loadTown = function(){
	if( localStorage.hasOwnProperty("town_people") ) {
		
		this.town.people = localStorage.getItem("town_people")-0;
		this.town.money = localStorage.getItem("town_money")-0;
		this.town.science = localStorage.getItem("town_science")-0;
		
		for( var i in this.town.buildings ) {
			if( localStorage.hasOwnProperty("town_building_"+i+"_complete") ) {
				var building = this.town.buildings[i];
				building.complete = localStorage.getItem("town_building_"+i+"_complete") == "true";
				building.people = localStorage.getItem("town_building_"+i+"_people")-0;
				building.progress = localStorage.getItem("town_building_"+i+"_progress")-0;
				building.unlocked = localStorage.getItem("town_building_"+i+"_unlocked")  == "true";
			}
		}
	}
}

WorldMap.prototype.worldTick = function(){
	//Generate money
	this.town.money += 10;
	if( this.town.buildings.mine.complete ) {
		this.town.money += this.town.buildings.mine.people * 10;
	}
	
	//Increase scene
	var freePeople = this.town.people;
	var moneyNeeded = 0;
	for(var i in this.town.buildings){
		freePeople -= this.town.buildings[i].people;
		moneyNeeded += this.town.buildings[i].people * 20;
	}
	this.town.science += freePeople;
	
	var productionFactor = Math.min(this.town.money / moneyNeeded, 1.0);
	this.town.money = Math.max(this.town.money - moneyNeeded, 0);
	
	//Increase population
	this.town.people += Math.floor( 
		productionFactor*this.town.buildings.farm.people * 0.5 
	);
	
	//Increase production
	for(var i in this.town.buildings){
		var building = this.town.buildings[i];
		var production = productionFactor * building.people * 3;
		building.progress += Math.floor( production );
		
		if( !building.complete && building.progress > 30 ) {
			this.town.buildings[i].complete = true;
			this.town.buildings[i].people = 0;
		}
	}
	
	this.saveTown();
}

WorldMap.Shops = [
	"Alter",
	"Arena",
	"Prisoner",
	"Shop",
	"WaystoneChest"
];

WorldPlayer.prototype = new GameObject();
WorldPlayer.prototype.constructor = GameObject;
function WorldPlayer(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	//this.origin = new Point(0.2,0.2);
	
	this.height = this.width = 12;
	this.sprite = sprites.world;
	this.speed = 0.5;
	this.zIndex = 2;
	
	this.addModule(mod_rigidbody);
	this.gravity = 0;
	this.friction = 0;
	
	this.frame = 9;
	this.frame_row = 7;
}
WorldPlayer.prototype.idle = function(){}
WorldPlayer.prototype.update = function(){
	
	this.force = this.force.scale( 1.0 - (0.2*this.delta) );
	if( true ){
		if( input.state("up") > 0 ) { this.force.y -= this.speed * this.delta; }
		if( input.state("down") > 0 ){ this.force.y += this.speed * this.delta; }
		if( input.state("left") > 0 ) { this.force.x -= this.speed * this.delta; }
		if( input.state("right") > 0 ) { this.force.x += this.speed * this.delta; }
	}
	
	var camx = game.resolution.x * 0.5;
	game.camera.x = Math.max( Math.min( this.position.x - camx, (game.tileDimension.end.x)*16-256), 0);
	game.camera.y = Math.max( Math.min( this.position.y - 120, (game.tileDimension.end.y)*16-240), 0);
}

WorldLocale.prototype = new GameObject();
WorldLocale.prototype.constructor = GameObject;
function WorldLocale(x,y,type,properties){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-.5,-.5);
	this.type = type;
	this.index = 0;
	this.active = true;
	
	this.height = this.width = 8;
	this.sprite = sprites.world;
	
	this.frame = 3;
	this.frame_row = 5;
	
	properties = properties || {};
	this.properties = properties;
	
	if("var_checkpoint" in properties){
		if(properties["var_checkpoint"]*1 > window._world.checkpoint){
			this.active = false;
			this.visible = false;
		}
	}
	if("map" in properties){
		this.type = "map";
		this.index = properties["map"];
		this.visible = false;
	}
	if("boat" in properties){
		this.type = "boat";
		this.index = properties["boat"] * 1;
		this.gotoIndex = properties["to"] * 1;
		this.frame = 3;
		this.frame_row = 7;
	}
	if("temple" in properties){
		this.type = "temple";
		this.index = properties["temple"] * 1;
		this.frame = 3;
		this.frame_row = 5;
		try{
			if( _world.temples[this.index].complete ){
				this.frame = 4;
			}
		} catch (ex) {}
	}
	if("town" in properties){
		this.type = "town";
		this.index = properties["town"] * 1;
		this.frame = 3;
		this.frame_row = 7;
	}
	
	this.on("collideObject", function(obj){
		if( this.active ){
			if( obj instanceof WorldPlayer ){
				var dir = new Point(obj.force.x, obj.force.y);
				_world.enterLocale( this, dir );
			}
		}
	});
}

WorldEncounter.prototype = new GameObject();
WorldEncounter.prototype.constructor = GameObject;
function WorldEncounter(x, y){	
	this.constructor();
	x = Math.floor(x/16)*16;
	y = Math.floor(y/16)*16;
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	
	this.height = this.width = 12;
	this.sprite = sprites.world;
	this.speed = 0.125;
	this.zIndex = 1;
	
	this.addModule(mod_rigidbody);
	this.gravity = 0;
	this.friction = 0;
	
	this.frame = 1;
	this.frame_row = 13;
	
	this.target = game.getObject(WorldPlayer);
	this.on("collideObject", function(obj){
		if( obj instanceof WorldPlayer ){
			_world.encounter(this);
		} else if( obj instanceof WorldEncounter ){
			var dir = this.position.subtract(obj.position);
			obj.force = obj.force.add(dir.normalize(this.delta*0.5));
			this.force = this.force.add(dir.normalize(this.delta*-0.5));
		}
	});
	
	if(
		game.getTile(this.position, 1) != 0 ||
		this.target && this.position.subtract(this.target.position).length() < 104
	) {
		this.position.x = this.position.y = -999;
	}
	
}
WorldEncounter.prototype.update = function(){
	this.force = this.force.scale( 1.0 - (0.05*this.delta) );
	
	if( this.target == null ){
		this.target = game.getObject(WorldPlayer);
	}
	
	if( this.target instanceof WorldPlayer ) {
		var dir = this.position.subtract(this.target.position);
		if( this.active ){
			var move = dir.normalize(-1);
			this.force.x += move.x * this.speed * this.delta;
			this.force.y += move.y * this.speed * this.delta;
			if( dir.length() > 104 ) {
				this.active = false;
			}
		} else {
			if( dir.length() < 96 ) {
				this.active = true;
			}
		}
	}
}

 /* platformer\scenes\dream.js*/ 

Dream.prototype = new GameObject();
Dream.prototype.constructor = GameObject;
function Dream(x, y){	
	this.constructor();
	this.progress = -Game.DELTASECOND;
	
	//Decide dream
	this.type = 0;
	var completed = 0;
	for(var i=0; i < _world.temples.length; i++) if( _world.temples[i].complete ) completed++;
	if( _world.dreams < 3 && dataManager.currentTown > 0 && completed > _world.lastDream ) {
		_world.lastDream = completed;
		_world.dreams++;
		this.type = _world.dreams;
	}
	
	this.previousMusic = audio.isPlayingAs("music");
	this.length = 5.0;
	this.waveStrength = 1.0;
	
	if( this.type == 0 ){
		audio.playAs("music_sleep","music");
	} else {
		audio.playAs("music_goeson","music");
		this.length = 19.5;
		this.waveStrength = this.type * 3;
	}
}

Dream.prototype.idle = function(){}
Dream.prototype.update = function(){
	this.progress += game.deltaUnscaled;
	
	if( input.state("pause") == 1 ) {
		this.progress = Math.max( Game.DELTASECOND * this.length, this.progress );
	}
	
	if(this.progress > Game.DELTASECOND * (this.length+0.5)){
		game.pause = false;
		audio.playAs(this.previousMusic,"music");
		this.destroy();
	} else {
		game.pause = true;
	}
}
Dream.prototype.postrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
	
	//Wavy background
	var x = this.type % 2;
	var _y = Math.floor(this.type / 2)*15;
	for(var y=0; y < 240/16; y++){
		var wave = Math.sin(this.progress*0.1+y*0.2) * this.waveStrength;
		sprites.dreams.render(g,new Point(xpos+wave,y*16),x,_y+y);
	}
	
	if(this.type == 1){
		var f = 4 + Math.abs(this.progress/Game.DELTASECOND*3) % 2;
		sprites.characters.render(g,new Point(xpos+184,192),f,0,true);
		sprites.characters.render(g,new Point(xpos+104,192),f,1,false);
	} else if(this.type == 2){
		var f = Math.abs(this.progress/Game.DELTASECOND*3) % 3;
		var distance = 256 * (this.progress / (this.length*Game.DELTASECOND));
		sprites.characters.render(g,new Point(xpos+distance,192),f,0,false);
		if(this.progress > Game.DELTASECOND*7){
			sprites.characters.render(g,new Point(xpos+16+distance,192),3,1,true);
		} else {
			f = Math.abs(this.progress/Game.DELTASECOND*5) % 3;
			distance = Math.lerp(-64,distance+16,this.progress/(Game.DELTASECOND*7));
			sprites.characters.render(g,new Point(xpos+distance,192),3+f,2,false);
		}
	} else if(this.type == 3){
		var distance = Math.lerp(-64,96,Math.min(this.progress/(Game.DELTASECOND*7),1));
		var f = Math.abs(distance*0.2) % 3;
		sprites.characters.render(g,new Point(xpos+distance,192),3+f,2,false);
		
		if(this.progress > Game.DELTASECOND * 15){
			sprites.poseidon.render(g,new Point(xpos+168,160),2,1,true);
		}
		sprites.characters.render(g,new Point(xpos+176,192),3,0,true);
		
		//White flashes
		if(
			Math.abs(this.progress-(12*Game.DELTASECOND)) <= 1 ||
			Math.abs(this.progress-(14*Game.DELTASECOND)) <= 1 ||
			Math.abs(this.progress-(15*Game.DELTASECOND)) <= 1
		){
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
		}
	}
	
	//Fade in and out
	var fade = Math.max(Math.max(
		0-this.progress/Game.DELTASECOND, 
		(this.progress/Game.DELTASECOND)-(this.length-1)
	), 0);
	g.color = [0.0,0.0,0.0,fade]
	g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
}

 /* platformer\scenes\ending.js*/ 

SceneEnding.prototype = new GameObject();
SceneEnding.prototype.constructor = GameObject;
function SceneEnding(x,y){
	game.clearAll();
	game.tileSprite = sprites.tiles3;
	
	var bg = new Background();
	bg.walls = false;
	game.addObject(bg);
	
	this.speed = 0;
	this.phase = 0;
	this.x_off = 0;
	this.progress = 0;
	
	this.player_position = 0;
	this.father_position = 0;
	audio.stopAs("music");
	/*
	this.animation = {
		0.0 : [{"id":0,"position":new Point(104,192),"render":function(g,p,c){}}]
	};*/
	
	if( window._world instanceof WorldMap ){
		window._world.town.money += _player.money;
		window._world.worldTick();
	}
	
	ga("send","event","finished",_player.level);
	
	this.text_credits = "" +
	"BEAST LORDS\n\n"+
	"POGAMES.UK\n"+
	"Staff\n\n"+
	"ART\nBirdy\n\n"+
	"PROGRAMMING\nBirdy\n\n"+
	"SOUND\nBirdy\n\n"+
	"MUSIC\nBirdy\n\n"+
	"PLAY TESTING\n\n"+
	"E.R\n"+
	"W.B\n"+
	"D.S\n\n"+
	"Thanks for playing.";
}
SceneEnding.prototype.update = function(){
	game.camera.x = this.x_off;
	game.camera.y = 0;
	game.pause = false;
	
	if( this.phase == 0 ) {
		this.progress += this.delta;
		if(this.progress > Game.DELTASECOND * 3) {
			audio.playAs("music_goodbye", "music");
			this.progress = 0;
			this.phase = 1;
		}
	} else if( this.phase == 1 ) {
		this.progress += this.delta * 0.01;
		if( this.progress < 8 ) {
			if( Math.floor(this.progress) > this.player_position ) this.player_position += this.delta * 0.02;
			if( Math.floor(this.progress-0.1) > this.father_position ) this.father_position += this.delta * 0.02;
		} 
		if( this.progress > 9 ) {
			this.phase = 2;
			this.progress = 0;
		}
	} else if ( this.phase == 2 ) {
		//Driving
		this.speed = Math.min(this.speed + this.delta * 0.01, 7.0);
		this.x_off += this.delta * this.speed;
		this.progress += this.delta / Game.DELTASECOND;
		if( this.progress > 60 ) {
			this.phase = 3;
			var im = new ItemMenu(dataManager.unlocks);
			im.on("destroy", function(){
				game.clearAll();
				game.addObject(new TitleMenu());
				audio.stopAs("music");
			});
			game.addObject(im);
		}
	} else if( this.phase == 3 ){
		//Show Scores
	}
	
	if(this.phase < 3 && input.state("pause") == 1 ) {
		this.phase = 3;
		this.progress = 9999;
	}
}
SceneEnding.prototype.render = function(g,c){
	for(var x=0; x<27; x++) for(var y=0; y<16; y++) {
		var tile = y <= 0 ? 32 : 96;
		var off = c.x % 16;
		game.tileSprite.render(g,new Point(x*16-off,208+y*16),tile);
	}
	
	if( this.phase == 0 ) {
		g.color = [0,0,0,1];
		g.scaleFillRect(0, 0, game.resolution.x, game.resolution.y );
	} else if( this.phase == 1 ) {
		sprites.chazbike.render(g,new Point(104,192),0,2);
		sprites.ending.render(g,new Point(this.father_position*20-64,176),0,0);		
		sprites.player.render(g,new Point(this.player_position*20-20,192),1,2,true);
		
	} else if( this.phase == 2 ) {
		var pos = 1 + Math.min(-this.x_off*0.01+Math.pow(this.x_off*0.005,2),0);
		if(this.progress > 45) pos += Math.max(this.progress-45,0);
		sprites.ending.render(g,new Point(88*pos,176),1,1);
		
		var credit_pos = Math.lerp(360,-320,Math.min(this.progress/40,1));
		textArea(g,this.text_credits,128,credit_pos,120);
	} else if( this.phase == 3 ) {
		
	}
}
SceneEnding.prototype.idle = function(){}

 /* platformer\scenes\intro.js*/ 

SceneIntro.prototype = new GameObject();
SceneIntro.prototype.constructor = GameObject;
function SceneIntro(x,y){
	this.progress = 0.0;
	this.phase = 0;
	
	this.father = {"pos":new Point(160, 160), "frame":0, "frame_row":0, "flip":false};
	this.player = {"pos":new Point(160, 160), "frame":3, "frame_row":1, "flip":true};
}
SceneIntro.prototype.update = function(){
	//_player.position = game.getObject(SceneEndIntro).position.scale(1.0);
	//this.destroy();
	
	if( this.phase == 0 ) {
		if( _player instanceof Player ) { 
			_player.visible = false;
			_player.stun = Game.DELTAYEAR;
			_player.sprite = sprites.playerhuman;
		}
		
		this.player.pos.y = this.father.pos.y = 160;
		this.father.pos.x += this.delta;
		this.player.pos.x = this.father.pos.x + 16;
		if( this.father.pos.x > 352 ) {
			this.phase = 1;
		}
		this.father.frame = (this.father.frame + this.delta * 0.2) % 3;
	} else if( this.phase == 1 ){
		this.father.pos.x += this.delta;
		if( this.father.pos.x > 432 ) {
			this.phase = 2;
		}
		this.player.frame_row = 2;
		this.player.flip = this.player.pos.x > this.father.pos.x;
		
	} else if( this.phase == 2 ){
		this.father.pos.x += this.delta;
		this.player.pos.x += this.delta * 2;
		if( this.player.pos.x > 400 ) {
			this.phase = 3;
		}
		this.player.flip = false;
	} else if( this.phase == 3 ){
		var velocity = Math.max( 1.0 - this.progress / (Game.DELTASECOND * 1), 0 );
		var fall = -1.0 + (this.progress / (Game.DELTASECOND * 0.5)); 
		
		this.player.pos.x -= this.delta * 6 * velocity;
		this.player.pos.y = Math.min(this.player.pos.y+fall*2, 160);
		this.father.pos.x += this.delta;
		this.progress += this.delta;
		if( this.progress >= Game.DELTASECOND * 3 ) {
			_player.visible = true;
			_player.stun = 0;
			_player.life = 1;
			_player.heal = 1000;
			game.getObject(BigBones).active = true
			this.destroy();
		}
	}

	if( _player instanceof Player ) {
		_player.position.x = this.player.pos.x;
		_player.position.y = this.player.pos.y;
	}
}
SceneIntro.prototype.render = function(g,c){
	sprites.characters.render(g, this.father.pos.subtract(c), this.father.frame, this.father.frame_row, this.father.flip);
	sprites.characters.render(g, this.player.pos.subtract(c), this.player.frame, this.player.frame_row, this.player.flip);
}
SceneIntro.prototype.idle = function(){}

 /* platformer\scenes\introend.js*/ 

SceneEndIntro.prototype = new GameObject();
SceneEndIntro.prototype.constructor = GameObject;
function SceneEndIntro(x,y){
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 64;
	
	this.progress = 0.0;
	this.phase = 0;
		
	this.objPlayer = {"pos":new Point(1744, 144),"frame":0,"frame_row":0,"visible":true};
	this.objZoder = {"pos":new Point(2032, 116),"frame":0,"frame_row":1,"visible":true};
	this.objSpear = {"pos":new Point(1992, 116),"frame":1,"frame_row":0,"visible":false};
	
	this.playerFrame = 0;
	this.fatherFrame = 0;
	
	this.activated = false;
	this.clearAll = false;
	
	this.stars = [];
	for(var i=0; i < 32; i++){
		this.stars.push( {"pos":new Point(256*Math.random(),300+Math.random()*200), "speed":0.5+Math.random()*1.2} );
	}
	
	this.villagers = [];
	for(var i=0; i < 8; i++){
		var fr = i == 4 ? 0 : 1+Math.floor(Math.random()*3);
		this.villagers.push( {"pos":new Point(Math.random()*16+1832+(i*16),192), "frame_row":fr, "frame":0} );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( !this.activated ) {
				this.trigger("activate");
			}
		}
	});
	this.on("activate", function(){
		this.activated = true;
		_player.visible = false;
		_player.stun = Game.DELTAYEAR;
		_player.lock_overwrite = new Line(1760,0,1760+256,240);
	});
	
	localStorage.setItem("playedintro", true);
}
SceneEndIntro.prototype.idle = function(){}

SceneEndIntro.prototype.update = function(){
	if( this.activated ) {
		this.progress += this.delta / Game.DELTASECOND;
		
		if( this.progress > 1.0 && this.progress < 4.0 ) {
			var p = (this.progress - 1.0) / 3.0;
			this.objZoder.pos = Point.lerp(new Point(2032, 116), new Point(1992, 116), p);
		}
		
		if( this.progress > 5.0 && this.progress < 6.0 ) {
			var p = (this.progress - 5.0) / 1.0;
			this.objPlayer.pos = Point.lerp(new Point(1744, 144), new Point(1800, 144), p);
		}
		
		if( this.progress > 8.0 && this.progress < 10.0 ) {
			if( this.progress < 9.5 ) {
				//Wind up for attack
				this.objZoder.frame = 0;
				this.objZoder.frame_row = 2;
			} else {
				var p = (this.progress - 9.5) / 0.5;
				this.objZoder.frame = 2;
				this.objZoder.frame_row = 0;
				this.objSpear.visible = true;
				this.objSpear.pos = Point.lerp(new Point(1992, 116), this.objPlayer.pos, p);
			}
		}
		
		if( this.progress > 10.0 ) {
			if( !this.clearAll ) {
				game.clearAll();
				game.addObject(this);
				audio.play("slash");
				audio.stopAs("music");
				this.clearAll = true;
			}
		}
	}
}

SceneEndIntro.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	if( this.activated ) {
		if( this.clearAll ) {
			//Death
			if( this.progress < 13.0 ) {
				g.color = (this.progress * 6.0) % 1.0 > 0.5 ? [0.0,0.0,0.0,1.0] : [0.7,0.0,0.0,1.0];
				g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
				sprites.player.render(g,new Point(xpos+128,120), 4, 0, false);
			} else {
				g.color = [0.0,0.0,0.0,1.0];
				g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
				
				var lowest = 0;
				for(var i=0; i < this.stars.length; i++){
					this.stars[i].pos.y -= this.stars[i].speed * this.delta;
					if( this.stars[i].pos.y > lowest ) lowest = this.stars[i].pos.y;
					sprites.bullets.render(g, this.stars[i].pos.add(new Point(xpos,0)), 3, 2);
				}
				sprites.title.render(g, new Point(xpos, lowest), 0, 2);
				
				if( lowest <= 0 ) {
					this.destroy();
					game.addObject( new TitleMenu() );
				}
			}
		} else {
			//Cut scene
			sprites.player.render(g,this.objPlayer.pos.subtract(c), 0, 3, false);
			sprites.player.render(g,this.objPlayer.pos.subtract(c), this.objPlayer.frame, this.objPlayer.frame_row, false);
			
			sprites.zoder.render(g,this.objZoder.pos.subtract(c), this.objZoder.frame, this.objZoder.frame_row, true);
			
			if( this.objSpear.visible ) {
				sprites.zoder.render(g,this.objSpear.pos.subtract(c), this.objSpear.frame, this.objSpear.frame_row, true);
			}
			
			for(var i=0; i < this.villagers.length; i++ ){
				sprites.characters.render(g,this.villagers[i].pos.subtract(c), this.villagers[i].frame, this.villagers[i].frame_row, false);
			}
		}
	}
}

 /* platformer\scenes\transform.js*/ 

//transform

SceneTransform.prototype = new GameObject();
SceneTransform.prototype.constructor = GameObject;
function SceneTransform(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = sprites.transform;
	
	_player.visible = false;
	_player.stun = Game.DELTAYEAR;
	
	this.frame = 0;
	this.progress = 0.32 * Game.DELTASECOND;
	this.sequence = [
		[0,0.32],
		[1,0.08],
		[2,0.32],
		[3,0.32],
		[4,0.08],
		[5,0.08],
		[6,0.08],
		[7,0.32],
		[8,0.32],
		[9,0.08],
		[10,0.08],
		[11,0.08],
		[12,0.32],
		[13,0.32],
		[14,0.66]
	];
}
SceneTransform.prototype.render = function(g,c){
	this.progress -= this.delta * 0.5;
	var f = 0;
	if( this.progress <= 0 ){
		this.frame++;
		if( this.frame < this.sequence.length ) {
			var seq = this.sequence[this.frame];
			f = seq[0];
			this.progress = seq[1] * Game.DELTASECOND;
		} else {
			_player.visible = true;
			_player.stun = 0;
			this.destroy();
		}
	}
	this.sprite.render(g,this.position.subtract(c),this.frame);
}

 /* platformer\shaders\2d-fragment-blur.shader*/ 

window.shaders["2d-fragment-blur"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float blur;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec4 u = texture2D(u_image, v_texCoord + vec2(0,-blur));\n	vec4 d = texture2D(u_image, v_texCoord + vec2(0,blur));\n	vec4 l = texture2D(u_image, v_texCoord + vec2(-blur,0));\n	vec4 r = texture2D(u_image, v_texCoord + vec2(blur,0));\n	\n	if( v_position.y < 3.0 ) u = color;\n	if( v_position.y > 14.0 ) d = color;\n	if( v_position.x < 3.0 ) l = color;\n	if( v_position.x > 14.0 ) r = color;\n	\n	float activeColors = 0.0;\n	if( color.a > 0.1 ) activeColors++;\n	if( u.a > 0.1 ) activeColors++;\n	if( d.a > 0.1 ) activeColors++;\n	if( l.a > 0.1 ) activeColors++;\n	if( r.a > 0.1 ) activeColors++;\n	\n	color.r = (color.r + u.r + d.r + l.r + r.r) / activeColors;\n	color.g = (color.g + u.g + d.g + l.g + r.g) / activeColors;\n	color.b = (color.b + u.b + d.b + l.b + r.b) / activeColors;\n	color.a = (color.a + u.a + d.a + l.a + r.a) / 5.0;\n	\n	//color.a = 1.0; color.r = v_position.x/16.0; color.g = v_position.y/16.0; color.b = 0.0;\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-glow.shader*/ 

window.shaders["2d-fragment-glow"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	float pixSize = 1.0 / 256.0;\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( color.a < 0.1 ) {\n		if( \n			texture2D(u_image, v_texCoord - vec2(pixSize,0)).a > 0.1 || \n			texture2D(u_image, v_texCoord + vec2(pixSize,0)).a > 0.1 || \n			texture2D(u_image, v_texCoord - vec2(0, pixSize)).a > 0.1 || \n			texture2D(u_image, v_texCoord + vec2(0, pixSize)).a > 0.1\n		) {\n			color = u_color;\n		}\n	}\n	gl_FragColor = color;\n	//gl_FragColor = vec4(v_texCoord.x,v_texCoord.y,0,1.0);\n}";



 /* platformer\shaders\2d-fragment-lightbeam.shader*/ 

window.shaders["2d-fragment-lightbeam"] = "precision mediump float;\nuniform vec4 u_color;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = u_color;\n	color.a *= 1.0 - v_texCoord.y;\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-shader.shader*/ 

window.shaders["2d-fragment-shader"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	gl_FragColor = u_color * texture2D(u_image, v_texCoord);\n	//gl_FragColor = vec4(v_texCoord.x,v_texCoord.y,0,1.0);\n}";



 /* platformer\shaders\2d-fragment-solid.shader*/ 

window.shaders["2d-fragment-solid"] = "precision mediump float;\nuniform vec4 u_color;\n\nvoid main() {\n	gl_FragColor = u_color;\n}";



 /* platformer\shaders\2d-vertex-scale.shader*/ 

window.shaders["2d-vertex-scale"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 scale;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position * scale + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-shader.shader*/ 

window.shaders["2d-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\back-vertex-shader.shader*/ 

window.shaders["back-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	//vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(a_position, 0, 1);\n	v_texCoord = a_texCoord;\n}";



 /* platformer\shaders\fragment-greytocolor.shader*/ 

window.shaders["fragment-greytocolor"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( abs((color.r+color.g+color.b)-color.r*3.0) < 0.04 ) {\n		gl_FragColor = color * u_color;\n	} else { \n		gl_FragColor = color;\n	}\n}";



 /* platformer\shaders\fragment-heat.shader*/ 

window.shaders["fragment-heat"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float heat;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	color.r = color.r * (1.0-heat) + heat;\n	color.g = color.g * (1.0-heat) + heat * 0.4;\n	color.b = color.b * (1.0-heat);\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-shifthue.shader*/ 

window.shaders["fragment-shifthue"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_shift;\n\nvec3 rgb2hsv(vec3 c)\n{\n	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n	float d = q.x - min(q.w, q.y);\n	float e = 1.0e-10;\n	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec3 hsv = rgb2hsv(color.rgb);\n	hsv.x = mod(hsv.x + u_shift, 1.0);\n	vec3 rgb = hsv2rgb(hsv);\n	gl_FragColor = vec4(rgb,color.a);\n}";

