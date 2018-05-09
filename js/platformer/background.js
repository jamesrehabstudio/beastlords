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
	
	this.tintOld = [1.0,1.0,1.0,1.0];
	this.tintNew = [1.0,1.0,1.0,1.0];
	this.tintTime = 0.0;
	this.tintTimeMax = 0.0;
	
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
	
	if(this.tintTime > 0){
		var change = this.tintTime / this.tintTimeMax;
		for(var i=0; i < g.tint.length; i++){
			g.tint[i] = Math.lerp(this.tintNew[i], this.tintOld[i], change);
		}
		this.tintTime -= game.deltaUnscaled;
		if(this.tintTime <= 0){
			g.tint = [this.tintNew[0],this.tintNew[1],this.tintNew[2],this.tintNew[3]]
		}
	}
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
			this.zIndex,
			new Point(0, 31), 
			false, 
			{
				//"shader":"blur",
				//"blur":Math.min(0.004 * dust.scale, 0.008), 
				"scale": 0.3*dust.scale,
				"rotate" : 360 * Math.sin(dust.lapse)
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
		if(light[3] == 0){
			//Point light
			var position = light[0];
			var radius = light[1];
			var color = light[2];
			g.renderSprite("halo",position.subtract(c),this.zIndex,new Point(),false,{"scale":radius/240,"u_color":color});
		} else if(light[3] == 1) {
			//Area light
			var rect = light[0];
			var radius = light[1];
			var color = light[2];
			var areaSize = new Point(rect.width(), rect.height());
			var totalSize = new Point(areaSize.x + radius * 2.0, areaSize.y + radius * 2.0);
			g.renderSprite("haloarea",rect.start.subtract(new Point(radius,radius)).subtract(c),this.zIndex,new Point(),false,{
				"scalex":totalSize.x/256,
				"scaley":totalSize.y/256,
				"u_radius" : [(radius*1.5)/totalSize.x,(radius*1.5)/totalSize.y*0.5],
				"u_color":color
			});
		}
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
		Background.lights.push([p,r,c,0]);
	}
}
Background.pushLightArea = function(rect,r,c){
	if( Background.lights.length < 20 ) {
		rect = rect || new Line(0,0,1,1);
		r = r || 0;
		c = c || [1.0,1.0,1.0,1.0];
		Background.lights.push([rect,r,c,1]);
	}
}
Background.setTint = function(t, duration){
	if(t instanceof Array && t.length >= 4){
		if(duration === undefined){ duration = 0.0; }
		
		if(duration > 0){
			var b = game.getObject(Background);
			b.tintOld = [Renderer.tint[0],Renderer.tint[1],Renderer.tint[2],Renderer.tint[3]];
			b.tintNew = [t[0],t[1],t[2],t[3]];
			b.tintTime = b.tintTimeMax = duration;
		} else {
			Renderer.tint = t;
		}
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
		g.renderSprite("sky_storm1",new Point(game.resolution.x*0.5,0),1,new Point(0,0));
		var raincolor = [0.8,0.5,0.5,0.5];
		
		for(var i=0; i < 12; i++){
			var fallspeed = 2.5 + i * 0.5;
			var offset = new Point(
				i * 16 + Math.mod(i,5) * 130,
				i * 16 + Math.floor(i/5) * 130
			)
			
			g.renderSprite("bgrain",new Point(
				Math.mod(offset.x + game.timeScaled * fallspeed * -0.5, game.resolution.x+160) + (game.resolution.x + 80),
				Math.mod(offset.y + game.timeScaled * fallspeed, game.resolution.y+160) - 80
				), 2,new Point(0,0), false, {"u_color" : raincolor}
			);
		}
		
		
		/*
		var carea = new Line(-96,-32,game.resolution.x+96,game.resolution.y+32);
		var space = 100;
		for(var i=0; i < 5; i++){
			var flip = Math.log(2)&1;
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.3,100).mod(carea),1,new Point(0,1), flip,{"scale":1.25,"u_color":[0.7,0.7,0.7,1.0]});
			
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.45,80).mod(carea),2,new Point(0,1), flip,{"scale":1.5,"u_color":[0.65,0.65,0.65,1.0]});
			
			g.renderSprite("bgclouds",new Point(i*space+this.time*0.7,40).mod(carea),3,new Point(0,1), flip,{"scale":1.7,"u_color":[0.6,0.6,0.6,1.0]});
		
		}
		*/
	},
	"pipes" : function(g,c){
		var scale = 0.25;
		var camera = new Point(
			(c.x * scale) % 240,
			(c.y * scale) % 240
		);
		for(var x=0; x < 3; x++) for(var y=0; y < 2; y++){
			g.renderSprite(
				"bgpipes",
				new Point(x*240,y*240).subtract(camera),
				-99,
				new Point(0,0),
				false
			);
		}
		g.renderSprite(
			"halo",
			new Point(game.resolution.x*0.5,40),
			-98,
			new Point(0,0),
			false,
			{
				"shader" : "halo",
				"scale" : 2.0,
				"u_color" : [1.0,0.4,0.8,0.1]
			}
		);
	},
	"cavefire" : function(g,c){
		var mapHeight = game.map.height * 16 - this.sealevel;
		
		var scale = Math.min(
			(592 - game.resolution.x) / (game.map.width * 16),
			(416 - game.resolution.y) / (game.map.height * 16)
		)
		
		g.renderSprite(
			"bgfirecave",
			new Point(0,0).subtract(c.scale(scale)),
			-99,
			new Point(0,0),
			false
		);
	},
	"firepit" : function(g,c){
		g.color = [0.2,0.12,0.1,1.0];
		g.scaleFillRect(0,0,game.resolution.x,game.resolution.y);
		
		Background.renderRepeatingTiles(g,"bgfirepit02",c.scale(-0.5),new Point(256,256),new Point(),1);
		
		/*
		if(_player.cameraLock.height() <= 240){
			Background.renderRepeatingTiles(g,"bgfirepit01",new Point(c.x*-0.7,0),new Point(256,0),new Point(),1);
			Background.renderRepeatingTiles(g,"bgfirepit01",new Point(c.x*-0.7,144),new Point(128,0),new Point(0,1),1);
		}
		*/
		
		//var _c = new Point(128-game.resolution.x*0.5, (c.y*0.7) % (240+96));
		//g.renderSprite("bgfirepit01", new Point(0,240).subtract(_c), 1, new Point(0,0));
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

Background.renderRepeatingTiles = function(g,sprite,position,dimensions,frame,zIndex){
	zIndex = zIndex != undefined ? 1 : zIndex;
	var h = 1;
	var w = 1;
	var x = position.x;
	var y = position.y;
	
	if(dimensions.x > 0){
		w = Math.ceil((game.resolution.x+dimensions.x) / dimensions.x);
		x = (position.x % dimensions.x);
	}
	if(dimensions.y > 0){
		h = Math.ceil((game.resolution.y+dimensions.y) / dimensions.y);
		y = (position.y % dimensions.y);
	}
	
	for(var i=0; i < w; i++) for(var j=0; j < h; j++) {
		var pos = new Point(x+dimensions.x*i, y+dimensions.y*j);
		g.renderSprite(sprite,pos,zIndex,frame);
	}
}