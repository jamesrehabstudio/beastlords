/* Shader list */


 /* platformer\alter.js*/ 

Alter.prototype = new GameObject();
Alter.prototype.constructor = GameObject;
function Alter(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "alter";
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
		
		"text".render(g, new Point(28,136+this.cursor*16), 95);
	}
}

 /* platformer\arena.js*/ 

Arena.prototype = new GameObject();
Arena.prototype.constructor = GameObject;
function Arena(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "arena";
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
	this.sealevel = 240;
	this.preset = Background.presets.sky;
	
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
}
Background.prototype.render = function(g,c){
	this.time += this.delta;
}

Background.prototype.postrender = function(g,c){
	this.renderDust(g,c);
	
	/*
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
	*/
	
	//Render flash
	if(Background.flash instanceof Array){
		g.color = Background.flash;
		g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
		Background.flash = false;
	}
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
		
		g.renderSprite(
			game.map.tileset,
			new Point(
				Math.mod( dust.position.x - c.x * dust.scale, game.resolution.x+16 ),
				Math.mod( dust.position.y - c.y * dust.scale,  game.resolution.y+16 ) 
			),
			this.zIndex = 0,
			new Point(0, 31), 
			false, 
			{
				"shader":"blur",
				"blur":Math.min(0.004 * dust.scale, 0.008), 
				"scale": 0.3*dust.scale
			}
		);
	}
}
Background.prototype.prerender = function(g,c){
	var c2 = new Point(c.x, c.y - this.sealevel);
	this.preset(g,c2);
}
Background.prototype.lightrender = function(g,c){
	//Calculate strength
	this.ambienceStrength = Math.min(Math.max(this.darknessFunction(c),0),1);
	g.color = [
		Math.lerp(1.0,this.ambience[0],this.ambienceStrength),
		Math.lerp(1.0,this.ambience[1],this.ambienceStrength),
		Math.lerp(1.0,this.ambience[2],this.ambienceStrength),
		1.0
	];
	g.scaleFillRect(0,0,game.resolution.x, game.resolution.y);
	
	//render lights
	while( Background.lights.length > 0 ) {
		var light = Background.lights.pop();
		var position = light[0];
		var radius = light[1];
		var color = light[2];
		g.renderSprite("halo",position.subtract(c),this.zIndex,new Point(),false,{"scale":radius/240,"u_color":color});
	}
	Background.lights = new Array();
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
Background.flash = false;
Background.lights = new Array();
Background.pushLight = function(p,r,c){
	if( Background.lights.length < 20 ) {
		p = p || new Point();
		r = r || 0;
		c = c || [1.0,1.0,1.0,1.0];
		Background.lights.push([p,r,c]);
	}
}

Background.presets = {
	"sky" : function(g,c){
		var inc = Math.ceil(game.resolution.y/16);
		for(var y=0; y < game.resolution.y; y += inc){
			var p = Math.pow(y / game.resolution.y,2);
			g.color = [
				Math.lerp(0.5,0.9,p),
				Math.lerp(0.7,0.9,p),
				0.9,
				1.0
			];
			g.scaleFillRect(0,y,game.resolution.x, y+inc);
		}
		//Render horizon
		for(var i=0; i < 5; i++){
			g.renderSprite("bgclouds",new Point(64+i*128,200),1,new Point(), false);
		}
		
		var carea = new Line(-64,-32,game.resolution.x+64,game.resolution.y+32);
		g.renderSprite("bgclouds",new Point(this.time*0.1,64).subtract(c.scale(0.1)).mod(carea),1,new Point(0,1), false,{"u_color":[0.85,0.92,1.0,1.0],"scale":0.8});
		g.renderSprite("bgclouds",new Point(120+this.time*0.2,80).subtract(c.scale(0.2)).mod(carea),1,new Point(0,1), false,{"u_color":[0.9,0.95,1.0,1.0]});
	},
	"darksky" : function(g,c){
		var inc = Math.ceil(game.resolution.y/16);
		for(var y=0; y < game.resolution.y; y += inc){
			var p = Math.pow(y / game.resolution.y,2);
			g.color = [
				Math.lerp(0.1,0.4,p),
				Math.lerp(0.15,0.3,p),
				Math.lerp(0.2,0.4,p),
				1.0
			];
			g.scaleFillRect(0,y,game.resolution.x, inc);
		}
		
		var carea = new Line(-96,-32,game.resolution.x+96,game.resolution.y+32);
		var space = 100;
		for(var i=0; i < 5; i++){
			var flip = Math.log(2)&1;
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.3,100).mod(carea),1,new Point(0,1), flip,{"scale":1.25,"u_color":[0.7,0.7,0.7,1.0]});
			
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.45,80).mod(carea),2,new Point(0,1), flip,{"scale":1.5,"u_color":[0.65,0.65,0.65,1.0]});
			
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.7,40).mod(carea),3,new Point(0,1), flip,{"scale":1.7,"u_color":[0.6,0.6,0.6,1.0]});
		
		}
	},
	"cavefire" : function(g,c){
		g.color = [0,0,0,1];
		g.scaleFillRect(0,0,game.resolution.x, game.resolution.y);
		var mapHeight = game.map.height * 16 - this.sealevel;
		var sspeed = 0.25;
		var pos = new Point();
		var sspeeds = [0.1,0.05,0.025];
		
		//Top
		for(var j=0; j < sspeeds.length; j++){
			sspeed = sspeeds[j];
			pos = new Point(0,0).subtract(c.scale(sspeed));
			pos.x = pos.x % 256;
			for(var i=0;i<3;i++){
				g.renderSprite("bgcave1",pos.add(new Point(i*256,j*16)),-99-j,new Point(0,5-j));
			}
		}
		
		//Bottom
		for(var j=sspeeds.length-1; j >= 0; j--){
			sspeed = sspeeds[j];
			var pos = new Point(
				(-c.x*sspeed)%256,
				(176-j*16)+(((game.map.height*16-this.sealevel) - game.resolution.y)-c.y)*sspeed
			);
			for(var i=0;i<3;i++){
				g.renderSprite("bgcave1",pos.add(new Point(i*256,0)),-99,new Point(0,j));
			}
		}
	},
	"graveyard" : function(g,c){
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
				tileset.renderTiles(g,backgroundTiles["upper3"],48,0,0);
			}
			if("upper2" in backgroundTiles){
				tileset.renderTiles(g,backgroundTiles["upper2"],48,x*0.6666666666,y*0.66666666);
			}
			if("upper1" in backgroundTiles){
				tileset.renderTiles(g,backgroundTiles["upper1"],48,x,y);
			}
		}
		if(c.y > this.sealevel){
			
			
			var x = ((c.x) - zero.x*16) * strength;
			var y = ((c.y) - zero.y*16) * strength;
			
			if("under1" in backgroundTiles){
				tileset.renderTiles(g,backgroundTiles["under1"],48,x,y);
			}
		}
	}
	
}

 /* platformer\block.js*/ 

SinkingBlock.prototype = new GameObject();
SinkingBlock.prototype.constructor = GameObject;
function SinkingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = Number.MAX_SAFE_INTEGER;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.sink = false;
	this.resetOnSleep = 1;
	this.triggerType = 0;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("triggertype" in ops){
		this.triggerType = ops["triggertype"] * 1;
	}
	if("maxy" in ops){
		this.maxy = ops["maxy"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("sleep" in ops){
		if(!(ops["sleep"] * 1)){
			this.idle = function(){}
		}
	}
	if("empty" in ops && ops["empty"]){
		this.height = 0;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"] * 1;
	}
	
	this.on("activate", function(obj){
		if(this.triggerType == 0){
			this.destroy();
		} else if (this.triggerType == 1){
			this.sink = 1;
		}
		
	});
	this.on("blockLand", function(obj){
		if(obj instanceof Player){
			this.sink = true;
		}
	});
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.position.x = this.originalPosition.x;
			this.position.y = this.originalPosition.y;
			this.sink = false;
		});
	}
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

SinkingBlock.prototype.update = function(){
	if(this.sink){
		this.position.y += this.speed * this.delta;
		if(this.position.y >= this.maxy ){
			this.sink = 0;
			this.position.y = this.maxy;
		}
	}
}

SinkingBlock.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
				
			if(tile > 0){
				var t = tile-1;
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32));
			}
			i++;
		}
	}
}

MovingBlock.prototype = new GameObject();
MovingBlock.prototype.constructor = GameObject;
function MovingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.endPosition = new Point(this.position.x, this.position.y);
	this.direction = 0;
	this.width = d[0];
	this.height = d[1];
	this.speed = 1.0;
	this.move = false;
	this.loop = 0;
	this.wait = 0.0;
	this.waitTime = 0.0;
	this.killStuck = 0;
	this.sync = 0;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("autostart" in ops){
		this.move = ops["autostart"] * 1;
	}
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("movex" in ops){
		this.endPosition.x += ops["movex"] * 1;
	}
	if("movey" in ops){
		this.endPosition.y += ops["movey"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("loop" in ops){
		this.loop = ops["loop"] * 1;
	}
	if("wait" in ops){
		this.wait = ops["wait"] * Game.DELTASECOND;
	}
	if("killstuck" in ops){
		this.killStuck = ops["killstuck"] * 1;
	}
	
	this.on("activate", function(obj){
		this.move = 1;
	});
	
	this.on("collideObject", function(obj){
		if(this.killStuck && this.move){
			if(obj.hasModule(mod_rigidbody) && obj.hasModule(mod_combat)){
				if(obj.isStuck){
					if(obj instanceof Player && obj.states.ledgeObject == this){
						obj.trigger("dropLedge");
					} else {
						if(this.dotDirection(obj.position) > 0.1){
							obj.invincible = -1;
							obj.hurt( this, Math.floor( 9999 ) );
						} else {
							console.log("Spare crushing object");
						}
					}
				}
			}
		} else {
			//fall off platform if obj hits a tile
			//if(obj.isStuck && obj instanceof Player && obj.states.ledgeObject == this){
			//	obj.trigger("dropLedge");
			//}
			if(obj instanceof Player && obj.states.ledgeObject != this){
				obj.trigger("dropLedge");
			}
		}
	});
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
	
	if("sync" in ops){
		this.sync = true;
		this.position = Point.lerp(this.startPosition, this.endPosition, ops["sync"] * 1);
	}
}

MovingBlock.prototype.idle = function(){
	if(!this.sync){
		GameObject.prototype.idle.apply(this);
	}
}

MovingBlock.prototype.update = function(){
	if(this.waitTime > 0){
		this.waitTime -= this.delta;
	} else if(this.move){
		var s = this.speed * this.delta;
		var des = this.direction == 0 ? this.endPosition : this.startPosition;
		var dif = des.subtract(this.position);
		var dir = dif.normalize(s);
		if(dif.length() <= s ){
			this.destinationReached();
		} else {
			this.position = this.position.add(dir);
		}
	}
}
MovingBlock.prototype.dotDirection = function(p){
	var pos = p.subtract(this.position);
	return pos.dot(this.getDirection());
}
MovingBlock.prototype.getDirection = function(){
	var des = this.direction == 0 ? this.endPosition : this.startPosition;
	var dif = des.subtract(this.position);
	return dif.normalize();
}
MovingBlock.prototype.destinationReached = function(){
	var des = this.direction == 0 ? this.endPosition : this.startPosition;
	this.position.x = des.x;
	this.position.y = des.y;
	this.direction = this.direction == 0 ? 1 : 0;
	this.waitTime = this.wait;
	if(!this.loop){
		this.move = 0;
	}
}
MovingBlock.prototype.shouldRender = function(){
	var c = this.corners();
	var l = new Line(c.left,c.top,c.right,c.bottom).transpose(game.camera.scale(-1));
	return l.overlaps(new Line(0,0,game.resolution.x,game.resolution.y));
}

MovingBlock.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
				
			if(tile > 0){
				var t = tile-1;
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32));
			}
			i++;
		}
	}
}

FloatBlock.prototype = new GameObject();
FloatBlock.prototype.constructor = GameObject;
function FloatBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.endPosition = new Point(this.position.x, this.position.y);
	this.direction = 0;
	this.width = d[0];
	this.height = d[1];
	
	this.speed = 1.0;
	this.rubberband = 0;
	this.stopwait = 0;
	this.force = new Point();
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

FloatBlock.prototype.idle = function(){}

FloatBlock.prototype.update = function(){
	if(this.blockOnboard.indexOf(_player) >= 0){
		//Someone on board
		if(this.rubberband > 0){
			this.force.y *= 1 - (0.1 * this.delta);
			this.rubberband -= this.delta;
		} else {
			this.force.y = Math.min(this.force.y + this.speed * this.delta * 0.2, this.speed * 3);
		}
		var speed = this.force.y * this.delta;
		this.position.y += speed;
		this.stopwait = Game.DELTASECOND;
	} else if (this.stopwait > 0){
		this.stopwait -= this.delta;
	} else {
		//return to position
		this.rubberband = Game.DELTASECOND * 0.6;
		this.force.y = 2;
		if(this.position.y > this.startPosition.y){
			var speed = this.speed * this.delta;
			if(this.position.y - speed <= this.startPosition.y){
				this.position.y = this.startPosition.y;
			} else {
				this.position.y -= speed;
			}
		}
	}
}

FloatBlock.prototype.shouldRender = MovingBlock.prototype.shouldRender;
FloatBlock.prototype.render = MovingBlock.prototype.render;

LoopBlock.prototype = new GameObject();
LoopBlock.prototype.constructor = GameObject;
function LoopBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.endPosition = new Point(this.position.x, this.position.y);
	this.direction = 0;
	this.width = d[0];
	this.height = d[1];
	
	this.force = new Point();
	this.friction = 0.001;
	this.appliedForceTop = 0.0125;
	this.appliedForceBot = 0.25;
	this.speedMax = 8;
	this.loopArea = new Line(
		this.position.x - 128, 
		this.position.y - 120, 
		this.position.x + 128, 
		this.position.y + 120
	);
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("looptop" in ops){
		this.loopArea.start.y += ops["looptop"] * 1;
	}
	if("loopbottom" in ops){
		this.loopArea.end.y += ops["loopbottom"] * 1;
	}
	
	this.on("collideTop", function(obj){
		this.force.y += Math.max(obj.force.y * this.appliedForceTop, 0);
	});
	this.on("collideBottom", function(obj){
		this.force.y += Math.min(obj.force.y * this.appliedForceBot, 0);
	});
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

LoopBlock.prototype.idle = function(){}

LoopBlock.prototype.update = function(){
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	
	this.force.x = Math.min(Math.max(this.force.x,-this.speedMax),this.speedMax);
	this.force.y = Math.min(Math.max(this.force.y,-this.speedMax),this.speedMax);
	
	this.force.x *= 1 - (this.friction*this.delta);
	this.force.y *= 1 - (this.friction*this.delta);
	
	if(this.position.x < this.loopArea.start.x){
		this.position.x = this.loopArea.end.x// - (this.loopArea.start.x - this.position.x);
	}
	if(this.position.x > this.loopArea.end.x){
		this.position.x = this.loopArea.start.x// + (this.loopArea.end.x - this.position.x);
	}
	if(this.position.y < this.loopArea.start.y){
		this.position.y = this.loopArea.end.y// - (this.loopArea.start.y - this.position.y);
	}
	if(this.position.y > this.loopArea.end.y){
		this.position.y = this.loopArea.start.y// + (this.loopArea.end.y - this.position.y);
	}
}

LoopBlock.prototype.shouldRender = MovingBlock.prototype.shouldRender;
LoopBlock.prototype.render = MovingBlock.prototype.render;


Crusher.prototype = new GameObject();
Crusher.prototype.constructor = GameObject;
function Crusher(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.speed = 1.0;
	this.fallSpeed = 5.0;
	this.move = false;
	this.killStuck = 1;
	this.margin = 32;
	
	this.states = {
		"phase" : 0,
		"cooldown" : 0.0
	};
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.on("collideObject", function(obj){
		if(this.move && obj.hasModule(mod_block)){
			this.states.phase = 2;
			this.states.cooldown = Game.DELTASECOND;
		} else if(this.killStuck && this.move){
			if(obj.hasModule(mod_rigidbody) && obj.hasModule(mod_combat)){
				if(obj.isStuck){
					if(obj instanceof Player && obj.states.ledgeObject == this){
						obj.trigger("dropLedge");
					} else {
						if(this.dotDirection(obj.position) > 0.1){
							obj.invincible = -1;
							obj.hurt( this, Math.floor( 9999 ) );
						} else {
							console.log("Spare crushing object");
						}
					}
				}
			}
		} else {
			//fall off platform if obj hits a tile
			if(obj.isStuck && obj instanceof Player && obj.states.ledgeObject == this){
				obj.trigger("dropLedge");
			}
		}
	});
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

Crusher.prototype.lowest = function(){
	var c = this.corners();
	var y = c.bottom + 8;
	var x1 = c.left;
	var x2 = c.right;
	
	for(var x = x1; x < x2; x+=16){
		var tile = game.getTile(x,y);
		if(tile != 0 ){
			return Math.floor(y/16)*16;
		}
	}
	return Number.MAX_SAFE_INTEGER;
}

Crusher.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.states.phase == 0){
		//Wait for player
		this.move = false;
		var c = this.corners();
		if(
			_player.position.y > this.position.y &&
			_player.position.x + this.margin > c.left &&
			_player.position.x - this.margin < c.right
		){
			this.states.phase = 1;
			this.states.cooldown = Game.DELTASECOND;
		}
	} else if(this.states.phase == 1){
		//falling
		this.move = true;
		this.position.y += this.delta * this.fallSpeed;
		var l = this.lowest();
		
		if(this.position.y + this.height >= l){
			this.states.phase = 2;
			this.position.y = l - this.height;
		}
	} else if(this.states.phase == 2){
		//Rest on floor
		this.move = false;
		this.states.cooldown -= this.delta;
		if(this.states.cooldown <= 0){
			this.states.phase = 3;
		}
	} else {
		//Move up
		this.move = true;
		this.position.y -= this.delta * this.speed;
		if(this.position.y <= this.startPosition.y){
			this.position.y = this.startPosition.y;
			this.states.phase = 0;
		}
	}
}
Crusher.prototype.getDirection = function(){
	if(this.states.phase == 1) return new Point(0,1);
	if(this.states.phase == 3) return new Point(0,-1);
	return new Point(0,0);
};
Crusher.prototype.shouldRender = MovingBlock.prototype.shouldRender;
Crusher.prototype.dotDirection = MovingBlock.prototype.dotDirection;
Crusher.prototype.render = MovingBlock.prototype.render;

 /* platformer\boss_ammit.js*/ 

Ammit.prototype = new GameObject();
Ammit.prototype.constructor = GameObject;
function Ammit(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.sprite = "ammit";
	this.speed = 0.25;
	
	this.start_x = x;
	this.active = false;
	this.slimes = new Array();
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 4;
	this.bossface_frame.y = 0;
	
	this.states = {
		"current" : 0,
		"previous" : 0,
		"transition" : 0,
		"transitionTotal" : 0,
		"cooldown" : 0,
		"attack" : 0,
		"attackTotal" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = this.lifeMax = Spawn.life(24,this.difficulty);
	
	this.damage = Spawn.damage(4,this.difficulty);
	this.mass = 5.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		if(Math.random() > 0.666 && this.states.current != Ammit.STATE_BURST){
			var livingSlimes = Spawn.countList(this.slimes);
			var burstChance = (1-(livingSlimes/5.0)) * Math.min(Math.max(1-(this.life/this.lifeMax),0.2),0.8);
			
			if(Math.random() < burstChance){
				this.changeState(Ammit.STATE_BURST);
			} else {
				this.changeState(Ammit.STATE_HIDDEN);
			}
		}
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if(
				this.states.current == Ammit.STATE_MOVE || 
				this.states.current == Ammit.STATE_BOUNCE
			){
				if(this.states.transition <= 0){
					obj.hurt(this, this.damage);
				}
			}
		}
	});
	this.on(["player_death","pre_death"], function(){
		for(var i=0; i < this.slimes.length; i++){
			if(this.slimes[i] instanceof Slime){
				this.slimes[i].destroy();
			}
		}
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,65);
		this.destroy();
	});
	this.calculateXP();
}

Ammit.DISTANCE = 128;
Ammit.REACH = 256;
Ammit.BOUNCE_DISTANCE = 176;
Ammit.STATE_IDLE = 0;
Ammit.STATE_SPAWN = 1;
Ammit.STATE_MOVE = 2;
Ammit.STATE_PUNCH = 3;
Ammit.STATE_REACH = 4;
Ammit.STATE_BOUNCE = 5;
Ammit.STATE_HIDDEN = 6;
Ammit.STATE_BURST = 7;

Ammit.prototype.changeState = function(newState){
	this.states.previous = this.states.current;
	this.states.current = newState;
	this.states.transition = this.states.transitionTotal = Game.DELTASECOND;
	this.interactive = true;
	if(newState == Ammit.STATE_IDLE){
		this.states.cooldown = Game.DELTASECOND * 1.25;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		if(this.life / this.lifeMax < 0.5){
			this.states.cooldown = Game.DELTASECOND * 0.6;
		}
	}
	if(newState == Ammit.STATE_SPAWN){
		this.states.attack = 0;
	}
	if(newState == Ammit.STATE_PUNCH){
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		this.states.attack = this.states.attackTotal = Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_REACH){
		this.states.transition = this.states.transitionTotal = 0.5 * Game.DELTASECOND;
		this.states.attack = this.states.attackTotal = 1.5 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_HIDDEN){
		this.interactive = false;
		this.states.cooldown = Game.DELTASECOND * 2;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_BOUNCE){
		this.states.cooldown = Game.DELTASECOND * 5;
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
	}
	if(newState == Ammit.STATE_BURST){
		this.states.cooldown = Game.DELTASECOND * 1.0;
		this.states.transition = this.states.transitionTotal = 0.0;
	}
}
Ammit.prototype.update = function(){	
	if ( this.active && this.life > 0) {
		var dir = this.position.subtract( _player.position );
		var offpos = this.position.subtract(this.boss_starting_position);
		
		if(this.states.transition > 0){
			var progress = 1 - (this.states.transition / this.states.transitionTotal);
			//change from one state to another
			if(this.states.current == Ammit.STATE_BOUNCE){
				//appear as ball
				this.frame.x = Math.max(2 - progress * 3,0);
				this.frame.y = 3;
			} else if(this.states.previous == Ammit.STATE_BOUNCE){
				//Disappear as ball
				this.frame.x = progress * 3;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_HIDDEN){
				//Disappear
				this.frame.x = Math.max(3 - progress * 4,0);
				this.frame.y = 2;
			} else if(this.states.previous == Ammit.STATE_HIDDEN){
				//Appear
				this.frame.x = progress * 4;
				this.frame.y = 2;
			} else if(this.states.current == Ammit.STATE_PUNCH || this.states.current == Ammit.STATE_REACH){
				//Punch
				this.frame.x = 0;
				if(progress > 0.6){this.frame.x = 1;}
				if(progress > 0.8){this.frame.x = 2;}
				this.frame.y = 1;
			} else {
				//idle
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
				this.frame.y = 0;
			}
			this.states.transition -= this.delta;
		} else {
			if(this.states.current == Ammit.STATE_HIDDEN){
				//hidden
				if(this.states.cooldown <= 0){
					
					var newX = this.boss_starting_position.x - Ammit.DISTANCE;
					this.position.x = newX + Ammit.DISTANCE * 2 * Math.random();
					if(Math.random() > 0.25){
						this.changeState(Ammit.STATE_IDLE);
					} else {
						this.changeState(Ammit.STATE_BOUNCE);
					}
				}
				this.states.cooldown -= this.delta;
				this.frame.x = 3;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_BOUNCE){
				//Bounce
				this.force.x += this.speed * 1.5 * this.delta * (this.flip?-1:1);
				this.force.y -= this.delta * 0.5;
				if(
					(offpos.x < -Ammit.BOUNCE_DISTANCE && this.flip) ||
					(offpos.x > Ammit.BOUNCE_DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.force.x = -this.force.x;
				}
				if(this.grounded){
					if(this.states.cooldown <= 0){
						this.force.x = 0;
						this.changeState(Ammit.STATE_HIDDEN);
						Spawn.addToList(this.position,this.slimes,Slime,5);
						Spawn.addToList(this.position,this.slimes,Slime,5);
					} else {
						shakeCamera(Game.DELTASECOND*0.3,2);
						this.grounded = false;
						this.force.y = -9;
					}
				}
				
				this.states.cooldown -= this.delta;
				this.frame.x = 0;
				this.frame.y = 3;
			} else if(this.states.current == Ammit.STATE_REACH){
				//Reach Punch
				var reach = 1 - this.states.attack / this.states.attackTotal;
				var rd = 80 + Ammit.REACH * reach;
				this.strike(new Line(new Point(rd-12,-8), new Point(rd,0)));
				
				if(this.states.attack < 0){
					this.changeState(Ammit.STATE_IDLE);
				}
				this.states.attack -= this.delta;
				this.frame.x = 3;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_PUNCH){
				//Punch
				if(this.states.attack > Game.DELTASECOND * 0.7){
					this.strike(new Line(new Point(0,-8), new Point(48,0)));
				}
				
				if(this.states.attack < 0){
					var r = Math.random();
					if(r < 0.2){
						this.changeState(Ammit.STATE_MOVE);
					} else if (r < 0.5){
						this.changeState(Ammit.STATE_SPAWN);
					} else {
						this.changeState(Ammit.STATE_IDLE);
					}
				}
				this.states.attack -= this.delta;
				this.frame.x = 3;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_MOVE){
				//Change side
				this.force.x += this.speed * 2 * this.delta * (this.flip?-1:1);
				if(
					(offpos.x < -Ammit.DISTANCE && this.flip) ||
					(offpos.x > Ammit.DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.changeState(Ammit.STATE_IDLE);
				}
				this.frame.x = 5;
				this.frame.y = 1;
			} else if(this.states.current == Ammit.STATE_SPAWN){
				//spawn enemies
				this.force.x += this.speed * this.delta * (this.flip?-1:1);
				if(
					(offpos.x < -Ammit.DISTANCE && this.flip) ||
					(offpos.x > Ammit.DISTANCE && !this.flip)
				){
					this.flip = !this.flip;
					this.changeState(Ammit.STATE_IDLE);
				}
				if(this.states.attack > Game.DELTASECOND){
					//create new Slime
					this.states.attack = 0;
					Spawn.addToList(this.position,this.slimes,Slime,5);
				}
				this.states.attack += this.delta;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
				this.frame.y = 0;
			} else if(this.states.current == Ammit.STATE_IDLE){
				//idle
				this.flip = dir.x > 0;
				
				if(Math.abs(dir.x) < 64){
					this.changeState(Ammit.STATE_PUNCH);
				}
				if(this.states.cooldown < 0){
					if(this.life/this.lifeMax > 0.5){
						//lots of life
						if(Math.random() > 0.3 && Spawn.countList(this.slimes) > 2){
							this.changeState(Ammit.STATE_REACH);
						} else if(Spawn.countList(this.slimes) < 4 && Math.random() > 0.5){
							this.changeState(Ammit.STATE_SPAWN);
						} else {
							this.changeState(Ammit.STATE_MOVE);
						}
					} else {
						//not so much life
						if(Math.random() > 0.5){
							this.changeState(Ammit.STATE_REACH);
						} else {
							this.changeState(Ammit.STATE_MOVE);
						}
					}
				}
				this.states.cooldown -= this.delta;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
				this.frame.y = 0;
			} else if(this.states.current == Ammit.STATE_BURST){
				if(this.states.cooldown < 0){
					for(var i=0; i < 5; i++){
						var randomPosition = new Point(Math.random()-.5,Math.random()-.8).normalize(32);
						var slime = Spawn.addToList(this.position.add(randomPosition),this.slimes,Slime,5);
						if(slime instanceof GameObject){
							slime.force = randomPosition.normalize(8);
						}
					}
					this.changeState(Ammit.STATE_HIDDEN);
				}
				this.states.cooldown -= this.delta;
				this.frame.x = Math.max((this.frame.x + this.delta * 0.5) % 6, 4);
				this.frame.y = 0;
			}
		}
	}
}

Ammit.prototype.idle = function(g,c){}

Ammit.prototype.render = function(g,c){
	if(this.states.transition <= 0){
		var dir = this.flip ? -1 : 1;
		if(this.states.current == Ammit.STATE_PUNCH ){
			//draw hand
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*80,0)),this.zIndex,new Point(0, 4),this.flip);
		} else if(this.states.current == Ammit.STATE_REACH){
			var reach = 1 - this.states.attack / this.states.attackTotal;
			var rd = 80 + Ammit.REACH * reach;
			//draw hand
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*rd,0)),this.zIndex,new Point(0, 4),this.flip);
			for(var i = rd; i > 80; i -= 32){
				//draw wrist
				g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(dir*(i-32),0)),this.zIndex,new Point(1, 4),this.flip);
			}
		}
	}
	GameObject.prototype.render.apply(this,[g,c]);
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
	this.sprite = "pigboss";
	this.speed = .9;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = Spawn.life(26,this.difficulty);
	this.lifeMax = this.life;
	this.collideDamage = 5;
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(6,this.difficulty);
	
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
		this.frame.y = 1;
		this.frame.x = 1;
		if( this.grounded ) {
			this.frame.x = 3;
		} else if ( this.force.y < 0 ) {
			this.frame.x = 2;
		}
	}else if ( this.states.attack > 0 ){
		this.width = 28;
		this.frame.y = 2; 
		this.frame.x = 0; 
		if( this.states.attack <= this.attack_times.release ) this.frame.x = 1;
		if( this.states.attack <= this.attack_times.cool ) this.frame.x = 2;
	} else {
		this.width = 28;
		this.frame.x = (this.frame.x + this.delta * 0.3 * Math.abs(this.force.x)) % 3;
		this.frame.y = 0;
	}
}

 /* platformer\boss_crypt.js*/ 

CryptKeeper.prototype = new GameObject();
CryptKeeper.prototype.constructor = GameObject;
function CryptKeeper(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 56;
	this.sprite = "cryptkeeper";
	this.speed = 0.3;
	//this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("hurtable" in o){
		this.hurtable = o["hurtable"] * 1;
	}
	
	this.life = Spawn.life(5,this.difficulty);
	this.lifeMax = this.life;
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.8;
	
	this.state = 0;
	this.states = {
		"time" : 0.0,
		"totalTime" : 0.0,
		"wait" : 0.0,
		"breathcooldown" : 0.0,
		"yettojumped" : true
	}
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		var dir = this.position.subtract(obj.position);
		if(this.state != 0){
			this.grounded = false;
			this.force.y = -8;
			this.force.x = 12 * (dir.x>0?1:-1);
			
			if(Math.random() > 0.6){
				this.setState(0);
			} else {
				
			}
		} else{
			this.force.x = (this.force.x > 0 ? -8 : 8);
			this.setState(3)
			this.states.wait = Game.DELTASECOND * 0.5;
		}
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.state == 0){
				//Charging and caught player
				obj.hurt(this, this.damage);
				obj.trigger("guardbreak", this);
				obj.statusEffects.stun = Game.DELTASECOND * 3;
				this.states.time = 0;
				this.states.wait = Game.DELTASECOND;
				this.frame.x = 3;
				this.frame.y = 1;
				game.slow(0.0, Game.DELTASECOND);
			} else if(this.state == 1){
				if(Math.random()>0.8){
					this.setState(5);
				} else {
					this.setState(3);
				}
			}
		}
	});
	this.on("collideHorizontal", function(x){
		if(this.state == 1 || this.state == 2){
			this.flip = !this.flip;
		}
	});
}
CryptKeeper.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	if(s == 0){
		//Charge
		this.frame.y = 2;
		this.frame.x = 0;
		this.states.wait = Game.DELTASECOND * 0.5;
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.5;
		this.states.yettojumped = true;
		this.flip = dir.x > 0; 
	} else if(s == 1){
		//Move
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	} else if(s == 2){
		//Shadow move
		this.flip = dir.x > 0; 
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	} else if(s == 3){
		//Enter shadow
		this.states.time = this.states.totalTime = Game.DELTASECOND * 1.0;
		this.interactive = false;
	} else if(s == 4){
		//Exit shadow
		this.states.time = this.states.totalTime = Game.DELTASECOND * 0.7;
	} else {
		//Breath smoke
		this.flip = dir.x > 0;
		this.states.time = this.states.totalTime = Game.DELTASECOND * 2.0;
	}
	this.state = s;
}

CryptKeeper.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.states.breathcooldown -= this.delta;
	
	if(!this.grounded){
		this.frame.y = 2;
		this.frame.x = 4;
	} else if(this.states.wait > 0){
		this.states.wait -= this.delta;
	} else if(this.state == 0){
		//Charge at player
		
		this.force.x += 3 * this.speed * this.delta * (this.flip?-1:1);
		
		this.frame.y = 2;
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		
		this.states.time -= this.delta;
		if(this.states.yettojumped && Math.abs(dir.x) < 64 && this.grounded){
			this.states.yettojumped = false;
			if(this.difficulty < 1 || Math.random() > 0.5){
				this.grounded = false;
				this.force.y = -8;
			}
		}
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.4 ? 1 : 3);
		}
	} else if(this.state == 1){
		//Move
		this.force.x += this.speed * this.delta * (this.flip?-1:1);
		
		this.frame.y = 1;
		this.frame.x = (this.frame.x + this.delta * 0.2) % 6;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(Math.random() > 0.6 ? 0 : 3);
		}
		if(Math.abs(dir.x) < 64 && this.states.breathcooldown <= 0){
			this.setState(5);
		}
	} else if(this.state == 2){
		//move in shadows
		this.force.x += 2 * this.speed * this.delta * (this.flip?-1:1);
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = 5;
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(4);
		}
		if(progress <= 0.5 && this.difficulty > 0 && Math.abs(dir.x) < 64){
			this.setState(4);
		}
	} else if(this.state == 3){
		//Disappear into a shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = Math.max(5 - Math.floor(progress * 6), 0);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.setState(2);
		}
	} else if(this.state == 4){
		//Emerge out of the shadow
		
		var progress = this.states.time / this.states.totalTime;
		this.frame.y = 0;
		this.frame.x = Math.min(Math.floor(progress * 6), 5);
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.interactive = true;
			this.setState(Math.random() > 0.8 ? 0 : 1);
		}
	} else{
		//Breath smoke
		this.force.x = 0;
		var progress = this.states.time / this.states.totalTime;
		this.frame = CryptKeeper.anim_smoke.frame(1-progress);
		
		if(progress < 0.4){
			this.strike(new Line(24,-16,56,8),"hurt",this.damage);
		}
		
		this.states.time -= this.delta;
		if(this.states.time <= 0){
			this.states.breathcooldown = Game.DELTASECOND * 6;
			this.setState(1);
		}
	}
}

CryptKeeper.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if(this.state == 5){
		var progress = this.states.time / this.states.totalTime;
		if(progress < 0.45){
			var sprog = 1 - (progress / 0.45);
			var sframe = new Point(sprog*6,4);
			var offset = new Point(this.flip?-48:48, 8);
			g.renderSprite(this.sprite,this.position.add(offset).subtract(c),this.zIndex+1,sframe,this.flip);
		}
		
	}
}

CryptKeeper.anim_smoke = new Sequence({
	0.0 : [0,3],
	0.1 : [1,3],
	0.5 : [2,3],
	0.55 : [3,3],
	0.6 : [4,3]
});

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
	this.sprite = "frogmonster";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
	this.life = Spawn.life(35,this.difficulty);
	this.gravity = 0.5;
	this.friction = 0.2;
	this.mass = 20.0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.damage = Spawn.damage(5,this.difficulty);
	
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
			audio.play("explode1");
			shakeCamera(new Point(0,8));
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
	var f = {"shader" : this.filter};
	g.renderSprite(this.sprite,this.position.add(larm).subtract(c),this.zIndex,new Point(0,4),this.flip,f);
	g.renderSprite(this.sprite,this.position.add(lleg).subtract(c),this.zIndex,new Point(llegFrame,5),this.flip,f);
	g.renderSprite(this.sprite,this.position.add(body).subtract(c),this.zIndex,new Point(0,1),this.flip,f);
	g.renderSprite(this.sprite,this.position.add(head).subtract(c),this.zIndex,new Point(headFrame,0),this.flip,f);
	g.renderSprite(this.sprite,this.position.add(rleg).subtract(c),this.zIndex,new Point(rlegFrame,2),this.flip,f);
	g.renderSprite(this.sprite,this.position.add(rarm).subtract(c),this.zIndex,new Point(0,3),this.flip,f);
	
	//pupils
	/*
	if( window._player instanceof Player ) {
		var dir = window._player.position.normalize(4)
		this.sprite.render(g,this.position.add(head).subtract(c).subtract(dir), 0, 6, this.flip);
	}
	*/
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
function Garmr(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "garmr";
	this.speed = 3.8;
	
	this.active = false;
	this.closeToBoss = false;
	this.track = null;
	
	this.projection = new Point(x,y);
	this.projectionFrame = new Point(2,0);
	this.projectionFlip = false;
	
	this.frame.x = 0;
	this.frame.y = 3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops["trigger"];
	}
	if("difficulty" in ops){
		this.difficulty = ops["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.lifeMax = this.life;
	this.mass = 5.0;
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		this.states.dizzy -= Game.DELTASECOND * 0.5;
		audio.play("hurt");
	});
	this.on("activate", function() {
		this.treads = Trigger.getTargets("bosstrack")[0];
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		
		Item.drop(this,40);
		this.destroy();
	});
	this.calculateXP();
	
	this._boss_is_active = function(){
		if( !this.active ) {
			this.interactive = false;
			var area = new Line(
				this.position.x - 160,
				this.position.y,
				this.position.x + 160,
				this.position.y + 960
			);
			
			if( area.overlaps(_player.position) ){
				game.slow(0.1, Game.DELTASECOND * 3);
				this.active = true;
				this.trigger("activate");
			}
		}
	}
	
	this.states = {
		"current" : Garmr.STATE_FIRECOLUMN,
		"time" : 0.0,
		"transition" : 0.0,
		"goto" : new Point(x,y)
	}
}

Garmr.STATE_FIRECOLUMN = 0;
Garmr.STATE_LIGHTNING = 1;
Garmr.STATE_ZOOMATTACK = 2;
Garmr.STATE_SMASHPLATFORM = 3;
Garmr.STATE_GUST = 4;
Garmr.STATE_BULLETHELL = 5;


Garmr.prototype.setState = function(s){
	this.states.current = s;
	
	if(this.states.current == Garmr.STATE_FIRECOLUMN){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y - 80;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
	if(this.states.current == Garmr.STATE_LIGHTNING){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x;
		this.states.goto.y = _player.position.y - 80;
	}
	if(this.states.current == Garmr.STATE_ZOOMATTACK){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
	if(this.states.current == Garmr.STATE_SMASHPLATFORM){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
	}
	if(this.states.current == Garmr.STATE_GUST){
		this.states.time = Game.DELTASECOND * 3;
		this.states.transition = Game.DELTASECOND * 0.5;
	}
	if(this.states.current == Garmr.STATE_BULLETHELL){
		this.states.time = Game.DELTASECOND * 4;
		this.states.transition = Game.DELTASECOND * 0.5;
		this.states.goto.x = this.position.x + (this.position.x > _player.position.x ? -120 : 120 );
		this.states.goto.y = _player.position.y;
		this.projectionFlip = this.states.goto.x > this.position.x;
	}
}
Garmr.prototype.update = function(){
	if ( this.life > 0 && this.active ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.transition > 0){
			this.projectionFrame.x = (this.projectionFrame.x + this.delta * 0.1) % 4;
			this.projectionFrame.y = 0;
			
			this.projection.x = Math.lerp(this.projection.x,this.states.goto.x,this.delta*0.1);
			this.projection.y = Math.lerp(this.projection.y,this.states.goto.y,this.delta*0.1);
			this.states.transition -= this.delta;
		} else {
			if(this.states.current == Garmr.STATE_FIRECOLUMN){
				if(this.states.time > 0 ){
					//Drop flames
					if(Timer.isAt(this.states.time,Game.DELTASECOND,this.delta)){
						var xoff = 32;
						for(var i=0; i < 6; i++){
							var xpos = (this.projectionFlip?-1:1) * xoff;
							var ftower = new FlameTower(xpos+this.projection.x, this.projection.y);
							ftower.damage = this.damage;
							ftower.time = Game.DELTASECOND * i * -0.4;
							game.addObject(ftower);
							xoff += Math.random()>0.5 ?  40 : 80;
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_LIGHTNING);
				}
			}
			if(this.states.current == Garmr.STATE_LIGHTNING){
				if(this.states.time > Game.DELTASECOND){
					//Move to center of the screen
					this.projection.y = this.treads.position.y - 40;
					this.projectionFrame.x = 0;
					this.projectionFrame.y = 1;
				} else if(this.states.time > 0 ){
					//Drop lightening
					this.projectionFrame.x = 4;
					this.projectionFrame.y = 1;
					
					var xoff = this.position.x - 160;
					for(var i=0; i < 4; i++){
						if(Timer.isAt(this.states.time,Game.DELTASECOND,this.delta)){
							var lightning1 = new LightningBolt(xoff,this.projection.y);
							var lightning2 = new LightningBolt(xoff,this.projection.y);
							lightning1.speed = -2;
							lightning2.speed = 2;
							lightning1.damage = lightning2.damage = this.damage;
							game.addObject(lightning1);
							game.addObject(lightning2);
							xoff += 80;
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_ZOOMATTACK);
				}
			}
			if(this.states.current == Garmr.STATE_ZOOMATTACK){
				if(this.states.time > Game.DELTASECOND){
					//Move to edge of the screen
					this.projection.y = this.treads.position.y - 40;
				} else if(this.states.time > 0 ){
					//Zoom across
					var flytoright = this.states.goto.x < this.position.x;
					var flyto = this.position.x + (flytoright ? 160 : -160);
					if((flytoright && this.projection.x < flyto) || (!flytoright && this.projection.x > flyto)){
						this.projection.x += this.speed * this.delta * 5 * (flytoright?1:-1);
						var hits = game.overlaps(new Line(
							this.projection.x - 32,
							this.projection.y - 32,
							this.projection.x + 32,
							this.projection.y + 32
						));
						var playerIndexhits = hits.indexOf(_player);
						if(playerIndexhits>=0){
							hits[playerIndexhits].hurt(this,this.damage);
						}
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_GUST);
				}
			}
			if(this.states.current == Garmr.STATE_GUST){
				if(this.states.time > 0 ){
					//blow player back
					this.projectionFrame.x = Math.max((this.projectionFrame.x+this.delta)%3,1);
					this.projectionFrame.y = 2;
					
					if(_player.position.x > this.projection.x){
						this.projectionFlip = false;
						_player.force.x += this.delta * 0.7;
					} else {
						this.projectionFlip = true;
						_player.force.x += this.delta * -0.7;
					}
					this.projection.y = _player.position.y - 40;
				} else {
					//Next state
					this.setState(Garmr.STATE_BULLETHELL);
				}
			}
			if(this.states.current == Garmr.STATE_BULLETHELL){
				if(this.states.time > 0 ){
					//Fire wave of bullets
					this.projection.y = this.treads.position.y - 40;
					this.projectionFrame.x = Math.max((this.projectionFrame.x+this.delta)%3,1);
					this.projectionFrame.y = 2;
					
					if(Timer.interval(this.states.time, Game.DELTASECOND*0.3, this.delta)){
						var xoff = 64 * this.projectionFlip ? -1 : 1;
						var yoff = Math.random() < 0.333  ? -8 : (Math.random() < 0.5 ? 14 : -32 );
						var bullet = new PhantomBullet(this.projection.x + xoff, this.projection.y + yoff);
						bullet.damage = Math.ceil(0.7 * this.damage);
						bullet.force.x = this.projectionFlip ? -4 : 4;
						game.addObject(bullet);
					}
				} else {
					//Next state
					this.setState(Garmr.STATE_FIRECOLUMN);
				}
			}
			
			this.states.time -= this.delta;
		}
		
		Background.pushLight(this.projection, 240);
	}
}
Garmr.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	try {
		if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
			var flip = this.projection.x - _player.position.x > 0;
			g.renderSprite(this.sprite,this.projection.subtract(c),this.zIndex+1,this.projectionFrame, this.projectionFlip);
		}
	} catch (err){}
}
Garmr.prototype.idle = function(){}

 /* platformer\boss_ghostchort.js*/ 

GhostChort.prototype = new GameObject();
GhostChort.prototype.constructor = GameObject;
function GhostChort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = "pigboss";
	this.speed = .9;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = Spawn.life(26,this.difficulty);
	this.collideDamage = 5;
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(6,this.difficulty);
	
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
		Quests.set("q2","complete");
		
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
}
GhostChort.prototype.update = function(){
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

GhostChort.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), 180 );
}

 /* platformer\boss_marquis.js*/ 

Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 64;
	this.sprite = "megaknight";
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
		
	this.life = Spawn.life(24,this.difficulty);
	this.mass = 4.0;
	this.damage = Spawn.damage(5,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
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
	this.sprite = "megaknight";
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
	this.sprite = "minotaur";
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
	
	this.life = Spawn.life(30,this.difficulty);
	this.mass = 5.0;
	this.damage = Spawn.damage(5,this.difficulty);
	this.collideDamage = Spawn.damage(5,this.difficulty);
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
function Poseidon(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 64;
	this.sprite = "poseidon";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	this.speed = 0.6;
	this.active = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 1;
	
	o = o || {};
	
	if("difficulty" in o){
		this.difficulty = o["difficulty"]*1;
	}
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = Spawn.life(30,this.difficulty);
	this.lifeMax = this.life;
	this.collideDamage = 5;
	this.damageReduction = 0.333;
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(6,this.difficulty);
	this.stun_time = 0;
	this.interactive = false;
	
	this.mass = 6.0;
	this.gravity = 0.4;
	
	this.states = {
		"current" : 0,
		"transition" : 0,
		"transitionTotal" : 0,
		"timer" : 0,
		"timerTotal" : 0,
		"targetX" : 0,
		"startX" : this.position.x
	}
	
	this.on("land", function(){
		this.setState(Poseidon.LAND_STATE);
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			if(this.force.y > 0 && this.states.current == Poseidon.JUMP_STATE){
				obj.hurt(this, this.landDamage);
			}
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("downstabbed", function(obj,damage){
		if(
			this.states.current == Poseidon.IDLE_STATE ||
			this.states.current == Poseidon.TOSS_STATE ||
			this.states.current == Poseidon.FIRE_STATE ||
			this.states.current == Poseidon.BASH_STATE
		){
			this.setState(Poseidon.ESCAPE_STATE);
		}
	});
	this.on("death", function(){
		Item.drop(this,50);
		this.destroy();
	});
}

Poseidon.IDLE_STATE = 0;
Poseidon.TOSS_STATE = 1;
Poseidon.WALK_STATE = 2;
Poseidon.JUMP_STATE = 3;
Poseidon.FIRE_STATE = 4;
Poseidon.BASH_STATE = 5;
Poseidon.RUSH_STATE = 6;
Poseidon.BITE_STATE = 7;
Poseidon.LAND_STATE = 9;
Poseidon.ESCAPE_STATE = 10;

Poseidon.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	
	this.states.current = s;
	if(s == Poseidon.IDLE_STATE){
		this.states.transition = this.states.transitionTotal = 0.0;
		this.states.timer = this.states.timerTotal = Game.DELTASECOND;
	} else if(s == Poseidon.TOSS_STATE){
		this.states.transition = this.states.transitionTotal = Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.3 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.WALK_STATE){
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 1.5 * Game.DELTASECOND;
	} else if(s == Poseidon.JUMP_STATE){
		this.states.transition = this.states.transitionTotal = 0.3 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
		this.states.targetX = _player.position.x;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.FIRE_STATE){
		this.states.transition = this.states.transitionTotal = 1.5 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.6 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.BASH_STATE){
		this.states.transition = this.states.transitionTotal = 0.5 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.RUSH_STATE){
		this.states.transition = this.states.transitionTotal = 1.0 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 1.0 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.BITE_STATE){
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 0.8 * Game.DELTASECOND;
	} else if(s == Poseidon.LAND_STATE){
		shakeCamera(Game.DELTASECOND*0.5, 6);
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
	} else if(s == Poseidon.ESCAPE_STATE){
		this.flip = this.states.startX < this.position.x;
		this.states.transition = this.states.transitionTotal = 0;
		this.states.timer = this.states.timerTotal = 1.0 * Game.DELTASECOND;
	}
}
Poseidon.prototype.selectState = function(){
	var dir = this.position.subtract(_player.position);
	
	if(Math.abs(dir.x) > 240){
		var roll = Math.random();
		if(roll < 0.4){
			this.setState(Poseidon.JUMP_STATE);
		} else if(roll < 0.5){
			this.setState(Poseidon.FIRE_STATE);
		} else if(roll < 0.9){
			this.setState(Poseidon.RUSH_STATE);
		} else {
			this.setState(Poseidon.WALK_STATE);
		}
	} else if(Math.abs(dir.x) < 120){
		var roll = Math.random();
		if(roll < 0.5){
			this.setState(Poseidon.BASH_STATE);
		} else if(roll < 0.75){
			this.setState(Poseidon.TOSS_STATE);
		} else {
			this.setState(Poseidon.FIRE_STATE);
		}
	} else {
		var roll = Math.random();
		if(roll < 0.2){
			this.setState(Poseidon.TOSS_STATE);
		} else if(roll < 0.4){
			this.setState(Poseidon.JUMP_STATE);
		} else if(roll < 0.6){
			this.setState(Poseidon.FIRE_STATE);
		} else if(roll < 0.8){
			this.setState(Poseidon.WALK_STATE);
		} else {
			this.setState(Poseidon.RUSH_STATE);
		} 
	}
}
Poseidon.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	Background.pushLight(this.position,200);
	
	if(this.active && this.life > 0){
		
		if(this.states.transition > 0){
			var transitionProgress = 1 - (this.states.transition / this.states.transitionTotal);
			
			if(this.states.current == Poseidon.TOSS_STATE){
				this.frame.x = transitionProgress * 9;
				this.frame.y = 1;
			} else if(this.states.current == Poseidon.JUMP_STATE){
				this.frame.x = transitionProgress * 3;
				this.frame.y = 3;
			}else if(this.states.current == Poseidon.FIRE_STATE){
				this.frame.x = Math.min(transitionProgress * 12, 3);
				this.frame.y = 4;
			}else if(this.states.current == Poseidon.BASH_STATE){
				this.frame.x = Math.min(transitionProgress * 5, 3);
				this.frame.y = 8;
			}else if(this.states.current == Poseidon.RUSH_STATE){
				this.frame.x = Math.min(transitionProgress * 8, 8);
				this.frame.y = 7;
			}
			this.states.transition -= this.delta;
		} else {
			var timerProgress = 1 - (this.states.timer / this.states.timerTotal);
			
			if(this.states.current == Poseidon.IDLE_STATE){
				this.frame.x = (this.frame.x + this.delta * 0.3) % 10;
				this.frame.y = 0;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.TOSS_STATE){
				if(this.states.timer + this.delta >= this.states.timerTotal){
					var bullet = new Bullet(this.position.x, this.position.y+8, (this.flip?-1:1));
					bullet.team = 0;
					bullet.frames = 4;
					bullet.frame.y = 0;
					bullet.blockable = 1;
					bullet.force.x *= 2;
					bullet.damage = this.damage;
					game.addObject(bullet);
				}
				this.frame.x = Math.min(9 + timerProgress * 2, 10);
				this.frame.y = 1;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.WALK_STATE){
				this.flip = this.position.x > _player.position.x;
				this.force.x += (this.flip?-1:1) * this.delta * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 8;
				this.frame.y = 2;
				if(this.states.timer <= 0){
					this.setState(Poseidon.BASH_STATE);
				}
			} else if(this.states.current == Poseidon.JUMP_STATE){
				if(this.grounded){
					this.grounded = false;
					this.force.y = -10;
				} else {
					this.frame.x = 3;
					if(this.force.y < -1) this.frame.x = 4;
					if(this.force.y > 1) this.frame.x = 5;
					var distance = this.position.x - this.states.targetX;
					if(Math.abs(distance) > 32){
						this.force.x += this.delta * 1.5 * this.speed * (distance<0?1:-1);
					}
				}
			} else if(this.states.current == Poseidon.FIRE_STATE){
				if(this.states.timer + this.delta >= this.states.timerTotal){
					var bullet = new Bullet(this.position.x, this.position.y, (this.flip?-1:1));
					bullet.team = 0;
					bullet.frames = [5,6,7];
					bullet.frame.y = 1;
					bullet.blockable = 0;
					bullet.damage = this.damage;
					game.addObject(bullet);
				}
				this.frame.x = Math.min(4 + timerProgress*6, 7);
				this.frame.y = 4;
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.BASH_STATE){
				this.frame.x = Math.min(4 + timerProgress*8, 8);
				this.frame.y = 8;
				if(timerProgress < 0.5){
					this.strike(new Line(16,-8,64,24));
				}
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.RUSH_STATE){
				this.force.x += (this.flip?-1:1) * this.delta * 1.5 * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 6;
				this.frame.y = 6;
				if(this.states.timer <= 0 || (Math.abs(dir.x) < 64 && Math.abs(dir.y) < 32)){
					this.setState(Poseidon.BITE_STATE);
				}
			} else if(this.states.current == Poseidon.BITE_STATE){
				this.frame.x = Math.min(timerProgress*7, 6);
				this.frame.y = 5;
				if(timerProgress > 0.2 && timerProgress < 0.5){
					this.strike(new Line(16,-8,64,24), "hurt");
				}
				if(this.states.timer <= 0){
					this.selectState();
				}
			} else if(this.states.current == Poseidon.LAND_STATE){
				this.frame.x = Math.min(6+timerProgress*6, 11);
				this.frame.y = 3;
				if(this.states.timer <= 0){
					this.setState(Poseidon.IDLE_STATE);
				}
			} else if(this.states.current == Poseidon.ESCAPE_STATE){
				this.force.x += (this.flip?-1:1) * this.delta * this.speed;
				this.frame.x = (this.frame.x + this.delta * 0.3) % 8;
				this.frame.y = 2;
				if(this.states.timer <= 0){
					this.selectState();
				}
			}
			
			this.states.timer -= this.delta;
		}
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
	this.sprite = "zoder";
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
	
	this.life = Spawn.life(24,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
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
	this.height = 6;
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
	this.sprite = "bullets";
	
	this.addModule( mod_rigidbody );
	this.force.x = d * this.speed;
	this.pushable = false;
	
	this.on("collideObject", Bullet.hit);
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
		var f = ((99999 - this.range)*0.2) % this.frames.length;
		this.frame.x = this.frames[Math.floor(f)];
	}
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
	}
}

Bullet.hit = function(obj){
	if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
		if( !this.blockable || !obj.hasModule(mod_combat) ) {
			obj.hurt( this, this.damage );
		} else {
			var flip = obj.flip ? -1:1;
			var shield = new Line(
				obj.position.x + (obj.guard.x) * flip,
				obj.position.y + (obj.guard.y),
				obj.position.x + (obj.guard.x + obj.guard.w) * flip,
				obj.position.y + (obj.guard.y + obj.guard.h)
			);
			
			if( obj.guard.active && (this.flip!=obj.flip) && shield.overlaps(this.bounds()) ){
				this.trigger("blocked",obj);
				obj.trigger("block",this,this.position,this.damage);
			} else {
				this.trigger("hurt_other",obj);
				obj.hurt( this, this.damage );
			}
			
		}
		this.trigger("death");
	}
}

PhantomBullet.prototype = new GameObject();
PhantomBullet.prototype.constructor = GameObject;
function PhantomBullet(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 10;
	this.height = 6;
	
	this.sprite = "bullets";
	this.frame = new Point(0,0);
	
	this.blockable = true;
	this.force = new Point();
	this.team = 0;
	this.time = Game.DELTASECOND * 2;
	this.damage = 1;
	
	this.on("collideObject", Bullet.hit);
	this.on("sleep", function(){ this.destroy(); } );
	this.on("death", function(){ this.destroy(); } );
	
	o = o || {};
	if(d instanceof Array && d.length >= 2){
		this.width = d[0] * 1;
		this.width = d[1] * 1;
	}
}
PhantomBullet.prototype.update = function(){
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	this.time -= this.delta;
	this.flip = this.force.x < 0;
	
	if(this.time <= 0){
		this.destroy();
	}
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
	
	this.sprite = "bullets";
	this.frame.x = 0;
	this.frame.y = 3;
	this.life = Game.DELTASECOND * 8;
	this.mass = 0;
	this.friction = 1.0;
	
	this.on("struck", function(obj, pos, damage){
		if( damage > 0 ) this.life = 0;
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		
		if( obj.hurt instanceof Function ) {
			this.life = 0;
			obj.hurt( this, this.damage );
		}
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
Fire.prototype.update = function(){
	this.frame.x = (this.frame.x + (this.delta * 0.5)) % 3;
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
	
	this.sprite = "bullets";
	this.gravity = 0.333;
	this.pushable = false;
	this.frame.x = 3;
	this.frame.y = 0;
	
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
		audio.play("explode2");
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
	this.sprite = ops.sprite || "bullets";
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
	
	this.sprite = "explosion";
	
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
		shakeCamera(dir);
	} catch (err) {}
}
Explosion.prototype.idle = function(){}
Explosion.prototype.update = function(){
	var progress = 1.0 - (this.time / this.totalTime);
	
	this.frame.x = Math.floor( progress * 8 ) % 4;
	this.frame.y = Math.floor( progress * 2 );
	
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

 /* platformer\checkpoint.js*/ 

Checkpoint.prototype = new GameObject();
Checkpoint.prototype.constructor = GameObject;
function Checkpoint(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.sprite = "checkpoint";
	this.activated = false;
	
	this.on("collideObject",function(obj){
		if(!this.activated && obj instanceof Player){
			var allpoints = game.getObjects(Checkpoint);
			for(var i=0; i < allpoints.length; i++){
				allpoints[i].activated = false;
			}
			this.activated = true;
			obj.checkpoint.x = this.position.x;
			obj.checkpoint.y = this.position.y;
			obj.heal = obj.lifeMax;
			obj.manaHeal = obj.manaMax;
			audio.play("item1");
			game.slow(0,Game.DELTASECOND*0.3333);
		}
	});
}

Checkpoint.prototype.render = function(g,c){
	if(this.activated){
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		this.frame.y = 1;
		Background.pushLight(
			this.position,
			Math.random()*5+120,
			[1.0,0.8,0.6,1.0]
		);
	}else {
		this.frame.x = 0;
		this.frame.y = 0;
	}
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\cornerstone.js*/ 

CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 64;
	this.height = 96;
	this.gateNumber = 0;
	this.gate_variable = "gate_0"
	this.broken = 0;
	
	this.play_fanfair = false;
	
	if("gate" in options){
		this.gateNumber = options["gate"] * 1;
	}
	
	
	this.frame.x = this.broken ? 2 : 0;
	this.frame.y = this.gateNumber - 1;
	
	this.active = false;
	this.progress = 0.0;
	
	this.on("struck",function(obj,pos,damage){
		if( !this.active && obj instanceof Player ) {
			NPC.variables[this.gate_variable] = 1;
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
			//ga("send","event","cornerstone","completed temple:"+dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : 1024;
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
			-32 + x + _x,
			-48 + y +_y,
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
		this.frame.x = 1;
		
		if( this.progress > Game.DELTASECOND ) {
			if( !this.play_fanfair ){
				this.play_fanfair = true;
				audio.playAs("fanfair","music");
			}
			audio.playLock("explode1",10.0);
			this.frame.x = 2;
		}
		
		if( this.progress > Game.DELTASECOND * 7.0 ) {
			game.pause = false;
			_player.addXP(40);
			
			//For demo only
			if(this.gateNumber >= 4){
				game.clearAll();
				game.addObject(new DemoThanks(0,0));
				
			} else {
				_player.keys = new Array();
				NPC.set("templeCompleted", this.gateNumber);
				WorldLocale.loadMap("townhub.tmx");
			}
			
			//WorldMap.open()
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}

 /* platformer\damagetrigger.js*/ 

DamageTrigger.prototype = new GameObject();
DamageTrigger.prototype.constructor = GameObject;
function DamageTrigger(x,y,d,o){
	this.constructor();
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	this.position.x = x - (this.width / 2);
	this.position.y = y - (this.height / 2);
	this.origin.x = 0;
	this.origin.y = 0;
	
	this.restTimer = 0.0;
	this.damage = 12;
	this.alwaysKill = 0;
	this.alwaysHurt = 1;
	
	o = o || {};
	if("damage" in o){
		this.damage = o.damage * 1;
	}
	if("kill" in o){
		this.alwaysKill = o.kill * 1;
	}
	if("alwayshurt" in o){
		this.alwaysHurt = o["alwayshurt"] * 1;
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if(this.alwaysKill){
				obj.invincible = -1;
				obj.life = 0;
				obj.hurt(this,0);
			} else if( this.restTimer <= 0 ){
				if(this.alwaysHurt){
					obj.invincible = -1;
				}
				obj.hurt( this, Math.floor( this.damage ) );
				this.restTimer = Game.DELTASECOND * 2;
			}
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
	this.sprite = "player";
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

 /* platformer\demo.js*/ 

DemoThanks.prototype = new GameObject();
DemoThanks.prototype.constructor = GameObject;
function DemoThanks(){	
	this.constructor();
	this.sprite = "title";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 1;
	
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
}

DemoThanks.prototype.update = function(){
	
	if(this.progress >= 8.0){
		if(input.state("pause") == 1){
			audio.play("pause");
			delete self._player;
			game.clearAll();
			game.pause = false;
			game.deltaScale = 1.0;
			game_start(game);
		}
	} else {
		if(input.state("pause") == 1){
			this.progress = 10.0;
		}
	}
	
	this.progress += this.delta / Game.DELTASECOND;
}

DemoThanks.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	var pan = Math.min(this.progress/8, 1.0);
	
	g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
	
	//Random twinkling stars
	for(var i=0; i<this.stars.length; i++) {
		var star = this.stars[i];
		var frame = 2;
		if( 
			this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
			this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
		) frame = 3;
			
		g.renderSprite("bullets",star.pos.add(new Point(xpos,0)),this.zIndex,new Point(frame,2));
		star.timer -= this.delta;
		if( star.timer <= 0 ){
			star.timer = Game.DELTASECOND * 1.0;
			star.pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
		}			
	}
	this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
	if( this.progress > this.stars.timer ) {
		this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
		this.stars.timer += this.stars.reset;
	}
	
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),this.zIndex,new Point(0,1));
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.title_position, 0, pan)),this.zIndex,new Point(0,0));
	
	textArea(g,"Copyright Rattus/Rattus LLP 2016",8,4);
	textArea(g,"Version "+version,8,228);
}

DemoThanks.prototype.hudrender = function(g,c){	
	if( this.progress >= 8 ) {
		var y_pos = Math.lerp(240,20, Math.min( (this.progress-8)/2, 1) );
		var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
		
		var timeMinutes = Math.floor(DemoThanks.time / Game.DELTAMINUTE);
		var timeSeconds = Math.floor((DemoThanks.time - timeMinutes*Game.DELTAMINUTE)/ Game.DELTASECOND);
		if(timeSeconds < 10) timeSeconds = "0"+timeSeconds;
		
		boxArea(g,x_pos,y_pos,256,200);
		
		textArea(g,"Thank you for playing!",x_pos+16,y_pos+16);
		
		textArea(g,"Kills: "+DemoThanks.kills ,x_pos+16,y_pos+40);
		textArea(g,"Items: "+DemoThanks.items ,x_pos+16,y_pos+64);
		textArea(g,"Deaths: "+DemoThanks.deaths ,x_pos+16,y_pos+88);
		textArea(g,"Time: "+timeMinutes+":"+timeSeconds ,x_pos+16,y_pos+112);
		
		textArea(g,"Press start to play again",x_pos+16,y_pos+176);
	}	
}
DemoThanks.prototype.idle = function(){}

DemoThanks.deaths = 0;
DemoThanks.kills = 0;
DemoThanks.items = 0;
DemoThanks.time = 0;

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
		case "tiles0": this.sprite = "detritus0"; break;
		case "tiles1": this.sprite = "detritus1"; break;
		case "tiles2": this.sprite = "detritus2"; break;
		case "tiles3": this.sprite = "detritus3"; break;
		case "tiles4": this.sprite = "detritus4"; break;
		case "tiles5": this.sprite = "detritus5"; break;
		case "tiles6": this.sprite = "detritus6"; break;
		case "tiles7": this.sprite = "detritus7"; break;
		case "tiles8": this.sprite = "detritus8"; break;
		case "tiles9": this.sprite = "detritus9"; break;
		default: this.sprite = "detritus0"; break;
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
	
	this.sprite = "statues";
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
	this.sprite = "doors";
	
	this.lock = -1;
	this.isOpen = false;
	this.openAnimation = 0;
	this._tid = false;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	this.close();
	
	this.on("activate", function(obj){
		if(this.isOpen){
			audio.play("open");
			this.close();
		}else {
			audio.play("open");
			this.open();
		}
	});
	
	this.on("collideObject", function(obj){
		if( this.lock >= 0 && !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					audio.play("open");
					this.open();
				}
			}
		}
	});
	
	ops = ops || {};
	
	if("name" in ops) {
		this.name = ops.name;
		this.lock = this.name.match(/\d+/) - 0;
		this.frame.x = this.lock % 4;
		this.frame.y = Math.floor( this.lock / 4 );
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("open" in ops && ops["open"] > 0) {
		this.open();
	}
}
Door.prototype.close = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 1024);
	}
	this.zIndex = 0;
	this.isOpen = false;
}
Door.prototype.open = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -20;
	this.isOpen = true;
}
Door.prototype.update = function(){
	
	if( this.isOpen ) {
		this.openAnimation = Math.min(this.openAnimation + this.delta * 0.5, 3);
	} else {
		this.openAnimation = Math.max(this.openAnimation - this.delta * 0.5, 0);
	}
}
Door.prototype.render = function(g,c){
	g.renderSprite(
		this.sprite, 
		this.position.subtract(c), 
		this.zIndex,
		new Point(this.openAnimation, 3)
	);
	
	if( !this.isOpen && this.lock >= 0) {
		//Render lock
		g.renderSprite(
			this.sprite,
			this.position.subtract(c).add(new Point(10,36)), 
			this.zIndex+1,
			this.frame
		);
	}
}

 /* platformer\drain.js*/ 

Drain.prototype = new GameObject();
Drain.prototype.constructor = GameObject;
function Drain(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 1;
	this.position.x = x - d[0]*0.5;
	this.position.y = y + d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.emptyOnStart = 0;
	this.resetOnSleep = 0;
	
	this.fullheight = this.height;
	
	this.addModule(mod_block);
	
	this.active = 0;
	this.filling = 0;
	this.noFill = 0;
	this.noDrain = 0;
	
	this.on("activate",function(obj){
		if(this.height < 1){
			if(!this.noFill){
				this.filling = 1;
				this.active = 1;
			}
		} else {
			if(!this.noDrain){
				this.filling = 0;
				this.active = 1;
			}
		}
	});
	
	this.on("reset",function(obj){
		if(this.emptyOnStart){
			this.height = 0;
		} else {
			this.height = this.fullheight;
		}
		this.active = 0;
		this.updateTiles();
	});
	
	/*
	this.on("collideObject", function(obj){
		if(this.active){
			if( obj.hasModule(mod_rigidbody) ) {
				var base = _player.position.y - _player.corners().bottom;
				obj.position.y = this.position.y - this.height + base;
				obj.trigger( "collideVertical", 1);
				this.onboard.push(obj);
			}
		}
	});*/
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("empty" in ops){
		this.emptyOnStart = ops["empty"] * 1;
		if(this.emptyOnStart){
			this.height = 0;
			this.updateTiles();
		}
	}
	if("nofill" in ops){
		this.noFill = ops["nofill"] * 1;
	}
	if("nodrain" in ops){
		this.noDrain = ops["nodrain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"] * 1;
	}
	
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.trigger("reset");
		});
	}
}

Drain.prototype.update = function(){
	if(this.active){
		var movement = 0;
		if(this.filling){
			movement = this.delta * this.speed;
			this.height += movement;
			if(this.height > this.fullheight){
				this.filling = 0;
				this.height = this.fullheight;
				this.active = 0;
			}
		}else{
			movement = this.delta * -this.speed;
			this.height += movement;
			if(this.height < 0){
				this.height = 0;
				this.active = 0;
			}
		}
		/*
		for(var i=0; i < this.onboard.length; i++){
			this.onboard[i].position.y -= movement;
		}
		*/
		this.updateTiles();
	}
	//this.onboard = new Array();
}

Drain.prototype.render = function(g,c){
	if(this.active){
		for(var x=0; x < this.width; x+=16){
			var pos = new Point(
				x + Math.round(this.position.x/16)*16,
				this.position.y - this.height
			);
			var _t = 0;
			if(x>0) _t += 1;
			if(x+16>=this.width) _t += 1;
			var tile = Drain.TILES[_t]-1;
			var tilex = tile%32;
			var tiley = Math.floor(tile/32);
			g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(tilex,tiley));
			
			//Render bottom row of tiles to hide edge
			var tile = game.getTile(this.position.x+x,this.position.y+8,game.tileCollideLayer) - 1;
			g.renderSprite(game.map.tileset,this.position.add(new Point(x,0)).subtract(c),this.zIndex,new Point(tile%32,tile/32));
		}
	}
}

Drain.prototype.updateTiles = function(){
	for(var x=0; x < this.width; x+=16){
	for(var y=0; y < this.fullheight; y+=16){
		var pos = new Point(
			this.position.x + x,
			(this.position.y - this.fullheight) + y
		);
		if(y >= this.fullheight - this.height){
			var _t = 0;
			if(x>0) _t += 1;
			if(x+16>=this.width) _t += 1;
			if(y>0) {
				_t += 3;
				if(y+16>=this.fullheight) {
					_t += 3;
				}
			}
			var tile = Drain.TILES[_t];
			game.setTile(pos.x,pos.y,game.tileCollideLayer,tile);
		} else {
			game.setTile(pos.x,pos.y,game.tileCollideLayer,0);
		}
	}}
}
Drain.TILES = [321,322,322,353,354,355,385,386,387];

Drainage.prototype = new GameObject();
Drainage.prototype.constructor = GameObject;
function Drainage(x,y,d,o){
	this.constructor();
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	this.position.x = x - (this.width / 2);
	this.position.y = y - (this.height / 2);
	this.origin.x = 0;
	this.origin.y = 0;
	this.zIndex = -1;
	
	this.flowHeight = this.height;
	this.flowSpeed = 7.0;
	this.flowTime = Game.DELTAYEAR;
	this.flowTimeFull = Game.DELTAYEAR;
	this.active = true;
	
	o = o || {};
	if("start" in o){
		this.active = o.start * 1;
		this.flowHeight = this.active ? this.flowSpeed : 0;
	}
	if("trigger" in o){
		this._tid = o.trigger;
	}
	if("flowtime" in o){
		this.flowTimeFull = o.trigger * 1;
		this.flowTime = this.flowTimeFull;
	}
	
	this.on("activate", function(obj){
		this.active = !this.active;
	});
	this.on("collideObject", function(obj){
		if(this.active){
			if( obj.hasModule(mod_rigidbody) ) {
				var dir = obj.position.subtract(this.position);
				if(!obj.grounded && dir.y < this.flowHeight){
					obj.force.y = Math.max(obj.force.y, 1.0);
					obj.force.x *= 0.85 * this.delta;
				}
			}
			if( obj.hasModule(mod_block) ){
				var top = obj.corners().top;
				this.flowHeight = Math.min(this.flowHeight, top - this.position.y);
			}
		}
	});
}
Drainage.prototype.render = function(g,c){
	if(this.active){
		this.flowHeight = Math.min(this.height, this.flowHeight + this.flowSpeed * this.delta);
		this.flowTime -= this.delta;
		if(this.flowTime <= 0){
			this.active = false;
			this.flowTime = this.flowTimeFull;
		}
	
		g.color = [0.1,0.6,0.0,1.0];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.flowHeight
		);
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
	this.zIndex = 99;
	this.sprite = "bullets";
	
	this.speed = 0.3;	
	sound = sound || "explode2";
	audio.playLock(sound,0.1);
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
	this.speed = 1 + Math.random()*0.3;
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
	this.zIndex = 2;
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
	this.zIndex = 2;
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
	var x_off = v.length * 3;
	for(var i=0; i < v.length; i++){
		var offset = Math.min(this.progress-(i*2),Math.PI);
		var bounce = Math.sin(offset) * 8;
		if(offset > 0){
			this.frame.x = v[i] * 1;
			this.frame.y = 1;
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(i*6-x_off,-bounce)),this.zIndex,this.frame);
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
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":2*progress});
		
		Background.pushLight(this.position,240*scale);
	} else {
		//Suck in
		var progress = this.time / this.phase1Time;
		var scale = (1-progress);
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":.1 + 0.5*scale});
		
		g.renderSprite("halo",this.position.subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":0.5*progress});
		
		for(var i=0; i < this.particles.length; i++){
			var p = this.particles[i];
			var r = p.radius * scale;
			var pos = new Point(r * Math.sin(p.angle), r * Math.cos(p.angle));
			g.renderSprite("halo",this.position.add(pos).subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":0.06*scale});
		}
		
		Background.pushLight(this.position,progress*360);
	}
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
				g.renderSprite("bullets",p.add(off),this.zIndex,new Point(3,2));
			}
		}
		
		if( progress > 1.0 && progress < 1.2 ) {
			audio.playLock("chargeready",0.5);
			var flashprogress = Math.floor((progress - 1.0) * 10);
			g.renderSprite("bullets",p,this.zIndex,new Point(flashprogress,1));
		}
	}
};

 /* platformer\enemy_amon.js*/ 

Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.charged = false;
	
	this.speed = 2.5;
	this.sprite = "lilghost";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("struck", function(obj,pos,damage){
		EnemyStruck.apply(this,arguments);
		if(obj instanceof Player && this.isCharged){
			obj.hurt(this,this.damage);
		}
	});
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	
	this.collisionReduction = -1.0;
	this.bounce = 1.0;
	this.friction = 0.0;
	this.stun_time = Game.DELTASECOND * 3;
	this.invincible_time = 30.0;
	this.changeTime = 0.0;
	this.isCharged = 0;
	this.force.x = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.force.y = this.speed * (Math.random() > 0.5 ? -1 : 1);
	this.backupForce = new Point(this.force.x, this.force.y);
	
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame.x = ( this.frame.x + this.delta * 0.2 ) % 3;
	
	if( this.stun < 0 ) {
		if(this.charged){
			if(this.isCharged){
				Background.pushLight(this.position,180,[.5,.7,1.0,1.0]);
				this.damageReduction = 1.0;
				this.changeTime -= this.delta;
				if(this.changeTime <= 0) {
					this.isCharged = 0;
				}
			} else{
				this.changeTime += this.delta;
				this.damageReduction = 0.0;
				if(this.changeTime >= Game.DELTASECOND * 2) {
					this.isCharged = 1;
				}
			}
		}
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
function Axedog(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "axedog";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.life(2,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.cooldown = Game.DELTASECOND * 0.5;
		this.states.attack = 0.0;
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
		this.frame.x = 3;
		this.frame.y = 2;
	} else if( this.states.attack > 0 ) {
		if( this.states.attack < this.attacks.rest ) {
			this.frame.x = 2;
			this.frame.y = 2;
		} else if (this.states.attack < this.attacks.release ){
			this.frame.x = 1;
			this.frame.y = 2;
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
		}
	} else {
		this.frame.y = 1;
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.2) % 4;
	}
}

 /* platformer\enemy_baller.js*/ 

Baller.prototype = new GameObject();
Baller.prototype.constructor = GameObject;
function Baller(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 72;
	this.sprite = "baller";
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.death_time = Game.DELTASECOND * 3.0;
	this.life = Spawn.life(16,this.difficulty);
	this.lifeMax = this.life;
	this.damage = Spawn.damage(5,this.difficulty);
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
			this.ball.frame.x = 1 + Math.floor((1-Math.abs(ball_position))*3);
			this.ball.flip = ball_position < 0;
			this.ball.position.x = this.position.x + ball_position * 96;
			this.ball.position.y = this.position.y + ball_height;
			
			if( this.states.swing <= 0 ) {
				this.states.release = this.timers.release;
				//Fling the ball
				this.ball.frame.x = 0;
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
		this.frame.x = 3;
		this.frame.y = 1;
	} else if( this.states.retrieve > 0 ) {
		this.frame.x = Math.max((this.frame.x + this.delta * 0.1) % 3, 1);
		this.frame.y = 1;
	} else if ( this.states.release > 0 ) {
		this.frame.x = 0;
		this.frame.y = 1;
	} else if ( this.states.swing > 0 ) { 
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		this.frame.y = 0;
	} else {
		this.frame.x = 1;
		this.frame.y = 1;
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
	this.sprite = "baller";
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
	this.frame.x = 0
	this.frame.y = 2;
}
BallerBall.prototype.update = function(){
	if( this.damage > 0 ) {
		this.strike( this.strikeBox );
	}
}

 /* platformer\enemy_batty.js*/ 

Batty.prototype = new GameObject();
Batty.prototype.constructor = GameObject;
function Batty(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "batty";
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 1,
		"lockon": false,
		"attack" : 0,
		"direction" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.lifeMax = Spawn.life(0,this.difficulty);
	this.mass = 0.8;
	this.collideDamage = this.damage = Spawn.damage(2,this.difficulty);
	this.inviciple_tile = this.stun_time;
	this.gravity = -0.6;
	this.fuse = this.difficulty >= 2;
	
	this.on("collideObject", function(obj){
		if( this.fuse && obj instanceof Batty ) {
			//Fuse with other batty
			this.destroy();
			obj.destroy();
			this.fuse = obj.fuse = false;
			var deckard = new Deckard( 
				this.position.x, 
				this.position.y, 
				false, 
				{
					"difficulty":this.difficulty
				} 
			);
			game.addObject(deckard);
			
			obj.trigger("swap", deckard);
			this.trigger("swap", deckard);
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
		this.frame.x = 1;
	} else {
		if( this.force.y > 1.0 ) {
			this.frame.x = 0;
		} else {
			this.frame.x = Math.max( (this.frame.x + this.delta * 0.3) % 5, 2);
		}
	}
}

 /* platformer\enemy_beaker.js*/ 

Beaker.prototype = new GameObject();
Beaker.prototype.constructor = GameObject;
function Beaker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "beaker";
	this.speed = 0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 50.0,
		"backwards": false,
		"jumps" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.lifeMax = Spawn.life(3,this.difficulty);
	this.mass = 0.8;
	this.collideDamage = Spawn.damage(2,this.difficulty);
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
function Bear(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "bear";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
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
	//this.sprite = "knight";
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
		this.frame.x = 0;
		this.frame.y = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame.x = (this.states.attack_down == 1 ? 2 : 0) + (this.states.attack > this.attack_time ? 0 : 1);
			this.frame.y = 1;
			this.criticalChance = 1.0;
		} else {
			this.criticalChance = 0.0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame.x = Math.max( (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4, 1 );
			} else {
				this.frame.x = 0;
			}
			this.frame.y = 0;
		}
	}
}
Bear.prototype.render = function(g,c){
	//Shield
	if( this.states.guard > 0 ) {
		g.renderSprite(
			this.sprite,
			new Point(this.position.x - c.x, this.position.y - c.y),
			this.zIndex,
			new Point((this.states.guard > 1 ? 2 : 3 ), 2),
			this.flip
		);
	}
	//Body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Sword
	var _x = 0
	if( this.states.attack > 0 ){
		_x = (this.states.attack > this.attack_time ? 0 : (this.flip ? -32 : 32 ));
	}
	g.renderSprite(
		this.sprite,
		new Point(_x + this.position.x - c.x, this.position.y - c.y), 
		this.zIndex,
		new Point(this.frame.x, this.frame.y+3),
		this.flip
	);
}

 /* platformer\enemy_bigbone.js*/ 

BigBones.prototype = new GameObject();
BigBones.prototype.constructor = GameObject;
function BigBones(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 40;
	this.sprite = "bigbones";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if( "active" in o ) {
		this.active = o.active.toLowerCase() == "true";
	}
	if( "flip" in o ) {
		this.flip = o.flip.toLowerCase() == "true";
	}
	
	this.life = Spawn.life(9,this.difficulty);
	this.mass = 2.0;
	this.damage = Spawn.damage(3,this.difficulty);
	this.stun_time = Game.DELTASECOND * 0.25;
	
	
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

 /* platformer\enemy_biker.js*/ 

Biker.prototype = new GameObject();
Biker.prototype.constructor = GameObject;
function Biker(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 56;
	this.previousForceX = 0.0;
	this.start_x = x;
	
	this.speed = 0.13;
	this.sprite = "biker";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
		this.states.runaway = Game.DELTASECOND * 0.5;
	});
	this.on("collideObject", function(obj){
		if( this.states.collideCooldown > 0 || this.team == obj.team ){
			return;
		} 
		if( obj instanceof Player && obj.hurt instanceof Function ) {
			var dir = _player.position.subtract(this.position);
			if((this.force.x > 0.25 && dir.x > 0) || (this.force.x < -0.25 && dir.x < 0)){
				this.states.collideCooldown = Game.DELTASECOND;
				this.states.runaway = Game.DELTASECOND * 1.0;
				obj.hurt( this, this.collideDamage );
			}
		}
	});
	this.on("pre_death", function(obj,pos,damage){
		var body = new BikerBody(this.position.x, this.position.y);
		body.force.x = this.force.x * 2;
		body.force.y = -6;
		body.grounded = false;
		game.addObject( body );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.mass = 5.3;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"collideCooldown" : 0.0,
		"runaway" : 0.0
	};
	
	this.calculateXP();
	
}
Biker.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.previousForceX = this.force.x;
	
	if( this.life > 0 ) {
		this.flip = this.force.x < 0;
		var direction = 0;
		if(this.states.runaway > 0){
			direction = this.force.x > 0 ? 1 : -1;
		} else {
			direction = dir.x < 0 ? 1 : -1;
		}
		this.force.x += this.speed * this.delta * direction;
		this.states.collideCooldown -= this.delta;
		this.states.runaway -= this.delta;
	} else {
		this.force.x = 0;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame.x = 0;
		this.frame.y = 1;
	} else {
		if( Math.abs( this.force.x ) > 2 ) {
			if(Math.abs(this.previousForceX) > Math.abs(this.force.x)){
				this.frame.y = 0;
				this.frame.x = 1;
			} else {
				this.frame.y = 0;
				this.frame.x = 0;
			}
		} else {
			this.frame.y = 0;
			this.frame.x = 2;
		}
	}
}
Biker.prototype.idle = function(){}

BikerBody.prototype = new GameObject();
BikerBody.prototype.constructor = GameObject;
function BikerBody(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 56;
	this.sprite = "biker";
	
	this.addModule( mod_rigidbody );
	this.interactive = false;
	this.friction = 0.05;
}

BikerBody.prototype.update = function(){
	if(this.grounded){
		this.frame.x = 2;
		this.frame.y = 1;
	} else {
		this.frame.x = 1;
		this.frame.y = 1;
	}
}

 /* platformer\enemy_bombbowler.js*/ 

BombBowler.prototype = new GameObject();
BombBowler.prototype.constructor = GameObject;
function BombBowler(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 60;
	
	this.sprite = "bombbowler";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.collideDamage = Spawn.damage(4,this.difficulty);
	this.mass = 5.0;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 1.0
	};
	
	this.calculateXP();
	
}
BombBowler.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.previousForceX = this.force.x;
	
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			this.flip = dir.x > 0;
			var bomb = new BombBowl(this.position.x, this.position.y);
			bomb.force.x = (this.flip ? -1 : 1) * 4;
			bomb.damage = this.damage;
			game.addObject(bomb);
			this.states.cooldown = Game.DELTASECOND * 3;
		}
		this.states.cooldown -= this.delta;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame.x = 0;
		this.frame.y = 0;
	} else {
		this.frame.x = 0;
		this.frame.y = 0;
	}
}

BombBowl.prototype = new GameObject();
BombBowl.prototype.constructor = GameObject;
function BombBowl(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 14;
	this.zIndex = 1;

	this.sprite = "bullets";
	this.frame.x = 6;
	this.frame.y = 0;
	this.rotate = 0.0;
	this.damage = 1;
	
	this.timer = 3.0 * Game.DELTASECOND;
	this.cooldown = 0.5* Game.DELTASECOND;
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
	this.collisionReduction = -1.0;
	this.friction = 0;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.cooldown <= 0){
				//test if shield is hit
				var c = this.corners();
				var bottom = new Line(c.left,c.bottom-8,c.right,c.bottom);
				if(bottom.overlaps(obj.shieldArea())){
					this.cooldown = Game.DELTASECOND * 0.5;
					this.force.x *= -1;
					audio.play("block")
				} else{
					this.explode();
				}
			}
		} else if(obj instanceof BombBowler){
			if(this.cooldown <= 0){
				this.explode();
			}
		}
	});
}
BombBowl.prototype.explode = function(){
	c = this.corners();
	l = new Line(c.left - 24, c.top - 24, c.right + 24, c.bottom + 24);
	list = game.overlaps(l);
	for(var i=0; i < list.length; i++){
		var obj = list[i];
		if(obj.hasModule(mod_combat)){
			obj.hurt(this, this.damage);
		}
	}
	shakeCamera(Game.DELTASECOND * 0.5, 4);
	audio.play("explode3");
	Background.flash = [1,1,1,1];
	this.destroy();
}
BombBowl.prototype.render = function(g,c){
	this.rotate = (this.rotate + this.delta * 5 * this.force.x) % 360;
	
	if(this.timer <= 0){
		this.explode();
	} else if(this.timer < Game.DELTASECOND * 0.5){
		this.filter = "hurt";
	} else if(this.timer < Game.DELTASECOND){
		var flash = Math.floor((20/Game.DELTASECOND)*10)%2;
		if(flash){
			this.filter = "hurt";
		}else {
			this.filter = "hurt";
		}
		
	}
	this.cooldown -= this.delta;
	this.timer -= this.delta;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"shader" : this.filter,
			"rotate" : this.rotate
		}
	)
}

 /* platformer\enemy_chaz.js*/ 

Chaz.prototype = new GameObject();
Chaz.prototype.constructor = GameObject;
function Chaz(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 30;
	this.start_x = x;
	
	this.speed = 0.1;
	this.sprite = "chaz";
	
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
	
	this.calculateXP();
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(7,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
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
				missle.frame.x = 4;
				missle.frame.y = 0;
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
		this.frame.x = 0;
		this.frame.y = 3;
	} else {
		if( this.states.attack > 0 ) {
			var progress = this.states.attack / (this.attack.warm-this.attack.release);
			if(this.states.attack_lower){
				this.frame.x = this.states.attack > this.attack.release ? 0 : 1;
				this.frame.y = 2;
			} else {
				if(this.states.attack <= this.attack.release){
					this.frame.x = 3;
				} else if(progress > 1.8){
					this.frame.x = 0;
				} else if(progress > 1.6){
					this.frame.x = 1;
				} else {
					this.frame.x = 2;
				}
				this.frame.y = 1;
			}
		} else {
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 2;
			if( Math.abs( this.force.x ) < 0.1 ){
				this.frame.x = 0;
			} 
			this.frame.y = 0;
		}
	}
}

 /* platformer\enemy_chickenchain.js*/ 

ChickenChain.prototype = new GameObject();
ChickenChain.prototype.constructor = GameObject;
function ChickenChain(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "chickenchain";
	this.speed = 0.125;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"direction" : 1.0,
		"attackstage" : 0,
		"duck" : 0
	};
	this.attacks = {
		"cooldown" : Game.DELTASECOND * 3,
		"distance" : 200,
		"speed" : 5.0,
		"rest" : 0
	}
	this.ball = new Point(0,0);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.attackstage = 0;
		this.states.cooldown = this.attacks.cooldown;
	});
	
	this.on("struckTarget", function(obj){
		if(obj instanceof Player && this.attacks.rest <= 0){
			this.attacks.rest = Game.DELTASECOND * 0.3333;
			console.log("struckTarget");
		}
	});
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
ChickenChain.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.attacks.rest = Math.max(this.attacks.rest-this.delta, 0);
		
		if( this.states.attackstage ) {
			this.force.x = this.force.y = 0;
			if(this.states.attackstage == 1){
				//Chain flies forward
				this.states.attack += this.attacks.speed * this.delta;
				if(this.states.attack >= this.attacks.distance){
					this.states.attackstage = 2;
					this.states.duck = Math.round(Math.random());
				}
			} else{
				//Chain return
				this.states.attack -= this.attacks.speed * this.delta;
				if(this.states.attack <= 0){
					this.states.attackstage = 0;
					this.states.duck = 0;
				}
			}
			this.ball = new Point(this.states.attack, (-4 + this.states.duck*16));
			if(this.attacks.rest <= 0){
				this.strike(new Line(this.ball,this.ball.add(new Point(4,4))));
			}
		} else {
			if( game.getTile( 
				16 * this.states.direction + this.position.x, 
				this.position.y + 28, game.tileCollideLayer) == 0 
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
			
			if( this.states.cooldown <= 0 && Math.abs( dir.x ) < this.attacks.distance ) {
				this.states.duck = Math.round(Math.random());
				this.states.attackstage = 1;
				this.states.cooldown = this.attacks.cooldown;
				this.flip = dir.x > 0;
				this.states.direction = this.flip ? -1.0 : 1.0;
				
			}
		}
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame.x = 2;
		this.frame.y = 1;
	} else if( this.states.attackstage > 0 ) {
		if( this.states.duck ) {
			var maxFrame = this.states.attackstage > 1 ? 5 : 3;
			this.frame.x = Math.min(this.frame.x + this.delta * 0.2, maxFrame);
			this.frame.y = 4;
		} else {
			var maxFrame = this.states.attackstage > 1 ? 4 : 2;
			this.frame.x = Math.min(this.frame.x + this.delta * 0.2, maxFrame);
			this.frame.y = 3;
		}
	} else {
		this.frame.y = 0;
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.2) % 4;
	}
}
ChickenChain.prototype.render = function(g,c){
	if(this.states.attackstage){
		var b = new Point(
			this.ball.x * this.states.direction,
			this.ball.y
		);
		var links = Math.ceil(this.states.attack / 9);
		for(var i=0; i < links; i++){
			var b2 = b.add(new Point(i*-9*this.states.direction,0));
			g.renderSprite(this.sprite,b2.add(this.position).subtract(c),this.zIndex,new Point(0,2));
		}
		g.renderSprite(this.sprite,b.add(this.position).subtract(c),this.zIndex,new Point(1,2));
	}
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\enemy_chickendrill.js*/ 

ChickenDrill.prototype = new GameObject();
ChickenDrill.prototype.constructor = GameObject;
function ChickenDrill(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 30;
	this.sprite = "chickendrill";
	this.speed = 0.125;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"drilling" : 0,
		"spike" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
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
ChickenDrill.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.drilling){
			this.states.attack -= this.delta;
			
			if(this.states.attack <= 0 ){
				this.states.drilling = 0;
			} else if(this.grounded){
				if (Timer.interval(this.states.attack,Game.DELTASECOND*0.2,this.delta)){
					var spikes = new ChickenDrillSpike(
						this.position.x + this.states.spike * 40 * (this.flip?-1:1), 
						this.position.y + 8
					);
					spikes.damage = this.damage;
					game.addObject(spikes);
					this.states.spike++;
				}
			}
		} else {
			//idle
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0 ){
				this.states.drilling = 1;
				this.states.attack = Game.DELTASECOND * 2.0;
				this.states.cooldown = Game.DELTASECOND * 2;
				this.states.spike = 1;
				this.force.y = -9;
				this.grounded = false;
				this.flip = dir.x > 0;
			}
		}
	}
	
	/* Animation */
	if( this.grounded ) {
		if(this.states.drilling){
			this.frame.x = (this.frame.x + this.delta * 0.8) % 3;
			this.frame.y = 2;
		} else {
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
		}
	} else {
		this.frame.y = 1;
		if(this.force.y > 0 ) {
			this.frame.x = 2;
		} else {
			this.frame.x = 1;
		}
	}
}
ChickenDrill.prototype.smoke = function(spos){
	var x = Math.lerp(spos.start.x, spos.end.x, Math.random());
	var y = Math.lerp(spos.start.y, spos.end.y, Math.random());
	
	game.addObject( new EffectSmoke(
		x, y, null,
		{
			"frame":1, 
			"speed":0.4 + Math.random() * 0.2,
			"time":Game.DELTASECOND * (0.3 + 0.4 * Math.random())
		}
	));
}

ChickenDrillSpike.prototype = new GameObject();
ChickenDrillSpike.prototype.constructor = GameObject;
function ChickenDrillSpike(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 8;
	this.sprite = "chickendrill";
	this.damage = 1;
	this.frame = new Point(0,3);
	this.time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			var prelife = obj.life;
			obj.hurt(this,this.damage);
			if(obj.life != prelife){
				this.destroy();
			}
		}
	});
}
ChickenDrillSpike.prototype.update = function(){
	this.frame.x = Math.min(this.frame.x + this.delta * 0.5, 2);
	this.time -= this.delta;
	
	if(this.time <= 0){
		this.destroy();
	}
}

 /* platformer\enemy_crusher.js*/ 



 /* platformer\enemy_deckard.js*/ 

Deckard.prototype = new GameObject();
Deckard.prototype.constructor = GameObject;
function Deckard(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 36;
	this.sprite = "deckard";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.lifeMax = Spawn.life(6,this.difficulty);
	this.mass = 4;
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
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
			var batty = new Batty(
				this.position.x, 
				this.position.y, 
				false, 
				{"difficulty":this.difficulty}
			);
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
		this.frame.x = this.states.attack < this.attack_time * 0.3 ? 1 : 0;
		this.frame.y = this.states.attack_lower ? 2 : 1;
	} else {
		if( this.grounded ) {
			this.frame.x = 0;
			this.frame.y = 0;
		} else {
			this.frame.x = (this.frame.x + (this.delta * Math.abs(this.force.x) * 0.2)) % 2;
			this.frame.y = 3;
		}
	}
}

 /* platformer\enemy_derring.js*/ 

Derring.prototype = new GameObject();
Derring.prototype.constructor = GameObject;
function Derring(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	
	this.speed = 2.5;
	this.sprite = "amon";
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
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

 /* platformer\enemy_donkeyknife.js*/ 

DonkeyKnife.prototype = new GameObject();
DonkeyKnife.prototype.constructor = GameObject;
function DonkeyKnife(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 44;
	this.sprite = "donkeyknife";
	this.speed = 1.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 3,
		"attack" : 0.0,
		"throwing" : 0.0,
		"throwingCool" : 0.0,
		"smoke" : 0
	};
	this.times = {
		"cooldown" : Game.DELTASECOND * 3.0,
		"attack" : Game.DELTASECOND * 1.0,
		"throwingCool" : Game.DELTASECOND * 0.66,
	}
	
	this.drill = new Line(0,0,8,8);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
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
DonkeyKnife.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.throwing > 0 ){
			var progress = Math.min(1 - this.states.throwingCool / this.times.throwingCool, 0.999);
			this.frame.y = 1;
			this.frame.x = progress * 4;
			
			if(this.states.throwingCool <= 0){
				this.states.throwing--;
				this.states.throwingCool = this.times.throwingCool;
				
				//Throw knife
				var missle;
				if( Math.random() > 0.5 ) {
					//Bottom
					missle = new Bullet(this.position.x, this.position.y+18, (this.flip?-1:1) );
				} else {
					//top
					missle = new Bullet(this.position.x, this.position.y+2, (this.flip?-1:1) );
				}
				missle.force.x *= 1.5;
				missle.damage = this.damage;
				missle.frame.x = 4;
				missle.frame.y = 0;
				game.addObject( missle ); 
			}
			this.states.throwingCool -= this.delta;
		} else if(this.states.attack > 0) {
			var progress = Math.min(1 - this.states.attack / this.times.attack, 0.999);
			
			this.frame.y = 3;
			this.frame.x = progress * 4;
			
			if(progress > .3 && progress < .6){
				this.strike(new Line(0,-24,32,16));
			}
			this.states.attack -= this.delta;
		} else {
			if(Math.abs(dir.x) < 88){
				//move away from player
				this.frame.y = 2;
				this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4;
				this.force.x = this.speed * (this.flip ? 1 : -1);
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = this.times.cooldown;
					this.states.attack = this.times.attack;
					this.force.x = 8 * (this.flip ? -1 : 1);
				}
			} else {
				//throw knives
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = this.times.cooldown;
					this.states.throwing = 3;
					this.states.throwingCool = this.times.throwingCool;
				}
			}
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
		}
	}
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
		bullet.damage = Spawn.damage(2,this.difficulty);
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
	this.sprite = "characters";
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

 /* platformer\enemy_fireman.js*/ 

Fireman.prototype = new GameObject();
Fireman.prototype.constructor = GameObject;
function Fireman(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	this.zIndex = 1;
	
	this.sprite = "flameman";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 2;
	this.bullet = null;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(5,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"current" : 0,
		"cooldown" : 50
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
Fireman.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.current == 0){
			//idle
			this.frame = new Point();
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet = new FiremanFlame(this.position.x,this.position.y + this.height*0.5);
				this.bullet.flip = this.flip;
				this.bullet.damage = this.damage;
				this.bullet.time = Game.DELTASECOND * 5;
				game.addObject(this.bullet);
				
				this.states.current = 1;
				this.states.cooldown = Game.DELTASECOND * 2;
			}
		} else if(this.states.current == 1){
			//charge
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet.phase = 1;
				this.states.current = 2;
				this.states.cooldown = Game.DELTASECOND * 2;
				this.bullet.time = Game.DELTASECOND * 3;
			}
		} else if(this.states.current == 2){
			//move ahead
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.bullet.phase = 2;
				this.bullet.force.x = 9 * (this.bullet.flip ? -1 : 1);
				this.states.current = 3;
				this.states.cooldown = Game.DELTASECOND * 1;
				this.bullet.time = Game.DELTASECOND * 2;
			}
		} else if(this.states.current == 3){
			//fire
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 4;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 4){
			//nude
			this.frame = new Point(0,2);
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 5;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		} else if(this.states.current == 5){
			//regrow
			this.frame = new Point();
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				this.states.current = 0;
				this.states.cooldown = Game.DELTASECOND * 1;
			}
		}
	}
	
	Background.pushLight( this.position, 200, [1,0.8,0,1] );
}

 

FiremanFlame.prototype = new GameObject();
FiremanFlame.prototype.constructor = GameObject;
function FiremanFlame(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 56;
	this.zIndex = 0;
	
	this.phase = 0;
	this.basePosition = new Point(x,y);
	this.transformSpeed = 0.05;
	this.time = Game.DELTASECOND * 5;
	this.damage = 1;
	this.force = new Point();
	this.extraLift = 0;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
		}
	});
}

FiremanFlame.prototype.update = function(){
	if(this.phase == 0){
		this.width = Math.lerp(this.width, 64, this.delta * this.transformSpeed);
		this.height = Math.lerp(this.height, 144, this.delta * this.transformSpeed);
		this.position.y = this.basePosition.y - (this.height / 2);
	} else if(this.phase == 1){
		this.width = Math.lerp(this.width, 32, this.delta * this.transformSpeed);
		this.height = Math.lerp(this.height, 32, this.delta * this.transformSpeed);
		this.extraLift = Math.lerp(this.extraLift, -12, this.delta * this.transformSpeed);
		this.position.y = this.extraLift + (this.basePosition.y - (this.height / 2));
		
		var front = this.basePosition.x + (this.flip ? -48 : 48);
		this.position.x = Math.lerp(this.position.x, front, this.delta * this.transformSpeed);
	}
	
	this.time -= this.delta;
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
	
	if(this.time <= 0){
		this.destroy();
	}
	
	Background.pushLight( this.position, Math.max(this.width,this.height)*2, [1,0.7,0,1] );
}
	
FiremanFlame.prototype.render = function(g,c){
	g.color = [1.0,0.7,0.0,1.0];
	g.scaleFillRect(
		(this.position.x - this.width*0.5) - c.x,
		(this.position.y - this.height*0.5) - c.y,
		this.width, this.height
	);
}

 /* platformer\enemy_flederknife.js*/ 

Flederknife.prototype = new GameObject();
Flederknife.prototype.constructor = GameObject;
function Flederknife(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "flederknife";
	this.speed = 0.3;
	this.turndelay = 0.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"direction" : 1.0,
		"jump" : 0,
		"down" : 0,
		"jump_tick" : 1
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.lifeMax = Spawn.life(3,this.difficulty);
	this.damage = Spawn.life(1,this.difficulty);
	this.mass = 1.0;
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && this.turndelay <= 0){
			this.force.x = 0;
			this.states.direction *= -1.0;
			this.turndelay = Game.DELTASECOND;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.force.x = 0;
		this.states.direction *= -1.0;
		
		if(this.difficulty > 0){
			this.states.duck = Math.round(Math.random());
		}
		if(this.difficulty > 1){
			this.states.jump_tick--;
		}
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract( _player.position );
		this.states.direction = dir.x > 0 ? -1.0 : 1.0;
		this.states.jump_tick = 1;
		
		if(this.difficulty > 0){
			this.states.duck = Math.round(Math.random());
		}
		if(this.difficulty > 1){
			this.states.jump_tick = Math.floor(Math.random()*3);
		}
	});
	this.on("death", function(){
		_player.addXP(this.xp_award);
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	
	this.faceTarget();
	this.calculateXP();
}
Flederknife.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = this.states.direction < 0;
		
		this.force.x += this.delta * this.speed * this.states.direction;
		
		if(this.states.jump && this.grounded){
			this.states.jump = 0;
			this.faceTarget();
			this.force.y -= this.delta * 3;
		} 

		if(this.grounded){
			if(this.states.duck){
				this.strike( new Line(0, 6, 12, 2) );
			} else {
				this.strike( new Line(0, -6, 12, 2) );
			}
		}
		
		if(this.states.jump_tick <= 0 && this.grounded && Math.abs(dir.x) < 80){
			//Jump behind the player
			this.states.jump = 1;
			this.grounded = false;
			this.states.direction = dir.x > 0 ? -1.0 : 1.0;
			this.force.y = -12;
			this.force.x = this.states.direction * 10;
			this.states.jump_tick = 2 + Math.floor(Math.random()*3);
		}
		this.turndelay -= this.delta; 
	}
	
	/* Animation */
	if( this.stun > 0 ) {
		this.frame.x = 3;
		this.frame.y  = 2;
	} else if( this.states.jump ){
		this.frame.x = (this.frame.x + this.delta * 0.4) % 3;
		this.frame.y = 2;
	} else {
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.2) % 4;
		if(this.states.duck){
			this.frame.y  = 0;
		} else {
			this.frame.y  = 1;
		}
	}
}

Flederknife.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.states.direction = dir.x < 0 ? -1.0 : 1.0;
}

 /* platformer\enemy_fly.js*/ 

Fly.prototype = new GameObject();
Fly.prototype.constructor = GameObject;
function Fly(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.damage = Spawn.damage(2,this.difficulty);
	this.team = 0;
	this.sprite = "amon";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(1,this.difficulty);
	
	this.speed = 0.25;
	this.frame = new Point(0,1);
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
	
	this.frame.x = (this.frame.x + this.delta * 0.5) % 2.0;
}

 /* platformer\enemy_flyingslime.js*/ 

FlyingSlime.prototype = new GameObject();
FlyingSlime.prototype.constructor = GameObject;
function FlyingSlime(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.startPosition = new Point(x,y);
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.4;
	this.sprite = "flyingslime";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("struck", EnemyStruck);
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = 9999;
	this.damage = Spawn.damage(2,this.difficulty);
	this.loopTime = 0.0;
	this.loopTimeFull = Game.DELTASECOND;
	
	this.mass = 1.0;
	this.gravity = 0.0;
	this.friction = 0.8;
	this.pushable = true;
}
FlyingSlime.prototype.update = function(){
	this.frame = 0;
	this.frame_row = 0;
	this.grounded = false;
	
	var variation = this.position.subtract(this.startPosition);
	this.force.y = 0;
	if(Math.abs(variation.x) > 4){
		if(variation.x > 0){
			this.force.x -= this.speed * this.delta;
		} else {
			this.force.x += this.speed * this.delta;
		}
	}
	
	this.loopTime += this.delta;
	this.position.y = this.startPosition.y - Math.sin((this.loopTime/this.loopTimeFull)*Math.PI) * 16;
	
	if(this.loopTime >= this.loopTimeFull){
		this.loopTime = 0;
		var bullet = new Bullet(this.position.x, this.position.y + 16, 0);
		bullet.damage = Spawn.damage(2,this.difficulty);
		bullet.blockable = false;
		bullet.gravity = 1.0;
		bullet.frame = 2;
		bullet.frame_row = 0;
		game.addObject( bullet );
	}
}

 /* platformer\enemy_ghoul.js*/ 

Ghoul.prototype = new GameObject();
Ghoul.prototype.constructor = GameObject;
function Ghoul(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 30;
	this.sprite = "ghoul";
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 0,
		"backwards" : 0,
		"upwards" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.mass = 0.2;
	this.collideDamage = Spawn.damage(2,this.difficulty);
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
function HammerMathers(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 24;
	this.sprite = "hammermather";
	this.speed = 10;
	this.jump = 8;
	this.attackTime = Game.DELTASECOND * 2.5;
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.lifeMax = Spawn.life(2,this.difficulty);
	this.damage = Spawn.life(2,this.difficulty);
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
				this.states.cooldown = this.attackTime;
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
function Igbo(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 46;
	this.sprite = "igbo";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(2,this.difficulty);
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
	//this.sprite = "knight";
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
function Knight(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = "knight";
	this.speed = 0.4;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"attack" : 0,
		"cooldown" : Game.DELTASECOND * 3.0,
		"combo" : 0,
		"attack_down" : false,
		"guard" : 2, //0 none, 1 bottom, 2 top
		"guard_freeze" : 0.0,
		"retreat" : 0
	}
	
	this.attack_warm = 24.0;
	this.attack_release = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 8;
	
	this.guard.x = 8;
	this.guard.y = 8;
	this.guard.w = 16;
	this.guard.h = 16;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(12,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	this.xp_award = 18;
	this.money_award = 8;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("blockOther", function(obj, position, damage){
		//audio.playLock("clang",0.5);
		//this.states.guard_freeze = Game.DELTASECOND;
		//this.states.combo = 0;
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.retreat = Game.DELTASECOND * 0.5;
		this.states.guard_freeze = 0.0;
	});
	this.on("death", function(){
		Item.drop(this,this.money_award);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.calculateXP();
}
Knight.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		var home_x = this.position.x - this.start_x;
		
		if(this.states.attack > 0 || this.states.combo > 0){
			if(this.states.attack <= 0){
				
				if(this.states.combo > 0){
					this.states.attack = this.attack_warm;
					this.force.x = this.thrust_power * (this.flip?-1:1);
					this.states.attack_down = Math.random() > 0.5;
					this.states.combo--;
				}
			}
			
			if(this.states.attack <= this.attack_release && this.states.attack > this.attack_rest){
				if(this.states.attack_down){
					this.strike(new Line(0,16,32,20));
				} else {
					this.strike(new Line(0,0,32,4));
				}
				this.frame.x = 2;
			} else if(this.states.attack > this.attack_release){
				var p = (this.states.attack - this.attack_release) / (this.attack_warm - this.attack_release)
				this.frame.x = p > 0.5 ? 0 : 1;
			} else {
				this.frame.x = 3;
			}
			
			this.states.attack -= this.delta;
			this.frame.y = 1;
			this.guard.active = false;
		} else if(this.stun > 0 || this.states.guard_freeze > 0){
			//hurt, do nothing
			this.guard.active = false;
			this.frame.x = 0;
			this.frame.y = 2;
			this.states.guard_freeze -= this.delta;
		} else {
			this.flip = dir.x > 0;
			if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
				this.states.combo = 3;
				this.states.cooldown = Game.DELTASECOND * 2;
			}
			this.states.cooldown -= this.delta;
			
			this.guard.active = true;
			if(this.states.guard == 1){
				//bottom
				this.guard.x = 8;
				this.guard.y = 12;
			} 
			if(this.states.guard == 2){
				this.guard.x = 8;
				this.guard.y = -8;
			}
			
			if(this.states.retreat > 0){
				//run away from player
				this.force.x += this.speed * this.delta * (this.flip?2:-2);
				this.states.retreat -= this.delta;
			} else if(Math.abs(home_x) > 128){
				//Too far, go home
				this.force.x += this.speed * this.delta * (home_x>0?-1:1);
			} else if(Math.abs(_player.position.x - this.start_x) < 128){
				//Player close, proach him
				this.force.x += this.speed * this.delta * (this.flip?-1:1);
			} else if(Math.abs(home_x) > 8){
				//Player is coy, go home
				this.force.x += this.speed * this.delta * (home_x>0?-1:1);
			}
			
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 4;
			this.frame.y = 0;
		}
	}
}
Knight.prototype.render = function(g,c){
	var filter = {"shader":this.filter};
	//Shield no guard
	if(!this.guard.active){
		//render shield
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(3, 2), this.flip, filter);
	}
	//Render body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Shield guard
	if(this.guard.active){
		//render shield
		var shield_f = this.guard.y > 0 ? 1 : 2;
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(shield_f, 2), this.flip, filter);
	}
	
	//Render sword
	var sword_f = 4;
	var sword_fr = 0;
	if(this.states.attack > 0){
		sword_f = this.frame.x;
		sword_fr = this.states.attack_down ? 4 : 3;
	}
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(sword_f, sword_fr), this.flip, filter);
}

 /* platformer\enemy_laughing.js*/ 

Laughing.prototype = new GameObject();
Laughing.prototype.constructor = GameObject;
function Laughing(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.team = 0;
	this.sprite = "laughing";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	
	this.speed = 0.225;
	this.frame = 0;
	this.frame_row = 0;
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

 /* platformer\enemy_librarian.js*/ 

Librarian.prototype = new GameObject();
Librarian.prototype.constructor = GameObject;
function Librarian(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.basePosition = new Point(x,y);
	this.width = 24;
	this.height = 56;
	this.zIndex = 1;
	
	this.sprite = "librarian";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 0.4;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.death_time = Game.DELTASECOND * 1;
	this.friction = 0.2;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"attackpause" : 0,
		"attackpausecooldown" : 0,
		"attackcooldown" : 0,
		"jumpcooldown" : 50,
		"direction" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
Librarian.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {		
		if(this.states.direction){
			this.force.x -= this.speed * this.delta;
			if(this.position.x - this.basePosition.x < -64){
				this.states.direction = 0;
			}
		} else {
			this.force.x += this.speed * this.delta;
			if(this.position.x - this.basePosition.x > 64){
				this.states.direction = 1;
			}
		}
		
		if(this.states.attackpause <= 0){
			this.states.attackcooldown -= this.delta;
		}
		
		if(this.states.attackpausecooldown <= 0){
			this.states.attackpause = Game.DELTASECOND;
			this.states.attackpausecooldown = Game.DELTASECOND * 2 + (Math.random() * 2 * Game.DELTASECOND);
		}
		if(this.states.jumpcooldown <= 0){
			this.force.y = -11;
			this.grounded = false;
			this.states.jumpcooldown = Game.DELTASECOND * 2 + (Math.random() * 2 * Game.DELTASECOND);
		}
		if(this.states.attackcooldown <= 0){
			//throw book
			this.states.attackcooldown = Game.DELTASECOND * 0.333;
			this.flip = dir.x > 0;
			var book = new LibrarianBook(this.position.x, this.position.y);
			book.force.y = -12;
			book.force.x = (this.flip ? -1 : 1) * 5;
			book.damage = this.damage;
			game.addObject(book);
		}
		
		this.states.attackpausecooldown -= this.delta;
		this.states.attackpause -= this.delta;
		this.states.jumpcooldown -= this.delta;
		
	}
}

 

LibrarianBook.prototype = new GameObject();
LibrarianBook.prototype.constructor = GameObject;
function LibrarianBook(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.gravity = 0.8;
	this.sprite = "librarian";
	
	this.damage = 1;
	this.force = new Point(0,0);
	this.frame.y = 1;
	
	this.on("sleep", function(obj){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
			this.destroy();
		}
	});
}

LibrarianBook.prototype.update = function(){
	this.force.y += this.gravity * this.delta;
	//this.force.x = this.force.x * (1 - 0.08 * this.delta);
	this.position.x += this.force.x * this.delta;
	this.position.y += this.force.y * this.delta;
}

 /* platformer\enemy_lilghost.js*/ 

LilGhost.prototype = new GameObject();
LilGhost.prototype.constructor = GameObject;
function LilGhost(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.damage = Spawn.damage(2,this.difficulty);
	this.team = 0;
	this.sprite = "lilghost";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.start = new Point(x,y);
	this.speed = 0.25;
	this.frame = 0;
	this.frame_row = 0;
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
function Malphas(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "malphas";
	this.speed = 0.3;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	
	this.states = {
		"active" : false,
		"direction" : -1,
		"combo_timer" : Game.DELTASECOND * 2,
		"cooldown" : 0,
		"combo" : 0,
		"attack" : 0
	}
	this.attack_time = Game.DELTASECOND * 0.6;
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
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
function Malsum(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "bear";
	this.speed = 0.3;
	
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	
	this.states = {
		"direction" : -1,
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(1,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
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
function Oriax(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "oriax";
	this.paletteSwaps = ["t0","t0","t2","t3","t4"];
	
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
		this.spawnSnakes(2);
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
	this.on("stun", function(obj,damage,count){
		if(count == 3){
			//spawn two snakes to scare player
			this.spawnSnakes(2);
		}
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(12,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 3.0;
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : new Timer(0),
		"attack_lower" : false
	};
	this.attack = {
		"warm" : 30,
		"release" : 10
	};
}
Oriax.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attack.time > 0){
			if( this.states.attack.at(this.attack.release)){
				//Fire
				if(this.states.attack_lower){
					var snakebullet = new SnakeBullet(this.position.x, this.position.y + 16);
					snakebullet.damage = this.damage;
					snakebullet.flip = this.flip;
					game.addObject(snakebullet);
				} else {
					var bullet = new Bullet(this.position.x, this.position.y+4,(this.flip?-1:1));
					bullet.frames = [5,6,7];
					bullet.frame.y = 1;
					bullet.blockable = 1;
					bullet.damage = this.damage;
					game.addObject(bullet);
				}
				this.states.cooldown = Game.DELTASECOND * 1.5;
			}
			this.states.attack.tick(this.delta);
		} else if(this.stun > 0) {
			//Hurt, do nothing
		} else {
			//idle
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				this.states.attack.set(this.attack.warm);
				this.states.attack_lower = Math.random() > 0.5;
			}
		}
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		//dead
		this.frame.x = 4;
		this.frame.y = 1;
	} else if( this.states.attack.time > 0 ) {
		//Attack
		var progress = 1 - (this.states.attack.time / this.states.attack.start);
		if(this.states.attack_lower){
			this.frame.x = Math.floor(progress * 4);
			this.frame.y = 2;
		} else {
			this.frame.x = 0;
			if(progress > 0.15){ this.frame.x = 1;}
			if(progress > 0.55){ this.frame.x = 2;}
			if(progress > 0.6){ this.frame.x = 3;}
			this.frame.y = 1;
		}
	} else if (this.stun > 0){
		//dead
		this.frame.x = 4;
		this.frame.y = 1;
	} else {
		//idle
		this.frame.x = (this.frame.x + this.delta * 0.2 ) % 5;
		this.frame.y = 0;
	}
}

Oriax.prototype.spawnSnakes = function(amount){
	for(var i=0; i < amount; i++){
		var snakebullet = new SnakeBullet(this.position.x, this.position.y - 16);
		snakebullet.damage = this.damage;
		snakebullet.flip = i;
		snakebullet.force.x = snakebullet.flip ? 5.0 : -5.0;
		snakebullet.force.y = -6;
		game.addObject(snakebullet);
	}
}

 /* platformer\enemy_ratgut.js*/ 

Ratgut.prototype = new GameObject();
Ratgut.prototype.constructor = GameObject;
function Ratgut(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "ratgut";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.2;
	this.collideDamage = Spawn.damage(4,this.difficulty);
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
			if(!this.grounded){
				this.strike( new Line(0,-16,16,16) );
			}
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
	
	if( this.stun > 0 ){
		this.frame_row = 2;
		this.frame = 1;
	} else if( this.states.attack > 0 ){
		this.frame_row = 2;
		this.frame = this.grounded ? 1 : 0;
	} else {
		if( Math.abs( this.force.x ) < 0.3 ){
			this.frame = (this.frame + this.delta * 0.2) % 4;
			this.frame_row = 0;
		} else {
			this.frame = (this.frame + (this.delta * 0.2 * Math.abs(this.force.x))) % 4;
			this.frame_row = 1;
		}
	}
}

 /* platformer\enemy_sentry.js*/ 

Sentry.prototype = new GameObject();
Sentry.prototype.constructor = GameObject;
function Sentry(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	
	this.speed = 0.0;
	this.sprite = "chaz";
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
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
	
	this.calculateXP();
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
function Shell(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	
	this.speed = 0.5;
	this.sprite = "shell";
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.2;
	this.stun_time = Game.DELTASECOND * 0.75;
	this.invincible_time = 30.0;
	
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
function Shooter(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	this.team = 0;
	this.start_x = x;
	this.sprite = "shooter";
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.speed = 1.125;
	this.frame = 0;
	this.frame_row = 0;
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
function Skeleton(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.sprite = "skele";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(5,this.difficulty);
	this.mass = 0.8;
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
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
	this.sprite = "skele";
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
		this.frame.x = 0;
		this.frame.y = 2;
	} else { 
		if( this.states.attack > 0 ) {
			this.frame.x = 0;
			if( this.states.attack <= this.attacktimes.release ) this.frame.x = 1;
			if( this.states.attack <= this.attacktimes.rest ) this.frame.x = 2;
			this.frame.y = 1
		} else if( !this.grounded ) {
			this.frame.x = 3;
			this.frame.y = 1;
		} else {
			this.frame.y = 0;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame.x = (this.frame.x + this.delta * Math.abs( this.force.x ) * 0.1 ) % 4;
			}
		}
	}
}
Skeleton.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(4,0),this.flip);
}

 /* platformer\enemy_slime.js*/ 

Slime.prototype = new GameObject();
Slime.prototype.constructor = GameObject;
function Slime(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.paletteSwaps = ["t0","t0","t2","t3","t4"];
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = "slime";
	this.speed = 0.3;
	this.visible = false;
	this.interactive = false;
	this.pushable = false;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.times = {
		"cooldown" : Game.DELTASECOND * 0.25 + Game.DELTASECOND * Math.random(),
		"cooldownTime" : Game.DELTASECOND * 2.0,
		"transition" : 0.0,
		"melt" : 0,
		"move" : 0
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		this.times.cooldown = 0.0;
		audio.play("hurt");
	});
	this.on("hurtOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("blockOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	//Set opening state
	if(Math.random() > 0.5){
		this.visible = true;
		this.interactive = true;
		this.pushable = true;
		this.times.move = 1;
	}
	
	this.flip = Math.random() > 0.5;
	this.life = Spawn.life(0, this.difficulty);
	this.damage = Spawn.damage(1,this.difficulty);
	this.calculateXP();
}
Slime.prototype.update = function(){
	if(!this.grounded){
		this.frame.x = 0;
		this.frame.y = 2;
	} else if(this.times.move){
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 5;
		this.frame.y = 0;
		if(this.flip){
			this.force.x -= this.speed * this.delta;
		} else{
			this.force.x += this.speed * this.delta;
		}
		
		if(this.interactive){
			this.strike(new Line(new Point(0,0), new Point(12,4)));
		}
		
		
		var forwardTile = game.getTile(this.position.add(new Point(this.flip?-16:16,0)));
		var underTile = game.getTile(this.position.add(new Point(0,16)));
		if(forwardTile > 0){
			this.flip = !this.flip;
		}
		this.times.cooldown -= this.delta;
		if(this.times.cooldown <= 0){
			//Stop moving and reappear
			this.times.move = 0;
			this.force.x = 0;
			this.times.transition = 0.0;
			//If it's interactive, it means it's currently alive
			this.times.melt = this.interactive;
			this.interactive = false;
		}
	} else {
		if(this.times.melt){
			//
			this.times.transition += this.delta * 0.1;
			this.frame.x = Math.floor(this.times.transition * 5);
			this.frame.y = 1;
			if(this.times.transition >= 1){
				this.visible = false;
				this.times.move = 1;
				this.times.cooldown = this.times.cooldownTime * 0.5;
				this.flip = Math.random() > 0.5;
			}
		} else {
			//reform
			this.visible = true;
			this.times.transition += this.delta * 0.1;
			this.frame.x = 5 - Math.floor(this.times.transition * 5);
			this.frame.y = 1;
			if(this.times.transition >= 1){
				this.interactive = true;
				this.times.move = 1;
				this.times.cooldown = this.times.cooldownTime;
			}
		}
	}
}
Slime.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.flip = dir.x < 0;
}

 /* platformer\enemy_slimegrenadier.js*/ 

SlimeGrenadier.prototype = new GameObject();
SlimeGrenadier.prototype.constructor = GameObject;
function SlimeGrenadier(x,y,d,o){
	this.constructor();
	
	var bottom = y + d[1] * 0.5;
	
	this.position.x = x;
	this.position.y = bottom - 40;
	this.startPosition = new Point(this.position.x,this.position.y);
	this.width = 24;
	this.height = 48;
	
	this.speed = 1.5;
	this.sprite = "slimegrenadier";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	if("speed" in o){
		this.speed = o["speed"] * 1;
	}
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.stun_time = Game.DELTASECOND;
	this.life = Spawn.life(6, this.difficulty);
	this.damage = Spawn.damage(3, this.difficulty);
	this.mass = 3.0;
	
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		audio.play("hurt");
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.times = {
		"cooldown" : 0.0,
		"cooldownTime" : Game.DELTASECOND * 3,
		"attack" : new Timer(0),
		"attackRelease" : Game.DELTASECOND * 0.2,
		"attackWarm" : Game.DELTASECOND * 0.5
	};
}
SlimeGrenadier.prototype.update = function(){
	if(this.life > 0){
		var dir = _player.position.subtract(this.position);
		
		if(this.times.attack.time > 0){
			//Throw attack
			var progress = 1.0 - (this.times.attack.time / this.times.attack.start);
			this.frame.x = Math.floor(progress * 5);
			this.frame.y = 1;
			
			if(this.times.attack.at(this.times.attackRelease)){
				//Throw bomb
				var nade = new Gernade(this.position.x, this.position.y);
				nade.damage = this.damage;
				nade.force.x = Math.min(Math.abs(dir.x)*0.04,30);
				nade.force.y = -5;
				nade.team = this.team;
				if(this.flip){
					nade.force.x *= -1.0;
				}
				game.addObject(nade);
			}
			this.times.attack.tick(this.delta);
		} else if(this.stun > 0) {
			//stun
			this.frame.x = 4;
			this.frame.y = 0;
		} else {
			//idle
			
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			this.flip = dir.x < 0;
			
			if(this.times.cooldown <= 0 ){
				this.times.cooldown = this.times.cooldownTime;
				this.times.attack.set(this.times.attackWarm);
			}
			this.times.cooldown -= this.delta;
		}
	} 
}

Gernade.prototype = new GameObject();
Gernade.prototype.constructor = GameObject;
function Gernade(x,y,d,o){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "bullets";
	
	this.frame.x = 5;
	this.frame.y = 0;
	
	this.addModule( mod_rigidbody );
	
	this.damage = 10;
	this.friction = 0.03;
	this.gravity = 0.5;
	this.bounce = 0.9;
	this.collisionReduction = -0.9;
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && this.team != obj.team){
			obj.hurt(this,this.damage);
			this.destroy();
		}
	});
	this.on("sleep",function(){
		this.destroy();
	});
	
	this.times = {
		"fuse" : Game.DELTASECOND * 2
	};
}
Gernade.prototype.update = function(x,y,d,o){
	if(this.times.fuse <= 0){
		this.destroy();
	}
	this.times.fuse -= this.delta;
}


 /* platformer\enemy_slimerilla.js*/ 

Slimerilla.prototype = new GameObject();
Slimerilla.prototype.constructor = GameObject;
function Slimerilla(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.collideDamage = 0;
	this.team = 0;
	
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = "slimerilla";
	this.speed = 0.3;
	this.visible = false;
	this.pushable = false;
	this.startactive = true;
	this.gravity = 0.5;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("startactive" in o){
		this.startactive = o["startactive"] * 1;
	}
	
	this.times = {
		"attackWarm" : Game.DELTASECOND * 2,
		"attackRelease" : Game.DELTASECOND,
		"attackRest" : Game.DELTASECOND * 0.7777,
		"attack" : 0.0,
		"cooldown" : Game.DELTASECOND,
		"timeBetweenAttacks" : Game.DELTASECOND * 1.5,
		"reappear" : 0,
		"reappearTime" : 0.0,
		"turnTimer" : 0.0,
		"jumpback" : false
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		audio.play("hurt");
		this.times.jumpback = true;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && !this.visible){
			this.times.reappearTime = Game.DELTASECOND * 1;
			this.times.reappear = 1;
		}
	});
	
	if(this.startactive){
		this.visible = true;
		this.pushable = true;
		this.faceTarget();
	}
	
	this.life = Spawn.life(8, this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.calculateXP();
}
Slimerilla.prototype.update = function(){
	if(this.visible){
		var dir = _player.position.subtract(this);
		if(this.times.attack > 0){
			//once warming up for an attack, there's no stoping him!
			if(this.times.attack < this.times.attackRest ){
				this.frame.x = 0
				this.frame.y = 0;
			} else if(this.times.attack < this.times.attackRelease ){
				this.strike(new Line(new Point(0,-24),new Point(48,24)));
				this.frame.x = 1
				this.frame.y = 1;
			} else {
				this.force.x = 0;
				this.frame.x = 0
				this.frame.y = 1;
			}
			this.times.attack -= this.delta;
		} else if(this.stun > 0){
			//Do nothing
			this.frame.x = 0;
			this.frame.y = 0;
		} else if(this.times.jumpback){
			//jump away from player
			this.force.y = -6;
			this.force.x = (dir.x>0?-1.0:1.0) * 10;
			this.times.jumpback = false;
		} else {
			//move towards player
			if(this.flip){
				this.force.x -= this.speed * this.delta;
			} else {
				this.force.x += this.speed * this.delta;
			}
			if(Math.abs(dir.x) < 48 && this.times.cooldown <= 0 ){
				this.times.attack = this.times.attackWarm;
				this.times.cooldown = this.times.timeBetweenAttacks;
				this.faceTarget();
			}
			if(this.times.turnTimer <= 0){
				this.faceTarget();
				this.times.turnTimer = Game.DELTASECOND * 2;
			}
			this.times.turnTimer -= this.delta;
			this.times.cooldown -= this.delta;
		}
		
	} else {
		if(this.times.reappear){
			this.times.reappearTime -= this.delta;
			if(this.times.reappearTime <= 0){
				this.visible = true;
				this.pushable = true;
				this.faceTarget();
			}
		}
	}
}
Slimerilla.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.flip = dir.x < 0;
}

 /* platformer\enemy_slugplatform.js*/ 

SlugPlatform.prototype = new GameObject();
SlugPlatform.prototype.constructor = GameObject;
function SlugPlatform(x,y,d,o){
	this.constructor();
	
	var bottom = y + d[1] * 0.5;
	
	this.position.x = x;
	this.position.y = bottom - 40;
	this.startPosition = new Point(this.position.x,this.position.y);
	this.width = 48;
	this.height = 16;
	this.origin = new Point(0.5,0.0);
	this.active = true;
	this.loop = true;
	this.leftStart = false;
	
	this.speed = 1.5;
	this.sprite = "slugplatform";
	this.waitforplayer = 0;
	
	this.addModule( mod_block );

	o = o || {};
	if("speed" in o){
		this.speed = o["speed"] * 1;
	}
	if("waitforplayer" in o){
		this.waitforplayer = o["waitforplayer"] * 1;
	}
	if("loop" in o){
		this.loop = o["loop"] * 1;
	}
	if("deathreset" in o){
			this.on("player_death", function(){
			this.position.x = this.startPosition.x;
			this.position.y = this.startPosition.y;
			if(this.waitforplayer){
				this.active = false;
			}
		});
	}
	
	if(this.waitforplayer){
		this.active = false;
		this.on("blockLand",function(obj){
			if(obj instanceof Player){
				this.active = true;
			}
		});
	}
}
SlugPlatform.prototype.update = function(){
	
	if(this.active){
		this.frame = this.frame_row = 0;
		
		var forwardTile = 0;
		if(this.flip){
			var checkPos = this.position.add(new Point(-32, 32));
			forwardTile = game.getTile(checkPos);
			this.position.x -= this.speed * this.delta;
		} else {
			var checkPos = this.position.add(new Point(32, 32));
			forwardTile = game.getTile(checkPos);
			this.position.x += this.speed * this.delta;
		}
		
		if(forwardTile > 0){
			//Turn
			this.flip = !this.flip;
		}
		
		if(!this.loop){
			if(!this.leftStart){
				if(Math.abs(this.position.x-this.startPosition.x) > 16){
					this.leftStart = true;
				}
			} else {
				if(Math.abs(this.position.x-this.startPosition.x) < 8){
					this.position.x = this.startPosition.x;
					this.active = false;
					this.flip = !this.flip;
					this.leftStart = false;
				}
			}
		}
	}
	game.collideObject(this);
}

SlugPlatform.prototype.idle = function(){}

 /* platformer\enemy_snakebullet.js*/ 

SnakeBullet.prototype = new GameObject();
SnakeBullet.prototype.constructor = GameObject;
function SnakeBullet(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 12;
	
	this.speed = 0.3;
	this.sprite = "snake";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("sleep",function(){
		this.destroy();
	})
	this.on("hurt_other",function(obj, damage){
		this.trigger("death");
	});
	this.on("death", function(obj,pos,damage){
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.pushable = false;
	this.mass = 0.3;
	this.gravity = 0.5;
	this.timeCounter = Game.DELTASECOND * 3;
}
SnakeBullet.prototype.update = function(){	
	this.timeCounter -= this.delta;
	
	if(this.grounded){
		this.force.x += this.speed * (this.flip ? -1 : 1) * this.delta;
		this.strike(new Line(new Point(0,-3),new Point(12,3)));
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 0;
	} else {
		this.frame = (this.frame + this.delta * 0.3) % 4;
		this.frame_row = 1;
	}
	
	if(this.timeCounter <= 0){
		this.destroy();
	}
}

 /* platformer\enemy_svarog.js*/ 

Svarog.prototype = new GameObject();
Svarog.prototype.constructor = GameObject;
function Svarog(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 40;
	
	this.speed = 2.5;
	this.sprite = "svarog";
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.0;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	
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

 /* platformer\enemy_wizzard.js*/ 

WizzardBolter.prototype = new GameObject();
WizzardBolter.prototype.constructor = GameObject;
function WizzardBolter(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t0","t0","t0","t0","t0"];
	this.speed = 2;
	this.offsetX = 0.0;
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( obj instanceof WizzardBolter ) {
			var dif = this.position.x - obj.position.x;
			if(dif > 0){
				this.offsetX = Game.DELTASECOND * 0.5;
			} else {
				this.offsetX = -Game.DELTASECOND * 0.5;
			}
		}
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : Game.DELTASECOND,
		"align" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 1.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
WizzardBolter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attach > 0){
			this.states.attach -= this.delta;
		} else {
			//Align with player
			var ypos = _player.position.y + this.states.align;
			var speed = this.speed * this.delta;
			
			if(Math.abs(this.position.y - ypos) <= speed){
				this.position.y = ypos;
			} else if(this.position.y > ypos){
				this.position.y -= speed;
			} else {
				this.position.y += speed;
			}
			
			if(this.offsetX != 0){
				if(this.offsetX > 0){
					this.position.x += speed;
					this.offsetX -= this.delta;
					if(this.offsetX <= 0) {
						this.offsetX = 0;
					}
				} else {
					this.position.x -= speed;
					this.offsetX += this.delta;
					if(this.offsetX >= 0) {
						this.offsetX = 0;
					}
				}
			} else {
				if(Math.abs(dir.x) > 160){
					if(this.flip){
						this.position.x -= speed;
					} else {
						this.position.x += speed;
					}
				}
				
				if(Math.abs(dir.x) < 96){
					if(this.flip){
						this.position.x += speed;
					} else {
						this.position.x -= speed;
					}
				}
			}
			
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				//Attack
				this.states.attack = this.times.attackCool;
				this.states.cooldown = this.times.cooldown;
				this.states.align = Math.random() > 0.5 ? this.times.alignTop : this.times.alignBot;
				
				var bullet = new PhantomBullet(this.position.x, this.position.y);
				bullet.damage = this.damage;
				bullet.force.x = this.flip ? -4 : 4;
				game.addObject(bullet);
			}
		}
		this.frame = new Point();
	}
}


WizzardFlamer.prototype = new GameObject();
WizzardFlamer.prototype.constructor = GameObject;
function WizzardFlamer(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t3","t3","t3","t3","t3"];
	this.speed = 2;
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : 50,
		"attack" : Game.DELTASECOND,
		"align" : 0
	};
	this.times = {
		"alignTop" : 10,
		"alignBot" : -10,
		"cooldown" : Game.DELTASECOND * 3.5,
		"attackCool" : Game.DELTASECOND * 1.0,
	}
}
WizzardFlamer.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.attach > 0){
			this.states.attach -= this.delta;
		} else {
			//Align with player
			var ypos = _player.position.y + this.states.align;
			var speed = this.speed * this.delta;
			
			if(Math.abs(this.position.y - ypos) <= speed){
				this.position.y = ypos;
			} else if(this.position.y > ypos){
				this.position.y -= speed;
			} else {
				this.position.y += speed;
			}
			
			if(Math.abs(dir.x) > 160){
				if(this.flip){
					this.position.x -= speed;
				} else {
					this.position.x += speed;
				}
			}
			
			if(Math.abs(dir.x) < 96){
				if(this.flip){
					this.position.x += speed;
				} else {
					this.position.x -= speed;
				}
			}
			
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			if(this.states.cooldown <= 0){
				//Attack
				this.states.attack = this.times.attackCool;
				this.states.cooldown = this.times.cooldown;
				this.states.align = Math.random() > 0.5 ? this.times.alignTop : this.times.alignBot;
				
				var xoff = 32;
				for(var i=0; i < 3; i++){
					var xpos = (this.flip?-1:1) * xoff;
					var ftower = new FlameTower(xpos+this.position.x, this.position.y);
					ftower.damage = this.damage;
					ftower.time = Game.DELTASECOND * i * -0.6;
					game.addObject(ftower);
					xoff += Math.random()>0.5 ?  40 : 80;
				}
			}
		}
		this.frame = new Point();
	}
}

WizzardSoldier.prototype = new GameObject();
WizzardSoldier.prototype.constructor = GameObject;
function WizzardSoldier(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t2","t2","t2","t2","t2"];
	this.speed = 2;
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 6.0,
		"attack" : Game.DELTASECOND * 3.0
	};
}
WizzardSoldier.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			//Attack			
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				for(var i=0; i < WizzardSoldier.enemyPlacement.length; i++){
					var xpos = (this.flip?-1:1) * WizzardSoldier.enemyPlacement[i];
					var enemy = new Flederknife(xpos+this.position.x, this.position.y, null, {"difficulty":this.difficulty});
					game.addObject(enemy);
				}
				this.destroy();
			}
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 80){
				this.position.x += (this.flip?1:-1) * this.speed * this.delta;
			}
			if(Math.abs(dir.x) > 96){
				this.position.x += (this.flip?-1:1) * this.speed * this.delta;
			}
			if(dir.y > -40){
				this.position.y -= this.speed * this.delta;
			}
			if(dir.y < -64){
				this.position.y += this.speed * this.delta;
			}
		}
	this.frame = new Point();
	}
}
WizzardSoldier.enemyPlacement = [-200,-128,80,128,200];

WizzardLightning.prototype = new GameObject();
WizzardLightning.prototype.constructor = GameObject;
function WizzardLightning(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 48;
	
	this.sprite = "owlwizzard";
	this.paletteSwaps = ["t1","t1","t1","t1","t1"];
	this.speed = 1;
	this.direction = 0;
	
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 2.0,
		"attack" : Game.DELTASECOND * 1.0
	};
}
WizzardLightning.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			//Attack			
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				var lightning1 = new LightningBolt(this.position.x,this.position.y);
				var lightning2 = new LightningBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damage = lightning2.damage = this.damage;
				game.addObject(lightning1);
				game.addObject(lightning2);
				
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.attack = Game.DELTASECOND * 1;
			}
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			this.direction += this.delta * 0.1;
			this.position.x += Math.sin(this.direction) * this.speed * this.delta;
			this.position.y += Math.cos(this.direction) * this.speed * this.delta;
		}
	this.frame = new Point();
	}
}


//Wizzard attacks


FlameTower.prototype = new GameObject();
FlameTower.prototype.constructor = GameObject;
function FlameTower(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 32;
	this.damage = 1;
	this.time = 0;
	
	this.timers = {
		"wait" : Game.DELTASECOND,
		"active" : Game.DELTASECOND * 2.5,
		"destroy" : Game.DELTASECOND * 2.9
	};
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.time > this.timers.active) {
			obj.hurt(this,this.damage);
		}
	});
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
}

FlameTower.prototype.update = function(){
	this.time += this.delta;
	if(this.time < this.timers.wait){
		
	}else if(this.time < this.timers.active){
		var prog = Math.min((this.time-this.timers.wait)/(this.timers.active-this.timers.wait) ,1);
		Background.pushLight( this.position, 64*Math.sin(Math.PI*prog), [1,0.7,0,1] );
	} else {
		var prog = Math.min((this.time-this.timers.active)/(this.timers.destroy-this.timers.active) ,1);
		var preh = this.height;
		this.height = 88 * Math.min(prog*1.5,1);
		this.rigidbodyActive = false;
		this.position.y -= 0.5 * (this.height-preh);
		Background.pushLight( this.position, this.height*2, [1,0.7,0,1] );
	}
	if(this.time > this.timers.destroy){
		this.destroy();
	}
}
	
FlameTower.prototype.render = function(g,c){
	if(this.time > this.timers.wait){
		g.color = [1.0,0.7,0.0,1.0];
		if(this.time < this.timers.active){
			var prog = Math.min((this.time-this.timers.wait)/(this.timers.active-this.timers.wait) ,1);
			var w = 1.5 * this.width * prog;
			var h = 16 * (1 - prog);
			
			g.scaleFillRect(
				(this.position.x - w*0.5) - c.x,
				(this.position.y - h*0.5) - c.y,
				w, h
			);
		} else {
			//active
			g.scaleFillRect(
				(this.position.x - this.width*0.5) - c.x,
				(this.position.y - this.height*0.5) - c.y,
				this.width, this.height
			);
		}
	} 
}


LightningBolt.prototype = new GameObject();
LightningBolt.prototype.constructor = GameObject;
function LightningBolt(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 8;
	this.damage = 1;
	this.time = 0;
	this.speed = 0;
	this.team = 0;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player && !this.grounded) {
			obj.hurt(this,this.damage);
		}
	});
	this.on(["struckTarget","collideHorizontal"], function(dir){
		this.destroy();
	});
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
}

LightningBolt.prototype.update = function(){
	this.time += this.delta;
	
	if(this.grounded){
		this.force.x += this.speed * this.delta;
		this.flip = this.force.x < 0; 
		Combat.strike.apply(this,[new Line(0,0,8,4)]);
	} else {
		//fall
	}
	
	Background.pushLight(this.position,48,[0.5,0.7,1.0,1.0]);
	
	if(this.time > Game.DELTASECOND * 3){
		this.destroy();
	}
}
	
LightningBolt.prototype.render = function(g,c){
	g.color = [0.5,0.7,1.0,1.0];
	g.scaleFillRect(
		(this.position.x - this.width*0.5) - c.x,
		(this.position.y - this.height*0.5) - c.y,
		this.width, this.height
	);
}

 /* platformer\enemy_yakseyo.js*/ 

Yakseyo.prototype = new GameObject();
Yakseyo.prototype.constructor = GameObject;
function Yakseyo(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 14;
	this.sprite = "yakseyo";
	this.speed = 0.3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"phase" : 0,
		"attack" : -1,
		"cooldown" : 0,
		"smoke_timer" : 0
	};
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(10,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
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
	
	Background.pushLight(this.position, 100, [1.0,0.8,0.5]);
}

 /* platformer\enemy_yeti.js*/ 

Yeti.prototype = new GameObject();
Yeti.prototype.constructor = GameObject;
function Yeti(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 40;
	this.sprite = "yeti";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.mass = 2.2;
	this.collideDamage = Spawn.damage(2,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
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

 /* platformer\equipment.js*/ 

function Weapon(name){
	this.combo = 0;
	this.time = 0.0;
	this.timeRest = 0.0;
	this.timeMiss = 0.0;
	this.queue = 0;
	this.stats = WeaponStats[name];
	this.combohit = 0;
	this.playerState = "standing";
	this.currentAttack = null;
	this.chargeTime = new Timer();
	this.charge = false;
}
Weapon.prototype.update = function(player){
	if(this.time > 0){
		var newState = Weapon.playerState(player);
		var phase = this.currentAttack[this.combo];
		
		//Build up charge
		if(input.state("fire") > 0){
			this.chargeTime.tick(player.delta);
			this.time = Math.max(this.time, player.delta+1);
			
			if(this.chargeTime.at(Game.DELTASECOND)){
				this.charge = true;
			}
		} else{
			if(this.chargeTime.time > Game.DELTASECOND){
				this.time = this.combo = this.queue = 0;
				this.attack(player);
			}
			this.chargeTime.set(0.0);
		}
		
		if(phase){
			if(input.state("left") > 0){
				player.force.x -= phase.movement * player.deltaSpeed();
			}
			if(input.state("right") > 0){
				player.force.x += phase.movement * player.deltaSpeed();
			}
		}
		
		if(this.playerState != newState){
			//cancel attack
			this.playerState = newState;
			this.queue = -9999;
		} else {	
			this.time -= player.delta;
			//player.force.x *= 
			//if(this.time <= 0){
			if(this.time+this.timeRest <= this.timeMiss && this.queue > this.combo){
				//Chain into next attack
				this.charge = false;
				this.attack(player, true);
			}else if(this.time <= 0){
				this.cancel();
			}
		}
	}
}

Weapon.prototype.attack = function(player, forceNextAttack){
	this.playerState = Weapon.playerState(player);
	this.currentAttack = this.stats[this.playerState];
	var phase = this.currentAttack[this.combo];
	
	if(this.time > 0 && !forceNextAttack){
		//Attempt to queue the next attack
		if(this.combo+1 in this.currentAttack && (this.combohit || this.currentAttack["alwaysqueue"])){
			this.queue = this.combo + 1;
		}
	} else {
		//Start a next attack
		this.combo = this.queue;
		if(this.combo in this.currentAttack){
			var newPhase = this.currentAttack[this.combo];
			this.timeRest = newPhase["rest"];
			this.timeMiss = newPhase["miss"];
			this.time = newPhase["time"] + newPhase["miss"];
			this.combohit = 0;
			
			audio.play("swing");
			
			if("force" in newPhase){
				player.force.y = newPhase["force"].y;
				if(player.flip){
					player.force.x = -newPhase["force"].x;
				} else {
					player.force.x = newPhase["force"].x;
				}
			}
		} else {
			this.cancel();
		}
	}
}
Weapon.prototype.cancel = function(){
	this.time = 0;
	this.combo = 0;
	this.queue = 0;
	this.combohit = 0;
	this.chargeTime.set(0.0);
	this.charge = false;
}

Weapon.prototype.hit = function(player,obj,damage){
	if(this.playerState == "downstab"){
		obj.trigger("downstabbed", player, damage);
		player.trigger("downstabTarget", obj, damage);
		this.cancel();
		return;
	}
	if(this.currentAttack == undefined || !(this.combo in this.currentAttack)){
		this.cancel();
		return;
	}
	
	var phase = this.currentAttack[this.combo];
	
	this.combohit = 1;
	//this.time -= this.timeMiss;
	//this.time += this.timeRest;
	
	if("pause" in phase){
		game.slow(0.0, phase["pause"]);
	}
	if("shake" in phase){
		shakeCamera(Game.DELTASECOND*0.25, phase["shake"]);
	}
	
	if("stun" in phase){
		obj.stun = phase["stun"];
	}
	
	if("knockback" in phase && obj.hasModule(mod_rigidbody)){
		var dir = obj.position.subtract( player.position ).normalize();
		var scale = 1.0 / Math.max(obj.mass, 1.0);
		obj.force.x += dir.x * phase["knockback"] * scale;
	}
}

Weapon.prototype.downstab = function(player){
	this.playerState = "downstab";
	var damage = Math.max(Math.floor(this.baseDamage(player) * 0.6),1);
	var type = "struck";
	player.strike(new Line( -4, 8, 4, 20), type, damage);
}
Weapon.prototype.strike = function(player){
	//var rest = this.combohit ? this.timeRest : this.timeMiss;
	if(!this.combohit && this.time > this.timeMiss){
		var phase = this.currentAttack[this.combo];
		var damage = this.damage(player);
		if(phase != undefined){
			var rect = phase["strike"];
			player.strike(rect,"struck",damage);
		}
	}
}
Weapon.prototype.animate = function(player){
	try{
		if(this.time > 0 && this.currentAttack){
			var phase = this.currentAttack[this.combo];
			var animation = phase["animation"];
			//var animTime = this.time - (this.combohit ? this.timeRest : this.timeMiss);
			var animTime = this.time - this.timeMiss;
			var progress = Math.max(1 - (animTime / phase["time"]), 0);
			
			base_f = 0;
			base_fr = 4;
			base_len = 4;
			
			switch(animation){
				case 0: base_f=0; base_fr=4; base_len=4; break; //open
				case 1: base_f=4; base_fr=4; base_len=4; break; //continue
				case 2: base_f=7; base_fr=4; base_len=4; break; //long
				case 3: base_f=1; base_fr=8; base_len=5; break; //jumping
				case 4: base_f=1; base_fr=9; base_len=5; break; //ducking
			}
			
			if(animTime > 0){
				player.frame.x = base_f + Math.floor(progress * base_len);
				player.frame.y = base_fr;
			} else {
				player.frame.x = base_f + base_len - 1;
				player.frame.y = base_fr;
			}
		}
	} catch (e){
		
	}
}
Weapon.prototype.baseDamage = function(player){
	return Math.round(5 + player.stats.attack * this.stats["damage"]);
}

Weapon.prototype.damage = function(player){
	//var state = Weapon.playerState(player);
	//var attack = this.stats[state];
	var phase = this.currentAttack[this.combo];
	var multi = 1.0;
	
	if(this.charge) multi *= 2;
	
	if(phase != undefined) {
		return Math.round(multi * this.baseDamage(player) * phase["damage"]);
	} else {
		return this.baseDamage(player);
	}
}

Weapon.playerState = function(player){
	var state = "standing";
	if(!player.grounded){ 
		state = "jumping";
	} else if(player.states.duck){
		state = "ducking";
	}
	return state;
}


createWeaponTemplate = function(baseTime, restTime, missTime, length){
	return {
		"damage" : 3.0,
		"standing" : {		
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : 0.1*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : 0.333*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			2 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.5,
				"time" : baseTime*Game.DELTASECOND,
				"rest":2.5*restTime*Game.DELTASECOND,
				"miss":missTime*1.2*Game.DELTASECOND,
				"animation" : 2,
				"force" : new Point(3.0, 0.0),
				"pause" : 0.333*Game.DELTASECOND,
				"knockback" : 5,
				"stun" : 0.25 * Game.DELTASECOND,
				"movement" : 0.3
			}
		},
		"ducking" : {
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,8), new Point(length,12)),
				"damage":1.2,
				"time" : baseTime*Game.DELTASECOND,
				"rest": restTime*Game.DELTASECOND,
				"miss": missTime*Game.DELTASECOND,
				"animation" : 4,
				"force" : new Point(0.0, 0.0),
				"stun" : 0.3 * Game.DELTASECOND,
				"movement" : 0.0
			}
		},
		"jumping" : {
			"alwaysqueue" : 0,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,12)),
				"damage":0.8,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":restTime*Game.DELTASECOND,
				"animation" : 3,
				"stun" : 0.5 * Game.DELTASECOND,
				"movement" : 1.0
			}
		}
	};
}

var WeaponStats = {
	"short_sword" : createWeaponTemplate(0.25,0.08,0.15,38),
	"long_sword" : createWeaponTemplate(0.333,0.1,0.2,42),
	"broad_sword" : createWeaponTemplate(0.4,0.1,0.3,42)
}

WeaponStats.short_sword.standing.alwaysqueue = 1;

WeaponStats.long_sword.damage = 4;

WeaponStats.broad_sword.damage = 5;

 /* platformer\exit.js*/ 

Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y,d,o){
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = d[0] * 1;
	this.height = d[1] * 1;
	
	var options = o || {};
	this.visible = false;
	this.offset = new Point();
	this.start = false;
	
	if("direction" in options){
		if( options.direction == "e" ) this.offset.x += 16;
		if( options.direction == "w" ) this.offset.x -= 16;
		if( options.direction == "s" ) this.offset.y += 16;
		if( options.direction == "n" ) this.offset.y -= 16;
	}
	if("start" in options){
		this.start = options["start"];
	}
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {			
			if(this.start){
				WorldMap.open(this.start);
			} else {
				WorldMap.open();
			}
		}
	});
}
Exit.prototype.idle = function(){}

DemoExit.prototype = new GameObject();
DemoExit.prototype.constructor = GameObject;
function DemoExit(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0] * 1;
	this.height = d[1] * 1;
	
	var options = o || {};
	this.visible = false;
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			audio.stopAs("music");
			
			var completed = NPC.get("templeCompleted") * 1;
			var next = completed + 1;
			
			WorldLocale.loadMap("temple"+next+".tmx");
		}
	});
}

 /* platformer\gate.js*/ 

//transform

Gate.prototype = new GameObject();
Gate.prototype.constructor = GameObject;
function Gate(x,y,d,ops){
	x -= 8;
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.sprite = "gate";
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
	this.sprite = "characters";
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
		
		"text".render(g, new Point(28,136+this.cursor*16), 95);
	}
}

 /* platformer\homevillage.js*/ 

HomeVillage = {};

HomeVillage.townFromTag = function(tag){
	for(var i=0; i < _map_town.length; i++){
		if( "tags" in _map_town[i] && _map_town[i].tags.indexOf(tag) >= 0 ){
			return i;
		}
	}
	if( tag != "house") {
		return HomeVillage.townFromTag("house");
	}
	return -1;
}
HomeVillage.create = function(g){
	g.clearAll();
	g.tileSprite = "town";
	
	var pos = 1;
	var rooms = new Array();
	
	rooms.push( HomeVillage.townFromTag( "exit_w" ) );
	for( i in _world.town.buildings ){
		var building = _world.town.buildings[i];
		if( building.complete ){
			var room_id = HomeVillage.townFromTag( i );
			if( room_id >= 0 ) {
				var room = _map_town[room_id];
				rooms[pos] = room_id;
				pos += room.width;
			}
		} else if ( building.progress > 0 ) {
			var wip = "wip" + Math.floor(Math.min( building.progress / 10, 2));
			rooms[pos] = HomeVillage.townFromTag( wip );
			pos += 2;
		}
	}
	rooms[pos] = HomeVillage.townFromTag( "exit_e" );
	pos++;
	
	g.bounds = g.tileDimension = new Line(0,0,pos*8,15);
	g.bounds = g.bounds.scale(16,16);
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	g.buildCollisions();
	
	var pm = new PauseMenu();
	pm.mapDimension = g.tileDimension.scale(1/16.0,1/15.0);
	var mapWidth = Math.floor(pm.mapDimension.width());
	pm.map = new Array(mapWidth);
	for(var i=0; i < mapWidth; i++){
		var tile = i==0?5:(i==mapWidth-1?6:7);
		pm.map[i] = tile;
	}
	
	g.addObject(pm);
	g.addObject(new Background());
	
	for(var i=0; i < rooms.length; i++){
		if( rooms[i] != undefined && rooms[i] >= 0 ) {
			this.createRoom(
				g,
				_map_town[ rooms[i] ],
				new Point(i*128,0),
				g.tileDimension
			);
		}
	}
}
HomeVillage.createRoom = function(g,room, p, t){
	var layers = ["far","back","front"];
	
	var tilex = p.x / 16;
	var width = room["width"] * 8;
	for(var l in room){
		var layer = layers.indexOf(l);
		if(layers.indexOf(l) >= 0 ){
			for(var i=0; i < room[l].length; i++){
				var x = i % width;
				var y = Math.floor(i / width);
				var index = y*t.width() + tilex + x;
				g.tiles[layer][index] = room[l][i];
			}
		}
	}
	
	if("objects" in room){
		for(var i=0; i < room.objects.length; i++){
			try{
				var o = room.objects[i];
				if(o[3] == "Player" && _player instanceof Player){
					obj = _player;
					obj.position.x = p.x + o[0];
					obj.position.y = p.y + o[1];
				} else {
					var obj = new window[o[3]](
						o[0] + p.x,
						o[1] + p.y,
						o[2],o[4]
					);
				}
				g.addObject(obj);
			}catch(err){
				console.error("Cannot add object");
			}
		}
	}
}

 /* platformer\i18n.js*/ 

i18n_language = "english";
i18n_messages = {
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
	"speeds" : {
		"english" : ["Very slow","Slow","Normal","Fast","Very Fast"],
		"engrish" : ["Very slow","Slow","Normal","Fast","Very Fast"]
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
	"smith_intro" : {
		"english" : "You there. Did you know you can only hold one weapon at a time? Don't worry, any weapon you leave behind I'll store it here for you. It'll be free of charge, because I'm kind like that."
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
	"questcomplete" : {
		"english" : "Quest complete!",
		"engrish" : "Quest complete!"
	},
	"quest" : {
		"english" : {
			"q0" : ["The blocked caves", "Talk to the professor in NEARBYTOWN.", "Speak with the professor's brother hidden in the woods south of NEARBYTOWN.","Use the wand to open the cave entrence"],
			"q1" : ["Reach the dead island", "Place your head against the Wailing Wall near Irata Mountain.", "Use the prayer to calm the resentful spirit."],
			"q2" : ["Release the lost souls", "Find the resting places and pray for their souls."],
			"q3" : ["Reach Doite", "Speak with someone in Irata village.", ""]
		},
		"engrish" : {
			"q0" : ["The blocked caves", "Talk to the professor in NEARBYTOWN.", "Speak with the professor's brother hidden in the woods south of NEARBYTOWN.","Use the wand to open the cave entrence"],
			"q1" : ["Reach the dead island", "Place your head against the Wailing Wall near Irata Mountain.", "Use the prayer to calm the resentful spirit."],
			"q2" : ["Release the lost souls", "Find the resting places and pray for their souls.","Return to the resentful spirit"],
			"q3" : ["Do the other thing", "Search for the wrecked ship off of Irata's east coast."]
		}
	},
	"greetings" : {
		"english" : [
			"Hello, stranger.",
			"Evening, friend"
		]
	},
	"miner0" : {
		"english" : [
			"This is no good. We were sent up here to mine. But we found this big old relief in the way. We don't exactly wanna break it. Could you ask the professor for us? He'll know what to do.",
			"Talk to the professor in NEARBYTOWN. He'll help us move this relief",
			"You talked to him? He wants you to get a magic wand? Maybe the professor is losing his marbles.",
			"I can't believe that actually worked. Here was me thinkin' we had the week off"
		]	
	},
	"town01_professor" :{
		"english" : [
			"Thank you, young... man. Without Chort's minons running around the countryside, my research can continue unabated!",
			"There's a large relief blocking the cave's entrence?! How amazing! That's a ancient door. Rather than have those brutes ruin it with their picks, find my brother in the south of the forest. He hides himself away, but he'll have the wand needed to open this cave.",
			"Have you spoken with my brother? He lives south of here, on the other side of the forest.",
			"You got the wand! It's certainly a marvel to see. It must be thousands of years old. Use it on the relief at the cave's entrence.",
			"Hard to believe after so many years, these ancient gadgets still work."
		]
	},
	"town02_hermit" :{
		"english" : [
			"Get out of here you wild thing!",
			"I'm sorry, I thought you were some wild creature looking for food. My brother sent you? He should know better than that. If it's the wand you're after here it is. But take good care of it. It's priceless.",
			"Next time your see my brother, tell him not to send anymore people to me. I just want to be left alone."
		]
	},
	"southcitymadman" : {
		"english" : [
			"You're trying to get to the island? There's a place next to Irata Mountain called the Wailing wall. I hear if you place your head against it, a spirit will take you to the island.",
			"Have you tried it yet? The Wailing Wall is just north of here, next to the foot of the mountain."
		]
	},
	"wailingwall" :{
		"english" : [
			"Are... are you okay there, friend?",
			"Someone told you if you put your head against this rock and you'll end up in across the river?! I think someone might be having you on. Here. Come and join us by our fire.",
			"My name is Lance, and this is my friend Carl. We're travelers in these parts. We don't see many people in these parts.",
			"Yeah, especially Beasts.",
			"Don't be rude, Carl.",
			"I'm not being rude. I'm just saying... I've nothing against Beast Lords.",
			"Some of your best friends are Beast Lords. Eh, Carl?",
			"As a matter of fact, yes.",
			"Carl is sweet on this Beast Lord girl, but she doesn't speak a word of the language.",
			"People can have a very meaningful time together without actually talking, Lance.",
			"Ooooh, look at you, boasting!",
			"Knock it off, Lance. She's not like that. She's really sweet.",
			"It's a good thing you two can't speak. She'd realise what an oaf you are.",
			"Anyway, why do you want to cross the river for, stranger? Haven't you heard the land there is haunted?",
			"He's not joking either. I heard there was a resentful spirit that strikes any trespassers dead with fright.",
			"I think Carl's girl may be from that island. The only words in our language she can speak is this weird little prayer. How does it go, Carl?",
			"I dunno if I should be telling you this. You seem friendly, the last thing I want is you rushing off into that acursed island...",
			"...but if you really want to know it...",
			"Good luck, friend. Don't mess with devils and ghosts."
		]
	},
	
	
	//Phantom Pass
	"phantompass" :{
		"english" : [
			"You're a strange one. You know the lament of the dead? It's a prayer for releasing lost souls, not many Mortals know it.",
			"You want past? I cannot allow it. This is the land of the dead. No living creature can be permitted.",
			"Perhaps there is a way for you to pass. There is something you can do for the dead to ease their weary souls. How about it?",
			"This is Bardo, the land between life and death. Find the lost souls in this place and pray for their release.",
			"I first wandered these lands, like you, as a living man. I wanted to help the ill and dying of this land. They were sent here to die, and offered respite.",
			"But there were so many dead here, I haven't even half completed my task.",
			"Good luck, young warrior. Return here once you have prayed for all the lost souls."
		]
	},
	"phantomend" :{
		"english" : [
			"Poor sorry beast. My duty here has lasted centuries, but at last it is coming to an end. I'm sorry it had to be you, but I've dreamt of this day since I first took up the reins.",
			"What do you think you're doing, Phantom?"
		]
	},
};
function i18n(name,replace){
	replace = replace || {};
	var out = "";
	if( name in i18n_messages ){
		if( i18n_language in i18n_messages[name] ){
			out = i18n_messages[name][i18n_language];
		}else {
			for(var i in i18n_messages[name]){
				out = i18n_messages[name][i];
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
function Item(x,y,d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 16;
	this.name = "";
	this.sprite = "items";
	this.sleep = null;
	
	this.glowing = false;
	this.glow = 0.0;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 0.25;
	this.enchantChance = 0.8;
	this.itemid = null;
	
	ops = ops || {};	
	
	if( "enchantChance" in ops ) {
		this.enchantChance = ops["this.enchantChance"];
	}
	if( "id" in ops ) {
		this.itemid = "item_" + ops["id"];
		if(NPC.get(this.itemid)){
			this.on("added", function(){ this.destroy();});
		}
	}
	if( "name" in ops ) {
		if(ops["name"] == "random"){
			this.setName(Item.randomTreasure(Math.random()).name);
		} else {
			this.setName( ops.name );
		}
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 24; }
			if( this.name == "life_up" ) { obj.lifeMax += 6; obj.heal += 6; DemoThanks.items++; }
			if( this.name == "life_small" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 5; }
			if( this.name == "mana_small" ) { if(obj.mana >= obj.manaMax) return; obj.manaHeal = 12; audio.play("gulp"); }
			if( this.name == "money_bag" ) { Item.dropMoney(obj.position, 50, Game.DELTASECOND*0.5); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "life_fruit") { obj.lifeMax += 6; obj.heal = 9999; audio.play("gulp"); DemoThanks.items++; }
			if( this.name == "mana_fruit") { obj.manaMax += 6; obj.manaHeal = 999; audio.play("gulp"); DemoThanks.items++; }
			
			if( this.isWeapon ) {
				var currentWeapon = _player.equip_weapon;
				obj.equip(this, obj.equip_shield);
				game.addObject(currentWeapon);
				audio.play("equip");
			}
			
			if( this.isShield ) {
				if( obj.equip_sword instanceof Item && obj.equip_sword.twoHanded ) {
					//Cant equip shield with a two handed weapon
					return false;
				}
				var currentShield = _player.equip_shield;
				obj.equip(obj.equip_sword, this); 
				game.addObject(currentShield);
				audio.play("equip");
			}
			
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			if( this.name == "gauntlets") { obj.grabLedges = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "doublejump") { obj.doubleJump = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "dodgeflash") { obj.dodgeFlash = true; this.pickupEffect(); DemoThanks.items++;}
			
			//Enchanted items
			if( this.name == "intro_item") { obj.stats.attack+=3; game.addObject(new SceneTransform(obj.position.x, obj.position.y)); obj.sprite = "player"; audio.play("levelup"); }
			
			
			if( this.name == "seed_oriax") { obj.stats.attack+=1; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "seed_bear") { obj.stats.defence+=1; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "seed_malphas") { obj.stats.magic+=1; this.pickupEffect(); DemoThanks.items++;}
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
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_soul") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			
			if( this.name == "spell_fire") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			if( this.name == "spell_flash") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			if( this.name == "spell_heal") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			if( this.name == "spell_purify") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			if( this.name == "spell_bifurcate") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			if( this.name == "spell_teleport") { obj.equipSpell(this); this.destroy(); audio.play("equip"); }
			
			if( this.name == "unique_wand"){ obj.addUniqueItem(this); this.destroy(); this.pickupEffect(); }
			if( this.name == "unique_pray"){ obj.addUniqueItem(this); this.destroy(); this.pickupEffect(); }
			
			//dataManager.itemGet(this.name);
			
			if( "equip" in obj ){
				obj.equip();
			}
			
			var pm = game.getObject(PauseMenu);
			if( pm != null && this.message != undefined ) {
				pm.message( this.getMessage() );
			}
			if(this.itemid){
				NPC.set(this.itemid,1)
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
		this.frame.x = 0; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":18, "sprite":new Point(0,0) };
		this.message = Item.weaponDescription;
		if(0) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "long_sword") { 
		this.frame.x = 1; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":11,"rest":8.0,"range":24, "sprite":new Point(1,0) };
		this.message = Item.weaponDescription;
		if(0) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "broad_sword") { 
		this.frame.x = 3; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":24, "sprite":new Point(2,0) };
		this.message = Item.weaponDescription;
		if(0) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "spear") { 
		this.frame.x = 2; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":21.5, "strike":17.5,"rest":12.0,"range":32, "sprite":"sword3" };
		this.message = Item.weaponDescription;
		if(0) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "warhammer") { 
		this.frame.x = 6; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = true;
		this.level=1; this.bonus_att=5; 
		this.stats = {"warm":24.5, "strike":15.5,"rest":12.0,"range":27, "sprite":"sword4" };
		this.message = Item.weaponDescription;
		if(0) {
			if( Math.random() < this.enchantChance ) Item.enchantWeapon(this);
			if( Math.random() < this.enchantChance*.3 ) Item.enchantWeapon(this);
		}
		return; 
	}
	if(n == "small_shield") { 
		this.frame.x = 0; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.0,"guardlife":30,"height":16, "frame":0, "frame_row":0,"turn":0.3}
		return; 
	}
	if(n == "large_shield") { 
		this.frame.x = 1; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":16, "frame":0, "frame_row":1,"turn":0.5}
		return; 
	}
	if(n == "kite_shield") { 
		this.frame.x = 2; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":0, "frame_row":2,"turn":0.6}
		return; 
	}
	if(n == "broad_shield") { 
		this.frame.x = 3; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.4,"guardlife":50,"height":18, "frame":0, "frame_row":3,"turn":0.6}
		return; 
	}
	if(n == "knight_shield") { 
		this.frame.x = 4; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":17, "frame":2, "frame_row":0,"turn":0.5}
		return; 
	}
	if(n == "spiked_shield") { 
		this.frame.x = 5; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":2, "frame_row":1,"turn":0.5}
		return; 
	}
	if(n == "heavy_shield") { 
		this.frame.x = 6; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.2,"guardlife":60,"height":17, "frame":2, "frame_row":2,"turn":0.8}
		return; 
	}
	if(n == "tower_shield") { 
		this.frame.x = 7; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.5,"guardlife":70,"height":30, "frame":2, "frame_row":3,"turn":1.1}
		return; 
	}
	
	if( this.name.match(/^key_\d+$/) ) { this.frame.x = this.name.match(/\d+/) - 0; this.frame.y = 0; return; }
	if(n == "life") { this.frame.x = 0; this.frame.y = 1; return; }
	if(n == "map") { this.frame.x = 3; this.frame.y = 1; this.message = "Map\nReveals unexplored areas on the map."; return }
	
	if(n == "life_small") { this.frame.x = 1; this.frame.y = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "mana_small") { this.frame.x = 4; this.frame.y = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "money_bag") { this.frame.x = 5; this.frame.y = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "xp_big") { this.frame.x = 2; this.frame.y = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame.y = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame.y = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame.y = 1; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.5; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame.x = 13; this.frame.y = 0; this.addModule(mod_rigidbody); this.mass = 0.4; this.bounce = 0.0; return; }
	
	//Special items
	if(n == "gauntlets") { this.frame.x = 4; this.frame.y = 6; return; }
	if(n == "doublejump") { this.frame.x = 0; this.frame.y = 5; return; }
	if(n == "dodgeflash") { this.frame.x = 5; this.frame.y = 6; return; }
	
	//Charms
	if( this.name == "charm_sword") { this.frame.x = 0; this.frame.y = 8; this.message = "Sword Charm\nEnchanted attack.";}
	if( this.name == "charm_mana") { 
		this.frame.x = 1; 
		this.frame.y = 8;
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
	if( this.name == "charm_alchemist") { this.frame.x = 2; this.frame.y = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame.x = 3; this.frame.y = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame.x = 4; this.frame.y = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame.x = 5; this.frame.y = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame.x = 6; this.frame.y = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame.x = 7; this.frame.y = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	if( this.name == "charm_soul") { this.frame.x = 8; this.frame.y = 8; this.message = "Soul Charm\nA magic seal will protect you.";}
	
	//All items below this point glow!
	this.glowing=true;
		
	if(n == "life_up") { this.frame.x = 6; this.frame.y = 1; return; }
	if( this.name == "intro_item") { this.frame.x = 0; this.frame.y = 4; this.message = "Mysterious drink.";}
	
	if( this.name == "seed_oriax") { this.frame.x = 0; this.frame.y = 4; this.message = "Oriax Seed\nAttack up.";}
	if( this.name == "seed_bear") { this.frame.x = 1; this.frame.y = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame.x = 2; this.frame.y = 4; this.message = "Malphas Seed\nTechnique up.";}
	if( this.name == "seed_cryptid") { this.frame.x = 3; this.frame.y = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame.x = 4; this.frame.y = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame.x = 5; this.frame.y = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame.x = 6; this.frame.y = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame.x = 7; this.frame.y = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame.x = 8; this.frame.y = 4; this.message = "Batty Seed\nYou can fly.";}
	if( this.name == "seed_chort") { this.frame.x = 9; this.frame.y = 4; this.message = "Chort Seed\nYour body is a tank.";}
	if( this.name == "seed_poseidon") { this.frame.x = 10; this.frame.y = 4; this.message = "Poseidon Seed\nAll attributes up.";}
	if( this.name == "seed_tails") { this.frame.x = 11; this.frame.y = 4; this.message = "Tails Seed\nGold runs in your veins.";}
	if( this.name == "seed_mair") { this.frame.x = 12; this.frame.y = 4; this.message = "Mair Seed\nTrades attack and defence for technique.";}
	if( this.name == "seed_igbo") { this.frame.x = 13; this.frame.y = 4; this.message = "Igbo Seed\nDefence very up.";}
	
	if( this.name == "pedila") { this.frame.x = 0; this.frame.y = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame.x = 2; this.frame.y = 5; this.message = "Haft\nIncreased critical damage.";}
	if( this.name == "zacchaeus_stick") { this.frame.x = 3; this.frame.y = 5; this.message = "Zacchaeus'\nMore money.";}
	if( this.name == "fangs") { this.frame.x = 4; this.frame.y = 5; this.message = "Fangs\nLife steal.";}
	if( this.name == "passion_fruit") { this.frame.x = 5; this.frame.y = 5; this.message = "Passion Fruit\nFull restoration.";}
	if( this.name == "shield_metal") { this.frame.x = 6; this.frame.y = 5; this.message = "Shield Metal\nCurrent shield improved.";}
	if( this.name == "magic_gem") { this.frame.x = 7; this.frame.y = 5; this.message = "Magic Gem\nEnchanted attack.";}
	if( this.name == "snake_head") { this.frame.x = 8; this.frame.y = 5; this.message = "Snake Head\nAdds poison chance to attack.";}
	if( this.name == "broken_banana") { this.frame.x = 9; this.frame.y = 5; this.message = "Broken Banana\nWeakens enemies.";}
	if( this.name == "blood_letter") { this.frame.x = 10; this.frame.y = 5; this.message = "Blood letter\nAdds bleed chance to attack.";}
	if( this.name == "red_cape") { this.frame.x = 11; this.frame.y = 5; this.message = "Red cape\nAdds rage chance to attack.";}
	if( this.name == "chort_nose") { this.frame.x = 12; this.frame.y = 5; this.message = "Chort Nose\nSniffs out Waystones.";}
	if( this.name == "plague_mask") { this.frame.x = 13; this.frame.y = 5; this.message = "Plague Mask\nImmune to poison.";}
	if( this.name == "spiked_shield") { this.frame.x = 14; this.frame.y = 5; this.message = "Spiked Shield\nInflicts damage on attackers.";}
	if( this.name == "black_heart") { this.frame.x = 15; this.frame.y = 5; this.message = "Black Heart\nLess life, more attributes.";}
	if( this.name == "treasure_map") { this.frame.x = 0; this.frame.y = 6; this.message = "Treasure Map\nReveals secrets areas on map.";}
	if( this.name == "life_fruit") { this.frame.x = 1; this.frame.y = 6; this.message = "Life fruit\nLife up.";}
	if( this.name == "mana_fruit") { this.frame.x = 2; this.frame.y = 6; this.message = "Mana fruit\nMana up.";}
	
	if( this.name == "spell_fire") { this.frame.x = 0; this.frame.y = 10; this.castTime = Game.DELTASECOND * 0.1; this.cast = spell_fire; this.message = "Spell of Fire\nCast magic fire balls.";}
	if( this.name == "spell_flash") { this.frame.x = 1; this.frame.y = 10; this.castTime = Game.DELTASECOND * 0.2; this.cast = spell_flash; this.message = "Spell of Flash\nDrains and absorbs nearby enemies' life.";}
	if( this.name == "spell_heal") { this.frame.x = 2; this.frame.y = 10; this.castTime = Game.DELTASECOND * 1.0; this.cast = spell_heal; this.message = "Spell of Healing\nCloses wounds.";}
	if( this.name == "spell_purify") { this.frame.x = 3; this.frame.y = 10; this.castTime = Game.DELTASECOND * 0.5; this.cast = spell_purify; this.message = "Spell of Purification\nRemoves curses and ailments.";}
	if( this.name == "spell_bifurcate") { this.frame.x = 4; this.frame.y = 10; this.castTime = Game.DELTASECOND * 0.3; this.cast = spell_bifurcate; this.message = "Spell of Bifurcation\nHalves the life of enemy.";}
	if( this.name == "spell_teleport") { this.frame.x = 5; this.frame.y = 10; this.castTime = Game.DELTASECOND * 0.5; this.cast = spell_teleport; this.message = "Spell of Teleportation\nAllows to set a marker and teleport to it.";}
	
	if( this.name == "unique_wand"){
		this.frame.x = 2;
		this.frame.y = 6;
		this.message = "Ancient Wand";
		this.progress = 0.0;
		this.use = function(player){
			this.progress += game.deltaUnscaled;
			if(this.progress < Game.DELTASECOND * 2){
				game.pause = true;
				return true;
			}else{
				this.progress = 0.0;
				Trigger.activate("caverock");
				game.pause = false;
				return false;
			}
		}
	}
	
	if( this.name == "unique_pray"){
		this.frame.x = 1;
		this.frame.y = 6;
		this.message = "Strange Prayer";
		this.progress = 0.0;
		this.use = function(player){
			this.progress += game.deltaUnscaled;
			if(this.progress < Game.DELTASECOND * 2){
				game.pause = true;
				return true;
			}else{
				var objs = game.overlaps(new Line(game.camera,game.camera.add(game.resolution)));
				for(var i=0; i < objs.length; i++){
					objs[i].trigger("prayer");
				}
				this.progress = 0.0;
				game.pause = false;
				return false;
			}
		}
	}
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
		this.frame.x = this.frames[ Math.floor( this.animation_frame ) ];
		this.flip = this.frame.x < 0;
		this.frame.x = Math.abs(this.frame.x);
	}
}

Item.prototype.render = function(g,c){
	if( !this.glowing ) {
		GameObject.prototype.render.apply(this,[g,c]);
	} else {
		this.glow += this.delta * 0.05;
		
		var a = (1.0 + Math.sin(this.glow)) * 0.5;
		var o = new Point(0, (a-0.5) * 2);
		
		g.renderSprite(this.sprite, 
			this.position.subtract(c).add(o),
			this.zIndex,
			this.frame,
			false,
			{"shader":"item","u_color":[0.8,0.1,1.0,a]}
		);
	}
}

Item.drop = function(obj,money,sleep){
	money = money || Math.ceil(1+Math.random()*3);
	
	if(Math.random() > 0.95){
		money += 20 + Math.floor(Math.random()*10);
	}
	
	if("money_bonus" in _player){
		money = Math.round(money * _player.money_bonus);
	}

	Item.dropMoney(obj.position, money, sleep);
	
	if (Math.random() < _player.waystone_bonus) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "waystone"} );
		if( sleep ) item.sleep = sleep;
		game.addObject( item );
	}
	
	if (Math.random() > 0.9) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "life_small"} );
		if( sleep ) item.sleep = sleep;
		game.addObject( item );
	}
	
	if (Math.random() > 0.967) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "mana_small"} );
		if( sleep ) item.sleep = sleep;
		game.addObject( item );
	}
}
Item.dropMoney = function(position, money, sleep){
	if(sleep == undefined){
		sleep = 0;
	}
	while(money > 0){
		var coin;
		var off = new Point((Math.random()-.5)*8,(Math.random()-.5)*8);
		if(money > 40){
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_3"} );
			money -= 10;
		} else if( money > 10 ) {
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_2"} );
			money -= 5;
		} else {
			coin = new Item( position.x+off.x, position.y+off.y, false, {"name":"coin_1"} );
			money -= 1;
		}
		coin.force.y -= 5.0;
		if( sleep ) coin.sleep = sleep;
		game.addObject(coin);
	}
}
Item.randomTreasure = function(roll, tags, ops){
	tags = tags || [];
	ops = ops || {};
	ops.remaining = ops.remaining || 0;
	
	var shortlist = [];
	var total = 0.0;
	for(var i=0; i<Item.treasures.length; i++) 
		if((!ops.locked && Item.treasures[i].remaining > ops.remaining) || (ops.locked && Item.treasures[i].unlocked <= 0))
			if(Item.treasures[i].tags.intersection(tags).length == tags.length) {
				total += Item.treasures[i].rarity;
				shortlist.push(Item.treasures[i]);
			}
	roll *= total;
	for(var i=0; i<shortlist.length; i++) {
		if( roll < shortlist[i].rarity ) return shortlist[i];
		roll -= shortlist[i].rarity;
	}
	return Item.treasures[0];
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

Item.treasures = [
	{"tags":["goods","chest"],"name":"life","unlocked":1,"rarity":0.5,"pathSize":1,"doors":0.0,"pergame":9999,"price":20},
	{"tags":["goods","chest"],"name":"mana_small","unlocked":1,"rarity":0.3,"pathSize":1,"doors":0.0,"pergame":9999,"price":30},
	{"tags":["chest","shop"],"name":"xp_big","unlocked":1,"rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":40},
	{"tags":["treasure","chest"],"name":"money_bag","unlocked":1,"rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
	{"tags":["treasure","shop"],"name":"life_up","unlocked":1,"rarity":0.01,"pathSize":4,"doors":0.5,"pergame":9999,"price":500},
	{"tags":["stone","chest"],"name":"waystone","unlocked":1,"rarity":0.2,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
	
	{"tags":["treasure","chest","weapon"],"name":"short_sword","unlocked":1,"rarity":0.2,"pathSize":2,"doors":0.0,"pergame":10,"price":20},
	{"tags":["treasure","chest","weapon"],"name":"long_sword","unlocked":1,"rarity":0.3,"pathSize":3,"doors":0.0,"pergame":10,"price":30},
	{"tags":["treasure","chest","weapon"],"name":"spear","unlocked":1,"rarity":0.2,"pathSize":3,"doors":0.5,"pergame":10,"price":30},
	{"tags":["treasure","chest","weapon"],"name":"warhammer","unlocked":0,"rarity":0.15,"pathSize":3,"doors":0.5,"pergame":10,"price":40},
	
	{"tags":["treasure","chest"],"name":"small_shield","unlocked":1,"rarity":0.2,"doors":0.5,"pergame":0,"price":30},
	{"tags":["treasure","chest"],"name":"large_shield","unlocked":0,"rarity":0.14,"doors":0.5,"pergame":10,"price":35},
	{"tags":["treasure","chest"],"name":"kite_shield","unlocked":0,"rarity":0.12,"doors":0.5,"pergame":10,"price":40},
	{"tags":["treasure","chest"],"name":"broad_shield","unlocked":0,"rarity":0.1,"doors":0.5,"pergame":10,"price":40},
	{"tags":["treasure","chest"],"name":"knight_shield","unlocked":0,"rarity":0.08,"doors":0.5,"pergame":10,"price":40},
	{"tags":["treasure","chest"],"name":"spiked_shield","unlocked":0,"rarity":0.07,"doors":0.5,"pergame":10,"price":50},
	{"tags":["treasure","chest"],"name":"heavy_shield","unlocked":0,"rarity":0.06,"doors":0.5,"pergame":10,"price":40},
	{"tags":["treasure","chest"],"name":"tower_shield","unlocked":0,"rarity":0.05,"doors":0.5,"pergame":10,"price":50},
	
	{"tags":["treasure","shop"],"name":"seed_oriax","unlocked":1,"rarity":0.1,"pathSize":6,"doors":0.3,"pergame":1,"price":100},
	{"tags":["treasure","shop"],"name":"seed_bear","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"seed_malphas","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"seed_cryptid","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"seed_knight","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"seed_minotaur","unlocked":0,"rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	{"tags":["treasure","shop"],"name":"seed_plaguerat","unlocked":0,"rarity":0.05,"pathSize":5,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"seed_marquis","unlocked":1,"rarity":0.06,"pathSize":3,"doors":0.1,"pergame":1,"price":90},
	{"tags":["alter","treasure","shop"],"name":"seed_batty","unlocked":0,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":150},
	{"tags":["alter","treasure","shop"],"name":"seed_chort","unlocked":0,"rarity":0.03,"pathSize":7,"doors":0.1,"pergame":1,"price":150},
	{"tags":["alter","treasure","shop"],"name":"seed_poseidon","unlocked":0,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":200},
	{"tags":["alter","treasure","shop"],"name":"seed_tails","unlocked":0,"rarity":0.1,"pathSize":7,"doors":0.1,"pergame":1,"price":100},
	{"tags":["alter","treasure","shop"],"name":"seed_mair","unlocked":0,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":150},
	{"tags":["alter","treasure","shop"],"name":"seed_igbo","unlocked":0,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":100},
	
	{"tags":["alter","treasure","shop","spell"],"name":"spell_fire","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	{"tags":["alter","treasure","shop","spell"],"name":"spell_flash","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	{"tags":["alter","treasure","shop","spell"],"name":"spell_heal","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	{"tags":["alter","treasure","shop","spell"],"name":"spell_purify","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	{"tags":["alter","treasure","shop","spell"],"name":"spell_bifurcate","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	{"tags":["alter","treasure","shop","spell"],"name":"spell_teleport","unlocked":1,"rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":300},
	
	{"tags":["alter","treasure","shop"],"name":"pedila","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	{"tags":["treasure","shop"],"name":"haft","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	{"tags":["treasure","shop"],"name":"zacchaeus_stick","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	{"tags":["treasure","shop"],"name":"fangs","unlocked":0,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	{"tags":["chest","treasure","shop"],"name":"passion_fruit","unlocked":1,"rarity":0.1,"pathSize":2,"doors":0.0,"pergame":9999,"price":100},
	{"tags":["treasure","shop"],"name":"shield_metal","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
	//{"tags":["treasure","shop"],"name":"magic_gem","unlocked":1,"rarity":0.05,"pathSize":6,"doors":0.1,"pergame":1,"price":100},
	{"tags":["treasure","shop"],"name":"snake_head","unlocked":1,"rarity":0.04,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"broken_banana","unlocked":0,"rarity":0.05,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"blood_letter","unlocked":1,"rarity":0.05,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"red_cape","unlocked":0,"rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"chort_nose","unlocked":1,"rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"plague_mask","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"spiked_shield","unlocked":1,"rarity":0.04,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"black_heart","unlocked":0,"rarity":0.03,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["shop"],"name":"treasure_map","unlocked":0,"rarity":0.03,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
	{"tags":["treasure","shop"],"name":"life_fruit","unlocked":0,"rarity":0.2,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"mana_fruit","unlocked":0,"rarity":0.2,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	
	{"tags":["chest","alter"],"name":"charm_sword","unlocked":0,"rarity":0.03,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["chest","alter"],"name":"charm_mana","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure","shop"],"name":"charm_alchemist","unlocked":1,"rarity":0.1,"pathSize":5,"doors":0.1,"pergame":1,"price":80},
	{"tags":["chest","treasure","shop"],"name":"charm_musa","unlocked":0,"rarity":0.04,"pathSize":6,"doors":0.3,"pergame":1,"price":120},
	{"tags":["treasure"],"name":"charm_wise","unlocked":0,"rarity":0.04,"pathSize":3,"doors":0.3,"pergame":1,"price":80},
	{"tags":["chest","shop"],"name":"charm_methuselah","unlocked":1,"rarity":0.06,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["treasure"],"name":"charm_barter","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
	{"tags":["chest","shop"],"name":"charm_elephant","unlocked":1,"rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70}
];

 /* platformer\lamp.js*/ 

Lamp.prototype = new GameObject();
Lamp.prototype.constructor = GameObject;
function Lamp(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "lamps";
	this.zIndex = -21;
	this.size = 180;
	this.show = true;
	this.color = [1.0,0.85,0.75,1.0];
	
	this.frame = 0;
	this.frame_row = 0;
	
	o = o || {};
	if("size" in o){
		this.size = o.size * 1;
	}
	if("show" in o){
		this.show = o.show * 1;
	}
	if("color" in o){
		var colorArray = o.color.split(",");
		if(colorArray.length >= 3){
			this.color[0] = colorArray[0] * 1;
			this.color[1] = colorArray[1] * 1;
			this.color[2] = colorArray[2] * 1;
		}
	}
}
Lamp.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.3) % 4;
}
Lamp.prototype.render = function(g,c){	
	if(this.show){
		GameObject.prototype.render.apply(this,[g,c]);
	}
	Background.pushLight( this.position, this.size, this.color );
}
Lamp.prototype.idle = function(){
	var current = this.awake;
	var corners = this.corners();
	var margin = this.size * 0.5 + 32;
	
	this.awake = (
		corners.right + margin > game.camera.x &&
		corners.left - margin < game.camera.x + game.resolution.x &&
		corners.bottom + margin > game.camera.y &&
		corners.top - margin < game.camera.y + game.resolution.y
	);
	
	if( current != this.awake ){
		this.trigger( (this.awake ? "wakeup" : "sleep") );
	}
}

 /* platformer\lift.js*/ 

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y,d,ops){
	this.constructor();
	this.start_x = x;
	this.position.x = this.start_x;
	this.position.y = y;
	this.width = 28;
	this.height = 32;
	this.speed = 3.0;
	this.sprite = "elevator";
	
	this.onboard = false;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = true;
			obj.position.y = this.position.y;
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
	
	this.frame.x = (this.frame.x+this.delta*Math.abs(this.force.y))%3;
	if(Math.abs(this.force.y) < 0.2) this.frame.x = 0;
	this.frame_row = 0;
	
	this.onboard = false;
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
MapDebug.prototype.hudrender = function(g,c){
	try {
		var size = new Point(8,8);
		this.slice = Math.min(Math.max(this.slice,0),RandomTemple.testslice.length-1);
		
		var slice = RandomTemple.testslice[this.slice].data;
		var entrances = RandomTemple.testslice[this.slice].getEntrances();
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
					"map".render(g,mpos,0,tileY);
				}
			}
		}
		/*
		for(var i in slice ){
			if( slice[i].room == -1 ) {
				//Render room parts
				var pos = MapSlice.idToLoc(i);
				var mpos = pos.scale(8).subtract(this.offset);
				"map".render(g,mpos,4,4);
			}
		}
		*/
		
		for(var i=0; i<entrances.length;i++){
			var mpos = entrances[i].scale(8).subtract(this.offset).add(new Point(-2,3));
			g.color = [0,1.0,0,1.0];
			g.scaleFillRect(mpos.x,mpos.y,4,4);
		}
	} catch (err) {}
}
MapDebug.prototype.idle = function(){}

 /* platformer\menu_item.js*/ 

ItemMenu.prototype = new GameObject();
ItemMenu.prototype.constructor = GameObject;
function ItemMenu(unlocks){
	this.constructor();
	this.sprite = "items";
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
	for(var i=0; i < Item.treasures.length; i++) 
		if( Item.treasures[i].name == name )
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
		Math.ceil( (Item.treasures.length+1) / columnWidth ) * 40 - (240-24), 0 
	);
	
	this.scroll.y = Math.min(Math.max(this.scroll.y,0), scrollHeight);
	
	textArea(g,"Unlocked Items", xpos+72+this.scroll.x,8-this.scroll.y);
	
	for(var i=0; i < Item.treasures.length; i++) {
		var name = Item.treasures[i].name;
		
		switch(Item.treasures[i].unlocked * 1) {
			case 1 : g.color = [0.8,0.6,0.9,1.0]; break;
			case 2 : g.color = [1.0,1.0,1.0,1.0]; break;
			default : g.color = [0.2,0.1,0.6,1.0]; break;
		}
		
		var colmpos = (i % columnWidth);
		var x = 16 + colmpos * 40;
		var y = 24 + Math.floor(i / columnWidth) * 40;
		var pos = new Point(xpos+x+12,y+12);
		g.scaleFillRect(xpos+x,y-this.scroll.y,24,24);
		
		if( Item.treasures[i].unlocked > 0 && this.unlocks.indexOf(name) < 0  ){
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
			"bullets".render(g,p.add(this.burst).subtract(this.scroll),2,2);
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
	
	this.page = 1;
	this.pageCount = 5;
	this.cursor = 0;
	this.questscroll = 0;
	this.mapCursor = new Point();
	this.stat_cursor = 0;
	this.questlist = new Array();
	
	this.icons = false;
	
	this.map = new Array();
	this.map_reveal = new Array();
	this.mapDimension = null;
	
	this.message_text = false;
	this.message_time = 0;
}

PauseMenu.open = false;
PauseMenu.questScrollLimit = 12;

PauseMenu.prototype.idle = function(){}
PauseMenu.prototype.update = function(){
	DemoThanks.time += this.delta;
	
	if( PauseMenu.open ) {
		game.pause = true;
		this.message_time = 0;
		
		if( _player.life <= 0 ) {
			//Player is dead, just wait for the start button to be pressed
			if( input.state("pause") == 1 ) { 
				_player.respawn();
				return;
			}
		} else if( this.page == 0 ) {
			//Option page
			
			if( input.state("up") == 1 ) { this.cursor-=1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=1; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, 3), 0 );
			
			if( input.state("fire") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) Settings.fullscreen = !Settings.fullscreen;
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) Settings.sfxvolume = Math.min(Settings.sfxvolume+0.25,1);
				if(this.cursor == 3 ) Settings.musvolume = Math.min(Settings.musvolume+0.25,1);
				WorldMap.updateSettings();
			} else if( input.state("jump") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) Settings.fullscreen = !Settings.fullscreen;
				if(this.cursor == 1 ) _player.autoblock = !_player.autoblock;
				if(this.cursor == 2 ) Settings.sfxvolume = Math.max(Settings.sfxvolume-0.25,0);
				if(this.cursor == 3 ) Settings.musvolume = Math.max(Settings.musvolume-0.25,0);
				WorldMap.updateSettings();
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
			//Unique Items
			if( input.state("up") == 1 ) { 
				this.cursor = (this.cursor > 0) ? this.cursor - 1 : _player.uniqueItems.length-1; 
				audio.play("cursor"); 
			}
			if( input.state("down") == 1 ) { 
				this.cursor = (this.cursor + 1) % _player.uniqueItems.length; 
				audio.play("cursor"); 
			}
			if( input.state("fire") == 1 ) { 
				_player.unique_item = _player.uniqueItems[this.cursor];
				PauseMenu.open = false;
				game.pause = false;
				audio.play("spell");
			}
		} else if (this.page == 4){
			//Quests
			if(this.questlist.length > 0){
				if( input.state("down") == 1){
					this.cursor = (this.cursor + 1) % this.questlist.length;
					audio.play("cursor"); 
				}
				if( input.state("up") == 1){
					this.cursor = this.cursor == 0 ? this.questlist.length-1 : this.cursor-1;
					audio.play("cursor"); 
				}
				this.questscroll = Math.max(
					Math.min(this.cursor, this.questscroll), 
					this.cursor-(PauseMenu.questScrollLimit-1)
				);
			}
		}
		
		if( _player.life > 0) {
			//Close pause menu
			if( input.state("pause") == 1 ) {
				PauseMenu.open = false;
				game.pause = false;
				audio.play("unpause");
			}
			
			//Navigate pages
			if( this.page != 1 || input.state("fire") <= 0 ) {
				if( input.state("left") == 1 ) { this.page = ( this.page + 1 ) % this.pageCount; this.cursor = 0; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.page = (this.page<=0 ? (this.pageCount-1) : this.page-1); this.cursor = 0; audio.play("cursor"); }
			}
		}
	} else {
		if( ( input.state("pause") == 1 ) && _player instanceof Player && _player.life > 0 ) {
			PauseMenu.open = true;
			//_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
			this.cursor = 0;
			this.mapCursor.x = 11 - Math.floor(_player.position.x / 256);
			this.mapCursor.y = 11 - Math.floor(_player.position.y / 240);
			this.stat_cursor = 0;
			this.page = 1;
			this.questlist = Quests.list();
			if( _player.stat_points > 0 ) this.page = 2;
			audio.play("pause");
		}
	}

	var map_width = Math.floor(game.map.width / 16);
	var map_index = (
		( Math.floor(_player.position.x / 256) - 0 ) + 
		( Math.floor(_player.position.y / 240) - 0 ) * map_width
	);
	this.map_reveal[map_index] = 2;
	
	this.message_time -= game.deltaUnscaled;
}
PauseMenu.prototype.message = function(m){
	this.message_text = m;
	this.message_time = Game.DELTASECOND*2;
}
PauseMenu.prototype.revealMap = function(secrets){
	secrets = secrets || 0;
	var map = game.map.map;
	for(var i=0; i < map.length; i++ ) {
		if( secrets > 0 || map[i] >= 0 ){
			if( this.map_reveal[i] == undefined ) {
				this.map_reveal[i] = 0;
			}
			this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
		}
	}
}
PauseMenu.prototype.hudrender = function(g,c){
	var xpos = (game.resolution.x - 256) * 0.5;
	
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	"pig".render(g,new Point(128,128), 0, row );
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
	if( PauseMenu.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			g.color = [0,0,0,1.0];
			g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
			
			var gamex = game.resolution.x * 0.5 - 427 * 0.5;
			g.renderSprite("title",new Point(gamex,0),this.zIndex,new Point(0,3));
			
			boxArea(g,xpos+68,168,120,40);
			textArea(g,i18n("press_start"),xpos+84,184);
		} else if( this.page == 0 ) {
			//Option 68
			leftx = game.resolution.x*0.5 - 120*0.5;
			
			boxArea(g,leftx,8,120,224);
			textArea(g,"Settings",leftx+30,20);
			
			textArea(g,"Screen",leftx+16,40);
			textArea(g,(Settings.fullscreen?"Fullscreen":"Windowed"),leftx+20,52);
			
			textArea(g,"Guard Style",leftx+16,72);
			textArea(g,(_player.autoblock?"Automatic":"Manual"),leftx+20,84);
			
			textArea(g,"SFX Volume",leftx+16,104);
			//g.fillStyle = "#e45c10";
			g.color = [0.8,0.6,0.1,1.0];
			
			for(var i=0; i<Settings.sfxvolume*20; i++)
				g.scaleFillRect(leftx+20+i*4, 116, 3, 8 );
			
			textArea(g,"MUS Volume",leftx+16,136);
			g.color = [0.8,0.6,0.1,1.0];
			for(var i=0; i<Settings.musvolume*20; i++)
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
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			
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
			
			var regenTime = Math.round(
				((60*Game.DELTASECOND) / _player.speeds.manaRegen)*10
			)/10;
			
			textArea(g,"Damage",leftx+120,60);
			textArea(g,"Defence",leftx+120,60+28);
			textArea(g,"Stanima",leftx+120,60+56);
			textArea(g,"Speed",leftx+120,60+84);
			textArea(g,"MP Regen",leftx+120,60+112);
			
			textArea(g,""+_player.equip_weapon.baseDamage(_player),leftx+120,72);
			textArea(g,Math.floor(_player.damageReduction*100)+"%",leftx+120,72+28);
			textArea(g,""+_player.guard.lifeMax,leftx+120,72+56);
			textArea(g,PauseMenu.attackspeedToName(_player.attackProperties.warm),leftx+120,72+84);
			textArea(g,regenTime+"p/m",leftx+120,72+112);
		} else if ( this.page == 3 ) {
			//Unique Items
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Special Items",leftx+56,20);
			
			for(var i=0; i < _player.uniqueItems.length; i++){
				var y_pos = 46 + 20 * i;
				var item = _player.uniqueItems[i];
				var name = item.message;
				if(this.cursor == i){
					textArea(g,"@",leftx+16,y_pos);
				}
				g.renderSprite("items",new Point(leftx+40,y_pos+4),this.zIndex,item.frame);
				textArea(g,name,leftx+52,y_pos);
			}
		} else if ( this.page == 4 ){
			//Quests
			leftx = game.resolution.x*0.5 - 224*0.5;
			boxArea(g,leftx,8,224,152);
			boxArea(g,leftx,168,224,64);
			textArea(g,"Quests",leftx+88,20);
			
			var rangeTop = this.questscroll;
			var rangeBot = this.questscroll + PauseMenu.questScrollLimit;
			var y_pos = 12 * -this.questscroll;
			
			for(var i=0; i < this.questlist.length; i++){
				q = this.questlist[i];
				
				textArea(g,q.name,leftx+32,40+y_pos);
				
				if( i == this.cursor ){
					textArea(g,"@",leftx+16,40+y_pos);
				}
				
				if( q.complete ) {
					textArea(g,"@",leftx+16,40+y_pos);
				} else {
					if( i == this.cursor ){
						textArea(g,q.description,leftx+16,16+168,224-32);
					}
				}
				y_pos += 12;
			}
			
		}
	}
}

PauseMenu.prototype.fetchDoors = function(g,cursor,offset,limits){
	this.icons = new Array();
	var doors = game.getObjects(Door);
	var shops = game.getObjects(Shop);
	for(var i=0; i < doors.length; i++){
		if(doors[i].name.match(/(\d+)/)){
			var id = doors[i].name.match(/(\d+)/)[0] - 0;
			var x = Math.floor(doors[i].position.x/256) 
			var y = Math.floor(doors[i].position.y/240)
			this.icons.push({"x":x,"y":y,frame:new Point(8,id)});
		}
	}
	for(var i=0; i < shops.length; i++){
		var x = Math.floor(shops[i].position.x/256) 
		var y = Math.floor(shops[i].position.y/240)
		this.icons.push({"x":x,"y":y,frame:new Point(8,9)});
	}
}
PauseMenu.prototype.renderMap = function(g,cursor,offset,limits){
	try {
		var size = new Point(8,8);
		
		if(!this.icons){
			this.fetchDoors();
		}
		var mapstart = new Point(0,0);
		var mapwidth = Math.floor(game.map.width/16);
		var map = game.map.map;
		
		for(var i=0; i < map.length; i++ ){
			if( map[i] != undefined && this.map_reveal[i] > 0 )  {
				var tile = new Point(
					mapstart.x + (i%mapwidth ),
					mapstart.y + Math.floor(i/mapwidth )
				);
				var pos = new Point( 
					(mapstart.x*8) + (cursor.x*8) + (i%mapwidth ) * size.x, 
					(mapstart.y*8) + (cursor.y*8) + Math.floor(i/mapwidth ) * size.y 
				);
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					//"map".render(g,pos.add(offset),Math.abs(this.map[i])-1,(this.map_reveal[i]>=2?0:1));
					var xtile = Math.floor(map[i] / 16);
					var ytile = map[i] % 16;
					if( this.map_reveal[i] < 2 ) xtile += 4;
					g.renderSprite("map",pos.add(offset),this.zIndex,new Point(xtile,ytile));
					
					//Render icons
					if( this.map_reveal[i] >= 2 ) {
						for(var j=0; j < this.icons.length; j++ ){
							if( tile.x == this.icons[j].x && tile.y == this.icons[j].y ){
								g.renderSprite("map",pos.add(offset),this.zIndex,this.icons[j].frame);
							}
						}
					}
				}
			}
		}
		//Draw player
		var pos = new Point(
			1+cursor.x*8 + Math.floor(_player.position.x/256)*8, 
			(cursor.y*8) + Math.floor(_player.position.y/240)*8 -Math.abs(Math.sin(game.time*0.1)*2)
		);
		if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
			g.color = [1.0,0.0,0.0,1.0];
			g.renderSprite("map",pos.add(offset),this.zIndex+1,new Point(9,0),false);
		}
	} catch (err) {
		var r = 0;
	}
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
PauseMenu.attackspeedToName = function(speed){
	var n = i18n("speeds");
	if(speed > 20){
		return n[0];
	} else if (speed > 16){
		return n[1];
	} else if (speed > 12){
		return n[2];
	} else if (speed > 8){
		return n[3];
	} else {
		return n[4];
	}
}

 /* platformer\menu_title.js*/ 

TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = "title";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 1;
	
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
	
	//this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"introduction_help",
		"start_help"
	];
	
	/*
	if(localStorage.getItem("debug_map")){
		MapLoader.mapname = localStorage.getItem("debug_map")
	}
	*/
}

TitleMenu.prototype.update = function(){
	//if( this.progress == 0 ) audio.playAs("music_intro","music");
	
	if( this.page == 0 ){
		this.progress += this.delta / Game.DELTASECOND;
		if( this.progress > 52 ) this.progress = 9.0;
		if( input.state("pause") == 1 || input.state("fire") == 1 ) {
			if(this.progress > 9 && this.progress < 24){
				this.page = 1;
				this.cursor = 0;
			}else{
				this.progress = 10.0;
			}
		}
	} else if( this.page == 1 ) {
		this.progress = 10.0;
		if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				this.page = 2;
				audio.play("pause");
			} else if(this.cursor == 1){
				this.startGame(); 
			}
		}
	} else if( this.page == 2 ) {
		this.progress = 10.0;
		if( input.state("up") == 1 ) { this.cursor -= 1; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor += 1; audio.play("cursor"); }
		this.cursor = Math.max(Math.min(this.cursor,3),0);
		
		if(this.cursor == 1){
			if( input.state("left") == 1 ) { TitleMenu.level -= 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.level += 1; audio.play("cursor"); }
			TitleMenu.level = Math.max(Math.min(TitleMenu.level,50),1);
		}else if(this.cursor == 2){
			if( input.state("left") == 1 ) { TitleMenu.flight = !TitleMenu.flight; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.flight = !TitleMenu.flight; audio.play("cursor"); }
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				TitleMenu.mapname = game.prompt("Enter filename",TitleMenu.mapname, function(name){
					TitleMenu.mapname = name;
				});
				//localStorage.setItem("debug_map", MapLoader.mapname);
			} else if(this.cursor == 3){
				//Start in DEBUG mode
				audio.play("pause");
				
				var p = new Player(0,0);
				for(var i=1; i < TitleMenu.level; i++){
					p.addXP(p.nextLevel-p.experience);
				}
				
				game.loadMap(TitleMenu.mapname, function(starts){
					if(starts.length > 0 ){
						_player.position = new Point(starts[0].x,starts[0].y);
					} else {
						_player.position = new Point(48,176);
					}
					game.addObject(_player);
					game.addObject(new PauseMenu());
					game.addObject(new Background());
					
					_player.lightRadius = 240;
					if(TitleMenu.flight){ 
						_player.spellsCounters.flight = Game.DELTAYEAR;
					}
				})
				
			}
		}
	}
}

//Ӆ

TitleMenu.prototype.render = function(g,c){
	var xpos = (game.resolution.x - 427) * 0.5;
	
	var pan = Math.min(this.progress/8, 1.0);
	
	g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
	
	//Random twinkling stars
	for(var i=0; i<this.stars.length; i++) {
		var star = this.stars[i];
		var frame = 2;
		if( 
			this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
			this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
		) frame = 3;
			
		g.renderSprite("bullets",star.pos.add(new Point(xpos,0)),this.zIndex,new Point(frame,2));
		star.timer -= this.delta;
		if( star.timer <= 0 ){
			star.timer = Game.DELTASECOND * 1.0;
			star.pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
		}			
	}
	this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
	if( this.progress > this.stars.timer ) {
		this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
		this.stars.timer += this.stars.reset;
	}
	
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),this.zIndex,new Point(0,1));
	g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.title_position, 0, pan)),this.zIndex,new Point(0,0));
	
	textArea(g,"Copyright Pogames.uk 2016",8,4);
	textArea(g,"Version "+version,8,228);
}

TitleMenu.prototype.hudrender = function(g,c){
	if(this.page == 0){
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			boxArea(g,x_pos,168,120,40);
			textArea(g,i18n("press_start"),x_pos+16,184);
		}
	} else if(this.page == 1) {
		var x_pos = game.resolution.x * 0.5 - 192 * 0.5;
		boxArea(g,x_pos,32,192,88);
		textArea(g,i18n(this.options[this.cursor]),x_pos+16,48,160);
		
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		boxArea(g,x_pos,146,120,56);
		//textArea(g,i18n("introduction"),x_pos+24,162);
		textArea(g,"Debug",x_pos+24,162);
		textArea(g,i18n("new_game"),x_pos+24,178);
		
		g.renderSprite("text",new Point(x_pos+16,162+(16*this.cursor)),this.zIndex,new Point(15,5));
	} else if(this.page == 2){ 
		var x_pos = game.resolution.x * 0.5 - 200 * 0.5;
		boxArea(g,x_pos,16,200,208);
		textArea(g,"Map name",x_pos+32,48);
		textArea(g,"Level",x_pos+32,80);
		textArea(g,"Flight",x_pos+32,112);
		textArea(g,"Play",x_pos+32,144);
		
		textArea(g,"@",x_pos+16,48+32*this.cursor);
		
		textArea(g,""+TitleMenu.mapname,x_pos+32,48+12);
		textArea(g,""+TitleMenu.level,x_pos+32,80+12);
		textArea(g,""+TitleMenu.flight,x_pos+32,112+12);
	}
	
	if( this.progress >= 24 ) {
		var y_pos = Math.lerp(240,16, Math.min( (this.progress-24)/8, 1) );
		var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
		boxArea(g,0,y_pos-16,game.resolution.x,game.resolution.y);
		textArea(g,i18n("intro_text"),x_pos,y_pos,256,240);
	}	
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	
	if(this.cursor == 1) {
		this.start = true;
		audio.play("pause");
		WorldMap.newgame();
	} else { 
		audio.play("negative");
		//ga("send","event","start_intro");
		//dataManager.loadMap(game,_map_maps[0]);
		//audio.stop("music_intro");
	}
}
TitleMenu.mapname = "testmap.tmx";
TitleMenu.level = 1;
TitleMenu.flight = false;

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
	this.sprite = "tiles0";
	
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
		this.rigidbodyActive = true;
		this.preventPlatFormSnap = false;
		this.pushable = true;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				this.grounded = true;
				this._groundedTimer = 2;
			}
			if((this.force.y > 0 && dir > 0) || (this.force.y < 0 && dir < 0 )){
				this.force.y *= -this.bounce;
			}
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
		if(this.delta > 0 && this.rigidbodyActive){
			var inair = !this.grounded;
			this.force.y += this.gravity * this.delta;
			//Max speed 
			this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
			this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
			
			if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
			if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
			
			//Add just enough force to lock them to the ground
			if(this.grounded ) this.force.y += 1.0;
			
			//The timer prevents landing errors
			this._groundedTimer -= this.grounded ? 1 : 10;
			this.grounded = this._groundedTimer > 0;
			var limits = game.t_move( this, this.force.x * this.delta, this.force.y * this.delta );
			
			if(this.preventPlatFormSnap <= 0){
				if(this.grounded && limits[1] > this.position.y && limits[1] - this.position.y < 16 ){
					this.position.y = limits[1];
					this.trigger("collideVertical", 1);
				}
			}
			
			var friction_x = 1.0 - this.friction * this.delta;
			this.force.x *= friction_x;
			this.preventPlatFormSnap -= this.delta;
			
			if( inair && this.grounded ) {
				this.trigger("land");
			}
		}
	},
}

var mod_block = {
	'init' : function(){
		this.blockCollide = true;
		this.blockKillStuck = true;
		this.blockTopOnly = false;
		this.blockOnboard = new Array();
		this.blockPrevious = new Point(this.position.x, this.position.y);
		
		this.on("collideObject", function(obj){
			if(this.blockCollide && this.width > 0 && this.height > 0){
				if( obj.hasModule(mod_rigidbody) && this.blockOnboard.indexOf(obj) < 0 ) {
					var c = obj.corners();
					var d = this.corners();
					var fallspeed = Math.max(obj.force.y / obj.delta,4);
					if(!this.blockTopOnly && c.bottom > d.bottom && (c.right-1>d.left&&c.left+1<d.right)){
						//Below
						this.trigger("collideBottom", obj);
						
						var dif = obj.position.y - c.top;
						obj.position.y = d.bottom + dif;
						obj.trigger( "collideVertical", -1);
					} else if(!this.blockTopOnly && c.left < d.left && c.bottom-fallspeed > d.top){
						//left
						this.trigger("collideLeft", obj);
						
						var dif = c.right - obj.position.x;
						obj.position.x = d.left - dif;
						obj.trigger( "collideHorizontal", 1);
						if(d.top > c.top && obj.force.y > 0){
							obj.trigger("catchLedge", new Point(d.left-3, d.top), obj.flip, this);
						}
					} else if(!this.blockTopOnly && c.right > d.right && c.bottom-fallspeed > d.top){
						//right
						this.trigger("collideRight", obj);
						
						var dif = obj.position.x - c.left;
						obj.position.x = d.right + dif;
						obj.trigger( "collideHorizontal", -1);
						if(d.top > c.top && obj.force.y > 0){
							obj.trigger("catchLedge", new Point(d.right+3, d.top), obj.flip, this);
						}
					} else if(obj.force.y >= 0){
						//top
						this.trigger("collideTop", obj);
						
						var dif = c.bottom - obj.position.y;
						obj.position.y = 1 + (d.top - dif);
						obj.trigger( "collideVertical", 1);
						this.trigger("blockLand",obj);
						this.blockOnboard.push(obj);
						obj.preventPlatFormSnap = Game.DELTASECOND * 0.5;
					}
				}
			}
		});
	},
	'update' : function(){
		var change = this.position.subtract(this.blockPrevious);
		for(var i=0; i < this.blockOnboard.length; i++){
			var obj = this.blockOnboard[i];
			obj.position = obj.position.add(change);
		}
		this.blockOnboard = new Array();
		this.blockPrevious = new Point(this.position.x,this.position.y);
	}
}

var mod_camera = {
	'init' : function(){
		this.cameraLock = false;
		this.cameraYTween = false;
		this.camerShake = new Point();
		this.camera_target = new Point();
		this.camera_unlockTime = 0.0;
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
		
		var that = this;
		shakeCamera = function(duration,strength){
			if(duration instanceof Point){
				that.camerShake = duration;
			} else {
				strength = strength || 4;
				that.camerShake = new Point(duration,strength);
			}
		};
		
		this.camera_lock = function(){
			var mapwidth = Math.floor(game.map.width / 16);
			var map_index = (
				( Math.floor(this.position.x / 256) - 0 ) + 
				( Math.floor(this.position.y / 240) - 0 ) * mapwidth
			);
			
			var map_tile = game.map.map[map_index];
			
			if(map_tile != undefined){
				//If map tile is valid, change camera locks
				var lock;
				switch( Math.abs(map_tile) % 16 ){
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
				lock = lock.transpose( 
					Math.floor(this.position.x / 256)*256,  
					Math.floor(this.position.y / 240)*240 
				);
				return lock;
			}
		}
	},
	'update' : function(){
		game.camera.x = this.position.x - (game.resolution.x / 2);
		var yCenter = this.position.y - (game.resolution.y / 2);
		
		if(this.grounded || this.states.ledge){
			if(this.cameraYTween){
				game.camera.y = Math.lerp(game.camera.y, yCenter, this.delta * 0.3);
				this.camera_unlockTime -= this.delta;
				if(Math.abs(game.camera.y-yCenter) < 2 || this.camera_unlockTime <= 0){
					this.cameraYTween = false;
				}
			} else {
				game.camera.y = yCenter;
			}
		} else {
			this.camera_unlockTime = Game.DELTASECOND;
			this.cameraYTween = true;
			game.camera.y = Math.min(Math.max(
				game.camera.y,
				yCenter
				), yCenter + 72
			);
		}
		
		//Set up locks
		var lock = this.camera_lock();
		if( lock ) { this.cameraLock = lock; }
		
		if(this.cameraLock){
			game.camera.x = Math.min( Math.max( game.camera.x, this.cameraLock.start.x ), this.cameraLock.end.x - game.resolution.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this.cameraLock.start.y ), this.cameraLock.end.y - game.resolution.y );
			if( this.cameraLock.width() < game.resolution.x ){
				var excess = game.resolution.x - this.cameraLock.width();
				game.camera.x = this.cameraLock.start.x - excess * 0.5;
			}
		}
		
		if(this.camerShake.x > 0){
			game.camera.x += Math.floor((Math.random() * this.camerShake.y) - this.camerShake.y*0.5);
			game.camera.y += Math.floor((Math.random() * this.camerShake.y) - this.camerShake.y*0.5);
			this.camerShake.x -= game.deltaUnscaled;
		}
	},
	"postrender" : function(g,c){
		if(this.cameraLock){
			var viewWidth = this.cameraLock.width();
			if( viewWidth < game.resolution.x ){
				var excess = game.resolution.x - viewWidth;
				g.color = [0,0,0,1];
				g.scaleFillRect(0,0,excess*0.5, game.resolution.y);
				g.scaleFillRect(game.resolution.x-excess*0.5,0,excess*0.5, game.resolution.y);
			}
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.hurtable = true;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.criticalChance = 0.0;
		this.criticalMultiplier = 4.0;
		this.damage = 10;
		this.difficulty = 0;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = Game.DELTASECOND;
		this.combat_stuncount = 0;
		this.death_time = 0;
		this.dead = false;
		this._hurt_strobe = 0;
		this._death_clock = new Timer(Number.MAX_VALUE, Game.DELTASECOND * 0.25);
		this.damage_buffer = 0;
		this.buffer_damage = false;
		this._damage_buffer_timer = 0;
		this.xp_award = 0;
		this.showDamage = true;
		this._damageCounter = new EffectNumber(0,0,0);
		
		this.attackEffects = {
			"slow" : [0,10],
			"poison" : [0,10],
			"cursed" : [0,25],
			"weaken" : [0,30],
			"bleeding" : [0,30],
			"rage" : [0,30],
			"stun" : [0,30]
		};
		this.statusEffects = {
			"slow" : 0,
			"poison" : 0,
			"cursed" : 0,
			"weaken" : 0,
			"bleeding" : 0,
			"rage" : 0,
			"stun" : 0
		};
		this.statusResistance = {
			"slow" : 0.0,
			"poison" : 0.0,
			"cursed" : 0.0,
			"weaken" : 0.0,
			"bleeding" : 0.0,
			"rage" : 0.0,
			"stun" : 0.0
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
				if( hits[i].interactive && hits[i] != this && "life" in hits[i]) {
					this.trigger("struckTarget", hits[i], offset.center(), damage);
					
					var shield;
					if("guard" in hits[i] && hits[i].guard.active){
						shield = hits[i].shieldArea();
					}
					
					if(hits[i].hurtable != undefined && !hits[i].hurtable){
						audio.playLock("tink",0.3);
						this.trigger("blockOther", hits[i], offset.center(), 0);
					} else if( trigger == "hurt" && hits[i].hurt instanceof Function ) {
						hits[i].hurt(this, damage);
						out.push(hits[i]);
					} else if( shield != undefined && shield.overlaps(offset) ) {
						//blocked
						hits[i].trigger("block", this, offset.center(), damage);
						this.trigger("blockOther", hits[i], offset.center(), damage);
						/*
						if( hits[i].guard.invincible <= 0 ) {
							if( damage > hits[i].guard.life ) {
								//Break guard
								damage = Math.ceil(Math.max( damage - hits[i].guard.life, 0));
								hits[i].guard.life = 0;
								hits[i].trigger("guardbreak", this, offset.center(), damage);
								hits[i].hurt(this, damage);
							} else {
								//Blocked successfully
								hits[i].guard.life -= damage;
								hits[i].guard.invincible = Game.DELTASECOND * 0.3;
							}
						}*/
					} else {
						hits[i].trigger(trigger, this, offset.center(), damage);
						out.push(hits[i]);
					}
				}
			}
			
			return out;
		}
		this.shieldArea = function(){
			shield = new Line( 
				this.position.add( 
					new Point( 
						this.guard.x * (this.flip ? -1.0 : 1.0), 
						this.guard.y
					) 
				),
				this.position.add( 
					new Point( 
						(this.guard.x+this.guard.w) * (this.flip ? -1.0 : 1.0),
						this.guard.y+this.guard.h
					) 
				)
			);
			shield.correct();
			return shield;
		}
		this.isDead = function(){
			if( this.life <= 0 ){
				//Remove effects
				for(var i in this.statusEffects ){
					this.statusEffects[i] = -1;
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
				//Increment number of hits
				this.combat_stuncount++;
				this.trigger("stun", obj, damage, this.combat_stuncount);
				
				if( Math.random() < this.criticalChance ) {
					//Determine if its a critical shot
					damage *= this.criticalMultiplier;
					audio.play("critical");
					game.slow(0.1, Game.DELTASECOND * 0.5 );
					this.trigger("critical",obj,damage);
					game.addObject(new EffectCritical(this.position.x, this.position.y));
				}
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.ceil( this.damageReduction * damage ), 1 );
				
				if(damage > 0 && this.showDamage){
					this._damageCounter.value = Math.round(this._damageCounter.value + damage * 1);
					this._damageCounter.progress = 0.0;
					this._damageCounter.position.x = this.position.x;
					this._damageCounter.position.y = this.position.y - 16;
					if(this._damageCounter.sleep){
						game.addObject(this._damageCounter);
					}
					
				}
				
				if( this.buffer_damage ) 
					this.damage_buffer += damage;
				else
					this.life -= damage;
				
				this.invincible = this.invincible_time;
				//this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				this.isDead();
				obj.trigger("hurt_other",this,damage);
			}
		}
		this.calculateXP = function(scale){
			if(!(this instanceof Player) && !this.hasModule(mod_boss)){
				if(this.paletteSwaps instanceof Array && this.paletteSwaps.length > this.difficulty){
					this.filter = this.paletteSwaps[this.difficulty];
				} else {
					this.filter = "t"+this.difficulty;
				}
			}
			
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
		if(this.stun <= 0){
			this.combat_stuncount = 0;
		}
		
		this.deltaScale = this.statusEffects.slow > 0 ? 0.5 : 1.0;
		
		//Status Effects timers
		var interval = Game.DELTASECOND * 0.5;
		var j=0;
		for(var i in this.statusEffects ){
			if( this.statusEffects[i] > 0 ){
				//Combatant has status effect
				var previousTime = this.statusEffects[i];
				this.statusEffects[i] -= this.deltaUnscaled;
				if((this.statusEffects[i]%interval) > (previousTime%interval)){
					//Status effect tick
					if( i == "poison" ) {
						if( this instanceof Player ){
							if( this.life > 6 ) this.life -= 1;
						} else {
							this.life -= 3; 
							this.isDead(); 
						}
					}
					
					var effect;
					if(i == "stun"){
						effect = new EffectStatus(
							this.position.x-16+0.5*this.width,
							this.position.y-0.45*this.height
						);
					} else {
						effect = new EffectStatus(
							this.position.x+(Math.random()-.5)*this.width,
							this.position.y+(Math.random()-.5)*this.height
						);
					}
					effect.frame.x = j;
					game.addObject(effect);
				}
				if( i == "stun"){
					this.stun = 1.0;
				}
			}
			j++;
		}
		
		this._damage_buffer_timer -= this.deltaUnscaled;
		if( this.damage_buffer > 0 && this._damage_buffer_timer <= 0 ){
			this.life -= 1;
			this.damage_buffer -= 1;
			this._damage_buffer_timer = Game.DELTASECOND * 0.6;
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
		
		/*
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
		*/
		
		this.invincible -= this.deltaUnscaled;
		this.stun -= this.delta;
	},
	"postrender" : function(g,c){
		if(self.debug){
			if(this.guard.active){
				var shield = this.shieldArea();
				g.color = [0.2,0.3,1.0,1.0];
				g.scaleFillRect(
					shield.start.x - c.x,
					shield.start.y - c.y,
					shield.width(),shield.height()
				);
			}
			
			if(this.ttest instanceof Line){
				g.color = [0.8,0.0,0.0,1.0];
				g.scaleFillRect(
					this.ttest.start.x - c.x,
					this.ttest.start.y - c.y,
					this.ttest.width(),this.ttest.height()
				);
			}
		}
	}
}

var Combat = {
	"strike" : function(rect, ops){
		var offset = new Line( 
			this.position.add( new Point( rect.start.x * (this.flip ? -1.0 : 1.0), rect.start.y) ),
			this.position.add( new Point( rect.end.x * (this.flip ? -1.0 : 1.0), rect.end.y) )
		);
		
		offset.correct();
		var hits = game.overlaps(offset);
		for(var i=0; i < hits.length; i++){
			Combat.hit.apply(this, [hits[i], ops]);
		}
	},	
	"hit"  : function(obj, ops){
		ops = ops || {};
		var blockable = true;
		var damage = this.damage;
		var onidirectional = false;
		
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !blockable || !obj.hasModule(mod_combat) ) {
				obj.hurt( this, damage );
			} else {
				var flip = obj.flip ? -1:1;
				var shield = new Line(
					obj.position.x + (obj.guard.x) * flip,
					obj.position.y + (obj.guard.y),
					obj.position.x + (obj.guard.x + obj.guard.w) * flip,
					obj.position.y + (obj.guard.y + obj.guard.h)
				);
				
				if( obj.guard.active && (onidirectional||(this.flip!=obj.flip)) && shield.overlaps(this.bounds()) ){
					this.trigger("blocked",obj);
					obj.trigger("block",this,this.position,damage);
				} else {
					this.trigger("hurt_other",obj);
					obj.hurt( this, damage );
				}
				
			}
			this.trigger("struckTarget", obj);
		}
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
		
		var corner = new Point(256*Math.floor((x-16)/256), 240*Math.floor(y/240));
		this.boss_lock = new Line(
			corner.x,
			corner.y,
			512 + corner.x,
			240 + corner.y
		);
		
		this.reset_boss = function(){
			if(this.active){
				this.position.x = this.boss_starting_position.x;
				this.position.y = this.boss_starting_position.y;
				this.active = false;
				this.life = this.lifeMax;
				this.boss_intro = 0.0;
				
				_player.lock_overwrite = false;
				Trigger.activate("boss_door");
				Trigger.activate("boss_death");
			}
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 120 && Math.abs( dir.y ) < 64 ){
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
			Trigger.activate("boss_door");
			
			//for(var i=0; i < this.boss_doors.length; i++ ) 
			//	game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, window.BLANK_TILE);
			//_player.lock_overwrite = this.boss_lock;
			this.interactive = true;
		});
		this.on("death", function() {
			Trigger.activate("boss_door");
			
			//for(var i=0; i < this.boss_doors.length; i++ )
			//	game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, 0);
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
	"hudrender" : function(g,c){
		if( this.active && this.life > 0 ){
			var width = 160;
			var height = 8;
			var start = game.resolution.x * 0.5 - width * 0.5;
			var lifePercent = this.life / this.lifeMax;
			
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(start-1, game.resolution.y-25, width+2, height+2);
			g.color = [0.0,0.0,0.0,1.0];
			g.scaleFillRect(start, game.resolution.y-24, width, height);
			g.color = [1.0,0.0,0.0,1.0];
			g.scaleFillRect(start, game.resolution.y-24, width*lifePercent, height);
			
		}
		if( this.active && this.boss_intro < 1.0){
			this.boss_intro += game.deltaUnscaled / (Game.DELTASECOND * 3);
			g.color = [0.0,0.0,0.0,0.3];
			
			var slide = Math.min(Math.sin(Math.PI*this.boss_intro)*4, 1);
			var border = Math.min(Math.sin(Math.PI*this.boss_intro)*3, 1) * 64;
			g.scaleFillRect(0, 0, game.resolution.x, border);
			g.scaleFillRect(0, game.resolution.y-border, game.resolution.x, border);
			
			var porta = Point.lerp(new Point(-90,60), new Point(40,60), slide);
			var portb = Point.lerp(new Point(game.resolution.x+90,60), new Point(game.resolution.x-40,60), slide);
			
			g.renderSprite("bossface",porta,this.zIndex,new Point(1,0),false);
			g.renderSprite("bossface",portb,this.zIndex,new Point(this.bossface_frame,this.bossface_frame_row),true);
		}
	}
}

var mod_talk = {
	"init" : function(){
		this.open = 0;
		this.canOpen = true;
		this._talk_is_over = 0;
		
		this.close = function(){
			this.open = 0;
			DialogManger.dialogOpen = false;
			this.trigger("close");
		}
		
		this.talkMovePlayer = function(distance){
			var speed = 0.1;
			if(distance == undefined){
				distance = 40;
			}
			
			if(this.position.x > _player.position.x){
				this.flip = true;
				_player.flip = false;
				_player.position.x = Math.lerp(_player.position.x, this.position.x - distance, game.deltaUnscaled * speed);
			} else {
				this.flip = false;
				_player.flip = true;
				_player.position.x = Math.lerp(_player.position.x, this.position.x + distance, game.deltaUnscaled * speed);
			}
		}
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player ){
				this._talk_is_over = 2;
			}
		});
	},
	"update" : function(){
		if( !DialogManger.dialogOpen && this.canOpen && this.delta > 0 && this._talk_is_over > 0 && input.state("up") == 1 ){
			this.open = 1;
			DialogManger.dialogOpen = true;
			this.trigger("open");
		}
		this._talk_is_over--;
	},
	"render" : function(g,c){
		if( this.canOpen && this._talk_is_over > 0 && this.open < 1){
			var pos = _player.position.subtract(c);
			pos.y -= 24;
			g.renderSprite("text",pos,9999,new Point(4,6));
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

 /* platformer\npc.js*/ 

NPC.prototype = new GameObject();
NPC.prototype.constructor = GameObject;
function NPC(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.start_x = x;
	this.sprite = "characters";
	this.name = "";
	
	this.addModule(mod_talk);
	
	this.showmessage = false;
	this.lockplayer = true;
	
	this.script = new Array();
	this.scriptPos = 0;
	this.scriptReg = 0;
	this.scriptRun = false;
	this.scriptWait = 0.0;
	
	this.movements = new Array();
	
	o = o || {};
	if("script" in o){
		var s = o["script"];
		if(s.match(/\w+\.script/)){
			this.getScript(s);
		} else {
			this.script = NPC.compileScript(s);
		}
	}
	if("name" in o){
		this.name  = o["name"];
	}
	if("lockplayer" in o){
		this.lockplayer = o["lockplayer"] * 1;
	}
	
	this.on("open", function(){
		this.scriptRun = true;
		if(this.lockplayer){_player.pause = true;}
	});
	
	this.on("close", function(){
		if(this.lockplayer){_player.pause = false;}
	});
	this.on("activate", function(){
		if(!this.scriptRun){
			this.trigger("open");
		}
	});
	
	if("autorun" in o){
		this.trigger("open");
	}
	if("trigger" in o) {
		this._tid = o["trigger"];
	}
	
}

NPC.prototype.idle = function(){
	if(this.runScript){
		return true;
	} else{
		return GameObject.prototype.idle.apply(this);
	}
}
NPC.prototype.update = function(){
	
	for(var i=0; i<this.movements.length; i++){
		var obj = this.movements[i].object;
		var destination = this.movements[i].destination;
		var speed = this.movements[i].speed * this.delta;
		var direction = destination.subtract(obj.position);
		
		if(direction.magnitude() <= speed){
			obj.position = destination;
			this.movements.remove(i);
			i--;
		} else {
			obj.position = obj.position.add(direction.normalize(speed));
		}
	}
	
	if(this.scriptRun){
		while(this.runScript()){}
	}
}
NPC.prototype.hudrender = function(g,c){
	if(this.showmessage){
		DialogManger.render(g);
	}
}
NPC.prototype.runScript = function(filename){
	this.message = false;
	
	if(this.scriptPos >= this.script.length){
		//At the end of script, stop running it
		this.scriptRun = false;
		this.scriptPos = 0;
		this.close();
		return false;
	}
	
	var line = this.script[this.scriptPos];
	var command = line[0];
	
	if(command == "end"){
		this.scriptRun = false;
		this.scriptPos = 0;
		this.close();
		return false;
	} else if(command == "calc"){
		this.scriptReg = NPC.resolveCalculation(line.slice(1));
		this.scriptPos++;
		return true;
	}else if(command == "ifnotgoto"){
		if(this.scriptReg){
			this.scriptPos++;
		}else{
			this.scriptPos = NPC.resolveVariable(line[1]);
		}
		return true;
	}else if(command == "set"){
		NPC.variables[line[1]] = NPC.resolveCalculation(line[2]);
		this.scriptPos++;
		return true;
	}else if(command == "additem"){
		if(_player instanceof Player){
			var name = NPC.resolveCalculation(line[1]);
			var item = new Item(0,0,0,{"name":name});
			item.trigger("collideObject",_player);
		}
		this.scriptPos++;
		return true;
	}else if(command == "map"){
		var map = NPC.resolveCalculation(line[1]);
		var start;
		if(2 in line){
			start = NPC.resolveCalculation(line[2]);
		}
		WorldLocale.loadMap(map, start);
		
		//Loading new map, end script
		this.scriptRun = false;
		this.scriptPos = 0;
		this.close();
		return false;
	} else if(command == "trigger"){
		Trigger.activate(line[1]);
		this.scriptPos++;
		return true;
	}else if(command == "say"){
		var message = i18n(NPC.resolveVariable(line[1]));
		if(message instanceof Array){
			var index = NPC.resolveVariable(line[2]);
			if(line.length >= 2 && message.length > index){
				message = message[index];
			} else {
				message = message[0];
			}
		}
		DialogManger.set(message);
		this.showmessage = DialogManger.show;
		if(!this.showmessage){
			DialogManger.clear();
			this.scriptPos++;
		}
		return false;
	}else if(command == "tint"){
		var time = NPC.resolveCalculation(line[1]);
		if(this.scriptWait > 0){
			var speed = this.delta / (Game.DELTASECOND * time);
			Renderer.tint[0] = Math.lerp(Renderer.tint[0],NPC.resolveVariable(line[2]),speed);
			Renderer.tint[1] = Math.lerp(Renderer.tint[1],NPC.resolveVariable(line[3]),speed);
			Renderer.tint[2] = Math.lerp(Renderer.tint[2],NPC.resolveVariable(line[4]),speed);
			this.scriptWait -= this.delta;
			if(this.scriptWait <= 0){
				this.scriptPos++;
				return true;
			}
		}else{
			this.scriptWait = time * Game.DELTASECOND;
		}
		return false;
	}else if(command == "actor_frame"){ //ACTOR COMMANDS
		var obj = this.findNPC(line[1]);
		obj.frame = NPC.resolveCalculation(line[2]);
		obj.frame_row = NPC.resolveCalculation(line[3]);
		this.scriptPos++;
		return true;
	}else if(command == "actor_visible"){
		var obj = this.findNPC(line[1]);
		obj.visible = NPC.resolveCalculation(line[2]);
		this.scriptPos++;
		return true;
	}else if(command == "actor_location"){
		var obj = this.findNPC(line[1]);
		obj.position = new Point(NPC.resolveCalculation(line[2]), NPC.resolveCalculation(line[3]));
		this.scriptPos++;
		return true;
	}else if(command == "actor_move"){
		this.movements.push({
			"object" : this.findNPC(line[1]),
			"destination" : new Point(NPC.resolveCalculation(line[2]), NPC.resolveCalculation(line[3])),
			"speed" : NPC.resolveCalculation(line[4])
		});
		this.scriptPos++;
		return true;
	}else if(command == "actor_flip"){
		var obj = this.findNPC(line[1]);
		obj.flip = NPC.resolveCalculation(line[2]);
		this.scriptPos++;
		return true;
	}else if(command == "actor_sprite"){
		var obj = this.findNPC(line[1]);
		obj.sprite = NPC.resolveCalculation(line[2]);
		this.scriptPos++;
		return true;
	}else if(command == "wait"){ //WAIT COMMANDS
		if(this.scriptWait > 0){
			this.scriptWait -= this.delta;
			if(this.scriptWait <= 0){
				this.scriptPos++;
			}
		}else{
			this.scriptWait = NPC.resolveCalculation(line[1]) * Game.DELTASECOND;
		}
		return false;
	}else if(command == "wait_movements"){
		if(this.movements.length > 0){
			return false;
		} else {
			this.scriptPos++;
			return true;
		}
	}else if(command == "quest"){
		Quests.set(line[1],NPC.resolveCalculation(line[2]));
		this.scriptPos++;
		return true;
	} 
	
	//Command not found, go to next command
	this.scriptPos++;
	
	return false;
}
NPC.prototype.findNPC = function(name){
	if(name == "me"){
		return this;
	}
	if(name == "player"){
		return _player;
	}
	var npcs = game.getObjects(NPC);
	for(var i=0; i < npcs.length; i++){
		if(npcs[i].name == name){
			return npcs[i];
		}
	}
	return this;
}
NPC.resolveCalculation = function(calc){
	var operands = new Array();
	if(calc instanceof Array){
		for(var i=0; i < calc.length; i++){
			if(NPC.operators.indexOf(calc[i]) >= 0 ){
				var b = NPC.resolveVariable(operands.pop());
				var a = NPC.resolveVariable(operands.pop());
				if(calc[i] == "/"){
					operands.push(a/b);
				}else if (calc[i] == "*"){
					operands.push(a*b);
				}else if (calc[i] == "+"){
					operands.push(a+b);
				}else if (calc[i] == "-"){
					operands.push(a-b);
				}else if (calc[i] == "=="){
					operands.push(a==b);
				}else if (calc[i] == ">"){
					operands.push(a>b);
				}else if (calc[i] == "<"){
					operands.push(a<b);
				}
			}else{
				operands.push(calc[i]);
			}
		}
	} else {
		operands.push(calc);
	}
	return NPC.resolveVariable(operands.pop());
}
NPC.resolveVariable = function(varname){
	if(typeof varname == "number"){
		//number
		return varname;
	} else if(typeof varname =="boolean"){
		//boolean
		return varname;
	}else if(varname.trim().match(/^-?\d*\.?\d*$/)){
		//number as string
		return varname * 1;
	} else if(varname[0]=='"' && varname[varname.length-1]=='"'){
		//string
		return varname.slice(1,varname.length-1);
	} else if(varname.indexOf(".") >= 0){
		//special
		var prefix = varname.slice(0,varname.indexOf("."));
		var suffix = varname.slice(varname.indexOf(".")+1);
		if(prefix == "quest"){
			return Quests[suffix];
		}
	}
	else{
		//variable
		if(!(varname in NPC.variables)){
			NPC.variables[varname] = 0;
		}
		return NPC.variables[varname];
	}
}
NPC.prototype.getScript = function(filename){
	ajax("/scripts/"+filename,function(data){
		this.script = NPC.compileScript(data);
	},this);
}
NPC.compileScript = function(data){
	var lines = data.split("\n");
	var out = new Array();
	NPC.compileBlock(lines, out, 0, 0);
	return out;
}
NPC.compileBlock = function(lines, out, tabs, line){
	
	for(line; line < lines.length; line++){
		try{
			var tokens = NPC.unpackTokens(lines[line]);
			if(tokens instanceof Array){
				var tabcount = 0;
				while(lines[line][tabcount]=="\t"){
					tabcount++;
				}
				
				if(tabcount < tabs){
					//End of block
					return line;
				}else{
					tokens[0] = tokens[0].trim();
					
					if(tokens[0] == "if"){
						out.push(NPC.compileCalc(tokens.slice(1)));
						var current = out.length;
						out.push(["ifnotgoto", -1]);
						var end = NPC.compileBlock(lines, out, tabs+1, line+1);
						out[current][1] = out.length;
						line = end-1;
					}else{
						out.push(tokens);
					}
				}
			}
		} catch (err){
			console.error("Compile error at line "+line+": "+err);
			console.log(lines[line]);
		}
	}
	return line;
}
NPC.compileCalc = function(tokens){
	var o = ["calc"];
	var operators = new Array();
	
	for(var i=0; i < tokens.length; i++){
		if(NPC.operators.indexOf(tokens[i]) >= 0 ){
			while(operators.length > 0 && NPC.operators.indexOf(tokens[i]) > NPC.operators.indexOf(operators.peek())){
				o.push(operators.pop());
			}
			operators.push(tokens[i]);
		} else{
			o.push(tokens[i]);
		}
	}
	while(operators.length>0){
		o.push(operators.pop());
	}
	return o;
}
NPC.unpackTokens = function(line){
	var out = line.match(/\s*(\"[^\"]+\")|([A-Za-z0-9.+><_=-]+)/g);
	for(var i = 0; i < out.length; i++){
		out[i] = out[i].trim();
		if(out[i].match(/^-?\d*\.?\d*$/)){
			out[i] = out[i] * 1;
		}
	}
	return out;
}
NPC.set = function(name,value){NPC.variables[name] = value;}
NPC.get = function(name){if(name in NPC.variables){return NPC.variables[name];} return null; }

NPC.operators = ["/","*","+","-","==",">","<"];
NPC.variables = {};

 /* platformer\npc_chancellor.js*/ 

Chancellor.prototype = new GameObject();
Chancellor.prototype.constructor = GameObject;
function Chancellor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "characters2";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
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
		//Move player into position
		this.talkMovePlayer();
		
		if( Chancellor.introduction ) {
			if( input.state("fire") == 1 ) {
				this.text_progress++;
				if( this.text_progress >= this.text.length){
					this.close();
					Chancellor.introduction = false;
				}
			}
		} else {
			if( input.state("jump") == 1 || PauseMenu.open ) {
				this.close();
			} else if( input.state("fire") == 1 ) {
				//_world.town.money += this.money;
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
			this.frame.x = (this.frame.x + game.deltaUnscaled * 0.3) % 3;
			this.frame.y = 2;
		} else if( this.moneyMax > 99 ) {
			//Look disappointed
			this.frame.x = 4;
			this.frame.y = 2;
		} else {
			if( this.money > 10 ) {
				this.frame.x = 4;
				this.frame.y = 1;
			} else {
				this.frame.x = 0;
				this.frame.y = 1;				
			}
		}
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.125) % 4;
		this.frame.y = 1;
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

 /* platformer\npc_mayor.js*/ 

Mayor.prototype = new GameObject();
Mayor.prototype.constructor = GameObject;
function Mayor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y+8;
	this.sprite = "characters2";
	
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
	
	if( _world instanceof WorldMap ) {
		this.peopleFree = _world.town.people;
		
		for(var i in _world.town.buildings ){
			var building = _world.town.buildings[i];
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

 /* platformer\npc_shop.js*/ 

Shop.prototype = new GameObject();
Shop.prototype.constructor = GameObject;
function Shop(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "shops";
	this.width = 16;
	this.height = 32;
	this.zIndex = -1;
	this.life = 1;
	this.idleMargin = 72;
	
	this.keeperFrame = new Point(0,0);
	
	this.addModule(mod_talk);
	
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
}

Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( input.state("jump") == 1 || input.state("pause") == 1 || input.state("select") == 1){
			audio.playLock("unpause",0.3);
			this.close();
			game.pause = false;
		}
		
		if( input.state("right") == 1 ){
			this.cursor = Math.min(this.cursor+1, 2);
			audio.play("cursor"); 
		}
		if( input.state("left") == 1){
			this.cursor = Math.max(this.cursor-1, 0);
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1){
			this.purchase();
		}
	}
	
	/* animation */
	this.keeperFrame.x = (this.keeperFrame.x + this.delta * 0.2 ) % 3;
}
Shop.itemnames = ["seed_oriax", "seed_bear", "seed_malphas"];
Shop.itemposition = [new Point(-40,-80),new Point(-8,-80), new Point(24,-80)];
Shop.prototype.price = function(){
	var sales = NPC.get("shopsales");
	if(sales){
		return Math.round(Math.pow(sales * 20, 1.3)); 
	}
	return 20;
}
Shop.prototype.purchase = function(){
	var price = this.price();
	
	if( _player.money >= price ) {
		var itemname = Shop.itemnames[this.cursor];
		var itempos = Shop.itemposition[this.cursor].add(this.position);
		var item = new Item(itempos.x, itempos.y, false, {"name":itemname});
		item.addModule(mod_rigidbody);
		item.gravity = 1.0;
		item.interactive = true;
		_player.money -= price;
		audio.play("equip");
		
		game.addObject(item);
		
		var sales = NPC.get("shopsales") * 1;
		NPC.set("shopsales", sales + 1);
		
		return true;
	} else {
		audio.play("negative");
	}
	return false;
}

	
Shop.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite("retailers",this.position.subtract(c),this.zIndex+1,this.keeperFrame,false);
	
	for(var i=0; i < Shop.itemnames.length; i++){
		var itempos = Shop.itemposition[i].add(this.position);
		g.renderSprite("items", itempos.subtract(c), this.zIndex+1, new Point(i,4), false);
	}
}

Shop.prototype.postrender = function(g,c){	
	if( this.open > 0 ){		
		
		var p = Shop.itemposition[this.cursor].add(this.position).subtract(c);
		
		cursorArea(g, p.x-16,p.y-16,32,32);
		textArea(g, "$"+this.price(), p.x-16, p.y+24);
	}
}

 /* platformer\npc_smith.js*/ 

Smith.prototype = new GameObject();
Smith.prototype.constructor = GameObject;
function Smith(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "characters2";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("smith_intro");
	
	
	this.slackCooldown = Game.DELTASECOND * 3;
	
	this.weapons = new Array();
	this.cursor = new Point();
	this.columns = 8;
	this.rows = 0;
	
	this.on("open", function(){
		this.cursor = new Point();
		this.weapons = this.gatherWeapons();
		DialogManger.set(this.text);
		
		game.pause = true;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}

Smith.prototype.gatherWeapons = function(){
	var out = new Array();
	
	for(var i=0; i < Smith.weapons.length; i++){
		var name = Smith.weapons[i];
		var hasWeapon = NPC.get(name);
		if(hasWeapon){
			out.push( new Item(0,0,0,{"name" : name}));
		}
	}
	this.rows = Math.ceil(out.length / this.columns);
	return out;
}
Smith.prototype.cursorIndex = function(){
	return this.cursor.x+this.cursor.y*this.columns;
}
	
Smith.prototype.update = function(){
	if( this.open ) {
		//Move player into position
		this.talkMovePlayer();
		
		if( Smith.introduction ) {
			if(!DialogManger.show){
				Smith.introduction = false;
				this.close();
			}
		} else {
			if(input.state("left") == 1){
				this.cursor.x = Math.max(this.cursor.x-1,0);
				audio.play("cursor");
			}
			if(input.state("right") == 1){
				this.cursor.x = Math.min(this.cursor.x+1,this.columns-1);
				audio.play("cursor");
			}
			if(input.state("up") == 1){
				this.cursor.y = Math.max(this.cursor.y-1,0);
				audio.play("cursor");
			}
			if(input.state("down") == 1){
				this.cursor.y = Math.min(this.cursor.y+1,this.rows-1);
				audio.play("cursor");
			}
			
			if(this.cursorIndex() > this.weapons.length-1){
				//Out of range, set to last item
				this.cursor.x = (this.weapons.length-1) % this.columns;
				this.cursor.y = this.rows-1;
			}
			
			if(input.state("fire") == 1){
				var index = this.cursorIndex();
				var weapon = this.weapons[index];
				if(weapon.isWeapon){
					_player.equip(weapon, _player.equip_shield);
				} else if (weapon.isShield) {
					_player.equip(_player.equip_sword, weapon);
				}
				audio.play("equip");
			}
			
			if(input.state("jump") == 1 || PauseMenu.open){
				this.close();
			}
		}
	}
	
	//Animation
	if(this.slackCooldown <= 0){
		this.frame.x = this.frame.x + this.delta * 0.2;
		this.frame.y = 4;
		
		if(this.frame.x >= 3){
			this.slackCooldown = Game.DELTASECOND * 3;
			this.frame.x = 0;
			this.frame.y = 3;
		}
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.1) % 3;
		this.frame.y = 3;
		
		this.slackCooldown -= this.delta;
		if(this.slackCooldown <= 0){
			this.frame.x = 0;
			this.frame.y = 4;
		}
	}
}

Smith.prototype.hudrender = function(g,c){
	if( this.open ) {
		if( Smith.introduction ) {
			DialogManger.render(g);
		} else {
			var width = 224;
			var left = game.resolution.x / 2 - width * 0.5;
			var top = 24;
			
			boxArea(g,left,top,width,120);
			
			for(var i=0; i < this.weapons.length; i++){
				var item = this.weapons[i];
				var x = i % this.columns;
				var y = Math.floor(i / this.columns);
				
				g.renderSprite("items", new Point(24+left+x*24, 24+top+y*24), this.zIndex, item.frame, false);
			}
			
			cursorArea(g, 12+left+this.cursor.x*24, 12+top+this.cursor.y*24,24,24);
		}
	}
}
Smith.weapons = [
	"short_sword", "long_sword", "broad_sword", "spear", "warhammer",
	"small_shield", "large_shield", "kite_shield", "broad_shield", "knight_shield", "spiked_shield", "heavy_shield", "tower_shield"
];
Smith.introduction = true;

 /* platformer\phantom.js*/ 

Phantom.prototype = new GameObject();
Phantom.prototype.constructor = GameObject;
function Phantom(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "phantom";
	this.speed = 2.1;
	this.resetPosition = new Point(x,y);
	
	this.frame = 0;
	this.frame_row = 0;
	this.force = new Point(0,0);
	this.friction = 0.2;
	this.active = false;
	
	this.warmup = Game.DELTASECOND * 1.5;
	this.warmupTotal = Game.DELTASECOND * 0.7;
	
	o = o || {};
	
	this.on("player_death", function(){
		this.position.x = this.resetPosition.x;
		this.position.y = this.resetPosition.y;
		this.force = new Point();
		this.warmup = Game.DELTASECOND * 1.5;
		this.active = false;
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.invincible = -1;
			obj.hurt( this, 9999 );
		}
	});
	this.on("prayer", function(){
		var b = game.getObject(Background);
		if(b instanceof Background){
			b.darknessFunction = function(c){return 1;}
			b.ambience = [0.3,0.0,0.4];
		}
		
		Trigger.activate("ghost");
		Background.flash = [1,1,1,1];
		this.destroy();
	});
}
Phantom.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(!this.active){
		this.frame = (this.frame + this.delta * 0.2) % 4;
		this.frame_row = 2;
		if(Math.abs(dir.x) < 128 ){
			this.active = true;
		}
	} else if( this.warmup > 0 ){
		var progress = this.warmup / this.warmupTotal;
		if(progress > 1){
			this.frame = (this.frame + this.delta * 0.2) % 4;
			this.frame_row = 2;
		} else {
			shakeCamera(0.1,9);
			this.frame = (1-progress) * 4;
			this.frame_row = 3;
		}
		this.warmup -= this.delta;
	} else {
		shakeCamera(0.1,4);
		this.force = this.force.add(dir.normalize(-this.speed * this.delta));
		this.frame = Math.max((this.frame+this.delta)%4,2);
		this.frame_row = 1;
	}
	
	this.force.x *= 1 - (this.friction * this.delta);
	this.force.y *= 1 - (this.friction * this.delta);
	
	this.position = new Point(
		this.position.x + this.force.x * this.delta,
		this.position.y + this.force.y * this.delta
	);
	this.flip = dir.x > 0;
}

PhantomGrave.prototype = new GameObject();
PhantomGrave.prototype.constructor = GameObject;
function PhantomGrave(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.sprite = "phantomgraves";
	this.zIndex = -21;
	this.size = 180;
	this.show = true;
	
	this.frame = 0;
	this.frame_row = 0;
	
	o = o || {};
	if("index" in o){
		this.index = o.index * 1;
		this.frame = this.index % 3;
		this.frame_row = Math.floor(this.index / 3);
	}
	
	this.on("prayer", function(){
		Background.flash = [1,1,1,1];
		this.destroy();
	});
}
PhantomGrave.prototype.update = function(){
}
PhantomGrave.prototype.render = function(g,c){	
	GameObject.prototype.render.apply(this,[g,c]);
	Background.pushLight( this.position.subtract(c), this.width * 2 );
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
	this.width = 18;
	this.height = 30;
	this.zIndex = 10;
	this.checkpoint = new Point(x,y);
	
	this.keys = [];
	this.spells = [];
	this.spellCursor = 0;
	this.uniqueItems = [];
	this.charm = false;
	this.knockedout = false;
	this.pause = false;
	
	this.equip_weapon = new Weapon("short_sword");
	this.equip_sword = new Item(0,0,0,{"name":"short_sword","enchantChance":0});
	this.equip_shield = new Item(0,0,0,{"name":"small_shield","enchantChance":0});
	this.unique_item = false;
	
	
	
	_player = this;
	this.sprite = "player";
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.jump_strength = 8.0;
	this.lightRadius = 32.0;
	this.grabLedges = false;
	this.doubleJump = false;
	this.dodgeFlash = false;
	
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
		"rollCooldown" : 0.0,
		"effectTimer" : 0.0,
		"downStab" : false,
		"afterImage" : new Timer(0, Game.DELTASECOND * 0.125),
		"manaRegenTime" : 0.0,
		"ledge" : false,
		"ledgeObject" : null,
		"turn" : 0.0,
		"doubleJumpReady": true,
		"spellCounter" : 0.0
	};
	
	this.attackProperties = {
		"charge_start" : 0.2 * Game.DELTASECOND,
		"charge_end" : 0.5 * Game.DELTASECOND,
		"warm" : 8.5,
		"strike" : 8.5,
		"rest" : 5.0,
		"range" : 8.0,
		"sprite" : "sword1"
	};
	
	this.shieldProperties = {
		"duck" : 8.0,
		"stand" : -8.0,
		"frame_row" : 3
	};
	
	
	this.speeds = {
		"baseSpeed" : 1.25,
		"inertiaGrounded" : 0.4,
		"inertiaAir" : 0.2,
		"frictionGrounded" : 0.1,
		"frictionAir" : 0.05,
		"rollCooldown" : Game.DELTASECOND * 1.2,
		"jump" : 9.0,
		"airBoost" : 1.0,
		"airGlide" : 0.0,
		"breaks": 0.4,
		"manaRegen" : Game.DELTASECOND * 60,
		"turn" : Game.DELTASECOND * 0.5
	};
	
	this.weapon = {
		"frame" : new Point(0,0),
		"combo" : 0,
		"charge" : 0,
		"charge_ready" : false,
		"width" : 4
	};
	this.cape = {
		"active" : false,
		"frame" : 0,
		"frame_row" : 0,
		"sprite" : "cape1",
		"cape" : null,
		"flip" : this.flip
	}
	
	this.on("pre_death", function(){
		this.heal = 0;
		game.slow(0,this.death_time);
		//audio.stopAs("music");
	});
	this.on("death", function(){
		DemoThanks.deaths++;
		
		this.position.x = 128;
		this.position.y = 200;
		
		/*if( window._world instanceof WorldMap ){
			window._world.worldTick();
		}*/
		
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		PauseMenu.open = true;
		audio.play("playerdeath");
		this.destroy();
	});
	this.on("land", function(){
		//Land from a height
		this.states.doubleJumpReady = true;
		
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
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		//blocked
		var dir = this.position.subtract(obj.position);
		var kb = damage / 3.0;
		
		if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
		
		//obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.invincible > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("hurt", function(obj, damage){
		shakeCamera(Game.DELTASECOND*0.5,str);
		this.states.ledge = null;
		
		var str = Math.min(Math.max(Math.round(damage*0.1),1),6);
		var dir = this.position.subtract(obj.position);
		this.equip_weapon.cancel(this);
		
		var knockback = this.grounded ? 7 : 3;
		if(dir.x < 0){
			this.force.x = -knockback;
		}else{
			this.force.x = knockback;
		}
		if(this.stun_time > 0 ){
			this.states.spellCounter = 0.0;
			this.states.attack = 0;
			this.stun = this.stun_time;
			game.slow(0,5.0);
		}
		if(this.life > 0 && damage >= this.life){
			audio.play("deathwarning");
		}
		Background.flash = [0.6,0,0,1];
		audio.play("playerhurt");
	})
	this.on("struckTarget", function(obj, pos, damage){
		if( this.states.downStab && obj.hasModule(mod_combat)){
			this.states.downStab = false;
			this.force.y = -2;
			this.jump();
		}
	});
	this.on("hurt_other", function(obj, damage){
		var ls = Math.min(this.life_steal, 0.4);
		this.life = Math.min( this.life + Math.round(damage * ls), this.lifeMax );
		this.equip_weapon.hit(this,obj,damage);
		
		if( "life" in obj && obj.life <= 0 ) {
			//Glow after a kill
			this.states.afterImage.set(Game.DELTASECOND * 3);
		}
		
		if( !this.grounded && !this.states.downStab ) {
			//Add extra float
			this.force.y -= this.speeds.jump * this.speeds.airGlide;
		}
		
		//Charge kill explosion!
		if( this.equip_weapon.charge ){
			//A little shake
			shakeCamera(Game.DELTASECOND*0.1,5);
			
			if( obj.mass < 2.0 && obj.life <= 0 ) {
				//Send the enemy flying
				var dir = obj.position.subtract(this.position);
				game.slow(0.1, Game.DELTASECOND * 0.5);
				audio.playLock("explode3", 0.5);
				game.addObject( new ExplodingEnemy( 
					obj.position.x,
					obj.position.y,
					dir.add(new Point(0, -2)),
					{
						"damage" : this.equip_weapon.baseDamage(this) * 4,
						"sprite" : obj.sprite,
						"flip" : obj.flip,
						"frame" : obj.frame,
						"frame_row" : obj.frame_row
					}
				));
			}
		}
	});
	this.on("added", function(){
		this.damage_buffer = 0;
		this.lock_overwrite = false;
		this.checkpoint = new Point(this.position.x, this.position.y);
		this.force.x = this.force.y = 0;
		this.states.doubleJumpReady = true;
		
		game.camera.x = this.position.x-128;
		game.camera.y = Math.floor(this.position.y/240)*240;
		
		for(var i in this.spellsCounters ){
			this.spellsCounters[i] = 0;
		}
		
		/*
		if( dataManager.temple_instance ) {
			this.keys = dataManager.temple_instance.keys;
		} else {
			this.keys = new Array();
		}*/
	})
	this.on("downstabTarget", function(obj, damage){
		this.states.doubleJumpReady = true;
	});
	this.on("catchLedge", function(edge, flip, obj){
		if(this.grabLedges){
			this.states.doubleJumpReady = true;
			this.force.x = this.force.y = 0;
			if(flip){
				this.states.ledge = edge.add(new Point(this.width*0.5,this.height*0.5));
			} else {
				this.states.ledge = edge.add(new Point(this.width*-0.5,this.height*0.5));
			}
			this.states.ledgeObject = obj;
			if(this.states.ledgeObject){
				this.states.ledge = this.states.ledge.subtract(this.states.ledgeObject.position);
			}
		}
	});
	this.on("collideObject", function(obj){
		if( this.states.roll > 0  && this.dodgeFlash){
			if("hurt" in obj && obj.hurt instanceof Function){
				var damage = this.equip_weapon.baseDamage(this);
				obj.hurt(this, damage);
				this.doubleJumpReady = true;
			}
		}
	});
	this.on("dropLedge", function(){
		this.states.ledge = false;
		this.gravity = 1.0;
	});
	
	this._weapontimeout = 0;
	this.addModule( mod_rigidbody );
	this.addModule( mod_camera );
	this.addModule( mod_combat );
	
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"magic" : 1
	}
	
	this.life = 24;
	this.lifeMax = 24;
	this.mana = 24;
	this.manaMax = 24;
	this.money = 0;
	this.waystones = 0;
	this.heal = 0;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.stun_time = Game.DELTASECOND * 0.33333333;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = Game.DELTASECOND;
	this.autoblock = true;
	this.rollTime = Game.DELTASECOND * 0.75;
	this.dodgeTime = this.rollTime * 0.33333;
	
	this.superHurt = this.hurt;
	this.hurt = function(obj,damage){
		if(this.hasCharm("charm_soul") && this.mana > 0){
			if(this.invincible > 0 ) return;
			var manaReduction = (1 + this.stats.magic * 0.04);
			var manaEffective = Math.round(this.mana * manaReduction);
			
			if(manaEffective >= damage){
				this.mana = Math.max(this.mana - Math.floor(damage / manaReduction), 0);
				this.invincible = this.invincible_time;
				audio.play("spell");
				return;
			} else {
				this.mana = 0;
				damage -= manaEffective;
			}
		}
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
	
	/*
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
					if( objs[i].name.match(/coin_\d* /) ) objs[i].setName("waystone");
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
	*/
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
	if(this.pause) {
		this.force.x = 0;
		this.force.y = 0;
		return;
	}
	
	if(this.unique_item instanceof Item){
		if(!this.unique_item.use(this)){
			this.unique_item = false;
		}
	}
	
	//Reset states
	this.states.guard = false;
	this.states.downStab = false;
	
	this.buffer_damage = this.hasCharm("charm_elephant");
	
	this.states.manaRegenTime = Math.min(this.states.manaRegenTime-this.delta, this.speeds.manaRegen);
	if(this.states.manaRegenTime <= 0){
		this.mana = Math.min(this.mana + 1,this.manaMax );
		this.states.manaRegenTime = this.speeds.manaRegen;
	}
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana + 1, this.manaMax);
		this.manaHeal-= 1;
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
		this.life += 1;
		this.heal -= 1;
		this.damage_buffer = 0;
		game.slow(0.0,5.0);
		if( this.life >= this.lifeMax ){
			this.heal = 0;
			this.life = this.lifeMax;
		}
	}
	if ( this.life > 0 ) {
		var strafe = input.state('block') > 0;
		
		if( this.states.ledge){
			if(this.states.ledgeObject){
				this.position = this.states.ledgeObject.position.add(this.states.ledge);
			} else {
				this.position.x = this.states.ledge.x;
				this.position.y = this.states.ledge.y;
			}
			this.gravity = 0;
			if(game.t_unstick(this)){
				this.trigger("dropLedge");
			}
			if(input.state("jump") == 1){
				this.trigger("dropLedge");
				this.grounded = true;
				this.jump();
				if(input.state("right")>0) { this.force.x = 3; }
				if(input.state("left")>0) { this.force.x = -3; }
			}
			if(input.state("down") == 1){
				this.trigger("dropLedge");
			}
		} else if (this.stun > 0 ){
			//Try to escape stun effect
			if(
				input.state("left") == 1 ||
				input.state("right") == 1 ||
				input.state("fire") == 1 ||
				input.state("jump") == 1
			){
				this.statusEffects.stun -= 2.0;
				this.position.y -= 2;
			}
		} else if (this.states.spellCounter > 0){
			this.states.spellCounter -= this.delta;
			if(this.states.spellCounter <= 0){
				//Cast Spell
				this.castSpell();
			}
		} else if (this.knockedout > 0){
			//Do nothing
		} else if( this.states.roll > 0 ) {
			if(this.dodgeFlash){
				this.force.y -= (0.2 + this.gravity) * this.delta;
				this.force.x = (this.flip?-1:1) * 15;
			} else {
				this.force.x = (this.flip?-1:1) * 5;
			}
			this.states.roll -= this.delta;
			
			if( this.states.roll <= 0 ) {
				//End of roll
				this.force.x = Math.min(Math.max(this.force.x,-6),6);
			}
			
			//Create dust trail for roll
			if( this.states.effectTimer > Game.DELTASECOND / 16 ){
				this.states.effectTimer = 0;
				game.addObject( new EffectSmoke(
					this.position.x, this.position.y + 16, null, 
					{"frame":1, "speed":0.4,"time":Game.DELTASECOND*0.4}
				));
			}
		} else if( this.equip_weapon.time > 0 ){
			//Player in attack animation
			this.equip_weapon.update(this);
			
			if ( input.state('fire') == 1 ) { 
				//Let the player queue more attacks
				this.equip_weapon.attack(this); 
			}
			
			this.equip_weapon.strike(this);
			
			//Determine range and damage
		} else if( this.delta > 0) {
			//Player is in move/idle state
			
			this.states.guard = ( input.state('block') > 0 || this.autoblock );
			
			if(this.states.turn > 0){
				//Block disabled while turning
				this.states.guard = false;
			}
			
			if(input.state("select") == 1 && this.spells.length > 0){
				audio.play("equip");
				this.spellCursor = (this.spellCursor+1)%this.spells.length;
			}
			
			if( !this.states.duck ) {
				if ( input.state('left') > 0 ) { this.force.x -= this.deltaSpeed(); }
				if ( input.state('right') > 0 ) { this.force.x += this.deltaSpeed(); }
				
				//Come to a complete stop
				if ( input.state('right') <= 0 && input.state('left') <= 0 && this.grounded ) { 
					this.force.x -= this.force.x * Math.min(this.speeds.breaks*this.delta);
				}
			}
						
			if ( input.state("down") > 0 && !this.grounded) { 
				//Down spike
				this.states.downStab = true;
				this.states.guard = false;
				
			} else if ( input.state('fire') == 1 && input.state("up") > 0 ) { 
				//Cast Spell
				if(this.spells.length > 0){
					var spell = this.spells[this.spellCursor];
					this.states.spellCounter = spell.castTime;
				}
			} else if ( input.state('fire') == 1 ) { 
				this.equip_weapon.attack(this); 
			} else if ( input.state('fire') > 0 ) { 
			/*
				this.states.attack_charge += this.delta; 
				if( this.states.attack_charge >= this.attackProperties.charge_start){
					strafe = true;
				}
			*/
			} else {
				if(!this.grounded && this.force.y > 0){
					//Try to catch a ledge
					var forwardDir = this.flip?-1:1;
					if((forwardDir>0&&input.state("right")>0)||(forwardDir<0&&input.state("left")>0)){
						var forward = this.position.add(new Point(16*forwardDir,0));
						var bottom = forward.add(new Point(0,8));
						var tileTop = game.getTile(forward.add(new Point(0,-8)));
						var tileBot = game.getTile(bottom);
						var under = game.getTile(this.position.add(new Point(0,20)));
						
						if(under == 0 && tileTop<=0 && tileBot > 0 && !(tileBot in tilerules.currentrule())){
							//Edge grabbed
							var edge = new Point(
								this.flip ? (Math.ceil(bottom.x/16) * 16)+4 : (Math.floor(bottom.x/16) * 16)-4,
								(Math.floor(bottom.y/16) * 16) - 1
							);
							this.trigger("catchLedge", edge, this.flip);
						}
					}
				}
			/*
				this.states.charge_multiplier = false;
				
				//Release charge if it has built up
				if( this.states.attack_charge > this.attackProperties.charge_end ){
					this.states.charge_multiplier = true;
					this.attack();
					strafe = true;
					if( !this.states.duck ) {
						this.force.x = 5.0 * (this.flip ? -1.0 : 1.0);
					}
				}
				this.states.attack_charge = 0; 
			*/
			}
			
			
			//Apply jump boost
			if( this.spellsCounters.flight > 0 ) {
				this.gravity = 0.2;
				if ( input.state('down') > 0 ) { this.force.y += this.delta * 1.55; }
				if ( input.state('jump') > 0 ) { this.force.y -= this.delta * 1.65; }
			} else { 
				this.gravity = 1.0; 
				if ( input.state('jump') > 0 && !this.grounded ) { 
					
					if( this.force.y > 0 ) {
						this.force.y -= this.speeds.airBoost * this.speeds.airGlide * this.delta;
					}
				
					if( this.jump_boost ) {
						var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
						this.force.y -= this.gravity * boost * this.delta; 
					}
				} else {
					this.jump_boost = false;
				}
			}
			
			if ( input.state('block') <= 0 && input.state('jump') == 1 ) { 
				if(this.grounded || (this.states.doubleJumpReady && this.doubleJump)){
					this.jump(); 
				}
			}
			if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
				this.duck(); 
			} else { 
				this.stand(); 
			}
			
			if ( input.state("dodge") > 0 && this.states.rollCooldown <= 0 ) {
				//Dodge roll
				if(this.dodgeFlash){
					this.states.roll = this.invincible = this.dodgeTime;
					this.force.y = 0;
					this.position.y -= 1;
					this.grounded = false;
				} else if(this.grounded){
					this.states.roll = this.invincible = this.rollTime;
				}
				this.states.rollCooldown = this.speeds.rollCooldown;
			} else if (strafe) {
				//Limit speed and face current direction
				this.force.x = Math.min( Math.max( this.force.x, -2), 2);
				
			} else {
				//Change to face player's selected direction
				if ( input.state('left') > 0 ) { 
					if(!this.flip) this.states.turn = this.speeds.turn;
					this.flip = true; 
				}
				if ( input.state('right') > 0 ) { 
					if(this.flip) this.states.turn = this.speeds.turn;
					this.flip = false;
				}
			}
			
			//Prep roll
			this.states.rollPressCounter -= this.delta;
			if( input.state('left') == 1 || input.state('right') == 1 ){
				this.states.rollDirection = 1.0;
				this.states.rollPressCounter = Game.DELTASECOND * 0.25;
				if( input.state('left') ) this.states.rollDirection = -1.0;
			}
			
		}
		
		this.states.doubleJumpReady = this.states.doubleJumpReady || this.grounded;
		this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
		this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
		this.height = this.states.duck ? 24 : 30;
		
		
		if ( this.states.downStab ) {
			this.equip_weapon.downstab(this);
		}
	}
	//Shield
	this.states.guard_down = this.states.duck;
	this.guard.active = this.states.guard;
	this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.knockedout ){
		this.frame.x = 10;
		this.frame.y = 1;
	} else if ( this.stun > 0 || this.life < 0 ) {
		//Stunned
		this.stand();
		this.frame.x = 10;
		this.frame.y = 1;
	} else if( this.states.ledge ) {
		this.frame.x = 0;
		this.frame.y = 6;
	} else if( this.states.spellCounter > 0 ) {
		this.frame.x = (1 - Math.min(this.states.spellCounter / Game.DELTASECOND, 1)) * 8;
		this.frame.y = 7;
	} else if( this.states.roll > 0 ) {
		this.frame.y = 2;
		this.frame.x = 6 * (1 - this.states.roll / this.rollTime);
	} else if( this.states.downStab ){
		if(this.frame.x > 2) this.frame.x = 0;
		this.frame.x = Math.min(this.frame.x + this.delta * 0.2,2);
		this.frame.y = 3; 
	} else {
		if(this.equip_weapon.time > 0){
			//Attack
			this.equip_weapon.animate(this);
		} else if( !this.grounded ) {
			//In air
			if(!this.states.doubleJumpReady){
				this.frame.y = 2;
				this.frame.x = Math.max(1,(this.frame.x + this.delta * 0.3)%5);
			} else {
				this.frame.y = 2;
				if(this.force.y < 0.5){
					this.frame.x = 6;
				} else if(this.force.y > 2.0){
					this.frame.x = 8;
				} else {
					this.frame.x = 7;
				}
			}
		} else if( this.states.duck ) {
			//Duck
			this.frame.x = Math.max(Math.min(this.frame.x + this.delta * 0.4,10),8);
			this.frame.y = 0;
			
			if( this.states.attack > 0 ) this.frame.x = 4;
			if( this.states.attack > this.attackProperties.rest ) this.frame.x = 6;
			if( this.states.attack > this.attackProperties.strike ) this.frame.x = 5;		
		} else {
			if( this.states.attack_charge > this.attackProperties.charge_start || this.states.attack > 0 ) this.frame.y = 2;
			if(this.states.turn > 0){
				//Turn animation
				this.frame.y = 3;
				this.frame.x = 3 + 6 * (1-this.states.turn/this.speeds.turn);
			} else if( Math.abs( this.force.x ) > 0.1 && this.grounded ) {
				//Run animation
				this.frame.y = 1;
				this.frame.x = (this.frame.x + this.delta * 0.1 * Math.abs( this.force.x )) % 10;
			} else {
				//Idle
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 8;
			}
		}
		
		//if( this.states.attack_charge > this.attackProperties.charge_start ) this.frame.x = 0;
	}
	
	//Animation Sword
	if(this.equip_weapon.time > 0){
		this.weapon.frame.x = this.frame.x;
		this.weapon.frame.y = this.frame.y;
	} else if (this.states.downStab) {
		this.weapon.frame.x = 5;
		this.weapon.frame.y = 0;
	} else if( this.states.attack_charge > 0 ){ 
		this.weapon.frame.x = 0;
		this.weapon.frame.y = 2;
	} else { 
		this.weapon.frame.x = this.frame.x;
		this.weapon.frame.y = this.frame.y;
	}
	
	//Animation Cape
	if( this.cape.active ) {
		if( this.flip != this.cape.flip ){
			this.cape.flip = this.flip;
			this.cape.frame_row = 4;
			this.cape.frame.x = 0;
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
	this.states.rollCooldown -= this.delta;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
	}
	this.states.effectTimer += this.delta;
	this.states.turn -= this.delta;
	
	if( this.states.afterImage.status(this.delta) ){
		game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
	}
}
Player.prototype.deltaSpeed = function(){
	var speed = this.speeds.baseSpeed;
	if( this.spellsCounters.haste > 0 ) speed *= 1.6;
	return this.inertia * this.delta;
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
		this.states.turn = 0.0;
		if( this.grounded )	this.force.x = 0;
		this.frame.x = 0;
	}
}
Player.prototype.jump = function(){ 
	if(this.states.duck){
		//Fall through floor
		var standingTile = game.getTile(
			this.position.x,
			this.position.y + 2 + _player.height * .5
		);
		if(standingTile in tilerules.currentrule() && tilerules.currentrule()[standingTile] == tilerules.onewayup){
			this.grounded = false; 
			this.position.y += 2;
			return;
		}
	}
	if(!this.grounded){
		this.states.airSpin = true;
		this.states.doubleJumpReady = false;
	}
	
	var force = this.speeds.jump;
	
	if( this.spellsCounters.flight > 0 ) force = 2;
	
	this.force.y = -force; 
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
				this.weapon.combo = (this.weapon.combo + 1) % 2;
			} else {
				//Reset combo
				this.weapon.combo = 0;
			}
		} else {
			this.weapon.combo = 2;
		}
		this.weapon.width = this.weapon.combo == 2 ? 18 : 4;
		this.states.attack = this.attackProperties.warm;
	}
}
Player.prototype.castSpell = function(name){
	if(this.spells.length > 0){
		this.spellCursor = Math.max(Math.min(this.spellCursor, this.spells.length-1),0);
		var spell = this.spells[this.spellCursor];
		var cost = spell.cast(this);
		this.mana = Math.max(this.mana - cost, 0);
	}
}
Player.prototype.addUniqueItem = function(item){
	if(!(item instanceof Item)){
		return;
	}
	for(var i=0; i < this.uniqueItems.length; i++){
		if(item.name == this.uniqueItems.name){
			return;
		}
	}
	this.uniqueItems.push(item);
}

Player.prototype.equipSpell = function(s){
	this.spellCursor = this.spells.length;
	this.spells.push(s);
	
	s.trigger("equip");
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
			NPC.set(sword.name, 1);
			this.equip_weapon = new Weapon(sword.name);
		} else {
			throw "No valid weapon";
		}
		
		//Shields
		if( shield != null ) {
			if( "stats" in shield){
				NPC.set(shield.name, 1);
				
				this.attackProperties.warm *= shield.stats.speed;
				this.attackProperties.strike *= shield.stats.speed;
				this.attackProperties.rest *= shield.stats.speed;
				this.shieldProperties.duck = -12.0 + (15 - (shield.stats.height/2));
				this.shieldProperties.stand = -12.0;
				this.guard.x = 0;
				this.guard.w = 28;
				this.guard.lifeMax = shield.stats.guardlife;
				this.guard.life = this.guard.lifeMax;
				this.guard.h = shield.stats.height;
				this.speeds.turn = shield.stats.turn * Game.DELTASECOND;
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
			//game.addObject( this.equip_sword );
		}
		
		//Drop old shield
		if( this.equip_shield != undefined && this.equip_shield != shield ){
			this.equip_shield.trigger("unequip",this);
			this.equip_shield.sleep = Game.DELTASECOND * 2;
			this.equip_shield.position.x = this.position.x;
			this.equip_shield.position.y = this.position.y;
			//game.addObject( this.equip_shield );
		}
		
		if( this.equip_sword != sword && sword instanceof Item ) sword.trigger("equip", this);
		if( this.equip_shield != shield && shield instanceof Item ) shield.trigger("equip", this);
		
		this.equip_sword = sword;
		this.equip_shield = shield;
		
		//Calculate damage and defence
		var att_bonus = 0;
		var def_bonus = 0;
		var tec_bonus = 0;
		var mag_bonus = 0;
		if( this.equip_sword instanceof Item ){
			att_bonus += (this.equip_sword.bonus_att || 0);
			def_bonus += (this.equip_sword.bonus_def || 0);
			tec_bonus += (this.equip_sword.bonus_tec || 0);
			mag_bonus += (this.equip_sword.bonus_tec || 0);
		}
		if( this.equip_shield instanceof Item ){
			att_bonus += (this.equip_shield.bonus_att || 0);
			def_bonus += (this.equip_shield.bonus_def || 0);
			tec_bonus += (this.equip_shield.bonus_tec || 0);
			mag_bonus += (this.equip_shield.bonus_tec || 0);
		}
		
		var att = Math.max( Math.min( att_bonus + this.stats.attack - 1, 19), 0 );
		var def = Math.max( Math.min( def_bonus + this.stats.defence - 1, 19), 0 );
		var tech = Math.max( Math.min( tec_bonus + this.stats.technique - 1, 19), 0 );
		var magic = Math.max( Math.min( mag_bonus + this.stats.magic - 1, 19), 0 );
		
		//this.guard.lifeMax += 3 * def + tech;
		//this.guard.restore = 0.4 + tech * 0.05;
		
		this.damage = 5 + att * 3 + Math.floor(tech*0.5);
		this.damageReduction = (def-Math.pow(def*0.15,2))*.071;
		this.attackProperties.rest = Math.max( this.attackProperties.rest - tech*1.4, 0);
		this.attackProperties.strike = Math.max( this.attackProperties.strike - tech*1.4, 3.5);
		this.attackProperties.warm = Math.max( this.attackProperties.warm - tech*1.8, this.attackProperties.strike);
		this.speeds.manaRegen = Game.DELTASECOND * (10 - magic * (9/19));
		
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
	DemoThanks.kills++;
	
	return;
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
		
		if(Math.random() < 0.1){
			var treasure = Item.randomTreasure(Math.random(),[],{"locked":true});
			//dataManager.itemUnlock(treasure.name);
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
Player.prototype.respawn = function(g,c){
	var keys = this.keys;
	this.life = this.lifeMax;
	this.mana = this.manaMax;
	this.position.x = this.checkpoint.x;
	this.position.y = this.checkpoint.y;
	this.interactive = true;
	this.lock_overwrite = false;
	game.addObject(this);
	this.keys = keys;
	//audio.playAs(audio.alias["music"],"music");
	try{ 
		game.pause = false;
		PauseMenu.open = false; 
	} catch(err){}
}
Player.prototype.render = function(g,c){	
	/*
	if(this.trot == undefined)this.trot = new Point(0,0);
	if(input.state("left")==1) this.trot.x -= 1;
	if(input.state("right")==1) this.trot.x += 1;
	if(input.state("up")==1) this.trot.y -= 1;
	if(input.state("down")==1) this.trot.y += 1;
	this.frame.x = this.trot.x;
	this.frame.y = this.trot.y;
	*/
	
	//Render player
	if( this.states.roll <= 0 ){
		//Spell effects
		if( this.spellsCounters.flight > 0 ){
			var wings_offset = new Point((this.flip?8:-8),0);
			var wings_frame = 3-(this.spellsCounters.flight*0.2)%3;
			if( this.grounded ) wings_frame = 0;
			g.renderSprite("magic_effects",this.position.subtract(c).add(wings_offset),this.zIndex, new Point(wings_frame, 0), this.flip);
		}
		if( this.spellsCounters.magic_armour > 0 ){
			this.sprite.render(g,this.position.subtract(c),this.frame.x, this.frame.y, this.flip, "enchanted");
		}
		
		//adjust for ledge offset
		if(_player.states.ledge){
			g.renderSprite(
				this.sprite,
				this.position.subtract(c).add(new Point(0,19)),
				this.zIndex,
				this.frame,
				this.flip,
				{"shader":this.filter}
			);
		} else {
			GameObject.prototype.render.apply(this,[g,c]);
		}
		
		
		//Render caps
		if( this.cape.active ) {
			this.cape.sprite.render(g, this.position.subtract(c), this.cape.frame, this.cape.frame_row, this.flip, this.filter);
		}
	} else {
		//When rolling, ignore flip and shader
		if(this.dodgeFlash){
			var flashLength = Math.max(1 - this.states.roll/this.dodgeTime,0) * 96;
			g.color = [1,1,1,1];
			g.scaleFillRect(
				(this.position.x - (this.flip?0:flashLength)) - c.x,
				(this.position.y - 6) - c.y,
				flashLength,
				12
			);
		}
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, this.force.x < 0);
	}
	
	if( this.spellsCounters.thorns > 0 ){
		g.renderSprite("magic_effects",this.position.subtract(c),this.zIndex, new Point(3, 0), this.flip);
	}
	
	//Render shield after player if active
	//this.rendershield(g,c);
	
	//Render current sword
	if(this.states.roll <= 0){
		try{
			var _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
			var rotation = _t.r;
			var sposition = _t.p;
			var zPlus = _t.z;
			var effect = _t.v;
			var shield = _t.s;
			
			if(this.flip){
				sposition = new Point(sposition.x*-1,sposition.y);
			}
			
			g.renderSprite("swordtest", this.position.subtract(c).add(sposition), this.zIndex+zPlus, this.equip_sword.stats.sprite, false, {
				"rotate" : (this.flip ? -1 : 1) * rotation
			});
			if(effect instanceof Point){
				g.renderSprite("swordeffect", this.position.subtract(c), this.zIndex+2, effect, this.flip);
			}
			if(shield instanceof Point){
				var shieldFrames = new Point(Math.abs(shield.y), this.shieldProperties.frame_row);
				var shieldFlip = shield.y < 0 ? !this.flip : this.flip;
				var shieldOffset = new Point(
					(this.flip?-1:1)*shield.x, 
					Math.floor(this.guard.y+_player.guard.h*0.5)
				);
				g.renderSprite(
					"shields", 
					this.position.subtract(c).add(shieldOffset), 
					this.zIndex+1, 
					shieldFrames, 
					shieldFlip
				);
			}
		}catch(e){}
	}
	
	//Charge effect
	var chargeProgress = this.equip_weapon.chargeTime.time - Game.DELTASECOND*0.5;
	if( chargeProgress > 0 ) {
		var effectPos = new Point(this.position.x, this.position.y - 16);
		EffectList.charge(g, effectPos.subtract(c), chargeProgress);
	}
	
	//Strike effect
	if( this.states.attack < this.attackProperties.strike && this.states.attack > this.attackProperties.rest ){
		//var spos = new Point(this.attackProperties.range,0);
		var spos = new Point(24,-2);
		var slength = 5;
		if(this.attackProperties.range > 20 ) slength = 6;
		if(this.attackProperties.range > 28 ) slength = 7;
		var progress = (this.states.attack - this.attackProperties.rest) / (this.attackProperties.strike - this.attackProperties.rest);
		var sframe = Math.trunc(2 - (progress*3));
		if(this.flip) spos.x *= -1;
		if(this.states.duck) spos.y = 4;
		"bullets".render(g,this.position.add(spos).subtract(c),sframe,slength,this.flip);
	}
}

Player.prototype.hudrender = function(g,c){
	/* Render HP */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,7,(this.lifeMax)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,this.lifeMax,8);
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(8,8,Math.max(this.life,0),8);
	
	/* Render Buffered Damage */
	if(this.life > 0){
		g.color = [0.65,0.0625,0.0,1.0];
		var buffer_start = Math.max( 8 + (this.lifeMax-this.damage_buffer), 8)
		g.scaleFillRect(
			Math.max(this.life,0)+8,
			8,
			-Math.min(this.damage_buffer,this.life),
			8
		);
	}
	
	/* Render Mana */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,19,this.manaMax+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,20,this.manaMax,2);
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(8,20,this.mana,2);
	
	/* Render XP */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(7,25,24+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(8,26,24,2);
	g.color = [1.0,1.0,1.0,1.0];
	var rollprogress = Math.min(1 - (this.states.rollCooldown / this.speeds.rollCooldown), 1);
	g.scaleFillRect(8,26,Math.floor( rollprogress*24 ),2);
	//g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*24 ),2);
	
	textArea(g,"$"+this.money,8, 228 );
	//textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 ){
		textArea(g,"Press Start",8, 32 );
	}
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		g.renderSprite("items", 
			new Point((game.resolution.x-33)+i*4, 40),
			this.zIndex,
			this.keys[i].frame,
			false 
		);
	}
	
	var item_pos = 20 + Math.max(this.lifeMax, this.manaMax);
	//item hud
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-item_pos,-15));
		item_pos += 20;
	}
	if(this.spells.length > 0){
		var spell = this.spells[this.spellCursor];
		spell.position.x = spell.position.y = 0;
		spell.render(g,new Point(-item_pos,-15));
		item_pos += 20;
	}
	
	//Create light
	Background.pushLight( this.position, this.lightRadius );
}

var playerSwordPosition = {
		0 : {
			0 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			1 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			2 : {p:new Point(-17,-2),s:new Point(20,2),r:0,z:1,v:0},
			3 : {p:new Point(-17,-3),s:new Point(20,2),r:0,z:1,v:0},
			4 : {p:new Point(-17,-3),s:new Point(20,2),r:0,z:1,v:0},
			5 : {p:new Point(-17,-2),s:new Point(20,2),r:0,z:1,v:0},
			6 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			7 : {p:new Point(-17,-1),s:new Point(20,2),r:0,z:1,v:0},
			8 : {p:new Point(-17,-5),s:new Point(20,2),r:0,z:1,v:0},
			9 : {p:new Point(-15,5),s:new Point(19,2),r:-5,z:1,v:0},
			10 : {p:new Point(-14,4),s:new Point(18,2),r:-80,z:1,v:0},
		},
		1 : {
			0 : {p:new Point(-9,1),s:new Point(20,0),r:-110,z:1,v:0},
			1 : {p:new Point(-9,1),s:new Point(20,0),r:-100,z:1,v:0},
			2 : {p:new Point(-10,2),s:new Point(20,1),r:-90,z:1,v:0},
			3 : {p:new Point(-11,4),s:new Point(20,1),r:-100,z:1,v:0},
			4 : {p:new Point(-12,1),s:new Point(20,2),r:-110,z:1,v:0},
			5 : {p:new Point(-12,0),s:new Point(20,2),r:-110,z:1,v:0},
			6 : {p:new Point(-12,3),s:new Point(20,1),r:-100,z:1,v:0},
			7 : {p:new Point(-12,4),s:new Point(20,1),r:-90,z:1,v:0},
			8 : {p:new Point(-12,3),s:new Point(20,1),r:-100,z:1,v:0},
			9 : {p:new Point(-12,5),s:new Point(20,0),r:-110,z:1,v:0},
			10 : {p:new Point(-16,0),r:114,z:1,v:0},
		},
		2 : {
			6 : {p:new Point(-13,-2),s:new Point(20,2),r:-10,z:1,v:0},
			7 : {p:new Point(-13,-3),s:new Point(20,2),r:0,z:1,v:0},
			8 : {p:new Point(-13,-7),s:new Point(20,2),r:0,z:1,v:0},
			9 : {p:new Point(-13,-4),s:new Point(20,2),r:0,z:1,v:0},
		},
		3 : {
			0 : {p:new Point(-12,-24),r:60,z:1,v:0},
			1 : {p:new Point(2,1),r:180,z:1,v:0},
			2 : {p:new Point(2,2),r:180,z:1,v:0},
			
			3 : {p:new Point(14,1),s:new Point(-20,-2),r:100,z:1,v:0},
			4 : {p:new Point(16,-1),s:new Point(-16,-3),r:70,z:1,v:0},
			5 : {p:new Point(6,-1),s:new Point(-8,-3),r:0,z:-1,v:0},
			6 : {p:new Point(-6,1),s:new Point(0,4),r:0,z:-1,v:0},
			7 : {p:new Point(-19,4),s:new Point(8,3),r:30,z:1,v:0},
			8 : {p:new Point(-18,-1),s:new Point(16,2),r:-10,z:1,v:0},
		},
		4 : {
			0 : {p:new Point(-14,0),r:-80,z:1,v:new Point(0,0)},
			1 : {p:new Point(16,-6),r:70,z:1,v:new Point(1,0)},
			2 : {p:new Point(12,-6),r:-45,z:-1,v:new Point(2,0)},
			3 : {p:new Point(12,-6),r:-50,z:-1,v:0},
			4 : {p:new Point(12,-6),r:-45,z:-1,v:0},
			5 : {p:new Point(-24,2),r:-60,z:1,v:new Point(0,1)},
			6 : {p:new Point(-21,-1),r:-60,z:1,v:new Point(1,1)},
			7 : {p:new Point(-23,0),r:-10,z:1,v:new Point(2,1)},
			8 : {p:new Point(21,-4),r:90,z:-1,v:new Point(0,4)},
			9 : {p:new Point(20,-4),r:90,z:-1,v:new Point(1,4)},
			10 : {p:new Point(20,-4),r:90,z:-1,v:0}
		},
		5 : {
			0 : {p:new Point(-16,1),r:-45,z:1,v:0},
			1 : {p:new Point(-16,2),r:-90,z:1,v:0},
			2 : {p:new Point(15,-2),r:90,z:1,v:new Point(0,2)},
			3 : {p:new Point(12,-6),r:45,z:-1,v:new Point(1,2)},
			4 : {p:new Point(6,-6),r:45,z:-1,v:new Point(2,2)},
			5 : {p:new Point(14,-2),r:50,z:-1,v:new Point(3,2)},
			6 : {p:new Point(16,4),r:60,z:1,v:0},
		},
		8 : {
			0 : {p:new Point(-15,-2),r:-10,z:1,v:0},
			1 : {p:new Point(-14,-5),r:-45,z:1,v:0},
			2 : {p:new Point(-15,-2),r:-140,z:1,v:0},
			3 : {p:new Point(12,-6),r:45,z:-1,v:new Point(0,3)},
			4 : {p:new Point(-4,5),r:220,z:-1,v:new Point(1,3)},
			5 : {p:new Point(9,2),r:110,z:1,v:0},
			6 : {p:new Point(-20,-1),r:60,z:1,v:0},
		},
		9 : {
			0 : {p:new Point(-16,5),r:-80,z:1,v:0},
			1 : {p:new Point(-20,2),r:45,z:1,v:0},
			2 : {p:new Point(-20,2),r:90,z:1,v:0},
			3 : {p:new Point(21,1),r:90,z:-1,v:new Point(0,5)},
			4 : {p:new Point(17,2),r:90,z:-1,v:new Point(1,5)},
			5 : {p:new Point(-20,1),r:55,z:1,v:0}
		}
	}

 /* platformer\prisoner.js*/ 

Prisoner.prototype = new GameObject();
Prisoner.prototype.constructor = GameObject;
function Prisoner(x,y,n,options){
	this.constructor();
	this.sprite = "prisoner";
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

 /* platformer\pusher.js*/ 

Pusher.prototype = new GameObject();
Pusher.prototype.constructor = GameObject;
function Pusher(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 1;
	this.position.x = x - d[0]*0.5;
	this.position.y = y + d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.force = new Point();
	
	this.active = 1;
	
	this.on("activate",function(obj){
		this.active = !this.active;
	});
	
	this.on("collideObject", function(obj){
		if(this.active){
			if( obj.hasModule(mod_rigidbody) ) {
				obj.position.x += this.force.x * this.delta;
				obj.position.y += this.force.y * this.delta;
			}
		}
	});
	
	ops = ops || {};
	
	if("active" in ops){
		this.active = ops["active"] * 1;
	}
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("forcex" in ops){
		this.force.x = ops["forcex"] * 1;
	}
	if("forcey" in ops){
		this.force.y = ops["forcey"] * 1;
	}
}

 /* platformer\randomtemple.js*/ 

function RandomTemple(templeid) {
	this.templeId = Math.max(Math.min(templeid,RandomTemple.temples.length),0);
	this.slices = new Array();
	this.settings = RandomTemple.temples[this.templeId];
	
	this.tiles = new Array();
	this.mapTiles = new Array();
	this.tileDimension = new Line();
	this.mapDimension = new Line();
	this.objects = new Array();
	this.persistantObjects = new Array();
	this.seed = null;
	this.playerStart = new Point(64,176);
	
	RandomTemple.test = this;
}

RandomTemple.test = null;
RandomTemple.currentTemple = 0;

RandomTemple.temples = [
	{"tiles":"tiles2","size":10,"maxkeys":1,"treasures":1,"difficulty":0},
	{"tiles":"tiles3","size":11,"maxkeys":2,"treasures":1,"difficulty":1},
	{"tiles":"tiles2","size":12,"maxkeys":2,"treasures":1,"difficulty":2},
	{"tiles":"tiles5","size":10,"maxkeys":3,"treasures":1,"difficulty":3},
	{"tiles":"tiles4","size":11,"maxkeys":1,"treasures":1,"difficulty":3},
	{"tiles":"tilesintro","size":12,"maxkeys":3,"treasures":2,"difficulty":3},
];

RandomTemple.rules = {
	"start": function(){ return [[this.roomFromTags(["entry"]),1,0]]; 
	},
	"final" : function(level,options,cursor){ 
		if(level==options.size) return this.roomsFromTags(["entry_final"]);
		if(level==0) return this.roomsFromTags(["exit_w","exit_e"]);
		if(level==1) return this.roomsFromTags(["boss"]);
		if(level==2) return this.roomsFromTags(["walk"]);
		if(level==3) return this.roomsFromTags(["door"]);
		var shop_id = this.roomFromTags(["shop"]);
		if(this.seed.randomBool(1.1-(level/options.size)) && this.slices.peek().filter({"room":shop_id}).length <= 0 ) return [shop_id];
		if(this.seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
		return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
	},
	"main" : function(level,options,cursor){ 
		if(level==options.size) return this.roomsFromTags(["entry"]);
		if(level==0) return this.roomsFromTags(["exit_w","exit_e"]);
		if(level==1) return this.roomsFromTags(["boss"]);
		if(level==2) return this.roomsFromTags(["door"]);
		var shop_id = this.roomFromTags(["shop"]);
		if(this.seed.randomBool(1.1-(level/options.size)) && this.slices.peek().filter({"room":shop_id}).length <= 0 ) return [shop_id];
		if(this.seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
		return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
	},
	"item" : function(level,options,cursor){
		//if(level==options.size) return this.roomsFromTags(["entry"]);
		if(level==0) return this.roomsFromTags(["item_w","item_e"]);
		if(level==1) return this.roomsFromTags(["miniboss"]);
		if("optional" in options && this.seed.randomBool(0.4)) return this.roomsFromTags(["optional"]);
		if(this.seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
		return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
	},
	"prison" : function(level,options){
		if(level==0) return this.roomsFromTags(["prison_w","prison_e"], options);
		return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
	},
	"loop" : function(level,options){
		return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
	}
};

RandomTemple.prototype.generate = function(s){
	var success = false;
	
	RandomTemple.currentTemple = this.templeId;
	
	s = s || "" + Math.random();
	s = "00.10545453918166459";
	this.seed = new Seed( s );
	
	while( !success ) {
		//Refresh room counts
		for(var i=0; i < window._map_rooms.length; i++){
			if( !("remaining" in window._map_rooms[i]) ) {
				window._map_rooms.remaining = 9999;
			}
		}
		
		this.key_counter = 0;
		this.shop_counter = 0;
		this.branch_counter = 0;	
		this.objects = new Array();
		this.items = new Array();
		
		this.slices = [new MapSlice()];
		
		var options = {
			"rules":(this.templeId == 4 ? RandomTemple.rules.final : RandomTemple.rules.main),
			"size":this.settings.size
		}
		
		success = this.addRoom(options,this.settings.size, new Point(3,0));
		//success = this.addRoom(options,1,1, new Point(0,0));
		
		
		if( this.slices.peek().entrancesCount() > 0) {
			//Add a branch for a map
			var map_size = Math.floor(1+this.seed.random()*3);			
			this.addBranch({"rules":RandomTemple.rules.item,"item":"map","doors":0.0,"size":map_size}, map_size, this.slices.peek().getEntrances());
			this.addBranch({"rules":RandomTemple.rules.prison}, Math.floor(1+this.seed.random()*3), this.slices.peek().getEntrances());
			
			var size = this.seed.randomInt(2,6);
			for(var i=0; i<this.settings.treasures; i++){
				this.addBranch({"rules":RandomTemple.rules.item,"optional":true,"doors":0.5,"size":size}, size, this.slices.peek().getEntrances());
			}
			
			console.log("Added secret? " + this.addSecret({"item":"life_up"}) );
			console.log("Add well? " + this.addWell(this.slices.peek().filter({"height":1,"width":1,"rarity":0.001})) );
			
		} else {
			console.error("Seriously? No junctions? Try that again.");
			success = false;
		}
		
	}
	
	this.build(this.slices.peek());
}

RandomTemple.prototype.build = function(slice){
	
	//Everything is okay, build the level
	var width = 256;
	var height = 240;
	this.objects = new Array();
	this.items = new Array();
	
	
	this.temple_instance = false;
	/*
	if( "instance" in _world.temples[this.templeId] ) {
		//Get existing temple instance
		this.temple_instance = _world.temples[this.templeId].instance;
	}*/
	
	//Establish the level size and build tile matrix
	this.mapDimension = slice.size();
	this.tileDimension = this.mapDimension.scale(16,15);
	
	this.tiles = [
		new Array( ~~this.tileDimension.area() ),
		new Array( ~~this.tileDimension.area() ),
		new Array( ~~this.tileDimension.area() )
	];
	this.mapTiles = new Array( Math.floor( this.mapDimension.area() ) );
	
	for(var i in slice.data){
		try{
			var room_options = {};
			var pos = MapSlice.idToLoc(i);
			var map_index = Math.floor( pos.x - this.mapDimension.start.x + (pos.y - this.mapDimension.start.y) * this.mapDimension.width() );
			var secret = slice.data[i].secret ? -1 : 1;
			
			//if( mapTiles[ map_index ] == undefined )
			//	mapTiles[ map_index ] = secret;
			
			var room_slice = slice.data[i];
			/*
			var room;
			
			if ( room_slice.room >= 0 ) { 
				room = _map_rooms[ room_slice.room ];
			} else { 
				room = null;
			}
			
			room_options["id"] = i;
			room_options["entrances"] = new Array();
			for(var ent in room_slice.entrances ){
				if( room_slice.entrances[ent] ){
					room_options["entrances"].push( MapSlice.idToLoc(ent) );
				}
			}
			*/
			
			if( room_slice ) {
				var cursor = new Point(pos.x * width, pos.y * height );
				this.createRoom(room_slice,cursor,room_options);
			}
		} catch (err){
			console.error("Cannot create room at: " +i+"... "+err);
		}
	}
	
	//Process map tiles, merge straigh lines
	var entrances = this.slices.peek().getUsedEntrances();
	for(var i=0; i < entrances.length; i++){
		var x = entrances[i].x;
		var y = entrances[i].y;
		var mapIndex = (x - this.mapDimension.start.x) + (y - this.mapDimension.start.y) * this.mapDimension.width();
		var tileA = this.mapTiles[mapIndex-1];
		var tileB = this.mapTiles[mapIndex];
		
		if(
			(tileA%16==4 || tileA%16==6) &&
			(tileB%16==4 || tileB%16==5)
		){
			//Merge rooms
			this.mapTiles[mapIndex-1] = tileA + 1;
			this.mapTiles[mapIndex] = tileB + 2;
		} else {
			//Add doorway
			if(tileA%2 < 1){
				this.mapTiles[mapIndex-1] |= 32;
			}
			if(tileB%4 < 2){
				this.mapTiles[mapIndex] |= 16;
			}
		}
	}
}

RandomTemple.prototype.use = function(g){
	var temple_instance = false;
	Spawn.difficulty = this.settings.difficulty;
	g.clearAll();
	
	g.tiles = this.tiles;
	g.tileDimension = this.tileDimension;
	g.bounds = g.tileDimension.scale(16,16);
	
	for(var i=0; i < this.objects.length; i++){
		try{
			var obj = this.objects[i];
			g.addObject( new window[obj[3]](
					obj[0], obj[1],
					obj[2], obj[4]
				)
			);
			g.addObject(obj);
		}catch(err){
			console.error("Cannot create object: "+err)
		}
	}
	
	if( temple_instance ) {
		//pm.map_reveal = this.temple_instance.map;
		_player.keys = temple_instance.keys;
		for(var i=0; i<temple_instance.items.length; i++) {
			g.addObject(this.temple_instance.items[i]);
		}
		for(var i=0; i<temple_instance.shops.length; i++) {
			g.addObject(this.temple_instance.shops[i]);
		}
	}else{
		for(var i=0; i < this.persistantObjects.length; i++){
			try{
				var obj = this.persistantObjects[i];
				g.addObject( new window[obj[3]](
						obj[0], obj[1],
						obj[2], obj[4]
					)
				);
				g.addObject(obj);
			}catch(err){
				console.error("Cannot create object: "+err)
			}
		}
	}
	
	if(_player instanceof Player){
		_player.position.x = this.playerStart.x;
		_player.position.y = this.playerStart.y;
	} else {
		new Player(this.playerStart.x, this.playerStart.y);
	}
	
	var pm = new PauseMenu();
	pm.mapDimension = this.mapDimension;
	pm.map = this.mapTiles;
	
	g.addObject(_player);
	g.addObject(pm);
	g.addObject(new Background());
	
	g.tileSprite = "tiles7";
}

RandomTemple.prototype.createRoom = function(room_slice,cursor,room_options){
	var layers = ["far","back","front"];
	var persistant = ["Item","Shop","Alter","Arena"];
	
	if ( room_slice.room >= 0 ) { 
		var room = _map_rooms[ room_slice.room ];
	} else { 
		return;
	}
	
	var room_options = {};
	//room_options["id"] = i;
	room_options["entrances"] = new Array();
	for(var ent in room_slice.entrances ){
		if( room_slice.entrances[ent] ){
			room_options["entrances"].push( MapSlice.idToLoc(ent) );
		}
	}
	
	var width = ("width" in room_slice) ? room_slice.width : 1;
	var height = ("height" in room_slice) ? room_slice.height : 1;
	
	var ts = 16;
	room_options = room_options || {};
	var room_size = room_options.room_size || 16;
	
	//Render tiles
	var tileCursor = cursor.scale(1/ts);
	for(var j=0; j < layers.length; j++ ) {
		if( layers[j] in room ) {
			var layer = room[layers[j]];
			var rs = room_size;
			if( layer instanceof Function ) layer = layer.apply(room, [this.seed, width, height, room_options]);
			
			for(var i=0; i < layer.length; i++){
				var x = Math.floor( i % ( room_size * width ) );
				var y = Math.floor( i / ( room_size * width ) );
				var offset = Math.floor( 
					Math.floor( (x-this.tileDimension.start.x) + tileCursor.x ) + 
					Math.floor( ((y-this.tileDimension.start.y) + tileCursor.y ) * this.tileDimension.width() )
				);
				this.tiles[j][offset] = layer[i];
			}
		}
	}
	
	//Map
	var mapCursor = new Point(Math.floor(cursor.x/256),Math.floor(cursor.y/240));
	for(var w=0; w < width; w++) for(var h=0; h < height; h++){
		var index = Math.floor(
			(mapCursor.x+(w-this.mapDimension.start.x)) + 
			(mapCursor.y+(h-this.mapDimension.start.y)) * this.mapDimension.width()
		);
		var tileY = 0;
		if("map" in room){
			var mIndex = w + h * width;
			tileY = PauseMenu.convertTileDataToMapData(room["map"])[mIndex];
		}else{
			if( h > 0) tileY += 8;
			if( h >= height-1) tileY += 4;
			if( w > 0) tileY += 2;
			if( w < width-1) tileY += 1;
			
		}
		this.mapTiles[index] = tileY;
	}
	
	//Add objects
	if("objects" in room ) for(var j=0; j < room.objects.length; j++){
		try{
			var obj = room.objects[j];
			var x = cursor.x + obj[0];
			var y = cursor.y + obj[1];
			//var dim = new Point(obj[2][0],obj[2][1]);
			var dim = obj[2];
			var objectName = obj[3];
			var properties = {};
			var addObject = true;
			
			//copy properties
			for(var p in obj[4]){
				properties[p] = obj[4][p];
			}
			
			var props = {};
			try{
				var id = room_options.id;
				props = room_slice.properties;
			} catch (err) {}
			
			if( "min_temple" in properties && this.templeId < properties["min_temple"]-0 ) addObject = false;
			if( "max_temple" in properties && this.templeId > properties["max_temple"]-0 ) addObject = false;
			if( "rarity" in properties && this.seed.random() > properties["rarity"]-0 ) addObject = false;		
			
			if( addObject ){
				var newobj = [
					x,
					y,
					dim,
					objectName,
					properties
				];
				if(persistant.indexOf(objectName) >= 0){
					//These objects do no spawn on second visit
					if(objectName == "Item"){
						if( "item" in props && props.item != undefined ) {
							properties["name"] = props.item;
						}else{
							var treasure = this.randomTreasure(Math.random(),["treasure"]);
							properties["name"] = treasure.name;
						}
					}
					this.persistantObjects.push(newobj);
				} else if( objectName == "Player" ) {
					//Special rules for player
					this.playerStart.x = x;
					this.playerStart.y = y;
				} else {
					if ( objectName == "Door" && "door" in props){
						properties["name"] = props["door"];
					}
					this.objects.push(newobj);
				}
			}
		} catch (err){
			console.error("Cannot create object. " + err);
			console.log(obj);
		}
	}
}

RandomTemple.prototype.randomKey = function(oddsOfReuse){
	var max_keys = this.settings.maxkeys;
	var out = 0;
	
	if( this.slices.peek().keys > 0 && (this.seed.randomBool(oddsOfReuse) || this.slices.peek().keys < max_keys) ) {
		out = Math.floor( this.seed.random() * this.slices.peek().keys );
	} else {
		out = this.slices.peek().keys;
		this.slices.peek().keys++;
	}
	return out;
}
RandomTemple.prototype.randomExistingKey = function(){
	var keys = this.existingKeys();
	var key = keys[ Math.floor( keys.length * this.seed.random()) ];
	return key.match(/\d+$/)[0] - 0;
}

RandomTemple.prototype.existingKeys = function(){
	var out = [];
	for(var i in this.properties_matrix){
		if( "item" in this.properties_matrix[i] && this.properties_matrix[i].item != undefined ){
			if( this.properties_matrix[i]["item"].match(/^key_\d+$/) ) {
				out.push( this.properties_matrix[i]["item"] );
			}
		}
	}
	return out;
}
RandomTemple.prototype.existingKeysIndex = function(){
	var keys = this.existingKeys();
	var out = new Array();
	for(var i=0; i < keys.length; i++ ){
		try{
			out.push( keys[0].match(/\d+$/)[0] - 0 );
		} catch (err) {}
	}
	return out;
}

RandomTemple.prototype.keysRemaining = function(){
	return this.settings.maxkeys - this.key_counter;
}
RandomTemple.prototype.getJunctionRoomIndex = function(tags){
	var out = [];
	var dir = ["n","e","s","w"];
	for( var i=0; i < _map_junctions.length; i++ ) {
		var intersect = tags.intersection(_map_junctions[i].type);
		if(intersect.length == tags.length && intersect.length == _map_junctions[i].type.length ){
			out.push(i);
		}
	}
	return out[0];
}
RandomTemple.prototype.addBranch = function(options, level, entrances){
	
	entrances = this.seed.shuffle(entrances);
	var bid = this.slices.length;
	
	for( var i=0; i < entrances.length; i++ ) {
		var entrance = entrances[i];
		var pos = MapSlice.idToLoc(entrance);
		
		//Create new slice
		this.slices.push( this.slices.peek().clone() ); 
		
		if( this.addRoom(options, level, entrance) ){
			this.slices.peek().useEntrance(entrance);
			console.log("Branch added");
			return true;
		} else {
			this.revertSlice(bid);
		}
	}
	return false;
}

RandomTemple.prototype.addSecret = function(options){
	var locations = this.seed.shuffle(this.slices.peek().roomIds());
	
	var directions = [1,-1];
	var banlist = [0,1,2];
	
	for(var i=0; i < locations.length; i++){
		if( banlist.indexOf( this.slices.peek().data[locations[i]].room ) < 0 ){
			this.seed.shuffle(directions);
			
			for(var j=0; j<directions.length; j++){
				var tag = directions[j] > 0 ? "secret_w" : "secret_e";
				var room_id = this.roomFromTags([tag]);
				var room = _map_rooms[ room_id ];
				
				var pos = MapSlice.idToLoc(locations[i]);
				pos.x += directions[j];
				var id = MapSlice.locToId(pos);
			
				if( this.slices.peek().isFree(pos, 1, directions[j]) ){
					options = options || {};
					this.slices.peek().add(id,room_id,options);
					this.slices.peek().setSecret(id,true);
					return true;
				}
			}
		}
	}
	return false;
}

RandomTemple.testslice = new Array();
RandomTemple.prototype.addRoom = function(options, level, cursor){
	//List of rooms to try
	var r = options.rules.apply(this,[level,options,cursor]);
	RandomTemple.testslice.push(this.slices.peek().clone());
	//Scramble order
	this.seed.shuffle(r);
	
	var success = false;
	
	for(var j = 0; j < r.length; j++ ) {
		//Go through rooms until one fits
		var room_id = r[j];
		var room = _map_rooms[ room_id ];
		
		var temp_properties = {};
		if( "item" in options ) {
			temp_properties["item"] = options["item"];
		}
		
		var entrances = [ [0,0],[room.width,0]];
		if("entrances" in room){
			if(room["entrances"] instanceof Function){
				var rw = room.width;
				var rh = room.height || 1;
				entrances = room["entrances"](rw,rh);
			} else {
				entrances = room["entrances"];
			}
		}
		
	
		//if( this.isFree( room, new_direction, cursor ) ) {
		for(var ent=0; ent < entrances.length; ent++ ){
			var entrance = new Point(entrances[ent][0], entrances[ent][1]);
			var cursorEnter = cursor.subtract(entrance);
			
			if( this.isFree( room, cursorEnter ) ) {
				success = true;
				var bid = false;
				
				this.slices.peek().add(cursorEnter,room,temp_properties);
				this.slices.peek().useEntrance(cursorEnter,entrance);
				
				if("secret" in options) this.slices.peek().setSecret(cursor,options.secret);
				
				var max_keys = this.settings.maxkeys;
				if( "key_required" in room ){
					var randomKey = this.slices.peek().randomKey(this.seed.random(), max_keys);
					var newKey = randomKey[0];
					var newPathToKey = randomKey[1];
					var key_name = "key_" + newKey;
					this.slices.peek().setProperty(cursorEnter,"door",key_name);
					
					if( newPathToKey ) {
						//Needs to add the key with a new branch.
						var branch_size = "size" in options ? Math.floor(options.size/2) : 4;
						bid = this.slices.length;
						console.log("Created new branch at " + bid);
						success = this.addBranch({
								"rules":RandomTemple.rules.item,
								"item":key_name,
								"key":newKey,
								"difficulty":2,
								"size":branch_size
							}, 
							branch_size, 
							this.slices.peek().getEntrances()
						);
					}
				}
				//More rooms to go?
				
				if(success){
					if( level > 0 ){
						
						if( "tags" in room && room.tags.indexOf("optional") >= 0) {
							delete options["optional"];
						}
						
						//var next_cursor = new Point(cursor.x + room.width * new_direction, cursor.y);
		
						var exits = entrances;
						if( "exits" in room ) exits = room.exits( entrance );
						for(var cur=0; cur < exits.length; cur++){
							var nextEntrance = new Point(exits[cur][0], exits[cur][1]);
							var next_cursor = cursorEnter.add(nextEntrance);
							
							if("destination_x" in options){
								if(options["destination_x"] == next_cursor.x){
									//Reached its destination
									if("meet_y" in options){
										var lheight = Math.abs(next_cursor.y-options["meet_y"])+1;
										var ltop = new Point(next_cursor.x, Math.min(next_cursor.y,options["meet_y"]));
										return this.isFree({"height":lheight},ltop);
									} else {
										return true;
									}
								}
							}
							
							if( this.addRoom(options, level-1, next_cursor) ) {
								this.slices.peek().useEntrance(cursorEnter,nextEntrance);
								break;
							} else if ( cur >= exits.length -1 ) {
								//Failed on last exit
								success = false;
							}
						}

					} else {
						if("destination_x" in options){
							success = false;
						} else {
							if( "key" in options ) {	
								//Determine side of room not in use
								this.attemptLoop(cursor,entrance,cursorEnter,temp_properties);
								this.slices.peek().keys.push( options.key );
							}
							return true;
						}
					}
				}
				
				if( !success ) {
					//clear this room
					if(typeof bid == "number"){
						//A branch was created, destroy it.
						this.revertSlice(bid);
					}
					this.slices.peek().remove(cursorEnter, room);
					return false;
				} else {
					return true;
				}
			}
		}
		
		//All pieces fit, end
		//if( success ) return true; 
	}
	return false;
}

RandomTemple.prototype.attemptLoop = function(cursor,entrance,cursorEnter,properties){
	//Determine side of room not in use
	var lift = entrance.x > 0 ? new Point(-2,0) : new Point(1,0);
	
	if( this.addBranch({
			"rules":RandomTemple.rules.loop,
			"destination_x" : cursor.add(lift).x,
			"meet_y" : cursor.add(lift).y,
			"size": 10
		},10, this.slices.peek().getEntrances()
	) ){
		
		var q = MapSlice.idToLoc(this.slices.peek().getLast());
		var p = this.slices.peek().getEntrances(this.slices.peek().getLast())[0];
		pheight = q.y - cursor.y;
		
		//is cursor lower than connector?
		if(pheight < 0) lift.y = lift.y + pheight;
		
		var froom = this.roomFromTags(["item"]);
		var lroom = window._map_rooms[3];
		this.slices.peek().add(cursorEnter,froom,properties);
		this.slices.peek().add(cursor.add(lift),lroom,{"height":Math.abs(pheight)+1});
		
		//this.slices.peek().useEntrance(cursor.add(exit).add(new Point(lift.x,0)));
		//this.slices.peek().useEntrance(cursor.add(exit).add(new Point(lift.x,Math.abs(pheight))));
		//if(p instanceof Point) p.y += 1;
		
		var exit = entrance.x > 0 ? new Point(0,0) : new Point(1,0);
		var ops = new Point(0,pheight);
		
		var exit = new Point(
			(q.x <= cursor.x ? cursor.add(lift).x : (cursor.add(lift).x + 1)),
			p.y
		);
		
		//Both sides of item room
		this.slices.peek().useEntrance(cursorEnter);
		this.slices.peek().useEntrance(cursorEnter.add(new Point(1,0)));
		
		this.slices.peek().useEntrance(exit);
		console.log("Loop added");
		return true;
	}
	return false;
}

RandomTemple.prototype.addWell = function(){
	//junctions.sort(function(a,b){ MapSlice.idToLoc(a).y - MapSlice.idToLoc(a).y });
	
	//var junctions = dataManager.slices.peek().getEntrances();
	var rooms = this.slices.peek().filter({"width":1,"height":1,"rarity":0.001});
	
	var size = 6 + Math.floor(this.seed.random() * 5);
	var item = this.randomTreasure(this.seed.random(), [], {"remaining":-999,"locked":true});
	var options = {
		"secret":true,
		"rules":RandomTemple.rules.item,
		"difficulty":2,
		"size":size,
		"item" : item.name
	}
	
	for(var i=0; i < rooms.length; i++){
		//var cursor = MapSlice.idToLoc(junctions[i]);
		var cursor = MapSlice.idToLoc(rooms[i]);
		if(
			this.slices.peek().isFree(cursor.add(new Point(0,1))) &&
			this.slices.peek().isFree(cursor.add(new Point(0,2)))
		){
			rid = this.slices.length;
			this.slices.push( this.slices.peek().clone() );
			
			this.slices.peek().add(cursor,this.roomFromTags(["well"]));
			
			if( this.addBranch(options, options.size, [cursor.add(new Point(0,2))]) ){
				return true;
			} else {
				this.revertSlice(rid);
			}
		}
	}
	return false;
}
	
RandomTemple.prototype.isFree = function(room, cursor){
	room = room || {};
	var width = ("width" in room) ? room.width : 1;
	var height = ("height" in room) ? room.height : 1;
	
	for( x=0; x < width; x++) for( y=0; y < height; y++){
		var pos = new Point( cursor.x + x, cursor.y +y );
		var id = MapSlice.locToId(pos);
		if( id in this.slices.peek().data ) return false;
	}
	return true;
}

RandomTemple.prototype.roomConditions = function(room, options){
	var room_id = window._map_rooms.indexOf( room );
	
	if( this.slices.peek().filter({"room":room_id}).length >= room.remaining ) return false;
	if( "min_temple" in room && room["min_temple"]-0 > this.templeId ) return false;
	if( "min_temple" in room && room["min_temple"]-0 > this.templeId ) return false;
	if( "max_temple" in room && room["max_temple"]-0 < this.templeId ) return false;
	if( "valid_temples" in room && room["valid_temples"].split(",").indexOf( ""+this.templeId ) < 0 ) return false;
	if( options instanceof Object ){
		if( "min_difficulty" in room && ( !("difficulty" in options) || (room["min_difficulty"]-0 > options["difficulty"]-0) ) ) return false;
		if( "max_difficulty" in room && "difficulty" in options && room["max_difficulty"]-0 < options["difficulty"]-0 ) return false;
		if("tags" in options && (!("tags" in room) || (options.tags.intersection(room.tags).length < 1)) ) return false;
	} else {
		if( "min_difficulty" in room ) return false;
	}
	return true;
}
RandomTemple.prototype.randomRoom = function(options){
	var total = 0.0;
	for(var i=0; i<_map_rooms.length; i++) if( this.roomConditions(_map_rooms[i],options) ) total += _map_rooms[i].rarity;
	var roll = this.seed.random() * total;
	for(var i=0; i<_map_rooms.length; i++) {
		if( this.roomConditions(_map_rooms[i],options) ) {
			if( roll < _map_rooms[i].rarity ) return i;
			roll -= _map_rooms[i].rarity;
		}
	}
	return 1;
}
RandomTemple.prototype.roomFromTags = function(tags,options){
	var rooms = this.roomsFromTags(tags,options);
	if( rooms.length > 0 )
		return rooms[Math.floor( this.seed.random() * rooms.length )];
	return this.randomRoom();
}
RandomTemple.prototype.roomsFromTags = function(tags,options){
	var out = [];
	for(var j=0; j < _map_rooms.length; j++ ){
		if( "tags" in _map_rooms[j] && this.roomConditions(_map_rooms[j],options) ){
			for(var i=0; i < tags.length; i++ ){
				if( tags[i] == _map_rooms[j].tags || _map_rooms[j].tags.indexOf(tags[i]) >= 0 ){
					out.push(j);
					break;
				}
			}
		}
	}
	return out;
}
RandomTemple.prototype.revertSlice = function(i){
	this.slices = this.slices.slice(0,i)
}
RandomTemple.prototype.wallmeat = function(){
	for(var i in this.slices.peek().data ) {
		if( this.seed.randomBool(0.2) ) {
			p = MapSlice.idToLoc(i);
			var tiles = new Array();
			for(var y=144; y < 240; y+=16) for(var x=0; x < 256; x+=16) {
				if( ( game.getTile(p.x+x,p.y+y) != BreakableTile.unbreakable && game.getTile(p.x+x,p.y+y) != 0 ) && ( game.getTile(p.x+x+16,p.y+y) == 0 || game.getTile(p.x+x-16,p.y+y) == 0) ){
					tiles.push( new Point(p.x+x+8,p.y+y+8) );
				}
			}
			
			if( tiles.length > 0 ) {
				var tile = tiles[ Math.floor( tiles.length * this.seed.random() ) ];
				var breakable = new BreakableTile( tile.x,  tile.y );
				var item_name = "coin_3";
				if( this.seed.randomBool(0.85) ){
					var item_name = "life_small";
				}
				breakable.item = new Item( tile.x,  tile.y, item_name);
				game.addObject( breakable );
			}
		}
	}
}
RandomTemple.prototype.randomTreasure = function(roll, tags, ops){
	tags = tags || [];
	ops = ops || {};
	ops.remaining = ops.remaining || 0;
	
	var shortlist = [];
	var total = 0.0;
	for(var i=0; i < Item.treasures.length; i++) 
		if((!ops.locked && Item.treasures[i].remaining > ops.remaining) || (ops.locked && Item.treasures[i].unlocked <= 0))
			if(Item.treasures[i].tags.intersection(tags).length == tags.length) {
				total += Item.treasures[i].rarity;
				shortlist.push(Item.treasures[i]);
			}
	roll *= total;
	for(var i=0; i<shortlist.length; i++) {
		if( roll < shortlist[i].rarity ) return shortlist[i];
		roll -= shortlist[i].rarity;
	}
	return Item.treasures[0];
}

RandomTemple.prettyBlocks = function(data, w){
	for(var i=0; i < data.length; i++ ) {
		var b = [
			data[i-(w+1)], data[i-w], data[i-(w-1)], 
			data[i-1], data[i], data[i+1], 
			data[i+(w-1)], data[i+w], data[i+(w+1)]
		];
		var tile = b[4];
		
		if(i%w==0){ b[0] = b[3] = b[6] = 0; }
		if(i%w==w-1){ b[2] = b[5] = b[8] = 0; }
		if(i-w<0){ b[0] = b[1] = b[2] = 1; }
		if(i+w>=data.length){ b[6] = b[7] = b[8] = 1; }
		
		if(tile > 0 && (tile < 137 || tile > 142) ){
			if(b[1]>0 && b[3]>0 &&b[5]>0 && b[7]>0 ){
				if( b[0]==0 ){
					data[i] = 133; //edge brick TL
				} else if( b[2] == 0 ){
					data[i] = 134; //edge brick TR
				} else if( b[6] == 0 ) {
					data[i] = 149; //edge brick BL
				} else if( b[8] == 0 ){
					data[i] = 150; //edge brick BR
				} else {
					//typical brick
					data[i] = 18;
					if( Math.random() < 0.5 ) data[i] += 1;
					if( Math.random() < 0.5 ) data[i] += 16;
				}
			} else if(b[1]>0 && b[3]==0 && b[5]>0 && b[7]==0){
				data[i] = 1; //top left corner
			} else if(b[1]>0 && b[3]>0 && b[5]==0 && b[7]==0){
				data[i] = 8; //top right corner
			} else if(b[1]==0 && b[3]==0 && b[5]>0 && b[7]>0){
				data[i] = 49; //bottom left corner
			} else if(b[1]==0 && b[3]>0 && b[5]==0 && b[7]>0){
				data[i] = 56; //bottom right corner
			} else if(b[1]>0 && b[3]>0 && b[5]>0 && b[7]==0) {
				data[i] = 2 + Math.floor(6*Math.random()); //top tile	
			} else if(b[1]==0 && b[3]>0 && b[5]>0 && b[7]>0) {
				data[i] = 50 + Math.floor(3*Math.random()); //bottom tile	
			} else if(b[1]>0 && b[3]==0 && b[5]>0 && b[7]>0) {
				data[i] = 17 + (Math.random()<0.5?0:16); //left tile	
			} else if(b[1]>0 && b[3]>0 && b[5]==0 && b[7]>0) {
				data[i] = 24 + (Math.random()<0.5?0:16); //right tile	
			}
		}
	}
	return data;
}

function MapSlice() {
	this.keys = [];
	this.keyCount = 0;
	this.data = {};
	this.orderCount = 0;
}
MapSlice.prototype.add = function(loc,room,p, secret){
	p = p || {};
	loc = MapSlice.locToId(loc);
	
	if(loc == undefined || !loc.match(/-?\d+_-?\d/)){
		console.error("Error id provided!");
		return;
	}
	
	var room_id;
	var pos = MapSlice.idToLoc(loc);
	if( room instanceof Object){
		room_id = _map_rooms.indexOf(room);
	} else {
		if( room == -1 ) {
			room_id = -1;
			room = null;
		} else {
			room_id = room;
			room = _map_rooms[room_id];
		}
	}
	secret = secret || false;
	this.orderCount++;
	this.data[loc] = {
		"width" : 1,
		"height" : 1,
		"room" : room_id,
		"entrances" : {},
		"properties" : p,
		"secret" : secret,
		"order" : this.orderCount
	}
	
	if( room instanceof Object ){ 
		var width = ("width" in room) ? room["width"] : 1;
		var height = ("height" in room) ? room["height"] : 1;
		if("width" in p) width = p["width"];
		if("height" in p) height = p["height"];
		this.data[loc]["width"] = width;
		this.data[loc]["height"] = height;
		var entrances = [[0,0],[width,0]];
		if("entrances" in room){
			if(room["entrances"] instanceof Function){
				entrances = room["entrances"](width,height,p);
			}else {
				entrances = room["entrances"];
			}
		}
		
		for(var i=0; i < entrances.length; i++){
			ent = MapSlice.locToId(new Point(entrances[i][0],entrances[i][1]));
			this.data[loc].entrances[ent] = false;
		}
		
		for(var x=0; x< width; x++) for(var y=0; y< height; y++){
			if( x!=0 || y!=0 ) {
				var new_id = MapSlice.locToId(new Point(pos.x+x, pos.y+y));
				this.add(new_id, -1, p);
				this.data[new_id].width = width;
				this.data[new_id].height = height;
			}
		}
	}
}

MapSlice.prototype.getLast = function(){
	var out = null;
	var largest = -1;
	for(var id in this.data){
		if(this.data[id].room >= 0){
			if(this.data[id].order > largest){
				out = id;
				largest = this.data[id].order;
			}
		}
	}
	return out;
}
MapSlice.prototype.get = function(loc){
	loc = MapSlice.locToId(loc);
	return this.data[loc];
}
MapSlice.prototype.setProperty = function(id,name,value){
	//Set property for room
	id = MapSlice.locToId(id);
	if(id in this.data){
		this.data[id].properties[name] = value;
	}
}
MapSlice.prototype.remove = function(loc, room){
	loc = MapSlice.locToId(loc);
	pos = MapSlice.idToLoc(loc);
	var d = this.data[loc];
	if(d.room != -1){
		var width = d.width;
		var height = d.height;
		
		for(var x=0; x<width; x++) for(var y=0; y<height; y++){
			id = MapSlice.locToId(new Point(pos.x+x,pos.y+y));
			if( id in this.data ){
				delete this.data[id];
			}
		}
	}
}
MapSlice.prototype.useEntrance = function(loc,e){
	if( e == undefined ) {
		loc = MapSlice.idToLoc(loc);
		for(var id in this.data){
			for(var ent in this.data[id].entrances){
				var pos = MapSlice.idToLoc(id).add( MapSlice.idToLoc(ent) );
				if( pos.x == loc.x && pos.y == loc.y ){
					this.data[id].entrances[ent] = true;
				}
			}
		}
	} else { 
		loc = MapSlice.locToId(loc);
		if( loc in this.data ){
			var d = this.data[loc];
			var ent = MapSlice.locToId(e);
			if(ent in d.entrances) {
				d.entrances[ent] = true;
			} else {
				console.error("Tried to use ("+ent+") in room: "+loc);
			}
		}
	}
}
MapSlice.prototype.getUsedEntrances = function(inid){
	out = [];
	
	var ids = new Array();
	if(inid != undefined){
		ids = [inid];
	}else{
		ids = Object.keys(this.data);
	}
	
	for(var i=0; i < ids.length; i++){
		var id = ids[i];
		if(id in this.data){
			var d = this.data[id];
			if( d.room >= 0 ) {
				var loc = MapSlice.idToLoc(id);
				for(var ent in d.entrances){
					if( d.entrances[ent] ) {
						var offset = MapSlice.idToLoc(ent);
						out.push( loc.add(offset) );
					}
				}
			}
		}
	}
	return out;
}
MapSlice.prototype.getRoomsWithEntrances = function(){
	out = [];
	for(var id in this.data){
		var d = this.data[id];
		for(var ent in d.entrances){
			if( !d.entrances[ent] ) {
				//var offset = MapSlice.idToLoc(ent);
				out.push( id );
			}
		}
	}
	return out;
}
MapSlice.prototype.getEntrances = function(inid){
	out = [];
	
	var ids = new Array();
	if(inid != undefined){
		ids = [inid];
	}else{
		ids = Object.keys(this.data);
	}
	
	for(var i=0; i < ids.length; i++){
		var id = ids[i];
		if(id in this.data){
			var d = this.data[id];
			if( d.room >= 0 ) {
				var loc = MapSlice.idToLoc(id);
				for(var ent in d.entrances){
					if( !d.entrances[ent] ) {
						var offset = MapSlice.idToLoc(ent);
						out.push( loc.add(offset) );
					}
				}
			}
		}
	}
	return out;
}
MapSlice.prototype.getSecret = function(loc){ 
	if( loc in this.data ) return this.data[loc].secret;
	return false;
}
MapSlice.prototype.setSecret = function(loc,s){ 
	loc = MapSlice.locToId(loc);
	if( loc in this.data ) {
		this.data[loc].secret = s;
		if( this.data[loc].room >= 0 ) {
			try{
				var room = _map_rooms[ this.data[loc].room ];
				var pos = MapSlice.idToLoc(loc);
				for(var i=1; i < room.width; i++ ) {
					this.setSecret(pos.add(new Point(i,0)),s);
				}
			} catch (err){}
		}
	}
}
MapSlice.prototype.entrancesCount = function(){
	return this.getEntrances().length;
}
MapSlice.prototype.isFree = function(loc,width,direction){
	loc = MapSlice.locToId(loc);
	return !(loc in this.data && this.data[loc] != undefined );
}
MapSlice.prototype.roomIds = function(){
	return Object.keys(this.data);
}
MapSlice.prototype.size = function(){
	var out = new Line(0,0,0,0);
	for(var i in this.data) {
		var pos = MapSlice.idToLoc(i);
		if(pos.x < out.start.x) out.start.x = pos.x;
		if(pos.x+1 > out.end.x) out.end.x = pos.x+1;
		if(pos.y < out.start.y) out.start.y = pos.y;
		if(pos.y+1 > out.end.y) out.end.y = pos.y+1;
	}
	return out;
}
MapSlice.prototype.filter = function(f){
	var out = new Array();
	for(var i in this.data ){
		var room = _map_rooms[ this.data[i].room ];
		var addit = true;

		if( room != undefined ) {
			if("room" in f && this.data[i].room != f.room) addit = false;
			if("width" in f && room.width != f.width) addit = false;
			if("height" in f && room.height != f.height) addit = false;
			if("rarity" in f && room.rarity < f.rarity) addit = false;
			if("raritylt" in f && room.rarity > f.raritylt) addit = false;
		} else {
			if("room" in f ) addit = false;
			if("raritylt" in f ) addit = false;
			if("rarity" in f ) addit = false;
			if("isRoom" in f ) addit = false;
			if("width" in f) addit = false;
		}
		if("rooms" in f ){
			if( room == undefined ) addit = false;
		}
		if(addit) out.push(i);
	}
	return out;
}
MapSlice.prototype.randomKey = function(roll, max_keys){
	var out = [0, true];
	
	if( this.keys.length > 0 && this.keys.length >= max_keys ) {
		out[0] = this.keys[ Math.floor( roll * this.keys.length ) ];
		out[1] = false;
	} else {
		out[0] = this.keyCount;
		this.keyCount++;
	}
	return out;
}
MapSlice.prototype.clone = function(){
	out = new MapSlice();
	out.keyCount = this.keyCount;
	out.orderCount = this.orderCount;
	
	for(var i=0; i < this.keys.length; i++){
		out.keys.push(this.keys[i]);
	}
	for(var loc in this.data){
		out.data[loc] = {
			"width" : this.data[loc].width,
			"height" : this.data[loc].height,
			"room" : this.data[loc].room,
			"entrances" : {},
			"properties" : this.data[loc].properties,
			"secret" : this.data[loc].secret,
			"order" : this.data[loc].order
		}
		
		for(var j in this.data[loc].entrances){
			out.data[loc].entrances[j] = this.data[loc].entrances[j];
		}
	}
	return out;
}
MapSlice.idToLoc = function(id){
	try{
		if( id instanceof Point ) return id;
		return new Point(
			~~id.match(/(-?\d+)/g)[0],
			~~id.match(/(-?\d+)/g)[1]
		);
	} catch (err) {
		console.error("Erroneous id provided: " + id);
		return new Point();
	}
}
MapSlice.locToId = function(loc){
	if( loc instanceof Point ){
		return ~~loc.x +"_"+ ~~loc.y;
	}
	return loc;
}

function Seed(s){
	this.seed = "" + s;
	var seedAsNumber = "0.";
	for(var i=0; i < this.seed.length; i++ ) seedAsNumber += "" + Math.abs( this.seed[i].charCodeAt(0) );
	this.prev = seedAsNumber - 0.0;
	this.constant1 = Math.PI * 1551651.0;
	this.constant2 = Math.E * 21657.0;
	this.random();
}
Seed.prototype.random = function(){
	this.prev = (this.prev * 1.0 * this.constant1 + this.constant2) % 1.0;
	return this.prev;
}
Seed.prototype.randomBool = function(odds){
	odds = odds == undefined ? 0.5 : odds;
	return this.random() < odds;
}
Seed.prototype.randomInt = function(s,m){
	return s + Math.floor(this.random() * ((m+1) - s));
}
Seed.prototype.shuffle = function(arr){
	var currentIndex = arr.length;
	
	while(currentIndex > 0){
		var randomIndex = Math.floor(this.random()*currentIndex);
		currentIndex--;
		
		var temp = arr[currentIndex];
		arr[currentIndex] = arr[randomIndex];
		arr[randomIndex] = temp;
	}
	
	return arr;
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

function cursorArea(g,x,y,w,h){
	g.color = [0.0,0.0,0.0,1.0];
	
	g.scaleFillRect(x-1, y-1, 18, 6 );
	g.scaleFillRect(x+w-17, y-1, 18, 6 );
	
	g.scaleFillRect(x-1, y+h-5, 18, 6 );
	g.scaleFillRect(x+w-17, y+h-5, 18, 6 );
	
	g.color = [1.0,1.0,1.0,1.0];
	
	g.scaleFillRect(x, y, 16, 4 );
	g.scaleFillRect(x+w-16, y, 16, 4 );
	
	g.scaleFillRect(x, y+h-4, 16, 4 );
	g.scaleFillRect(x+w-16, y+h-4, 16, 4 );
}

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
				g.renderSprite(
					"text",
					new Point(_x * text_size + x, _y * text_height + y),
					999,
					new Point(index%16,index/16),
					false
				);
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
	var height = 76;
	var left = game.resolution.x * 0.5 - width * 0.5;
	boxArea(g,left,top,width,height);
	textArea(g,s,left+16,top+16,width-32, height-32);
}

DialogManger = {
	"dialogOpen" : false,
	"width":25,
	"maxlines":4,
	"text" : "",
	"show" : false,
	"progress" : 0.0,
	"speed" : 0.85,
	"line" : 0,
	"audio" : "text01",
	"parsedtext" : new Array(),
	"set" : function(text){
		if(DialogManger.text != text){
			DialogManger.text = text;
			DialogManger.parsedtext = DialogManger.parse(text);
			DialogManger.show = true;
			DialogManger.progress = 0.0;
			DialogManger.line = 0;
		}else{
			
		}
	},
	"clear" : function(){
		DialogManger.text = false;
		DialogManger.show = false;
		DialogManger.progress = 0.0;
		DialogManger.line = 0;
	},
	"render" : function(g){
		var charcount = 0;
		var pt = DialogManger.parsedtext;
		var filled = true;
		var lineno = DialogManger.line;
		var max = DialogManger.maxlines;
		var xoff = Math.floor(game.resolution.x* 0.5 - DialogManger.width*4 );
		var yoff = 48;
		
		boxArea(g,xoff-12,yoff-12,DialogManger.width*8+24,max*12+24);
		
		for(var i=lineno; i < lineno+max && i < pt.length; i++){
			var line = pt[i];
			var y = yoff + (i-lineno) * 12;
			for(var j=0; j < line.length; j++){
				var x = xoff + j * 8;
				var index = textLookup.indexOf(line[j]);
				if(charcount < DialogManger.progress){
					g.renderSprite(
						"text",
						new Point(x,y),
						999,
						new Point(index%16,index/16),
						false
					);
				} else {
					filled = false;
				}
				charcount++;
			}
		}
		
		if(input.state("fire") == 1 ){
			if(filled){
				if(lineno+max >= pt.length ){
					//End dialog
					DialogManger.show = false;
				} else {
					//Next lines
					DialogManger.line += max;
					DialogManger.progress = 0.0;
				}
			} else {
				DialogManger.progress = Number.MAX_SAFE_INTEGER;
			}
		} else {
			var prev = DialogManger.progress;
			DialogManger.progress += game.deltaUnscaled * DialogManger.speed;
			if(!filled && Math.floor(prev) != Math.floor(DialogManger.progress)){
				audio.play(DialogManger.audio);
			}
		}		
	},
	"parse" : function(s){
		var out = new Array();
		var last_start = 0;
		var last_space = 0;
		for(var i=0; i < s.length; i++ ){
			if( s[i] == " " ) last_space = i;
			if( i - last_start >= DialogManger.width ) {
				//Slice here
				out.push(s.slice(last_start,last_space));
				i = last_start = last_space + 1;
			}
		}
		out.push(s.slice(last_start));
		return out;
	}
}

 /* platformer\spawn.js*/ 

Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = d[0];
	this.height = d[1];
	this.difficulty = Spawn.difficulty;
	this.specific = null;
	this.autodestroy = 0;
	this.enemies = new Array();
	this.enemiesLimit = 1;
	this.active = false;
	this.timer = 0.0;
	this.timerTotal = 0.0;
	this.edgespawn = false;
	this.idleMargin = 0;
	
	this.on("activate",function(obj){
		this.clear();
		this.spawn();
		this.active = true;
	});
	
	this.options = ops || {};
	var autospawn = 1;
	
	if("enemies" in this.options){
		this.specific = this.options["enemies"].split(",");
	}
	if("limit" in this.options){
		this.enemiesLimit = this.options.limit * 1;
	}
	if("theme" in this.options){
		this.theme = this.options.theme;
	}
	if("difficulty" in this.options){
		this.difficulty = this.options.difficulty * 1;
	}
	if("autodestroy" in this.options){
		this.autodestroy = this.options.autodestroy * 1;
	}
	if("autospawn" in this.options){
		autospawn = this.options.autospawn * 1;
		this.active = autospawn;
	}
	if("edgespawn" in this.options){
		this.edgespawn = this.options.edgespawn * 1;
	}
	if("respawn" in this.options){
		this.on("wakeup",function(){
			if(this.active && this.count() < this.enemiesLimit){
				this.spawn();
			}
		});
	}
	if( "tags" in this.options ){
		this.tags = this.options.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	if("timer" in this.options){
		this.timerTotal = this.options["timer"] * Game.DELTASECOND;
		this.timer = this.timerTotal;
	}
	if("trigger" in this.options){
		this._tid = this.options.trigger;
	}
	
	if(autospawn){
		//Spawn on creation
		this.spawn();
	}
}

Spawn.prototype.update = function(){
	if(this.timerTotal > 0){
		this.timer -= this.delta;
		if(this.timer <= 0){
			this.timer = this.timerTotal;
			if(this.count() < this.enemiesLimit){
				this.spawn();
			}
		}
	}
}

Spawn.prototype.spawn = function(){
	try{
		if(this.specific instanceof Array){
			this.create(this.specific);
		}else {
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
			
			this.create(selected.enemies);
		}
	} catch( err ) {
		console.error( "No valid enemy matching tags: " + this.tags );
	}
}
Spawn.prototype.count = function(enemies){
	var count = 0;
	for(i=0; i < this.enemies.length; i++){
		if(game.objects.indexOf(this.enemies[i]) >= 0){
			if(this.enemies[i].life > 0){
				count++;
			}
		}
	}
	return count;
}
Spawn.prototype.create = function(enemies){
	for(var j=0; j < enemies.length; j++){
		var that = this;
		var name = enemies[j];
		try {
			var sposition = this.spawnPosition(j);
			var object = new self[ name ]( 
				sposition.x,
				sposition.y,
				null,
				{"difficulty":this.difficulty}
			);
			object.on("swap", function(obj){
				that.enemies.remove(that.enemies.indexOf(this));
				that.enemies.push(obj);
				if(that.autodestroy){
					obj.on("sleep", function(){this.destroy();});
				}
			});
			if(this.autodestroy){
				object.on("sleep", function(){this.destroy();});
			}
			game.addObject( object );
			this.enemies.push( object );
		} catch (e) {
			console.error( "cannot create object: " + name );
		}
	}
}
Spawn.prototype.spawnPosition = function(i){
	if(this.edgespawn){
		var c = this.corners();
		var leftPos = game.camera.x;
		var rightPos = game.camera.x + game.resolution.x
		var left = c.left < leftPos;
		var right = c.right > rightPos;
		if(left && right){
			if(Math.random()>0.5){
				return new Point(leftPos, this.position.y);
			} else {
				return new Point(rightPos, this.position.y);
			}
		} else {
			if(left){
				return new Point(leftPos, this.position.y);
			} else{
				return new Point(rightPos, this.position.y);
			}
		}
	} else {
		return new Point(this.position.x + i*24, this.position.y);
	}
	return new Point(this.position.x, this.position.y);
}
Spawn.prototype.clear = function(){
	for(var i=0; i < this.enemies.length; i++){
		if(this.enemies[i] instanceof GameObject){
			this.enemies[i].destroy();
		}
	}
	this.enemies = new Array();
}

Spawn.addToList = function(pos,list, type, max, ops){
	var slot = -1;
	var obj;
	max = max == undefined ? 5 : max;
	
	for(var i=0; i < max; i++){
		if(i >= list.length ){
			slot = i;
			break;
		} else if(list[i] instanceof type){
			if(game.objects.indexOf(list[i]) < 0 || list[i].life <= 0){
				slot = i;
				break;
			}
		}
	}
	
	if(slot >= 0){
		obj = new type(pos.x, pos.y, false, ops);
		//obj.on("sleep", function(){ this.destroy();});
		obj.xp_award = 0;
		game.addObject(obj);
		list[slot] = obj;
	}
	
	return obj;
}
Spawn.countList = function(list){
	var count = 0;
	for(var i=0; i < list.length; i++){
		if(list[i] instanceof GameObject){
			if(game.objects.indexOf(list[i]) >= 0 && list[i].life > 0){
				count++;
			}
		}
	}
	return count;
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
		{"tags":["miniboss"],"difficulty":[2,3],"enemies":["ChickenChain"]},
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
		{"tags":["major","ranged"],"difficulty":[0,99],"enemies":["Chaz"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Igbo"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Yeti"]},
		{"tags":["major","ranged"],"difficulty":[4,99],"enemies":["ChickenChain"]},
		
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Flederknife"]},
		{"tags":["minor"],"difficulty":[2,99],"enemies":["Flederknife","Flederknife"]},
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
		{"tags":["minor","flying"],"difficulty":[2,4],"enemies":["Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Laughing","Laughing","Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Ghoul"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]}
	],
	"undead" : [
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Ghoul"]},
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Ratgut"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Batty"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Svarog"]},
		{"tags":["major"],"difficulty":[0,99],"enemies":["Skeleton"]},
		{"tags":["miniboss"],"difficulty":[0,99],"enemies":["BigBones"]}
	]
};

Spawn.damage = function(level,difficulty){
	var damage = 5; //0 very little
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	switch(level){
		case 1: damage = 2.5; break;//1 weak, bashing into normal enemy
		case 2: damage = 4.0; break;//2 strike from minor enemy
		case 3: damage = 5.0; break;//3 strike from major enemy
		case 4: damage = 6.0; break;//4 strike from miniboss
		case 5: damage = 7.5; break;//5 strike from boss
		case 6: damage = 10.0; break;//6 strike from SUPER boss
	}
	
	var multi = 1 + difficulty * 0.25;
	damage = Math.floor( damage * multi );
	return damage;
}

Spawn.life = function(level, difficulty){
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	if( level == 0 ) return 3; //Always one shot
	var multi = 5 + difficulty * 3.125;
	return Math.floor( multi * level );
}

Spawn.difficulty = 0;

 /* platformer\spells.js*/ 

spell_fire = function(player){
	//Fires a fireball
	var cost = 4;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	var bullet = new Bullet(player.position.x, player.position.y, (player.flip?-1:1));
	bullet.team = 1;
	bullet.frames = [5,6,7];
	bullet.frame.y = 1;
	bullet.blockable = 0;
	bullet.damage = 10 + player.stats.magic * 5;
	game.addObject(bullet);
	
	return cost;
}

spell_bifurcate = function(player){
	//Fires a fireball
	var cost = 24;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	audio.play("cracking");
	var bullet = new Bullet(player.position.x, player.position.y, (player.flip?-1:1));
	bullet.team = 1;
	bullet.frames = [5,6,7];
	bullet.frame_row = 1;
	bullet.on("hurt_other", function(obj){
		this.damage = Math.max(Math.floor(obj.life*0.5),1);
	});
	
	if(player.states.duck){
		bullet.position.y += 8;
	} else {
		bullet.position.y -= 8;
	}
	
	game.addObject(bullet);
	
	return cost;
}

spell_flash = function(player){
	//Fires a fireball
	var cost = 16;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	audio.play("spell");
	var area = new Line(game.camera, game.camera.add(game.resolution));
	var objs = game.overlaps(area);
	var damage = Math.floor(8 + player.stats.magic*2);
	var heal = 0;
	for(var i=0; i < objs.length; i++){
		var obj = objs[i];
		if(obj.hasModule(mod_combat) && obj.team != player.team && area.overlaps(obj.position)){
			obj.hurt(player,damage);
			heal += 2;
		}
	}
	player.heal += heal;
	
	return cost;
}

spell_heal = function(player){
	//Heas player
	var cost = 12;
	if(player.mana < cost || player.life >= player.lifeMax){
		audio.play("negative");
		return 0;
	}
	
	var heal = Math.floor(8 + player.stats.magic*3);
	player.heal += heal;
	
	return cost;
}

spell_purify = function(player){
	//removes all debuffs
	var cost = 3;
	if(player.mana < cost){
		audio.play("negative");
		return 0;
	}
	
	var used = false;
	for(var i in player.statusEffects){
		if(player.statusEffects[i] > 0){
			used = true;
			player.statusEffects[i] = 0.0;
		}
	}
	
	if(used){
		audio.play("spell");
		return cost;
	} else {
		audio.play("negative");
		return 0;
	}
}

spell_teleport = function(player){
	//removes all debuffs
	var cost = 12;
	
	var marker = game.getObject(TeleMarker);
	if(marker instanceof TeleMarker){
		player.position.x = marker.position.x;
		player.position.y = marker.position.y;
		marker.destroy();
		return 0;
	} else {
		if(player.mana < cost){
			audio.play("negative");
			return 0;
		}
		game.addObject(new TeleMarker(player.position.x, player.position.y, player));
	}
	
	return cost;
}

 /* platformer\start.js*/ 

function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	
	//g.addObject( new TitleMenu() );
	//g.addObject( new DemoThanks() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		//_player.doubleJump = true;
		//_player.dodgeFlash = true;
		//_player.grabLedges = true;
		//WorldLocale.loadMap("temple4.tmx");
		WorldLocale.loadMap("townhub.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
			//_player.addXP(1600);
			//_player.life = _player.lifeMax = 48;
			//_player.mana = _player.manaMax = 36;
			//audio.playAs("music_temple4");
			//audio.playAs("music_temple4","music");
		}, 1000);
	},100);
	/**/
}

 /* platformer\telemarker.js*/ 

TeleMarker.prototype = new GameObject();
TeleMarker.prototype.constructor = GameObject;
function TeleMarker(x, y, obj){	
	this.constructor();
	
	this.size = 64;
	this.resolution = new Point(this.size, -this.size);
	this.position.x = x - this.size * 0.5;
	this.position.y = y - this.size * 0.5;
	this.interactive = false;
	this.timer = 0.0;
	this.currentBackground = false;
	
	//Restore whatever the current darkness level was.
	var b = game.getObject(Background);
	if(b instanceof Background){
		this.currentdarknessFunction = b.darknessFunction;
		this.on("destroy", function(){
			var b = game.getObject(Background);
			b.darknessFunction = this.currentdarknessFunction;
		})
	}
	
	var gl = game.g;
	this.buffer = gl.createF(this.size);

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

TeleMarker.prototype.render = function(g,c){
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
	
	var progress = Math.abs(Math.sin(this.timer * 0.05));
	shader.set("u_color", [progress,progress,1,0.5*Math.sqrt(progress)]);
	
	g.drawArrays(g.TRIANGLE_STRIP, 0, geo.length/2);
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA );
	
	this.timer += this.delta;
	Background.pushLight( this.position.add(new Point(this.size/2,this.size/2)).subtract(c), 120 );
}

 /* platformer\tiles.js*/ 

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y,d,o){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.map.tileset;
	this.origin = new Point(0.0, 0.5);
	this.width = this.height = 16;
	this.frame.x = 6;
	this.frame.y = 11;
	this.visible = false;
	this.totalTime = Game.DELTASECOND * 0.6;
	
	this.center = new Point(this.position.x, this.position.y);
	
	//Set up
	o = o || {};
	if("timer" in o){
		this.totalTime = Game.DELTASECOND * o.timer;
	}
	if("broken" in o){
		
	}
	
	var existingTile = game.getTile(this.position.x,this.position.y);
	if(existingTile > 0){
		this.frame.x = Math.floor((existingTile-1) % 32);
		this.frame.y = Math.floor((existingTile-1) / 32);
	}
	
	this.timer = this.totalTime;
	this.active = false;
	
	this.on("collideObject",function(obj){
		if( this.visible && !this.active && obj instanceof Player ){
			this.active = true;
			audio.playLock("cracking",0.4);
		}
	});
	this.on(["wakeup","added"],function(){
		this.visible = true; 
		this.active = false;
		this.position.x = this.center.x;
		this.position.y = this.center.y;
		game.setTile(this.position.x, this.position.y, game.tileCollideLayer, 1024);
		this.timer = this.totalTime;
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
	this.center = new Point(x,y);
	this.position.x = x;
	this.position.y = y;
	this.broken = 0;
	this.spawn = false;
	this.death_time = Game.DELTASECOND * 0.15;
	this.strikeable = 1;
	this.chain = 1;
	this.life = 1;
	
	this.chaintype = "break";
	this.chaintime = Game.DELTASECOND * 0.15;
	this.chaintimer = this.chaintime;
	this.chainActive = false;
	this.chainSize = 10;
	this.target = false;
	this.resetOnSleep = 0;
	this.tileLayer = game.tileCollideLayer;
	this.explode = 1;
	
	this.startBroken = 0;
	
	ops = ops || {};
	if("tilelayer" in ops){
		this.tileLayer = ops["tilelayer"] * 1;
	}
	
	if(d[0] > 16 || d[1] > 16){
		this.origin = new Point(0.0, 0.0);
		this.width = Math.round(d[0]/16)*16;
		this.height = Math.round(d[1]/16)*16;
		this.position.x -= this.width * 0.5;
		this.position.y -= this.height * 0.5;
		
		this.undertile = new Array();
		for(var x=0; x < this.width; x+= 16){
			for(var y=0; y < this.height; y+= 16){
				var tile = game.getTile(4+this.position.x+x, 4+this.position.y+y, this.tileLayer);
				this.undertile.push(tile);
			}
		}
	} else {
		this.width = this.height = 16;
		this.undertile = game.getTile(this.position.x, this.position.y, this.tileLayer);
	}
	
	if( "strikeable" in ops ) {
		this.strikeable = ops["strikeable"] * 1;
	}
	if("spawn" in ops) {
		this.spawn = ops["spawn"].split(",");
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("target" in ops) {
		this.target = ops["target"].split(",");
	}
	if("chaintimer" in ops) {
		this.chaintime = Game.DELTASECOND * ops["chaintimer"];
		this.chaintimer = this.chaintime;
	}
	if("broken" in ops) {
		this.startBroken = ops["broken"] * 1;
	}
	if("chain" in ops){
		this.chain = ops["chain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"];
	}
	if("explode" in ops){
		this.explode = ops["explode"] * 1;
	}
	
	this.on("activate", function(obj,pos,damage){
		if(this.broken){
			this.unbreak(this.explode);
		}else{
			this.break(this.explode);
		}
	});
	this.on("break", function(){
		this.break(this.explode);
	});
	this.on("unbreak", function(){
		this.unbreak(this.explode);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.strikeable && obj instanceof Player){
			if(!this.broken){
				if(obj.states.downStab){
					obj.force.y = -2;
					obj.jump();
				}
				if(this.target instanceof Array){
					Trigger.activate(this.target);
				}
				this.break(this.explode);
			}
		}
	});
	
	//Set first state
	if(this.startBroken){
		var tempChain = this.chain;
		this.chain = 0;
		this.break(false);
		this.chain = tempChain;
	}
	if(this.resetOnSleep){
		this.on("sleep", function(){
			if(this.startBroken){
				this.break(false);
			}else{
				this.unbreak(false);
			}
		});
	}
}
BreakableTile.prototype.unbreak = function(explode){
	if(this.broken && this.undertile != 0){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "unbreak";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.undertile instanceof Array){
			var i = 0;
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						this.tileLayer, 
						this.undertile[i]
					);
					i++;
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				this.tileLayer, 
				this.undertile
			);
		}
		this.broken = 0;
	}
}
BreakableTile.prototype.break = function(explode){
	if(!this.broken && this.undertile != BreakableTile.unbreakable && this.undertile != 0){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "break";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.undertile instanceof Array){
			for(var x=0; x < this.width; x+= 16){
				for(var y=0; y < this.height; y+= 16){
					game.setTile(
						4 + this.position.x + x, 
						4 + this.position.y + y, 
						this.tileLayer, 
						0
					);
				}
			}
		} else {
			game.setTile(
				this.position.x, 
				this.position.y, 
				this.tileLayer, 
				0
			);
		}
		this.spawnObject();
		this.broken = 1;
	}
}

BreakableTile.prototype.spawnObject = function(){
	if(this.spawn instanceof Array){
		for(var i=0; i < this.spawn.length; i++){
			try{
				var item = this.spawn[i].match(/^item_(.*)$/);
				if(item){
					game.addObject(new Item(this.center.x, this.center.y,0,{"name":item[1]}));
				} else {
					game.addObject(new window[this.spawn[i]](this.center.x, this.center.y,[this.width,this.height],{}));
				}
			} catch(err){
				console.error("Cannot spawn: "+this.spawn[i]);
			}
		}
	}
}
BreakableTile.prototype.neighbours = function(type){
	var corners = this.corners()
	var hits = game.overlaps(new Line(
		corners.left - this.chainSize, 
		corners.top - this.chainSize,
		corners.right + this.chainSize, 
		corners.bottom + this.chainSize
	));
	for(var i=0; i< hits.length; i++) {
		if( hits[i] instanceof BreakableTile && hits[i] != this ) {
			if(hits[i].chain){
				hits[i].trigger(type, this);
			}
		}
	}
}
BreakableTile.prototype.update = function(){
	if(this.chainActive){
		if(this.chaintimer <= 0){
			this.chainActive = false;
			this.chaintimer = this.chaintime;
			this.neighbours(this.chaintype);
		}
		this.chaintimer -= this.delta;
	}
}

BreakableTile.unbreakable = 1023;

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
		var ct = RandomTemple.currentTemple;
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

 /* platformer\treads.js*/ 

Treads.prototype = new GameObject();
Treads.prototype.constructor = GameObject;
function Treads(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = Number.MAX_SAFE_INTEGER;
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.06;
	this.maxSpeed = 3.0;
	this.sprite = "treads";
	
	this.addModule(mod_block);
	
	this.force = 0.0;
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops["trigger"];
	}
	if("maxy" in ops){
		this.maxy = ops["maxy"] * 1;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * 1;
	}
	if("maxspeed" in ops && ops["maxspeed"]){
		this.maxSpeed = ops["maxspeed"] * 1;
	}
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.position.x = this.originalPosition.x;
			this.position.y = this.originalPosition.y;
			this.sink = false;
		});
	}
	
	//Gather tiles
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / 16);
	this.tileHeight = Math.ceil(this.height / 16);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = game.getTile(
				this.position.x + x*16,
				this.position.y + y*16
			);
			this.tiles.push(tile);
			game.setTile(
				this.position.x + x*16,
				this.position.y + y*16,
				game.tileCollideLayer,
				0
			);
		}
	}
}

Treads.prototype.update = function(){
	if(this.blockOnboard.indexOf(_player) >= 0){
		if(_player.grounded) {
			this.force += _player.force.x * this.delta * this.speed;
			_player.position.x -= this.force * this.delta;
			
			if(_player.isStuck){
				this.force = -this.force;
			}
		}
	}
	
	this.position.y -= this.force * this.delta;
	
	if(this.position.y < this.originalPosition.y - this.maxy){
		this.position.y = this.originalPosition.y - this.maxy;
		this.force = 0;
	}
	if(this.position.y > this.originalPosition.y){
		this.position.y = this.originalPosition.y;
		this.force = 0;
	}
	
	
	this.force -= this.delta * this.speed * 0.5;
	this.force = Math.min(Math.max(this.force, -this.maxSpeed), this.maxSpeed);
	
	this.frame.y = ((this.originalPosition.y-this.position.y) * 0.2 ) % 4;
}

Treads.prototype.render = function(g,c){
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = 0;
			
			if(x>0) tile += 1;
			if(x+1>=this.tileWidth) tile += 1;
			if(y+1>=this.tileHeight) tile += 3;
			
			var pos = new Point(
				this.position.x + x * 16,
				this.position.y + y * 16
			);
				
			g.renderSprite(this.sprite,pos.subtract(c),this.zIndex,new Point(tile,this.frame.y));
		}
	}
}
Treads.prototype.shouldRender = MovingBlock.prototype.shouldRender;
Treads.prototype.idle = function(){}

 /* platformer\trigger.js*/ 

Trigger.prototype = new GameObject();
Trigger.prototype.constructor = GameObject;
function Trigger(x,y,d,o){
	this.constructor();
	
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	
	this.position.x = x - (this.width/2);
	this.position.y = y - (this.height/2);
	this.origin.x = this.origin.y = 0;
	
	this.targets = new Array();
	this.background = null;
	this.darknessFunction = null;
	this.darknessColour = null;
	this.dustCount = null;
	this.sealevel = null;
	this.triggerCount = 0;
	this.retrigger = 1;
	this.retriggertime = Game.DELTASECOND;
	this.retriggertimeCooldown = 0;
	this.mustwaitinside = false;
	this.music = false;
	
	this.countdown = 0;
	this.timer = 0;
	this.time = 0;
	
	this._isover = false
	
	o = o || {};
	
	if("target" in o){
		this.targets = o.target.split(",");
	}
	if("darkness" in o){
		this.darknessFunction = new Function("c","return " + o.darkness)
	}
	if("darknesscolor" in o){
		try{
			var colour = o["darknesscolor"].split(",");
			this.darknessColour = [
				colour[0] * 1,
				colour[1] * 1,
				colour[2] * 1,
			]
		} catch(err){}
	}
	if("background" in o){
		this.background = o["background"];
	}
	if("dustcount" in o){
		this.dustCount = o["dustcount"] * 1;
	}
	if("sealevel" in o){
		this.sealevel = o["sealevel"] * 1;
	}
	if("retrigger" in o){
		this.retrigger = o.retrigger * 1;
	}
	if("retriggertime" in o){
		this.retriggertime = o.retriggertime * Game.DELTASECOND;
	}
	if("timer" in o){
		this.time = o["timer"] * Game.DELTASECOND;
		this.timer = this.time;
	}
	if("mustwaitinside" in o){
		this.mustwaitinside = o["mustwaitinside"];
	}
	if("music" in o){
		this.music = o["music"];
	}
	
	this.on("activate", function(obj){
		if(this.retrigger || this.triggerCount == 0){
			this.triggerCount++;
			if(this.retriggertimeCooldown <= 0){
				this.retriggertimeCooldown = this.retriggertime;
				if(
					this.darknessFunction instanceof Function ||
					this.darknessColour instanceof Array ||
					this.dustCount != undefined ||
					this.sealevel != undefined ||
					this.background
				){
					var b = game.getObject(Background);
					if(b instanceof Background){
						
						if(this.darknessFunction instanceof Function)
							b.darknessFunction = this.darknessFunction;
						
						if(this.darknessColour instanceof Array)
							b.ambience = this.darknessColour;
						
						if(this.dustCount != undefined)
							b.dustAmount = this.dustCount;
						
						if(this.sealevel != undefined)
							b.sealevel = this.sealevel;
						
						if(this.background)
							if(this.background in Background.presets)
								b.preset = Background.presets[this.background];
					}
				}
				
				if(this.music){
					audio.playAs(this.music,"music");
				}
				//trigger connected objects
				if(this.targets.length > 0){
					for(var i=0; i < this.targets.length; i++){
						var objects = Trigger.getTargets(this.targets[i]);
						for(var j=0; j < objects.length; j++){
							objects[j].trigger("activate", this);
						}
					}
				}
			}
		}
	});
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.time <= 0){
				this.trigger("activate");
			}else{
				this.countdown = true;
				this._isover = true;
			}
		}
	});
}

Trigger.prototype.update = function(){
	if(this.countdown){
		if(!this._isover && this.mustwaitinside){
			this.timer = this.time;
			this.countdown = false;
		}
		if(this.timer <= 0){
			this.timer = this.time;
			this.countdown = false;
			this.trigger("activate");
		}
		this.timer -= this.delta;
	}
	this.retriggertimeCooldown -= this.delta;
	this._isover = false;
}
Trigger.prototype.idle = function(){}

Trigger.getTargets = function(name){
	var out = new Array();
	if(game instanceof Game){
		for(var i=0; i < game.objects.length; i++){
			var obj = game.objects[i];
			if("_tid" in obj && obj._tid == name){
				out.push(obj);
			}
		}
	}
	return out;
}
Trigger.activate = function(targets){
	var objects = Trigger.getTargets(targets);
	for(var j=0; j < objects.length; j++){
		objects[j].trigger("activate", this);
	}	
}

AttackTrigger.prototype = Trigger.prototype;
AttackTrigger.prototype.constructor = GameObject;
function AttackTrigger(x,y,d,o){
	Trigger.apply(this,[x,y,d,o]);
	this.clearEvents("collideObject");
	
	this.addModule(mod_combat);
	
	o = o || {};
	this.lifeMax = this.life = 1;
	
	if(!("retrigger" in o)){
		this.retrigger = 0;
	}
	if("life" in o){
		this.lifeMax = this.life = o["life"] * 1;
	}
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("death", function(){
		this.trigger("activate");
		if(this.retrigger){
			this.dead = false;
			this.life = this.lifeMax;
			this.interactive = true;
		} else {
			this.destroy();
		}
	});
}

Switch.prototype = Trigger.prototype;
Switch.prototype.constructor = GameObject;
function Switch(x,y,d,o){
	o = o || {};
	Trigger.apply(this,[x,y,d,o]);
	
	//Clear the on touch trigger
	this.clearEvents("collideObject");
	
	this.sprite = "switch";
	this.playerover = false;
	this.frame = 0;
	this.frame_row = 0;
	this.zIndex = -1;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			this.playerover = true;
			if(this.triggerCount==0 && this.retrigger && input.state("up") == 1){
				this.trigger("open");
			}
		}
	});
	this.on("open", function(){
		if(this.time <= 0){
			this.trigger("activate");
		}else{
			this.countdown = true;
		}
		audio.play("switch");
		this.frame = 1;
	});
	
	this.render = function(g,c){
		if(this.triggerCount==0 && this.retrigger){
			Background.pushLight(this.position.add(new Point(this.width*0.5,this.height*0.5)),96);
		}
		GameObject.prototype.render.apply(this,[g,c]);
	}
	
	this.postrender = function(g,c){
		if(this.triggerCount==0 && this.retrigger){
			if(this.playerover){
				var pos = _player.position.subtract(c);
				pos.y -= 24;
				g.renderSprite("text",g,pos,this.zIndex,new Point(4,6));
				this.playerover = false;
			}
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
	this.sprite = "characters";
	this.town = t || _world.towns[1];
	
	this.state = 0;
	this.speed = 0.5 + Math.random() * 0.9;
	
	this.addModule(mod_talk);
	
	this.path = Math.floor(Math.random()*3); //0 back and forth, 1 loop, 2 still
	this.direction = Math.random()>0.5?1:-1;
	
	var m = Villager.getMessage(this.town);
	
	this.message = m.message;
	
	o = o || {};
	try{
		this.builder = "builder" in o;
		if( "path" in o ){
			this.path = 1 * o.path;
		}
		if( "script" in o ){
			
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
Villager.prototype.hudrender = function(g,c){	
	if( this.open > 0 ) {
		//Get message
		var m = this.message[this.state];
		
		//m = m.replace("%TOWNNAME%",this.town.name);
		
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
Villager.script = {
	"q0_0" : function(world){
		var talk = i18n("villagerq0_0");
		var quest = quests.q0;
		if(quest == "complete") return talk[3];
		if(quest == 0){
			world.q0 = 1;
			return talk[0];
		}
		return talk [quest];
	}
	
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
	this.sprite = "waterfall";
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
	this.sprite = "waystones";
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
					treasure = Item.randomTreasure(Math.random(), ["chest"]);
					treasure.remaining--;
					var item = new Item(this.position.x, this.position.y, false, {"name":treasure.name});
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
		
		"items".render(g,this.coin.subtract(c),7+frame,1);
	}
}
Well.prototype.idle = function(){}

 /* platformer\worldmap.js*/ 

var version = "0.3.4";

Quests = {
	"set" : function(id,value){
		if(typeof value == "string" && value.toLowerCase() == "complete"){
			value = Quests.COMPLETED;
		}
		if(id in Quests){
			Quests[id] = value;
			try{
				//Send quest message
				var qmessage = "";
				
				if(value == Quests.COMPLETED){
					qmessage = i18n("questcomplete");
				}else{
					qmessage = i18n("quest")[id][value];
				}
				
				var pm = game.getObject(PauseMenu);
				pm.message(qmessage);
				audio.play("quest");
			} catch (err){}
		}
	},
	"list": function(){
		var i = 0;
		var out = new Array();
		while("q"+i in Quests){
			var id = "q"+i;
			var q = Quests[id];
			if(q > 0){
				var text = i18n("quest")[id];
				out.push({
					"name" : text[0],
					"description" : (q < text.length ? text[q] : ""),
					"complete" : q >= Quests.COMPLETED,
					"progress" : q
				});
			}
			i++;
		}
		out.sort(function(a,b){
			if(a.complete) return 1;
			if(b.complete) return -1;
			return a.progress - b.progress;
		});
		return out;
	},
	"COMPLETED" : 9999,
	"q0" : 0, //Magic wand
	"q1" : 0,
	"q2" : 0 //Lost souls in the phantom world
}

Settings = {
	"fullscreen" : false,
	"sfxvolume" : 1.0,
	"musvolume" : 1.0,
	"debugmap" : "testmap.tmx"
}

WorldMap = {
	"newgame" : function(){
		new Player(64,178);
		WorldMap.position = new Point(73*16,40*16);
		WorldMap.open();
		
		game.load(function(data){
			for(var q in data.quests){
				Quests[q] = data.quests[q];
			}
			NPC.variables = data.variables;
			
			if("settings" in data){
				for(var i in data["settings"]){
					if(i in Settings){
						Settings[i] = data["settings"][i];
					}
				}
			}
		});
	},
	"position" : new Point(240,256),
	"open" : function(playerLocale){
		//Save keys for temple and remove
		//Save game
		game.loadMap("world2.tmx", function(){
			if(playerLocale != undefined){
				//Change players location to the set locale
				var locales = game.getObjects(WorldLocale);
				for(var i=0; i < locales.length; i++){
					//Search for the locale that matches the playerLocale
					if(locales[i].start == playerLocale){
						WorldMap.position.x = locales[i].position.x;
						WorldMap.position.y = locales[i].position.y;
						break;
					}
				}
			}
			game.addObject(new WorldPlayer(
				WorldMap.position.x,
				WorldMap.position.y
			));
		});
	},
	"close" : function(worldLocale){
		WorldMap.position.x = worldLocale.position.x;
		WorldMap.position.y = worldLocale.position.y;
	},
	"Shops" : [
		"Alter",
		"Arena",
		"Prisoner",
		"Shop",
		"WaystoneChest"
	],
	"updateSettings" : function(){
		self.postMessage({
			"settings" : Settings
		})
	},
	"save" : function(){
		var q = {}
		var i = 0;
		while("q"+i in Quests){
			q["q"+i] = Quests["q"+i];
			i++;
		}
		
		var data = {
			"savedata" : new Date * 1,
			"quests" : q,
			"variables" : NPC.variables,
			"settings" : Settings
		}
		
		game.save(data);
	}
};

WorldPlayer.prototype = new GameObject();
WorldPlayer.prototype.constructor = GameObject;
function WorldPlayer(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	//this.origin = new Point(0.2,0.2);
	
	this.height = this.width = 12;
	this.sprite = "world";
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
	this.grounded = false;
	this.force = this.force.scale( 1.0 - (0.2*this.delta) );
	if( true ){
		if( input.state("up") > 0 ) { this.force.y -= this.speed * this.delta; }
		if( input.state("down") > 0 ){ this.force.y += this.speed * this.delta; }
		if( input.state("left") > 0 ) { this.force.x -= this.speed * this.delta; }
		if( input.state("right") > 0 ) { this.force.x += this.speed * this.delta; }
	}
	
	var camx = game.resolution.x * 0.5;
	game.camera.x = Math.max( Math.min( this.position.x - camx, (game.map.width*16)-game.resolution.x), 0);
	game.camera.y = Math.max( Math.min( this.position.y - 120, (game.map.height*16)-game.resolution.y), 0);
}
WorldPlayer.prototype.render = function(g,c){
	g.color = [0.8,0.2,0.0,1.0];
	var pos = this.bounds().start;
	g.scaleFillRect(pos.x-c.x,pos.y-c.y,this.width,this.height);
}

WorldLocale.prototype = new GameObject();
WorldLocale.prototype.constructor = GameObject;
function WorldLocale(x,y,d,properties){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.type = false;
	this.index = 0;
	this.active = false;
	this.sleepTime = Game.DELTASECOND;
	this.start = false;
	
	this.height = this.width = 8;
	this.sprite = "world";
	
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
	if("tmx" in properties){
		this.type = "tmx";
		this.index = properties["tmx"];
		this.visible = false;
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
	if("start" in properties){
		this.start = properties["start"];
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof WorldPlayer ){
			if( this.active ){
					//var dir = new Point(obj.force.x, obj.force.y);
					//_world.enterLocale( this, dir );
					
					if(this.type == "tmx"){
						WorldMap.close(this);
						WorldLocale.loadMap(this.index, this.start);
					}
			}
			this.sleepTime = Game.DELTASECOND * 0.5;
		}
	});
}
WorldLocale.prototype.update = function(){
	this.active = this.sleepTime <= 0;
	if(!this.active){
		this.sleepTime -= this.delta;
	}
}
WorldLocale.loadMap = function(map, start){
	var file = map;
	game.loadMap(file, function(starts){
		//Determine player start location
		if(starts.length > 0){
			var index = WorldLocale.getMapIndex(starts,start);
			if(index >= 0){
				//Player start matches specified location start
				_player.position = new Point(starts[index].x,starts[index].y);
				game.addObject(_player);
			} else {
				//No start location specified, pick the first start
				_player.position = new Point(starts[0].x,starts[0].y);
				game.addObject(_player);
			}
		} else {
			//No player start, just force one in
			_player.position = new Point(64,192);
			game.addObject(_player);
		}
		game.addObject(new PauseMenu(0,0));
		game.addObject(new Background(0,0));
	});
}
WorldLocale.getMapIndex = function(list,key){
	for(var i=0; i < list.length; i++){
		if(list[i].start == key){
			return i;
		}
	}
	return -1;
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
	this.sprite = "world";
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

 /* platformer\scenes\caverock.js*/ 

SceneCaveRock.prototype = new GameObject();
SceneCaveRock.prototype.constructor = GameObject;
function SceneCaveRock(x,y,dim,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.start = new Point(x,y);
	this.end = new Point(x,y+16*5);
	
	this.sprite = "cornerstones";
	
	this._tid = "caverock";
	this.active = false;
	this.isOpen = false;
	this.progress = 0.0;
	this.speed = 1 / (Game.DELTASECOND * 4);
	
	this.tiles = new Array();
	for(var i=0; i < dim[0]; i+=16) for(var j=0; j < dim[1]; j+=16) {
		this.tiles.push(new Point(
			(x + 8 + i) - (dim[0]*0.5),
			(y + 8 + j) - (dim[1]*0.5)
		));
	}
	
	if(Quests.q0 == Quests.COMPLETED){
		this.open();
	}else{
		this.close();
	}
	
	this.on("activate", function(){
		if(!this.isOpen){
			this.active = true;
		}
	});
	
	this.frame = 0;
	this.frame_row = 0;
}

SceneCaveRock.prototype.update = function(){
	if(this.active){
		this.position = Point.lerp(this.start,this.end,this.progress);
		
		if(this.progress < 1){
			shakeCamera(10,4);
			audio.playLock("cracking",0.2);
		} else {
			this.active = false;
			this.open();
			Quests.set("q0",Quests.COMPLETED);
		}
		
		this.progress = Math.min(this.progress + this.delta * this.speed, 1.0);
	}
}
SceneCaveRock.prototype.open = function(){
	this.isOpen = true;
	this.position.x = this.end.x;
	this.position.y = this.end.y;
	for(var i=0; i < this.tiles.length; i++){
		game.setTile(
			this.tiles[i].x,
			this.tiles[i].y,
			game.tileCollideLayer,
			0
		);
	}
}
SceneCaveRock.prototype.close = function(){
	this.isOpen = false;
	this.position.x = this.start.x;
	this.position.y = this.start.y;
	for(var i=0; i < this.tiles.length; i++){
		game.setTile(
			this.tiles[i].x,
			this.tiles[i].y,
			game.tileCollideLayer,
			1024
		);
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
		"dreams".render(g,new Point(xpos+wave,y*16),x,_y+y);
	}
	
	if(this.type == 1){
		var f = 4 + Math.abs(this.progress/Game.DELTASECOND*3) % 2;
		"characters".render(g,new Point(xpos+184,192),f,0,true);
		"characters".render(g,new Point(xpos+104,192),f,1,false);
	} else if(this.type == 2){
		var f = Math.abs(this.progress/Game.DELTASECOND*3) % 3;
		var distance = 256 * (this.progress / (this.length*Game.DELTASECOND));
		"characters".render(g,new Point(xpos+distance,192),f,0,false);
		if(this.progress > Game.DELTASECOND*7){
			"characters".render(g,new Point(xpos+16+distance,192),3,1,true);
		} else {
			f = Math.abs(this.progress/Game.DELTASECOND*5) % 3;
			distance = Math.lerp(-64,distance+16,this.progress/(Game.DELTASECOND*7));
			"characters".render(g,new Point(xpos+distance,192),3+f,2,false);
		}
	} else if(this.type == 3){
		var distance = Math.lerp(-64,96,Math.min(this.progress/(Game.DELTASECOND*7),1));
		var f = Math.abs(distance*0.2) % 3;
		"characters".render(g,new Point(xpos+distance,192),3+f,2,false);
		
		if(this.progress > Game.DELTASECOND * 15){
			"poseidon".render(g,new Point(xpos+168,160),2,1,true);
		}
		"characters".render(g,new Point(xpos+176,192),3,0,true);
		
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
	game.tileSprite = "tiles3";
	
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
		"chazbike".render(g,new Point(104,192),0,2);
		"ending".render(g,new Point(this.father_position*20-64,176),0,0);		
		"player".render(g,new Point(this.player_position*20-20,192),1,2,true);
		
	} else if( this.phase == 2 ) {
		var pos = 1 + Math.min(-this.x_off*0.01+Math.pow(this.x_off*0.005,2),0);
		if(this.progress > 45) pos += Math.max(this.progress-45,0);
		"ending".render(g,new Point(88*pos,176),1,1);
		
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
			_player.sprite = "playerhuman";
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
	"characters".render(g, this.father.pos.subtract(c), this.father.frame, this.father.frame_row, this.father.flip);
	"characters".render(g, this.player.pos.subtract(c), this.player.frame, this.player.frame_row, this.player.flip);
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
				"player".render(g,new Point(xpos+128,120), 4, 0, false);
			} else {
				g.color = [0.0,0.0,0.0,1.0];
				g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
				
				var lowest = 0;
				for(var i=0; i < this.stars.length; i++){
					this.stars[i].pos.y -= this.stars[i].speed * this.delta;
					if( this.stars[i].pos.y > lowest ) lowest = this.stars[i].pos.y;
					"bullets".render(g, this.stars[i].pos.add(new Point(xpos,0)), 3, 2);
				}
				"title".render(g, new Point(xpos, lowest), 0, 2);
				
				if( lowest <= 0 ) {
					this.destroy();
					game.addObject( new TitleMenu() );
				}
			}
		} else {
			//Cut scene
			"player".render(g,this.objPlayer.pos.subtract(c), 0, 3, false);
			"player".render(g,this.objPlayer.pos.subtract(c), this.objPlayer.frame, this.objPlayer.frame_row, false);
			
			"zoder".render(g,this.objZoder.pos.subtract(c), this.objZoder.frame, this.objZoder.frame_row, true);
			
			if( this.objSpear.visible ) {
				"zoder".render(g,this.objSpear.pos.subtract(c), this.objSpear.frame, this.objSpear.frame_row, true);
			}
			
			for(var i=0; i < this.villagers.length; i++ ){
				"characters".render(g,this.villagers[i].pos.subtract(c), this.villagers[i].frame, this.villagers[i].frame_row, false);
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
	
	this.sprite = "transform";
	
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