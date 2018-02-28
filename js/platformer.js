self.spriteWrap = {};

 /* platformer\airjet.js*/ 

Airjet.prototype = new GameObject();
Airjet.prototype.constructor = GameObject;
function Airjet(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.frame = new Point(0,31);
	
	this.active = true;
	this.power = 1.25;
	this.maxFallMultiplier = 0.75;
	this.minHeight = 128;
	this.inside = new Array();
	this.sync = 0;
	
	this.sleepTime = 0.0;
	this.wakeTime = 2.0 * Game.DELTASECOND;
	this.timer = 0.0;
	
	this.particles = new Array();
	for(var i=0; i < Math.min(this.width * this.height * 0.25 * Airjet.SQUR16X16, 24); i++){
		this.particles.push([
			this.position.x + Math.random() * this.width,
			this.position.y + Math.random() * this.height,
			Math.random() * 360
		])
	}
	
	if("power" in ops){
		this.power = ops["power"] * 1;
	}
	if("maxfall" in ops){
		this.maxFallMultiplier = ops["maxfall"] * 1;
	}
	if("minheight" in ops){
		this.minHeight = ops["minheight"] * 1;
	}
	if("sleeptime" in ops){
		this.sleepTime = ops["sleeptime"] * Game.DELTASECOND;
	}
	if("waketime" in ops){
		this.wakeTime = ops["waketime"] * Game.DELTASECOND;
	}
	if("sync" in ops){
		this.sync = 1;
		var synctime = Math.abs(ops["sync"] * Game.DELTASECOND) % (this.wakeTime+this.sleepTime);
		if(synctime > this.wakeTime){
			this.active = false;
			this.timer = this.sleepTime - (synctime - this.wakeTime);
		} else {
			this.active = true;
			this.timer = this.wakeTime - synctime;
		}
	}
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_rigidbody) && this.inside.indexOf(obj) < 0){
			this.inside.push(obj);
		}
	});
	
	//this.hoverLevel = this.position.y + (this.height - this.minHeight);
	this.hoverLevel = this.position.y;
}

Airjet.prototype.idle = function(){
	if(!this.sync){
		GameObject.prototype.idle.apply(this);
	}
}

Airjet.prototype.update = function(){
	if(this.sleepTime > 0){
		this.timer -= this.delta;
		if(this.timer <= 0){
			if(this.active){
				this.active = false;
				this.timer = this.sleepTime;
			} else {
				audio.play("gasstart", this.position.add(new Point(this.width*0.5,this.height)));
				this.active = true;
				this.timer = this.wakeTime;
			}
		}
	}
	
	if(this.active){
		for(var i=0; i < this.inside.length; i++){
			var obj = this.inside[i];
			var power = this.power;
			//obj.force.y = Math.min(obj.force.y - this.power * this.delta, this.maxFallMultiplier/this.power);
			
			if(obj instanceof Player && obj.states.downStab){
				power = power * 0.5;
			}
			
			if(obj.force.y < this.power * -5){
				//do nothing
			} else if(obj.position.y > this.hoverLevel){
				obj.force.y -= power * this.delta;
			} else if (obj.force.y > 0 ) { 
				obj.force.y -= power * this.delta * 0.75;
			} else {
				//obj.force.y -= power * this.delta * 0.75;
			}
			
			
		}
	}
	this.inside = new Array();
}

Airjet.prototype.render = function(g,c){
	if(this.active){
		for(var i=0; i < this.particles.length; i++){
			var p = this.particles[i];
			p[1] -= this.power * this.delta * 5;
			if(p[1] < this.position.y) {
				p[1] = this.position.y + this.height;
			}
			var opacity = Math.min(Math.pow((p[1]-this.position.y) / this.height, 0.25),1);
			var pos = new Point(p[0], p[1]);
			
			if(game.insideScreen(pos, 4)){
				g.renderSprite(
					game.map.tileset, 
					pos.subtract(c),
					this.zIndex,
					this.frame,
					false,
					{
						"u_color" : [1,1,1,opacity],
						"rotate":p[2]
					}
				);
			}
		}
	}
}
Airjet.SQUR16X16 = 0.00390625;

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
		
		if(_player.cameraLock.height() <= 240){
			Background.renderRepeatingTiles(g,"bgfirepit01",new Point(c.x*-0.7,0),new Point(256,0),new Point(),1);
			Background.renderRepeatingTiles(g,"bgfirepit01",new Point(c.x*-0.7,144),new Point(128,0),new Point(0,1),1);
		}
		
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

 /* platformer\block.js*/ 

Block.prototype = new GameObject();
Block.prototype.constructor = GameObject;
function Block(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.width = d[0];
	this.height = d[1];
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.gatherTiles();
}

Block.prototype.gatherTiles = function(eraseOriginalTiles=true){
	var ts = 16;
	this.tiles = new Array();
	this.tileWidth = Math.ceil(this.width / ts);
	this.tileHeight = Math.ceil(this.height / ts);
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tilePos = new Point(
				Math.roundTo(this.position.x + x*ts,ts),
				Math.roundTo(this.position.y + y*ts,ts)
			);
			var tile = game.getTile(tilePos.x, tilePos.y);
			this.tiles.push(tile);
			
			if(eraseOriginalTiles){
				game.setTile(tilePos.x, tilePos.y, game.tileCollideLayer, 0);
			}
		}
	}
}

Block.prototype.render = function(g,c){
	var i = 0;
	for(var x=0; x < this.tileWidth; x++){
		for(var y=0; y < this.tileHeight; y++){
			var tile = this.tiles[i];
			var ts = 16;
			
				
			if(tile > 0){
				let tileData = getTileData(tile);
				let t = tileData.tile-1;
				let f = tileData.hflip;
				
				var pos = new Point(
					this.position.x + (x + (f?1:0)) * ts,
					this.position.y + y * ts
				);
				
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(t%32,t/32),f);
			}
			i++;
		}
	}
}

EnemyBlock.prototype = new GameObject();
EnemyBlock.prototype.constructor = GameObject;
function EnemyBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.visible = false;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	this.blockCollideCriteria = function(obj){
		return (
			obj.hasModule(mod_rigidbody) &&
			obj.hasModule(mod_combat) &&
			obj.team == 0
		);
	}
}

SinkingBlock.prototype = new GameObject();
SinkingBlock.prototype.constructor = GameObject;
function SinkingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.originalPosition = new Point(this.position.x,this.position.y);
	this.maxy = this.maxy = ops.getFloat("maxy",Number.MAX_SAFE_INTEGER);
	this.width = d[0];
	this.height = d[1];
	this.speed = 0.25;
	this.force_y = 0.0;
	this.gravity = 0.0;
	this.sink = false;
	this.sinkOnLedge = ops.getBool("sinkonledge", true);;
	this.resetOnSleep = ops.getBool("resetonsleep", true);;
	this.resetOnDeath = ops.getBool("resetondeath", false);
	this.triggerType = ops.getInt("triggertype", 0);
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("gravity" in ops){
		this.speed = 0.0;
		this.gravity = ops["gravity"] * 1;
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
	this.on("player_death", function(){
		if(this.resetOnDeath){
			this.position.x = this.originalPosition.x;
			this.position.y = this.originalPosition.y;
			this.interactive = this.visible = true;
			this.sink = false;
		}
	});
	this.on(["collideLeft","collideRight"], function(obj){
		if(this.sinkOnLedge && obj instanceof Player){
			this.sink = true;
		}
	});
	this.on("activate", function(obj){
		if(this.triggerType == SinkingBlock.TRIGGERTYPE_DESTROY){
			this.destroy();
		} else if (this.triggerType == SinkingBlock.TRIGGERTYPE_SINK){
			this.sink = 1;
		}
		
	});
	this.on("blockLand", function(obj){
		if(obj instanceof Player){
			this.sink = true;
		}
	});
	if(this.resetOnSleep){
		this._sinkSleepTime = 0;
		this.on("wakeup", function(){
			if(this._sinkSleepTime <= game.time - 5){
				this.interactive = this.visible = true;
			}
			
		});
		this.on("sleep", function(){
			if(this.sink){
				this.position.x = this.originalPosition.x;
				this.position.y = this.originalPosition.y;
				this.sink = this.interactive = this.visible = false;
				this._sinkSleepTime = game.time;
			}
		});
	}
	
	this.gatherTiles();
}
SinkingBlock.prototype.update = function(){
	if(this.sink){
		this.force_y += this.gravity * this.delta;
		this.position.y += ( this.speed + this.force_y ) * this.delta;
		if(this.position.y >= this.maxy ){
			this.sink = 0;
			this.position.y = this.maxy;
		}
	} else {
		this.force_y = 0.0;
	}
}

SinkingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
SinkingBlock.prototype.render = Block.prototype.render;
SinkingBlock.TRIGGERTYPE_DESTROY = 0;
SinkingBlock.TRIGGERTYPE_SINK = 1;

FallingBlock.prototype = new GameObject();
FallingBlock.prototype.constructor = GameObject;
function FallingBlock(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.startPosition = new Point(this.position.x, this.position.y);
	this.width = d[0];
	this.height = d[1];
	this.force = new Point(0,0);
	this.gravity = 1.0;
	this.maxFall = 10.0;
	this.resetOnDeath = false;
	
	this.addModule(mod_block);
	
	ops = ops || {};
	
	if("resetondeath" in ops){
		this.resetOnDeath = ops["resetondeath"] * 1;
	}
	
	this.on("collideVertical", function(y){
		if(this.force.y >= this.maxFall){
			shakeCamera(Game.DELTASECOND*1.6,5);
			audio.play("explode1",this.position);
		}
		
		this.force.y = 0;
	});
	this.on("objectStuck", function(obj){
		if(obj.isStuck && obj.hasModule(mod_combat)){
			obj.invincible = -1;
			obj.hurt( this, Math.floor( 9999 ) );
		}
	});
	this.on("player_death", function(obj){
		if(this.resetOnDeath){
			this.force.x = this.force.y = 0;
			this.position.x = this.startPosition.x;
			this.position.y = this.startPosition.y;
		}
	});
	
	this.gatherTiles();
}

FallingBlock.prototype.idle = function(){}
FallingBlock.prototype.corners = function(){
	var b = GameObject.prototype.corners.apply(this);
	b.left += 1;
	b.right -= 1;
	return b;
}

FallingBlock.prototype.update = function(){
	this.force.y = Math.min(this.force.y + this.gravity * this.delta, this.maxFall);
	this.position.x = this.startPosition.x;
	game.t_move(this, this.force.x * this.delta, this.force.y * this.delta);
}
FallingBlock.prototype.shouldRender = function(){
	var c = this.corners();
	var l = new Line(c.left,c.top,c.right,c.bottom).transpose(game.camera.scale(-1));
	return l.overlaps(new Line(0,0,game.resolution.x,game.resolution.y));
}
FallingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
FallingBlock.prototype.render = Block.prototype.render;


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
	
	this.move = ops.getBool("autostart", false);
	this.loop = ops.getBool("loop", false);
	this.wait = ops.getFloat("wait", 0.0) * Game.DELTASECOND;
	this.sync = ops.getFloat("sync", 0,0);
	
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
	
	this.gatherTiles();
	
	this.time = this.startPosition.subtract(this.endPosition).magnitude() / this.speed;
	this.totalTime = this.time + this.wait;
}

MovingBlock.prototype.evaluate = function(f){
	let l = this.loop ? 2 : 1;
	let r = this.time / this.totalTime;
	
	if(f < 0.5 || !this.loop){
		return Math.clamp01(f * l) / r;
	} else {
		a = 1 + (1 / r);
		return Math.clamp01(a - (f * l) / r);
		//return a - Math.clamp01(f * l) / r;
	}
}
MovingBlock.prototype.idle = function(){
}

MovingBlock.prototype.update = function(){
	if(this.move){
		let a = (this.sync + game.timeScaled / this.totalTime) % 1.0;
		let d = Math.clamp01(this.evaluate(a));
		this.position = Point.lerp(this.startPosition, this.endPosition, d);
	}
	return;
	
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
MovingBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
MovingBlock.prototype.render = Block.prototype.render;

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
	
	this.gatherTiles();
}

FloatBlock.prototype.idle = function(){}

FloatBlock.prototype.update = function(){
	if(this.block_isOnboard(_player)){
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
FloatBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
FloatBlock.prototype.render = Block.prototype.render;

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
	
	this.gatherTiles();
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
LoopBlock.prototype.gatherTiles = Block.prototype.gatherTiles;
LoopBlock.prototype.render = Block.prototype.render;


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
	
	this.gatherTiles();
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
Crusher.prototype.gatherTiles = Block.prototype.gatherTiles;
Crusher.prototype.render = Block.prototype.render;

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
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.damageSlime = Spawn.damage(3,this.difficulty);
	
	this.defencePhysical = Spawn.defence(2, this.difficulty);
	this.defenceFire = Spawn.defence(-2, this.difficulty);
	this.defenceSlime = Spawn.defence(4, this.difficulty);
	
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
					obj.hurt(this, this.getDamage());
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
	this.moneyDrop = Spawn.money(40,this.difficulty);
	
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
	this.moneyDrop = Spawn.money(40,this.difficulty);
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
	this.moneyDrop = Spawn.money(40,this.difficulty);
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

class Garmr extends GameObject{
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 80;
		this.height = 112;
		this.sprite = "garmr";
		
		this.speed = 3.0;
		this.force = new Point();
		this.friction = 0.1;
		this.gotoPos = new Vector();
		this.start = new Point(x,y);
		
		this.active = false;
		this.closeToBoss = false;
		this.track = null;
		
		this.frame = new Point(0,0);
		
		this.fistPos = new Point(0,0);
		
		this.trackRay = {
			"position" : new Point(32,-28),
			"rotation" : 50,
			"length" : 300,
			"isOn" : false,
		}
		this.trackHead = {
			"position" : new Vector(x,y),
			"offset" : new Vector(0,-50,33),
			"rotation" : 0.0,
			"turnStrength" : 0.25,
			"scream" : false
		};
		this.trackChest = {
			"position" : new Vector(x,y),
			"scale" : 1.0,
			"rotation" : 0.0
		};
		this.trackBody = {
			"position" : new Vector(x,y),
			"rotation" : 0.0
		};
		this.trackUpperRightArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(-36,-20,-12),
			"rotation" : new Vector(0,0,0)
		};
		this.trackLowerRightArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(-36,-20,-12),
			"rotation" : 0.0
		};
		this.trackUpperLeftArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(36,-20,-12),
			"rotation" : new Vector(0,0,0)
		};
		this.trackLowerLeftArm = {
			"position" : new Vector(x,y),
			"offset" : new Vector(36,-20,-12),
			"rotation" : 0.0
		};
		
		this.addModule( mod_combat );
		this.addModule( mod_boss );
		
		ops = ops || new Options();
		
		if("trigger" in ops){
			this._tid = ops["trigger"];
		}
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(24,this.difficulty);
		this.mass = 5.0;
		this.damage = Spawn.damage(4,this.difficulty);
		
		this.moneyDrop = Spawn.money(40,this.difficulty);
		this.death_time = Game.DELTASECOND * 3;
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt");
			
			if(this.states.current == Garmr.STATE_BOLT){
				if(this.states.time < this.states.timeTotal * 0.7){
					let d = this.getDamage(0);
					d.light = Math.ceil(this.damage*0.6);
					obj.hurt(this, d);
				}
			}
			
		});
		this.on("hitWithRay", function(obj){
			if(obj instanceof Player){
				let d = this.getDamage(0);
				d.light = Math.ceil(this.damage);
				obj.hurt(this, d);
			}
		});
		this.on("death", function(){
			audio.play("kill");
			
			Item.drop(this,140);
			this.destroy();
		});
		this.on("downstabbed",function(obj,damage){
			if(this.states.current != Garmr.STATE_PUNCH){
				//this.setState(Garmr.STATE_PUNCH);
			}
		});
		this.on(["pre_death","player_death"],function(){
			//var bullets = game.getObjects(HomingBullet);
			var towers = game.getObjects(FlameTower);
			
			//for(var i=0; i < bullets.length;i++){
			//	bullets[i].destroy();
			//}
			for(var i=0; i < towers.length;i++){
				towers[i].destroy();
			}
			//for(var i=0; i < this.enemies.length;i++){
			//	this.enemies[i].destroy();
			//}
		});
		
		this.states = {
			"animation" : 0,
			"current" : Garmr.STATE_IDLE,
			"time" : 0.0,
			"timeTotal" :Game.DELTASECOND * 2,
			"count" : 0,
			"transition" : 0.0
		}
	}
	
	setState(s=0){
		this.states.current = s;
		if(s == Garmr.STATE_IDLE){
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 3;
		} else if(s == Garmr.STATE_PUNCH) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 3;
		} else if(s == Garmr.STATE_FIREBEAM) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 6;
		} else if(s == Garmr.STATE_BOLT) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 5;
		} else if(s == Garmr.STATE_UPPERCUT) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 2;
			this.states.count = 3;
		} else if(s == Garmr.STATE_MISSILE) {
			this.states.time = this.states.timeTotal = Game.DELTASECOND * 0.75;
			this.states.count = 3;
		}
	}
	
	fireball (amount, skiprandom){
	
		var bomb = new CarpetBomb(this.position.x, this.position.y);
		bomb.damageFire = this.damage;
		bomb.force = new Point(this.forward()*6, -8);
		game.addObject(bomb);
	}
	
	update(){
		if(this.life > 0 && this.active){
			
			this.states.time -= this.delta;
			let v = (game.timeScaled * 0.025) % 1;
			let p = 1 - this.states.time / this.states.timeTotal;
			
			let dir = this.position.subtract(_player.position);
			
			this.trackRay.isOn = false;
			
			if(this.states.current == Garmr.STATE_IDLE){
				//Move
				this.gotoPos.xy = _player.position.add(new Point(this.forward()*-76,-16));
				this.gotoPos.z = this.speed;
					
				this.states.animation = 0;
				this.animate(v);
				this.flip = dir.x > 0;
			} else if(this.states.current == Garmr.STATE_UPPERCUT){
				//Upper cutt
				if(p < 0.5){
					//Move under player
					this.gotoPos.xy = _player.position.add(new Point(this.forward()*-48,80));
					this.gotoPos.z = this.speed;
									
					this.states.animation = 1;
					this.animate(p*5);
				} else if(p < 0.7){
					this.gotoPos.xy = this.position.add(new Point(0,-20));
					this.gotoPos.z = this.speed*2;
					
					if(p > 0.57){
						this.strike(this.fistRect(16));
					}
					this.states.animation = 2;
					this.animate((p-0.5)*7);
				}else{
					this.gotoPos.z = 0;
					this.animate(1);
				}
			} else if(this.states.current == Garmr.STATE_PUNCH){
				//Punch
				if(p < 0.3){
					this.gotoPos.xy = _player.position.add(new Point(this.forward()*-64,24));
					this.gotoPos.z = this.speed;
					this.flip = dir.x > 0;
				} else if(p < 0.5){
					this.gotoPos.z = 0;
				} else if(p < 0.7){
					this.strike(this.fistRect(16));
					this.gotoPos.xy = this.position.add(new Point(this.forward()*20,0));
					this.gotoPos.z = this.speed * 2;
				}
				this.states.animation = 3;
				this.animate(p*3);
			} else if(this.states.current == Garmr.STATE_FIREBEAM){
				//Beam
				this.gotoPos.xy = this.start;
				this.gotoPos.z = this.speed;
				
				if(p < 0.5){
					this.states.animation = 4;
					this.animate(p*3);
				} else {
					let p2 = (p-0.5) * 2;
					this.trackRay.isOn = true;
					this.trackRay.length = 250 * Math.clamp01(p2*5);
					this.states.animation = 5;
					this.animate(p2*1.5);
					this.trackRay.rotation = Math.lerp(20,-30,p2);
				}
			} else if(this.states.current == Garmr.STATE_BOLT){
				this.gotoPos.xy = this.start;
				this.gotoPos.z = this.speed;
				
				if(Timer.interval(this.states.time,Game.DELTASECOND*0.5,this.delta)){
					let off = (Math.random()-0.5) * 470;
					let l = new LightningBolt(this.position.x+off, this.position.y-80);
					game.addObject(l);
				}
				
				this.states.animation = 6;
				this.animate(p*8);
			} else if(this.states.current == Garmr.STATE_MISSILE){
				//Missile
				this.gotoPos.x = this.position.x + this.forward()*-20;
				this.gotoPos.y = _player.position.y;
				this.gotoPos.z = this.speed * 0.5;
				this.flip = dir.x > 0;
				
				if(Timer.isAt(this.states.time, this.states.timeTotal*0.5,this.delta)){
					this.fireball();
				}
				
				if(p < 0.5){
					this.states.animation = 7;
					this.animate(p*3);
				} else {
					this.states.animation = 8;
					this.animate((p-0.5)*3);
				}
			}
			
			if(this.gotoPos.z > 0){
				let _s = this.gotoPos.z * this.delta;
				if(Math.abs(this.position.x - this.gotoPos.x) >= _s){
					this.force.x = this.gotoPos.z * (this.gotoPos.x > this.position.x ? 1 : -1);
				}
				if(Math.abs(this.position.y - this.gotoPos.y) >= _s){
					this.force.y = this.gotoPos.z * (this.gotoPos.y > this.position.y ? 1 : -1);
				}
			}
			this.position = this.position.add(this.force.scale(this.delta));
			this.force = this.force.scale(1-(this.friction*this.delta));
			
			//Detect if laser is hitting the player
			if(this.trackRay.isOn){
				let r = this.flip ? 180 - this.trackRay.rotation : this.trackRay.rotation;
				let rayPos = this.position.add(this.trackRay.position.flip(this.flip));
				let laserHitbox = new Line(
					rayPos,
					rayPos.add(new Point(this.trackRay.length,24))
				).toPolygon().rotate(r, rayPos);
				
				if(laserHitbox.intersects(_player.hitbox())){
					this.trigger("hitWithRay",_player)
				}
			}
			
			
			if(this.states.time <= 0 ){
				if(this.states.count > 0){
					this.states.count--;
					this.states.time = this.states.timeTotal;
				} else { 
					if(this.states.current == Garmr.STATE_IDLE){
						//this.setState(Garmr.STATE_BOLT);
						this.setState(Math.floor(Math.random() * 7));
					} else {
						this.setState(Garmr.STATE_IDLE);
					}
				}
				
			}
		} else {
			//Dying!!
		}
		
	}
	
	fistRect(radius=1){
		return new Line(
			this.fistPos.add(new Point(-1,-1).scale(radius)),
			this.fistPos.add(new Point(1,1).scale(radius))
		);
	}
	
	idle(){}
	
	animate(progress){
		//let progress = (game.timeScaled * 0.025) % 1;
		progress = Math.clamp01(progress);
		
		this.trackHead.scream = false;
		this.trackHead.turnStrength = 0.25;
		this.trackHead.offset = new Vector(0,-50,33);
		this.trackChest.scale = 1;
		
		if(this.states.animation == 0){
			//Idle
			let p = Math.sin(progress * Math.PI * 2);
			this.trackChest.scale = 1 + Math.sin(game.timeScaled * 0.05) * 0.03125;
			
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(2.40,0.78,0), p);
			this.trackLowerRightArm.rotation = Math.lerp(0.65,0.55, p);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.40,-0.78,0), p);
			this.trackLowerLeftArm.rotation = Math.lerp(0.65,0.55, p);
			
		} else if(this.states.animation == 1){
			//Wind up upper cut
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.6,0.40,0), new Vector(2.8,0.40,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.25,0.35, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.40,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(-0.1,-0.2, progress);
			this.trackHead.turnStrength = Math.lerp(0.25,0.1, progress);
		} else if(this.states.animation == 2){
			//Upper cut
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.8,0.30,0), new Vector(-0.75,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.35,-1.24, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.40,-0.78,0), new Vector(2.50,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(-0.2,0.75, progress);
			this.trackHead.turnStrength = Math.lerp(0.1,0.5, progress);
			this.fistPos = Point.lerp(new Point(48,100), new Point(64,-100), progress);
		} else if(this.states.animation == 3){
			//Punch
			this.trackHead.turnStrength = Math.lerp(0.1,0.5, progress);
			if(this.flip){
				this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.8,-0.30,0), new Vector(0.05,-0.30,0), progress);
				this.trackLowerLeftArm.rotation = Math.lerp(0.35,-0.24, progress);
				
				this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.40,0.78,0), new Vector(3.1,0.78,0), progress);
				this.trackLowerRightArm.rotation = Math.lerp(-0.2,0.75, progress);
			} else {
				this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.8,0.30,0), new Vector(0.05,0.30,0), progress);
				this.trackLowerRightArm.rotation = Math.lerp(0.35,-0.24, progress);
				
				this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.40,-0.78,0), new Vector(3.1,-0.78,0), progress);
				this.trackLowerLeftArm.rotation = Math.lerp(-0.2,0.75, progress);
			}
			this.fistPos = Point.lerp(new Point(-24,0), new Point(64,0), progress);
		} else if(this.states.animation == 4){
			//Fire charge
			this.trackChest.scale = Math.lerp(1,1.15,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-60,23), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.30,0), new Vector(2.8,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.65,0.1, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.3,0), new Vector(2.8,-0.30,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.65,0.1, progress);
		} else if(this.states.animation == 5){
			//Fire release
			this.trackHead.scream = true;
			this.trackChest.scale = Math.lerp(1.15,0.91,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-60,23), new Vector(0,-50,44), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.8,0.30,0), new Vector(2.35,0.30,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.1,1.6, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.8,-0.3,0), new Vector(2.35,-0.30,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.1,1.6, progress);
		} else if(this.states.animation == 6){
			//Bolt ready
			this.trackHead.scream = progress > 0.6;
			this.trackHead.turnStrength = Math.lerp(0.25,0.05,progress);
			this.trackChest.scale = Math.lerp(1.0,1.0,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-55,10), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(-1.5,0.3,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.64,-1.40, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.35,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.64,0.2, progress);
		} else if(this.states.animation == 7){
			//build fire
			this.trackHead.turnStrength = 0.25;
			this.trackHead.scream = true;
			this.trackChest.scale = Math.lerp(1.0,1.25,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-50,33), new Vector(0,-55,10), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.35,0.78,0), new Vector(2.3,0.75,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.64,0.1, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.35,-0.78,0), new Vector(2.3,-0.78,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.64,0.1, progress);
		} else if(this.states.animation == 8){
			//spit fire
			this.trackHead.turnStrength = 0.25;
			this.trackHead.scream = true;
			this.trackChest.scale = Math.lerp(1.25,0.93,progress);
			this.trackHead.offset = Vector.lerp(new Vector(0,-55,10), new Vector(0,-40,45), progress);
			this.trackUpperRightArm.rotation = Vector.lerp(new Vector(2.3,0.78,0), new Vector(2.8,0.7,0), progress);
			this.trackLowerRightArm.rotation = Math.lerp(0.1,0.75, progress);
			
			this.trackUpperLeftArm.rotation = Vector.lerp(new Vector(2.3,-0.78,0), new Vector(2.8,-0.7,0), progress);
			this.trackLowerLeftArm.rotation = Math.lerp(0.1,1.2, progress);
		}
	}
	
	render(g,c){
		this.trackHead.rotation = Math.lerp(this.trackHead.rotation, Math.PI * this.forward() * this.trackHead.turnStrength, this.delta*0.125);
		this.trackChest.rotation = Math.lerp(this.trackChest.rotation, this.trackHead.rotation, this.delta*0.25);
		this.trackBody.rotation = Math.lerp(this.trackBody.rotation, this.trackChest.rotation, this.delta*0.125);
		
		this.trackHead.position = new Vector(this.position.x, this.position.y, 0);
		this.trackChest.position = Vector.lerp(this.trackChest.position, this.position, this.delta*0.4);
		this.trackBody.position = Vector.lerp(this.trackBody.position, this.trackChest.position, this.delta*0.4);
		
		let offset = Vector.rotate(this.trackHead.offset,0,this.trackHead.rotation,0);
		let headModel = this.trackHead.scream ? "garmr_headscream" : "garmr_head";
		
		g.renderMesh(headModel, this.trackHead.position.add(offset).subtract(c), this.zIndex+3+0.001, {
			"rotate" : [0, this.trackHead.rotation, 0]
		});
		g.renderMesh("garmr_chest", this.trackChest.position.subtract(c), this.zIndex+3, {
			"rotate" : [0, this.trackChest.rotation, 0],
			"scale" : [this.trackChest.scale,this.trackChest.scale,this.trackChest.scale]
		});
		g.renderMesh("garmr_body", this.trackBody.position.subtract(c), this.zIndex+2, {
			"rotate" : [0, this.trackBody.rotation, 0]
		});
		
		
		this.trackUpperRightArm.offset.y = Math.lerp(0,-40,this.trackChest.scale-0.5);
		
		offset = Vector.rotate(this.trackUpperRightArm.offset,0,this.trackChest.rotation,0);
		let rightArmZOff = this.trackChest.rotation * 0.1;
		g.renderMesh("garmr_armupper", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+rightArmZOff, {
			"rotate" : [
				this.trackUpperRightArm.rotation.x, 
				this.trackUpperRightArm.rotation.y + this.trackChest.rotation, 
				this.trackUpperRightArm.rotation.z
			]
		});
		offset = this.trackUpperRightArm.offset.add(new Matrix4x4().rotate(
			this.trackUpperRightArm.rotation.x, 
			this.trackUpperRightArm.rotation.y + this.trackChest.rotation, 
			this.trackUpperRightArm.rotation.z
		).apply(Garmr.lowerArmOffset));
		g.renderMesh("garmr_armlower", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+rightArmZOff, {
			"rotate" : [
				this.trackLowerRightArm.rotation, 
				this.trackChest.rotation, 
				this.trackUpperRightArm.rotation.y
			]
		});
		
		
		this.trackUpperLeftArm.offset.y = Math.lerp(0,-40,this.trackChest.scale-0.5);
		
		offset = Vector.rotate(this.trackUpperLeftArm.offset,0,this.trackChest.rotation,0);
		let leftArmZOff = this.trackChest.rotation * -0.1;
		g.renderMesh("garmr_armupper", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+leftArmZOff, {
			"flip" : true,
			"rotate" : [
				this.trackUpperLeftArm.rotation.x, 
				this.trackUpperLeftArm.rotation.y + this.trackChest.rotation, 
				this.trackUpperLeftArm.rotation.z
			]
		});
		offset = new Vector(36,-20,40).add(new Matrix4x4().rotate(
			this.trackUpperLeftArm.rotation.x, 
			this.trackUpperLeftArm.rotation.y + this.trackChest.rotation, 
			this.trackUpperLeftArm.rotation.z
		).apply(Garmr.lowerArmOffset));
		g.renderMesh("garmr_armlower", this.trackChest.position.add(offset).subtract(c), this.zIndex+3+leftArmZOff, {
			"flip" : true,
			"rotate" : [
				this.trackLowerLeftArm.rotation, 
				this.trackChest.rotation, 
				this.trackUpperLeftArm.rotation.y
			]
		});
		
		//White Laser
		if(this.trackRay.isOn){
			let r = this.flip ? 180 - this.trackRay.rotation : this.trackRay.rotation;
			g.renderSprite("white",this.position.add(this.trackRay.position.flip(this.flip)).subtract(c),this.zIndex,new Point(),false,{
				"scalex":this.trackRay.length,
				"scaley":24,
				"rotate":r
			});
		} else if(this.states.current == Garmr.STATE_FIREBEAM){
			let p = 1 - this.states.time / this.states.timeTotal;
			let l = Math.lerp(Math.lerp(0,88,p*2), 0, p*2);
			let s = new Seed("skjnafdjn");
			for(let i=0; i<16;i++){
				let r = s.random() * 80 + Math.lerp(64,16,p*2);
				let a = Math.lerp(-0.8,0.8,i/16);
				a = this.flip ? Math.PI - a : a;
				let _c = Math.cos(a); 
				let _s = Math.sin(a);
				g.renderLine(
					new Point(_c,_s).scale(r).add(this.position.add(this.trackRay.position.flip(this.flip)).subtract(c)),
					new Point(_c,_s).scale(r+l).add(this.position.add(this.trackRay.position.flip(this.flip)).subtract(c)),
					1,
					[1,1,1,0.9]
				);
			}
		}
	}
}
Garmr.lowerArmOffset = new Vector(0,0,40);
Garmr.STATE_IDLE = 0;
Garmr.STATE_PUNCH = 1;
Garmr.STATE_UPPERCUT = 2;
Garmr.STATE_FIREBEAM = 3;
Garmr.STATE_BOLT = 4;
Garmr.STATE_MISSILE = 5;
self["Garmr"] = Garmr;

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
	this.moneyDrop = Spawn.money(40,this.difficulty);
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

 /* platformer\boss_lavasnake.js*/ 

LavaSnake.prototype = new GameObject();
LavaSnake.prototype.constructor = GameObject;
function LavaSnake(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 32;
	this.sprite = "lavasnake";
	this.active = false;
	
	this.addModule( mod_block );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.bossface_frame = 0;
	this.bossface_frame_row = 0;
	
	this.death_time = Game.DELTASECOND * 3;
	this.lifeMax = this.life = Spawn.life(26,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	
	this.force = new Point();
	this.friction = 0.02;
	this.speed = 0.1;
	
	this.states = {
		
	};
	
	this.tail = new Array();
	for(var i=0; i < 8; i++){
		var t = new LavaSnakeBody(x,y);
		this.tail.push(t);
		game.addObject(t);
		t.position.x += (i+1) * t.distance;
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
		}
		if(obj.hasModule(mod_rigidbody) && obj.isStuck){
			this.force.x *= -1;
			this.force.y *= -1;
		}
	});
	this.on("collideHorizontal", function(dir){
		this.force.x = -this.force.x;
	});
	this.on("collideVertical", function(dir){
		this.force.y = -this.force.y;
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
		
		for(var i=0; i < this.tail.length; i++){
			this.tail[i].destroy();
		}
	});
	this.calculateXP();
}
LavaSnake.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0 && this.active){
		var dirnormal = _player.position.subtract(this.position).normalize();
		
		this.force.x += dirnormal.x * this.delta * this.speed;
		this.force.y += dirnormal.y * this.delta * this.speed;
		
		game.t_move(this,this.force.x * this.delta,this.force.y * this.delta);
		this.force = this.force.scale(1.0 - this.friction * this.delta);
		
		this.updatetail();
	}
}
LavaSnake.prototype.idle = function(){}

LavaSnake.prototype.updatetail = function(){
	for(var i=0; i < this.tail.length; i++){
		var head = i > 0 ? this.tail[i-1] : this;
		var t = this.tail[i];
		var dir = t.position.subtract(head.position).normalize(t.distance);
		t.position = head.position.add(dir);
	}
}

LavaSnakeBody.prototype = new GameObject();
LavaSnakeBody.prototype.constructor = GameObject;
function LavaSnakeBody(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 32;
	this.sprite = "lavasnake";
	this.active = false;
	this.frame.x = 0;
	this.frame.y = 1;
	
	this.addModule( mod_block );
	this.parentPart = false;
	this.distance = 48;
}	

 /* platformer\boss_marquis.js*/ 

Marquis.prototype = new GameObject();
Marquis.prototype.constructor = GameObject;
function Marquis(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 40;
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
	
	this.times = {
		"attack1" : Game.DELTASECOND * 1.5,
		"attack2" : Game.DELTASECOND * 1.0,
		"turn" : Game.DELTASECOND * 1.2,
		"cooldown" : Game.DELTASECOND * 3.0,
		"rage" : 3
	};
	
	this.states = {
		"attack" : 0,
		"pose" : 0,
		"cooldown" : this.times.cooldown,
		"turn" : 0.0,
		"direction" : 1,
		"rage" : 0
	}
		
	this.life = this.lifeMax = Spawn.life(24,this.difficulty);
	this.mass = 4.0;
	this.damage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
	this.death_time = Game.DELTASECOND * 3;
	
	this.guard.active = true;
	this.guard.omidirectional = true;
	this.guard.y = -16;
	this.guard.h = 48;
	this.guard.x = -24;
	this.guard.w = 48;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", EnemyStruck);
	this.on("critical", function(){
		//this.states.attack = 0;
		//this.states.cooldown = this.attack_times.warm;
	});
	this.on("struckTarget", function(){
		//this.states.attack = 0;
		//this.states.cooldown = this.attack_times.warm;
	});
	this.on("hurt", function(){
		audio.play("hurt");
		this.states.cooldown -= Game.DELTASECOND * 0.5;
		if(Math.random() > 0.6){
			var dir = this.position.subtract(_player.position);
			this.states.direction = dir.x > 0 ? 1 : -1;
		}
	});
	this.on("activate", function(){
		var dir = this.position.subtract(_player.position);
		this.states.direction = dir.x > 0 ? -1 : 1;
	});
	this.on("blocked", function(obj){
		if(obj.hasModule(mod_rigidbody)){
			obj.force.x += this.forward() * 13.5;
		}
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
		audio.play("kill");
		Item.drop(this);
		this.destroy();
	});
	this.on("player_death", function(){
		this.states["attack"] = 0;
		this.states["pose"] = 0;
		this.states["cooldown"] = this.times.cooldown;
	});
	this.calculateXP();
}
Marquis.prototype.update = function(){	
	this.sprite = "megaknight";
	if ( this.life > 0 && this.active) {
		var dir = this.position.subtract( _player.position );
				
		if( this.states.attack > 0 ) {
			if(this.states.pose){
				//low
				var progress = 1 - (this.states.attack / this.times.attack2);
				this.frame = Marquis.anim_attack2.frame(progress);
				if(this.frame.y >= 1 && this.frame.y <= 2 ){
					this.strike(Marquis.line_attackdown);
				}
			} else {
				//high
				var progress = 1 - (this.states.attack / this.times.attack1);
				this.frame = Marquis.anim_attack1.frame(progress);
				
				if(this.frame.y >= 3){
					this.strike(Marquis.line_attackup);
				}
			}
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				if(this.states.pose){
					this.states.pose = 0;
				} else {
					
				}
			}
		} else if( this.states.turn > 0 ) {
			var progress = 1 - (this.states.turn / this.times.turn);
			this.frame = Marquis.anim_turn.frame(progress);
			this.states.turn -= this.delta;
			this.states.pose = 1;
		} else {
			if(this.states.pose){
				this.frame.x = 0;
				//this.frame.y = 4;
				this.frame.y = Math.max((this.frame.y+Math.abs(this.force.x)*this.delta*0.2)%8,4);
			} else {
				this.frame.x = 0;
				//this.frame.y = 0;
				this.frame.y = Math.max((this.frame.y+Math.abs(this.force.x)*this.delta*0.2)%4,0);
			}
			
			if(this.states.direction > 0){
				this.force.x += this.states.direction * this.speed * this.delta;
				if(this.position.x - this.start_x > 120){
					this.states.direction = -1;
				}
			} else {
				this.force.x += this.states.direction * this.speed * this.delta;
				if(this.position.x - this.start_x < -120){
					this.states.direction = 1;
				}
			}
			
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			
			//Change state
			if(this.states.cooldown <= 0){
				if(this.states.pose){
					this.states.attack = this.times.attack2;
				} else {
					if(Math.random() > 0.6){
						this.states.turn = this.times.turn;
					} else {
						this.states.attack = this.times.attack1;
					}
				}
				if(this.states.rage > 0){
					this.states.rage--;
				} else {
					this.states.cooldown = this.times.cooldown;
					var rageChange = 0.2 + (this.life/this.lifeMax) * 0.3;
					if(Math.random() < rageChange){
						this.states.rage = this.times.rage;
					}
				}
			}
		}
	}
}

Marquis.anim_attack1 = new Sequence([
	[1,0,0.1],
	[1,1,0.5],
	[1,2,0.06],
	[1,3,0.1],
	[1,4,0.1],
	[1,5,0.5]
]);
Marquis.anim_attack2 = new Sequence([
	[3,0,0.5],
	[3,1,0.1],
	[3,2,0.1],
	[3,3,0.1],
	[3,4,0.1]
]);
Marquis.anim_turn = new Sequence([
	[2,0,0.1],
	[2,1,0.1],
	[2,2,0.1],
	[2,3,0.1],
	[2,4,0.1],
	[2,5,0.1],
	[2,6,0.5]
]);
Marquis.line_attackup = new Line(16,6,88,10);
Marquis.line_attackdown = new Line(16,28,64,32);

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
	this.moneyDrop = Spawn.money(40,this.difficulty);
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
		audio.play("hurt", this.position);
	});
	this.on("death", function(){
		
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
	
	this.defencePhysical = Spawn.defence(1, this.difficulty);
	this.defenceFire = Spawn.defence(0, this.difficulty);
	this.defenceSlime = Spawn.defence(1, this.difficulty);
	this.defenceIce = Spawn.defence(-1, this.difficulty);
	this.defenceLight = Spawn.defence(-1, this.difficulty);
	
	this.damage = Spawn.damage(4,this.difficulty);
	this.landDamage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(40,this.difficulty);
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
		audio.play("hurt", this.position);
	});
	this.on("downstabbed", function(obj,damage){
		if(
			this.states.current == Poseidon.IDLE_STATE ||
			this.states.current == Poseidon.TOSS_STATE ||
			this.states.current == Poseidon.FIRE_STATE ||
			this.states.current == Poseidon.BASH_STATE
		){
			if(Math.random() < 0.6){
				this.setState(Poseidon.ESCAPE_STATE);
			} else {
				this.setState(Poseidon.JUMP_STATE);
			}
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
		this.states.transition = this.states.transitionTotal = 1.0 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.6 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.BASH_STATE){
		this.states.transition = this.states.transitionTotal = 0.5 * Game.DELTASECOND;
		this.states.timer = this.states.timerTotal = 0.5 * Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(s == Poseidon.RUSH_STATE){
		this.states.transition = this.states.transitionTotal = 0.6 * Game.DELTASECOND;
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
					var bullet = new Bullet(this.position.x, this.position.y+8);
					bullet.team = 0;
					bullet.blockable = 1;
					bullet.force.x = this.forward() * 12;
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
					var bullet = new Bullet(this.position.x, this.position.y);
					bullet.team = 0;
					bullet.frames = [5,6,7];
					bullet.frame.y = 1;
					bullet.force.x = this.forward() * 6;
					bullet.blockable = 0;
					bullet.damage = Math.round(this.damage*1.5);
					bullet.explode = true;
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
					this.strike(new Line(16,-8,64,24), {"blockable":false});
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
	this.moneyDrop = Spawn.money(40,this.difficulty);
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
		audio.play("hurt", this.position);
		if( Math.random() > 0.2 ) {
			this.states.guardUpdate = Game.DELTASECOND * 2.0;
			this.states.guard = _player.states.duck ? 1 : 2;
		}
	});
	this.on("death", function(){
		Item.drop(this,40);
		
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

 /* platformer\buffs.js*/ 

function Buff(){
	this.time = Game.DELTASECOND;
	this.negative = false;
	this.user = null;
}

//Positive

BuffStrength.prototype = new Buff();
BuffStrength.prototype.constructor = Buff;
function BuffStrength(){
	this.constructor();
	this.negative = false;
	this.additional = 0;
	this.multiplier = 1.5;
	this.time = Game.DELTASECOND * 45;
}
BuffStrength.prototype.prehurt_other = function(damage, target){
	return damage * this.multiplier + this.additional;
}
BuffStrength.prototype.render = function(g,c){
	if(this.user instanceof Player){
		this.user.renderWeapon(g,c,{
			"shader":"item",
			"u_frameSize" : [32,64],
			"u_pixelSize" : 256,
			"u_color":[1.0,0.5,0.0,1.0]
		});
	}
	return g;
}

BuffFireDamage.prototype = new Buff();
BuffFireDamage.prototype.constructor = Buff;
function BuffFireDamage(){
	this.constructor();
	this.negative = false;
	this.damage = 5;
	this.time = Game.DELTASECOND * 45;
}
BuffFireDamage.prototype.prehurt_other = function(damage, target){
	return damage + this.damage;
}
BuffFireDamage.prototype.blocked = function(damage, target){
	target.life -= this.damage;
	target.displayDamage(this.damage);
	target.isDead();
	return damage;
}
BuffFireDamage.prototype.render = function(g,c){
	this.user.renderWeapon(g,c,null,{
		"shader":"item",
		"u_frameSize" : [112,48],
		"u_pixelSize" : 256,
		"u_color":[1.0,0.5,0.0,1.0]
	});
	return g;
}

BuffMagicShield.prototype = new Buff();
BuffMagicShield.prototype.constructor = Buff;
function BuffMagicShield(){
	this.constructor();
	this.negative = false;
	this.absorb = 0.2;
	this.time = Game.DELTASECOND * 120;
}
BuffMagicShield.prototype.hurt = function(damage, attacker){
	if(this.user instanceof Player){
		var maxreduction = this.user.mana * (1 + this.absorb);
		if(damage > maxreduction){
			this.user.mana = 0;
			damage = Math.floor(Math.max(damage - this.user.mana * (1+this.absorb),0));
			this.time = 0;
		} else {
			this.user.mana = Math.floor(Math.max(this.user.mana - damage * (1-this.absorb),0));
			damage = 0;
			audio.play("barrier",this.user.position);
		}
	}
	return damage;
}
BuffMagicShield.prototype.render = function(g,c){
	g.renderSprite(
		this.user.sprite,
		this.user.position.subtract(c),
		this.user.zIndex,
		this.user.frame,
		this.user.flip,
		{
			"shader":"item",
			"u_frameSize" : [64,64],
			"u_pixelSize" : 1024,
			"u_color":[0.5,0.8,1.0,1.0]
		}
	)
	return g;
}

BuffLifeleech.prototype = new Buff();
BuffLifeleech.prototype.constructor = Buff;
function BuffLifeleech(){
	this.constructor();
	this.negative = false;
	this.percentage = 0.05;
	this.time = Game.DELTASECOND * 5;
}
BuffLifeleech.prototype.hurt_other = function(damage, target){
	var finalDamage = Math.max(Math.min(target.life+damage,damage),0);
	var l = Math.floor(finalDamage * this.percentage);
	this.user.life = Math.min(this.user.life + l, this.user.lifeMax);
	return damage;
}

//Debuffs

BuffPoison.prototype = new Buff();
BuffPoison.prototype.constructor = Buff;
function BuffPoison(){
	this.constructor();
	this.negative = true;
	this.speed = Game.DELTASECOND * 1.0;
	this.time = Game.DELTASECOND * 12;
	this.damage = 1;
}
BuffPoison.prototype.update = function(){
	if(Timer.interval(this.time,this.speed,game.delta)){
		var c = this.user.corners();
		var pos = new Point(c.left + Math.random()*this.user.width, c.top + Math.random()*this.user.height);
		var effect = new EffectStatus(pos.x,pos.y);
		effect.frame.x = 1;
		game.addObject(effect);
		
		this.user.displayDamage(this.damage);
		this.user.life -= this.damage;
		this.user.isDead();
	}
}

 /* platformer\bullet.js*/ 

Bullet.prototype = new GameObject();
Bullet.prototype.constructor = GameObject;
function Bullet(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.rotation = undefined;
	this.width = 10;
	this.height = 6;
	this.blockable = true;
	this.ignoreInvincibility = false;
	this.explode = false;
	this.range = 512;
	this.wallStop = true;
	
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
	this.pushable = false;
	
	this.on("collideObject", Bullet.hit);
	this.on("collideVertical", function(dir){ if(this.wallStop){ this.trigger("death"); } });
	this.on("collideHorizontal", function(dir){ if(this.wallStop){ this.trigger("death"); } });
	this.on("sleep", function(){ this.trigger("death"); });
	this.on("death", function(){ this.destroy(); });
	this.on("hurt_other", function(obj, damage){
		if(this.explode){
			game.addObject(new EffectBang(this.position.x, this.position.y));
			this.explode = false;
		}
	});
	this.on("struck", function(obj){ 
		if(this.blockable && obj.team!=this.team) {
			this.trigger("deflect");
			this.trigger("death");
			audio.play("block");
			game.slow(0,Game.DELTAFRAME30);
		}
	});
	
	this.team = 0;
	
	this.damage = 10;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
	this.light = false;
	this.lightColor = [1,1,1,1];
}
Bullet.prototype.setDeflect = function(){
	this.on("deflect", function(){
		var rag = new Ragdoll(this.position.x, this.position.y);
		rag.width = rag.height = 12;
		rag.sprite = this.sprite;
		rag.frame = this.frame;
		rag.rotationSpeed = 3.0;
		game.addObject(rag);
	});
}
Bullet.prototype.update = function(){
	this.trigger("preupdate");
	this.range -= this.force.length() * this.delta;
	if(this.rotation == undefined){
		this.flip = this.force.x < 0;
	}
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
	if(this.light){
		Background.pushLight( this.position, this.light, this.lightColor );
	}
}

Bullet.hit = function(obj){
	if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
		if( !this.blockable || !obj.hasModule(mod_combat) ) {
			if(this.ignoreInvincibility){
				obj.invincible = 0.0;
			}
			obj.hurt( this, Combat.getDamage.apply(this) );
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
				obj.trigger("block",this,this.bounds(),this.damage);
			} else {
				if(this.ignoreInvincibility){
					obj.invincible = 0.0;
				}
				this.trigger("hurt_other",obj);
				obj.hurt( this, Combat.getDamage.apply(this) );
			}
			
		}
		this.trigger("death");
	}
}
Bullet.prototype.render = function(g,c){
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"rotate" : this.rotation || 0
		}
	)
}
Bullet.createFireball = function(x,y,ops){
	ops = ops || {};
	var bullet = new Bullet(x,y);
	bullet.blockable = 0;
	bullet.frames = [5,6,7];
	bullet.frame.y = 1;
	bullet.explode = true;
	bullet.light = 56;
	bullet.lightColor = COLOR_FIRE;
	bullet.damage = 0;
	bullet.damageFire = 10;
	if("team" in ops){
		bullet.team = ops.team * 1;
	}
	if("damage" in ops){
		bullet.damageFire = ops.damage * 1;
	}
	return bullet;
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
	
	this.damage = 10;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
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
	this.pushable = false;
	this.zIndex = 5;
	
	this.damage = 0;
	this.damageFire = 8;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.addModule( mod_rigidbody );
	
	this.sprite = "bullets";
	this.frame.x = 0;
	this.frame.y = 3;
	this.life = Game.DELTASECOND * 8;
	this.mass = 0;
	this.friction = 1.0;
	this.physicsLayer = physicsLayer.particles;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("struck", function(obj, pos, damage){
		if( obj instanceof Player ) {
			this.life = 0;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		
		if( obj.hurt instanceof Function ) {
			this.life = 0;
			obj.hurt( this, Combat.getDamage.apply(this) );
		}
	});
	this.on("death", function(){
		game.addObject(new EffectSmoke(this.position.x, this.position.y));
		this.destroy();
	});
}
Fire.prototype.update = function(){
	Background.pushLight( this.position, 48, [1,0.8,0,1] );
	
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
function ExplodingEnemy(x,y, d, ops){
	this.constructor();
	ops = ops || {};
	
	this.position.x = x;
	this.position.y = y;
	this.startPos = new Point(x,y);
	this.width = 24;
	this.height = 24;
	this.team = 1;
	
	this.damage = ops.damage || 0;
	this.speed = ops.speed || 20;
	this.sprite = ops.sprite || "bullets";
	this.frame = ops.frame || new Point(0,0);
	this.flip = ops.flip || false;
	this.filter = ops.filter || "hurt";
	this.direction = ops.direction || new Point(1,0);
	
	this.addModule( mod_rigidbody );
	
	this.gravity = 0.1;
	this.friction = 0;
	this.pushable = false;
	this.launch = false;
	this.force = this.direction.normalize(this.speed);
	
	this.life = Game.DELTASECOND * 0.5;

	this.on("collideVertical", function(obj){ this.life = 0; });
	this.on("collideHorizontal", function(obj){ this.life = 0; });
		
	this.on("collideObject", function(obj){
		if( this.launch && obj.hurt instanceof Function && this.team != obj.team ) {
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
ExplodingEnemy.prototype.render = function(g,c){
	let midPoint = this.position.add(this.startPos).scale(0.5);
	let lengthPoint = this.position.subtract(this.startPos);
	let distance = lengthPoint.length();
	let height = (this.life / (Game.DELTASECOND * 0.5)) * 24;
	let rotate = (Math.atan2(lengthPoint.y,lengthPoint.x)/ Math.PI) * 180;
	
	g.renderSprite("halo",midPoint.subtract(c),this.zIndex,new Point(),false,{"scalex":distance/240,"scaley":height/240,"rotate":rotate});
	GameObject.prototype.render.apply(this,[g,c]);
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


class CarpetBomb extends GameObject{
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.height = 12;
		this.width = 12;
		this.sprite = "bullets";
		this.frame = new Point(5,1);
		
		this.damage = 0;
		this.damageFire = 10;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		
		this.addModule(mod_rigidbody);
		this.gravity = 0.4;
		this.pushable = false;
		this.friction = 0.02;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt(this);
				game.addObject(new EffectBang(this.position.x, this.position.y));
				this.destroy();
			}
		});
		this.on("collideHorizontal", function(h){
			//Hit wall, explode into flames
			this.burst();
			this.destroy();
		});
		this.on("collideVertical", function(v){
			if(v > 0){
				//Hit floor, spread fire
				this.spread();
				this.destroy();
			} else {
				this.burst();
				this.destroy();
			}
		});
		this.on("sleep",function(){
			this.destroy();
		});
	}
	
	spread(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
		
		for(let i=0; i < 3; i++){
			for(let j=0; j < 2; j++){
				let offset = (j > 0 ? -1 : 1) * (i+0.5) * 32;
				var ftower = new FlameTower(this.position.x + offset, this.position.y);
				ftower.damageFire = this.damageFire;
				ftower.time = Game.DELTASECOND * i * -0.2;
				game.addObject(ftower);
			}
		}
	}
	
	burst(){
		game.addObject(new EffectBang(this.position.x, this.position.y));
		
		for(let i=0; i < 6; i++){
			var fire = new Fire(this.position.x, this.position.y);
			fire.force = new Point(Math.random(), Math.random()).normalize(6);
			game.addObject(fire);
		}
	}
	
	render(g,c){
		let rot = Math.atan2(this.force.y, this.force.x) * Math.rad2deg;
		this.frame.x = 5 + (game.time*0.5) % 3;
		
		g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{
			"rotate" : rot
		});
	}
}
self["CarpetBomb"] = CarpetBomb;

FlameTower.prototype = new GameObject();
FlameTower.prototype.constructor = GameObject;
function FlameTower(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 32;
	this.time = 0;
	
	this.damage = 0;
	this.damageFire = 10;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.flameHeight = 88;
	
	this.timers = {
		"wait" : Game.DELTASECOND * 0.0,
		"active" : Game.DELTASECOND * 0.5,
		"destroy" : Game.DELTASECOND * 0.9
	};
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.time > this.timers.active) {
			obj.hurt(this,Combat.getDamage.apply(this));
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
		Background.pushLight( this.position, 64*Math.sin(Math.PI*prog), COLOR_FIRE );
	} else {
		var prog = Math.min((this.time-this.timers.active)/(this.timers.destroy-this.timers.active) ,1);
		var preh = this.height;
		this.height = this.flameHeight * Math.min(prog*1.5,1);
		this.rigidbodyActive = false;
		this.position.y -= 0.5 * (this.height-preh);
		Background.pushLight( this.position, this.height*2, COLOR_FIRE );
	}
	if(this.time > this.timers.destroy){
		this.destroy();
	}
}
	
FlameTower.prototype.render = function(g,c){
	if(this.time > this.timers.wait){
		var w = 0;
		var h = 0;
		if(this.time < this.timers.active){
			var prog = Math.min((this.time-this.timers.wait)/(this.timers.active-this.timers.wait) ,1);
			w = 1.5 * this.width * prog;
			h = 16 * (1 - prog);
		} else {
			//active
			w = this.width;
			h = this.height;
		}
		
		g.renderSprite(
			"effect_fire",
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"shader" : "fire",
				"u_time" : game.timeScaled * 0.01,
				"scalex" : w / 64,
				"scaley" : h / 64,
			}
		)
	} 
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
			this.activate(obj);
		}
	});
}

Checkpoint.prototype.activate = function(obj){
	//Deativate all other points
	var allpoints = game.getObjects(Checkpoint);
	for(var i=0; i < allpoints.length; i++){
		allpoints[i].activated = false;
	}
	
	this.activated = true;
	obj.heal = obj.lifeMax;
	obj.manaHeal = obj.manaMax;
	audio.play("item1");
	game.slow(0,Game.DELTASECOND*0.3333);
	
	Checkpoint.saveState(obj);
}

Checkpoint.saveState = function(obj){
	obj.checkpoint.x = obj.position.x;
	obj.checkpoint.y = obj.position.y;
	
	Checkpoint.state.money = obj.money;
	
	WorldLocale.save();
}
Checkpoint.loadState = function(obj){
	obj.position.x = obj.checkpoint.x ;
	obj.position.y = obj.checkpoint.y ;
	obj.money = Checkpoint.state.money;
}

Checkpoint.state = {
	"money" : 0
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

 /* platformer\chest.js*/ 

Chest.prototype = new GameObject();
Chest.prototype.constructor = GameObject;
function Chest(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "chests";
	
	this.isOpen = 0;
	this.empty = 0;
	
	this.startFrame = new Point(0,0);
	this.openTime = Game.DELTASECOND * 1.1;
	this.spawnTime = 0.0;
	
	this.money = 50;
	this.items = new Array();
	
	
	if("id" in ops) {
		this.chest_id = "chest_" + ops["id"];
		if(NPC.get(this.chest_id)){
			this.isOpen = true;
			this.empty = true;
		}
	}
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("money" in ops){
		this.money = ops["money"] * 1;
	}
	if("items" in ops){
		this.items = ops["items"].split(",");
	}
	
	this.on("struck", function(obj){
		if(obj instanceof Player){
			this.open();
		}
	});
	
	this.on("activate", function(){
		this.open();
	});
}

Chest.prototype.open = function(){
	if(this.chest_id){
		NPC.set(this.chest_id, 1);
	}
	if(!this.isOpen){
		audio.play("open", this.position);
	}
	this.isOpen = true;
}
Chest.prototype.update = function(){
	if(this.isOpen){
		if(!this.empty){
			if(this.openTime > 0){
				var progress = 1 - (this.openTime / (Game.DELTASECOND * 1.1));
				this.frame.x = this.startFrame.x + Chest.anim_open.frame(progress).x;
				this.frame.y = this.startFrame.y;
				this.openTime -= this.delta;
			} else {
				this.frame.x = this.startFrame.x + 3;
				this.frame.y = this.startFrame.y;
				
				if(this.spawnTime <= 0){
					if(this.money > 0){
						var coin;
						if(this.money >= 10 && Math.random() > 0.4){
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_3"} );
							this.money -= 10;
						} else if (this.money >= 5 && Math.random() > 0.4){
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_2"} );
							this.money -= 5;
						} else {
							coin = new Item( this.position.x, this.position.y, false, {"name":"coin_1"} );
							this.money -= 1;
						}
						coin.force.y = -5.0; coin.force.x = -3 + Math.random() * 6;
						game.addObject(coin);
					} else if(this.items.length > 0){
						var itemName = this.items.pop();
						var item = new Item( this.position.x, this.position.y, false, {"name":itemName} );
						item.gravity = 1.0;
						item.force.y = -5.0; item.force.x = -3 + Math.random() * 6;
						game.addObject(item);
					} else {
						this.empty = true;
					}
					this.spawnTime = Game.DELTAFRAME30 * 2;
				} else {
					this.spawnTime -= this.delta;
				}
			}
		} else {
			this.frame.x = this.startFrame.x + 3;
			this.frame.y = this.startFrame.y;
			//Do nothing
		}
	}
}
Chest.anim_open = new Sequence([
	[0,0,0.1],
	[1,0,0.1],
	[2,0,0.1],
	[3,0,0.6],
]);

 /* platformer\cornerstone.js*/ 

CornerStone.prototype = new GameObject();
CornerStone.prototype.constructor = GameObject;
function CornerStone(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 96;
	this.gateNumber = 0;
	this.broken = 0;
	
	this.play_fanfair = false;
	this.current_music = false;
	
	if("gate" in options){
		this.gateNumber = options["gate"] * 1;
	}
	
	this.npcvarname = "templegate_" + this.gateNumber;
	this.broken = NPC.get(this.npcvarname);
	this.interactive = !this.broken;
	
	
	this.frame.x = this.broken ? 2 : 0;
	this.frame.y = this.gateNumber - 1;
	
	this.active = false;
	this.progress = 0.0;
	
	this.on("struck",function(obj,pos,damage){
		if( !this.broken && !this.active && obj instanceof Player ) {
			this.current_music = audio.get("music");
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
			//ga("send","event","cornerstone","completed temple:"+dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : 1024;
	this.fillTiles(tile);
	
	this.addModule(mod_combat);
}
CornerStone.prototype.fillTiles = function(tile){
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
			-32 + this.position.x + _x,
			-48 + this.position.y + _y,
			game.tileCollideLayer, 
			tile
		);
	}
}

CornerStone.prototype.update = function(){
	if( this.active && !this.broken ) {
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
			
			
			//For demo only
			if(this.gateNumber >= 4){
				game.clearAll();
				game.addObject(new DemoThanks(0,0));
				
			} else {
				NPC.set(this.npcvarname, 1);
				//WorldLocale.loadMap("townhub.tmx");
				this.fillTiles(0);
				this.broken = 1;
				this.interactive = 0;
				
				if(this.current_music){
					audio.playAs(this.current_music, "music");
				}
			}
			
			//WorldMap.open()
		}
		
		this.progress += game.deltaUnscaled;
	}
}
CornerStone.prototype.idle = function(){}

 /* platformer\crane.js*/ 

class Crane extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.width = d[0];
		this.height = d[1];
		
		this.position.x = x - this.width * 0.5;
		this.position.y = y - this.height * 0.5;
		this.origin = new Point();
		
		this.on("ontop", function(obj){
			if(obj.hasModule(mod_rigidbody)){
				this.force.x += obj.force.x * obj.friction * this.forceTransfer * this.delta;
			}
		});
		
		this.on(["collideLeft","collideRight"], function(obj){
			if(obj.hasModule(mod_rigidbody)){
				this.force.x += obj.force.x * this.delta;
			}
		});
		
		this.addModule(mod_block);
		
		this.tension = 1.0;
		this.gravity = 1.0;
		this.forceTransfer = 0.375;
		this.friction = new Point(0.05, 0.01);
		this._progress = 0.0;
		
		this.force = new Point();
		
		this.move = ops.getBool("autostart", false);
		this.loop = ops.getBool("loop", true);
		this.wait = ops.getBool("wait", 0.0) * Game.DELTASECOND;
		this.radius = ops.getFloat("radius", 180.0);
		this.speed = ops.getFloat("speed", 1.0);
		this.sync = ops.getFloat("sync", 0.0);
		
		if("trigger" in ops){
			this._tid = ops.trigger;
		}
		this.on("activate", function(obj){
			this.move = 1;
		});
		
		
		this.start = this.position.add(new Point(0, -this.radius));
		this.finish = this.position.add(new Point(0, -this.radius));
		this.finish.x += ops.getFloat("movex", 0.0);
		this.finish.y += ops.getFloat("movey", 0.0);
		
		this.current = Point.lerp(this.start, this.finish, this.sync);
		this.distance = this.start.subtract(this.finish).magnitude();
		this.time = this.distance / this.speed;
		this.totalTime = this.time + this.wait;
	}
	idle(){}
	
	
	update(){
		if(this.move){
			let a = (this.sync + game.timeScaled / this.totalTime) % 1.0;
			let d = Math.clamp01(MovingBlock.prototype.evaluate.apply(this,[a]));
			//this.position = Point.lerp(this.startPosition, this.endPosition, d);
			this.current = Point.lerp(this.start, this.finish, d);
			
			//this._progress = Math.mod( (game.timeScaled * this.speed) / this.distance, 2);
			
		}
		
		//let p = this._progress < 1 ? this._progress : (2 - this._progress);
		//this.current = Point.lerp(this.start, this.finish, p);
		
		//Apply friction
		this.force = this.force.scale(new Point(1,1).subtract(this.friction.scale(this.delta)));
		//Apply gravity
		this.force.y += this.gravity * this.delta;
		
		this.position = this.position.add(this.force.scale(this.delta));
		
		let dif = this.position.subtract(this.current);
		
		if(dif.magnitude() > this.radius){
			this.force = this.force.add(dif.normalize(this.force.magnitude()).scale(this.tension * -this.delta));
			//this.force = this.force.add(new Point(dif.x * this.force.y, 0).scale(this.tension * -this.delta));
			this.position = this.current.add(dif.normalize(this.radius));
		}
	}
	render(g,c){
		g.color = [0.6,0,0,1];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		);
		g.renderLine(
			this.position.add(new Point(this.width * 0.1, 0)).subtract(c),
			this.current.add(new Point(this.width * 0.1, 0)).subtract(c),
			1,
			COLOR_WHITE
		);
		g.renderLine(
			this.position.add(new Point(this.width * 0.9, 0)).subtract(c),
			this.current.add(new Point(this.width * 0.9, 0)).subtract(c),
			1,
			COLOR_WHITE
		);
	}
}
self["Crane"] = Crane;

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
	this.damageFixed = 12;
	this.alwaysKill = 0;
	this.alwaysHurt = 1;
	
	o = o || {};
	if("damage" in o){
		this.damageFixed = Math.floor(o.damage * 1);
	}
	if("kill" in o){
		this.alwaysKill = o.kill * 1;
	}
	if("alwayshurt" in o){
		this.alwaysHurt = o["alwayshurt"] * 1;
	}
	
	this.on("collideObject", function(obj){
		if( obj.hurtByDamageTriggers ) {
			if(this.alwaysKill){
				obj.invincible = -1;
				obj.life = 0;
				obj.stun = Game.DELTASECOND * 1;
				obj.trigger("hurt",this,0);
				obj.isDead();
			} else {
				if(this.alwaysHurt && game.timeScaled > DamageTrigger.rest){
					obj.invincible = -1;
				}
				obj.hurt( this, Combat.getDamage.apply(this) );
				if(obj instanceof Player){
					DamageTrigger.rest = game.timeScaled + Game.DELTASECOND * 2;
				}
			}
		}
	});
}
DamageTrigger.rest = 0;

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
	this.keepopen = false;
	
	this.lock = -1;
	this.isOpen = false;
	this.openAnimation = 0;
	this._tid = false;
	this.triggersave = false;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	this.close();
	
	this.on("activate", function(obj){
		if(this.isOpen){
			audio.play("open", this.position);
			this.close();
		}else {
			audio.play("open", this.position);
			this.keepopen = true;
			this.open();
		}
	});
	
	this.on("collideObject", function(obj){
		if( this.lock >= 0 && !this.isOpen && obj instanceof Player ){
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					audio.play("open", this.position);
					this.open();
				}
			}
		}
	});
	this.on("player_death", function(obj){
		if(this.isOpen && this.lock >= 0){
			this.close();
		}
	});
	
	this.on("added", function(){
		if(this.lock >= 0){
			PauseMenu.pushIcon(this.mapIcon);
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
	if("triggersave" in ops){
		this.triggersave = "door_" + ops["triggersave"];
		if(NPC.get(this.triggersave) != undefined){
			if(NPC.get(this.triggersave)){
				this.open();
			} else {
				this.close();
			}
		}
	}
	
	this.mapIcon = new MapIcon(x,y);
	this.mapIcon.frame = new Point(1,this.lock);
}
Door.prototype.close = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 1024);
	}
	this.zIndex = 0;
	this.isOpen = false;
	
	if(this.triggersave){
		NPC.set(this.triggersave, 0);
	}
}
Door.prototype.open = function(){
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, game.tileCollideLayer, 0);
	}
	this.zIndex = -20;
	this.isOpen = true;
	
	if(this.triggersave){
		NPC.set(this.triggersave, 1);
	}
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
	this.speed = 0.25 * self.unitsPerMeter;
	this.emptyOnStart = 0;
	this.resetOnSleep = 0;
	this.triggersave = false;
	
	this.fullheight = this.height;

	
	this.active = 0;
	this.filling = 0;
	this.noFill = 0;
	this.noDrain = 0;
	this._drainTileTest = 0;
	
	this.drainPos = this.width * 0.5;
	this.drainStr = 0.0;
	this.stepPos = 0.5;
	this.stepTime = 0.0;
	this.stepTimeTotal = Game.DELTASECOND * 0.5;
	this.stepStrMultiplier = 1.0;
	this.stepStr = 5.0;
	
	this.on("ontop", function(obj){
		//Apply walking force
		let pos = obj.position.subtract(this.position);
		
		if(Math.abs(obj.force.x) > 0.3){
			this.applyForce(pos, 1);
		}
	});
	
	this.on("collideObject", function(obj){
		if( obj.hasModule(mod_rigidbody) && obj.gravity > 0){
			let pos = obj.position.subtract(this.position);
			let force = Math.min(obj.force.y, 8) * this.stepStrMultiplier;
			
			this.applyForce(pos, force);
		}
	});
	
	this.addModule(mod_block);
	
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
		if(this.triggersave){
			NPC.set(this.triggersave,1);
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
	
	ops = ops || {};
	
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	if("speed" in ops){
		this.speed = ops["speed"] * self.unitsPerMeter;
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
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave)){
			if(this.emptyOnStart){
				//Instant fill
				this.height = this.fullheight;
			} else {
				//Instant empty
				this.height = 0;
			}
			this.updateTiles();
		}
	}
	
	if(this.resetOnSleep){
		this.on("sleep", function(){
			this.trigger("reset");
		});
	}
}

Drain.prototype.update = function(){
	/*
	this.stepTime -= this.delta;
	if(this.stepTime <= 0){
		this.stepPos = Math.random();
		this.stepTime = Game.DELTASECOND;
	}
	*/
	this.stepTime = Math.max(this.stepTime - this.delta,0.0);
	this.drainStr = 0.0;
	
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
			
			//Set drain position for bubbles
			if(game.getTile(this.position.x+this._drainTileTest, this.position.y + 8) == 0){
				this.drainPos = this._drainTileTest + 8;
			}
			this.drainStr = 1.0;
			this._drainTileTest = (this._drainTileTest + 16) % this.width;
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

Drain.prototype.applyForce = function(pos, force){
	
	let p = this.stepTime / this.stepTimeTotal;
	
	if(force > 0 && (force > this.stepStr * p)){
		this.stepPos = pos.x / this.width;
		this.stepTime = this.stepTimeTotal;
		this.stepStr = force;
	}
}

Drain.prototype.render = function(g,c){
	
	
	g.renderSprite(
		"ooze", 
		this.position.subtract(new Point(0,this.height)).subtract(c),
		this.zIndex,
		new Point(),
		false,
		{
			"u_time" : game.timeScaled,
			"u_size" : [this.width, this.height],
			"scalex" : this.width / 64.0,
			"scaley" : this.height / 64.0,
			"u_bubbles" : [this.drainPos / this.width, this.drainStr],
			"u_distortion" : [this.stepPos, this.stepTime / this.stepTimeTotal, this.stepStr ]
		}
	)
	return;
	
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
	/*
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
	*/
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
	
	this.speed = 9.0;	
	sound = sound || "explode2";
	audio.play(sound,this.position);
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

EffectBang.prototype = new GameObject();
EffectBang.prototype.constructor = GameObject;
function EffectBang(x, y, d){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.spread = 16;
	this.sprite = "bullets";
	
	shakeCamera(Game.DELTASECOND*0.3,8);
	audio.play("explode4", this.position);
	
	this.timeTotal = this.time = Game.DELTASECOND * 0.5;
	this.on("sleep",function(){ this.destroy(); } );
}

EffectBang.prototype.render = function(g,c){
	var progress = 1 - this.time / this.timeTotal;
	this.frame.x = progress * 5;
	this.frame.y = 5;
	
	Background.pushLight(this.position, (this.time/this.timeTotal)*160, COLOR_FIRE);
	
	for(var i=0; i < 4; i++){
		var pos = new Point(
			this.spread * (i == 0 || i == 3 ? -1 : 1),
			this.spread * (i < 2 ? -1 : 1)
		);
		g.renderSprite(
			this.sprite,
			this.position.add(pos).subtract(c),
			this.zIndex,
			this.frame,
			false,
			{"rotate" : i * 90}
		);
	}
	
	this.time -= this.delta;
	if(this.time <= 0){
		this.destroy();
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
	this.speed = 30 + Math.random() * 9.0;
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
	this.zIndex = 23;
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
	this.zIndex = 99;
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
	var center = v.length * 3;
	for(var i=0; i < v.length; i++){
		let p = this.progress / this.timelimit;
		let b = Math.PI * Math.clamp01(p * 3 - i * 0.125);
		var bounce = Math.sin(b) * 8;
		
		if(b > 0){
			this.frame.x = v[i] * 1;
			this.frame.y = 1;
			let offset = new Point(i*6 - center, -bounce );
			g.renderSprite(this.sprite,this.position.subtract(c).add(offset),this.zIndex,this.frame);
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

EffectHurt.prototype = new GameObject();
EffectHurt.prototype.constructor = GameObject;
function EffectHurt(x, y, obj){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "effect_hurt";
	this.zIndex = 99;
	this.frame.x = 0;
	this.frame.y = 0;
	this._frame = 0;
	this.speed = 12.0;
	this.intensity = 0.5;
	this.rotation = 0.0;
}
EffectHurt.prototype.render = function(g,c){
	//if(input.state("left")==1) this.intensity -= 0.05;
	//if(input.state("right")==1) this.intensity += 0.05;
	
	this._frame += game.deltaUnscaled * this.speed;
	this.frame.x = this._frame / 4;
	this.frame.y = this._frame % 4;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"u_color_edge" : [1.0,0.8,0.8,1.0],
			"u_color" : [0.8,0.0,0.0,1.0],
			"u_size" : [1/256.0,1/256.0],
			"u_intensity" : this.intensity,
			"rotate" : this.rotation
		}
	);
	
	if(this._frame > 8){
		//this._frame = 0.0;
		this.destroy();
	}
}

EffectBlock.prototype = new GameObject();
EffectBlock.prototype.constructor = GameObject;
function EffectBlock(x, y, obj){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.sprite = "effect_block";
	this.zIndex = 99;
	this.frame.x = 0;
	this.frame.y = 0;
	this.speed = 11.5;
	this.intensity = 0.5;
}
EffectBlock.prototype.render = function(g,c){
	this.frame.x = (this.frame.x + this.delta * this.speed) % 6;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"u_color_edge" : [1.0,1.0,1.0,1.0],
			"u_color" : [0.4,0.5,1.0,1.0],
			"u_size" : [1/256.0,1/256.0],
			"u_intensity" : this.intensity
		}
	);
	
	if(this.frame.x >= 5){
		this.destroy();
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

EffectFlash.prototype = new GameObject();
EffectFlash.prototype.constructor = GameObject;
function EffectFlash(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.sprite = "ring";
	
	this.time = 0.0;
	this.timeMax = Game.DELTASECOND * 0.5;
}

EffectFlash.prototype.render = function(g,c){
	this.time += this.delta;
	
	var scale = 5 * this.time / this.timeMax;
	
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false,{"shader":"halo","scale":scale});
	
	if(this.time >= this.timeMax){
		this.destroy();
	}
}

EffectAbsorb.prototype = new GameObject();
EffectAbsorb.prototype.constructor = GameObject;
function EffectAbsorb(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.zIndex = 99;
	this.sprite = "bullets";
	this.frame = new Point(4,1);
	
	this.speed = 10.0;
}

EffectAbsorb.prototype.render = function(g,c){
	var dir = this.position.subtract(_player.position);
	var speed = this.speed * this.delta;
	
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,this.frame,false);
	
	if(dir.magnitude() < speed){
		this.destroy();
	} else {
		this.position = this.position.subtract(dir.normalize(speed));
	}
}

var EffectList = {
	"charge" : function(g,p,progress){		
		if( progress > 0.2 && progress < 1.0 ) {
			
			var r = 12.0 * (1.0-progress);
			
			for(var i=0; i < 5; i++) {
				var off = new Point(r*Math.sin(i), r*Math.cos(i));
				g.renderSprite("bullets",p.add(off),this.zIndex+1,new Point(3,2));
			}
		}
	}
};

COLOR_WHITE = [1.0,1.0,1.0,1.0];
COLOR_BLACK = [0.0,0.0,0.0,1.0];
COLOR_LIGHTNING = [0.5,0.7,1.0,1.0];
COLOR_FIRE = [1,0.8,0,1];

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
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	//this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	
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
	this.pushable = false;
	this.hurtByDamageTriggers = false;
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame.x = ( this.frame.x + this.delta * 0.2 ) % 3;
	if(this.life <= 0){
		this.gravity = 0.4;
	} else if( this.stun < 0 ) {
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

class Axedog extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 30;
		this.sprite = "axedog";
		this.swrap = spriteWrap["axedog"];
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.states = {
			"cooldown" : 5,
			"attack" : 0.0,
			"direction" : 1.0,
			"walk" : 0.0
		};
		this.times = {
			"cooldown" : Game.DELTASECOND * 2.0,
			"attack" : Game.DELTASECOND * 1.65
		}
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.lifeMax = this.life = Spawn.life(3,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(4,this.difficulty);
		this.mass = 1.0;
		this.speed = 2.0;
		
		this.on("collideHorizontal", function(x){
			this.force.x = 0;
			this.states.direction = x > 0 ? -1 : 1;
			this.position.x += this.states.direction;
		});
		this.on("struck", EnemyStruck);
		
		this.on("hurt", function(){
			audio.play("hurt",this.position);
			this.states.cooldown = Game.DELTASECOND * 0.5;
			this.states.attack = 0.0;
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			Item.drop(this);
			this.destroy();
		});
	}
	update(){
		if ( this.stun <= 0 && this.life > 0 ) {
			var dir = this.position.subtract( this.target().position );
			
			if( this.states.attack > 0 ) {
				let p = 1 - this.states.attack / this.times.attack;
				this.frame = this.swrap.frame("attack",p);
				this.states.attack -= this.delta;
				this.force.x = 0;
			} else {
				this.states.walk = (this.states.walk+this.delta*Math.abs(this.force.x)) % 1;
				this.frame = this.swrap.frame("walk",this.states.walk);
				
				if( this.grounded && this.atLedge() ){
					//Turn around, don't fall off the edge
					this.force.x = 0;
					this.states.direction *= -1.0;
				}
				
				if( Math.abs( dir.x ) > 24 || Math.abs(dir.y) > 48) {
					this.flip = this.states.direction < 0;
					this.addHorizontalForce(this.speed * this.forward());
				}
				
				if(Math.abs(dir.y) < 48){
					this.states.cooldown -= this.delta;
					
					if( this.states.cooldown <= 0 && Math.abs( dir.x ) < 64 ) {
						this.states.attack = this.times.attack;
						this.states.cooldown = this.times.cooldown;
						this.flip = dir.x > 0;
					}
				}
			}
		} else {
			this.frame = this.swrap.frame("hurt",0);
		}
	}
}
self.Axedog = Axedog;

 /* platformer\enemy_baller.js*/ 

Baller.prototype = new GameObject();
Baller.prototype.constructor = GameObject;
function Baller(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "baller";
	this.zIndex = 1;
	this.idleMargin = 128;
	this.anchorpoint = new Point(0,0);
	
	this.ball = new BallerBall(x-48,y);
	this.ball.owner = this;
	
	this.links = new Array();
	for(var i=0; i < 8; i++) { this.links.push(new Point(x,y)); }
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.timers = {
		"swing" : 4,
		"release" : Game.DELTASECOND * 1.5,
		"pull" : Game.DELTASECOND * 4.0,
		"retrieve" : Game.DELTASECOND * 2.0,
	}
	this.states = {
		"swing" : this.timers.swing,
		"release" : 0.0,
		"pull" : 0.0,
		"retrieve" : 0.0,
	};
	
	o = o || {};
	
	this.spinType = 0;
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("type" in o){
		this.spinType = o["type"] * 1;
	}
	
	this.death_time = Game.DELTASECOND * 1.0;
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(5,this.difficulty);
	this.moneyDrop = Spawn.money(7,this.difficulty);
	this.mass = 4.0;
	this.recoverySpeed = 6;
	this.arcSize = 56;
	this.archSpeed = 0.2;
	this.spinSpeed = 0.07;
	
	game.addObject(this.ball);
	
	this.on("wakeup", function(){
		this.states.swing = this.timers.swing;
		this.states.release = 0.0;
		this.states.pull = 0.0;
		this.states.retrieve = 0.0;
		this.ball.position.x = this.position.x;
		this.ball.position.y = this.position.y;
		
		if(game.objects.indexOf(this.ball) < 0){
			game.addObject(this.ball);
		}
	});
	
	this.on("sleep", function(){
		this.ball.destroy();
	});
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt", this.position);
	});
	this.on("pre_death", function(){
		this.ball.destroy();
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	this.calculateXP();
}
Baller.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = dir.x > 0;
		
		
		if(this.spinType == 0 ){
			if( this.ball.reflect ) {
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				var direction = this.ball.position.subtract(this.position).normalize(2 * this.delta * this.recoverySpeed);
				this.ball.position = this.ball.position.subtract(direction);
			} else if( this.states.retrieve > 0 ) {
				this.states.retrieve -= this.delta;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				if(this.bounds().overlaps(this.ball.bounds())){
					this.anchorpoint = new Point(-16,-16);
					this.ball.visible = false;
					this.frame.x = 2;
					this.frame.y = 2;
				} else {
					this.frame.x = 2;
					this.frame.y = 0;
					var direction = this.ball.position.subtract(this.position).normalize(this.delta * this.recoverySpeed);
					this.ball.position = this.ball.position.subtract(direction);
					this.ball.flip = direction.x > 0;
				} 
				
				if(this.states.retrieve <= 0){
					this.states.swing = this.timers.swing;
					this.ball.visible = true;
				}
			} else if( this.states.pull > 0 ) {
				this.states.pull -= this.delta;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				this.frame.x = Math.max((this.frame.x + this.delta * 0.1) % 3,1);
				this.frame.y = 1;
				
				if(this.states.pull <= 0){
					this.states.retrieve = this.timers.retrieve;
				}
				
			} else if ( this.states.release > 0 ) {
				this.states.release -= this.delta;
				this.anchorpoint = new Point(0,0);
				this.frame.x = Math.min(this.frame.x + this.delta * 0.01, 1);
				this.frame.y = 1;
				
				if(this.states.release <= 0 || this.ball.grounded){
					this.ball.strikeable = false;
					this.states.pull = this.timers.pull;
					this.states.release = 0.0;
				}
			} else if ( this.states.swing > 0 ) {
				var distance = Math.sin(game.timeScaled * this.archSpeed) * this.arcSize;
				this.ball.gravity = this.ball.force.x = this.ball.force.y = 0.0;
				this.ball.position = this.position.add(new Point(distance, -16));
				this.ball.flip = this.ball.position.x < this.position.x;
				this.anchorpoint = new Point(-16,-16);
				
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
				this.frame.y = 0;
				
				if(distance < this.forward() * this.arcSize * 0.98){
					if(this.flip && this.ball.zIndex < this.zIndex ){
						this.states.swing--;
					}
					this.ball.zIndex = this.zIndex + 1;
				}
				if(distance > this.forward() * this.arcSize * 0.98){
					if(!this.flip && this.ball.zIndex >= this.zIndex){
						this.states.swing--;
					}
					this.ball.zIndex = this.zIndex - 1;
				}
				
				if(this.states.swing <= 0){
					this.states.release = this.timers.release;
					this.frame.x = 0;
					this.ball.strikeable = true;
					this.ball.force.x = this.forward() * 10;
					this.ball.force.y = -3;
					this.ball.flip = this.flip;
					this.ball.gravity = 0.5;
					this.ball.grounded = false;
				}
			} else {
				
			}
		} else if(this.spinType == 1){
			
			var radius = 80;
			var angle = (game.timeScaled * this.spinSpeed) % (Math.PI * 2);
			var ballPos = new Point(Math.sin(angle) * radius, Math.cos(angle) * radius);
			
			this.anchorpoint = new Point(-16,-16);
			this.ball.position = this.position.add(ballPos);
			this.ball.rigidbodyActive = false;
			this.ball.zIndex = this.zIndex + 1;
			
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}
Baller.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if(this.life > 0){
		var ap = this.anchorpoint.scale(this.forward(),1);
		var linkFrame = new Point(1,3);
		
		for(var i=0; i < this.links.length; i++){
			if(i==0){
				this.links[i] = Point.lerp(this.position.add(ap),this.links[i+1],0.5);
			} else if( i+1>=this.links.length ){
				this.links[i] = Point.lerp(this.links[i-1],this.ball.position,0.5);
			} else {
				this.links[i] = Point.lerp(this.links[i-1],this.links[i+1],0.5);
			}
			
			if(i>0){
				g.renderLine(
					this.links[i-1].subtract(c),
					this.links[i].subtract(c),
					1
				);
			}
			/*
			g.renderSprite(
				this.sprite,
				this.links[i].subtract(c),
				this.zIndex - 2,
				linkFrame,
				false
			);
			*/
		}
	}
}

BallerBall.prototype = new GameObject();
BallerBall.prototype.constructor = GameObject;
function BallerBall(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.sprite = "baller";
	this.damage = 0;
	this.strikeable = false;
	this.reflect = false;
	this.owner = false;
	this.zIndex = 1;
	
	this.strikeBox = this.bounds().transpose(this.position.scale(-1.0));
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.defencePhysical = 99;
	this.defenceFire = 99;
	this.defenceSlime = 99;
	this.defenceIce = 99;
	this.defenceLight = 99;
	
	this.on(["hurt_other","blocked"], function(obj, damage){
		this.force.x = 0;
		this.force.y = Math.max(this.force.y, 0);
	});
	this.on("collideObject", function(obj){
		if(this.reflect && obj === this.owner){
			this.reflect = false;
			obj.hurt(this,obj.lifeMax);
		}
	});
	this.on("hurt", function(obj, damage){
		audio.play("hurt", this.position);
	});
	this.on("struck", function(obj) {
		if(this.strikeable && obj instanceof Player){
			this.reflect = true;
		}
	});
	
	this.lifeMax = this.life = Number.MAX_SAFE_INTEGER;
	this.damageReduction = 0.9999999;
	this.mass = 3.0;
	this.friction = 0.04;
	this.gravity = 0;
	this.pushable = false;
	
	this.frame.x = 0
	this.frame.y = 3;
}

BallerBall.prototype.update = function(){
	if( this.damage > 0 && !this.reflect) {
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
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.mass = 0.8;
	this.pushable = false;
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
		audio.play("hurt",this.position);
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
		Item.drop(this);
		audio.play("kill",this.position);
	});
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
				this.addHorizontalForce(this.speed * (batty_dir.x > 0 ? -1 : 1));
			} else {
				if( this.states.lockon ) {
					this.gravity = 0;
					this.force.y = 0;
					this.addHorizontalForce(this.speed * this.forward());
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
	this.moneyDrop = Spawn.money(3,this.difficulty);
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
		audio.play("hurt",this.position);
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
		audio.play("kill",this.position);
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
	this.width = 32;
	this.height = 32;
	this.sprite = "bear";
	this.speed = 0.2;
	this.active = false;
	this.start = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.guard.y = -15;
	this.guard.h = 32;
	
	this.states = {
		"attackTotal" : Game.DELTASECOND * 1.5,
		"attack" : 0,
		"cooldown" : 100.0,
		"block" : 0.0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.mass = 1.5;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
		
		this.states.block = Game.DELTASECOND * 0.5;
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		this.states.attack = 0.0;
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
}
Bear.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	var dis = this.position.subtract(this.start);
	
	if(this.life > 0){
		if(this.stun <= 0){
			if(this.states.attack > 0){
				this.guard.active = false;
				this.states.attack -= this.delta;
				this.frame.x = Math.min(this.frame.x + this.delta * 0.4, 2);
				this.frame.y = 1;
				
				if(this.frame.x < 2){
					this.strike(new Line(0,-12,32,0));
				}
			} else {
				this.guard.active = true;
				
				if(this.states.block > 0){
					this.frame.x = 0;
					this.frame.y = 2;
					this.states.block -= this.delta;
				} else {
					this.flip = dir.x > 0;
					if(Math.abs(dir.x) < 128){
						this.states.cooldown -= this.delta;
						if(Math.abs(dis.x) < 180 && Math.abs(dir.x) > 48){
							this.force.x += this.forward() * this.speed * this.delta;
						} 
					} else {
						this.force.x += (dis.x>0?-1:1) * this.speed * this.delta;
					}
					
					this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 4;
					this.frame.y = 0;
				}
				
				if(this.states.cooldown <= 0){
					this.states.attack = this.states.attackTotal;
					this.states.cooldown = Game.DELTASECOND * 2.5;
					this.force.x = this.forward() * 5;
					this.frame.y = this.frame.x = 0;
				}
			}
		} else {
			this.stun = Math.min(this.stun, Game.DELTASECOND * 0.1);
			this.frame.x = 1;
			this.frame.y = 2;
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
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
	this.moneyDrop = Spawn.money(7,this.difficulty);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		Item.drop(this);
		audio.play("kill",this.position);
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
	this.startPosition = new Point(x,y);
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
		audio.play("hurt",this.position);
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
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	this.on("player_death", function(){
		this.life = this.lifeMax;
		this.position.x = this.startPosition.x;
		this.position.y = this.startPosition.y;
		this.active = false;
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(8,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(25,this.difficulty);
	this.mass = 5.3;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	this.active = false;
	
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
		if(this.active){
			this.flip = this.force.x < 0;
			var direction = 0;
			
			if( Math.abs(this.force.x) < 2 && Math.abs(dir.x) < 24){
				this.states.runaway = Game.DELTASECOND * 2;
			}
			
			if(this.states.runaway > 0){
				direction = this.force.x > 0 ? 1 : -1;
			} else {
				direction = dir.x < 0 ? 1 : -1;
			}
			this.force.x += this.speed * this.delta * direction;
			this.states.collideCooldown -= this.delta;
			this.states.runaway -= this.delta;
		} else {
			this.active = game.insideScreen(this.position, 32);
		}
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
		var lightoffset = Math.min(Math.abs( this.force.x ),2) * 16;
		Background.pushLight(this.position.add(new Point(this.forward()*lightoffset,0)), 200);
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

//Arm Wrestler

ArmWrestler.prototype = new GameObject();
ArmWrestler.prototype.constructor = GameObject;
function ArmWrestler(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 56;
	this.sprite = "biker";
	
	this.active = false;
	this.defeated = false;
	
	this.score = 0;
	this.scoreTotal = 24;
	this.presses = 0;
	this.rate = 0.1;
	this.timebetween = 0.0;
	this.average = 0.0;
	this.time = 0.0;
	this.cry = Game.DELTASECOND;
	
	this.states = {
		"cooldown" : 0,
		"attack" : 0
	}
	
	this.addModule( mod_rigidbody );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.mass = 1;
	this.friction = 0.01;
	this.pushable = false;
	this.damage = Spawn.damage(5,this.difficulty);
	
	this.on("startwrestle", function(obj){
		this.score = this.scoreTotal * 0.5;
		this.presses = 0;
		this.rate = 0.1;
		this.timebetween = 0.0;
		this.average = 0.0;
		this.time = 0.0;
		
		//Remove the player from the world
		obj.visible = false;
		obj.deltaScale = 0.0;
	});
	this.on("stopwrestle", function(obj){
		obj.visible = true;
		obj.deltaScale = 1.0;
	});
	
	
	
	this.on("sleep", function(){
		if(this.defeated){
			this.destroy();
		}
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	})
	this.on("collideObject", function(obj){
		if(obj instanceof Player && !this.defeated && !this.active){
			this.active = true;
			this.trigger("startwrestle",obj);
		}
	});
}

ArmWrestler.prototype.update = function(){
	if ( this.active) {
		this.frame.x = Math.max((this.frame.x + this.delta * 0.5) % 6, 4);
		this.frame.y = 0;
		
		this.timebetween += this.delta;
		this.time += this.delta;
		
		var seconds = this.time / Game.DELTASECOND;
		var effort = Math.max(Math.min(1.2+Math.max(Math.sin(seconds)*.3,0)-seconds*0.05,1.4),0.1);
		
		
		this.score -= this.rate * this.delta * effort;
		
		if(input.state("fire") == 1){
			this.score += 1;
			
			if(this.presses > 0){
				this.average = (this.average*this.presses+this.timebetween) / (this.presses+1);
			} else {
				this.average = this.timebetween;
			}
			this.timebetween = 0.0;
			this.presses++;
			this.rate = Math.max(1 / this.average, 0.2);
		}
		
		if(this.score <= 0){
			this.active = false;
			_player.hurt(this,this.damage);
			_player.position.x = this.position.x + this.forward() * this.width;
			this.trigger("stopwrestle",_player);
		}
		if(this.score >= this.scoreTotal){
			this.active = false;
			this.defeated = true;
			
			audio.play("kill",this.position);
			this.grounded = false;
			this.force.y = -5;
			Item.drop(this,15);
			
			this.trigger("stopwrestle",_player);
		}
	} else if (this.defeated){
		if(this.cry <= 0){
			this.frame.x = Math.max((this.frame.x + this.delta * 0.2) % 5, 3);
			this.frame.y = 1;
		} else {
			if(this.grounded){
				this.cry -= this.delta
				this.frame.x = 2;
				this.frame.y = 1;
			} else {
				this.frame.x = 1;
				this.frame.y = 1;
			}
		}
	} else {
		this.frame.x = 3;
		this.frame.y = 0;
	}
}
ArmWrestler.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if(this.active){
		g.renderSprite(
			"player",
			this.position.add(new Point(36*this.forward(),4)).subtract(c),
			this.zIndex + 1,
			new Point(1,4),
			!this.flip
		);
	}
}
ArmWrestler.prototype.hudrender = function(g,c){
	if(this.active){
		var width = 64;
		var height = 6;
		var percent = this.score / this.scoreTotal;
		var topleft = this.position.subtract(new Point(width*0.5,40)).subtract(c);
		
		g.color = [1,1,1,1];
		g.scaleFillRect(topleft.x-1,topleft.y-1,width+2,height+2);
		
		g.color = [0,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width,height);
		
		g.color = [1,0,0,1];
		g.scaleFillRect(topleft.x,topleft.y,width*percent,height);
	}
}

 /* platformer\enemy_bikersmall.js*/ 

BikerSmall.prototype = new GameObject();
BikerSmall.prototype.constructor = GameObject;
function BikerSmall(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "biker";
	this.speed = 0.2;
	this.topspeed = this.speed * 20;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"cooldown" : 0,
		"attack" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.mass = 1;
	this.friction = 0.01;
	this.pushable = false;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.on("collideObject", function(obj){
		if(this.life > 0 && obj instanceof Player){
			obj.hurt(this,this.damage);
		}
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		Item.drop(this,12);
		audio.play("kill",this.position);
	});
}

BikerSmall.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		this.flip = this.force.x < 0;
		this.states.cooldown -= this.delta;
		this.states.attack -= this.delta;
		
		if(dir.x > 0){
			this.force.x -= this.speed * this.delta;
		} else {
			this.force.x += this.speed * this.delta;
		}
		this.force.x = Math.min(Math.max(this.force.x, -this.topspeed), this.topspeed);
		
		if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
			this.states.attack = Game.DELTASECOND * 0.5;
			this.states.cooldown = Game.DELTASECOND * 4.0;
			
			var molotov = new Molotov(this.position.x, this.position.y);
			molotov.team = this.team;
			molotov.force.y = -10;
			molotov.force.x = this.forward() * 5;
			molotov.damage = this.damage;
			game.addObject(molotov);
		}
		
		//Animate
		if(this.states.attack > 0){
			this.frame.x = 3;
			this.frame.y = 3;
		} else if(Math.abs(this.force.x) < 1.2){
			this.frame.x = (Math.abs(this.force.x) < 0.5 ? 1 : 0);
			this.frame.y = 4;
		} else {
			this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.3) % 3;
			this.frame.y = 3;
		}
	}
}


Molotov.prototype = new GameObject();
Molotov.prototype.constructor = GameObject;
function Molotov(x,y,d,o){
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
	this.spinspeed = 12;
	
	this.timer = 3.0 * Game.DELTASECOND;
	this.cooldown = 0.5* Game.DELTASECOND;
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
	this.collisionReduction = -1.0;
	this.friction = 0;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on(["collideHorizontal", "collideVertical"], function(dir){
		this.explode();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
			this.explode();
		}
	});
}
Molotov.prototype.explode = function(){
	game.addObject(new EffectBang(this.position.x, this.position.y));
	
	for(var i=0; i < 6; i++){
		var pos = new Point(i*12+this.position.x-36,this.position.y);
		var fire = new Fire(pos.x, pos.y);
		game.addObject(fire);
	}
	
	this.destroy();
}
Molotov.prototype.render = function(g,c){	
	this.rotate += this.delta * this.spinspeed;
	
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

 /* platformer\enemy_boarbow.js*/ 

Boarbow.prototype = new GameObject();
Boarbow.prototype.constructor = GameObject;
function Boarbow(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "boarbow";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.time_cooldown = Game.DELTASECOND * 1.0;
	this.time_attack = Game.DELTASECOND * 2.0;
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0
	};
	
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(2,this.difficulty);
	this.mass = 1.2;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
	this.on("collideObject", function(obj){
	});
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Boarbow.prototype.update = function(){	
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.stun <= 0 ){
			if(this.states.attack > 0){
				var progress = 1 - (this.states.attack / this.time_attack);
				this.frame = Boarbow.anim_attack.frame(progress);
				this.states.attack -= this.delta;
				
				if(Timer.isAt(this.states.attack, this.time_attack*0.22, this.delta)){
					var bolt = new Bullet(this.position.x, this.position.y-6);
					bolt.team = this.team;
					bolt.force.x = this.forward() * 10;
					bolt.flip = this.flip;
					bolt.sprite = this.sprite;
					bolt.frame.x = 2;
					bolt.frame.y = 2;
					bolt.damage = this.damage;
					bolt.setDeflect();
					game.addObject(bolt);
				}
			} else {
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				if(this.states.cooldown <= 0){
					this.states.attack = this.time_attack;
					this.states.cooldown = this.time_cooldown;
				}
			}
		} else {
			//Stunned
			this.frame.x = 2;
			this.frame.y = 0;
			this.states.attack = 0.0;
		}
		
	} else {
		this.frame.x = 2;
		this.frame.y = 1;
	}
}

Boarbow.anim_attack = new Sequence([
	[0,1,0.1],
	[0,2,0.1],
	[0,3,0.3],
	[1,0,0.1],
	[1,1,0.5],
	[1,2,0.2],
	[1,3,0.1]
]);
	

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
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.collideDamage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
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
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
		} else if(obj.hasModule(mod_combat)){
			obj.hurt(this, this.damage * 5);
		}
	}
	shakeCamera(Game.DELTASECOND * 0.5, 4);
	//audio.play("explode3");
	
	var explosion = new EffectBang(this.position.x,this.position.y);
	game.addObject(explosion);
	
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

 /* platformer\enemy_bombjar.js*/ 

Bombjar.prototype = new GameObject();
Bombjar.prototype.constructor = GameObject;
function Bombjar(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.sprite = "bombjar";
	this.speed = 3.0;
	this.zIndex = 3;
	this.blastradius = 24;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.walkcycle = 0.0;
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.bounceCount = 4;
	this.mass = 1.0;
	this.death_time = 0.1;
	this.gravity = 0.5;
	this.pushable = false;
	this.flip = x > _player.position.x;
	
	this.on("collideHorizontal", function(x){
		this.force.x = -this.force.x;
		this.flip = !this.flip;
	});
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this,this.damage);
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		var explosion = new EffectBang(this.position.x,this.position.y);
		game.addObject(explosion);
		
		var free = new BombjarFree(this.position.x, this.position.y);
		game.addObject(free);
		
		/*
		c = this.corners();
		l = new Line(
			c.left - this.blastradius, 
			c.top - this.blastradius, 
			c.right + this.blastradius, 
			c.bottom + this.blastradius
		);
		list = game.overlaps(l);
		for(var i=0; i < list.length; i++){
			var obj = list[i];
			if(obj instanceof Player){
				obj.hurt(this, this.damage);
			} else if(obj.hasModule(mod_combat)){
				obj.hurt(this, this.damage * 4);
			}
		}
		*/
		shakeCamera(Game.DELTASECOND * 0.5, 4);
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Bombjar.prototype.update = function(){
	if ( this.life > 0 ) {
		
		if(this.grounded){
			this.force.x = this.forward() * this.speed;
			this.force.y = -5;
			this.grounded = false;
			this.bounceCount--
			
			if(this.bounceCount <= 0){
				this.bounceCount = 4;
				var fire = new Fire(this.position.x, this.position.y - this.height * 0.5);
				fire.grounded = false;
				fire.force.y = -5;
				game.addObject(fire);
			}
		}
		
		this.walkcycle = (this.walkcycle + this.delta * 0.3) % 6;
		this.frame.x = this.walkcycle % 3;
		this.frame.y = this.walkcycle / 3;
		
		Background.pushLight( this.position, 180, COLOR_FIRE );
	} else{
		
	}
}

class BombjarFree extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);

		this.position.x = x;
		this.position.y = y;
		this.width = 16;
		this.height = 16;
		
		this.speed = 1.5;
		this.rotSpeed = 6.0;
		
		this.sprite = "bombjar";
		this.rotation = 0;
		this.tailTrans = 0;
		this.frame = new Point(0,2);
		this.force = new Point();
		
		this.addModule(mod_combat);
		this.friction = 0.1;
		this.lifeMax = this.life = 100;
		this.defencePhysical = 99;
		this.defenceFire = 99;
		this.defenceSlime = 99;
		this.defenceIce = 99;
		this.defenceLight = 99;
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt",this.position);
			this.force = this.position.subtract(obj.position).normalize(6);
		});
		
		this.tail = [
			new Vector(-4,-8),
			new Vector(-8,-12),
			new Vector(-16,-10),
			new Vector(-24,-8),
			new Vector(-4,8),
			new Vector(-8,12),
			new Vector(-16,10),
			new Vector(-24,8)
		];
	}
	update(){
		var dir = this.position.subtract(_player.position);
		let r = Math.atan2(-dir.y, -dir.x) * Math.rad2deg;
		
		if(r < -45 && this.rotation > 45){
			r = 180 - r;
		}
		
		if(r > this.rotation+this.rotSpeed){
			this.rotation += this.rotSpeed * this.delta;
		} else if(r < this.rotation-this.rotSpeed){
			this.rotation -= this.rotSpeed * this.delta;
		}
		if(this.rotation < -180){
			this.rotation = 360 + this.rotation;
		}
		
		for(let i=0; i < this.tail.length; i++){
			this.tail[i].z = Math.slerp(
				this.tail[i].z,
				this.rotation,
				this.delta*(1/Math.abs(this.tail[i].x))
			);
		}
		
		this.position.x += Math.cos(this.rotation * Math.deg2rad) * this.delta * this.speed;
		this.position.y += Math.sin(this.rotation * Math.deg2rad) * this.delta * this.speed;
		
		//Apply force
		this.position.x += this.force.x * this.delta;
		this.position.y += this.force.y * this.delta;
		this.force = this.force.scale(1.0-(this.friction*this.delta));
		
		Background.pushLight( this.position, 180, COLOR_FIRE );
	}
	render(g,c){
		let r = this.rotation;
		this.flip = false;
		/*if(r > 90 || r < -90){
			this.flip = true;
			r = 180 - r;
		}*/
		for(let i=0; i < this.tail.length; i++){
			let t = this.tail[i];
			let r = t.z * Math.deg2rad;
			let a = new Point(t.x*Math.cos(r), t.y*Math.sin(r));
			g.renderSprite(
				"bullets",
				this.position.add(a).subtract(c),
				this.zIndex-1,
				new Point(5,1),
				this.flip,
				{
					"rotate" : t.z
				}
			);
			
			/*
			let a = Point.lerp(this.tail[i], this.tail[i+1], this.tailTrans);
			let b = Point.lerp(this.tail[i+1], this.tail[i+2], this.tailTrans);
			
			g.renderLine(
				a.subtract(c),
				b.subtract(c),
				8,
				[1.0,0.9,0.1,1.0]
			);
			*/
		}
		
		g.renderSprite(
			this.sprite,
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"rotate" : r
			}
		);
	}
}
self["BombjarFree"] = BombjarFree;

 /* platformer\enemy_bookreptile.js*/ 

BookReptile.prototype = new GameObject();
BookReptile.prototype.constructor = GameObject;
function BookReptile(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "bookreptile";
	this.speed = 0.5;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 2,
		"rest" : Game.DELTASECOND * 3,
		"carryon" : Game.DELTASECOND * 2,
		"spawn" : Game.DELTASECOND * 0.2
	}
	
	this.states = {
		"missile" : false,
		"wakingup" : 1,
		"attack" : 0,
		"rest" : 0,
		"spawn" : this.times.spawn
	}
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.mass = 1;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	this.pushable = false;
	this.force.y = -12;
	this.mForce = new Point();
	
	this.on(["collideHorizontal", "collideVertical"], function(h){
		this.states.missile = false;
	});
	this.on("collideObject", function(obj){
		if(this.states.missile){
			if(obj instanceof Player){
				obj.hurt(this);
				this.life = 0;
				this.destroy();
			}
		}
	});
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		Item.drop(this,4);
		audio.play("kill",this.position);
	});
}

BookReptile.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.states.missile){
			this.frame.x = 0;
			this.frame.y = 0;
			
			this.force.x = this.mForce.x;
			this.force.y = this.mForce.y;
		} else if(this.states.wakingup > 0){
			this.interactive = false;
			this.frame.x = this.force.y < 0 ? 0 : 1;
			this.frame.y = 0;
			
			if(this.grounded){
				this.states.wakingup = 0;
			}
		} else if( this.states.spawn > 0) {
			this.interactive = true;
			var p = 1 - this.states.spawn / this.times.spawn;
			this.frame.x = 2 + p * 3;
			this.frame.y = 0;
			this.states.spawn -= this.delta;
			if(this.states.spawn <= 0){
				this.force.y = -9;
			}
		} else if( this.states.attack > 0) {
			//Leap and swing at the player
			this.frame.x = Math.min(this.frame.x + this.delta * 0.3, 3);
			
			if(this.frame.x >= 1 && this.frame.x < 3){
				this.strike(Axesub.attackRect);
			}
			
			this.states.attack -= this.delta;
		} else if( this.states.rest > 0) {
			this.frame.x = 0;
			this.frame.y = 1;
			this.states.rest -= this.delta;
		} else {
			//Run at player
			if(this.grounded){
				this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
				this.frame.y = 1;
				
				this.flip = dir.x > 0;
				this.force.x += this.forward() * this.speed * this.delta;
			} else {
				this.frame.x = 1 + Math.max(Math.min(this.force.y,1),-1) * 0.1;
				this.frame.y = 3;
			}
			
			if(Math.abs(dir.x) < 64){
				this.states.attack = this.times.attack;
				this.states.rest = this.times.rest;
				this.frame.x = 0;
				this.frame.y = 2;
			}
		}
	} else {
		this.frame.x = 5;
		this.frame.y = 0;
	}
}

BookReptile.attackRect = new Line(8,-12,20,12);

 /* platformer\enemy_bookrider.js*/ 

Bookrider.prototype = new GameObject();
Bookrider.prototype.constructor = GameObject;
function Bookrider(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.5;
	this.speedMax = 2.0;
	this.gotoForce = new Point(1,1);
	this.sprite = "bookrider";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 1.3,
		"cooldown" : Game.DELTASECOND * 2.0
	};
	this.states = {
		"attack" : 0.0,
		"cooldown" : this.times.cooldown
	};
	
	this.on("collideHorizontal", function(h){
		this.gotoForce.x = h > 0 ? -1 : 1;
	});
	this.on("collideVertical", function(v){
		this.gotoForce.y = v > 0 ? -1 : 1;
	});
	this.on("hurt", function(obj,damage){
		this.states.retreat = this.times.retreat;
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player && obj.position.y > this.position.y && this.life > 0){
			obj.hurt(this,this.damage);
		}
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	//this.charged = this.difficulty > 1;
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.damageLight = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.pushable = false;
	this.hurtByDamageTriggers = false;
	
	this.mass = 1.0;
	this.friction = 0.2;
	this.gravity = 0.0;
}
Bookrider.prototype.update = function(){
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		
		if(this.states.attack > 0){
			this.force.x = this.force.y = 0.0;
			this.frame.x = this.frame.y = 0;
			this.states.attack -= this.delta;
			
			if(Timer.isAt(this.states.attack, this.times.attack * 0.5, this.delta )){
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damageLight = lightning2.damageLight = this.damageLight;
				lightning1.force.x = lightning2.force.x = 0.0;
				lightning1.force.y = lightning2.force.y = 0.0;
				game.addObject(lightning1);
				game.addObject(lightning2);
			}
			
			if(this.states.attack < this.times.attack * 0.5 ){
				this.frame.y = 1;
			}
			
		} else {
			if(dir.y >= 120) {
				this.gotoForce.y = -1;
			} else if (dir.y <= -120) {
				this.gotoForce.y = 1;
			}
			
			if(dir.x >= 200) {
				this.gotoForce.x = -1;
			} else if (dir.x <= -200) {
				this.gotoForce.x = 1;
			}
			
			this.force.x += this.gotoForce.x * this.delta * this.speed;
			this.force.y += this.gotoForce.y * this.delta * this.speed;
			
			//Artifically add friction to Y movement so it matches X movement
			this.force.y = this.force.y * (1.0 - (this.friction * this.delta));
			
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 32 && this.states.cooldown <= 0){
				this.states.attack = this.times.attack;
				this.states.cooldown = this.times.cooldown;
			}
			
			this.flip = this.force.x < 0;
			if(Math.abs(this.force.x) > 2.0){
				this.frame.y = 0;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			} else if (Math.abs(this.force.x) > 1.0){
				this.frame.y = 1;
				this.frame.x = 1;
			} else {
				this.frame.y = 1;
				this.frame.x = 2;
			}
		}
		
		
		
	} else {
		this.frame.x = 1;
		this.frame.y = 2;
	}
}

 /* platformer\enemy_booksummoner.js*/ 

class BookSummoner extends GameObject{
	constructor(x,y,d,o) {
		super(x,y,d,o);
		
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.speed = 3.0;
		this.jumpSpeed = 6.0;
		this.bulletSpeed = 5.0;
		this.gotoForce = new Point(1,1);
		this.sprite = "booksummoner";
		
		this.enemies = new Array();
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.times = {
			"rest" : Game.DELTASECOND * 0.75,
			"attack" : Game.DELTASECOND * 0.75,
			"cooldown" : Game.DELTASECOND * 2.0,
			"jump" : Game.DELTASECOND * 3,
			"walljump" : Game.DELTASECOND * 0.333
		};
		this.states = {
			"rest" : this.times.rest,
			"attack" : 9999.0,
			"cooldown" : this.times.cooldown,
			"jump" : 0.0,
			"walljump"  : 0.0,
			"canWalljump" : true,
			"runaway" : Math.random() > 0.5
		};
		
		this.on("collideHorizontal", function(h){
			if(!this.grounded){
				if(this.states.canWalljump){
					this.states.canWalljump = false;
					this.states.walljump = this.times.walljump;
					this.force.x = 0;
					this.force.y = 0;
				}
			} else {
				this.states.runaway = !this.states.runaway;
				this.force.x = 0;
			}
		});
		this.on("hurt", function(obj,damage){
			this.states.retreat = this.times.retreat;
			audio.play("hurt",this.position);
		});
		
		this.on("death", function(obj,pos,damage){
			Item.drop(this);
			audio.play("kill",this.position);
			this.destroy();
		});
		
		o = o || {};
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in o){
			this.difficulty = o["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		
		this.pushable = false;
		this.hurtByDamageTriggers = true;
		
		this.mass = 1.0;
		this.friction = 0.2;
		this.gravity = 0.0;
	}
	
	fire(){
		var ops = {"difficulty" : this.difficulty};
		
		for(let i=0; i < 3; i++){
			var emptySlot = true;
			if(this.enemies[i] != null && this.enemies[i]._isAdded){
				emptySlot = false;
			}
			
			if(emptySlot){
				var enm = new BookReptile(this.position.x, this.position.y, false, ops);
				enm.on("sleep", function(){this.destroy();});
				enm.states.missile = true;
				enm.mForce = new Point(this.forward()*i, 1);
				enm.mForce = enm.mForce.normalize(this.bulletSpeed);
				
				game.addObject(enm);
				this.enemies[i] = enm;
			}
			
		}
	}
	
	update(){
		if(this.life > 0){
			var dir = this.position.subtract(_player.position);
			
			if(this.states.walljump > 0){
				//Hit wall, get ready to jump off
				this.gravity = 0;
				this.force.x = this.force.y = 0;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				this.states.walljump -= this.delta;
				if(this.states.walljump <= 0){
					this.flip = !this.flip;
					this.force.x = this.forward() * this.jumpSpeed;
					this.force.y = -6;
					this.grounded = false;
					this.states.attack = this.times.attack;
				}
			} else if(!this.grounded){
				//Jump
				this.gravity = 0.3;
				this.friction = 0.06;
				this.states.rest = this.times.rest;
				
				this.states.attack -= this.delta;
				
				this.frame.x = (this.states.attack <= this.times.attack) ? 0 : 1;
				this.frame.y = 1;
				
				if(this.states.attack <= 0){
					this.states.attack = 9999;
					this.fire();
				}
				
			} else if(this.states.rest <= 0){
				//Run in a direction
				this.friction = 0.1;
				this.gravity = 1.0;
				this.force.x = this.forward() * this.speed;
				this.flip = dir.x > 0 != this.states.runaway;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				this.states.cooldown -= this.delta;
				
				if(!this.states.runaway && Math.abs(dir.x) < 64){
					this.states.cooldown = 0;
				}
				
				if(this.states.cooldown <= 0){
					this.states.attack = this.times.attack;
					this.states.cooldown = this.times.cooldown;
					this.states.jump = this.times.jump;
					this.grounded = false;
					this.force.x = this.forward() * this.jumpSpeed;
					this.force.y = -8;
				}
			} else {
				//Rest a moment
				this.states.canWalljump = true;
				this.gravity = 1.0;
				this.friction = 0.7;
				this.states.rest -= this.delta;
				
				this.frame.x = 0;
				this.frame.y = 0;
				
				if(this.states.rest <= 0){
					this.states.runaway = Math.random() > 0.5;
				}
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
			this.friction = 0.5;
		}
	}
}

self["BookSummoner"] = BookSummoner;



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
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
	this.moneyDrop = Spawn.money(4,this.difficulty);
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
	if( this.stun < 0 && this.life > 0) {
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
					missle = new Bullet(this.position.x, this.position.y+10);
				} else {
					missle = new Bullet(this.position.x, this.position.y-8);
				}
				missle.force.x = 6 * this.forward();
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
		
		/* Animate */
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
	} else {
		this.frame.x = 0;
		this.frame.y = 3;
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
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.states.direction *= -1.0;
	});
	this.on("struck", EnemyStruck);
	this.on(["wakeup","added"], function(){
		this.states.attack = 0.0;
		this.states.attackstage = 0;
		this.states.cooldown = this.attacks.cooldown;
		
		if(_player instanceof Player){
			var dir = this.position.subtract(_player.position);
			this.states.direction = dir.x > 0 ? -1 : 1;
		}
	});
	
	this.on("struckTarget", function(obj){
		if(obj instanceof Player && this.attacks.rest <= 0){
			this.attacks.rest = Game.DELTASECOND * 0.3333;
			console.log("struckTarget");
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	
	this.on("pre_death", function(){
		this.states.attackstage = 0;
	});
	this.on("death", function(){
		audio.play("kill",this.position);
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
			var fireForward = this.states.attackstage == 1;
			
			if(fireForward){
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
				this.strike(
					new Line(this.ball,this.ball.add(new Point(4,4))),
					{"direction" : fireForward?this.flip:!this.flip}
				);
			}
			
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
			//Walk back and forth
			
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
			
			this.frame.y = 0;
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.2) % 4;
			
			if( this.states.cooldown <= 0 && Math.abs( dir.x ) < this.attacks.distance ) {
				this.states.duck = Math.round(Math.random());
				this.states.attackstage = 1;
				this.states.cooldown = this.attacks.cooldown;
				this.flip = dir.x > 0;
				this.states.direction = this.flip ? -1.0 : 1.0;
				
			}
		}
	} else {
		this.frame.x = 2;
		this.frame.y = 1;
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
	this.moneyDrop = Spawn.money(7,this.difficulty);
	this.mass = 1.5;
	this.death_time = Game.DELTASECOND * 0.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
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
	
	this.on("sleep", function(obj){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(this.frame.x >= 1 && obj instanceof Player){
			var prelife = obj.life;
			obj.hurt(this,this.damage);
			if(obj.life != prelife){
				this.destroy();
			}
		}
	});
}
ChickenDrillSpike.prototype.update = function(){
	this.time -= this.delta;
	
	if(this.time <= 0){
		this.frame.x = Math.min(this.frame.x - this.delta * 0.5, 2);
		if(this.frame.x < 0){
			this.destroy();
		}
	} else {
		this.frame.x = Math.min(this.frame.x + this.delta * 0.5, 2);
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
	this.width = 32;
	this.height = 56;
	this.sprite = "deckard";
	this.speed = 0.7;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"transition" : 0.0,
		"current" : 0,
		"time" : 0.0,
		"timeTotal" : 0.0,
		"combo": 0,
		"attack" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.lifeMax = Spawn.life(6,this.difficulty);
	this.moneyDrop = Spawn.money(15,this.difficulty);
	this.mass = 4;
	this.damage = Spawn.damage(3,this.difficulty);
	this.death_time = Game.DELTASECOND * 2;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		
		Item.drop(this,20);
		audio.play("kill",this.position);
		
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
			batty.on("sleep", function(){this.destroy();});
			game.addObject(batty);
		}
	});
}

Deckard.STATE_IDLE = 0;
Deckard.STATE_CHARGE = 1;
Deckard.STATE_PUNCH = 2;
Deckard.STATE_FIRE = 3;
Deckard.STATE_LEAP = 4;

Deckard.prototype.setState = function(s){
	var dir = this.position.subtract(_player.position);
	this.states.current = s;
	
	if(this.states.current == Deckard.STATE_IDLE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
	} else if(this.states.current == Deckard.STATE_CHARGE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(this.states.current == Deckard.STATE_PUNCH){
		this.states.combo = 3;
	} else if(this.states.current == Deckard.STATE_FIRE){
		this.states.timeTotal = this.states.time = Game.DELTASECOND;
		this.flip = dir.x > 0;
	} else if(this.states.current == Deckard.STATE_LEAP){
		this.states.timeTotal = this.states.time = Game.DELTASECOND * 0.2;
		this.flip = dir.x > 0;
	}
}

Deckard.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.states.transition > 0){
			
		} else{
			if(this.states.current == Deckard.STATE_IDLE){
				this.states.time -= this.delta;
				this.frame.x = (this.frame.x + this.delta * 0.2) % 5;
				this.frame.y = 0;
				
				if(this.states.time <= 0){
					if(Math.abs(dir.x > 168)){
						if(Math.random() < 0.5){
							this.setState(Deckard.STATE_IDLE);
						} else {
							this.setState(Deckard.STATE_LEAP);
						}
					} else {
						if(Math.random() < 0.5){
							this.setState(Deckard.STATE_CHARGE);
						} else {
							this.setState(Deckard.STATE_FIRE);
						}
					}
					
				}
			} else if(this.states.current == Deckard.STATE_CHARGE){
				this.force.x += this.forward() * this.speed * this.delta;
				this.states.time -= this.delta;
				this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.1) % 4;
				this.frame.y = 4;
				
				if(this.states.time <= 0 || Math.abs(dir.x) < 64){
					if((dir.x < 0 && this.forward() < 0) || (dir.x > 0 && this.forward() > 0)){
						this.setState(Deckard.STATE_IDLE);
					} else if( Math.random() < 0.25 ){
						this.setState(Deckard.STATE_LEAP);
					} else {
						this.setState(Deckard.STATE_PUNCH);
					}
				}
			} else if(this.states.current == Deckard.STATE_PUNCH){
				this.states.time -= this.delta;
				this.frame = Deckard.anim_attack.frame(1 - this.states.time/this.states.timeTotal);
				
				if(this.frame.x == 1){
					this.grounded = false;
					this.force.x += this.forward() * this.speed * this.delta;
					this.force.y = Math.min(this.force.y - this.delta, -1);
				} else if(this.frame.x == 2){
					this.strike(Deckard.attack_rect);
				}
				
				if(this.states.time <= 0){
					if(this.states.combo <= 0){
						this.setState(Deckard.STATE_IDLE);
					} else {
						this.states.combo--;
						this.states.time = Game.DELTASECOND * 1.2;
						this.flip = dir.x > 0;
					}
				}
			} else if(this.states.current == Deckard.STATE_FIRE){
				this.flip = dir.x > 0;
				this.states.time -= this.delta;
				this.frame = Deckard.anim_fire.frame(1 - this.states.time/this.states.timeTotal);
				
				if(Timer.isAt(this.states.time,Game.DELTASECOND*0.2,this.delta)){
					var bullet = Bullet.createFireball(this.position.x, this.position.y);
					bullet.force = _player.position.subtract(this.position).normalize(6);
					bullet.damageFire = this.damage;
					bullet.effect = EffectSmoke;
					bullet.team = this.team;
					game.addObject(bullet);
				}
				
				if(this.states.time <= 0){
					this.setState(Deckard.STATE_IDLE);
				}
			} else if(this.states.current == Deckard.STATE_LEAP){
				this.states.time -= this.delta;
				if(this.grounded){
					this.frame.x = 0;
					this.frame.y = 3;
					if(this.states.time <= 0){
						this.setState(Deckard.STATE_IDLE);
					} else if(Timer.isAt(this.states.time,this.states.timeTotal*0.1,this.delta)){
						this.grounded = false;
						this.force.y = -12;
					}
				} else {
					if(this.force.y > 0){
						Combat.strike.apply(this,[Deckard.attack_rect, {"blockable":false}]);
					}
					this.frame.x = (this.force.y < -0.1 ? 1 : (this.force.y > 0.1 ? 3 : 2));
					this.frame.y = 1;
					if((Math.abs(dir.x) < 32) ||(dir.x < 0 && this.forward() < 0) || (dir.x > 0 && this.forward() > 0)){
						
					} else {
						this.force.x += this.forward() * this.speed * this.delta * 1.2;
					}
					this.force.y -= 0.2 * this.delta;
				}
			}
		}
	} else {
		this.frame.x = 1;
		this.frame.y = 3;
	}
}
Deckard.attack_rect = new Line(8,-8,32,24);
Deckard.anim_attack = new Sequence([
	[0,1,0.5],
	[1,1,0.5],
	[2,1,0.1],
	[3,1,0.5],
]);
Deckard.anim_fire = new Sequence([
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.4],
	[3,2,0.1],
	[4,2,0.5],
]);

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
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
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
		"cooldown" : Game.DELTASECOND * 1,
		"attack" : 0.0,
		"throwing" : 0.0,
		"throwingCool" : 0.0,
		"smoke" : 0
	};
	this.times = {
		"cooldown" : Game.DELTASECOND * 2.0,
		"attack" : Game.DELTASECOND * 0.6,
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
	this.moneyDrop = Spawn.money(7,this.difficulty);
	this.mass = 1.5;
	this.death_time = Game.DELTASECOND * 0.5;
	
	this.on("struck", EnemyStruck);
	this.on("wakeup", function(){
		this.states.attack = 0.0;
		this.states.drilling = 0;
		this.states.cooldown = Game.DELTASECOND * 3;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
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
			this.frame = DonkeyKnife.anim_throw.frame(progress);
			
			if(Timer.isAt(this.states.throwingCool,this.times.throwingCool*0.4,this.delta)){
				//Throw knife
				var missle;
				if( Math.random() > 0.5 ) {
					//Bottom
					missle = new Bullet(this.position.x, this.position.y+18);
				} else {
					//top
					missle = new Bullet(this.position.x, this.position.y+2);
				}
				missle.force.x = this.forward() * 9;
				missle.damage = this.damage;
				missle.frame.x = 4;
				missle.frame.y = 0;
				game.addObject( missle ); 
			}
			
			if(this.states.throwingCool <= 0){
				this.states.throwing--;
				this.states.throwingCool = this.times.throwingCool;
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
				
				if(!this.atLedge(-this.forward())){
					this.force.x = this.speed * -this.forward();
				}
				
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
DonkeyKnife.prototype.atLedge = function(dir){
	var corners = this.corners();
	if(dir > 0){
		var pos = new Point(corners.right + 8, corners.bottom + 8);
		return game.getTile(pos) == 0;
	} else {
		var pos = new Point(corners.left - 8, corners.bottom + 8);
		return game.getTile(pos) == 0;
	}
}
DonkeyKnife.anim_throw = new Sequence([
	[0,1,0.4],
	[1,1,0.1],
	[2,1,0.1],
	[3,1,0.4],
]);

 /* platformer\enemy_drillorb.js*/ 

DrillOrb.prototype = new GameObject();
DrillOrb.prototype.constructor = GameObject;
function DrillOrb(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.sprite = "drillorb";
	
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.baseDamage());
		}
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = this.lifeMax = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
}
DrillOrb.prototype.update = function(){
	if(this.life > 0){
		this.frame.x = (game.time * 0.2) % 4;
		this.frame.y = 0;
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

 /* platformer\enemy_firebird.js*/ 

FireBird.prototype = new GameObject();
FireBird.prototype.constructor = GameObject;
function FireBird(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "firebird";
	
	this.addModule( mod_combat );
	this.addModule( mod_rigidbody );
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.damage = 0;
	this.damageFire = Spawn.damage(2,this.difficulty);
	this.fire = new Point(x,y);
	
	this.speed = 0.4;
	this.frameWalkProgress = 0.0;
	this.frameTurnTime = 0.0;
	this.frameTurnTimeMax = Game.DELTASECOND * 0.25;
	this.previousGrounded = false;
	
	
	this.on("collideObject", function(obj){
		if(obj instanceof Airjet && obj.active){
			if(this.grounded){
				this.grounded = false;
				this.force.y = -5;
			} else {
				
			}
		}
	});
	
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(){
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
}
FireBird.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		
		if(this.stun > 0){
			this.force.x = 0;
			this.frame.x = 0;
			this.frame.y = 3;
		} else {
			if(this.grounded){
				if( this.frameTurnTime > 0){
					//Turn logic
					var p = 1 - (this.frameTurnTime / this.frameTurnTimeMax);
					this.frame.x = Math.min(1 + p*3, 3);
					this.frame.y = 3;
					this.frameTurnTime -= this.delta;
				} else {
					this.frameWalkProgress = (this.frameWalkProgress + Math.abs(this.force.x) * this.delta * 0.15) % 8.0;
					this.frame.x = (this.frameWalkProgress) % 4;
					this.frame.y = (this.frameWalkProgress*0.25);
					this.speed = 0.4;
					this.friction = 0.1;
					this.fire.x = this.position.x + this.forward() * 32;
					this.fire.y = this.position.y - 6;
					this.previousGrounded = true;
					
					if(dir.x > 0 != this.flip){
						this.frameTurnTime = this.frameTurnTimeMax;
						this.flip = !this.flip;
						this.frame.x = 1;
						this.frame.y = 3;
					}
				}
			} else {
				if(this.previousGrounded){
					this.frame.x = 0;
					this.previousGrounded = false;
				}
				this.flip = dir.x > 0;
				this.frameTurnTime = 0;
				this.frame.x = Math.min(this.frame.x + this.delta * 0.4, 3);
				this.frame.y = 2;
				this.speed = 0.25;
				this.friction = 0.05;
				this.force.y -= 0.8 * this.delta;
				this.fire.x = this.position.x;
				this.fire.y = this.position.y + 24;
			}
			
			this.force.x += this.delta * this.speed * this.forward();
		}
		
		var firearea = new Line(this.fire.x - 8, this.fire.y - 8, this.fire.x + 8, this.fire.y + 8);
		var hits = game.overlaps(firearea);
		for(var i=0; i < hits.length; i++){
			if( hits[i] instanceof Player && hits[i].intersects(firearea) ){
				hits[i].hurt(this, this.getDamage());
			}
		}
	} else {
		this.frame.x = 0;
		this.frame.y = 3;
	}
}

FireBird.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	if(this.life > 0){
		g.renderSprite("bullets",this.fire.subtract(c),this.zIndex,new Point((game.timeScaled*0.5)%3,3),this.flip);
	}
}

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
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life =  Spawn.life(5,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.damage = 0;
	this.damageFire = Spawn.damage(5,this.difficulty);
	this.defenceFire = Spawn.defence(4, this.difficulty);;
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
	
	Background.pushLight( this.position, 200, COLOR_FIRE );
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

 /* platformer\enemy_flameslime.js*/ 

FlameSlime.prototype = new GameObject();
FlameSlime.prototype.constructor = GameObject;
function FlameSlime(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "flameslime";
	this.speed = 4.0;
	this.zIndex = 3;
	this.small = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = 1;
	this.damage = 0;
	this.damageFire = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.defencePhysical = Spawn.defence(2, this.difficulty);
	this.defenceFire = Spawn.defence(4, this.difficulty);
	this.defenceIce = Spawn.defence(-4, this.difficulty);
	this.death_time = Game.DELTASECOND * 0.01;
	this.frame.y = 3;
	
	this.spawnSmallSlimes = true;
	
	if("small" in o){
		this.small = true;
		this.damageFire = Math.max(Math.floor(this.damageFire*0.5), 1);
		this.width = this.height = 14;
		this.frame.y = 4;
		this.spawnSmallSlimes = false;
		//Set origin to correct sprite sheet
		this.origin = new Point(0.5,0.2);
	}
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	
	this.jumpCount = 3;
	this.cooldown = 0.0;
	this.rest = 0.0;
	this.warm = 0.0;
	this.jumpForce = 9.0;
	this.firstSpawn = true;
	
	this.rest = Game.DELTASECOND * (0.3 + Math.random() * 1.4);
	
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			if(obj.invincible <= 0){
				obj.hurt(this, this.getDamage());
				this.life = 0;
				this.isDead();
			}
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		audio.play("kill",this.position);
		if(!this.small){
			Item.drop(this);
		}
		this.destroy();
		
		if(this.spawnSmallSlimes){
			//Spawn 
			for(var i = 0; i < 6; i++){
				var slime = new FlameSlime(
					this.position.x + 24 * (0.5 - Math.random()), 
					this.position.y + 24 * (0.5 - Math.random()),
					false, 
					{
						"difficulty" : this.difficulty,
						"small" : true
					}
				);
				slime.invincible = Game.DELTASECOND * 0.5;
				slime.force.x = -2.0 + (Math.random() * 4);
				slime.force.y = -2.0;
				slime.grounded = false;
				game.addObject(slime);
			}
		}
	});
}
FlameSlime.JUMP_SMALL = 3.0;
FlameSlime.JUMP_BIG = 5.0;


FlameSlime.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.grounded){
			this.force.x = 0;
			this.firstSpawn = false;
			if(this.rest > 0){
				this.frame.x = 3; 
				this.rest -= this.delta;
			} else if(this.cooldown > 0){
				this.frame.x = 0; 
				this.cooldown -= this.delta;
			} else if(this.warm > 0){
				this.frame.x = 1;
				this.warm -= this.delta;
			} else {
				this.jump = false;
				this.grounded = false;
				this.flip = dir.x > 0;
				
				if(this.jumpCount <= 0){
					this.force.y = -FlameSlime.JUMP_BIG;
					this.jumpCount = 3;
					this.warm = Game.DELTASECOND * 2.5;
					this.rest = Game.DELTASECOND * 1.5;
					this.cooldown = Game.DELTASECOND * (0.3 + Math.random() * 0.1);
				} else {
					this.force.y = -FlameSlime.JUMP_SMALL;
					this.jumpCount--;
					this.cooldown = Game.DELTASECOND * (0.3 + Math.random() * 0.1);
					this.warm = Game.DELTASECOND * (0.3 + Math.random() * 0.2);
				}
			}
			
		} else {
			this.frame.x = 2; 
			if(!this.firstSpawn){
				this.force.x = this.forward() * this.speed;
			}
		}
		Background.pushLight(this.position, 80, COLOR_FIRE);
	} else{
		this.frame.x = 0;
	}
}


FlameSlimeWalker.prototype = new GameObject();
FlameSlimeWalker.prototype.constructor = GameObject;
function FlameSlimeWalker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 48;
	this.sprite = "flameslime";
	this.speed = 0.25;
	this.zIndex = 3;
	
	//Set origin to correct sprite sheet
	this.origin = new Point(0.5,0.75);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.hurtByDamageTriggers = false;
	this.spawnDuplicate = false;
	this.walkerID = false;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	var autoWalkerID = "walker_"+Math.floor(x)+"_"+Math.floor(y);
	
	this.walkerID = autoWalkerID;
	
	var walkers = game.getObjects(Walker);
	var walker = walkers.find(function(a){ return a.walkerID == autoWalkerID; });
	
	if(walker){
		if(walkers[i].isOnscreen()){
			this.spawnDuplicate = true;
		} else {
			walkers[i].destroy();
		}
	}
	
	
	this.lifeMax = this.life = 1;
	this.damage = 0;
	this.damageFire = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.defencePhysical = Spawn.defence(1, this.difficulty);;
	this.defenceFire = Spawn.defence(4, this.difficulty);;
	this.defenceIce = Spawn.defence(-4, this.difficulty);;
	this.death_time = Game.DELTASECOND * 0.01;
	this.frame.y = 3;
	
	this.spawnSmallSlimes = true;
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	
	this.jumpCount = 3;
	this.cooldown = 0.0;
	this.rest = 0.0;
	this.warm = 0.0;
	this.jumpForce = 9.0;
	this.firstSpawn = true;
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			obj.hurt(this, this.getDamage());
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		audio.play("kill",this.position);
		this.destroy();
		
		if(this.spawnSmallSlimes){
			//Spawn 
			this.createSlime(-10.0);
			this.createWalker();
		}
	});
}
FlameSlimeWalker.prototype.createSlime = function(upwardForce){
	var slime = new FlameSlime(
		this.position.x, 
		this.position.y,
		false, 
		{
			"difficulty" : this.difficulty
		}
	);
	slime.invincible = Game.DELTASECOND * 0.5;
	slime.force.x = -2.0 + (Math.random() * 4);
	slime.force.y = upwardForce;
	slime.grounded = false;
	game.addObject(slime);
}
FlameSlimeWalker.prototype.createWalker = function(){
	var walker = new Walker(this.position.x, this.position.y);
	walker.walkerID = this.walkerID;
	walker.standTime = Walker.STAND_TIME;
	walker.flip = this.flip;
	game.addObject(walker);
}
FlameSlimeWalker.prototype.update = function(){
	if(this.spawnDuplicate){
		this.destroy();
		this.createSlime(0.0);
		this.spawnDuplicate = false;
	} else if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.grounded){
			this.flip = dir.x > 0;
			
			this.force.x += this.forward() * this.speed * this.delta;
			
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
			this.frame.y = 0;
			
		} else {
			
		}
		Background.pushLight(this.position, 80, COLOR_FIRE);
	} else{
		this.frame.x = 0;
	}
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
	this.speed = 3.0;
	this.blockKnockback = 300;
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
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.mass = 1.0;
	
	this.on("blocked", function(obj){
		let d = obj.position.x > this.position.x ? -1 : 1;
		this.force.x = this.blockKnockback;
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && obj.hasModule(mod_rigidbody)){
			this.changeDirection();
		}
	});
	this.on("collideHorizontal", function(dir){
		this.position.x += dir > 0 ? 1 : -1;
		this.changeDirection();
	});
	this.on(["added","wakeup"], function(){
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
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	this.faceTarget();
}
Flederknife.prototype.changeDirection = function(){
	this.force.x = 0;
	if(this.turndelay < 0){
		this.states.direction *= -1.0;
		this.turndelay = Game.DELTASECOND * 0.5;
	}
	
	if(this.difficulty > 0){
		this.states.duck = Math.round(Math.random());
	}
	if(this.difficulty > 99){
		this.states.jump_tick--;
	}
}
Flederknife.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.flip = this.states.direction < 0;
		
		this.addHorizontalForce(this.speed * this.forward());
		
		if(this.atLedge()){
			this.changeDirection();
		}
		
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
			this.force.x = this.forward() * 300;
			this.states.jump_tick = 2 + Math.floor(Math.random()*3);
		}
		this.turndelay -= this.delta; 
		
		
		/* Animation */
		
		if( this.states.jump ){
			this.frame.x = (this.frame.x + this.delta * 0.4) % 3;
			this.frame.y = 2;
		} else {
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 6.0) % 4;
			if(this.states.duck){
				this.frame.y  = 0;
			} else {
				this.frame.y  = 1;
			}
		}
		
	} else {
		this.frame.x = 3;
		this.frame.y  = 2;
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
		audio.play("hurt",this.position);
	});
	
	this.on("death", function(){
		
		audio.play("kill",this.position);
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
		audio.play("hurt",this.position);
	});
	this.on("struck", EnemyStruck);
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = 9999;
	this.damageReduction = 1.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.loopTime = 0.0;
	this.loopTimeFull = Game.DELTASECOND;
	this.hurtByDamageTriggers = false;
	
	this.mass = 1.0;
	this.gravity = 0.0;
	this.friction = 0.8;
	this.pushable = false;
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
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

 /* platformer\enemy_hammerman.js*/ 

HammerMan.prototype = new GameObject();
HammerMan.prototype.constructor = GameObject;
function HammerMan(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 30;
	this.sprite = "hammerman";
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
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.attackTime = 0;
	this.attackTimeTotal = Game.DELTASECOND * 4.0;
	
	this.life = Spawn.life(2,this.difficulty);
	this.lifeMax = Spawn.life(2,this.difficulty);
	this.splashDamage = Spawn.damage(2,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 1.2;
	
	this.on("struck", EnemyStruck);
	
	this.on(["wakeup","added"], function(){
		let dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
HammerMan.prototype.update = function(){
	if(this.life > 0 && !this.stun <= 0){
		this.attackTime = (this.attackTime + this.delta) % this.attackTimeTotal;
		this.frame = HammerMan.anim_attack.frame(this.attackTime/this.attackTimeTotal);
		if(Timer.isAt(this.attackTime, this.attackTimeTotal*0.45, this.delta)){
			this.strike(new Line(0,-20,42,-4));
		}
	} else {
		this.frame.x = 2;
		this.frame.y = 0;
		this.attackTime = 0;
	}
}
HammerMan.anim_attack = new Sequence([
	[0,0,1.5],
	[0,1,0.3],
	[0,2,0.1],
	[0,3,0.1],
	
	[1,0,1.5],
	[1,1,0.2],
	[1,2,0.2],
	[1,3,0.2],
]);

 /* platformer\enemy_igbo.js*/ 

class Igbo extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "igbo";
		this.width = 32;
		this.height = 40;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.speed = 0.5;
		this.mass = 4.0;
		this.death_time = Game.DELTASECOND * 3;
		
		this.guard.active = true;
		this.guard.x = 8;
		this.guard.y = -24;
		this.guard.w = 32;
		this.guard.h = 32;
		this.guard.rotation = 0;
		this.guard.omidirectional = true;
		
		this.difficulty = Spawn.difficulty;
		this.lifeMax = this.life = Spawn.life(9, this.difficulty);
		this.damage = Spawn.damage(4);
		this.moneyDrop = Spawn.money(6,this.difficulty);
		
		this.states = {
			"phase" : Igbo.PHASE_IDLE,
			"timer" : 0.0,
			"blockTimer" : 0.0,
			"blockCount" : 0,
			"cooldown" : Game.DELTASECOND * 3,
			"cooldownMax" : Game.DELTASECOND * 3,
		}
		
		this.on("block", function(obj,pos,damage){
			audio.play("block", this.position);
			this.states.blockCount++;
			this.states.blockTimer = Game.DELTASECOND;
			if(this.states.blockCount >= 3){
				this.setState(Igbo.PHASE_SHIELDSMASH);
			}
		});
		this.on("hurt", function(){
			this.setState(Igbo.PHASE_RETREAT);
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			Item.drop(this);
			audio.play("kill",this.position);
			this.destroy();
		});
		
	}
	update(){
		if(this.life > 0 && this.stun <= 0){
			let tdir = this.position.subtract(this.target().position);
			
			this.states.blockTimer -= this.delta
			if(this.states.blockTimer <= 0){
				this.states.blockTimer = 0.0;
				this.states.blockCount = 0;
			}
			
			if(this.states.phase == Igbo.PHASE_SHIELDSMASH){
				//Shield smash
				if(this.delta > 0){
					this.guard.active = false;
					this.target().hurt(this, this.damage);
					this.frame = new Point(0,3);
				} else {
					this.frame = new Point(0,2);
				}
				this.states.timer -= this.delta;
				if(this.states.timer <= 0){
					this.setState(Igbo.PHASE_IDLE);
				}
				
			} else if(this.states.phase == Igbo.PHASE_RETREAT){
				//Retreat with fire
				this.guard.active = true;
				this.flip = tdir.x > 0;
				
				if(this.grounded){
					if(this.states.timer > 0){
						this.grouded = false;
						this.force.y = -6;
						this.force.x = -this.speed * 5;
					} else {
						this.setState(Igbo.PHASE_IDLE);
					}
				} else {
					this.force.x -= this.forward() * this.delta * this.speed;
					this.force.y -= this.delta * 0.8;
					this.states.timer -= this.delta;
					if(Timer.isAt(this.states.timer, 0, this.delta)){
						this.fire(1);
					}
				}
				
			} else if(this.states.phase == Igbo.PHASE_ATTACK){
				//Attack 
				this.guard.active = false;
				this.states.timer -= this.delta;
				if(Timer.isAt(this.states.timer, Game.DELTASECOND * 0.25, this.delta)){
					this.fire(-1);
				}
				this.frame = new Point(0,0);
			} else if(this.states.phase == Igbo.PHASE_IDLE){
				//Posture
				this.guard.active = true;
				this.flip = tdir.x > 0;
				let a = tdir.toAngle();
				
				if(Math.abs(tdir.x) < 80){
					this.states.cooldown -= this.delta * 0.5;
					if(this.states.cooldown <= 0) {
						this.setState(Igbo.PHASE_RETREAT);
					}
				} else {
					this.states.cooldown -= this.delta * 1;
					if(this.states.cooldown <= 0){
						this.setState(Igbo.PHASE_ATTACK);
					}
				}
				
				this.guard.rotation = (this.flip?0:180) - a * (180 / Math.PI);
				this.guard.x = Math.abs( Math.cos(a) * -16 ) + 0;
				this.guard.y = Math.min( Math.sin(a) * 16, 0 ) - 24;
				
				if(Math.abs(tdir.x) < 80 && tdir.y > 32){
					this.frame = new Point(0,1);
				} else {
					this.frame = new Point(0,0);
				}
				
			}
		} else {
			
		}
	}
	setState(s){
		this.states.phase = s;
		if(s == Igbo.PHASE_SHIELDSMASH){
			game.slow(0, Game.DELTASECOND * 0.8);
			this.states.timer = Game.DELTASECOND * 0.5;
			this.states.blockCount = 0;
		}
		if(s == Igbo.PHASE_RETREAT){
			this.states.timer = Game.DELTASECOND * 0.5;
		}
		if(s == Igbo.PHASE_ATTACK){
			this.states.timer = Game.DELTASECOND * 0.5;
		}
	}
	fire(dir){
		var yforce = dir > 0 ? 4 : -8;
		
		var bomb = new CarpetBomb(this.position.x, this.position.y);
		bomb.damageFire = this.damage;
		bomb.force = new Point(this.forward()*6, yforce);
		game.addObject(bomb);
	}
	render(g,c){
		GameObject.prototype.render.apply(this,[g,c]);
		
		if(this.guard.active){
			g.renderSprite(this.sprite, this.position.subtract(c),this.zIndex+1,Igbo.SHIELDFRAME,this.flip,{
				"rotation" : this.guard.rotation
			});
		}
	}
}
Igbo.SHIELDFRAME = new Point(0,4);
Igbo.PHASE_SHIELDSMASH = 0;
Igbo.PHASE_RETREAT = 1;
Igbo.PHASE_ATTACK = 2;
Igbo.PHASE_IDLE = 3;


self["Igbo"] = Igbo;

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
		"guard_tire" : Game.DELTASECOND * 3,
		"retreat" : 0
	}
	
	this.attack_time = Game.DELTASECOND * 0.9;
	this.thrust_power = 4;
	
	this.guard.active = true;
	this.guard.x = -24;
	this.guard.y = 8;
	this.guard.w = 32;
	this.guard.h = 16;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(12,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(15,this.difficulty);
	this.mass = 3.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 1;
	this.stun_time = 0;
	this.xp_award = 18;
	this.money_award = 8;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		this.states.guard_tire -= Game.DELTASECOND * 0.3;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.retreat = Game.DELTASECOND * 0.5;
		this.states.guard_freeze = 0.0;
	});
	this.on("death", function(){
		Item.drop(this,this.money_award);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	this.calculateXP();
}
Knight.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		var home_x = this.position.x - this.start_x;
		
		if(this.states.attack > 0){
			
			var progress = 1 - (this.states.attack / this.attack_time);
			
			if(this.states.attack_down){
				this.frame = Knight.anim_attackdown.frame(progress);
			} else{
				this.frame = Knight.anim_attackup.frame(progress);
			}
			
			
			if(this.frame.x == 1){
				this.force.x = this.forward() * this.thrust_power;
				if(this.states.attack_down){
					this.strike(new Line(0,16,48,20));
				} else {
					this.strike(new Line(0,0,48,4));
				}
			} 
			
			this.states.attack -= this.delta;
		} else if(this.states.combo > 0){
			this.states.attack = this.attack_time;
			this.states.attack_down = Math.random() > 0.5;
			this.states.combo--;			
		} else {
			this.flip = dir.x > 0;
			if(this.states.cooldown <= 0 && Math.abs(dir.x) < 64){
				this.force.x = 0;
				this.states.combo = 3;
				this.states.cooldown = Game.DELTASECOND * 1.5;
			}
			this.states.cooldown -= this.delta;
			
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
		
		if(this.states.guard_freeze > 0){
			this.states.guard_tire = Game.DELTASECOND * 3;
			this.states.guard_freeze -= this.delta;
		} else {
			this.states.guard = _player.states.duck ? 1 : 2;
			this.states.guard_tire -= this.delta;
			if(this.states.guard_tire <= 0){
				this.states.guard_freeze = Game.DELTASECOND * 0.8;
			}
		}
		
		if(this.states.guard == 1){
			//bottom
			this.guard.y = 12;
		} 
		if(this.states.guard == 2){
			this.guard.y = -8;
		}
	} else {
		this.guard.active = false;
		this.frame.x = 3;
		this.frame.y = 1;
	}
}
Knight.prototype.render = function(g,c){
	var filter = {"shader":this.filter};

	//Render body
	GameObject.prototype.render.apply(this, [g,c]);
	
	//Shield guard
	if(this.guard.active){
		//render shield
		var shield_f = this.states.attack > 0 ? 1 : 0;
		var zPlus = this.states.attack > 0 && this.frame.x >= 1 ? -1 : 1;
		var shieldOff = this.states.guard == 1 ? 16 : 0;
		g.renderSprite(
			this.sprite,
			this.position.add(new Point(0,shieldOff)).subtract(c),
			this.zIndex+zPlus,
			new Point(shield_f, 3), 
			this.flip, 
			filter
		);
	}
}
Knight.anim_attackup = new Sequence([
	[0,2,0.8],
	[1,2,0.1],
	[2,2,0.4],
]);
Knight.anim_attackdown = new Sequence([
	[0,1,0.8],
	[1,1,0.1],
	[2,1,0.4],
]);

 /* platformer\enemy_knior.js*/ 

Knior.prototype = new GameObject();
Knior.prototype.constructor = GameObject;
function Knior(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "knior";
	
	this.speed = 0.6;
	this.jumpPower = 11.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.timers = {
		"jumpPrep" : 0.0,
		"jumpPrepReady" : false,
		"knifeReady" : true,
		"rest" : Game.DELTASECOND * 1.5,
		"throwKnife" : 0.0,
		"throwKnifeTime" : Game.DELTASECOND * 0.5,
		"cooldown" : 0.0
	}
	
	this.lifeMax = this.life = Spawn.life(6,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	
	this.defencePhysical = Spawn.defence(1, this.difficulty);
	this.mass = 1.0;
	this.gravity = 0.5;
	
	this.on("collideHorizontal", function(x){
	});
	
	this.on("collideObject", function(obj){
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
	});
	
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Knior.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.grounded){
			
			if(this.timers.rest > 0){
				this.timers.jumpPrepReady = false;
				this.timers.rest -= this.delta;
				this.frame.x = 0;
				this.frame.y = 2;
			} else if(this.timers.jumpPrepReady){
				this.force.x = 0;
				this.timers.jumpPrep -= this.delta;
			} else{
				this.flip = dir.x > 0;
				this.force.x += this.forward() * this.speed * this.delta;
				this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
				this.frame.y = 0;
			}
			
			if(Math.abs(dir.x) < 72){
				this.flip = dir.x > 0;
				this.timers.jumpPrepReady = true;
				this.frame.x = 0;
				this.frame.y = 2;
			}
			
			if(this.timers.jumpPrepReady && this.timers.jumpPrep <= 0){
				this.grounded = false;
				this.force.y = -this.jumpPower;
				this.force.x = this.forward() * this.speed;
				this.timers.rest = Game.DELTASECOND;
				this.timers.jumpPrep = Game.DELTASECOND * 0.5;
			}
			
			this.timers.knifeReady = true;
			this.timers.throwKnife = 0.0;
			
		} else {
			this.frame.x = 0;
			this.frame.y = 1;
			
			if(this.timers.throwKnife > 0){
				var progress = 1 - this.timers.throwKnife / this.timers.throwKnifeTime;
				this.frame = Knior.anim_knife.frame(progress);
				this.timers.throwKnife -= this.delta;
				
				if(Timer.isAt(this.timers.throwKnife, this.timers.throwKnifeTime*0.75, this.delta)){
					var bullet = new Bullet(this.position.x, this.position.y);
					bullet.rotation = 90;
					bullet.team = this.team;
					bullet.damage = this.damage;
					bullet.setDeflect();
					bullet.force = new Point(0, 8);
					bullet.sprite = this.sprite;
					bullet.frame = new Point(2,2);
					game.addObject(bullet);
				}
			} else if(dir.y < 0){
				//Above the player
				if(this.timers.knifeReady && Math.abs(dir.x) < 16){
					this.timers.throwKnife = this.timers.throwKnifeTime;
					this.timers.knifeReady = false;
				}
			}
			
			this.force.x += this.forward() * this.delta * this.speed;
		}
	} else{
		this.frame.x = 1;
		this.frame.y = 2;
	}
}
Knior.anim_knife = new Sequence([
	[1,1,0.1],
	[2,1,0.1],
	[3,1,0.2],
	[4,1,0.1],
	[5,1,0.5],
]);

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
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
	this.speed = 0.225;
	this.frame = 0;
	this.frame_row = 0;
	this.gravity = 0.0;
	this.friction = 0.08;
	
	this.cooldown = Game.DELTASECOND * 3;
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
		
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
	this.hurtByDamageTriggers = false;
	
	this.force.y = this.maxForce;
	
	this.on("struck", EnemyStruck);
	
	this.on("wakeup", function(){
		this.life = 1;
		this.dead = false;
	});
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
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

 /* platformer\enemy_malsum.js*/ 

Malsum.prototype = new GameObject();
Malsum.prototype.constructor = GameObject;
function Malsum(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 18;
	this.sprite = "malsum";
	this.speed = 0.3;
	this.start = new Point(x,y);
	
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"hop" : Game.DELTASECOND * 0.2,
		"attack" : Game.DELTASECOND,
		"cooldown" : Game.DELTASECOND
	}
	this.states = {
		"hop" : 0.0,
		"attack" : 0.0,
		"cooldown" : this.times.cooldown,
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.collideDamage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.mass = 1.0;
	this.gravity = 0.5;
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj){
		Item.drop(this,3);
		audio.play("kill",this.position);
		this.destroy();
	});
}
Malsum.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0 ){
		
		if(this.grounded){
			this.frame = new Point(0,0);
		} else {
			this.frame = new Point(Math.max(Math.min(1+this.force.y,2),0),1);
		}
		
		if(this.states.cooldown > 0){
			if(this.grounded){
				this.states.cooldown -= this.delta;
				this.states.hop -= this.delta;
				this.flip = dir.x > 0;
			}
			
			if(this.states.cooldown > 0 && this.states.hop <= 0){
				this.states.hop = this.times.hop;
				this.grounded = false;
				this.force.y = -5;
				this.force.x = (this.position.x > this.start.x ? -1 : 1) * 4;
			}
			
			if(this.states.cooldown <= 0){
				this.states.attack = this.times.attack;
				if(Math.random() > 0.5){
					this.grounded = false;
					this.force.y = -5;
				}
			}
		} else if(this.states.attack > 0){
			this.states.attack -= this.delta;
			
			if(Timer.isAt(this.states.attack, this.times.attack * 0.5, this.delta)){
				var bullet = new Bullet(this.position.x, this.position.y + 4);
				bullet.damage = this.damage;
				bullet.blockable = true;
				bullet.frame = new Point(1,0);
				bullet.force.x = this.forward() * 8;
				game.addObject(bullet);
			}
			
			if(this.states.attack < this.times.attack * 0.5){
				this.frame = new Point(1,0);
			}
			
			if(this.states.attack <= 0 ){
				this.states.cooldown = this.times.cooldown;
			}
		}
	} else {
		this.frame.x = 0;
		this.frame.y = 2;
	}
}

 /* platformer\enemy_manonfire.js*/ 

ManOnFire.prototype = new GameObject();
ManOnFire.prototype.constructor = GameObject;
function ManOnFire(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 32;
	this.sprite = "manonfire";
	this.speed = 1.0;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.timers = {
		"walkcycle" : 0.0,
		"cooldown" : 0.0,
		"fireball" : 0.0,
		"fireballTime" : Game.DELTASECOND * 1.2
	}
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.damage = 0;
	this.damageFire = Spawn.damage(3,this.difficulty);
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceFire = Spawn.defence(4,this.difficulty);
	this.defenceIce = Spawn.defence(-4,this.difficulty);
	this.mass = 1.0;
	
	this.on("collideHorizontal", function(x){
		this.force.x = -this.force.x;
		this.flip = !this.flip;
	});
	
	this.on("collideObject", function(obj){
		if(this.life > 0){
			if(obj instanceof Player){
				obj.hurt(this,this.getDamage());
			}
		}
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("pre_death", function(){
		this.frame.x = 0;
		this.frame.y = 2;
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
ManOnFire.prototype.update = function(){
	if ( this.life > 0 ) {
		if(this.timers.fireball > 0){
			var progress = 1 - (this.timers.fireball / this.timers.fireballTime);
			this.timers.fireball -= this.delta;
			
			this.frame = ManOnFire.anim_fire.frame(progress);
			
			if(Timer.isAt(this.timers.fireball,this.timers.fireballTime*0.5,this.delta)){
				var fb = Bullet.createFireball(this.position.x, this.position.y,{"team":this.team,"damage":this.damageFire});
				fb.force = new Point(this.forward() * 6, 0);
				game.addObject(fb);
			}
		} else {
			if( this.atLedge() ){
				//Turn around, don't fall off the edge
				this.force.x = -this.force.x;
				this.flip = !this.flip;
			}
			
			var dir = this.position.subtract(_player.position);
			
			if(Math.abs(dir.y) < 48 && this.timers.cooldown <= 0){
				this.flip = dir.x > 0;
				this.timers.fireball = this.timers.fireballTime;
				this.timers.cooldown = Game.DELTASECOND * (2.0 * Math.random()*1.5);
			}
			
			this.timers.cooldown -= this.delta;
			this.force.x = this.speed * this.forward();
			this.timers.walkcycle = (this.timers.walkcycle + this.delta * 0.3) % 6;
			this.frame.x = this.timers.walkcycle % 3;
			this.frame.y = this.timers.walkcycle / 3;
		}
		
		Background.pushLight( this.position, 120, COLOR_FIRE );
	} else{
		this.frame.x += this.delta * 0.3;
		this.frame.y = 2;
		
		if(this.frame.x >= 3){
			this.trigger("death");
		}
	}
}
ManOnFire.anim_fire = new Sequence([
	[0,3,0.1],
	[1,3,0.2],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.5]
]);

 /* platformer\enemy_moleminer.js*/ 

Moleminer.prototype = new GameObject();
Moleminer.prototype.constructor = GameObject;
function Moleminer(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 24;
	this.sprite = "moleminer";
	this.speed = 0.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.states = {
		"blocking" : 0.0,
		"escape" : 0,
		"attack" : 0.0,
		"charge" : 0.0,
		"leap" : 0.0,
		"backoff" : 0.0,
		"cooldown" : Game.DELTASECOND
	};
	this.times = {
		"blocking" : Game.DELTASECOND * 0.5,
		"escape" : Game.DELTASECOND * 0.2,
		"attack" : Game.DELTASECOND * 2.0,
		"charge" : Game.DELTASECOND * 2.0,
		"leap" : Game.DELTASECOND * 2.0,
		"backoff" : Game.DELTASECOND * 2.00,
		"cooldown" : Game.DELTASECOND * 2.0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(4,this.difficulty);
	this.lifeMax = Spawn.life(4,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.defenceFire = Spawn.defence(1,this.difficulty);
	this.defenceIce = Spawn.defence(-1,this.difficulty);
	this.mass = 1.0;
	
	this.guard.active = true;
	this.guard.y = -16;
	this.guard.h = 20;
	
	this.on("collideHorizontal", function(x){
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		
		this.states.escape = this.times.escape;
		this.force.x = -5 * this.forward();
		this.force.y = -6;
		this.grounded = false;
		
		if(Math.random() > 0.6){
			this.states.backoff = this.times.backoff;
		}
	});
	this.on("block", function(obj){
		audio.play("block",this.position);
		var dir = this.position.subtract( obj.position );
		this.states.blocking = this.times.blocking;
		this.force.x = 5 * (dir.x > 0 ? 1 : -1);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Moleminer.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		this.guard.active = true;
		this.criticalChance = 0.0;
		
		if(this.states.leap > 0){
			var progress = 1 - (this.states.leap / this.times.leap);
			this.states.leap -= this.delta;
			this.states.blocking = 0;
			this.frame = Moleminer.anim_leap.frame(progress);
			
			if(this.frame.y == 2 || this.frame.y == 3){
				this.strike(new Line(12,-6,30,12));
				this.criticalChance = 1.0;
			}
			if(progress > 0.3){
				this.guard.active = false;
			}
			if(Timer.isAt(this.states.leap,this.times.leap*0.7,this.delta)){
				this.force.x = this.forward() * 6;
				this.force.y = -6;
				this.grounded = false;
			}
		} else if(this.states.blocking > 0){
			this.frame.x = 4;
			this.frame.y = 0;
			this.states.blocking -= this.delta;
		} else if(this.states.attack > 0){
			var progress = 1 - (this.states.attack / this.times.attack);
			this.frame = Moleminer.anim_attack.frame(progress);
			this.states.attack -= this.delta;
			this.guard.active = false;
			if(this.frame.y == 1 || this.frame.y == 2 || this.frame.y == 5){
				this.strike(new Line(12,-10,26,-6));
			}
			if(this.states.attack <= 0 && Math.random() > 0.5){
				this.states.backoff = this.times.backoff;
			}
		} else if(this.states.charge > 0){
			this.force.x += this.forward() * this.speed * this.delta * 2.0;
			this.frame.x = 0;
			this.frame.y = (this.frame.y + this.delta * Math.abs(this.force.x) * 0.15) % 4;
			
			if(this.atLedge()){
				this.states.charge = 0;
				this.force.x = 0;
			}
			
			if(Math.abs(dir.y) < 32 && _player.grounded){
				if(Math.abs(dir.x) < 64){
					this.states.charge = 0;
					this.states.leap = this.times.leap;
					this.force.x = 0;
				}
			} else {
				this.states.charge -= this.delta;
			}
		} else if(this.states.escape > 0) {
			if(this.grounded){
				this.frame.x = 4;
				this.frame.y = 4;
				this.states.escape -= this.delta;
			} else {
				this.frame.x = 4;
				this.frame.y = this.force.y > 0 ? 3 : 2;
			}
		} else if(!this.grounded){
			//Do nothing while falling
			this.frame.x = 2;
			this.frame.y = 1;
		} else {
			//Walking
			if(this.atLedge()){
				this.states.backoff = this.times.backoff;
			}
			
			var direction = 1;
			if(this.states.backoff > 0){
				direction = -1;
				this.states.backoff -= this.delta;
				if(this.atLedge(this.forward()*-1)){
					this.states.backoff = 0;
				}
				if(this.states.backoff <= 0){
					if(Math.abs(dir.x) > 80 && Math.abs(dir.y) < 32){
						this.states.charge = this.times.charge;
					}
				}
			}
			this.flip = dir.x > 0;
			this.force.x += this.forward() * this.speed * this.delta * direction;
			this.frame.x = 0;
			this.frame.y = (this.frame.y + this.delta * Math.abs(this.force.x) * 0.15) % 4;
			this.states.cooldown -= this.delta;
			
			if(this.states.cooldown <= 0){
				if(Math.abs(dir.x) > 80 && Math.abs(dir.y) < 32){
					this.states.charge = this.times.charge;
					this.flip = dir.x > 0;
				} else if(Math.abs(dir.x) < 64 && Math.abs(dir.y) < 32){
					this.states.attack = this.times.attack;
					this.flip = dir.x > 0;
				}
				this.states.cooldown = this.times.cooldown;
			}
		}
		
	} else{
		//dead
		this.frame.x = 3;
		this.frame.y = 0;
	} 
}

Moleminer.anim_leap = new Sequence([
	[1,0,0.3],
	[1,1,0.1],
	[1,2,0.05],
	[1,3,0.05],
	[1,4,0.5]
]);
Moleminer.anim_attack = new Sequence([
	[3,0,0.2],
	[3,1,0.05],
	[3,2,0.1],
	[3,3,0.2],
	[3,4,0.2],
	[3,5,0.1],
	[3,6,0.4],
]);

 /* platformer\enemy_nolt.js*/ 

Nolt.prototype = new GameObject();
Nolt.prototype.constructor = GameObject;
function Nolt(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	
	this.sprite = "nolt";
	
	//this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("wakeup", function(obj,damage){
		this.life = this.lifeMax;
		this.frame.x = 0;
		this.frame.y = 0;
	});
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("block", function(obj,damage){
		audio.play("block", this.position);
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		audio.play("kill",this.position);
		this.interactive = false;
		this.frame.x = 0;
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.guard.x = -16;
	this.guard.y = -20;
	this.guard.w = 32;
	this.guard.h = 16;
	this.guard.omidirectional = true;
	
	this.life = this.lifeMax = Spawn.life(0,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0,
		"block" : 0.0
	};
}
Nolt.prototype.update = function(){
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		this.guard.active = false;
		
		this.visible = true;
		this.interactive = true;
		if(this.states.attack > 0){
			this.states.attack -= this.delta;
			var progress = 1 - Math.min(this.states.attack / Nolt.TIME_ATTACK, 1.0);
			this.frame = Nolt.anim_attack.frame(progress);
			
			if(Timer.isAt(this.states.attack, Nolt.TIME_ATTACK * 0.75, this.delta)){
				var ger = new Gernade(this.position.x, this.position.y+16);
				ger.damageSlime = this.damage;
				ger.team = this.team;
				game.addObject(ger);
			}
		} else if(dir.y > 0 || this.states.block > 0) {
			//Protect head
			if(dir.y > 0){
				this.states.block = Math.min(this.states.block + this.delta, Nolt.TIME_BLOCK);
				var progress = this.states.block / Nolt.TIME_BLOCK;
				this.frame.x = Math.floor(progress * 2);
			} else {
				this.states.block = Math.max(this.states.block - this.delta, 0);
				this.frame.x = 3;
			}
			this.guard.active = true;
			this.frame.y = 2;
		} else {
			this.flip = dir.x > 0;
			this.states.block = 0.0;
			this.frame.x = (this.frame.x + this.delta * 0.1) % 4;
			this.frame.y = 0;
			this.states.cooldown -= this.delta;
			if(Math.abs(dir.x) < 80 && this.states.cooldown <= 0){
				this.states.cooldown = Game.DELTASECOND * 2.5;
				this.states.attack = Nolt.TIME_ATTACK;
			}
		}
	} else {
		this.frame.x += this.delta * 0.25;
		this.frame.y = 3;
		if(this.frame.x >= 4){
			this.visible = false;
		}
	}
}
Nolt.TIME_ATTACK = Game.DELTASECOND * 1.2;
Nolt.TIME_BLOCK = Game.DELTASECOND * 0.5;
Nolt.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.8]
]);

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
		audio.play("hurt",this.position);
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
		
		Item.drop(this);
		audio.play("kill",this.position);
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
	this.moneyDrop = Spawn.money(9,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.mass = 3.0;
	this.death_time = Game.DELTASECOND * 1;
	
	//SpecialEnemy(this);
	this.calculateXP();
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 2,
		"attack" : new Timer(0),
		"attack_lower" : false
	};
	this.attack = {
		"warm" : Game.DELTASECOND,
		"release" : Game.DELTASECOND * 0.3
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
					var bullet = new Bullet(this.position.x, this.position.y+4);
					bullet.blockable = 1;
					bullet.force.x = this.forward() * 6;
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

 /* platformer\enemy_polate.js*/ 

class Polate extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 48;
		this.sprite = "polate";
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.death_time = Game.DELTASECOND;
		this.lifeMax = this.life = Spawn.life(5,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(5,this.difficulty);
		this.mass = 1.0;
		this.pushable = false;
		
		this.states = {
			"attack" : 0,
			"cooldown" : 0,
			"jumpback" : 0
		}
		this.times = {
			"attack" : 1.5 * Game.DELTASECOND,
			"cooldown" : 3 * Game.DELTASECOND,
			"jumpback" : 3 * Game.DELTASECOND
		}
		
		this.on("hurt", function(){
			audio.play("hurt",this.position);
			if(this.states.attack <= 0){
				this.states.jumpback = this.times.jumpback;
			}
		});
		
		this.on("death", function(){
			audio.play("kill",this.position);
			Item.drop(this);
			this.destroy();
		});
	}
	
	update(){
		if(this.life > 0){
			let dir = this.position.subtract(_player.position);
			
			if(this.states.attack > 0){
				//attack
				this.states.attack -= this.delta;
				
				if(this.states.attack > this.times.attack * 0.5){
					//Warm
					this.frame.x = 0;
					this.frame.y = 2;
				} else if(this.states.attack > this.times.attack * 0.4){
					//Striking
					this.frame.x = 1;
					this.frame.y = 2;
					this.strike(new Line(0,-12,72,4));
				} else {
					//Rest
					this.frame.x = 2;
					this.frame.y = 2;
				}
				
			} else if(this.states.jumpback > 0) {
				//leap back
				this.states.jumpback -= this.delta;
				this.frame.x = 1;
				this.frame.y = 1;
				
				if(!this.grounded){
					//In the air
					this.force.y -= this.delta * 0.8;
					this.friction = 0.0;
				} else if(Timer.isAt(this.states.jumpback, Game.DELTASECOND * 2.25, this.delta)){
					//Jump
					this.states.cooldown = 0;
					this.grounded = false;
					this.flip = dir.x > 0;
					this.force.y = -6;
					this.force.x = this.forward() * -4;
				} else {
					this.frame.x = 0;
					this.frame.y = 1;
					this.friction = 0.5;
				}
			} else {
				//idle
				this.frame.x = 0;
				this.frame.y = 0;
				this.flip = dir.x > 0;
				
				this.states.cooldown -= this.delta;
				
				if(this.states.cooldown <= 0 && Math.abs(dir.x) < 80){
					if(this.grounded){
						this.states.cooldown = this.times.cooldown;
						this.states.attack = this.times.attack;
					}
				} else if(dir.y > 32 && !_player.grounded){
					
					if(Math.abs(dir.x) < 128){
						//Playing attempting to jump over
						this.states.jumpback = this.times.jumpback;
						this.states.cooldown = 0;
					}
					
				}
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
		}
		
	}
}
self["Polate"] = Polate;

 /* platformer\enemy_pothead.js*/ 

Pothead.prototype = new GameObject();
Pothead.prototype.constructor = GameObject;
function Pothead(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 28;
	this.sprite = "pothead";
	this.speed = .21;
	this.deathtrigger = false;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.guard.active = 1;
	this.guard.omidirectional = 1;
	this.guard.x = -14;
	this.guard.y = -22;
	this.guard.w = 28;
	this.guard.h = 24;
	this.gravity = 0.6;
	
	this.states = {
		"sleep" : 1,
		"phase" : 0,
		"attack" : 0.0,
		"land" : 0.0,
		"hide" : 0.0,
		"cooldown" : Game.DELTASECOND
	};
	
	this.time_attack = Game.DELTASECOND * 1.0;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("deathtrigger" in o){
		this.deathtrigger = o["deathtrigger"];
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.mass = 1.5;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		if(this.states.hide > 0){
			this.states.hide += Game.DELTASECOND * 0.5;
			this.states.hide = Math.min(this.states.hide, Game.DELTASECOND * 1.5);
		}
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("collideObject", function(obj){
		if(this.life > 0 && !this.grounded){
			if(obj instanceof Player && obj.position.y > this.position.y){
				obj.hurt(this,this.getDamage());
			}
		}
	});
	this.on("wakeup", function(){
		this.states.sleep = 1;
	});
	this.on("land", function(){
		if(Math.random() > 0.4){
			this.states.hide = Game.DELTASECOND * 1.2;
		} else {
			this.states.land = Game.DELTASECOND * 0.5;
		}
	});
	this.on("pre_death", function(){
		var pot = new Ragdoll(this.position.x, this.position.y);
		pot.sprite = this.sprite;
		pot.frame.x = 0;
		pot.frame.y = 1;
		pot.width = pot.height = 24;
		game.addObject(pot);
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		if(Math.random() > 0.7 && this.grounded){
			this.states.hide = Game.DELTASECOND * 1.2;
		}
	});
	this.on("death", function(){
		if(this.deathtrigger){
			Trigger.activate(this.deathtrigger);
		}
		
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Pothead.prototype.update = function(){	
	if ( this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if(this.states.sleep){
			this.frame.x = 0;
			this.frame.y = 1;
			if(Math.abs(dir.x) < 140){
				this.states.sleep = 0;
				this.states.hide = Game.DELTASECOND * 0.5;
			}
			
		} else if(!this.grounded){
			this.frame.y = 1;
			this.states.cooldown = Game.DELTASECOND * 2.0;
			this.force.x += this.forward() * this.speed * this.delta * 0.5;
			if(this.force.y < -0.5){
				this.frame.x = 2;
			} else if(this.force.y > 0.5){
				this.frame.x = 4;
			} else{
				this.frame.x = 3;
			}
		} else if(this.states.attack > 0){
			var progress = 1 - (this.states.attack / this.time_attack);
			this.frame = Pothead.anim_attack.frame(progress);
			this.states.attack -= this.delta;
			if(this.states.attack <= 0){
				this.flip = dir.x > 0;
				this.grounded = false;
				this.force.y = -10;
			}
		} else if(this.states.land > 0){
			this.frame.x = 5;
			this.frame.y = 1;
			this.states.land -= this.delta;
		} else if(this.states.hide > 0){
			//Hide
			this.frame.x = 0;
			this.frame.y = 1;
			if(this.states.hide < Game.DELTASECOND * 0.1){
				//Anticipate release
				this.frame.x = 1;
			}
			this.states.hide -= this.delta;
		} else {
			//Walk
			this.flip = dir.x > 0;
			if(Math.abs(dir.x) > 40 ){
				this.force.x += this.forward() * this.speed * this.delta;
			}
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * 0.2 * this.delta) % 6;
			this.frame.y = 0;
			
			if(Math.abs(dir.x) < 64 ){
				this.states.cooldown -= this.delta;
				if(this.states.cooldown <= 0){
					this.states.cooldown = Game.DELTASECOND * 2.0;
					this.states.attack = this.time_attack;
				}
			}
		}
		
	} else {
		this.guard.active = 0;
		this.frame.x = 0;
		this.frame.y = 2;
		
	}
	
	if(this.frame.y == 1 && (this.frame.x == 0 || this.frame.x == 1)){
		this.guard.h = 34;
	} else {
		this.guard.h = 24;
	}
}

Pothead.anim_attack = new Sequence([
	[5,1,0.2],
	[2,1,0.1],
	[1,2,0.1],
	[1,1,0.1],
	[0,1,0.2],
	[1,1,0.1]
]);
	

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
	this.moneyDrop = Spawn.money(4,this.difficulty);
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
		audio.play("hurt",this.position);
		this.states.runaway = Game.DELTASECOND * 1.5;
	});
	this.on("death", function(){
		
		Item.drop(this);
		audio.play("kill",this.position);
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

 /* platformer\enemy_riveteer.js*/ 

Riveteer.prototype = new GameObject();
Riveteer.prototype.constructor = GameObject;
function Riveteer(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	
	this.sprite = "riveteer";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("wakeup", function(obj,damage){
		this.life = this.lifeMax;
		this.frame.x = 0;
		this.frame.y = 0;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("charged" in o){
		this.charged = o["charged"] * 1;
	}
	
	this.guard.x = -16;
	this.guard.y = -20;
	this.guard.w = 32;
	this.guard.h = 16;
	this.guard.omidirectional = true;
	
	this.life = this.lifeMax = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(1,this.difficulty);
	
	this.states = {
		"attack" : Game.DELTASECOND * 0.5,
		"cooldown" : Game.DELTASECOND,
		"chain" : 3
	};
}
Riveteer.prototype.update = function(){
	if(this.life > 0){
		let dir = this.position.subtract(_player.position);
		if(this.states.cooldown <= 0){
			this.frame.x = this.frame.y = 2;
			if(this.states.attack <= 0){
				if(this.states.chain > 0){
					
					var bullet = new Bullet(this.position.x + this.forward() * 24, this.position.y);
					bullet.team = this.team;
					bullet.frame.x = 4;
					bullet.force = new Point(this.forward() * 8, 0);
					bullet.damage = this.damage;
					
					game.addObject(bullet);
					this.states.attack = Game.DELTASECOND * 0.5;
					
					this.states.chain--;
				} else {
					this.states.cooldown = Game.DELTASECOND * 2.0;
				}
			}
			this.states.attack -= this.delta;
		} else {
			this.flip = dir.x > 0;
			this.states.cooldown -= this.delta;
			this.states.chain = 3;
			this.frame.x = this.frame.y = 0;
			
			if(this.states.cooldown <= Game.DELTASECOND){
				let prog = 1.0 - (this.states.cooldown / (Game.DELTASECOND));
				this.frame = Riveteer.anim_ready.frame(prog);
			}
		}
		
	} else {
	}
}
Riveteer.anim_ready = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.8]
])

 /* platformer\enemy_sailorcrane.js*/ 

class SailorCrane extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "hooksailor";
		this.width = 32;
		this.height = 32;
		
		this.force = new Point(0,0);
		this.speedIn = 0.5;
		this.speedOut = 0.25;
		this.friction = new Point(0.1, 0.1);
		
		this.phase = 0;
		this.timer = 1.2 * Game.DELTASECOND;
		this.shotTime = 0.333 * Game.DELTASECOND;
		this.shots = 4;
		
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.death_time = 0;
		
		this.on("wakeup", function(){
			this.phase = 0;
			this.timer = 1.2 * Game.DELTASECOND;
			this.position.y = game.camera.y;
		});
		this.on("sleep", function(){
			this.destroy();
		});
		
		this.on("hurt", function(obj, damage){
			this.force.x = 5 * (obj.x > this.position.x ? -1 : 1);
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			//this.destroy();
		});
		
		this.trigger("wakeup");
	}
	update(){
		if(this.life > 0){
			let dif = this.position.subtract(this.target().position);
			if(this.phase == 0){
				//slide in
				this.flip = dif.x > 0;
				this.force.y += this.speedIn * this.delta;
				if(dif.y > -8){
					this.phase++;
				}
			} else if (this.phase == 1){
				//wait and fire
				this.force.y = this.force.x = 0.0;
				this.timer -= this.delta;
				
				if(this.timer <= 0){
					if(this.shots > 0){
						this.flip = dif.x > 0;
						this.fire();
						this.shots--;
						this.timer = this.shotTime;
					} else {
						this.phase++;
					}
				}
			}  else {
				//Rise up and out of shot
				this.force.y -= this.speedOut * this.delta;
			}
		} else {
			this.force.y += this.delta;
			this.friction.y = 0.02;
		}
		this.force = this.force.scale(new Point(1,1).subtract(this.friction.scale(this.delta)));
		this.position = this.position.add(this.force.scale(this.delta));
	}
	fire(){
		audio.play("bullet1",this.position);
		var bullet = new Bullet(this.position.x + this.forward() * 16, this.position.y);
		bullet.team = this.team;
		bullet.damage = this.damage;
		bullet.force = new Point(this.forward()*4, 0);
		bullet.flip = this.flip;
		bullet.frame = new Point(4,0);
		game.addObject(bullet);
		
	}
}

self["SailorCrane"] = SailorCrane;

 /* platformer\enemy_sailorsaturn.js*/ 

class SailorSaturn extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "sailorsaturn";
		this.width = 32;
		this.height = 40;
		
		this.addModule( mod_combat );
		this.addModule( mod_rigidbody );
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			Item.drop(this);
			this.destroy();
		});
	}
	update(){
		if(1){
			
		} else if(0){
			
		}
	}
}
self["SailorSaturn"] = SailorSaturn;

 /* platformer\enemy_sailorsmasher.js*/ 

class SailorSmasher extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "sailorsmasher";
		this.width = 40;
		this.height = 56;
		
		this.speed = 1;
		this.airSpeed = 1;
		this.timer = 0;
		this.ground_y = 0;
		
		this.addModule( mod_rigidbody );
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		
		this.lifeMax = this.life = Spawn.life(8,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		this.moneyDrop = Spawn.money(4,this.difficulty);
		this.mass = 5.0;
		this.death_time = 2 * Game.DELTASECOND;
		
		this.on("land", function(){
			if(this.force.y > 4){
				audio.play("hardland",this.position);
				shakeCamera(Game.DELTASECOND*0.5,5);
			}
		});
		this.on("hurt", function(){
			audio.play("hurt",this.position);
			this.timer = Math.max(this.timer, SailorSmasher.phase_idle);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			Item.drop(this);
			this.destroy();
		});
		this.on("collideObject", function(obj){
			if(this.force.y > 2 && obj.position.y > this.position.y){
				//Crush objects below 
				if(obj.hasModule(mod_combat)){
					obj.hurt(this, this.damage)
				}
			}
		});
	}
	update(){
		if(this.life > 0){
			if(this.timer < SailorSmasher.phase_idle){
				//idle
				this.gravity = 1;
				this.ground_y = this.position.y;
			} else if(this.timer < SailorSmasher.phase_jump){
				//Jump and target
				var p = this.target().position.subtract(this.position);
				this.gravity = 0;
				if(Math.abs(p.x) > 8 ){
					this.flip = p.x < 0;
					this.force.x += this.forward() * this.speed * this.delta;
				}
				if(this.grounded){
					this.grounded = false;
					this.force.y = -this.airSpeed / this.friction;
				}
				if(this.ground_y - this.position.y < 48){
					this.force.y -= this.airSpeed * this.delta;
				}
				this.force.y *= 1 - this.friction * this.delta;
			} else if (this.timer < SailorSmasher.phase_hang){
				//Hanging in the air
				this.gravity = 0;
				this.force.y *= 1 - this.friction * this.delta;
			} else if(this.timer < SailorSmasher.phase_pound){
				//Ground pound
				this.gravity = 1;
			} else {
				this.timer = 0.0;
			}
			this.timer += this.delta;
		} else {
			this.gravity = 0;
			this.force.x = this.force.y = 0;
		}
	}
}
SailorSmasher.phase_idle = 3 * Game.DELTASECOND;
SailorSmasher.phase_jump = 4.5 * Game.DELTASECOND;
SailorSmasher.phase_hang = 5.5 * Game.DELTASECOND;
SailorSmasher.phase_pound = 8 * Game.DELTASECOND;

self["SailorSmasher"] = SailorSmasher;

 /* platformer\enemy_samrat.js*/ 

Samrat.prototype = new GameObject();
Samrat.prototype.constructor = GameObject;
function Samrat(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 48;
	this.charged = false;
	
	this.start = new Point(x,y);
	this.range = 80;
	
	this.speed = 0.8;
	this.sprite = "samrat";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(6,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(9,this.difficulty);
	
	this.states = {
		"attack" : 0.0,
		"cooldown" : 0.0,
		"jump" : false,
		"jumpBehind" : Game.DELTASECOND,
		"dash" : 0
	};
	this.times = {
		"jumpBehind" : Game.DELTASECOND * 0.3333
	}
}
Samrat.prototype.update = function(){
	dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		if(this.states.attack > 0){
			var progress = 1 - Math.min(this.states.attack / (Game.DELTASECOND * 1.0),1);
			this.frame = Samrat.attackanim.frame(progress);
			this.states.attack -= this.delta;
			
			if(this.frame.x == 2 || this.frame.x == 3){
				this.strike(Samrat.attackrange);
			}
			
		} else if(this.states.jump){
			this.force.y -= this.delta * 0.2;
			if((this.flip && dir.x > 0) || (!this.flip && dir.x < 0)){
				this.force.x += (this.flip?-1:1) * this.speed * 2.0 * this.delta;
			}
			
			if(this.grounded){
				this.states.cooldown = 0.0;
				this.states.jumpBehind = this.times.jumpBehind;
				this.states.jump = false;
			}
		} else if(this.states.dash > 0){
			this.force.x += (this.flip?-1:1) * this.speed * this.delta * 2;
			this.states.dash -= this.delta;
			if((this.flip && this.position.x < this.start.x - this.range) || (!this.flip && this.position.x > this.start.x + this.range)){
				this.states.dash = 0.0;
				this.force.x = 0.0;
			}
		} else {
			this.frame.x = 0;
			this.frame.y = 0;
			
			this.flip = dir.x > 0;
			
			if(Math.abs(dir.x) < 80){
				if(this.flip){
					if(this.position.x < this.start.x + this.range){
						this.states.jumpBehind = Math.min(this.states.jumpBehind+this.delta,this.times.jumpBehind);
						this.force.x += this.speed * this.delta;
					} else {
						this.states.jumpBehind -= this.delta;
						this.force.x = 0;
					}
				} else {
					if(this.position.x > this.start.x - this.range){
						this.states.jumpBehind = Math.min(this.states.jumpBehind+this.delta,this.times.jumpBehind);
						this.force.x -= this.speed * this.delta;
					} else {
						this.states.jumpBehind -= this.delta;
						this.force.x = 0;
					}
				}
				
				if(dir.y > 40){
					this.flip = Math.abs((this.start.x - this.range)-this.position.x) > Math.abs((this.start.x + this.range)-this.position.x);
					this.states.dash = Game.DELTASECOND * 0.8;
				}
				
				if(this.states.jumpBehind <= 0){
					this.force.y = -10;
					this.states.jump = true;
					this.grounded = false;
				}
				
				if(this.states.cooldown <= 0){
					this.states.cooldown = Game.DELTASECOND;
					this.states.attack = Game.DELTASECOND * 1;
					this.force.x = (this.flip?-1:1) * this.speed * 5;
				}
				
				this.states.cooldown -= this.delta;
				
			} else {
				if(this.states.cooldown <= 0){
					if(this.flip){
						this.force.x -= this.speed * this.delta;
					} else {
						this.force.x += this.speed * this.delta;
					}
				}
				
				this.states.cooldown -= this.delta * 0.2;
			}
		}
	}
}
Samrat.attackrange = new Line(16,-32,58,6);
Samrat.attackanim = new Sequence([
	[0,1,.2],
	[1,1,.1],
	[2,1,.1],
	[3,1,.1],
	[4,1,.1],
	[5,1,.5],
]);

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
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
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

 /* platformer\enemy_shockowl.js*/ 

Shockowl.prototype = new GameObject();
Shockowl.prototype.constructor = GameObject;
function Shockowl(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "shockowl";
	this.speed = 7.0;
	this.zIndex = 3;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.damage = 0;
	this.damageLight = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(4,this.difficulty);
	this.bounceCount = 3;
	this.mass = 1.0;
	
	this.rest = 0.0;
	this.beam = 0.0;
	this.beamTime = Game.DELTASECOND * 1.4;
	this.beamRelease = 0.0;
	this.beamReleaseTime = Game.DELTASECOND;
	this.attack = 0.0;
	this.attackTime = Game.DELTASECOND * 1.2;
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}
Shockowl.prototype.update = function(){
	this.gravity = 0.4;
	
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		if(this.rest > 0){
			this.frame.x = 0;
			this.frame.y = 3;
		} else if(this.beam > 0){
			this.beam -= this.delta;
			var progress = 1 - this.beam / this.beamTime;
			
			this.frame = Shockowl.anim_beam.frame(progress);
			this.force.y = progress > 0.5 ? 0 : -2.5;
			this.gravity = 0.0;
		} else if(this.beamRelease > 0){
			this.beamRelease -= this.delta;
			var progress = 1 - this.beamRelease / this.beamReleaseTime;
			var range = Math.min(progress * 5, 1) * 180;
			
			if(this.flip){
				Background.pushLightArea(new Line(this.position.add(new Point(-range,0)),this.position.add(new Point(0,12))),24,COLOR_LIGHTNING);
			} else {
				Background.pushLightArea(new Line(this.position,this.position.add(new Point(range,12))),24,COLOR_LIGHTNING);
			}
			
			this.strike(new Line(new Point(0,0),new Point(range,12)));
			
			this.frame.x = 4;
			this.frame.y = 4;
			this.force.y = 0;
			this.gravity = 0.0;
		} else if(this.attack > 0){
			this.attack -= this.delta;
			var progress = 1 - this.attack/this.attackTime;
			
			this.frame = Shockowl.anim_attack.frame(progress);
			
			if(Timer.isAt(this.attack,this.attackTime * 0.8, this.delta)){
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
				lightning1.speed = -2;
				lightning2.speed = 2;
				lightning1.damageLight = lightning2.damageLight = this.damageLight;
				lightning1.force.x = lightning2.force.x = this.forward() * 6;
				lightning1.force.y = lightning2.force.y = -12;
				game.addObject(lightning1);
				game.addObject(lightning2);
			}
		} else {
			this.frame.x = Math.max(Math.min(1.2 + this.force.y * 0.2, 0),2);
			this.frame.y = 0;
			
			if(this.grounded){
				this.force.x = this.forward() * this.speed;
				this.force.y = -4;
				this.grounded = false;
				this.bounceCount--
				this.flip = dir.x > 0;
				
				if(!_player.grounded){
					this.beam = this.beamTime;
					this.beamRelease = this.beamReleaseTime;
					this.bounceCount = 4;
				} else if(this.bounceCount <= 0){
					this.attack = this.attackTime;
					this.bounceCount = 4;
				}
			}
		}
	} else{
		this.frame.x = 3;
		this.frame.y = 0;
	}
}
Shockowl.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	var progress = 1 - this.beamRelease / this.beamReleaseTime;
	var range = Math.min(progress * 5, 1) * 180;
	var flipOff = new Point(this.flip ? -range : 0,0);
	
	if(this.beamRelease > 0){
		g.renderSprite(
			"white",
			this.position.add(flipOff).subtract(c),
			this.zIndex - 1,
			new Point(),
			false,
			{
				scalex : range,
				scaley : 12
			}
		);
	}
}
Shockowl.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.3],
	[3,1,0.1],
	[4,1,0.1],
	[0,2,0.5],
]);
Shockowl.anim_beam = new Sequence([
	[1,3,0.1],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.1],
	[0,4,0.1],
	[1,4,0.1],
	[2,4,0.2],
	[3,4,0.1],
	[4,4,0.3],
]);

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
	this.moneyDrop = Spawn.money(8,this.difficulty);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		
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
	this.moneyDrop = Spawn.money(5,this.difficulty);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		Item.drop(this);
		
		audio.play("kill",this.position);
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
	this.speed = 3.0;
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
		audio.play("hurt",this.position);
	});
	this.on("hurtOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("blockOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
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
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.damage = 0;
	this.damageSlime = Spawn.damage(1,this.difficulty);
	
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.calculateXP();
}
Slime.prototype.update = function(){
	if(!this.grounded){
		this.frame.x = 0;
		this.frame.y = 2;
	} else if(this.times.move){
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 3.0) % 5;
		this.frame.y = 0;
		
		this.addHorizontalForce(this.speed * this.forward());
		
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
			this.times.transition += this.delta * 3.0;
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
			this.times.transition += this.delta * 3.0;
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
	this.damage = 0;
	this.damageSlime = Spawn.damage(3, this.difficulty);
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.mass = 3.0;
	this.death_time = Game.DELTASECOND * 0.5;
	
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
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
				nade.damageSlime = this.damageSlime;
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
	
	this.damage = 0;
	this.damageFire = 0;
	this.damageSlime = 0;
	this.damageIce = 0;
	this.damageLight = 0;
	
	this.friction = 0.03;
	this.gravity = 0.5;
	this.bounce = 0.9;
	this.collisionReduction = -0.9;
	this.pushable = false;
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat) && this.team != obj.team){
			obj.hurt(this,Combat.getDamage.apply(this));
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
	this.swrap = spriteWrap["slimerilla"];
	this.speed = 2.0;
	this.jumpSpeed = 4.0;
	this.interactive = this.visible = false;
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
		"attackTime" : Game.DELTASECOND * 3,
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
		audio.play("hurt",this.position);
		this.times.jumpback = true;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	if(this.startactive){
		this.interactive = this.visible = true;
		this.pushable = true;
		this.faceTarget();
	}
	
	this.life = Spawn.life(8, this.difficulty);
	this.moneyDrop = Spawn.money(8,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.defencePhysical = Spawn.defence(2,this.difficulty);
	this.defenceFire = Spawn.defence(-2,this.difficulty);
	this.defenceSlime = Spawn.defence(4,this.difficulty);
	this.death_time = Game.DELTASECOND * 0.5;
	this.calculateXP();
}
Slimerilla.prototype.update = function(){
	var dir = _player.position.subtract(this.position);
	
	if(this.interactive){
		var dir = this.target().position.subtract(this.position);
		
		if(this.times.attack > 0){
			let p = 1 - this.times.attack / this.times.attackTime;
			this.frame = this.swrap.frame("attack", p);
			this.times.attack -= this.delta;
		} else if(this.times.jumpback){
			//jump away from player
			this.force.y = -6;
			this.addHorizontalForce(this.jumpSpeed * (dir.x>0?-1.0:1.0), 99);
			this.times.jumpback = false;
		} else {
			//move towards player
			this.addHorizontalForce(this.speed * this.forward());
			
			if(Math.abs(dir.x) < 48 && this.times.cooldown <= 0 ){
				this.times.attack = this.times.attackTime;
				this.times.cooldown = this.times.timeBetweenAttacks;
				this.faceTarget();
			}
			if(this.times.turnTimer <= 0){
				this.faceTarget();
				this.times.turnTimer = Game.DELTASECOND * 2;
			}
			this.times.turnTimer -= this.delta;
			this.times.cooldown -= this.delta;
			
			if(this.grounded){
				if(Math.abs(this.force.x) > 0.2){
					this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.1) % 4;
					this.frame.y = 2;
				} else {
					this.frame.x = (this.frame.x+this.delta*0.15) % 3;
					this.frame.y = 0;
				}
			} else {				
				this.frame.x = (this.force.y < -1 ? 0 : (this.force.y > 1 ? 2 : 1));
				this.frame.y = 3;
			}
			
		}
		
	} else {
		if(this.life <= 0){
			//Do nothing, dying
		} else if(this.times.reappear){
			this.times.reappearTime -= this.delta;
			var progress = this.times.reappearTime / (Game.DELTASECOND * 0.2);
			if(progress <= 1){
				this.visible = true;
				this.frame.x = Math.min((1 - progress) * 3, 2);
				this.frame.y = 4;
			}
			
			if(this.times.reappearTime <= 0){
				this.interactive = true;
				this.pushable = true;
				this.faceTarget();
				this.force.y = -5;
				this.grounded = false;
			}
		} else if(dir.length() < 32) {
			this.times.reappearTime = Game.DELTASECOND * 1;
			this.times.reappear = 1;
		}
	}
}
Slimerilla.prototype.faceTarget = function(){
	var dir = this.target().position.subtract(this.position);
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
	
	this.speed = 4.0;
	this.sprite = "snake";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	
	this.on("sleep",function(){
		this.destroy();
	})
	this.on(["blocked","hurt_other"],function(){
		this.trigger("death");
	});
	this.on(["pre_death","death"], function(){
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
		this.addHorizontalForce(this.speed * this.forward());
		this.strike(new Line(new Point(0,-3),new Point(12,3)));
		this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
		this.frame.y = 0;
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.3) % 4;
		this.frame.y = 1;
	}
	
	if(this.timeCounter <= 0){
		this.destroy();
	}
}

 /* platformer\enemy_spearbe.js*/ 

Spearbe.prototype = new GameObject();
Spearbe.prototype.constructor = GameObject;
function Spearbe(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 44;
	this.charged = false;
	
	this.start = new Point(x,y);
	this.range = 80;
	
	this.speed = 0.4;
	this.sprite = "spearbe";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
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
	this.on("blockOther", function(obj){
		var dir = this.position.subtract(obj.position);
		this.force.x = (dir.x>0?1:-1) * 4;
	});
	this.on("hurt_other", function(obj){
		this.force.x *= -1;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(3,this.difficulty);
	this.moneyDrop = Spawn.money(6,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.pushable = false;
	
	this.states = {
		"turn" : 0,
		"cooldown" : Game.DELTASECOND * 1.5,
		"charge" : 0,
		"chargewait" : 0
	};
	this.times = {
		"turn" : Game.DELTASECOND * 1.3,
		"cooldown" : Game.DELTASECOND * 3.0,
		"charge" : Game.DELTASECOND * 1.2,
		"chargewait" : Game.DELTASECOND * 0.5
	}
}
Spearbe.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	var startdir = this.position.subtract(this.start);
	
	if(this.life > 0){
		if(this.states.turn > 0){
			this.states.turn -= this.delta;
			if(Timer.isAt(this.states.turn,this.times.turn*0.5,this.delta)){
				this.flip = !this.flip;
			}
		} else if(this.states.charge > 0){
			//charge at player
			if(this.states.chargewait > 0){
				this.force.x = 0;
				this.states.chargewait -= this.delta;
			} else {
				this.force.x += this.forward() * this.speed * this.delta * 2;
				this.states.charge -= this.delta;
			}
			
			if(this.states.charge <= 0 || Math.abs(this.position.x-this.start.x) > this.range*2){
				this.states.cooldown = this.times.cooldown;
				this.states.charge = 0;
			}
			
			this.strike(Spearbe.strikerect);
		} else if(Math.abs(dir.x) < 128){
			//Approach player
			if(this.position.x < this.start.x + this.range && this.position.x > this.start.x - this.range){
				//Spearbe is inside his range, approach
				this.force.x += this.forward() * this.speed * this.delta;
			} else {
				//Spearbe is outside his range, move back toward his range
				
				this.force.x += (startdir.x>0?-1:1) * this.speed * this.delta * 0.6;
			}
			
			if((this.flip && dir.x < 0) || (!this.flip && dir.x > 0)){
				this.states.turn = this.times.turn;
			}
			
			this.states.cooldown -= this.delta
			if(this.states.cooldown <= 0){
				this.states.charge = this.times.charge;
				this.states.chargewait = this.times.chargewait;
			}
			
			this.strike(Spearbe.strikerect);
		} else {
			//return to start
			if(Math.abs(this.position.x - this.start.x) > 8){
				this.force.x += (this.start.x > this.position.x ? 1:-1) * this.speed * this.delta;
			}
			if((this.flip && dir.x < 0) || (!this.flip && dir.x > 0)){
				this.states.turn = this.times.turn;
			}
			
			this.strike(Spearbe.strikerect);
		}
	}
	
	if(this.states.turn > 0){
		var progress = 1 - this.states.turn / this.times.turn;
		this.frame.x = Math.sin(progress * Math.PI) * 3;
		this.frame.y = 2;
	} else if(Math.abs(this.force.x) > 0.1){
		this.frame.x = (this.frame.x + this.delta * Math.abs(this.force.x) * 0.2) % 6;
		this.frame.y = 1;
	} else {
		this.frame.x = (this.frame.x + this.delta * 0.2) % 5;
		this.frame.y = 0;
	}
}
Spearbe.strikerect = new Line(0,-2,66,2);

 /* platformer\enemy_spikebug.js*/ 

Spikebug.prototype = new GameObject();
Spikebug.prototype.constructor = GameObject;
function Spikebug(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 16;
	this.sprite = "spikebug";
	this.speed = 0.1;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(1,this.difficulty);
	this.damage = Spawn.damage(2,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);
	this.mass = 0.7;
	
	this.on(["added","wakeup"], function(obj){
		var dir = this.position.subtract(_player.position);
		this.flip = dir.x > 0;
	});
	this.on("collideObject", function(obj){
		if(this.life > 0){
			if(obj instanceof Player){
				if(!obj.grounded){
					obj.hurt(this,this.getDamage());
				} else {
					this.flip = !this.flip;
				}
			}
		}
	});
	this.on("collideHorizontal", function(x){
		this.force.x = 0;
		this.flip = !this.flip;
	});
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
	
	SpecialEnemy(this);
	this.calculateXP();
}
Spikebug.prototype.update = function(){
	if ( this.life > 0 ) {
		if(this.grounded){
			if(this.atLedge()){
				this.flip = !this.flip;
			}
			this.force.x += this.forward() * this.delta * this.speed;
		}
	} else{
		//Stun or dead
		this.frame.x = 2;
		this.frame.y = 1;
	} 
}

 /* platformer\enemy_subaxe.js*/ 

Axesub.prototype = new GameObject();
Axesub.prototype.constructor = GameObject;
function Axesub(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 30;
	this.sprite = "axesub";
	this.speed = 0.25;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 2,
		"landedhit" : Game.DELTASECOND * 3,
		"background" : Game.DELTASECOND * 3,
		"carryon" : Game.DELTASECOND * 2
	}
	
	this.states = {
		"wakingup" : 0,
		"attack" : 0,
		"landedhit" : 0,
		"carryon" : 0,
		"background" : 0
	}
	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	if("background" in o){
		this.states.background = this.times.background * o["background"];
	}
	
	this.lifeMax = this.life = Spawn.life(0,this.difficulty);
	this.mass = 1;
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	this.pushable = false;
	this.friction = 0.05;
	
	this.on("collideHorizontal", function(h){
		if(this.states.carryon > 0){
			this.flip = h > 0;
		}
	});
	this.on(["hurt_other","blockOther"], function(obj){
		this.states.landedhit = this.times.landedhit;
		this.grounded = false;
		this.force.y = -6;
		this.force.x = this.forward() * -5;
	});
	
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		this.destroy();
		Item.drop(this,4);
		audio.play("kill",this.position);
	});
}

Axesub.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		if(this.states.background > 0){
			this.frame.x = 0;
			this.frame.y = 3;
			this.zIndex = -1;
			this.interactive = false;
			
			if(dir.length() < 64){
				this.states.wakingup = 1;
			}
			
			if(this.states.wakingup){
				this.frame = Axesub.anim_emerge.frame(1-this.states.background/this.times.background);
				
				this.states.background -= this.delta;
				if(this.states.background <= 0){
					this.interactive = true;
					this.zIndex = 1;
				}
			}
			
		} else if( this.states.landedhit > 0) {
			//Bounce back and try again
			this.frame.x = this.frame.y = 0;
			
			if(this.states.landedhit > this.times.landedhit - Game.DELTASECOND * 1.25){
				this.force.y -= this.gravity * 0.5 * this.delta;
				this.force.x += this.forward() * -this.speed * this.delta;
			}
			
			this.states.attack = 0;
			this.states.landedhit -= this.delta;
			
		} else if( this.states.attack > 0) {
			//Leap and swing at the player
			this.frame = Axesub.anim_attack.frame(1-this.states.attack/this.times.attack);
			
			if(this.frame.x == 0 ){
				if(this.grounded){
					this.grounded = false;
					this.force.y = -6;
				}
				this.force.y -= this.gravity * 0.5 * this.delta;
				this.force.x += this.forward() * this.speed * this.delta;
			}
			
			if(this.frame.x == 1 || this.frame.x == 2){
				this.strike(Axesub.attackRect);
			}
			
			this.states.attack -= this.delta;
		} else if(this.states.carryon > 0) {
			this.force.x += this.forward() * this.speed * this.delta;
			this.states.carryon -= this.delta;
		} else {
			//Run at player
			this.frame.x = this.frame.y = 0;
			
			this.flip = dir.x > 0;
			this.force.x += this.forward() * this.speed * this.delta;
			
			var distance = Math.abs(this.force.x * this.times.attack * 0.6);
			
			if(Math.abs(dir.x) < distance){
				if(Math.abs(dir.y < 64)){
					this.states.attack = this.times.attack;
				} else {
					this.states.carryon = this.times.carryon;
				}
			}
		}
	}
}

Axesub.attackRect = new Line(8,-24,40,16);
Axesub.anim_attack = new Sequence([
	[0,1,0.4],
	[1,1,0.1],
	[2,1,0.1],
	[3,1,0.5]
]);
Axesub.anim_emerge = new Sequence([
	[1,3,0.8],
	[2,3,0.1],
	[3,3,0.1]
]);

 /* platformer\enemy_svarog.js*/ 

Svarog.prototype = new GameObject();
Svarog.prototype.constructor = GameObject;
function Svarog(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	
	this.speed = 0.25;
	this.sprite = "svarog";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
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
		
		audio.play("kill",this.position);
		this.destroy();
	});
	this.on("wakeup", function(){
		var dir = this.position.subtract(_player.position);
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(1,this.difficulty);
	this.collisionReduction = -1.0;
	this.friction = 0.05;
	this.stun_time = 30.0;
	this.invincible_time = 30.0;
	this.damage = Spawn.damage(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	
	this.times = {
		"turn" : Game.DELTASECOND * 0.8,
		"forceHeight" : 0.1,
		"waveSpeed" : 0.08,
	};
	this.states = {
		"cooldown" : 0,
		"turn" : 0.0,
		"wave" : 0.0
	};
	
	this.mass = 1.0;
	this.gravity = 0.0;
	
	SpecialEnemy(this);
	this.calculateXP();
}
Svarog.prototype.isBehind = function(p){
	if(this.flip){
		return p.x > this.position.x;
	} else{
		return p.x < this.position.x;
	}
}
Svarog.prototype.update = function(){
	
	var dir = this.position.subtract(_player.position);
	
	if(this.life > 0){
		this.states.wave += this.delta * this.times.waveSpeed;
		this.force.y += Math.sin(this.states.wave) * this.times.forceHeight * this.delta;
		
		if(this.states.turn > 0){
			var progress = 1 - this.states.turn / this.times.turn;
			this.frame.x = progress * 4;
			this.frame.y = 1;
			this.states.turn -= this.delta;
			if(this.states.turn <= 0){
				this.flip = !this.flip;
			}
		} else {
			if(this.isBehind(_player.position)){
				this.states.turn = this.times.turn;
			}
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			this.force.x += this.forward() * this.speed * this.delta;
		}
		
		this.states.cooldown -= this.delta;
		
		if( this.states.cooldown <= 0 ) {
			this.states.cooldown = Game.DELTASECOND * 1.0;
			var fire = new Fire(this.position.x, this.position.y+20);
			fire.team = this.team;
			game.addObject(fire);
		}
		
	} else {
		this.frame.x = 0;
		this.frame.y = 2;
		this.gravity = 1.0;
		this.force.x = this.forward() * 2;
	}
}

 /* platformer\enemy_wallnolt.js*/ 

class WallNolt extends GameObject {
	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "portholeman";
		this.width = 24;
		this.height = 24;
				
		this.bulletSpeed = 4;
		this.timer = 0;
		this.throwReady = true;
		
		this.addModule( mod_combat );
		
		this.difficulty = Spawn.difficulty;
		if("difficulty" in ops){
			this.difficulty = ops["difficulty"] * 1;
		}
		if("flip" in ops){
			this.flip = ops["flip"]=="true";
		}
		
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(2,this.difficulty);
		this.death_time = 0;
		
		this.on("wakeup", function(){
			this.life = this.lifeMax;
			this.timer = 0;
		});
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt",this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position);
			//this.destroy();
		});
	}
	update(){
		if(this.life > 0){
			let dif = this.position.subtract(this.target().position);
			
			if(this.timer < WallNolt.PHASE_HIDE){
				this.interactive = false;
				this.frame.x = 0;
				this.frame.y = 0;
			} else if(this.timer < WallNolt.PHASE_LOOK){
				this.interactive = true;
				this.throwReady = true;
				this.frame.x = 0;
				this.frame.y = 1;
			} else if(this.timer < WallNolt.PHASE_THROW){
				if(this.throwReady){
					this.fire();
					this.throwReady = false;
				}
				this.interactive = true;
				this.frame.x = 0;
				this.frame.y = 2;
			} else if(this.timer < WallNolt.PHASE_ESCAPE){			
				this.interactive = false;
				this.frame.x = 0;
				this.frame.y = 0;
			} else {
				this.timer = 0;
			}
			this.timer += this.delta;
		} else {
			this.interactive = false;
			this.frame.x = 0;
			this.frame.y = 0;
		}
	}
	fire(){
		//audio.play("bullet1",this.position);
		
		let dif = this.position.subtract(this.target().position);
		var bullet = new Bullet(this.position.x + this.forward() * 12, this.position.y);
		bullet.team = this.team;
		bullet.damage = this.damage;
		bullet.force = dif.normalize(-this.bulletSpeed);
		bullet.sprite = this.sprite;
		bullet.frame = new Point(0,3);
		bullet.setDeflect();
		bullet.rotation = 0.0;
		bullet.on("preupdate", function(){this.rotation += this.delta * 6;});
		game.addObject(bullet);
		
	}
}
WallNolt.PHASE_HIDE = Game.DELTASECOND * 1.5;
WallNolt.PHASE_LOOK = Game.DELTASECOND * 3.0;
WallNolt.PHASE_THROW = Game.DELTASECOND * 4.5;
WallNolt.PHASE_ESCAPE = Game.DELTASECOND * 5.0;

self["WallNolt"] = WallNolt;

 /* platformer\enemy_warbus.js*/ 

Warbus.prototype = new GameObject();
Warbus.prototype.constructor = GameObject;
function Warbus(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "warbus";
	this.speed = 0.15;
	this.startPosition = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	
	this.states = {
		"phase" : 3,
		"guarddown" : false,
		"attackcount" : 3,
		"attacktype" : 0,
		"attack" : 0,
		"cooldown" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(8,this.difficulty);
	this.mass = 1.4;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("wakeup", function(){
		this.setPhase(Warbus.PHASE_GUARD);
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.cooldown -= 10;
		this.states.active = true
	});
	this.on("block", function(obj){
		audio.play("block", this.position);
		var knockback = this.states.guarddown ? 0.6 : 3.0;
		this.force.x += -this.forward() * knockback;
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		
		audio.play("kill",this.position);
		this.destroy();
	});
}
Warbus.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	/*
	if(input.state("left")==1)this.frame.x--;
	if(input.state("right")==1)this.frame.x++;
	if(input.state("up")==1)this.frame.y--;
	if(input.state("down")==1)this.frame.y++;
	if(input.state("jump")==1)this.flip=!this.flip;
	return;
	*/
	
	if(this.life > 0){
		if(this.states.phase == Warbus.PHASE_ATTACK){
			//attack player
			this.states.attack -= this.delta;
			var progress = 1 - Math.max(this.states.attack/Game.DELTASECOND,0);
			
			this.frame = Warbus.anim_attacks[this.states.attacktype].frame(progress);
			var attproperties = Warbus.anim_attacks[this.states.attacktype].properties(progress);
			
			if("strike" in attproperties){
				this.strike(attproperties["strike"]);
			}
			if("force" in attproperties){
				this.force.x += this.forward() * attproperties["force"] * this.delta;
			}
			
			if(Timer.interval(game.timeScaled, Game.DELTASECOND*0.3, game.delta)){
				//Delay on guard change when moving
				this.states.guarddown = _player.states.duck;
			}
			
			if(this.states.attack <= 0){
				this.flip = dir.x > 0;
				this.states.attackcount--;
				
				if(this.states.attackcount > 0){
					this.states.attack = Game.DELTASECOND;
					if(Math.random() >= 0.40){
						this.states.attacktype = this.states.attacktype == 0 ? 1 : 0;
					} else {
						this.states.attacktype = 2;
					}
				} else {
					this.nextPhase();
				}
				
			}
		} else if(this.states.phase == Warbus.PHASE_CHARGE){
			//charge player
			this.frame.y = 2;
			this.frame.x = (this.frame.x + this.delta*Math.abs(this.force.x)*0.3) % 6;
			this.states.guarddown = false;
			this.force.x += this.forward() * this.speed * this.delta * 4;
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 64){
				this.setPhase(Warbus.PHASE_ATTACK);
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		} else if(this.states.phase == Warbus.PHASE_BACKOFF){
			//backoff
			this.flip = dir.x > 0;
			this.frame.y = 1;
			this.frame.x = (this.frame.x + this.delta*Math.abs(this.force.x)*0.3) % 4;
			this.force.x += -this.forward() * this.speed * this.delta;
			this.states.cooldown -= this.delta;
			
			if(Timer.interval(game.timeScaled, Game.DELTASECOND*0.2, game.delta)){
				//Delay on guard change when moving
				this.states.guarddown = _player.states.duck;
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		} else {
			//guard
			this.flip = dir.x > 0;
			this.states.guarddown = _player.states.duck;
			this.states.cooldown -= this.delta;
			
			if(this.states.guarddown){
				this.frame.y = 0;
				this.frame.x = Math.min(this.frame.x + this.delta*0.5, 4);
			} else {
				this.frame.x = this.frame.y = 0;
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		}
		
		this.guard.active = true;
		this.guard.y = this.states.guarddown ? 0 : -12;
	} else {
		this.guard.active = false;
		this.frame.x = 5;
		this.frame.y = 0;
	}
	
}

Warbus.prototype.setPhase = function(phase){
	var dir = this.position.subtract(_player.position);
	
	if(phase == Warbus.PHASE_ATTACK){
		this.states.attackcount = 3 + Math.round(Math.random()*4);
		this.flip = dir.x > 0;
	} else if(phase == Warbus.PHASE_CHARGE){
		this.states.cooldown = Game.DELTASECOND * 0.8;
		this.flip = dir.x > 0;
	} else if(phase == Warbus.PHASE_BACKOFF){
		this.states.cooldown = Game.DELTASECOND * 1.3;
	} else {
		this.states.cooldown = Game.DELTASECOND * (1 + Math.random()*1.2);
	}
		
	this.states.phase = phase;
}
Warbus.prototype.nextPhase = function(){
	var dir = this.position.subtract(_player.position);
	var wander = this.position.subtract(this.startPosition);
	
	if(Math.abs(wander.x) > 80 && Math.abs(wander.y) < 32){
		if(Math.abs(dir.x) < 64 && Math.random() > 0.4){
			this.setPhase(Warbus.PHASE_ATTACK);
		} else if(Math.random() > 0.8){
			this.setPhase(Warbus.PHASE_GUARD);
		} else {
			if(
				(_player.position.x > this.position.x && this.startPosition.x > this.position.x) || 
				(_player.position.x < this.position.x && this.startPosition.x < this.position.x)
			){
				this.setPhase(Warbus.PHASE_CHARGE);
			} else {
				this.setPhase(Warbus.PHASE_BACKOFF);
			}
		}
	} else {
		if(Math.abs(dir.x) < 64 && Math.random() > 0.3){
			this.setPhase(Warbus.PHASE_ATTACK);
		} else if(Math.random() > 0.7) {
			this.setPhase(Warbus.PHASE_CHARGE);
		} else {
			this.setPhase(Warbus.PHASE_GUARD);
		}
	}
}

Warbus.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if(this.life > 0){
		var shieldZIndex = this.states.phase == Warbus.PHASE_ATTACK ? -1 : 1;
		if(this.states.guarddown){
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(0,12)),this.zIndex+shieldZIndex,new Point(0,5),this.flip);
		} else {
			g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex+shieldZIndex,new Point(0,5),this.flip);
		}
		this.renderSword(g,c);
	}
}
Warbus.prototype.renderSword = function(g,c){
	var sframe;
	var fr = Math.floor(this.frame.y);
	var f = Math.floor(this.frame.x);
	
	if(fr in Warbus.anim_sword){
		sframe = Warbus.anim_sword[fr][f];
	}
	
	if(sframe){
		var rotation = this.forward() * sframe.r;
		var position = new Point(this.forward()*sframe.p.x, sframe.p.y);
		
		g.renderSprite("swordtest",this.position.add(position).subtract(c),this.zIndex+sframe.z,new Point(),false,{
			"rotate" : rotation
		});
	}
}

Warbus.PHASE_ATTACK = 3;
Warbus.PHASE_CHARGE = 2;
Warbus.PHASE_BACKOFF = 1;
Warbus.PHASE_GUARD = 0;

Warbus.anim_attacks = [
	new Sequence([[0,3,1.0],[1,3,0.2,{"strike":new Line(4,-8,36,-4),"force":0.4}],[2,3,1.0]]),
	new Sequence([[2,3,0.5],[3,3,0.2,{"strike":new Line(4,-8,36,-4),"force":-0.4}],[4,3,0.5],[5,3,1.0]]),
	new Sequence([[1,4,1.0],[2,4,0.2,{"strike":new Line(4,10,36,14)}],[3,4,0.2],[4,4,1.0]])
];
Warbus.anim_sword = {
	0:{
		0:{"p":new Point(-15,-2),"z":2,"r":0.0},
		1:{"p":new Point(-15,-2),"z":2,"r":0.0},
		2:{"p":new Point(-15,-2),"z":2,"r":0.0},
		3:{"p":new Point(-15,3),"z":2,"r":0.0},
		4:{"p":new Point(-15,3),"z":2,"r":0.0}
	},
	1:{
		0:{"p":new Point(-15,-3),"z":2,"r":0.0},
		1:{"p":new Point(-15,-2),"z":2,"r":0.0},
		2:{"p":new Point(-14,-2),"z":2,"r":0.0},
		3:{"p":new Point(-14,-3),"z":2,"r":0.0},
	},
	2:{
		0:{"p":new Point(-15,-2),"z":2,"r":250.0},
		1:{"p":new Point(-16,-3),"z":2,"r":250.0},
		2:{"p":new Point(-16,-2),"z":2,"r":250.0},
		3:{"p":new Point(-14,-1),"z":2,"r":250.0},
		4:{"p":new Point(-15,-2),"z":2,"r":250.0},
		5:{"p":new Point(-15,-1),"z":2,"r":250.0},
	},
	3:{
		0:{"p":new Point(-17,-10),"z":2,"r":300.0},
		1:{"p":new Point(9,-8),"z":2,"r":90.0},
		//2:{"p":new Point(18,-11),"z":2,"r":90.0},
		2:{"p":new Point(18,-11),"z":-2,"r":315.0},
		3:{"p":new Point(-15,-12),"z":2,"r":80.0},
		4:{"p":new Point(-17,-13),"z":2,"r":340.0},
		5:{"p":new Point(-17,-13),"z":2,"r":320.0},
	},
	4:{
		0:{"p":new Point(-16,2),"z":2,"r":0.0},
		1:{"p":new Point(-15,2),"z":2,"r":90.0},
		2:{"p":new Point(20,6),"z":2,"r":90.0},
		3:{"p":new Point(-14,1),"z":2,"r":45.0},
		4:{"p":new Point(-16,2),"z":2,"r":10.0}
	}
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
		audio.play("hurt",this.position);
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
		
		Item.drop(this);
		audio.play("kill",this.position);
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(2,this.difficulty);
	this.collideDamage = Spawn.damage(1,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(3,this.difficulty);
	
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
				
				if(Math.abs(dir.x) < 32){
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
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
		audio.play("hurt",this.position);
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		this.states.backup = !this.states.backup;
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position);
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
				var lightning1 = new GroundBolt(this.position.x,this.position.y);
				var lightning2 = new GroundBolt(this.position.x,this.position.y);
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


GroundBolt.prototype = new GameObject();
GroundBolt.prototype.constructor = GameObject;
function GroundBolt(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.height = 8;
	this.width = 8;
	this.damageLight = 1;
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

GroundBolt.prototype.update = function(){
	this.time += this.delta;
	
	if(this.grounded){
		this.force.x += this.speed * this.delta;
		this.flip = this.force.x < 0; 
		Combat.strike.apply(this,[new Line(0,0,8,4)]);
	} else {
		//fall
	}
	
	Background.pushLight(this.position,48,COLOR_LIGHTNING);
	
	if(this.time > Game.DELTASECOND * 3){
		this.destroy();
	}
}
	
GroundBolt.prototype.render = function(g,c){
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
	this.moneyDrop = Spawn.money(5,this.difficulty);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj){
		Item.drop(this,24);
		
		audio.play("kill",this.position);
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
	this.moneyDrop = Spawn.money(5,this.difficulty);
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
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		
		Item.drop(this);
		audio.play("kill",this.position);
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

Weapon = {
	"STATE_STANDING" : "standing",
	"STATE_CHARGED" : "charged",
	"STATE_JUMPING" : "jumping",
	"STATE_DUCKING" : "ducking",
	"STATE_JUMPUP" : "jumpup",
	"STATE_DOWNATTACK" : "downattack",
	"playerState" : function(player){
		var state = Weapon.STATE_STANDING;
		if(player.downstab && !player.grounded && input.state("down") > 0){
			state = Weapon.STATE_DOWNATTACK;
		} else if(player.states.dash > 0){
			state = Weapon.STATE_CHARGED;
		} else if(!player.grounded){ 
			if(player.states.justjumped > 0.0){
				state = Weapon.STATE_JUMPUP;
			} else {
				state = Weapon.STATE_JUMPING;
			}
		} else if(player.states.duck){
			state = Weapon.STATE_DUCKING;
		}
		return state;
	},
	"animations" : [
		new Sequence([[0,4,0.10],[1,4,0.10],[2,4,0.10],[3,4,0.10]]),
		new Sequence([[4,4,0.10],[5,4,0.10],[6,4,0.10],[7,4,0.10]]),
		new Sequence([[7,4,0.10],[8,4,0.10],[9,4,0.10],[10,4,0.10]]),
		new Sequence([[1,8,0.10],[2,8,0.10],[3,8,0.10],[4,8,0.10],[5,8,0.10]]),
		new Sequence([[1,9,0.10],[2,9,0.10],[3,9,0.10],[4,9,0.10],[5,9,0.10]]),
		new Sequence([[0,5,0.10],[1,5,0.10],[2,5,0.10],[3,5,0.10],[4,5,0.10],[5,5,0.10],[6,5,0.10]]),
		new Sequence([[7,5,0.20],[8,5,0.20],[9,5,0.20],[10,5,0.20],[11,5,0.20]]),
		new Sequence([[0,11,0.12],[1,11,0.08],[2,11,0.08],[3,11,0.08],[4,11,0.12]])
	]
};


createWeaponTemplate = function(warmTime, baseTime, restTime, missTime, length){
	return {
		"color1" : [.7,.8,1,1],
		"color2" : [1,1,1,1],
		"damage" : 3.0,
		"range" : length,
		"onEquip" : function(player){},
		"standing" : {
			"alwaysqueue" : 0,
			"length" : 3,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash2"
			},
			2 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.5,
				"warm" : 1.2*warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":2.5*restTime*Game.DELTASECOND,
				"miss":missTime*1.2*Game.DELTASECOND,
				"animation" : 2,
				"force" : new Point(3.0, 0.0),
				"pause" : Game.DELTAFRAME30 * 2,
				"knockback" : 5,
				"stun" : 0.25 * Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash3"
			}
		},
		"ducking" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,8), new Point(length,12)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest": restTime*Game.DELTASECOND,
				"miss": missTime*Game.DELTASECOND,
				"animation" : 5,
				"force" : new Point(0.0, 0.0),
				"stun" : 0.3 * Game.DELTASECOND,
				"movement" : 0.0,
				"mesh" : "slash3"
			}
		},
		"jumping" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.75*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.75*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
		},
		"jumpup" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-24), new Point(length,12)),
				"damage":0.8,
				"warm" :0,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND*0.8,
				"miss":restTime*Game.DELTASECOND,
				"animation" : 4,
				"pause" : Game.DELTAFRAME30 * 2,
				"stun" : 0.5 * Game.DELTASECOND,
				"knockback" : new Point(0.0, -14.0),
				"force" : new Point(0, -2.0),
				"movement" : 0.3,
				"mesh" : "slashu"
			}
		},
		"charged" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,12)),
				"damage":3.5,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":0.8*restTime*Game.DELTASECOND,
				"miss":1.0*restTime*Game.DELTASECOND,
				"animation" : 3,
				"stun" : 0.7 * Game.DELTASECOND,
				"force" : new Point(12.0, 0.0),
				"movement" : 0.1,
				"audio" : "swing2",
				"mesh" : "slashc"
				//"airtime" : (warmTime+1.5*baseTime+restTime) * Game.DELTASECOND
			}
		},
		"downattack" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(-10,0), new Point(10,length)),
				"damage":1.0,
				"warm" : 0.05*Game.DELTASECOND,
				"time" : 0.25*Game.DELTASECOND,
				"rest": 0.08*Game.DELTASECOND,
				"miss": 0.10*Game.DELTASECOND,
				"animation" : 6,
				"stun" : 0.7 * Game.DELTASECOND,
				"movement" : 1.0,
				"mesh" : "slashd"
				//"airtime" : 0.3 * Game.DELTASECOND
			}
		}
	};
}

var WeaponStats = {
	//warmTime, baseTime, restTime, missTime, length
	"short_sword" : createWeaponTemplate(0.05,0.25,0.08,0.10,38),
	"long_sword" : createWeaponTemplate(0.10,0.25,0.1,0.2,48),
	"broad_sword" : createWeaponTemplate(0.20,0.25,0.1,0.3,42),
	"morningstar" : createWeaponTemplate(0.08,0.35,0.08,0.35,40),
	"bloodsickle" : createWeaponTemplate(0.05,0.25,0.08,0.15,36),
	"burningblade" : createWeaponTemplate(0.05,0.25,0.1,0.2,38),
}

WeaponStats.short_sword.damage = 1;
WeaponStats.short_sword.standing.alwaysqueue = 1;

WeaponStats.long_sword.damage = 1.5;
WeaponStats.long_sword.standing.alwaysqueue = 0;

WeaponStats.broad_sword.damage = 2;
WeaponStats.broad_sword.standing.alwaysqueue = 0;

WeaponStats.morningstar.damage = 2;
WeaponStats.morningstar.standing.alwaysqueue = 0;
WeaponStats.morningstar.standing.length = 1;
WeaponStats.morningstar.standing[0]["force"] = new Point(1.0,0.0);

WeaponStats.bloodsickle.damage = 0.8;
WeaponStats.bloodsickle.standing.alwaysqueue = 1;
WeaponStats.bloodsickle.standing.length = 2;
WeaponStats.bloodsickle.onEquip = function(player){ player.perks.lifeSteal += 0.06; },

WeaponStats.burningblade.damage = 1.0;
WeaponStats.burningblade.standing.alwaysqueue = 1;
WeaponStats.burningblade.standing[2]["force"] = new Point(0.0,0.0);
WeaponStats.burningblade.onEquip = function(player){ player.damageFire += Math.floor(_player.stats.attack * 0.5); },
WeaponStats.burningblade.color1 = COLOR_FIRE;
WeaponStats.burningblade.color2 = [1,0.5,0.0,1.0];

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

//♡
i18n_language = "english";
i18n_messages = {
	"intro_text" : {
		"english" : "This is a closed alpha released on the 19th of June, 2016. This version is to be shared with close friends for a 'first impression' and to gather some feedback about the game. Is it too hard, too easy, no fun, too fun? Is there a part you found frustrating or something you think needs changed? This is what this demo is meant to assess. If you weren't explictly given this demo, then someone was naughty.",
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
		"english" : "For developers only.",
		"engrish" : "You will learn How to play. Please enjoy to the story of origin."
	},
	"start_help" : {
		"english" : "Enter the world of Beast Lords. Play the closed alpha demo.",
		"engrish" : "Play the game. Please note, death is permanent."
	},
	"templenames" : {
		"english" : ["Anahilt Fortress","The Gardens of Benburb", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"],
		"engrish" : ["Anahilt Fortress","Benburb Gardens", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"]
	},
	"map_unknown" : {
		"english" : "Unknown",
		"engrish" : "Nowhere."
	},
	"maps" : {
		"english" : {
			"gateway.tmx"	:"Gateway", 
			"townhub.tmx"	:"Town",
			"firepits.tmx"	:"Furnace",
			"fridge.tmx"	:"Cooler",
			"temple1.tmx"	:"Palace",
			"temple2.tmx"	:"Anglemyer",
			"temple3.tmx"	:"Sanctuary",
			"temple4.tmx"	:"Residence"
		},
	},
	"maps_full" : {
		"engrish" : {
			"gateway.tmx"	:"Beast City Gateway", 
			"townhub.tmx"	:"Kinallen Town",
			"firepits.tmx"	:"Krafla Furnace",
			"fridge.tmx"	:"Grand Cooler",
			"temple1.tmx"	:"Chort's Palace",
			"temple2.tmx"	:"Anglemyer Tower",
			"temple3.tmx"	:"Rainer Sanctuary",
			"temple4.tmx"	:"Beast City Residence"
		},
	},
	"item_lightradius" : {
		"english" : "Dark visions\nAllows user to see in the dark."
	},
	"item_downstab" : {
		"english" : "Down stab\nWhile in the air hold down and press %fire% to perform a down stab."
	},
	"item_doublejump" : {
		"english" : "Double Jump\nPress %jump% while in the air to perform a second jump."
	},
	"item_gauntlets" : {
		"english" : "Gauntlets\nAllows the user to jump off against walls."
	},
	"item_dodgeflash" : {
		"english" : "Dodge Flash\nPress %dodge% in the air to dash forward with great power."
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
		"english" : "I'm the chancellor of this town. I manage the money. It turns out I don't manage it very well at all. Say, you wouldn't want to donate a little to our good town? I promise, every single penny will go to good projects!",
		"engrish" : "My name is Chancellor. I make good with the money. The money is trouble. You can donate your money to the town through me. I'll spend your money correctly. Press people to other construction. Donate to make the construction into a new with my assistant."
	},
	"npc_chargeattackman" : {
		"english" : "Hold down the attack button with %fire% to unlease a powerful slash!"
	},
	"npc_dodgeman" : {
		"english" : "Did you know you can dash by pressing %dodge%?"
	},
	"npc_spellcasting" : {
		"english" : "You can cast spells by holding up and pressing %fire%. You can select a spell by pressing %select%."
	},
	"npc_spellmaster" : {
		"english" : "I can level up your spells to increase their effectiveness. It'll cost you though."
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
	this.height = 15;
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
	this.time = 0.0;
	this.timeLimit = 0.0;
	
	this.addModule(mod_rigidbody);
	this.pushable = false;
	this.physicsLayer = physicsLayer.item;
	this.collisionReduction = -0.8;
	this.resistObjects = 0.3;
	this.gravity = 0;
	
	ops = ops || {};	
	
	if( "enchantChance" in ops ) {
		this.enchantChance = ops["this.enchantChance"];
	}
	if( "id" in ops ) {
		this.itemid = "item_" + ops["id"];
		if(NPC.get(this.itemid)){
			this.on("added", function(){ 
				if( _player instanceof Player && this.name.match(/^key_\d+$/) ){
					_player.keys.push( this );
				}
				this.destroy();
			});
		}
	}
	if( "name" in ops ) {
		if(ops["name"] == "random"){
			this.setName(Item.randomTreasure(Math.random()).name);
		} else {
			this.setName( ops.name );
		}
	}
	
	this.on("sleep", function(){
		if(this.timeLimit){
			this.destroy();
		}
	});
	
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
				NPC.set(this.name, 1);
				/*
				var currentWeapon = _player.equip_sword;
				obj.equip(this, obj.equip_shield);
				game.addObject(currentWeapon);
				currentWeapon.force = new Point(0,0);
				currentWeapon.gravity = 0;
				audio.play("equip");
				*/
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
			
			if( this.name == "spell_refill") { if(this.spell.stock < this.spell.stockMax) { this.spell.stock++; this.destroy(); audio.play("pickup1"); } }
			
			if( this.name == "lightradius") { obj.lightRadius = true; this.pickupEffect(); DemoThanks.items++; }
			if( this.name == "downstab") { obj.downstab = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "doublejump") { obj.doubleJump = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "gauntlets") { obj.walljump = true; this.pickupEffect(); DemoThanks.items++;}
			if( this.name == "dodgeflash") { obj.dodgeFlash = true; this.pickupEffect(); DemoThanks.items++;}
			
			//Enchanted items
			if( this.name == "intro_item") { obj.stats.attack+=3; game.addObject(new SceneTransform(obj.position.x, obj.position.y)); obj.sprite = "player"; audio.play("levelup"); }
			
			
			if( this.name == "seed_oriax") { obj.baseStats.attack+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			if( this.name == "seed_bear") { obj.baseStats.defence+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			if( this.name == "seed_malphas") { obj.baseStats.magic+=1; this.pickupEffect(); DemoThanks.items++; obj.equip();}
			
			
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
			//this.interactive = false;
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
		this.equipframe = new Point(0,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	if(n == "long_sword") { 
		this.frame.x = 1; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(1,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	if(n == "broad_sword") { 
		this.frame.x = 2; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(2,0);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	if(n == "morningstar") { 
		this.frame.x = 3; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(0,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	if(n == "bloodsickle") { 
		this.frame.x = 4; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(1,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	if(n == "burningblade") { 
		this.frame.x = 5; this.frame.y = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.equipframe = new Point(2,1);
		this.message = Item.weaponDescription;
		this.stats = WeaponStats[n];
		return; 
	}
	
	//Shields
	if(n == "small_shield") { 
		this.frame.x = 0; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.0,"guardlife":30,"height":16, "frame":0, "frame_row":0,"turn":0.15}
		this.slots = [ShieldSmith.SLOT_ATTACK_LOW,ShieldSmith.SLOT_DEFENCE_LOW,ShieldSmith.SLOT_MAGIC_LOW];
		return; 
	}
	if(n == "large_shield") { 
		this.frame.x = 1; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=0;
		this.stats = {"speed":1.1,"guardlife":50,"height":16, "frame":0, "frame_row":1,"turn":0.4}
		this.slots = [ShieldSmith.SLOT_MAGIC_MID,ShieldSmith.SLOT_SPECIAL_MID,ShieldSmith.SLOT_SPECIAL_LOW,ShieldSmith.SLOT_SPECIAL_LOW];
		return; 
	}
	if(n == "kite_shield") { 
		this.frame.x = 2; this.frame.y = 3; 
		this.isShield = true;
		this.bonus_att=0; this.bonus_def=1;
		this.stats = {"speed":1.1,"guardlife":40,"height":16, "frame":0, "frame_row":2,"turn":0.5}
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
	
	var coinTime = Game.DELTASECOND * 6;
	
	if(n == "life_small") { this.frame.x = 1; this.frame.y = 1; this.gravity = 0.5; this.timeLimit = coinTime; return; }
	if(n == "mana_small") { this.frame.x = 4; this.frame.y = 1; this.gravity = 0.5; this.timeLimit = coinTime; return; }
	if(n == "money_bag") { this.frame.x = 5; this.frame.y = 1; this.gravity = 0.5; return; }
	if(n == "xp_big") { this.frame.x = 2; this.frame.y = 1; this.gravity = 0.5; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame.y = 1;  this.gravity = 0.5; this.pushable = true; this.bounce = 0.5; this.timeLimit = coinTime; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame.x = 13; this.gravity = 0.5;  this.pushable = true; this.bounce = 0.0; this.timeLimit = coinTime; return; }
	
	if( this.name == "spell_refill") { this.frame.x = 0; this.frame.y = 10; }
	
	//Special items
	if(n == "lightradius") { this.frame.x = 7; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "downstab") { this.frame.x = 10; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "gauntlets") { this.frame.x = 4; this.frame.y = 6; this.message = i18n("item_"+n); return; }
	if(n == "doublejump") { this.frame.x = 0; this.frame.y = 5; this.message = i18n("item_"+n); return; }
	if(n == "dodgeflash") { this.frame.x = 5; this.frame.y = 3; this.message = i18n("item_"+n); return; }
	
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
	if( this.name == "seed_malphas") { this.frame.x = 2; this.frame.y = 4; this.message = "Malphas Seed\nMagic up.";}
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
	if(this.timeLimit){
		if(this.timeLimit - this.time < Game.DELTASECOND * 2){
			//Flash
			this.visible = (this.time / (Game.DELTASECOND * 0.125)) % 1.0 > 0.5;
		}
		if(this.time >= this.timeLimit){
			this.destroy();
		}
		this.time += this.delta;
	}
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
			{
				"shader":"item",
				"u_frameSize" : [16,16],
				"u_pixelSize" : 256,
				"u_color":[0.8,0.1,1.0,a]
			}
		);
	}
}

Item.drop = function(obj){
	if("moneyDrop" in obj){
		Item.dropMoney(obj.position, obj.moneyDrop);
	}
	
	/*
	if (Math.random() < _player.waystone_bonus) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "waystone"} );
		game.addObject( item );
	}
	*/
	
	if (Math.random() > 0.9) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "life_small"} );
		game.addObject( item );
	}
	
	/*
	var spell = Spell.randomRefill(_player, 300);
	if(spell){
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "spell_refill"} );
		item.frame.x = spell.frame.x;
		item.frame.y = spell.frame.y + 1;
		item.spell = spell;
		game.addObject( item );
	}
	*/
	
	if (Math.random() > 0.967) {
		var item = new Item( obj.position.x, obj.position.y, false, {"name" : "mana_small"} );
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
function Lamp(x,y,d,o){
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
	if(d instanceof Array){
		this.size = Math.max(Math.max(d[0],d[1]) * 2, this.size);
	}
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

 /* platformer\lava.js*/ 

Lava.prototype = new GameObject();
Lava.prototype.constructor = GameObject;
function Lava(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 999;
	this.idleMargin = Lava.lightradius;
	
	this.drain = 0;
	this.bottom = this.position.y + this.height;
	this.triggerheight = 4;
	this.triggerdelete = 0;
	this.triggerdelay = 0;
	this.triggersave = 0;
	this.speed = 2;
	
	if("trigger" in ops) {
		this._tid = ops["trigger"];
	}
	if("triggerheight" in ops){
		this.triggerheight = ops["triggerheight"] * 1;
	}
	if("triggerdelete" in ops){
		this.triggerdelete = ops["triggerdelete"] * 1;
	}
	if("triggerdelay" in ops){
		this.triggerdelay = ops["triggerdelay"] * Game.DELTASECOND;
	}
	
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave)){
			this.height = this.triggerheight;
			this.drain = true;
		}
	}
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat)){
			if(obj.life > 0){
				obj.life = 0;
				obj.stun = 1;
				obj.trigger("hurt", this, 0)
				obj.isDead();
			}
		}
	});
	
	this.on("activate", function(){
		this.drain = 1;
		if(this.triggersave){
			NPC.set(this.triggersave, 1);
		}
	});
	
	this.on("wakeup", function(){
		if(this.drain){
			this.height = this.triggerheight;
			this.position.y = this.bottom - this.height;
		}
	})
}

Lava.prototype.update = function(){
	if(this.drain){
		if(this.height > this.triggerheight){
			if(this.triggerdelay > 0){
				this.triggerdelay -= this.delta;
			} else {
				this.height -= this.speed * this.delta;
			}
		} else {
			this.height = this.triggerheight;
			if(this.triggerdelete){
				this.destroy();
			}
		}
		this.position.y = this.bottom - this.height;
	}
	
	Background.pushLightArea(new Line(this.position,this.position.add(new Point(this.width,this.height))),Lava.lightradius,[1.0,0.6,0.2,1.0]);
	this.interactive = this.width > 0 && this.height > 0;
}

Lava.prototype.render = function(g,c){
	g.renderSprite(
		"lava", 
		this.position.subtract(c),
		this.zIndex,
		new Point(),
		false,
		{
			"u_time" : game.timeScaled * 0.1,
			"u_size" : [this.width, this.height],
			"scalex" : this.width / 64.0,
			"scaley" : this.height / 64.0
		}
	)
	return;
	if(this.interactive){
		g.color = [1.0,0.5,0.0,1.0];
		Renderer.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		)
	}
}
Lava.lightradius = 64;

/*
Lava.prototype.lightrender = function(g,c){
	if(this.interactive){
		g.color = [0.2,0.1,0.0,1.0];
		for(var i=0; i < 8; i++){
			var extra = 2 * Math.sin(i *0.5 + game.timeScaled * 0.1) + (8 * i+1);
			Renderer.scaleFillRect(
				this.position.x - extra - c.x,
				this.position.y - extra- c.y,
				this.width + extra * 2,
				this.height  + extra * 2
			)
		}
	}
}
*/

Lavafalls.prototype = new GameObject();
Lavafalls.prototype.constructor = GameObject;
function Lavafalls(x,y,d,ops){
	this.constructor();
	this.origin.x = 0;
	this.origin.y = 0;
	this.position.x = x - d[0]*0.5;
	this.position.y = y - d[1]*0.5;
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 898;
	
	this.sprite = "lavafalls";
	this.speed = 12.0;
	this.ends = new Point(0, 0);
	
	this.damage = 12;
	this.yexcess = 72;
	this.ystep = 72;
	this.waketime = Game.DELTASECOND * 1.0;
	this.sleeptime = Game.DELTASECOND * 2.0;
	this.timer = 0;
	this.active = true;
	
	if("waketime" in ops){
		this.waketime = ops["waketime"] * 1;
	}
	if("sleeptime" in ops){
		this.waketime = ops["sleeptime"] * 1;
	}
	
	this.on("activate", function(){
		this.active = !this.active;
	});
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_combat)){
			var c_top = obj.position.y - obj.height * obj.origin.y;
			var c_bot = obj.position.y + obj.height * obj.origin.y;
			if(
				c_bot > this.position.y + this.ends.x && 
				c_top < this.position.y + this.ends.y
			){
				obj.hurt(this, this.damage);
			}
		}
	});
}

Lavafalls.bloboffset = [
	{x:0,y:0,z:2,f:0,g:Math.random()*16},
	{x:0,y:16,z:1,f:1,g:Math.random()*16},
	{x:0,y:4,z:2,f:2,g:Math.random()*16},
	{x:-24,y:24,z:0,f:3,g:Math.random()*16}
];

Lavafalls.prototype.update = function(g,c){
	if(this.ends.x >= this.height+this.yexcess){
		//Go to sleep
		if(this.timer >= this.sleeptime){
			this.timer = this.ends.x = this.ends.y = 0;
		}
	} else {
		this.ends.y += this.speed * this.delta;
		if(this.timer >= this.waketime){
			this.ends.x += this.speed * this.delta;
		}
		if(this.ends.x >= this.height+this.yexcess){
			this.timer = 0;
		}
	}
	
	if(this.active){
		this.timer += this.delta;
	}
	
	Background.pushLightArea(
		new Line(
			this.position.add(new Point(0, this.ends.x)), 
			this.position.add(new Point(
				this.width,
				Math.min(this.height, this.ends.y - this.ends.x)
			)
		)),
		Lava.lightradius,
		[1.0,0.6,0.2,1.0]
	);
}

Lavafalls.prototype.render = function(g,c){
	var bottom = this.ends.y;
	if(this.ends.y > this.height){
		bottom = this.height + ((this.ends.y-this.height) % this.ystep);
	}
	
	for(var y=bottom; y >= this.ends.x; y-=this.ystep){
		var i = 0;
		for(var x=0; x < this.width; x+=16){
			blob = Lavafalls.bloboffset[i];
			g.renderSprite(
				this.sprite,
				this.position.add(new Point(x+blob.x, y+blob.y)).subtract(c).floor(),
				this.zIndex + blob.z - y,
				new Point(blob.f,0),
				this.flip, 
				{
					"u_intensity" : 1 + Math.abs(0.5*Math.sin(blob.g + game.timeScaled*0.125))
				}
			)
			i = (i+1) % 4;
		}
	}
}
Lavafalls.prototype.lightrender = function(g,c){
	/*
	g.color = COLOR_FIRE;
	g.scaleFillRect(
		this.position.x - c.x,
		this.position.y + this.ends.x - c.y,
		this.width,
		Math.min(this.height, this.ends.y - this.ends.x)
	);
	*/
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
	
	this.onboard = 0.0;
	
	this.addModule( mod_rigidbody );
	this.clearEvents("collideObject");
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.onboard = Game.DELTASECOND * 0.2;
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
	this.grounded = false;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 200 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard > 0) {
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
	
	this.onboard -= this.delta;
}

 /* platformer\lightning_bolt.js*/ 

class LightningBolt extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 24;
		this.origin.y = 1;
		
		this.randomSeed = ""+Math.random();
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		
		this.active = false; 
		
		ops = ops || new Options();
		
		this.loop = ops.getBool("loop", false);
		this.startTime = ops.getFloat("time", 2) * Game.DELTASECOND;
		
		this.countdown = this.startTime;
		this.bolttime = LightningBolt.BOLT_TME;
		this.damage = 12;
		
		
		this.on("sleep", function(){
			if(this.loop){
				this.reset();
			} else {
				this.destroy();
			}
		})
	}
	
	reset(){
		this.countdown = this.startTime;
		this.bolttime = LightningBolt.BOLT_TME;
	}
	
	update(){
		if(this.active){
			if(this.countdown > 0){
				this.countdown -= this.delta;
				if(this.countdown <= 0){
					audio.play("lightning1", this.position);
				}
			} else if(this.bolttime > 0){
				
				if(_player.position.y < this.position.y && Math.abs(this.position.x-_player.position.x) <= 12){
					this.struck(_player);
				}
				
				this.bolttime -= this.delta;
			} else {
				if(this.loop){
					this.reset();
				} else {
					this.destroy();
				}
			}
		} else {
			if(this.grounded){
				this.active = true;
			}
		}
	}
	
	struck(obj){
		if(obj instanceof Player){
			let d = Combat.getDamage();
			d.light = this.damage;
			obj.hurt(this, d);
		}
	}
	
	lightrender(g,c){
		if(this.active && this.countdown < 0){
			g.color = [1,1,1,1];
			g.scaleFillRect(0,0,490,240);
		}
	}
	
	render(g,c){
		if(this.active){
			
			if(this.countdown > LightningBolt.WARNING_TME){
				//Show nothing, getting ready
			} else if(this.countdown > 0){
				let r = (game.timeScaled/16) % 1;
				for(let j=0; j < 4; j++){
					let a = 1;
					if(j==0) a = r;
					if(j==3) a = 1-r;
					
					let color = [
						COLOR_LIGHTNING[0],
						COLOR_LIGHTNING[1],
						COLOR_LIGHTNING[2],
						a
					]
					this.renderRipple(g,c,r*16+j*10,color);
				}
			} else {
				let s = new Seed(this.randomSeed);
				let curr = new Point(this.position.x, this.position.y);
				for(let i=0; i < 20; i++){
					let next = new Point(
						this.position.x + (s.random()-0.5) * 16,
						curr.y - (12 + s.random() * 32),
					);
					g.renderLine(
						curr.subtract(c),
						next.subtract(c),
						2, COLOR_LIGHTNING
					)
					curr = next;
				}
			}
		}
	}
	
	renderRipple(g,c,r,color){
		let segments = 12;
		
		for(let i=0; i < segments; i++){
			let p = i / segments;
			let q = (i+1) / segments;
			
			let a = p * -Math.PI;
			let b = q * -Math.PI;
			
			g.renderLine(
				this.position.subtract(c).add(new Point(Math.cos(a), Math.sin(a)).scale(r)),
				this.position.subtract(c).add(new Point(Math.cos(b), Math.sin(b)).scale(r)),
				1, color
			);
		}
	}
}
LightningBolt.BOLT_TME = Game.DELTASECOND * 0.125;
LightningBolt.WARNING_TME = Game.DELTASECOND * 2;
self["LightningBolt"] = LightningBolt;

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

 /* platformer\menu_attribute.js*/ 

AttributeMenu = {
	"cursor" : 0,
	"cursorSlot" : 0,
	"cursorMagic" : 0,
	"cursorEquip" : 0,
	"testPlayer" : false,
	"spellMenuOpen" : false,
	"weaponMenuOpen" : false,
	"weaponList" : false,
	"shieldList" : false,
	"update" : function(){
		if(this.spellMenuOpen){
			if(input.state("jump")==1){
				this.spellMenuOpen = false;
			} else if(input.state("fire")==1){
				if(_player.shieldSlots[this.cursorSlot] == _player.spells[this.cursorMagic]){
					_player.shieldSlots[this.cursorSlot] = undefined;
					_player.equip();
					audio.play("equip");
					this.spellMenuOpen = false;
				} else {
					var usedIndex = _player.shieldSlots.indexOf(_player.spells[this.cursorMagic]);
					if(usedIndex >= 0){
						_player.shieldSlots[usedIndex] = undefined;
					}
					_player.shieldSlots[this.cursorSlot] = _player.spells[this.cursorMagic];
					_player.equip();
					audio.play("equip");
					this.spellMenuOpen = false;
				} 
			} else if(input.state("up")==1){
				this.cursorMagic = Math.max(this.cursorMagic-1, 0);
				audio.play("cursor");
			} else if( input.state("down")==1){
				this.cursorMagic = Math.min(this.cursorMagic+1, _player.spells.length-1);
				audio.play("cursor");
			}
			
			this.testPlayer = this.createTestPlayer();
			var cursorSpell = _player.spells[this.cursorMagic];
			var spellsCurrentOccupation = _player.shieldSlots.indexOf(cursorSpell);
			if(spellsCurrentOccupation >= 0 ){ this.testPlayer.shieldSlots[spellsCurrentOccupation] = undefined; }
			this.testPlayer.shieldSlots[this.cursorSlot] = cursorSpell;
			if(cursorSpell == this.testPlayer.shieldSlots[this.cursorSlot]){ this.testPlayer.shieldSlots[spellsCurrentOccupation] = undefined; }
			Player.prototype.equip.apply(this.testPlayer);
		} else if(this.weaponMenuOpen) {
			var currentSword = this.weaponList[this.cursorEquip];
			if(input.state("jump") == 1){
				this.weaponMenuOpen = false;
			} else if(input.state("fire") == 1){
				_player.equip(currentSword, _player.equip_shield);
				audio.play("equip");
				this.weaponMenuOpen = false;
			} else if(input.state("up") == 1){
				this.cursorEquip = Math.max(this.cursorEquip-1, 0);
				audio.play("cursor");
			} else if(input.state("down") == 1){
				this.cursorEquip = Math.min(this.cursorEquip+1, this.weaponList.length-1);
				audio.play("cursor");
			}
			this.testPlayer = this.createTestPlayer();
			this.testPlayer.equip_sword = currentSword;
			Player.prototype.equip.apply(this.testPlayer);
			
		} else {
			if(this.cursor == 0){
				if(input.state("fire")==1){
					this.weaponList = this.createWeaponList();
					this.weaponMenuOpen = true;
					this.cursorEquip = 0;
					audio.play("pause");
				}
			} else if(this.cursor == 1){
			} else if(this.cursor >= 2){
				if(input.state("fire")==1){
					this.spellMenuOpen = true;
					this.cursorSlot = this.cursor - 2;
					this.cursorMagic = Math.max(_player.spells.indexOf(_player.shieldSlots[this.cursorSlot]),0);
					audio.play("pause");
				} /*else if(input.state("left")==1){
					this.cursorSlot = Math.max(this.cursorSlot-1, 0);
					audio.play("cursor");
				} else if( input.state("right")==1){
					this.cursorSlot = Math.min(this.cursorSlot+1, _player.equip_shield.slots.length-1);
					audio.play("cursor");
				}*/
			}
			if(input.state("up") == 1){
				this.cursor = Math.max(this.cursor-1,0);
				audio.play("cursor");
			} else if(input.state("down") == 1){
				this.cursor = Math.min(this.cursor+1,4);
				audio.play("cursor");
			}
			this.testPlayer = false;
		}
	},
	"close" : function(){
		this.spellMenuOpen = false;
		this.weaponMenuOpen = false;
		this.testPlayer = false;
		this.weaponList = false;
		this.shieldList = false;
		this.cursor = 0;
		this.cursorMagic = 0;
		this.cursorSlot = 0;
	},
	"render" : function(g,c){
		var pos = new Point(Math.floor(game.resolution.x/2)-112,8);
		
		if(this.spellMenuOpen || this.weaponMenuOpen){
			var pos = new Point(Math.floor(game.resolution.x/2)-168,8);
		}
		
		this.renderWindow(g, pos, this.testPlayer);
		
		if(this.spellMenuOpen){
			this.renderSpellSelect(g,pos);
		} else if(this.weaponMenuOpen){
			this.renderWeaponSelect(g,pos);
		}
		
		textArea(g,"@", pos.x+20,156+this.cursor*14);
		/*
		if(this.cursor == 0){
			textArea(g,"@", pos.x+20,156+this.cursor*14);
		} else if(this.cursor == 1){
			textArea(g,"@", pos.x+20,168);
		} else {
			cursorArea(g, pos.x+12+this.cursorSlot*32, 224-36,32,32);
		}
		*/
	},
	"renderSpellSelect" : function(g,c){
		boxArea(g,c.x+224,8,112,224);
		for(var i=0; i < _player.spells.length; i++){
			var spell = _player.spells[i];
			g.renderSprite("items",new Point(c.x+244,28+i*20),1,spell.frame);
			textArea(g,"Lv."+spell.level, c.x+260,24+i*20);
		}
		g.color = [1,1,1,1];
		g.scaleFillRect(c.x+234,26+this.cursorMagic*20,4,4);
	},
	"renderWeaponSelect" : function(g,c){
		boxArea(g,c.x+224,8,112,224);
		for(var i=0; i < this.weaponList.length; i++){
			var weapon = this.weaponList[i];
			g.renderSprite(weapon.sprite,new Point(c.x+244,28+i*20),1,weapon.frame);
			textArea(g,weapon.name, c.x+260,24+i*20);
		}
		g.color = [1,1,1,1];
		g.scaleFillRect(c.x+234,26+this.cursorEquip*20,4,4);
	},
	"renderWindow" : function(g,c,testPlayer){
		var padding = 20;
		var statX = 64;
				
		boxArea(g,c.x,c.y,224,224);
		
		textArea(g,"Attributes",c.x+64,c.y+12);
		
		//textArea(g,"Points: "+_player.stat_points ,c.x+20,36);
		var attributeY = c.y+28;
		
		//Quick function for rendering stats
		var r = function(g,x,y,player,vfunc){
			var origVal = vfunc(_player);
			if(!player){
				textArea(g,""+origVal, x,y);
			} else {
				var sval = "" + vfunc(player);
				var val = Number.parseInt(sval);
				var xoff = 8 * (sval.length);
				origVal = Number.parseInt(origVal);
				textArea(g,sval, x,y);
				if(val > origVal){
					g.renderSprite("text",new Point(x+xoff,y),999,new Point(6,6));
				} else if(val < origVal){
					g.renderSprite("text",new Point(x+xoff,y),999,new Point(7,6));
				}
			}
		}
		
		//Damage
		textArea(g,"Damage:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.damage + p.damageFire + p.damageSlime + p.damageIce + p.damageLight;});
		attributeY += 12;
		
		//Physical
		textArea(g,"P", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.damage);});
		
		//Ice
		textArea(g,"I", c.x+padding+32,attributeY);
		r(g,c.x+padding+40,attributeY,testPlayer,function(p){return Math.floor(p.damageIce);});
		
		//Slime
		textArea(g,"S", c.x+padding+64,attributeY);
		r(g,c.x+padding+72,attributeY,testPlayer,function(p){return Math.floor(p.damageSlime);});
		
		
		attributeY += 12;
		
		//Fire
		textArea(g,"F", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.damageFire);});
		
		//Light
		textArea(g,"L", c.x+padding+32,attributeY);
		r(g,c.x+padding+40,attributeY,testPlayer,function(p){return Math.floor(p.damageLight);});
		
		attributeY += 16;
		
		
		textArea(g,"Defence", c.x+padding,attributeY);
		attributeY += 12;
		
		//Physical
		textArea(g,"P", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.defencePhysical)+"";});
		
		//Ice
		textArea(g,"I", c.x+padding+32,attributeY);
		r(g,c.x+padding+48,attributeY,testPlayer,function(p){return Math.floor(p.defenceIce)+"";});
		
		//Slime
		textArea(g,"S", c.x+padding+64,attributeY);
		r(g,c.x+padding+72,attributeY,testPlayer,function(p){return Math.floor(p.defenceSlime)+"";});
		
		attributeY += 12;
		
		//Fire
		textArea(g,"F", c.x+padding,attributeY);
		r(g,c.x+padding+8,attributeY,testPlayer,function(p){return Math.floor(p.defenceFire)+"";});
		
		//Light
		textArea(g,"L", c.x+padding+32,attributeY);
		r(g,c.x+padding+48,attributeY,testPlayer,function(p){return Math.floor(p.defenceLight)+"";});
		
		attributeY += 16;
		
		//attack
		textArea(g,"Attack:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.attack;});
		attributeY += 12;
		
		//magic
		textArea(g,"Defence:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.defence;});
		attributeY += 12;
		
		//magic
		textArea(g,"Magic:", c.x+padding,attributeY);
		r(g,c.x+padding+statX,attributeY,testPlayer,function(p){return p.stats.magic;});
		
		attributeY += 16;
		
		//Weapon
		var weapon = _player.equip_sword;
		g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(0,0));
		g.renderSprite(weapon.sprite,new Point(c.x+padding+16,attributeY+4),20,weapon.frame);
		textArea(g,weapon.name, c.x+24+padding,attributeY);
		attributeY += 14;
		
		//Shield
		var shield = _player.equip_shield;
		g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(1,0));
		g.renderSprite(shield.sprite,new Point(c.x+padding+16,attributeY+4),20,shield.frame);
		textArea(g,shield.name, c.x+24+padding,attributeY);
		attributeY += 14;
		
		//Shield slots
		for(var i=0; i < _player.equip_shield.slots.length; i++){
			var slotType = _player.equip_shield.slots[i];
			g.renderSprite("attrib_icons",new Point(c.x+padding+11,attributeY-2),0,new Point(i,1));
			//g.renderSprite("shieldslots",new Point(8+c.x+padding+i*32,c.y+196),1,ShieldSmith.SLOT_FRAME[slotType]);
			//g.renderSprite("shieldslots",new Point(c.x+padding+16,attributeY+4),20,ShieldSmith.SLOT_FRAME[slotType]);
			
			if(i < _player.shieldSlots.length){
				if(_player.shieldSlots[i] instanceof Spell){
					_player.shieldSlots[i].render(g,new Point(c.x+padding+16,attributeY+4));
				}
			}
			attributeY += 14;
		}
		
		
		
		//Render perks
		attributeY = c.y+28;
		for(var i in _player.perks){
			if(_player.perks[i] || (testPlayer && testPlayer.perks[i])){
				textArea(g,i.slice(0,8), c.x+112,attributeY);
				//textArea(g,""+Math.floor(_player.perks[i]*100), c.x+192,attributeY);
				r(g,c.x+184,attributeY,testPlayer,function(p){return Math.floor(p.perks[i]*100);});
				
				attributeY += 12;
			}
		}
		
		/*
		
		*/
	},
	"createTestPlayer" : function(){
		var output = {
			"baseStats" : {},
			"stats" : {},
			"equip_sword" : _player.equip_sword,
			"equip_shield" : _player.equip_shield,
			"perks" : {},
			"shieldSlots" : []
		}
		
		for(var i=0; i < _player.shieldSlots.length; i++){
			output.shieldSlots.push(_player.shieldSlots[i]);
		}
		for(perk in _player.perks){
			output.perks[perk] = 0.0;
		}
		for(stat in _player.baseStats){
			output.baseStats[stat] = _player.baseStats[stat];
			output.stats[stat] = 0;
		}
		return output;
	},
	"createWeaponList" : function(){
		out = [];
		for(var i=0; i < this.weapons.length; i++){
			var w = this.weapons[i];
			if(NPC.get(w)){
				out.push(new Item(0,0,0,{"name":w}));
			}
		}
		return out;
	},
	"weapons" : ["short_sword", "long_sword", "broad_sword", "morningstar", "bloodsickle", "burningblade"],
	"shields" : ["small_shield", "large_shield", "kite_shield", "broad_shield", "knight_shield", "spiked_shield", "heavy_shield", "tower_shield"]
}

 /* platformer\menu_debug.js*/ 

DebugeMenu = {
	"cursor" : 0,
	"cursorItems" : 15,
	"update" : function(){
		if( input.state("up") == 1 ) { 
			this.cursor = (this.cursor > 0) ? this.cursor - 1 : (this.cursorItems - 1); 
			audio.play("cursor"); 
		}
		if( input.state("down") == 1 ) { 
			this.cursor = (this.cursor + 1) % this.cursorItems; 
			audio.play("cursor"); 
		}
		if( input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				_player.lightRadius = !_player.lightRadius;
			}
			if(this.cursor == 1){
				if(_player.grabLedge){
					_player.grabLedge = false;
					_player.speeds.jump = 9.3;
				} else {
					_player.grabLedge = true;
					_player.speeds.jump = 7.0;
				}
			} else if(this.cursor == 2){
				_player.downstab = !_player.downstab;
			} else if(this.cursor == 3){
				_player.doubleJump = !_player.doubleJump;
			} else if(this.cursor == 4){
				_player.walljump = !_player.walljump;
			} else if(this.cursor == 5){
				_player.dodgeFlash = !_player.dodgeFlash;
			} else if(this.cursor == 6){
				_player.lifeMax += 6;
				_player.life += 6;
			} else if(this.cursor >= 7){
				var spellName = Spell.NAMES[this.cursor-7];
				let spell = _player.spells.find(function(a){ return a.objectName == spellName; });
				if(spell){
					spell.level += 1;
				} else {
					_player.spells.push( new self[spellName]() );
				}
			}
		}
		if( input.state("jump") == 1) {
			if(this.cursor == 6){
				_player.lifeMax = Math.max(_player.lifeMax-6, 6);
				_player.life = Math.min(_player.life, _player.lifeMax);
			} else if(this.cursor >= 7){
				var spellName = Spell.NAMES[this.cursor-7];
				let spell = _player.spells.find(function(a){ return a.objectName == spellName; });
				if(spell){
					if(spell.level > 1){
						spell.level -= 1;
					} else {
						_player.spells.remove(_player.spells.indexOf(spell));
					}
				}
			}
		}
	},
	"render" : function(g,c){
			
		boxArea(g,c.x,8,224,224);
		//textArea(g,"Special Items",c.x+56,20);
		textArea(g,"Debug",c.x+92,20);
		
		textArea(g,"@",c.x+16,32+this.cursor*12);
		
		var offy = 32;
		textArea(g,"Light radius:",c.x+32,offy);
		textArea(g,""+_player.lightRadius,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Grab Ledge:",c.x+32,offy);
		textArea(g,""+_player.grabLedge,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Down Stab:",c.x+32,offy);
		textArea(g,""+_player.downstab,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Double Jump:",c.x+32,offy);
		textArea(g,""+_player.doubleJump,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Wall Jump:",c.x+32,offy);
		textArea(g,""+_player.walljump,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Dodge Flash:",c.x+32,offy);
		textArea(g,""+_player.dodgeFlash,c.x+144,offy);
		offy += 12;
		
		textArea(g,"Life:",c.x+32,offy);
		Player.renderLifebar(g,c.add(new Point(80,offy-8)), _player.life, _player.lifeMax, 0);
		offy += 12;
		
		for(let i=0; i < Spell.NAMES.length; i++){
			var spellName = Spell.NAMES[i];
			let spell = _player.spells.find(function(a){return a.objectName == spellName;});
			
			textArea(g,spellName.substr(5,14),c.x+32,offy);
			
			if(spell){
				textArea(g,"Lv."+spell.level,c.x+144,offy);
			}
			offy += 12;
		}
		
		/*
		for(var i=0; i < _player.uniqueItems.length; i++){
			var y_pos = 46 + 20 * i;
			var item = _player.uniqueItems[i];
			var name = item.message;
			if(this.cursor == i){
				textArea(g,"@",c.x+16,y_pos);
			}
			g.renderSprite("items",new Point(c.x+40,y_pos+4),this.zIndex,item.frame);
			textArea(g,name,c.x+52,y_pos);
		}
		*/
	}
}

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
	this.mapflip = 0;
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
	
	this.loadMapReveal();
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
			
			this.cursor = Math.max( Math.min( this.cursor, 4), 0 );
			
			if( input.state("fire") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.setSetting("fullscreen", !Settings.fullscreen);
				if(this.cursor == 1 ) game.setSetting("filter", (Settings.filter+1) % PauseMenu.Filters.length);
				if(this.cursor == 2 ) game.setSetting("sfxvolume", Math.min(Settings.sfxvolume+0.125,1));
				if(this.cursor == 3 ) game.setSetting("musvolume", Math.min(Settings.musvolume+0.125,1));
				if(this.cursor == 4 ){
					PauseMenu.open = false;
					game.clearAll();
					game_start(game);
					return;
				}
			} else if( input.state("jump") == 1) {
				audio.play("cursor");
				if(this.cursor == 0 ) game.setSetting("fullscreen", !Settings.fullscreen);
				if(this.cursor == 1 ) game.setSetting("filter", (Settings.filter+1) % PauseMenu.Filters.length);
				if(this.cursor == 2 ) game.setSetting("sfxvolume", Math.max(Settings.sfxvolume-0.125,0));
				if(this.cursor == 3 ) game.setSetting("musvolume", Math.max(Settings.musvolume-0.125,0));
			}
		} else if( this.page == 1 ) {
			//Map page			
			if( input.state("jump") == 1) { this.mapflip = !this.mapflip; }
			if( input.state("left") == 1 ) { this.mapCursor.x += 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { this.mapCursor.x -= 1; audio.play("cursor"); }
			if( input.state("up") == 1 ) { this.mapCursor.y += 1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.mapCursor.y -= 1; audio.play("cursor"); }
			

		} else if( this.page == 2 ){
			//attributes page
			AttributeMenu.update();
		} else if ( this.page == 3 ) {
			//Unique Items
			DebugeMenu.update();
			/*
			if( input.state("fire") == 1 ) { 
				_player.unique_item = _player.uniqueItems[this.cursor];
				PauseMenu.open = false;
				game.pause = false;
				audio.play("spell");
			}
			*/
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
				if( input.state("select") == 1 ) { this.page = ( this.page + 1 ) % this.pageCount; this.cursor = 0; audio.play("cursor"); }
				//if( input.state("right") == 1 ) { this.page = (this.page<=0 ? (this.pageCount-1) : this.page-1); this.cursor = 0; audio.play("cursor"); }
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
			AttributeMenu.close();
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
PauseMenu.prototype.loadMapReveal = function(){
	var mapname = WorldLocale.currentMapName;
	var recordname = "mapreveal_" + mapname;
	
	var str_reveal = NPC.get(recordname);
	if(str_reveal){
		this.map_reveal = str_reveal.split(",");
	}
}
PauseMenu.prototype.saveMapReveal = function(){
	var mapname = WorldLocale.currentMapName;
	var recordname = "mapreveal_" + mapname;
	var str_reveal = this.map_reveal.toString();
	
	NPC.set(recordname, str_reveal);
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
			leftx = game.resolution.x*0.5 - 224*0.5;
			
			boxArea(g,leftx,8,224,224);
			textArea(g,"Settings",leftx+30,20);
			
			textArea(g,"Screen",leftx+16,40);
			textArea(g,(Settings.fullscreen?"Fullscreen":"Windowed"),leftx+20,52);
			
			textArea(g,"Screen Filter",leftx+16,72);
			textArea(g,PauseMenu.Filters[Settings.filter],leftx+20,84);
			
			textArea(g,"SFX Volume",leftx+16,104);
			g.color = [1.0,0.9,0.8,1.0];
			
			for(var i=0; i<Math.floor(Settings.sfxvolume*8); i++)
				g.scaleFillRect(leftx+20+i*8, 116, 7, 8 );
			
			textArea(g,"MUS Volume",leftx+16,136);
			g.color = [1.0,0.9,0.8,1.0];
			for(var i=0; i<Math.floor(Settings.musvolume*8); i++)
				g.scaleFillRect(leftx+20+i*8, 148, 7, 8 );
			
			textArea(g,"Game",leftx+16,168);
			textArea(g,"Reset",leftx+20,180);
			
			//Draw cursor 84
			textArea(g,"@",leftx+12, 52 + this.cursor * 32 );
		} else if ( this.page == 1 ) {
			//Map
			leftx = game.resolution.x*0.5 - 224*0.5;
			let name = game.newmapName;
			var player_map_position = {
				"gateway.tmx" : new Point(24,128),
				"temple1.tmx" : new Point(178,110),
				"temple2.tmx" : new Point(64,112),
				"temple3.tmx" : new Point(88,168),
				"temple4.tmx" : new Point(48,64),
				"sky.tmx" : new Point(104,96),
				"firepits.tmx" : new Point(176,160),
				"townhub.tmx" : new Point(120,128),
				"lighthouse.tmx" : new Point(200,104)
			};
			var map_position = player_map_position[name];
			
			if(this.mapflip){
				boxArea(g,leftx,8,224,224);
				let bounce = Math.sin(game.time * 0.1) * 2;
				g.renderSprite("mapicons", map_position.add(new Point(leftx+4,10+bounce)),2,new Point());
				g.renderSprite("worldmap", new Point(leftx+8,16),1,new Point(), false);
				textArea(g,"Minimap (JUMP)",leftx+100,212);
			} else {
				boxArea(g,leftx,8,224,224);
				textArea(g,"Map",leftx+102,20);
				textArea(g,"Map",leftx+102,20);
				this.renderMap(g,this.mapCursor,new Point(leftx+16,24), new Line(0,0,24*8,24*8) );
				textArea(g,"Worldmap (JUMP)",leftx+96,212);
			}
			
		} else if ( this.page == 2 ) {
			//Stats page
			AttributeMenu.render(g, new Point(game.resolution.x*0.5 - 224*0.5, 8));
			//PauseMenu.renderStatsPage(g,new Point(game.resolution.x*0.5 - 224*0.5, 8));
		} else if ( this.page == 3 ) {
			//Unique Items
			DebugeMenu.render(g, new Point(game.resolution.x*0.5 - 224*0.5, 8));
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
	} else {
		if( _player instanceof Player ) {
			//Minimap
			g.color = [1.0,1.0,1.0,1.0];
			g.scaleFillRect(game.resolution.x-49,7,42,26);
			g.color = [0.0,0.0,0.0,1.0];
			g.scaleFillRect(game.resolution.x-48,8,40,24);
			this.renderMap(g,
				new Point(Math.floor(-_player.position.x/256), Math.floor(-_player.position.y/240)),
				new Point(game.resolution.x-24,24), 
				new Line(-24,-16,16,8)
			);
		}
	}
}

PauseMenu.mapIcons = new Array();
PauseMenu.pushIcon = function(icon){
	if(icon instanceof MapIcon && PauseMenu.mapIcons.indexOf(icon) < 0){
		PauseMenu.mapIcons.push(icon);
	}
}

PauseMenu.prototype.renderMap = function(g,cursor,offset,limits){
	try {
		var size = new Point(8,8);
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
				}
			}
		}
		
		for(var i=0; i < PauseMenu.mapIcons.length; i++){
			var icon = PauseMenu.mapIcons[i];
			var pos = icon.mapPosition().add(cursor).scale(8)
			var reveal = this.map_reveal[icon.mapIndex()];
			if(reveal >= icon.mapRevealMin){
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					var c = new Point().subtract(cursor.scale(8)).subtract(offset);
					icon.render(g,c);
				}
			}
			
		}
		/*
		if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
			g.color = [1.0,0.0,0.0,1.0];
			g.renderSprite("map",pos.add(offset),this.zIndex+1,new Point(9,0),false);
		}
		*/
	} catch (err) {
		var r = 0;
	}
}

PauseMenu.Filters = [
	"Default",
	"CRT",
	"Deuteranopia",
	"Terrible port",
	"Dot matrix"
]

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

function MapIcon(x,y){
	this.position = new Point(x,y);
	this.bobSpeed = 0;
	this.bobHeight = 3;
	this.sprite = "mapicons";
	this.mapRevealMin = 2;
	this.frame = new Point(0,0);
}
MapIcon.prototype.mapPosition = function(){
	return new Point(Math.floor(this.position.x/(16*16)), Math.floor(this.position.y/(15*16)));
}
MapIcon.prototype.mapIndex = function(){
	var mPos = this.mapPosition();
	var mWidth = Math.floor(game.map.width / 16);
	return mPos.x + mPos.y * mWidth;
}
MapIcon.prototype.render = function(g,c){
	var bob = (1 + Math.sin(game.time * this.bobSpeed)) * 0.5 * this.bobHeight;
	var p = this.mapPosition();
	
	g.renderSprite(
		this.sprite,
		p.scale(8).add(new Point(0,-bob)).subtract(c),
		1000,
		this.frame
	)
}

 /* platformer\menu_title.js*/ 

TitleMenu.prototype = new GameObject();
TitleMenu.prototype.constructor = GameObject;
function TitleMenu(){	
	this.constructor();
	this.sprite = "title";
	this.bgsprite = "landingpage";
	this.zIndex = 999;
	this.visible = true;
	this.page = 0;
	this.start = false;
	
	this.title_position = -960;
	this.castle_position = 240;
	
	this.progress = 0;
	this.cursor = 1;
	
	this.starPositions = [
		new Point(42,26),
		new Point(64,35),
		new Point(105,42),
		new Point(138,18),
		new Point(182,19),
		new Point(208,43),
		new Point(223,17),
		new Point(250,42 ),
		new Point(307,36),
		new Point(326,43),
		new Point(363,9)
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
	
	TitleMenu.fetchProfiles();
}

TitleMenu.prototype.update = function(){
	//if( this.progress == 0 ) audio.playAs("music_intro","music");
	
	if( this.page == 0 ){
		//Intro page
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
		//Load game page
		this.progress = 10.0;
		if( input.state("up") == 1 ) { 
			this.cursor = Math.max(this.cursor-1, 0); 
			this.deleteProfileTimer = 0.0;
			audio.play("cursor"); 
		}
		if( input.state("down") == 1 ) { 
			this.cursor = this.cursor = Math.min(this.cursor+1, 2); 
			this.deleteProfileTimer = 0.0;
			audio.play("cursor"); 
		}
		if( input.state("jump") > 0  ) { 
			this.deleteProfileTimer += this.delta;
			if(this.deleteProfileTimer > TitleMenu.DELETETIME){
				//Save blank data to delete old profile
				game.save(false, this.cursor);
				//Refetch profiles
				TitleMenu.fetchProfiles();
				
				this.deleteProfileTimer = 0.0;
				audio.play("playerdeath");
			}
		} else {
			this.deleteProfileTimer = 0.0
		}
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			audio.play("pause");
			this.startGame(this.cursor); 
		}
	} else if( this.page == 2 ) {
		//Debug page
		this.progress = 10.0;
		if( input.state("up") == 1 ) { this.cursor -= 1; audio.play("cursor"); }
		if( input.state("down") == 1 ) { this.cursor += 1; audio.play("cursor"); }
		this.cursor = Math.max(Math.min(this.cursor,5),0);
		
		if(this.cursor == 1){
			if( input.state("left") == 1 ) { TitleMenu.level -= 1; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.level += 1; audio.play("cursor"); }
			TitleMenu.level = Math.max(Math.min(TitleMenu.level,50),1);
		}else if(this.cursor == 2){
			if( input.state("left") == 1 ) { TitleMenu.doubleJump = !TitleMenu.doubleJump; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.doubleJump = !TitleMenu.doubleJump; audio.play("cursor"); }
		}else if(this.cursor == 3){
			if( input.state("left") == 1 ) { TitleMenu.grabLedges = !TitleMenu.grabLedges; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.grabLedges = !TitleMenu.grabLedges; audio.play("cursor"); }
		}else if(this.cursor == 4){
			if( input.state("left") == 1 ) { TitleMenu.dodgeFlash = !TitleMenu.dodgeFlash; audio.play("cursor"); }
			if( input.state("right") == 1 ) { TitleMenu.dodgeFlash = !TitleMenu.dodgeFlash; audio.play("cursor"); }
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) { 
			if(this.cursor == 0){
				TitleMenu.mapname = game.prompt("Enter filename",TitleMenu.mapname, function(name){
					TitleMenu.mapname = name;
				});
				//localStorage.setItem("debug_map", MapLoader.mapname);
			} else if(this.cursor == 5){
				//Start in DEBUG mode
				audio.play("pause");
				
				var p = new Player(0,0);
				p.stat_points = Math.max(TitleMenu.level-1, 0);
				
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
					_player.doubleJump = TitleMenu.doubleJump;
					_player.dodgeFlash = TitleMenu.dodgeFlash;
					_player.grabLedges = TitleMenu.grabLedges;
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
	
	var pan = Math.sqrt(Math.min(this.progress/8, 1.0));
	
	//g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
	
	
	var tileSize = new Point(215,120);
	var bgcolor = [21/255.0,29/255.0,41/255.0,1.0];
	
	g.color = bgcolor;
	g.scaleFillRect(0,0,game.resolution.x, game.resolution.y);
	
	//Render star background
	g.renderSprite(this.bgsprite,new Point(xpos, 0),this.zIndex, new Point(0,0));
	g.renderSprite(this.bgsprite,new Point(xpos+tileSize.x, 0),this.zIndex, new Point(1,0));
	
	//Render middleground
	var mpos = xpos + pan * 24 - 159;
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x, 0),this.zIndex, new Point(2,0));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x*2, 0),this.zIndex, new Point(3,0));
	
	g.renderSprite(this.bgsprite,new Point(mpos, tileSize.y),this.zIndex, new Point(1,1));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x, tileSize.y),this.zIndex, new Point(2,1));
	g.renderSprite(this.bgsprite,new Point(mpos+tileSize.x*2, tileSize.y),this.zIndex, new Point(3,1));
	
	//Render foreground
	var fpos = xpos + pan * 240 - 240;
	g.renderSprite(this.bgsprite,new Point(fpos, tileSize.y),this.zIndex, new Point((game.time*0.333)%4,2));
	g.renderSprite(this.bgsprite,new Point(fpos+60, tileSize.y-24),this.zIndex, new Point((game.time*0.2)%3,3));
	
	//Random twinkling stars
	for(var i=0; i<this.stars.length; i++) {
		var star = this.stars[i];
		var frame = 2;
		if( 
			this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
			this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
		) frame = 3;
			
		g.renderSprite("bullets",star.pos.add(new Point(xpos-1,-1)),this.zIndex,new Point(frame,2));
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
	
	if(this.page < 1){
		g.renderSprite(this.bgsprite,new Point(xpos+107, Math.lerp(-480,32,pan)),this.zIndex, new Point(0,1));
	}
	
	textArea(g,"Copyright Rattus/Rattus LLP 2017",8,4);
	textArea(g,"Version "+version,8,228);
}

TitleMenu.prototype.hudrender = function(g,c){
	if(this.page == 0){
		//Press start
		var x_pos = game.resolution.x * 0.5 - 120 * 0.5;
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			boxArea(g,x_pos,168,120,40);
			textArea(g,i18n("press_start"),x_pos+16,184);
		}
	} else if(this.page == 1) {
		//Select profile
		for(var i=0; i < 3; i++){
			var pos = new Point(game.resolution.x * 0.5 - 90, 16 + i * 72);
			this.renderProfile(g, pos, TitleMenu.profile_info[i]);
		}
		textArea(g,"@",game.resolution.x * 0.5 - 106,32+72*this.cursor);
	} else if(this.page == 2){ 
		//Debug
		var x_pos = game.resolution.x * 0.5 - 200 * 0.5;
		boxArea(g,x_pos,16,200,208);
		textArea(g,"Map name",x_pos+32,32);
		textArea(g,"Level",x_pos+32,64);
		textArea(g,"Double Jump",x_pos+32,96);
		textArea(g,"Wall Slide",x_pos+32,128);
		textArea(g,"Dash",x_pos+32,160);
		textArea(g,"Play",x_pos+32,192);
		
		textArea(g,"@",x_pos+16,32+32*this.cursor);
		
		textArea(g,""+TitleMenu.mapname,x_pos+32,32+12);
		textArea(g,""+TitleMenu.level,x_pos+32,64+12);
		textArea(g,""+TitleMenu.doubleJump,x_pos+32,96+12);
		textArea(g,""+TitleMenu.grabLedges,x_pos+32,128+12);
		textArea(g,""+TitleMenu.dodgeFlash,x_pos+32,160+12);
	}
	
	if( this.progress >= 24 ) {
		var y_pos = Math.lerp(240,16, Math.min( (this.progress-24)/8, 1) );
		var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
		boxArea(g,0,y_pos-16,game.resolution.x,game.resolution.y);
		textArea(g,i18n("intro_text"),x_pos,y_pos,256,240);
	}	
}
TitleMenu.prototype.renderProfile = function(g,c, profile){
	boxArea(g,c.x,c.y,180,64);
	
	if(profile != undefined){		
		if(profile.id == this.cursor && this.deleteProfileTimer > 0){
			let progress = Math.min(this.deleteProfileTimer / TitleMenu.DELETETIME, 1.0);
			g.color = [0.8,0.1,0.0,1.0];
			g.scaleFillRect(c.x,c.y,(180*progress),64);
		}
		
		Player.renderLifebar(g,c.add(new Point(16,16)),profile.life,profile.lifeMax,0);
		Player.renderManabar(g,c.add(new Point(16,28)),profile.mana, profile.manaMax);
		
		var timeHour = Math.floor(profile.time/3600);
		var timeMinute = Math.floor(profile.time/60) % 60;
		
		timeMinute = (timeMinute < 10 ? "0" : "") + timeMinute;
		
		textArea(g,"$"+profile.money,c.x+90,c.y+16);
		textArea(g,"T"+timeHour+":"+timeMinute,c.x+90,c.y+28);
		textArea(g,profile.location,c.x+90,c.y+40);
		
		for(var i=0; i < 4; i++){
			if(profile["stone" + i]){
				textArea(g,"@",c.x+16+12*i,c.y+40);
			}
		}
	} else {
		var ng_text = i18n("new_game");
		var textpos = 90 - ng_text.length * 4;
		textArea(g,i18n("new_game"),c.x+textpos,c.y+28,256,240);
	}
}

TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(profile){
	if(TitleMenu.profile_info[profile]){
		WorldLocale.profile = profile;
		WorldLocale.load();
	} else {
		new Player();
		WorldLocale.loadMap("gateway.tmx");
	}
}
TitleMenu.fetchProfiles = function(){
	game.load(function(data){
		TitleMenu.profile_info = {};
		
		for(var i in data){
			var d = data[i];
			var areas = i18n("maps");
			var map = i18n("map_unknown");
			
			if(d.location.map in areas){
				map = areas[d.location.map];
			}
			
			var out = {
				"id" : i,
				"life" : d.player.life,
				"lifeMax" : d.player.lifeMax,
				"mana" : d.player.mana,
				"manaMax" : d.player.manaMax,
				"money" : d.player.money,
				"stone0" : 0,
				"stone1" : 0,
				"stone2" : 0,
				"stone3" : 0,
				"time" : 5400,
				"location" : map
			};
			
			for(var stone = 0; stone < 4; stone++){
				var tname = "templegate_" + stone;
				if(tname in d.variables && d.variables[tname]){
					out["stone" + stone] = 1;
				}
			}
			
			TitleMenu.profile_info[i] = out;
		}
		
	},-1);
}

TitleMenu.profile_info = {};
TitleMenu.mapname = "testmap.tmx";
TitleMenu.level = 1;
TitleMenu.grabLedges = false;
TitleMenu.doubleJump = false;
TitleMenu.dodgeFlash = false;
TitleMenu.DELETETIME = Game.DELTASECOND * 2;

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

 /* platformer\miniboss_electrolizard.js*/ 

ElectroLizard.prototype = new GameObject();
ElectroLizard.prototype.constructor = GameObject;
function ElectroLizard(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y-1;
	this.width = 40;
	this.height = 64;
	this.sprite = "electrolizard";
	this.startX = x;
	this.speed = 0.8;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.lifeMax = this.life = Spawn.life(14,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);;
	this.damageLight = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(2,this.difficulty);

	this.defenceLight = Spawn.defence(2,this.difficulty);
	this.defenceSlime = Spawn.defence(-2,this.difficulty);
	
	this.death_time = Game.DELTASECOND * 0.5;
	
	this.mass = 5.0;
	this.gravity = 0.4;
	this.pushable = true;
	
	this.states = {
		"arrows" : 5,
		"rest" : 0.0,
		"next" : 0,
		"phase" : 0,
		"time" : 0.0
	};
	
	this.on("collideObject",function(obj){
		
	});
	this.on("hurt", function(){
		if(Math.random() > 0.6){
			this.states.next = 7;
		}
		audio.play("hurt",this.position);
	});
	this.on("death", function(){
		audio.play("kill",this.position);
		Item.drop(this);
		this.destroy();
	});
}

ElectroLizard.prototype.setState = function(s){
	this.states.phase = s;
	this.states.next = 0;
	
	if(s == 1) {this.states.time = ElectroLizard.TIME_READYCHARGE;}
	if(s == 2) {this.states.time = ElectroLizard.TIME_CHARGE;}
	if(s == 3) {this.states.time = ElectroLizard.TIME_HAMMERDOWN;}
	if(s == 4) {this.states.time = ElectroLizard.TIME_READYARROW;}
	if(s == 5) {this.states.time = ElectroLizard.TIME_ARROW;}
	if(s == 6) {this.states.time = ElectroLizard.TIME_HAMMERATTACK;}
	if(s == 7) {this.states.time = ElectroLizard.TIME_PRELEAP;}
}

ElectroLizard.prototype.shootArrow = function(){
	var bolt = new Bullet(this.position.x, this.position.y+12);
	bolt.team = this.team;
	bolt.force.x = this.forward() * 10;
	bolt.flip = this.flip;
	bolt.sprite = "boarbow";
	bolt.frame.x = 2;
	bolt.frame.y = 2;
	bolt.damage = this.damage;
	bolt.setDeflect();
	game.addObject(bolt);
}

ElectroLizard.prototype.lightningArc = function(){
	var amount = 16;
	for(var i=0; i < amount; i++){
		var rad = (i / amount) * 2 * Math.PI;
		var deg = (i / amount) * 360;
		var bullet = new Bullet(this.position.x, this.position.y + 16);
		bullet.team = this.team;
		bullet.damage = 0;
		bullet.damageLight = this.damageLight;
		bullet.force.x = Math.sin(rad) * 7;
		bullet.force.y = Math.cos(rad) * 7;
		bullet.bounce = 1.0;
		bullet.collisionReduction = 1.0;
		bullet.friction = 0.0;
		bullet.wallStop = false;
		bullet.light = 96.0;
		bullet.lightColor = COLOR_LIGHTNING;
		bullet.range = 300;
		game.addObject(bullet);
	}
}

ElectroLizard.prototype.update = function(){
	if ( this.life > 0 ) {
		var dir = this.position.subtract(_player.position);
		
		this.states.time -= this.delta;
		
		if(!this.grounded){
			//In air
			this.frame.x = Math.min(this.frame.x + this.delta * 0.2, 2);
			this.frame.y = 5;
			this.force.x = -this.forward() * this.speed * 2.5;
			this.states.phase = 0;
			this.states.time = 0.0;
			this.states.rest = Game.DELTASECOND * 0.25;
			this.states.next = Math.random() > 0.5 ? 3:6;
		} else if(this.states.rest > 0){
			//Rest
			this.frame.x = 3;
			this.frame.y = 5;
			this.states.rest -= this.delta;
		} else if(this.states.phase == 1){
			//Ready Charge
			var progress = 1 - (this.states.time / ElectroLizard.TIME_READYCHARGE);
			this.frame = ElectroLizard.anim_readycharge.frame(progress);
			this.states.next = 2;
		} else if(this.states.phase == 2){
			//Charge
			this.force.x += this.forward() * this.speed * this.delta;
			this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 6;
			this.frame.y = 1;
			this.states.next = 6;
			this.startX = this.position.x;
			
			this.strike(new Line(0,8,48,16));
		} else if(this.states.phase == 3){
			//Slam hammer down
			var progress = 1 - (this.states.time / ElectroLizard.TIME_HAMMERDOWN);
			this.frame = ElectroLizard.anim_slamhammer.frame(progress);
			
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_HAMMERDOWN*0.24, this.delta)){
				this.lightningArc();
				var str = Math.min(Math.max((200-Math.abs(dir.x))/100,0),1) * 4;
				shakeCamera(Game.DELTASECOND*0.25,str);
			}
		} else if(this.states.phase == 4){
			//Ready Arrow
			var progress = 1 - (this.states.time / ElectroLizard.TIME_READYARROW);
			this.frame = ElectroLizard.anim_readyarrow.frame(progress);
			this.states.next = 5;
			this.states.arrows = 3 + Math.floor(Math.random() * 4);
		} else if(this.states.phase == 5){
			//Arrow Volley
			this.frame.x = 4;
			this.frame.y = 6;
			if(this.states.time < ElectroLizard.TIME_ARROW*0.5){
				this.frame.x = 3;
			}
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_ARROW*0.5, this.delta)){
				this.shootArrow();
			}
			if(this.states.time <= 0 && this.states.arrows > 0){
				this.states.arrows--;
				this.states.time = ElectroLizard.TIME_ARROW;
			}
		} else if(this.states.phase == 6){
			//Hammer attack
			var progress = 1 - (this.states.time / ElectroLizard.TIME_HAMMERATTACK);
			this.frame = ElectroLizard.anim_hammerattack.frame(progress);
			
			if(Timer.isAt(this.states.time, ElectroLizard.TIME_HAMMERATTACK*0.4, this.delta)){
				var str = Math.min(Math.max((200-Math.abs(dir.x))/100,0),1) * 4;
				shakeCamera(Game.DELTASECOND*0.25,str);
			}
			if(this.frame.y == 7 && this.frame.x >= 3 && this.frame.x < 5){
				this.strike(new Line(0,-40,88,32), {"blockable" : 0});
			}
		} else if(this.states.phase == 7){
			//Leap back
			if(this.states.time <= 0){
				this.grounded = false;
				this.force.y = -5.0;
			}
		} else {
			//Idle
			this.frame.x = this.frame.y = 0;
			this.flip = dir.x > 0;
			
			if(this.states.next){
				this.setState(this.states.next);
			} else if(this.states.time < -Game.DELTASECOND * 1.2){
				if(
					(this.flip && this.position.x - this.startX > 64) || 
					(!this.flip && this.position.x - this.startX < -64)
				){
					if(Math.random() < 0.5){
						this.setState(1);
					} else {
						this.setState(6);
					}
				} else {
					if(Math.abs(dir.x) < 96 ){
						if(Math.random() < 0.5){
							this.setState(3);
						} else {
							this.setState(6);
						}
					} else {
						if(Math.random() < 0.9){
							this.setState(4);
						} else {
							this.setState(6);
						}
						
					}
				}
			}
		}
		
		if(this.states.time <= 0){
			this.states.phase = 0;
		}
		
	} else{
		this.force.x = 0;
		this.frame.x = 0;
		this.frame.y = 8;
	}
}

ElectroLizard.TIME_READYCHARGE = Game.DELTASECOND * 1.5;
ElectroLizard.TIME_CHARGE = Game.DELTASECOND * 1.5;
ElectroLizard.TIME_HAMMERDOWN = Game.DELTASECOND * 2.5;
ElectroLizard.TIME_READYARROW = Game.DELTASECOND * 0.5;
ElectroLizard.TIME_ARROW = Game.DELTASECOND * 0.4;
ElectroLizard.TIME_HAMMERATTACK = Game.DELTASECOND * 1.8;
ElectroLizard.TIME_PRELEAP = Game.DELTASECOND * 0.2;

ElectroLizard.anim_readycharge = new Sequence([
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.1],
	[3,2,0.5]
]);
ElectroLizard.anim_slamhammer = new Sequence([
	[0,3,0.1],
	[1,3,0.1],
	[2,3,0.1],
	[3,3,0.1],
	[4,3,0.1],
	[0,4,0.5],
	[1,4,0.1],
	[2,4,0.5],
	[3,4,0.05],
	[4,4,0.5]
]);
ElectroLizard.anim_readyarrow = new Sequence([
	[0,6,0.1],
	[1,6,0.1],
	[2,6,0.1],
	[3,6,0.1],
	[4,6,0.25]
]);
ElectroLizard.anim_hammerattack = new Sequence([
	[3,5,0.5],
	[0,7,0.08],
	[1,7,0.3],
	[2,7,0.1],
	[3,7,0.1],
	[4,7,0.1],
	[5,7,0.5]
]);

 /* platformer\modules.js*/ 

var physicsLayer = {
	"default" : 0,
	"item" : 1,
	"particles" : 2,
	"groups" : {
		0 : [0],
		1 : [1],
		2 : [2]
	}
}
var unitsPerMeter = 32;
var mod_rigidbody = {
	'init' : function(){
		this.interactive = true;
		
		this.mass = 1.0;
		this.force = new Point();
		this.gravity = 1.0;
		this.airtime = 0.0;
		this.grounded = false;
		this._groundedTimer = 0;
		this.friction = 0.1;
		this.bounce = 0.0;
		this.collisionReduction = 0.0;
		this.resistObjects = 0.0;
		this.rigidbodyActive = true;
		this.preventPlatFormSnap = false;
		this.pushable = true;
		this.physicsLayer = physicsLayer.default;
		this.currentlyStandingBlock = false;
		
		this.on("collideHorizontal", function(dir){
			this.force.x *= this.collisionReduction;
		});
		this.on("collideVertical", function(dir){
			if( dir > 0 ) {
				if(!this.grounded && this.force.y > 0.2){
					this.trigger("land", this.force.y);
				}
				this.grounded = true;
				this._groundedTimer = 2;
			}
			if((this.force.y > 0 && dir > 0) || (this.force.y < 0 && dir < 0 )){
				this.force.y *= -this.bounce;
			}
		});
		this.atLedge = function(f){
			if(f == undefined){
				f = this.forward();
			}
			var c = this.corners();
			var p = new Point(
				f > 0 ? c.right : c.left,
				c.bottom + 16
			);
			return game.getTile(p) == 0;
			
		}
		this.addHorizontalForce = function(speed, acceleration=1.0){
			//Adds horizontal force while also limiting top speed
			let absSpeed = Math.abs(speed);
			if(this.force.x > -absSpeed && this.force.x < absSpeed){
				this.force.x += speed * this.delta * acceleration;
			}
		}
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) && this.pushable && obj.pushable ) {
				if(physicsLayer.groups[this.physicsLayer].indexOf(obj.physicsLayer) >= 0){
					var dir = this.position.subtract( obj.position ).normalize();
					
					if(this.resistObjects){
						this.force = this.force.add(dir.normalize(this.resistObjects * this.delta));
					} else {
						var obj_corners = obj.corners();
						var ths_corners = this.corners();
						
						if(dir.x < -.3){
							this.position.x = obj_corners.left - this.width * this.origin.x;
							this.force.x = Math.min(this.force.x, 0);
						} else if(dir.x > .3){
							this.position.x = obj_corners.right + this.width * this.origin.x;
							this.force.x = Math.max(this.force.x, 0);
						} else if(this.mass <= obj.mass){
							this.force.x += (dir.x > 0 ? 1 : -1) * this.delta;
						}
					}
					
					
					
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
					*/
				}
			}
		});
	},
	'update' : function(){
		if(this.delta > 0 && this.rigidbodyActive){
			var inair = !this.grounded;
			
			if(this.airtime <= 0 || this.force.y < 0.0){
				this.force.y += self.unitsPerMeter * this.gravity * this.delta;
			}
			//Max speed 
			this.force.x = Math.max( Math.min ( this.force.x, 50), -50 );
			this.force.y = Math.max( Math.min ( this.force.y, 50), -50 );
			
			if(Math.abs( this.force.x ) < 0.01 ) this.force.x = 0;
			if(Math.abs( this.force.y ) < 0.01 ) this.force.y = 0;
			
			//Add just enough force to lock them to the ground
			if(this.grounded ) { this.force.y += 0.1 };
			//if(this.grounded ) this.force.y = 0.0;
			
			//The timer prevents landing errors
			this._groundedTimer -= this.grounded ? 1 : 10;
			this.grounded = this._groundedTimer > 0;
			
			var limits = game.t_move( 
				this, 
				self.unitsPerMeter * this.force.x * this.delta, 
				self.unitsPerMeter * this.force.y * this.delta 
			);
			
			if(this.preventPlatFormSnap <= 0){
				if(this.grounded && limits[1] > this.position.y && limits[1] - this.position.y < 16 ){
					this.position.y = limits[1];
					this.trigger("collideVertical", 1);
				}
			}
			
			if(this.currentlyStandingBlock){
				this.position = this.position.add(this.currentlyStandingBlock.blockChange);
				if(!this.currentlyStandingBlock.interactive){
					this.currentlyStandingBlock = false;
				} else if(this.isStuck){
					this.currentlyStandingBlock = false;
				} else if(this.grounded && this.currentlyStandingBlock.block_isWithinX(this)){
					this.force.y = 0.0;
					var c = this.currentlyStandingBlock.corners();
					this.position.y = c.top - 0.1 - this.height * this.origin.y;
					this.trigger("collideVertical", 1);
					this.currentlyStandingBlock.trigger("ontop", this);
				} else {
					this.currentlyStandingBlock = false;
				}
			}
			
			var friction_x = 1.0 - this.friction * this.delta;
			var friction_y = 1.0 - 0.02 * this.delta;
			this.force.x *= friction_x;
			this.force.y *= friction_y;
			this.preventPlatFormSnap -= this.delta;
			this.airtime -= this.delta;
		}
	},
}

var mod_block = {
	'init' : function(){
		this.blockCollide = true;
		this.blockKillStuck = true;
		this.blockTopOnly = false;
		this.blockStuck = new Array();
		this.blockPrevious = new Point(this.position.x, this.position.y);
		this.blockChange = new Point(0,0);
		this.blockCollideCriteria = function(obj){ return obj.hasModule(mod_rigidbody); }
		this.zIndex = 20;
		
		this.block_isWithinX = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.right >= d.left && c.left <= d.right;
		}
		this.block_isWithinY = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.bottom >= d.top && c.top <= d.bottom;
		}
		this.block_isWithin = function(obj){
			c = obj.corners();
			d = this.corners();
			return c.right >= d.left && c.left <= d.right && c.bottom >= d.top && c.top <= d.bottom;
		}
		this.block_isOnboard = function(obj){
			if(obj.hasModule(mod_rigidbody)){
				return obj.currentlyStandingBlock === this;
			}
			return false;
		}
		this.block_handleStuck = function(obj){
			//obj.position = obj.position.add(this.blockChange);
			
			this.trigger("objectStuck", obj);
			obj.trigger("blockStuck", this);
			if(obj.position.y < this.position.y){
				this.trigger("collideTop", obj);
			} else if(obj.position.x > this.position.x + this.width * this.origin.x){
				//obj.position.x += obj.delta;
				obj.trigger( "collideHorizontal", 1);
			} else {
				//obj.position.x -= obj.delta;
				obj.trigger( "collideHorizontal", -1);
			}
		}
		
		this.on("collideTop", function(obj){
			var c = this.corners();
			let wg = obj.grounded;
			if(obj.force.y > 0){
				obj.position.y = (c.top - 0.1) - obj.height * obj.origin.y;
				obj.trigger( "collideVertical", 1);
				obj.trigger( "blockCollideVertical", 1, this);
			}
			if(obj.gravity > 0){
				this.trigger("blockLand",obj);
				if(obj.currentlyStandingBlock !== this && !wg){
					//obj.trigger("land");
				}
				//this.blockOnboard.push(obj);
				obj.currentlyStandingBlock = this;
				obj.preventPlatFormSnap = Game.DELTAFRAME30;
			}
		});
		this.on("collideBottom", function(obj){
			var c = this.corners();
			obj.position.y = c.bottom + obj.height * obj.origin.y;
			if(obj.force.y < 0){
				obj.trigger( "collideVertical", -1);
				obj.trigger( "blockCollideVertical", -1, this);
			}
		});
		this.on("collideLeft", function(obj){
			var c = this.corners();
			obj.position.x = c.left - obj.width * obj.origin.x;
			if(obj.force.x > 0){
				obj.trigger( "collideHorizontal", 1);
				obj.trigger( "blockCollideHorizontal", 1, this);
			}
		});
		this.on("collideRight", function(obj){
			var c = this.corners();
			obj.position.x = c.right + obj.width * obj.origin.x;
			if(obj.force.x < 0){
				obj.trigger( "collideHorizontal", -1);
				obj.trigger( "blockCollideHorizontal", -1, this);
			}
		});
		
		this.on("collideObject", function(obj){
			if(this.blockCollide && this.width > 0 && this.height > 0){
				if( this.blockCollideCriteria(obj) ) {
					var prepos = obj.position.subtract(obj.force.scale(obj.delta));
					var d = this.corners(this.blockPrevious);
					//var b = obj.corners();
					var c = obj.corners(prepos);
					
					if(!this.block_isWithin(obj)){
						//Object outside of bounds, do nothing
					} else if(c.bottom <= d.top){
						//Top
						this.trigger("collideTop", obj);
					} else if(c.top >= d.bottom){
						//Bottom
						this.trigger("collideBottom", obj);
					} else if(c.right <= d.left){
						//left
						this.trigger("collideLeft", obj);
					} else if(c.left >= d.right){
						//right
						this.trigger("collideRight", obj);
					} else {
						//Stuck inside
						this.blockStuck.push(obj);
					}
				}
			}
		});
	},
	'update' : function(){
		for(var i=0; i < this.blockStuck.length; i++){
			this.block_handleStuck(this.blockStuck[i]);
		}
		this.blockStuck = new Array();
		
		this.blockChange = this.position.subtract(this.blockPrevious);
		this.blockPrevious = new Point(this.position.x,this.position.y);
	}
}
/*
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
				var h = 256;
				var v = 240;
				var hlimit = 1024;
				var vlimit = 960;
				switch( Math.abs(map_tile) % 16 ){
					case 0: lock = new Line(0,0,h,v+vlimit); break;
					case 1: lock = new Line(0,0,h+hlimit,v+vlimit); break;
					case 2: lock = new Line(-hlimit,0,h,v+vlimit); break;
					case 3: lock = new Line(-hlimit,0,h+hlimit,v+vlimit); break;
					case 4: lock = new Line(0,0,h,v); break;
					case 5: lock = new Line(0,0,h+hlimit,v); break;
					case 6: lock = new Line(-hlimit,0,h,v); break;
					case 7: lock = new Line(-hlimit,0,h+hlimit,v); break;
					case 8: lock = new Line(0,-vlimit,h,v+vlimit); break;
					case 9: lock = new Line(0,-vlimit,h+hlimit,v+vlimit); break;
					case 10: lock = new Line(-hlimit,-vlimit,h,v+vlimit); break;
					case 11: lock = new Line(-hlimit,-vlimit,h+hlimit,v+vlimit); break;
					case 12: lock = new Line(0,-vlimit,h,v); break;
					case 13: lock = new Line(0,-vlimit,h+hlimit,v); break;
					case 14: lock = new Line(-hlimit,-vlimit,h,v); break;
					case 15: lock = new Line(-hlimit,-vlimit,h+hlimit,v); break;
					default: lock = new Line(-hlimit,-vlimit,h,v+vlimit); break;
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
*/
var mod_combat = {
	"init" : function() {
		this.lifeMax = this.life = 100;
		this.difficulty = 0;
		this.team = 0;
		this.criticalChance = 0.0;
		this.hurtByDamageTriggers = true;
		this.moneyDrop = Spawn.money(3,0);
		
		this.damage = 10;
		this.damageFire = 0;
		this.damageSlime = 0;
		this.damageIce = 0;
		this.damageLight = 0;
		this.damageFixed = 0;
		
		this.defencePhysical = 0;
		this.defenceFire = 0;
		this.defenceSlime = 0;
		this.defenceIce = 0;
		this.defenceLight = 0;
		
		this.criticalMultiplier = 4.0;
		
		//Counters
		this.invincible = 0;
		this.invincible_time = Game.DELTASECOND * 0.35;
		this.stun = 0;
		this.stun_time = Game.DELTASECOND;
		this.combat_stuncount = 0;
		this.death_time = 0;
		this._death_confirmed = false;
		this._death_clock = new Timer(Number.MAX_VALUE, Game.DELTASECOND * 0.25);
				
		this.showDamage = true;
		this._damageCounter = new EffectNumber(0,0,0);
		this.hitIgnoreList = new Array();
		
		this.ragdoll = false;
		
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false,
			"life" : 99999,
			"lifeMax" : 99999,
			"restore" : 0.5,
			"invincible" : 0.0,
			"omidirectional" : false
		};
		
		
			
		this.strike = Combat.strike;
		this.shieldArea = Combat.shieldArea;
		
		this.combatFinalDamage = function(damage){
			this.life -= damage;
		}
		
		this._combatTarget;
		this.target = function(){
			if(this._combatTarget == undefined){
				this._combatTarget = _player;
			}
			return this._combatTarget;
		}
		
		this.isDead = function(){
			if(this.life <= 0){
				//Remove effects
				this.buffer_damage = 0;
				this.hurtByDamageTriggers = false;
				
				if(!this._death_confirmed){
					game.addObject(new EffectExplosion(this.position.x,this.position.y));
				}
				
				//Trigger death
				if( this.death_time > 0 ) {
					//Stand in place and explode
					this.trigger("pre_death");
					this._death_clock.set(this.death_time);
					this.interactive = false;
				} else if( this.hasModule(mod_rigidbody)){
					if( !this.ragdoll ){
						//Rag doll and explode
						this.trigger("pre_death");
						game.addObject(new EffectExplosion(this.position.x,this.position.y));
						this.physicsLayer = physicsLayer.particles;
						this.ragdoll = true;
					}
				} else {
					this.trigger("death");
					
				}
				this._death_confirmed = true;
			} else {
				this.ragdoll = false;
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
		this.displayDamage = function(damage){
			if(damage > 0 && this.life > 0 && this.showDamage){
				//Show damage taken
				this._damageCounter.value = Math.round(this._damageCounter.value + damage * 1);
				this._damageCounter.progress = 0.0;
				this._damageCounter.position.x = this.position.x;
				this._damageCounter.position.y = this.position.y - 16;
				if(this._damageCounter.sleep){
					game.addObject(this._damageCounter);
				}
			}
		}
		
		this.getDamage = Combat.getDamage;
		
		this.calcDamage = Combat.calcDamage;
		
		this.hurt = function(obj, damage){
			
			if(damage == undefined){
				//If no damage is supplied, get it
				damage = Combat.getDamage.apply(obj);
			}
			
			//Turns damage object into a flat damage number
			damage = this.calcDamage(damage);
			
			
			if( this.invincible <= 0 ) {
				//Increment number of hits
				this.combat_stuncount++;
				this.trigger("stun", obj, damage, this.combat_stuncount);
				
				if( Math.random() < this.criticalChance && damage > 0) {
					//Determine if its a critical shot
					damage *= obj.criticalMultiplier || 2.0;
					audio.play("critical",this.position);
					game.slow(0.1, Game.DELTASECOND * 0.5 );
					this.trigger("critical",obj,damage);
					game.addObject(new EffectCritical(this.position.x, this.position.y));
				}
				
				if(damage > 0){
					//damage = Math.max( damage - Math.ceil( this.defencePhysical * damage ), 1 );
					
					damage = obj.useBuff("prehurt_other",damage,this);
					damage = this.useBuff("hurt",damage,obj);
					
					this.displayDamage(damage);
					
					this.combatFinalDamage(damage);
					
					this.isDead();
					
					this.invincible = this.invincible_time;
					//this.stun = this.stun_time;
					this.trigger("hurt",obj,damage);
					obj.trigger("hurt_other",this,damage);
					
					this.useBuff("posthurt",damage,obj);
					obj.useBuff("hurt_other",damage,this);
					
					
					if(this.ragdoll && this.hasModule(mod_rigidbody)){
						this.grounded = false;
						this.gravity = 0.6;
						this.criticalChance = 0;
						this.force.y = -7;
						this.force.x = (this.position.x-obj.position.x<0?-1:1) * 2;
					}
				} else {
					this.invincible = this.invincible_time;
				}
			}
		}
		
		this.calculateXP = function(){}
	},
	"update" : function(){
		if( this.invincible > 0 ) {
			
		} else {
			this.filter = this._base_filter;
		}
		if(this.stun <= 0){
			this.combat_stuncount = 0;
		}
		
		if(this.swrap instanceof SpriteWrapper){
			let boxes = this.swrap.getAttackBoxes(this.frame, this);
			for(let i=0; i < boxes.length; i++){
				Combat.attackCheck.apply(this,[ boxes[i] ]);
			}
		}
		
		//this.deltaScale = this.statusEffects.slow > 0 ? 0.5 : 1.0;
		
		
		//Handle death
		if(this.life <= 0 ){
			if(this.ragdoll){
				if(this.grounded){
					this.trigger("death");
				}
			} else {
				if(this.death_time > 0) {
					if( this._death_clock.status(game.deltaUnscaled) ) {
						game.addObject(new EffectExplosion(
							this.position.x + this.width*(Math.random()-.5), 
							this.position.y + this.height*(Math.random()-.5)
						));
					}
					if( this._death_clock.time <= 0 ) this.trigger("death");
				}
			}
		}
		
		
		this.invincible -= this.deltaUnscaled;
		this.guard.invincible -= this.deltaUnscaled;
		this.stun -= this.delta;
	},
	"postrender" : function(g,c){
		if(self.debug){
			if(this.swrap instanceof SpriteWrapper){
				let boxes1 = this.swrap.getHitBoxes(this.frame, this);
				let boxes2 = this.swrap.getAttackBoxes(this.frame, this);
				let boxes3 = this.swrap.getGuardBoxes(this.frame, this);
				let nCam = c.scale(-1);
				
				g.color = [1.0,0.7,0.7,1.0];
				for(let i=0; i < boxes1.length; i++){
					let box = boxes1[i].transpose(nCam);
					g.scaleFillRect(box.start.x, box.start.y, box.width(), box.height());
				}
				g.color = [0.8,0.0,0.0,1.0];
				for(let i=0; i < boxes2.length; i++){
					let box = boxes2[i].transpose(nCam);
					g.scaleFillRect(box.start.x, box.start.y, box.width(), box.height());
				}
				g.color = [0.0,0.2,0.8,1.0];
				for(let i=0; i < boxes3.length; i++){
					let box = boxes3[i].transpose(nCam);
					g.scaleFillRect(box.start.x, box.start.y, box.width(), box.height());
				}
				
			}
		}
	}
}

var Combat = {
	"attackCheck" : function(rect, ops){
		let margin = new Point(32,32);
		let checkArea = new Line(rect.start.subtract(margin), rect.end.add(margin));
		let hits = game.overlaps(checkArea);
		
		for(let i=0; i < hits.length; i++) {
			let hit = hits[i];
			if(hit.interactive && hit != this){
				
				let enemAreas = Combat.getHitAreas.apply(hit);
				
				for(let j=0; j < enemAreas.length; j++){
					if(enemAreas[j].overlaps(rect)){
						//Triggers overlap, cause hit
						
						hit.trigger("struck",this);
						Combat.hit.apply(this, [hit, ops, rect]);
						return;
					}
				}
			}
		}
		
	},
	"getHitAreas" : function(){
		if(this.swrap instanceof SpriteWrapper){
			return this.swrap.getHitBoxes(this.frame, this);
		} else {
			return [new Line(
				this.position.x - this.width * this.origin.x,
				this.position.y - this.width * this.origin.y,
				this.position.x + this.height * (1-this.origin.x),
				this.position.y + this.height * (1-this.origin.y)
			)];
		}
	},
	"strike" : function(rect, ops){
		var offset = new Line( 
			this.position.add( new Point( rect.start.x * (this.flip ? -1.0 : 1.0), rect.start.y) ),
			this.position.add( new Point( rect.end.x * (this.flip ? -1.0 : 1.0), rect.end.y) )
		);
		
		offset.correct();
		this.ttest = offset;
		var hits = game.overlaps(offset);
		for(var i=0; i < hits.length; i++){
			if(hits[i].interactive){
				hits[i].trigger("struck",this)
				Combat.hit.apply(this, [hits[i], ops, offset]);
			}
		}
	},	
	"hit"  : function(obj, ops, rect){
		if(this.hitIgnoreList instanceof Array){
			if(this.hitIgnoreList.indexOf(obj) >= 0){
				//Object is ignore list, terminate hit
				return false;
			}
		}
		
		ops = ops || {};
		var multiplier = 1.0;
		var blockable = true;
		var direction = this.flip;
		
		if("multiplier" in ops){
			multiplier = ops["multiplier"] * 1;
		}
		
		var damage = Combat.getDamage.apply(this, [multiplier]);
		
		if("blockable" in ops){
			blockable = ops["blockable"] * 1;
		}
		if("damage" in ops){
			damage = ops["damage"];
		}
		
		if("direction" in ops){
			direction = !!ops["direction"];
		}
		
		if( "team" in obj && this.team != obj.team && obj.hurt instanceof Function ) {
			if( !blockable || !obj.hasModule(mod_combat) ) {
				obj.hurt( this, damage );
			} else {
				var flip = obj.flip ? -1:1;
				var shield = obj.shieldArea();
				var flatDamage = obj.calcDamage(damage);
				
				if( obj.guard.active && (obj.guard.omidirectional||(direction!=obj.flip)) && shield.overlaps(rect) ){
					if(obj.guard.invincible <= 0){
						obj.guard.invincible = Game.DELTASECOND * 0.5;
						
						this.trigger("blocked",obj);
						obj.trigger("block",this,rect,flatDamage);
						
						this.useBuff("blocked", flatDamage, obj);
						obj.useBuff("block", flatDamage, this);
					}
				} else {
					//this.trigger("hurt_other",obj, damage);
					obj.hurt( this, damage );
				}
				
			}
			this.trigger("struckTarget", obj);
		}
	},
	"shieldArea" : function(){
		shield = new Line( 
			this.position.add( 
				new Point( 
					this.guard.x * this.forward(), 
					this.guard.y
				) 
			),
			this.position.add( 
				new Point( 
					(this.guard.x+this.guard.w) * this.forward(),
					this.guard.y+this.guard.h
				) 
			)
		);
		shield.correct();
		return shield;
	},
	"getDamage" : function(multiplier){
		if(multiplier == undefined){
			multiplier = 1.0;
		}
		
		this.damage = this.damage || 0;
		this.damageFire = this.damageFire || 0;
		this.damageSlime = this.damageSlime || 0;
		this.damageIce = this.damageIce || 0;
		this.damageLight = this.damageLight || 0;
		this.damageFixed = this.damageFixed || 0;
		
		return {
			"physical" : this.damage * multiplier,
			"fire" : this.damageFire * multiplier,
			"slime" : this.damageSlime * multiplier,
			"ice" : this.damageIce * multiplier,
			"light" : this.damageLight * multiplier,
			"fixed" : this.damageFixed * multiplier
		};
	},
	"calcDamage" : function(damage){
		if(damage instanceof Object){
			var fdamage = 0;
			if(damage.physical > 0){
				fdamage += Math.max(damage.physical - this.defencePhysical, 1);
			}
			if(damage.fire > 0){
				fdamage += Math.max(damage.fire - this.defenceFire, 1);
			}
			if(damage.slime > 0){
				fdamage += Math.max(damage.slime - this.defenceSlime, 1);
			}
			if(damage.ice > 0){
				fdamage += Math.max(damage.ice - this.defenceIce, 1);
			}
			if(damage.light > 0){
				fdamage += Math.max(damage.light - this.defenceLight, 1);
			}
			fdamage += damage.fixed;
			damage = Math.round(fdamage);
		} else {
			damage = Math.max(damage - this.defencePhysical, 1);
		}
		return Math.min(damage, 9999);
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
		this.boss_shutdoors = true;
		this.boss_showintro = true;
		this.bossdeatheffect = false;
		this.boss_id = "boss_"+game.newmapName+"_"+Math.floor(x)+"_"+Math.floor(y);
		
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
				if(this.boss_shutdoors){
					Trigger.activate("boss_door");
				}
			}
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 120 && Math.abs( dir.y ) < 64 ){
					this.trigger("activate");
				}
			}
		}
		
		if(NPC.get(this.boss_id)){
			this.on("added", function(){
				this.destroy();
			})
		}
		
		this.on("player_death", function(){
			this.reset_boss();
		});
		this.on("activate", function() {
			if(this.boss_shutdoors){
				Trigger.activate("boss_door");
			}
			if(this.boss_showintro){
				game.slow(0.1, Game.DELTASECOND * 3);
			}
			
			//for(var i=0; i < this.boss_doors.length; i++ ) 
			//	game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, game.tileCollideLayer, window.BLANK_TILE);
			//_player.lock_overwrite = this.boss_lock;
			this.active = true;
			this.interactive = true;
		});
		this.on("death", function() {
			if(this.boss_shutdoors){
				Trigger.activate("boss_door");
			}
			Trigger.activate("boss_death");
			
			NPC.set(this.boss_id, 1);
			
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
		if(this.boss_showintro){
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
	/*
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
	*/
}

EnemyStruck = function(obj,pos,damage){
	/*
	if( this.team == obj.team ) return;
	var clife = this.life;
	this.hurt( obj, damage );
	if(clife != this.life) game.addObject(new EffectBlood(
		pos.x, pos.y, this.position.subtract(obj.position).normalize(), clife - this.life)
	);
	*/
}

 /* platformer\mod_camera.js*/ 

var mod_camera = {
	"init" : function(){
		this.camera_attitude_v = false;
		this.camera_transition = this.position.scale(1);
		this.camera_transitionTime = Game.DELTASECOND * 0.6;
		this.camera_tracking = 1;
		this.camerShake = new Point();
		this.cameraOcclusions = new Array();
		
		this.cameraGetMapTile = function(pos){
			var re = {
				196:0, 197:0, 198:0, 199:64,204:0,205:0,206:0,207:64,
				212:0, 213:0, 214:0, 220:0,221:0,222:0,
				236:0, 237:8, 253:8
			};
			let p = pos.scale(new Point(1 / 256, 1 / 240)).floor();
			let index = p.x + p.y * (game.map.width / 16);
			let tile = game.map.map[index];
			if(tile in re){ tile = re[tile];}
			return tile;
		}
		this.cameraRenderOcclusion = function(g,c, pos){
			
			let mtile = this.cameraGetMapTile(pos);
			if(mtile != null){
				let mx = Math.floor(mtile / 16);
				let my = Math.floor(mtile % 16);
				
				let m = pos.scale(1/256,1/240).floor().scale(256,240);
				let bot = Math.floor(my / 8) % 2 == 0;
				let top = Math.floor(my / 4) % 2 == 0;
				let rgt = Math.floor(my / 2) % 2 == 0;
				let lft = Math.floor(my / 1) % 2 == 0;
				
				g.color = [0,0,0,1];
				if(!bot){ g.scaleFillRect(m.add(new Point(0,240).subtract(c)),256,240); }
				if(!top){ g.scaleFillRect(m.add(new Point(0,-240).subtract(c)),256,240); }
				if(!rgt){ g.scaleFillRect(m.add(new Point(256,0).subtract(c)),256,240); }
				if(!lft){ g.scaleFillRect(m.add(new Point(-256,0).subtract(c)),256,240); }
			}
		}
	},
	
	"update" : function(){
		let mapTileSize = new Point(16,15);
		let twidth = game.map.width / mapTileSize.x;
		let theight = game.map.height / mapTileSize.y;
		let p = this.position.scale(new Point(1 / 256, 1 / 240)).floor();
		let m = p.scale(256,240);
		let f = this.position.subtract(p.scale(256,240));
	
		let index = p.x + p.y * twidth;
		//let mtile = game.map.map[index];
		let mtile = this.cameraGetMapTile(this.position);
		
		let mx = Math.floor(mtile / 16);
		let my = Math.floor(mtile % 16);
		
		let bot = Math.floor(my / 8) % 2 == 0;
		let top = Math.floor(my / 4) % 2 == 0;
		let rgt = Math.floor(my / 2) % 2 == 0;
		let lft = Math.floor(my / 1) % 2 == 0;
		
		let cTL = (top && lft) && Math.floor(mx / 8) % 2 != 0;
		let cBL = (bot && lft) && Math.floor(mx / 4) % 2 != 0;
		let cTR = (top && rgt) && Math.floor(mx / 2) % 2 != 0;
		let cBR = (bot && rgt) && Math.floor(mx / 1) % 2 != 0;
		
		let limitsTL = new Point(p.x * 256, p.y * 240);
		
		let v = this.camera_attitude_v;
		if((top && f.y < 80) || (bot && f.y > 216)){
			v = true;
		} else if((lft && f.x < 32) || (rgt && f.x > 224)){
			v = false;
		}
		
		let newPos = this.position.subtract(game.resolution.scale(0.5));
		
		if((bot || top) && (bot != top)){
			if(this.camera_attitude_v){
				if(cBL || cTL){lft = false;}
				if(cBR || cTR){rgt = false;}
			} else {
				if(cBL || cBR){bot = false;}
				if(cTL || cTR){top = false;}
			}
			if(v != this.camera_attitude_v){
				this.camera_attitude_v = v;
				this.camera_transition = game.camera.scale(1);
				if(cTL || cBL || cTR || cBR){
					this.camera_tracking = 0.0;
				}
			}
		}
		
		if(!bot){ newPos.y = Math.min(limitsTL.y, newPos.y); }
		if(!top){ newPos.y = Math.max(limitsTL.y, newPos.y); }
		if(!rgt){ newPos.x = Math.min(limitsTL.x-(game.resolution.x-256), newPos.x); }
		if(!lft){ newPos.x = Math.max(limitsTL.x, newPos.x); }
		
		if(!rgt && !lft){newPos.x = limitsTL.x - (game.resolution.x*0.5-128);}
		
		this.camera_tracking = Math.clamp01(this.camera_tracking + this.delta / this.camera_transitionTime);
		
		game.camera = Point.lerp(this.camera_transition, newPos, this.camera_tracking);
		
		if(this.camerShake.x > 0){
			var shake = new Point(0.5 - Math.random(), 0.5 - Math.random()).normalize();
			
			game.camera = game.camera.add(shake.scale(this.camerShake.y));
			this.camerShake.x -= game.deltaUnscaled;
		}
	},
	"postrender" : function(g,c){
		this.cameraRenderOcclusion(g,c,this.position);
		
		let mtile = this.cameraGetMapTile(this.position);
		let mx = Math.floor(mtile / 16);
		let my = Math.floor(mtile % 16);
		
		let m = this.position.scale(1/256,1/240).floor().scale(256,240);
		let bot = Math.floor(my / 8) % 2 == 0;
		let top = Math.floor(my / 4) % 2 == 0;
		let rgt = Math.floor(my / 2) % 2 == 0;
		let lft = Math.floor(my / 1) % 2 == 0;
		g.color = [0,0,0,1];
		if(bot){ this.cameraRenderOcclusion(g,c,this.position.add(new Point(0,240))); }
		if(top){ this.cameraRenderOcclusion(g,c,this.position.add(new Point(0,-240))); }
		//if(!top){ g.scaleFillRect(m.add(new Point(0,-240).subtract(c)),256,240); }
		//if(!rgt){ g.scaleFillRect(m.add(new Point(256,0).subtract(c)),256,240); }
		//if(!lft){ g.scaleFillRect(m.add(new Point(-256,0).subtract(c)),256,240); }
		
	}
}
self["shakeCamera"] = function(time, strength){
	self._player.camerShake = new Point(time, strength);
}

 /* platformer\monsterlock.js*/ 

MonsterLock.prototype = new GameObject();
MonsterLock.prototype.constructor = GameObject;
function MonsterLock(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.zIndex = 20;
	
	this.sprite = "monsterlock";
	
	o = o || {};
	
	this.addModule(mod_combat);
	
	this.target = false;
	this._tid = false;
	this.interactive = false;
	
	this.frame = new Point(0,0);
	this.frameFace = new Point(0,0);
	
	if("trigger" in o){
		this._tid = o["trigger"];
	}
	if("target" in o){
		this.target = o["target"];
	}
	
	this.on("activate", function(){
		this.interactive = true;
		if(this.target){
			Trigger.activate(this.target);
		}
	});
	
	this.on("hurt", function(obj, damage){
		audio.play("hurt",this.position);
	});
	
	this.on("death", function(){
		this.interactive = false;
		this.visible = false;
		if(this.target){
			Trigger.activate(this.target);
		}
	});
}

MonsterLock.prototype.update = function(){
	if(1){
		var dir = this.position.subtract(_player.position);
		this.frame.x = (this.frame.x + this.delta * 0.5) % 6;
		this.frame.y = 0;
		
		if(this.stun > 0 || this.life <= 0){
			this.frameFace.x = 5;
			this.frameFace.y = 3;
		} else if(Math.abs(dir.x) < 96 && Math.abs(dir.y) < 32){
			this.frameFace.x = 4;
			this.frameFace.y = 3;
		} else {
			this.frameFace.x = (this.frameFace.x + this.delta * 0.4) % 4;
			this.frameFace.y = 3;
		}
	}
}

MonsterLock.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex+1,this.frameFace);
}

MonsterDoor.prototype = new GameObject();
MonsterDoor.prototype.constructor = GameObject;
function MonsterDoor(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.zIndex = 20;
	
	this.sprite = "monsterlock";
	this.visible = false;
	this.open = true;
	this.openProgress = 0.0;
	this.frame.x = 0;
	this.frame.y = 1;
	
	if("trigger" in o){
		this._tid = o["trigger"];
	}
	
	this.on("activate", function(){
		this.open = !this.open;
	});
}

MonsterDoor.prototype.update = function(){
	var prog = this.openProgress / MonsterDoor.TIME_OPEN;
	
	if(this.open){
		if(this.openProgress >= 0){
			this.visible = true;
			this.openProgress -= this.delta;
			this.frame.x = Math.floor(prog*6);
			this.frame.y = 1;
		} else {
			this.visible = false;
		}
	} else {
		this.visible = true;
		if(this.openProgress < MonsterDoor.TIME_OPEN){
			this.openProgress += this.delta;
			this.frame.x = Math.floor(prog*6);
			this.frame.y = 1;
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
		}
	}
	
	if(prog > 0){
		Background.pushLight(this.position, prog * 120, MonsterDoor.LOCK_COLOR);
	}
}
MonsterDoor.TIME_OPEN = Game.DELTASECOND * 0.4;
MonsterDoor.LOCK_COLOR = [0.9,0,1.0,1.0];

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
		
		DialogManger.set(this.text);
		
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
			if(!DialogManger.show){
				Chancellor.introduction = false;
				this.close();
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

Chancellor.prototype.hudrender = function(g,c){
	if( this.open ) {
		if( Chancellor.introduction ) {
			DialogManger.render(g);
		} else {
			var left = game.resolution.x / 2 - 112;
			renderDialog(g, i18n("chancellor_howmuch"));
			textBox(g, "$"+this.money, left, 120, 128, 40);
		}
	}
}

Chancellor.introduction = true;

 /* platformer\npc_hotspring.js*/ 

HotSpring.prototype = new GameObject();
HotSpring.prototype.constructor = GameObject;
function HotSpring(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "playerbath";
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 1;
	this.idleMargin = 72;
	
	this.addModule(mod_talk);
	
	this.on("open",function(){
		game.pause = true;
		this.active = true;
		this.frame.x = this.frame.y = 0;
	});
	
	this.on("close", function(){
		game.pause = false;
		this.active = false;
		this.show = false;
		this.time = 0.0;
		
		_player.visible = true;
		Renderer.tint = [1,1,1,1];
	});
	
	this.time = 0.0;
	this.show = false;
}

HotSpring.prototype.update = function(){
	
	if(this.active){
		this.time += game.deltaUnscaled;
		
		if(this.time < Game.DELTASECOND * 0.8){
			//Fade out
			var progress = this.time / (Game.DELTASECOND * 0.8);
			Renderer.tint = [1-progress,1-progress,1-progress,1];
		} else if(this.time < Game.DELTASECOND * 2.0){
			//Fade In
			var progress = (this.time - Game.DELTASECOND*1.2) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [progress,progress,progress,1];
			this.show = true;
			_player.visible = false;
		} else if(this.time < Game.DELTASECOND * 7.0){
			//Animate
			var progress = (this.time - Game.DELTASECOND*2.0) / (Game.DELTASECOND * 5.0);
			this.frame = HotSpring.bathanimation.frame(progress);
		}  else if(this.time < Game.DELTASECOND * 7.8){
			//Fade out
			var progress = (this.time - Game.DELTASECOND*7.0) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [1-progress,1-progress,1-progress,1];
		}  else if(this.time < Game.DELTASECOND * 9.0){
			//Fade in
			var progress = (this.time - Game.DELTASECOND*8.2) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [progress,progress,progress,1];
			this.show = false;
			_player.visible = true;
		} else {
			//End
			this.close();
		}
		
		if(PauseMenu.open){
			this.close();
		}
		
		//Heal
		if(Timer.isAt(this.time,Game.DELTASECOND*6.0,game.deltaUnscaled)){
			_player.life = _player.lifeMax;
			_player.mana = _player.manaMax;
		}
	}
}

	
HotSpring.prototype.render = function(g,c){
	if(this.show){
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex+1, this.frame, false);
	}
}

HotSpring.bathanimation = new Sequence([
	[0,0,0.2],
	[1,0,0.1],
	[2,0,0.1],
	[3,0,0.1],
	[0,1,0.1],
	[1,1,0.4],
	[2,1,0.1],
	[3,1,0.1],
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.5],
	[3,2,0.1],
	[0,3,1.0]
]);

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

 /* platformer\npc_shieldsmith.js*/ 

ShieldSmith.prototype = new GameObject();
ShieldSmith.prototype.constructor = GameObject;
function ShieldSmith(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "npc_smith";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = this.height = 48;
	
	this.cursorSlot = 0;
	this.cursorMagic = 0;
	this.animationProgress = 0.0;
	this.menuOpen = true;
	this.spellMenuOpen = false;
	this.testPlayer = false;
	
	
	
	this.on("open", function(){
		game.pause = true;
		
		this.cursorSlot = 0;
		this.cursorMagic = 0;
		this.spellMenuOpen = false;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}



ShieldSmith.prototype.update = function(){
	this.animationProgress = (this.animationProgress + (this.delta / Game.DELTASECOND)) % 1.0;
	this.frame = ShieldSmith.anim.frame(this.animationProgress);
}

ShieldSmith.prototype.isSpellUsed = function(s){
	return _player.shieldSlots.indexOf(s) >= 0;
}

ShieldSmith.prototype.hudrender = function(g,c){
	if(this.open){
		var pos = new Point(Math.floor(game.resolution.x/2)-168,8);
		
		PauseMenu.renderStatsPage(g, pos, this.testPlayer);
		
		if(this.spellMenuOpen){
			boxArea(g,pos.x+224,8,112,224);
			for(var i=0; i < _player.spells.length; i++){
				var spell = _player.spells[i];
				g.renderSprite("items",new Point(pos.x+244,28+i*20),1,spell.frame);
				textArea(g,"Lv."+spell.level, pos.x+260,24+i*20);
			}
			g.color = [1,1,1,1];
			g.scaleFillRect(pos.x+234,26+this.cursorMagic*20,4,4);
		}
		
		cursorArea(g, pos.x+12+this.cursorSlot*32, 224-36,32,32);
	}
}

ShieldSmith.anim = new Sequence([
	[0,0,0.5],
	[1,0,0.2],
	[2,0,0.1],
	[0,1,0.2],
	[1,1,0.1],
	[2,1,0.1],
]);

ShieldSmith.SLOT_SPECIAL_LOW = 0;
ShieldSmith.SLOT_SPECIAL_MID = 1;
ShieldSmith.SLOT_SPECIAL_HIG = 2;

ShieldSmith.SLOT_MAGIC_LOW = 3;
ShieldSmith.SLOT_MAGIC_MID = 4;
ShieldSmith.SLOT_MAGIC_HIG = 5;

ShieldSmith.SLOT_ATTACK_LOW = 6;
ShieldSmith.SLOT_ATTACK_MID = 7;
ShieldSmith.SLOT_ATTACK_HIG = 8;

ShieldSmith.SLOT_DEFENCE_LOW = 9;
ShieldSmith.SLOT_DEFENCE_MID = 10;
ShieldSmith.SLOT_DEFENCE_HIG = 11;

ShieldSmith.SLOT_FRAME = [
	new Point(0,0),
	new Point(0,1),
	new Point(0,2),
	
	new Point(1,0),
	new Point(1,1),
	new Point(1,2),
	
	new Point(2,0),
	new Point(2,1),
	new Point(2,2),
	
	new Point(3,0),
	new Point(3,1),
	new Point(3,2)
];

ShieldSmith.createTestPlayer = function(){
	var output = {
		"baseStats" : {},
		"stats" : {},
		"equip_sword" : _player.equip_sword,
		"equip_shield" : _player.equip_shield,
		"perks" : {},
		"shieldSlots" : []
	}
	
	for(var i=0; i < _player.shieldSlots.length; i++){
		output.shieldSlots.push(_player.shieldSlots[i]);
	}
	for(perk in _player.perks){
		output.perks[perk] = 0.0;
	}
	for(stat in _player.baseStats){
		output.baseStats[stat] = _player.baseStats[stat];
		output.stats[stat] = 0;
	}
	return output;
}

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
		//audio.playLock("pause",0.3);
		DialogManger.set(this.message);
	});
	this.on("close", function(){
		game.pause = false;
	});
	this.message = "We'er currently closed for business in this demo.";
	this.cursor = 0;	
}

Shop.prototype.update = function(g,c){
	if( this.open > 0 ) {
		/*
		if(!DialogManger.show){
			this.close();
		}*/
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

Shop.prototype.hudrender = function(g,c){	
	let statname = "Attack";
	if(this.cursor == 1) {
		statname = "Defence";
	} else if(this.cursor == 2){
		statname = "Magic";
	}
	
	if( this.open > 0 ){		
		//DialogManger.render(g);
		
		var p = Shop.itemposition[this.cursor].add(this.position).subtract(c);
		
		cursorArea(g, p.x-16,p.y-16,32,32);
		textArea(g, "+1 "+statname, p.x-16, p.y+24);
		textArea(g, "$"+this.price(), p.x-16, p.y+36);
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
		var progress = this.slackCooldown / -Game.DELTASECOND * 1.5;
		this.frame = Smith.anim_braces.frame(progress);
		
		this.slackCooldown -= this.delta
		if(this.slackCooldown <= -Game.DELTASECOND * 1.5){
			this.slackCooldown = Game.DELTASECOND * 4;
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
Smith.anim_braces = new Sequence([
	[0,4,0.1],
	[1,4,1.0],
	[2,4,0.2],
	[0,3,0.5],
]);
Smith.weapons = [
	"short_sword", "long_sword", "broad_sword", "morningstar", "bloodsickle", "burningblade",
	"small_shield", "large_shield", "kite_shield", "broad_shield", "knight_shield", "spiked_shield", "heavy_shield", "tower_shield"
];
Smith.introduction = true;

 /* platformer\npc_spellmaster.js*/ 

SpellMaster.prototype = new GameObject();
SpellMaster.prototype.constructor = GameObject;
function SpellMaster(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "prisoner";
	
	this.frame.x = 3;
	this.frame.y = 0;
	
	this.width = 32;
	this.height = 40;
	
	this.cursorSpell = 0;
	
	this.addModule( mod_talk );
	this.on("open", function(){
		game.pause = true;
		this.cursorSpell = 0;
		audio.play("pause");
	});
	this.on("close", function(){
		game.pause = false;
	});
}



SpellMaster.prototype.update = function(){
	if( this.open ) {
		
		if(input.state("up") == 1){
			this.cursorSpell = Math.max(this.cursorSpell-1, 0);
			audio.play("cursor");
		}
		if(input.state("down") == 1){
			this.cursorSpell = Math.min(this.cursorSpell+1, _player.spells.length-1);
			audio.play("cursor");
		}
		
		if(input.state("fire") == 1){
			var spell = _player.spells[this.cursorSpell];
			if(spell && spell.upgradePrice() <= _player.money && spell.level < spell.levelMax){
				//Upgrade spell
				_player.money -= spell.upgradePrice();
				spell.level++;
				_player.equip();
				
				audio.play("item1");
			} else {
				audio.play("negative");
			}
		}
		
		if(input.state("jump") == 1){
			this.close();
		}
		if(PauseMenu.open){
			this.close();
		}
	}
}

SpellMaster.prototype.hudrender = function(g,c){
	if(this.open){
		var pos = new Point(Math.floor(game.resolution.x/2)-112,8);
		
		boxArea(g,pos.x,pos.y,224,224);
		textArea(g,"Increase Spells",pos.x+20,pos.y+12);
		
		for(var i=0; i < _player.spells.length; i++){
			var spell = _player.spells[i];
			spell.render(g, new Point(pos.x+24, pos.y+36+i*20));
			textArea(g,"Lv."+spell.level, pos.x+40,pos.y+32+i*20);
			
			if(spell.level < spell.levelMax){
				textArea(g,"$"+spell.upgradePrice(), pos.x+88,pos.y+32+i*20);
			} else {
				textArea(g,"Max", pos.x+88,pos.y+32+i*20);
			}
			//textArea(g,spell.name, pos.x+72,pos.y+32+i*20);
			
		}
		
		g.color = [1,1,1,1];
		g.scaleFillRect(pos.x+10,pos.y+34+this.cursorSpell*20,4,4);
	}
}

 /* platformer\ocean.js*/ 

Ocean.prototype = new GameObject();
Ocean.prototype.constructor = GameObject;
function Ocean(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.sprite = "halo";
	
	this.inc = 2;
	this.waveheight = 32;
	this.wavelength = 0.025;
	this.speed = 0.1;
	this.turbulence = 5.5;
	this.turbulenceScale = 0.2;
	
	this.blocks = null;
	
	o = o || {};
}

Ocean.prototype.update = function(){
	if(this.blocks instanceof Array){
		for(var i=0; i < this.blocks.length; i++){
			var block = this.blocks[i];
			block.position.y = (this.position.y+block.height*0.5) - this.topOfWave(block.position.x+block.width*0.5);
		}
	} else{
		//Gather blocks
		var objs = game.overlaps(this.bounds());
		this.blocks = new Array();
		for(var i=0; i < objs.length; i++){
			if(objs[i] instanceof Block){
				this.blocks.push(objs[i]);
			}
		}
	}
	
}

Ocean.prototype.topOfWave = function(x){
	x = x + Math.sin(x*this.turbulenceScale)*this.turbulence;
	var wave = x*this.wavelength + game.timeScaled*this.speed;
	var height = (this.height - this.waveheight) + (this.waveheight * 0.5 * (1+Math.sin(wave)));
	return height;
}

Ocean.prototype.render = function(g,c){
	//this.renderold(g,c);
	var corners = this.corners();
	var segwidth = 240;
	var offsetx = -6;
	
	for(var posx = corners.left; posx < corners.right; posx += segwidth){
		offsetx += segwidth;
		if(posx + segwidth > c.x && posx < c.x + game.resolution.x){
			g.renderSprite(
				this.sprite,
				new Point(posx,corners.top).add(new Point(120,120)).subtract(c),
				this.zIndex,
				this.frame,
				this.flip,
				{
					"u_dimensions" : [offsetx,corners.top,segwidth,segwidth],
					"u_color" : [0.5,0.7,0.9,1.0],
					"u_time" : game.timeScaled,
					"u_wavesize" : [this.wavelength, this.waveheight, this.speed],
					"shader" : "water"
				}
			);
		}
	}
}

Ocean.prototype.renderold = function(g,c){
	var start = Math.max(c.x-this.inc, this.position.x-this.width*0.5);
	var end = Math.min(c.x+game.resolution.x+this.inc, this.position.x+this.width*0.5);
	var bottom = this.position.y + this.height*0.5;
	
	start = Math.roundTo(start,this.inc);
	
	//Render wave whites
	g.color = [0.7,0.7,0.7,1.0];
	for(var i=start; i < end; i+=this.inc){
		var height = this.topOfWave(i+4);
		
		g.scaleFillRect(
			i - c.x,
			bottom - height - c.y,
			this.inc,
			height
		);
	}
	
	
	g.color = [0.1,0.4,0.6,1.0];
	for(var i=start; i < end; i+=this.inc){
		var height = this.topOfWave(i);
		
		g.scaleFillRect(
			i - c.x,
			bottom - height - c.y,
			this.inc,
			height
		);
	}
	
	
}

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

class Player extends GameObject{
	constructor(x,y){
		super(x,y);
		this.position.x = x;
		this.position.y = y;
		this.width = 18;
		this.height = 30;
		this.zIndex = 10;
		this.checkpoint = new Point(x,y);
		
		this.keys = [];
		this.spellCursor = 0;
		this.uniqueItems = [];
		this.pause = false;
		
		this.equip_sword = new Item(0,0,0,{"name":"short_sword","enchantChance":0});
		this.equip_shield = new Item(0,0,0,{"name":"small_shield","enchantChance":0});
		
		_player = this;
		this.sprite = "player";
		this.swrap = spriteWrap["player"];
		
		this.lightRadius = false;
		this.grabLedge = true;
		this.downstab = false;
		this.walljump = false;
		this.doubleJump = false;
		this.dodgeFlash = false;
		this.flight = false;
		
		this.states = {
			"duck" : false,
			"guard" : true,
			"stun" : 0.0,
			"start_attack" : false,
			"death_clock" : Game.DELTASECOND,
			"guard_down" : false,
			"attack_charge" : 0,
			"charge_multiplier" : false,
			"stanimaLock" : false,
			"rolling" : 0,
			"dash" : 0.0,
			"dash_direction" : 1,
			"effectTimer" : 0.0,
			"downStab" : false,
			"jump_boost" : false,
			"afterImage" : new Timer(0, Game.DELTASECOND * 0.125),
			"manaRegenTime" : 0.0,
			"againstwall" : 0.0,
			"turn" : 0.0,
			"doubleJumpReady": true,
			"spellCounter" : 0.0,
			"spellCurrent" : undefined,
			"justjumped" : 0.0,
			"ledgePosition" : false,
			"canGrabLedges" : false,
			"damageBuffer" : 0,
			"damageBufferTick" : 0.0,
			"animationProgress" : 0.0
		};
		
		this.attstates = {
			"stats" : WeaponStats["short_sword"],
		
			"currentAttack" : null,
			"currentQueue" : null,
			"currentQueuePosition" : 0,
			"currentQueueState" : null,
			"attackEndTime" : 0.0,
			"hit" : false,
			"charge" : 0.0,
			
			"timer" : 0.0,
			"autostartNextAttack" : false
		};
		
		this.shieldProperties = {
			"duck" : 8.0,
			"stand" : -8.0,
			"frame_row" : 3
		};
		
		
		this.speeds = {
			"baseSpeed" : 10.0,
			"dashTime" : 1.0,
			"baseSpeedMax" : 4.0,
			"dashSpeedMax" : 12.0,
			"inertiaGrounded" : 0.8,
			"inertiaAir" : 0.4,
			"frictionGrounded" : 0.2,
			"frictionAir" : 0.1,
			//"jump" : 9.3,
			"jump" : 7.0,
			"airBoost" : 13,
			"airGlide" : 0.0,
			"breaks": 16,
			"manaRegen" : Game.DELTASECOND * 60,
			"turn" : Game.DELTASECOND * 0.25,
			"charge" : Game.DELTASECOND * 0.4
		};
		
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
			
			for(var i=0; i < game.objects.length; i++ ){
				if(game.objects[i] instanceof GameObject){
					game.objects[i].trigger("player_death");
				}
			}
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
		this.on("blockCollideHorizontal", function(h,block){
			if(this.grabLedge && this.states.canGrabLedges){
				var blockC =  block.corners();
				var blockTop = blockC.top;
				var currentTop = this.position.y - this.grabLedgeHeight;
				var previousTop = currentTop - this.force.y * this.deltaPrevious;
				
				if(currentTop >= blockTop && previousTop < blockTop){
					this.states.ledgePosition = block;
					this.gravity = this.force.x = this.force.y = 0;
					
					if(h > 0){
						this.position.x = blockC.left - this.width * this.origin.x - 1;
					} else {
						this.position.x = blockC.right + this.width * this.origin.x + 1;
					}
				}
			}
		});
		this.on("collideHorizontal", function(h){
			this.states.againstwall = (h>0?1:-1) * Game.DELTASECOND * 0.1;
		});
		this.on("collideVertical", function(v){
			if(v>0) this.knockedout = false;
			if(v>0){
				this.states.ledgePosition = false;
			}
		});
		this.on("block", function(obj,strike_rect,damage){
			if( this.team == obj.team ) return;
			if( this.invincible > 0 ) return;
			
			//blocked
			var dir = this.position.subtract(obj.position);
			var kb = damage / 3.0;
			
			if( "knockbackScale" in obj ) kb *= obj.knockbackScale;
			
			//obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
			this.force.x += (dir.x < 0 ? -kb : kb) * this.delta;
			audio.playLock("block",0.1);
			
			var effect = new EffectBlock(this.position.x+18*this.forward(), strike_rect.center().y);
			effect.flip = this.flip;
			game.addObject(effect);
		});
		this.on("blocked", function(obj){
			if(obj.hasModule(mod_combat)){
				//Calculate fire damage through shield
				let fireDamage = Math.round(this.perks.fireDamage * 100);
				fireDamage = Math.max( fireDamage - obj.defenceFire, 0);
				
				obj.life -= fireDamage;
				obj.displayDamage(fireDamage);
				obj.isDead();
				
				if(this.attstates.currentQueueState == Weapon.STATE_DOWNATTACK){
					this.trigger("downstabTarget", obj, 0);
				}
			}
		});
		this.on("hurt", function(obj, damage){
			//this.states.ledge = null;
			
			var str = Math.min(Math.max(Math.round(damage*0.25),1),6);
			var dir = this.position.subtract(obj.position);
			
			shakeCamera(Game.DELTASECOND*0.5,str);
			
			this.cancelAttack(this);
			this.attstates.charge = 0.0;
			this.states.ledgePosition = false;
			
			var effect = new EffectHurt(this.position.x, this.position.y);
			var direction = obj.position.subtract(this.position);
			effect.intensity = 0.6 + Math.min(0.32 * (damage/24),0.32);
			effect.rotation = (Math.atan2(direction.y,direction.x)/Math.PI)*180;
			game.addObject(effect);
			
			var knockback = this.grounded ? 7 : 3;
			if(dir.x < 0){
				this.force.x = -knockback;
			}else{
				this.force.x = knockback;
			}
			if(this.stun_time > 0 ){
				this.states.spellCounter = 0.0;
				this.stun = this.stun_time * Math.max(1 - this.perks.painImmune, 0);
				game.slow(0,Game.DELTAFRAME30);
			}
			if( this.perks.thorns > 0 && obj.hurt instanceof Function){
				obj.hurt(this,Math.floor(damage * this.perks.thorns));
			}
			if(this.life > 0 && damage >= this.life){
				audio.play("deathwarning");
			}
			Background.flash = [0.6,0,0,1];
			audio.play("playerhurt");
		});
		/*
		this.on("struckTarget", function(obj, pos, damage){
			if( this.states.downStab && obj.hasModule(mod_combat)){
				this.states.downStab = false;
				this.force.y = -2;
				this.jump();
				this.doubleJumpReady = true;
			}
		})*/;
		this.on("break_tile", function(obj, damage){
			if(this.attstates.currentQueueState == Weapon.STATE_DOWNATTACK){
				this.trigger("downstabTarget", obj, damage);
				obj.trigger("downstabbed", this, damage);
			}
		});
		this.on("hurt_other", function(obj, damage){
			var ls = Math.min(this.perks.lifeSteal, 1.0);
			this.lifeStealCarry += Math.max(Math.min(damage * ls, obj.life),0);
			this.life = Math.min( this.life + Math.floor(this.lifeStealCarry), this.lifeMax );
			this.lifeStealCarry -= Math.floor(this.lifeStealCarry);
			
			if(this.attstates.currentAttack){
				this.attstates.attackEndTime = this.attstates.currentAttack.time + this.attstates.currentAttack.rest;
				this.attstates.hit = true;
				this.hitIgnoreList.push(obj);
				
				if("pause" in this.attstates.currentAttack){
					game.slow(0.0, this.attstates.currentAttack.pause);
				}
				if("shake" in this.attstates.currentAttack){
					shakeCamera(Game.DELTASECOND*0.25, this.attstates.currentAttack.shake);
				}
				if("stun" in this.attstates.currentAttack){
					obj.stun = this.attstates.currentAttack.stun;
					if(!this.grounded && obj.life > 0 && obj.hasModule(mod_rigidbody)){
						obj.airtime = this.attstates.currentAttack.stun * this.perks.attackairboost;
					}
				}
				if("knockback" in this.attstates.currentAttack && obj.hasModule(mod_rigidbody)){
					var scale = 1.0 / Math.max(obj.mass, 1.0);
					var knock = new Point(this.forward() * this.attstates.currentAttack.knockback.x, this.attstates.currentAttack.knockback.y).scale(scale);
					obj.force.x += knock.x;
					obj.force.y += knock.y;
				}
				
			}
			
			if( "life" in obj && obj.life <= 0 ) {
				//Glow after a kill
				this.states.afterImage.set(Game.DELTASECOND * 3);
			}
			
			if(this.states.roll > 0){
				this.states.doubleJumpReady = true;
			} else if(this.attstates.currentQueueState == Weapon.STATE_DOWNATTACK){
				this.states.downStab = false;
				this.trigger("downstabTarget", obj, damage);
				obj.trigger("downstabbed", this, damage);
			} else {
				if( !this.grounded ) {
					//Add extra float
					this.force.y -= this.speeds.jump * this.speeds.airGlide;
				}
			}
			
			//Charge kill explosion!
			if( this.attstates.currentQueueState == Weapon.STATE_CHARGED ){
				//A little shake
				shakeCamera(Game.DELTASECOND*0.3,5);
				
				if( obj.ragdoll ) {
					//Send the enemy flying
					var dir = obj.position.add(new Point(0,-2)).subtract(this.position);
					var aim = dir.normalize().add(new Point(dir.x>0?1:-1,0));
					game.slow(0.1, Game.DELTASECOND * 0.5);
					audio.playLock("explode3", 0.5);
					obj.trigger("death");
					game.addObject( new ExplodingEnemy( 
						obj.position.x,
						this.position.y,
						false,
						{
							"direction" : aim,
							"damage" : this.currentDamage(),
							"sprite" : obj.sprite,
							"flip" : obj.flip,
							"frame" : obj.frame
						}
					));
				}
			}
		});
		this.on("downstabTarget", function(obj, damage){
			this.jump();
			this.force.y -= 4;
			this.states.doubleJumpReady = true;
		});
		this.on("added", function(){
			this.states.damageBuffer = 0;
			this.lock_overwrite = false;
			this.force.x = this.force.y = 0.0;
			this.states.doubleJumpReady = true;
			
			this.stun = this.invincible = 0.0;
			
			game.camera.x = this.position.x-128;
			game.camera.y = Math.floor(this.position.y/240)*240;
			
			PauseMenu.pushIcon(this.mapIcon);
			
			Checkpoint.saveState(this);
		});
		this.on("collideObject", function(obj){
			if( this.states.rolling && this.dodgeFlash){
				if("hurt" in obj && obj.hurt instanceof Function){
					var damage = this.baseDamage();
					obj.hurt(this, damage);
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
		
		
		this.spells = [
		];
		
		this.shieldSlots = [
		
		];
		
		this.baseStats = {
			"attack" : 9,
			"defence" : 0,
			"magic" : 3
		};
		this.stats = {
			"attack" : 9,
			"defence" : 0,
			"magic" : 3
		};
		
		this.perks = {
			"attackairboost" : 0.0,
			"fireDamage" : 0.0,
			"lifeSteal" : 0.0,
			"bonusMoney" : 0.0,
			"painImmune" : 0.0,
			"thorns" : 0.0,
			"slowWound": 0.0,
			"attackSpeed": 0.0,
			"manaRegen" : 0.0,
			"poisonResist" : 0.0
		}
		
		this.gravity = 1;
		this.life = 24;
		this.lifeMax = 24;
		this.mana = 24;
		this.manaMax = 24;
		this.stanimaBase = Game.DELTASECOND * 0.5;
		this.stanima = this.stanimaBase;
		this.stanimaMax = this.stanimaBase;
		this.stanimaRestore = 0.2;
		this.money = 0;
		this.heal = 0;
		this.healMana = 0;
		this.damage = 5;
		this.team = 1;
		this.mass = 1;
		this.lifeStealCarry = 0.0;
		this.stun_time = Game.DELTASECOND * 0.33333333;
		this.death_time = Game.DELTASECOND * 2;
		this.invincible_time = Game.DELTASECOND * 1.5;
		this.autoblock = true;
		this.rollTime = Game.DELTASECOND * 0.5;
		this.dodgeTime = this.rollTime * 0.6;
		this.grabLedgeHeight = 12;
		
		this.mapIcon = new MapIcon(this.position.x, this.position.y);
		this.mapIcon.bobSpeed = 0.05;
		
		
		this.combatFinalDamage = function(d){
			if(this.perks.slowWound > 0){
				this.states.damageBuffer += d;
			} else {
				this.life -= d;
			}
		}
		
		this.superGetDamage = this.getDamage;
		this.getDamage = function(){
			var damage = this.superGetDamage();
			if(this.attstates.currentAttack) {
				damage.physical *= this.attstates.currentAttack["damage"];
			}
			return damage;
		}
		
		//Stats
		this.stat_points = 0;
		this.experience = 0;
		this.level = 1;
		this.nextLevel = 0;
		this.prevLevel = 0;
		
		
		this.equip(this.equip_sword, this.equip_shield);
		
		this.spellsCounters = {
			"magic_strength" : 0,
			"haste" : 0,
			"magic_sword" : 0,
			"magic_armour" : 0,
			"invincibility" : 0,
			"feather_foot" : 0,
			"thorns" : 0,
			"magic_song" : 0
		};
	}
	update(){
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
		this.states.canGrabLedges = false;
		
		//this.states.manaRegenTime = Math.min(this.states.manaRegenTime-this.delta, this.speeds.manaRegen);
		this.states.manaRegenTime -= this.delta * (1 + this.perks.manaRegen);
		if(this.states.manaRegenTime <= 0){
			this.mana = Math.min(this.mana + 1,this.manaMax );
			this.states.manaRegenTime = this.speeds.manaRegen - this.states.manaRegenTime;
		}
		if( this.manaHeal > 0 ){
			this.mana = Math.min(this.mana + 1, this.manaMax);
			this.manaHeal-= 1;
			if( this.mana >= this.manaMax ) this.manaHeal = 0;
		}
		if( this.heal > 0 ){
			audio.play("heal");
			this.life += 1;
			this.heal -= 1;
			this.states.damageBuffer = 0;
			game.slow(0.0,Game.DELTAFRAME30 * 4.0);
			if( this.life >= this.lifeMax ){
				this.heal = 0;
				this.life = this.lifeMax;
			}
		} else if(this.states.damageBuffer > 0){
			if(this.states.damageBufferTick <= 0){
				this.life--;
				this.states.damageBuffer--;
				this.isDead();
				this.states.damageBufferTick = Game.DELTASECOND * this.perks.slowWound;
			} else{
				this.states.damageBufferTick -= this.delta;
			}
		}
		
		if ( this.life > 0 ) {
			var strafe = input.state('block') > 0;
			
			//Update attack animation
			if(this.attstates.currentAttack){
				this.attstates.timer += this.delta * (1.0 + this.perks.attackSpeed);
				
				if(Timer.isAt(this.attstates.timer,0,this.delta)){
					if("force" in this.attstates.currentAttack){
						this.force.x += this.attstates.currentAttack.force.x * this.forward();
						this.force.y += this.attstates.currentAttack.force.y;
					}
					if("audio" in this.attstates.currentAttack){
						audio.play(this.attstates.currentAttack.audio);
					} else {
						audio.play("swing");
					}
				}
				
				if(this.attstates.timer >= this.attstates.attackEndTime){
					if(this.attstates.autostartNextAttack){
						this.attack();
						this.attstates.autostartNextAttack = false;
					} else {
						//No more attacks, end queue
						this.cancelAttack();
					}
					
				}
			}
			
			if (this.stun > 0 ){
				//Do nothing, just wait to recover
				this.frame.x = 10; this.frame.y = 1;
			} else if (this.states.spellCounter > 0){
				this.states.spellCounter -= this.delta;
				this.frame = this.swrap.frame("spell", 0);
				
				if(this.states.spellCurrent instanceof SpellFire){
					this.states.spellCounter -= game.deltaUnscaled;
					game.slow(0.0,0.02);
				}
				if(this.states.spellCurrent instanceof SpellBolt){
					//Allow movement
					this.move(input.state('left') > 0 ? -1 : (input.state('right') > 0 ? 1 : 0) );
					if ( input.state('jump') == 1 ) { this.jump(); }
				}
				if(this.states.spellCurrent instanceof SpellFlash){
					//Float about
					this.force.y -= (this.gravity+0.05) * self.unitsPerMeter * this.delta;
					let spell = this.states.spellCurrent;
					if(spell.manaCost <= this.mana && this.states.spellCounter <= 0 && input.state('spell')){
						this.castSpell();
						this.states.spellCounter = this.states.spellCurrent.castTime;
					}
				}
				
				if(this.states.spellCounter <= 0){
					//Cast Spell
					this.castSpell();
				}
			} else if( this.states.ledgePosition ) {
				//Holding onto a ledge
				this.frame = this.swrap.frame("grab", 0);
				this.force.x = 0;
				this.force.y = this.gravity * -self.unitsPerMeter * this.delta;
				
				if(this.states.ledgePosition instanceof GameObject && this.states.ledgePosition.hasModule(mod_block)){
					this.position = this.position.add(this.states.ledgePosition.blockChange);
				}
				if(this.delta > 0){
					if(input.state("jump") == 1){
						this.jump();
						this.states.ledgePosition = false;
					} else if(input.state("down") > 0){
						this.states.ledgePosition = false;
					} else if(this.isStuck){
						this.states.ledgePosition = false;
					}
				}
			} else if(input.state("fire") == 1 && input.state("dodge") > 0){
				//Charge attack
				this.attstates.charge = 1;
				this.attack(this); 
				//this.stanima = Math.max(this.stanima - this.stanimaBase, 0);
				this.attstates.charge = 0;
			
			} else if( this.attstates.timer > 0 ){
				//Player in attack animation
				
				if(this.attstates.currentAttack){
					var attackMovementSpeed = this.speeds.baseSpeed * this.delta * this.attstates.currentAttack.movement;
					var attackProgress = (this.attstates.timer) / this.attstates.currentAttack.time;
					
					let attackName = "attack" + (this.attstates.currentAttack.animation);
					this.frame = this.swrap.frame(attackName, attackProgress);
					
					if ( input.state('left') > 0 ) { this.force.x -= attackMovementSpeed; }
					if ( input.state('right') > 0 ) { this.force.x += attackMovementSpeed; }
					
				}
				
				if ( input.state('fire') == 1 ) { 
					//Let the player queue more attacks
					this.attack(this); 
				}
			} else if( this.delta > 0) {
				//Player is in move/idle state
				
				this.states.guard = ( input.state('block') > 0 || this.autoblock );
				
				if(input.state("select") == 1 && this.spells.length > 0){
					audio.play("equip");
					this.spellCursor = (this.spellCursor+1)%this.spells.length;
				}
				
				//Move
				if( !this.states.duck ) {
					this.move(input.state('left') > 0 ? -1 : (input.state('right') > 0 ? 1 : 0) );
				} else {
					this.states.turn = 0.0;
				}
				
				if(this.states.turn > 0){
					//Block disabled while turning
					this.states.guard = false;
				}
				
				this.states.canGrabLedges = true;
				if(this.grabLedge && this.states.againstwall && input.state('down') < 1 && !this.grounded && this.force.y > 0){
					//Detect edge
					if(this.testLedgeTiles()){
						this.states.ledgePosition = new Point(
							Math.floor(this.position.x/16) * 16,
							Math.floor(this.position.y/16) * 16
						);
						this.position.y = 12 + Math.floor(this.position.y/16) * 16;
						/*
						this.position = new Point(
							this.states.ledgePosition.x + (this.flip?17+halfwidth:-halfwidth-1),
							this.states.ledgePosition.y + this.grabLedgeHeight
						);
						*/
						this.force.x = this.force.y = 0;
					}
				}
				
				//Cast Spell
				if ( input.state('spell') == 1 ) { 
					if(this.spells.length > 0){
						var spell = this.spells[this.spellCursor];
						if(spell.canCast(this) && this.mana > spell.manaCost){
							this.states.spellCurrent = spell;
							this.states.spellCounter = spell.castTime;
						} else {
							audio.play("negative");
						}
					}
				}
				
				//Attack and start combo
				if ( input.state('fire') == 1 ) { 
					this.attack(this); 
				}
				
				//Apply jump boost
				if ( input.state('jump') > 0 && !this.grounded ) { 
					if( this.force.y > 0 ) {
						this.force.y -= this.speeds.airBoost * this.speeds.airGlide * this.delta;
					}
				
					if( this.states.jump_boost ) {
						this.force.y -= this.gravity * this.speeds.airBoost * this.delta; 
					}
				} else {
					this.states.jump_boost = false;
					this.airtime = 0.0;
				}
				
				//Jump?
				if ( input.state('block') <= 0 && input.state('jump') == 1 ) { 
					if(this.grounded || (this.states.doubleJumpReady && this.doubleJump) || (this.states.againstwall && this.walljump)){
						this.jump(); 
					}
				}
				
				//Duck?
				if ( input.state('up') == 0 && input.state('down') > 0 && this.grounded ) { 
					this.duck(); 
				} else { 
					this.stand(); 
				}
				
				//Conditional actions
				if(this.states.dash <= 0){
					//Change to face player's selected direction
					if ( input.state('left') > 0 ) { 
						if(!this.flip) { this.states.turn = this.speeds.turn; }
						this.flip = true; 
					}
					if ( input.state('right') > 0 ) { 
						if(this.flip) { this.states.turn = this.speeds.turn; }
						this.flip = false;
					}
					
					if(this.walljump && !this.grounded && this.states.againstwall){
						//Wall slide
						if(input.state("down") <= 0){
							
							this.frame.x = 7; this.frame.y = 6;
							if(this.force.y > 0){
								this.force.y = Math.min(this.force.y, 4);
							}
						}
					} else if(this.states.duck){
						this.frame = this.swrap.frame("duck", 0);
					} else if(this.grounded && input.state("dodge") == 1){
						//DASH LIKE A FIEND!
						if(input.state("left") > 0 || input.state("right") > 0){
							this.states.dash_direction = this.forward();
							this.states.dash = this.speeds.dashTime;
							this.force.x = this.states.dash_direction * this.speeds.dashSpeedMax;
							audio.play("dash");
						}
					} else if(this.states.turn > 0){
						this.force.x = this.force.x * (1.0 - this.speeds.breaks * this.delta);
						let tProg = 1 - (this.states.turn / this.speeds.turn);
						this.frame = this.swrap.frame("turn", tProg);
					} else if(!this.grounded){
						this.frame.x = 7;
						if(this.force.y < -0.5){ this.frame.x = 6; }
						if(this.force.y > 0.5){ this.frame.x = 8; }
						this.frame.y = 2;
					} else if(Math.abs(this.force.x) < 1.0){
						//Idle
						this.states.animationProgress = (this.states.animationProgress + this.delta * 0.67) % 1;
						this.frame = this.swrap.frame("idle", this.states.animationProgress);
					} else {
						//Running
						this.states.animationProgress = (this.states.animationProgress + this.delta * Math.abs(this.force.x) * 0.32) % 1;
						this.frame = this.swrap.frame("run", this.states.animationProgress);
					}
					
				} else {
					//Player is dashing
					let dProg = 1 - this.states.dash / this.speeds.dashTime;
					let stopPoint = 1 / (this.speeds.dashSpeedMax / this.speeds.baseSpeedMax);
					
					this.frame = this.swrap.frame("dash", dProg);
					if(dProg < stopPoint){
						this.force.x = this.states.dash_direction * this.speeds.dashSpeedMax;
					} else {
						this.force.x = 0.0;
					}
					this.states.guard = false;
				}
				
				/*
				//Prep roll
				this.states.rollPressCounter -= this.delta;
				if( input.state('left') == 1 || input.state('right') == 1 ){
					this.states.rollDirection = 1.0;
					this.states.rollPressCounter = Game.DELTASECOND * 0.25;
					if( input.state('left') ) this.states.rollDirection = -1.0;
				}
				*/
			}
			
			this.states.doubleJumpReady = this.states.doubleJumpReady || this.grounded;
			this.friction = this.grounded ? this.speeds.frictionGrounded : this.speeds.frictionAir;
			this.inertia = this.grounded ? this.speeds.inertiaGrounded : this.speeds.inertiaAir;
			this.height = this.states.duck ? 24 : 30;
		}
		//Shield
		this.states.guard_down = this.states.duck;
		this.guard.active = this.states.guard;
		this.guard.y = this.states.guard_down ? this.shieldProperties.duck : this.shieldProperties.stand;
		
		//Update animations
		//this.animationUpdate();
		
		//Timers
		this.states.stanimaLock = this.states.stanimaLock && this.stanima < this.stanimaMax;
		if(!this.states.rolling){
			this.stanima = Math.min(this.stanima + this.delta * this.stanimaRestore, this.stanimaMax);
		}
		
		this.mapIcon.position.x = this.position.x;
		this.mapIcon.position.y = this.position.y;
		
		this.states.justjumped -= this.delta;
		for(var i in this.spellsCounters ) {
			this.spellsCounters[i] -= this.delta;
		}
		this.states.effectTimer += this.delta;
		this.states.turn -= this.delta;
		
		
		if(this.states.dash > 0){
			if(input.state("left") == 0 && input.state("right") == 0){
				this.states.dash = 0.0;
			}
			if(Math.abs(this.force.x) < 0.2) {
				this.states.dash = 0.0;
			}
			this.states.dash = Math.max(this.states.dash - this.delta, 0.0);
		}
		
		if(Math.abs(this.states.againstwall) <= this.delta){
			this.states.againstwall = 0;
		} else {
			this.states.againstwall -= (this.states.againstwall>0?1:-1) * this.delta;
		}
		
		if( this.states.afterImage.status(this.delta) ){
			game.addObject( new EffectAfterImage(this.position.x, this.position.y, this) );
		}
		
		this._prevPosition = this.position.scale(1);
	}
	move(direction){
		if ( direction < 0 ) { this.force.x -= this.speeds.baseSpeed * this.delta; }
		if ( direction > 0 ) { this.force.x += this.speeds.baseSpeed * this.delta; }
		if ( direction == 0 ) { this.force.x = this.force.x * (1.0 - this.speeds.breaks * this.delta); }
		this.force.x = Math.clamp(this.force.x, -this.speeds.baseSpeedMax, this.speeds.baseSpeedMax);
	}
	idle(){}
	testLedgeTiles(){
		let ts = 16;
		let tpoint = 0;
		let currentTop = this.position.y - (tpoint + this.height * this.origin.y);
		let prevTop = this._prevPosition.y - (tpoint + this.height * this.origin.y);
		
		if(Math.floor(currentTop/ts) != Math.floor(prevTop/ts)){
			let testPosition = this._prevPosition.subtract(new Point(0, this.height * this.origin.y))
			//You must have passed through a vertical tile threshold
			
			//getTileRule
			//tilerules.ignore
			
			let tBelow = game.getTileRule(testPosition.add(new Point(0, ts*2)));
			let tHole = game.getTileRule(testPosition.add(new Point(this.forward() * ts, 0)));
			let tLedge = game.getTileRule(testPosition.add(new Point(this.forward() * ts, ts)));
			let tFeetRest = game.getTileRule(testPosition.add(new Point(this.forward() * ts, ts*2)));
			
			if(tBelow == tilerules.ignore && tHole == tilerules.ignore && tLedge != tilerules.ignore){
				console.log("Grab!");
				return true;
			}
		}
		return false;
		
	}
	stand(){
		if( this.states.duck ) {
			this.position.y -= 4;
			this.states.duck = false;
		}
	}
	duck(){
		this.force.x = 0.0;
		this.states.dash = 0.0;
		if( !this.states.duck ) {
			this.position.y += 3.0;
			this.states.duck = true;
		}
	}
	jump(){ 
		var force = this.speeds.jump * this.gravity;
		
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
			this.states.doubleJumpReady = false;
			
			if(this.walljump && this.states.againstwall){
				force *= 1.2;
				this.force.x = (this.states.againstwall>0?-1:1) * 3;
			}
		}
		
		
		if( this.spellsCounters.flight > 0 ) force = 2;
		
		this.states.justjumped = Game.DELTASECOND * 0.2;
		this.states.dash = 0;
		this.force.y = -force; 
		this.grounded = false; 
		this.states.jump_boost = true; 
		this.stand(); 
		audio.play("jump");
	}
	attack(){
		//Player has pressed the attack button or an attack has been queued
		
		if(this.attstates.currentQueue){
			//Chain up next attack
			if(this.attstates.timer >= this.attstates.attackEndTime){
				//Previous attack complete, start next attack
				var state = Weapon.playerState(this);
				this.attstates.hit = false;
				if(this.attstates.currentQueueState == state && this.attstates.currentQueuePosition+1 < this.attstates.currentQueue.length){
					this.attstates.currentQueuePosition++;
					
					this.hitIgnoreList = new Array();
					this.attstates.currentAttack = this.attstates.currentQueue[this.attstates.currentQueuePosition];
					this.attstates.timer = -this.attstates.currentAttack["warm"];
					this.attstates.attackEndTime = this.attstates.currentAttack["miss"] + this.attstates.currentAttack["time"];
					
					if("airtime" in this.attstates.currentAttack){
						this.force.y = 0;
						this.airtime = this.attstates.currentAttack["airtime"];
					} else if(!this.grounded){
						this.airtime = this.attstates.attackEndTime * this.perks.attackairboost;
					}
					
					return;
				} else {
					this.cancelAttack();
					return;
				}
			} else {
				if(this.attstates.hit || this.attstates.currentQueue.alwaysqueue){
					this.attstates.autostartNextAttack = true;
				}
				return;
			}
		}
		
		//Start new queue
		var state = Weapon.playerState(this);
		
		this.hitIgnoreList = new Array();
		this.attstates.currentQueuePosition = 0;
		this.attstates.currentQueueState = state;
		this.attstates.currentQueue = this.equip_sword.stats[this.attstates.currentQueueState];
		this.attstates.currentAttack = this.attstates.currentQueue[this.attstates.currentQueuePosition];
		
		//Attack ends after the attack + miss
		this.attstates.timer = -this.attstates.currentAttack["warm"]
		this.attstates.attackEndTime = this.attstates.currentAttack["miss"] + this.attstates.currentAttack["time"];
		
		if("airtime" in this.attstates.currentAttack){
			this.force.y = 0;
			this.airtime = this.attstates.currentAttack["airtime"];
		} else if(!this.grounded){
			this.airtime = this.attstates.attackEndTime * this.perks.attackairboost;
		}
	}
	cancelAttack(){
		this.attstates.currentAttack = null;
		this.attstates.currentQueue = null;
		this.attstates.currentQueuePosition = 0;
		this.attstates.currentQueueState = null;
		this.hitIgnoreList = new Array();
		this.attstates.hit = false;
		
		this.attstates.timer = 0.0;
	}
	baseDamage(){
		return Math.round(8 + this.stats.attack * this.equip_sword.stats.damage);
	}
	currentDamage(){
		if(this.attstates.currentAttack) {
			return Math.round(this.baseDamage() * this.attstates.currentAttack["damage"]);
		} else {
			return this.baseDamage();
		}
	}
	castSpell(name){
		var spell = this.states.spellCurrent;
		if(spell instanceof Spell){
			if(spell.manaCost <= this.mana ){
				spell.use(this);
				this.mana = Math.max(this.mana - spell.manaCost, 0);
			}
		}
	}

	equipSpell(s){
		this.spellCursor = this.spells.length;
		this.spells.push(s);
		
		s.trigger("equip");
	}
	equipCharm(c){
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
	equip(sword, shield){
		try {
			
			sword = sword || this.equip_sword;
			shield = shield || this.equip_shield;
			
			//Shields
			if(this instanceof Player){
				if( sword != null){
					NPC.set(sword.name, 1);
				}
				if( shield != null) {
					if( "stats" in shield){
						NPC.set(shield.name, 1);
						
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
			}
			
			this.equip_sword = sword;
			this.equip_shield = shield;
			
			//Set stats to base
			this.stats.attack = this.baseStats.attack;
			this.stats.defence = this.baseStats.defence;
			this.stats.magic = this.baseStats.magic;
			this.defencePhysical = 0;
			this.defenceFire = 0;
			this.defenceSlime = 0;
			this.defenceIce = 0;
			this.defenceLight = 0;
			this.damage = 0;
			this.damageFire = 0;
			this.damageSlime = 0;
			this.damageIce = 0;
			this.damageLight = 0;
			for(var i in this.perks){
				this.perks[i] = 0.0;
			}
			
			this.equip_sword.stats.onEquip(this);
			
			if(this.equip_shield != null){
				for(var i=0; i < this.equip_shield.slots.length; i++){
					if(this.shieldSlots[i] instanceof Spell){
						var slotType = Math.floor(this.equip_shield.slots[i] / 3);
						var slotPower = Math.floor(this.equip_shield.slots[i] % 3);
						this.shieldSlots[i].modifyStats(this, slotType, slotPower);
					}
				}
			}
			
			this.defencePhysical += Math.floor(this.stats.defence);
			this.defenceFire += Math.floor(this.stats.defence * 0.2);
			this.defenceSlime += Math.floor(this.stats.defence * 0.7);
			this.defenceIce += Math.floor(this.stats.defence * 0.6);
			this.defenceLight += Math.floor(this.stats.defence * 0.0);
			
			this.damage = Math.floor(this.damage + this.stats.attack * this.equip_sword.stats.damage);
			
			if(this instanceof Player){
				this.speeds.manaRegen = Game.DELTASECOND * (10 - this.stats.magic * (9/19));
			}
			
		} catch(e) {
			this.equip( this.equip_sword, this.equip_shield );
		}
	}
	hasEquipment(name){
		for(var i=0; i < this.equipment.length; i++ ){
			if( this.equipment[i].name == name ) return true;
		}
		return false
	}
	addMoney(value){
		this.money += value;
		if( false ){ //money pick up heals
			this.life = Math.min( this.life + value*2, this.lifeMax );
		}
		this.trigger("money", value);
	}
	respawn(g,c){
		this.life = this.lifeMax;
		this.mana = this.manaMax;
		this.interactive = true;
		this.lock_overwrite = false;
		this.hurtByDamageTriggers = true;
		
		Checkpoint.loadState(this);
		
		game.addObject(this);
		
		game.pause = false;
		PauseMenu.open = false; 
	}
	toJson(){
		var out = {};
		out.life = this.life;
		out.lifeMax = this.lifeMax;
		out.mana = this.mana;
		out.manaMax = this.manaMax;
		out.stanimaMax = this.stanimaMax;
		out.money = this.money;
		
		out.lightRadius = this.lightRadius;
		out.downstab = this.downstab;
		out.walljump = this.walljump;
		out.doubleJump = this.doubleJump;
		out.dodgeFlash = this.dodgeFlash;
		
		out.weapon = false;
		out.shield = false;
		
		out.stats = {};
		out.spells = new Array();
		out.slots = new Array();
		
		if(this.equip_sword instanceof Item){
			out.weapon = this.equip_sword.name;
		}
		if(this.equip_shield instanceof Item){
			out.shield = this.equip_shield.name;
		}
		
		for(var i=0; i < this.spells.length; i++){
			out.spells[i] = {"name" : this.spells[i].objectName, "level" : this.spells[i].level};
		}
		
		for(var i=0; i < this.shieldSlots.length; i++){
			out.slots[i] = this.spells.indexOf(this.shieldSlots[i]);
		}
		
		for(var i in this.baseStats){
			out.stats[i] = this.baseStats[i];
		}
		return out;
	}
	fromJson(data){
		this.life = data.life;
		this.lifeMax = data.lifeMax;
		this.mana = data.mana;
		this.manaMax = data.manaMax;
		this.stanimaMax = data.stanimaMax;
		this.money = data.money;
		this.baseStats = data.stats;
		
		this.lightRadius = data.lightRadius;
		this.downstab = data.downstab;
		this.walljump = data.walljump;
		this.doubleJump = data.doubleJump;
		this.dodgeFlash = data.dodgeFlash;
		
		if(data.weapon){
			this.equip_sword = new Item(0,0,0,{"name" : data.weapon});
		}
		if(data.shield){
			this.equip_shield = new Item(0,0,0,{"name" : data.shield});
		}
		for(var i=0; i < data.spells.length; i++){
			var spell = new self[data.spells[i].name];
			spell.level = data.spells[i].level;
			this.spells.push(spell);
		}
		for(var i=0; i < data.slots.length; i++){
			this.shieldSlots[i] = this.spells[data.slots[i]];
		}
		
		this.equip();
	}

	render(g,c){
		//Render player
		
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
		//When rolling, ignore flip and shader
		if(this.dodgeFlash && this.states.rolling){
			var flashLength = Math.max(1 - this.states.roll/this.dodgeTime,0) * 96;
			g.color = [1,1,1,1];
			g.scaleFillRect(
				(this.position.x - (this.flip?0:flashLength)) - c.x,
				(this.position.y - 6) - c.y,
				flashLength,
				12
			);
		}
		
		if( this.spellsCounters.thorns > 0 ){
			g.renderSprite("magic_effects",this.position.subtract(c),this.zIndex, new Point(3, 0), this.flip);
		}
		//Render current sword
		if(!this.states.rolling){
				this.renderWeapon(g,c);
				this.renderShield(g,c);
		}
	}
	renderWeapon(g,c,ops={},eops={}){
		try{
			let rangeScale = this.equip_sword.stats.range / 70;
			let meshScale = 0.1;
			let attackProgress = 0;
			
			if(this.attstates.currentAttack){
				attackProgress = (this.attstates.timer) / this.attstates.currentAttack.time;
			}
			
			let _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
			let rotation = _t.r;
			let sposition = _t.p;
			let zPlus = _t.z;
			let effect = _t.v;
			let shield = _t.s;
			
			if(this.flip){
				sposition = new Point(sposition.x*-1,sposition.y);
			}
			ops["rotate"] = (this.flip ? -1 : 1) * rotation;
			
			g.renderSprite("swordtest", this.position.subtract(c).add(sposition), this.zIndex+zPlus, this.equip_sword.equipframe, false, ops);
			if(attackProgress > 0){
				//eops["rotate"] = effect.r;
				//let effectFrame = new Point(effect.x, effect.y);
				//let spriteName = effect.s;
				
				//g.renderSprite(spriteName, this.position.subtract(c), this.zIndex+2, effectFrame, this.flip, eops);
				let attackMeshName = this.attstates.currentAttack.mesh;
				
				g.renderMesh(attackMeshName, this.position.subtract(c), this.zIndex+2, {
					scale : [
						rangeScale * meshScale,
						meshScale,
						meshScale
					],
					flip : this.flip,
					u_time : attackProgress,
					u_color : this.equip_sword.stats.color1,
					u_color2 : this.equip_sword.stats.color2
				});
			}
		} catch (e){
			//console.warn("Render weapon: "+e);
		}
	}
	renderShield(g,c,ops){
		try{
			var _t = playerSwordPosition[Math.floor(this.frame.y)][Math.floor(this.frame.x)];
			var shield = _t.s;
			
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
					shieldFlip,
					ops
				);
			}
		} catch(e){
		}
	}

	hudrender(g,c){
		/* Render HP */
		Player.renderLifebar(g,new Point(8,8),this.life, this.lifeMax, this.states.damageBuffer);
		
		/* Render Mana */
		Player.renderManabar(g,new Point(8,20),this.mana, this.manaMax);
		
		/* Render stanima */
		var stanimaLength = Math.floor( (this.stanimaMax / this.stanimaBase) * 24 );
		var stanimaRemain = Math.floor( (this.stanima / this.stanimaBase) * 24 );
		g.color = [1.0,1.0,1.0,1.0];
		g.scaleFillRect(7,25,stanimaLength+2,4);
		g.color = [0.0,0.0,0.0,1.0];
		g.scaleFillRect(8,26,stanimaLength,2);
		g.color = this.states.stanimaLock ? [0.7,0.2,0.2,1.0] : [1.0,1.0,1.0,1.0];
		g.scaleFillRect(8,26,stanimaRemain,2);
		
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
			var spellXOff = spell.stock >= 10 ? -8 : -3;
			spell.render(g, new Point(item_pos,15));
			//textArea(g,""+spell.stock,item_pos+spellXOff,24);
			item_pos += 20;
		}
		
		//Create light
		if(this.lightRadius){
			Background.pushLight( this.position, 240 );
		} else {
			Background.pushLight( this.position, 56, [0.25,0.15,0.1,1.0] );
		}
	}
	animtest(){
		if(input.state("up")==1)this.frame.y--;
		if(input.state("down")==1)this.frame.y++;
		if(input.state("left")==1)this.frame.x--;
		if(input.state("right")==1)this.frame.x++;
	}
}
Player.renderLifebar = function(g,c, life, max, buffer){
	/* Render HP */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(c.x-1,c.y-1,(max)+2,10);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,max,8);
	g.color = [1.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,Math.max(life,0),8);
	
	/* Render Buffered Damage */
	if(life > 0){
		g.color = [0.65,0.0625,0.0,1.0];
		g.scaleFillRect(
			Math.max(life,0)+c.y,
			c.y,
			-Math.min(buffer,life),
			8
		);
	}
}
Player.renderManabar = function(g,c, mana, max){
	/* Render Mana */
	g.color = [1.0,1.0,1.0,1.0];
	g.scaleFillRect(c.x-1,c.y-1,max+2,4);
	g.color = [0.0,0.0,0.0,1.0];
	g.scaleFillRect(c.x,c.y,max,2);
	g.color = [0.23,0.73,0.98,1.0];
	g.scaleFillRect(c.x,c.y,mana,2);
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
			0 : {p:new Point(-14,0),r:-80,z:1,v:{x:0,y:0,r:0,s:"swordeffect"}},
			1 : {p:new Point(16,-6),r:70,z:1,v:{x:1,y:0,r:0,s:"swordeffect"}},
			2 : {p:new Point(12,-6),r:-45,z:-1,v:{x:2,y:0,r:0,s:"swordeffect"}},
			3 : {p:new Point(12,-6),r:-50,z:-1,v:0},
			4 : {p:new Point(12,-6),r:-45,z:-1,v:0},
			5 : {p:new Point(-24,2),r:-60,z:1,v:{x:0,y:1,r:0,s:"swordeffect"}},
			6 : {p:new Point(-21,-1),r:-60,z:1,v:{x:1,y:1,r:0,s:"swordeffect"}},
			7 : {p:new Point(-23,0),r:-10,z:1,v:{x:2,y:1,r:0,s:"swordeffect"}},
			8 : {p:new Point(21,-4),r:90,z:-1,v:{x:0,y:4,r:0,s:"swordeffect"}},
			9 : {p:new Point(20,-4),r:90,z:-1,v:{x:1,y:4,r:0,s:"swordeffect"}},
			10 : {p:new Point(20,-4),r:90,z:-1,v:0}
		},
		5 : {
			0 : {p:new Point(-16,1),r:-45,z:1,v:0},
			1 : {p:new Point(-16,2),r:-90,z:1,v:0},
			2 : {p:new Point(15,-2),r:90,z:1,v:{x:0,y:2,r:0,s:"swordeffect"}},
			3 : {p:new Point(12,-6),r:45,z:-1,v:{x:1,y:2,r:0,s:"swordeffect"}},
			4 : {p:new Point(6,-6),r:45,z:-1,v:{x:2,y:2,r:0,s:"swordeffect"}},
			5 : {p:new Point(14,-2),r:50,z:-1,v:{x:3,y:2,r:0,s:"swordeffect"}},
			6 : {p:new Point(16,4),r:80,z:1,v:0},
			7 : {p:new Point(-4,4),r:100,z:-1,v:0},
			8 : {p:new Point(12,-26),r:10,z:-1,v:0,v:{x:0,y:6,r:0,s:"swordeffect"}},
			9 : {p:new Point(12,-27),r:0,z:-1,v:0,v:{x:1,y:6,r:0,s:"swordeffect"}},
			10 : {p:new Point(12,-27),r:0,z:-1,v:0,v:{x:2,y:6,r:0,s:"swordeffect"}},
			11 : {p:new Point(12,-27),r:0,z:-1,v:0},
		},
		6 : {
			8 : {p:new Point(-16,1),r:-45,z:1,v:0}
		},
		8 : {
			0 : {p:new Point(-15,-2),r:-10,z:1,v:0},
			1 : {p:new Point(-14,-5),r:-45,z:1,v:0},
			2 : {p:new Point(-15,-2),r:-140,z:1,v:0},
			3 : {p:new Point(12,-6),r:45,z:-1,v:{x:0,y:3,r:0,s:"swordeffect"}},
			4 : {p:new Point(-4,5),r:220,z:-1,v:{x:1,y:3,r:0,s:"swordeffect"}},
			5 : {p:new Point(9,2),r:110,z:1,v:0},
			6 : {p:new Point(-20,-1),r:60,z:1,v:0},
		},
		9 : {
			0 : {p:new Point(-16,5),r:-80,z:1,v:0},
			1 : {p:new Point(-20,2),r:45,z:1,v:0},
			2 : {p:new Point(-20,2),r:90,z:1,v:0},
			3 : {p:new Point(21,1),r:90,z:-1,v:{x:0,y:5,r:0,s:"swordeffect"}},
			4 : {p:new Point(17,2),r:90,z:-1,v:{x:1,y:5,r:0,s:"swordeffect"}},
			5 : {p:new Point(-20,1),r:55,z:1,v:0}
		},
		10 : {
			0 : {p:new Point(-15,-3),r:-100,z:1,v:0},
			1 : {p:new Point(-15,-3),r:-100,z:1,v:0},
			2 : {p:new Point(-14,-3),r:-95,z:1,v:0},
			3 : {p:new Point(-13,-3),r:-95,z:1,v:0},
			4 : {p:new Point(-11,-3),r:-90,z:1,v:0},
			5 : {p:new Point(-11,-3),r:-95,z:1,v:0},
			6 : {p:new Point(-12,-3),r:-105,z:1,v:0},
			7 : {p:new Point(-13,-3),r:-100,z:1,v:0},
			
			8 : {p:new Point(-13,-2),r:-50,z:1,v:0},
			9 : {p:new Point(-12,-2),r:-45,z:1,v:0},
			10 : {p:new Point(-12,-6),r:-40,z:1,v:0},
		},
		11 : {
			0 : {p:new Point(-10,-23),r:24,z:1,v:{x:0,y:0,r:0,s:"swordeffectv"}},
			1 : {p:new Point(2,4),r:120,z:1,v:{x:1,y:0,r:0,s:"swordeffectv"}},
			2 : {p:new Point(4,1),r:80,z:1,v:{x:2,y:0,r:0,s:"swordeffectv"}},
			3 : {p:new Point(4,1),r:75,z:1,v:{x:3,y:0,r:0,s:"swordeffectv"}},
			4 : {p:new Point(4,1),r:75,z:1,v:0},
		}
	}

 /* platformer\portcullis.js*/ 

class Portcullis extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.origin = new Point(0,0);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		
		this.force = new Point(0,0);
		this.closeDelay = Game.DELTASECOND * 0.0625;
		this._closeTime = this.closeDelay;
		this._open = false;
		
		
		Block.prototype.gatherTiles.apply(this, [true]);
		
		this._ylimitDown = this.position.y;
		this._ylimitUp = this.position.y;
		for(let i=1; i < 64; i++){
			let tile = game.getTile(
				this.position.x + this.width * 0.5,
				this.position.y - i * 16
			);
			if(tile == 0){
				this._ylimitUp -= 16;
			} else {
				break;
			}
		}
		
		this.addModule(mod_block);
		
		if("trigger" in ops) {
			this._tid = ops["trigger"];
		}
		
		this.on("activate", function(){
			this._open = true;
			this._closeTime = this.closeDelay;
		});
		
		this.on("collideObject", function(obj){
			if(this.force.y > 0.5 && obj.hasModule(mod_rigidbody)){
				var dir = this.position.subtract(obj.position);
				if(dir.x > 0){
					obj.position.x = this.position.x - obj.width;
				} else {
					obj.position.x = this.position.x + obj.width;
				}
			}
		});
	}
	
	update(){
		if(this._open){
			this._closeTime -= this.delta;
			this.force.y -= this.delta * 1.0;
			
			if(this._closeTime <= 0){
				this._open = false;
			}
		} else {
			this.force.y += this.delta * 1.0;
		}
		
		this.force.y = Math.max(Math.min(this.force.y, 10),-10);
		this.position.y += this.delta * this.force.y;
		
		if(this.force.y > 0){
			if(this.position.y >= this._ylimitDown){
				this.force.y = 0;
				this.position.y = this._ylimitDown;
			}
		} else {
			if(this.position.y <= this._ylimitUp){
				this.force.y = 0;
				this.position.y = this._ylimitUp;
			}
		}
		
	}
	
	idle(){}
	
	render(g,c){
		Block.prototype.render.apply(this, [g,c]);
	}
}
self.Portcullis = Portcullis;

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
				obj.position.x += this.force.x * 0.5 * this.delta;
				obj.position.y += this.force.y * 0.5 * this.delta;
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

 /* platformer\ragdoll.js*/ 

Ragdoll.prototype = new GameObject();
Ragdoll.prototype.constructor = GameObject;
function Ragdoll(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "pothead";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.lifeMax = this.life = 0;
	this.isDead();
	
	this.rotation = 0.0;
	this.rotationSpeed = 1.0;
	this.frame.x = 0;
	this.frame.y = 0;
	this.frames = false;
	this.frameSpeed = 0.3;
	this.deathSound = "kill";
	this.hurtSound = "hurt";
	
	this._frameprogress = 0.0;
	
	
	this.on("struck", EnemyStruck);
	
	this.on("hurt", function(){
		audio.play(this.hurtSound,this.position);
	});
	
	this.on("death", function(){
		audio.play(this.deathSound,this.position);
		this.destroy();
	});
}
Ragdoll.prototype.render = function(g,c){
	if(this.frames instanceof Array){
		var f = Math.floor(this._frameprogress * this.frames.length);
		this.frame = this.frames[f];
	} else if(this.frames instanceof Sequence){
		this.frame = new this.frames.frame(this._frameprogress);
	}
	this._frameprogress = (this._frameprogress + this.frameSpeed * this.delta) % 1.0;
	
	this.rotation += Math.mod(this.delta * this.rotationSpeed, 360);
	
	g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, false, {
		"rotate" : this.rotation
	});
}

 /* platformer\rain.js*/ 

Rain.prototype = new GameObject();
Rain.prototype.constructor = GameObject;
function Rain(x, y, d, o){
	this.constructor();
	this.origin = new Point();
	this.position.x = x - d[0] * 0.5;
	this.position.y = y - d[1] * 0.5;
	this.width = d[0];
	this.height = 1024;
	
	this.angle = -0.3;
	this.lineSize = 1024;
	this.splashTime = Game.DELTASECOND * 0.2;
	
	this.dropDensity = 1.0;
	this.dropSize = 1.0;
	this.dropSpeed = 1.0;
	
	if("dropdensity" in o){
		this.dropDensity = o["dropdensity"] * 1;
	}	
	if("dropsize" in o){
		this.dropSize = o["dropsize"] * 1;
	}
	if("dropspeed" in o){
		this.dropSpeed = o["dropspeed"] * 1;
	}
	
	this.lines = new Array();
	this._addLinePosition = 0.0;
	
	
	
}

Rain.prototype.update = function(){
	if(this._addLinePosition < this.width){
		let d_multiplier = 1.0 / this.dropDensity;
		let angle = this.angle + (0.5 - Math.random()) * 0.1;
		this._addLinePosition += d_multiplier * (4 + Math.floor(Math.random() * 16));
		
		var newLine = new Line(
			this.position.add(new Point(this._addLinePosition, 0)),
			this.position.add(new Point(
				this._addLinePosition + Math.sin(angle)*this.lineSize,
				Math.cos(angle)*this.lineSize
			))
		);
		
		let trace = game.t_raytrace(newLine, function(p){
			let tr = this.getTileRule(p.x, p.y);
			return tr != tilerules.ignore && tr != tilerules.onewayup;
		});
		
		if(trace){
			newLine.end = trace;
		}
		
		let l_multiplier = this.lineSize / newLine.length();
		
		newLine.dropSpeed = l_multiplier * (0.016 + Math.random() * 0.008) * this.dropSpeed;
		newLine.dropLength = l_multiplier * 0.01 * this.dropSize;
		newLine.dropPosition = Math.random();
		
		this.lines.push(newLine);
	}
}

Rain.prototype.render = function(g,c){
	let screen = new Line(game.camera, game.camera.add(game.resolution));
	
	for(let i=0; i < this.lines.length; i++){
		let l = this.lines[i];
		let top = (game.camera.y - l.start.y) / Math.abs(l.start.y - l.end.y);
		let bot = (game.camera.y + 240 - l.start.y) / Math.abs(l.start.y - l.end.y);
		
		l.dropPosition = Math.max(l.dropPosition + this.delta * l.dropSpeed, top);
		
		if(l.dropPosition < 1 && l.dropPosition + l.dropLength > 1){
			//drop made contact with end, draw splash
			l.splash = this.splashTime;
		}
		if(l.dropPosition >= bot){
			//drop reached bottom of screen, move it to the top
			l.dropPosition = top;
		}
		if(screen.overlaps(l)){
			//Line is onscreen, render it
			if(l.splash > 0){
				//Render the splash
				let p = 1 - (l.splash / this.splashTime);
				let splash_frame = new Point(
					(p * 6) % 3,
					p * 2
				);
				g.renderSprite(
					"raindrops",
					l.end.subtract(c),
					this.zIndex,
					splash_frame,
					false,
					{
						u_color : Rain.Color
					}
				);
				l.splash -= this.delta;
			}
			if(l.dropPosition > 0 && l.dropPosition < 1){
				//Drop on screen, render it
				let newStart = Point.lerp(l.start, l.end, l.dropPosition);
				let newEnd = Point.lerp(l.start, l.end, Math.min(l.dropPosition + l.dropLength,1.0));
				
				g.renderLine(
					newStart.subtract(c),
					newEnd.subtract(c),
					1,
					Rain.Color
				);
			}
		}
		
	}
}
Rain.Color = [1.0,1.0,1.0,0.6];


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
			DialogManger.parsedtext = DialogManger.parse(DialogManger.substitute(text));
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
	"substitute" : function(s){
		var rep = {
			"%jump%" : "'K'",
			"%fire%" : "'J'",
			"%select%" : "'Q'",
			"%dodge%" : "'Space'",
		};
		
		for(var i in rep){
			s = s.replace(i,rep[i]);
		}
		return s;
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

 /* platformer\shrine.js*/ 

Shrine.prototype = new GameObject();
Shrine.prototype.constructor = GameObject;
function Shrine(x, y, d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "shrine";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = 64;
	this.height = 32;
	
	this.addModule( mod_talk );
	
	this.useable = true;
	this.spells = new Array();
	
	this.useTimer = Game.DELTASECOND;
	
	if("spells" in ops){
		var s = ops["spells"].split(",");
		for(var i=0; i < s.length; i++){
			try{
				var newSpell = new self[s[i].trim()]();
				if(!(newSpell instanceof Spell)){
					throw "Invalid";
				}
				this.spells.push(newSpell);
			}catch(e){
				console.warn("Invalid spell name: "+s[i]);
			}
		}
	}
	
	this.on("open", function(){
		if(this.useable){
			this.use();
		}
		this.close();
	});
	
	this.on("close", function(){
		
	});
	
	
}


Shrine.prototype.update = function(){
	
	//Animate
	if(this.useable){
		Background.pushLight(this.position, 64, COLOR_FIRE);
		this.frame.y = (this.frame.y + this.delta * 0.5) % 4;
	} else {
		this.frame.x = 1; 
		this.frame.y = 0;
	}
}

Shrine.prototype.use = function(){
	for(var i=0; i < this.spells.length; i++){
		var alreadyOwned = false;
		for(var j=0; j < _player.spells.length; j++){
			if(_player.spells[j].name == this.spells[i].name){
				alreadyOwned = true;
				//_player.spells[j].stock = _player.spells[j].stockMax;
			}
		}
		if(!alreadyOwned){
			_player.spells.push(this.spells[i]);
		}
		
	}
	game.addObject(new ShrineEffect(this.position.x, this.position.y));
	this.useable = false;
}

Shrine.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	for(var i=0; i < this.spells.length; i++){
		var spell = this.spells[i];
		if(spell instanceof Spell){
			var ypos = 16 * i;
			g.renderSprite(this.sprite,this.position.add(new Point(0,-32-ypos)).subtract(c),0,new Point(1,1));
			if(this.useable){
				spell.render(g,this.position.add(new Point(0,-24-ypos)).subtract(c));
			}
		}
	}
}

ShrineEffect.prototype = new GameObject();
ShrineEffect.prototype.constructor = GameObject;
function ShrineEffect(x, y, d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "bullets";
	this.frame = new Point(3,2);
	
	this.finalPosition = new Point(40,12);
	this.sparksCount = 12;
	this.sparkForce = 3;
	this.sparkSpeed = 0.1;
	this.sparks = new Array();
	for(var i=0; i < this.sparksCount; i++){
		this.sparks.push({
			"position" : this.position.subtract(game.camera),
			"force" : new Point(
				this.sparkForce * Math.sin((i/this.sparksCount) * Math.PI * 2), 
				this.sparkForce * Math.cos((i/this.sparksCount) * Math.PI * 2)
			)
		})
	}
}
ShrineEffect.prototype.hudrender = function(g,c){
	for(var i=0; i < this.sparksCount; i++){
		var spark = this.sparks[i];
		if(spark.force.length() < 0.2){
			spark.position = Point.lerp(spark.position, this.finalPosition, this.delta * this.sparkSpeed);
		} else {
			spark.position = spark.position.add(spark.force.scale(this.delta));
			spark.force = spark.force.scale(1-(0.1*this.delta));
		}
		g.renderSprite(this.sprite,spark.position,1,this.frame);
	}
	
	if(spark.position.subtract(this.finalPosition).length() < 1.0){
		this.destroy();
	}
}

 /* platformer\spawn.js*/ 

Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	
	this.options = ops || new Options();
	
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = d[0];
	this.height = d[1];
	this.difficulty = Spawn.difficulty;
	this.specific = null;
	this.autoreset = 0;
	this.autodestroy = 0;
	this.enemies = new Array();
	this.enemiesLimit = 1;
	this.active = false;
	this.respawn = false;
	this.timer = 0.0;
	this.timerTotal = 0.0;
	this.edgespawn = false;
	this.spawnPattern = 0;
	this.idleMargin = 0;
	this.spawnRest = Game.DELTASECOND * 20;
	this.lastSpawn = Number.MIN_SAFE_INTEGER;
	this.activateOnTrigger = this.options.getBool("activateontrigger", false);
	
	this.on("activate",function(obj){
		this.clear();
		this.spawn();
		
		if(this.activateOnTrigger){
			this.active = true;
		}
	});
	
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
	if("autoreset" in this.options){
		this.autoreset = this.options.autoreset * 1;
	}
	if("autospawn" in this.options){
		autospawn = this.options.autospawn * 1;
		this.active = autospawn;
	}
	if("spawnpattern" in this.options){
		this.spawnPattern = this.options.spawnpattern * 1;
	}
	if("respawn" in this.options){
		this.respawn = this.options["respawn"] * 1;
	}
	if( "tags" in this.options ){
		this.tags = this.options.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	if("timer" in this.options){
		this.timerTotal = this.options["timer"] * Game.DELTASECOND;
		this.timer = this.timerTotal;
		this.spawnRest = 0;
	}
	if("spawnrest" in this.options){
		this.spawnRest = this.options.spawnrest * Game.DELTASECOND;
	}
	if("trigger" in this.options){
		this._tid = this.options.trigger;
	}
	
	this.on("wakeup",function(){
		if(this.active && this.count() < this.enemiesLimit){
			this.spawn();
		}
	});
}

Spawn.prototype.update = function(){
	if(this.count() >= this.enemiesLimit){
		this.lastSpawn = game.timeScaled;
	} else {
		if(this.timerTotal > 0){
			this.timer -= this.delta;
			if(this.timer <= 0){
				this.timer = this.timerTotal;
				this.spawn();
			}
		}
	}
}

Spawn.prototype.spawn = function(){
	try{
		if(this.lastSpawn + this.spawnRest > game.timeScaled){
			return;
		}
		
		this.lastSpawn = game.timeScaled;
		this.active = this.respawn;
		
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
Spawn.prototype.isAlive = function(enemies){
	return this.count() > 0;
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
				this.options
				//{"difficulty":this.difficulty}
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
			if(this.autoreset){
				object.lifeMax = object.life;
				object.on("sleep", function(){ 
					if(!that.isOnscreen()){
						this.destroy(); 
						that.lastSpawn = game.timeScaled - that.spawnRest;
					}
				});
			}
			game.addObject( object );
			this.enemies.push( object );
		} catch (e) {
			console.error( "cannot create object: " + name );
		}
	}
}
Spawn.prototype.spawnPosition = function(i){
	if(this.spawnPattern == 2){
		var c = this.corners();
		var left = Math.max(c.left, game.camera.x);
		var width = Math.min(game.resolution.x,c.right-left);
		return new Point(left+Math.random()*width,this.position.y);
	} else if(this.spawnPattern == 1){
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
	var damage = level * 2;
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	var multi = 1 + difficulty * 0.25;
	damage = Math.floor( damage * multi );
	return damage;
}

Spawn.defence = function(level, difficulty){
	//-4 kills in one shot
	//-3 super vulnerable
	//-2 very weak
	//-1 some extra damage
	//0 No change
	// 1 a little resistant
	// 2 Very strong, aim for half
	// 3 very strong, hardly any damage
	// 4 null all damage
	if(level >= 4) {
		return 9999;
	}
	if(level <= -4) {
		return -9999;
	}
	var def = level * 3;
	let multi = 1 + difficulty * 0.5;
	return Math.floor(def*multi);
}

Spawn.life = function(level, difficulty){
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	if( level == 0 ) return 3; //Always one shot
	var multi = 1 + difficulty * 0.25;
	return Math.floor( multi * level * 7 );
}

Spawn.money = function(money, difficulty){
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	var base = money * 0.66666 + money * 0.4 * Math.random();
	var multi = 1 + difficulty * 0.6;
	var bonus = Math.round( multi * 20 );
	var out = Math.round( multi * base );
	if(Math.random() < 0.04){
		return Math.max(out,bonus);
	} else {
		return out;
	}
}

Spawn.difficulty = 0;

 /* platformer\spells.js*/ 

function Spell(){
	this.name = "Spell";
	this.objectName = "Spell";
	this.level = 1;
	this.levelMax = 5;
	this.castTime = Game.DELTASECOND;
	this.refillRarity = 10.0;
	this.frame = new Point(0,10);
	this.priceBase = 7;
	this.priceExponent = 2.5;
	this.manaCost = 3;
}
Spell.prototype.use = function(player){}
Spell.prototype.modifyStats = function(player, type){}
Spell.prototype.canCast = function(player){ return true; }
Spell.prototype.upgradePrice = function(){ return Math.floor(Math.pow(this.priceBase+this.level, this.priceExponent)); }
Spell.prototype.render = function(g,p){
	g.renderSprite("items",p,10,this.frame);
}
Spell.SLOTTYPE_SPECIAL = 0;
Spell.SLOTTYPE_MAGIC = 1;
Spell.SLOTTYPE_ATTACK = 2;
Spell.SLOTTYPE_DEFENCE = 3;
Spell.NAMES = [
	"SpellFire", 
	"SpellBolt", 
	"SpellFlash", 
	"SpellHeal", 
	"SpellPurify", 
	"SpellShield", 
	"SpellSlimeGernade", 
	"SpellStrength"
];
/*
Spell.randomRefill = function(player, nothingchance){
	var total = nothingchance || 0.0;
	var roll = Math.random();
	var availableCriteria = function(s){
		return s.stock < s.stockMax;
	}
	
	for(var i=0; i < player.spells.length; i++){
		if(availableCriteria(player.spells[i])){
			total += player.spells[i].refillRarity
		}
	}
	roll *= total;
	for(var i=0; i < player.spells.length; i++){
		if(availableCriteria(player.spells[i])){
			if(player.spells[i].refillRarity >= roll){
				return player.spells[i];
			} else {
				roll -= player.spells[i].refillRarity;
			}
		}
	}
	return null;
}
*/

SpellFire.prototype = new Spell();
SpellFire.prototype.constructor = Spell;
function SpellFire(){
	//Fires a fireball
	this.constructor();
	this.name = "Fireball";
	this.objectName = "SpellFire";
	this.castTime = Game.DELTASECOND * 0.3;
	this.frame = new Point(0,10);
}
SpellFire.prototype.use = function(player){
	audio.play("cracking");
	var damage = Math.floor(18 + player.stats.magic*4);
	var bullet = Bullet.createFireball(player.position.x, player.position.y);
	bullet.force.x = player.flip ? -6 : 6;
	bullet.team = player.team;
	bullet.ignoreInvincibility = true;
	bullet.damageFire = 8 + player.stats.magic * this.level;
	game.addObject(bullet);
}
SpellFire.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.damageFire += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceFire += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellBolt.prototype = new Spell();
SpellBolt.prototype.constructor = Spell;
function SpellBolt(){
	//Fires a fireball
	this.constructor();
	this.name = "Bolt";
	this.objectName = "SpellBolt";
	this.castTime = Game.DELTASECOND * 0.1;
	this.frame = new Point(7,10);
	this.manaCost = 1;
}
SpellBolt.prototype.use = function(player){
	audio.play("cracking");
	var bullet = new Bullet(player.position.x, player.position.y);
	bullet.force.x = player.forward() * 8;
	bullet.team = player.team;
	bullet.frame = new Point(1,0);
	bullet.ignoreInvincibility = true;
	bullet.damage = 0;
	bullet.damageLight = 5 + Math.floor(player.stats.magic * this.level * 0.666);
	game.addObject(bullet);
}
SpellBolt.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.perks.attackSpeed += 0.05 + 0.03 * (this.level * (1+power));
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.perks.attackSpeed += 0.05 + 0.03 * (this.level * (1+power));
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceLight += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellSlimeGernade.prototype = new Spell();
SpellSlimeGernade.prototype.constructor = Spell;
function SpellSlimeGernade(){
	//Fires a fireball
	this.constructor();
	this.name = "Slime gernade";
	this.objectName = "SpellSlimeGernade";
	this.castTime = Game.DELTASECOND * 0.15;
	this.frame = new Point(6,10);
}
SpellSlimeGernade.prototype.use = function(player){
	var nade = new Gernade(player.position.x, player.position.y);
	nade.damageSlime = 10 + player.stats.magic * this.level;
	nade.force.x = 6;
	nade.force.y = -8;
	nade.team = player.team;
	nade.force.x *= player.flip ? -1.0 : 1.0;
	game.addObject(nade);
}
SpellSlimeGernade.prototype.modifyStats = function(player, type, power){	
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.damageSlime += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.damageSlime += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 2 + Math.floor(this.level * (1.5 + power * 0.5));
		player.defenceSlime += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}


SpellFlash.prototype = new Spell();
SpellFlash.prototype.constructor = Spell;
function SpellFlash(){
	//Fires a fireball
	this.constructor();
	this.name = "Flash";
	this.objectName = "SpellFlash";
	this.castTime = Game.DELTASECOND * 0.3;
	this.manaCost = 4;
	this.frame = new Point(1,10);
}
SpellFlash.prototype.use = function(player){
	audio.play("spell");
	game.addObject(new EffectFlash(player.position.x,player.position.y));
	
	var area = new Line(game.camera, game.camera.add(game.resolution));
	var objs = game.overlaps(area);
	var damage = Math.floor(14 + player.stats.magic * this.level);
	var heal = 0;
	for(var i=0; i < objs.length; i++){
		var obj = objs[i];
		if(obj.hasModule(mod_combat) && obj.team != player.team && area.overlaps(obj.position)){
			if(obj.life > 0){
				obj.invincible = 0;
				obj.hurt(player,damage);
				heal += Math.round(damage*0.2);
				game.addObject(new EffectAbsorb(obj.position.x,obj.position.y));
			}
		}
		obj.trigger("spellFlash", this);
	}
	if(player.life < player.lifeMax){
		player.heal += heal;
	}
}
SpellFlash.prototype.modifyStats = function(player, type, power){
	
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * (1+power);
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.stats.magic += this.level * (1+power) * 2;
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * (1+power);
		player.perks.lifeSteal += 0.025 * this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.defenceLight += 1 + Math.floor(this.level * (1 + power * 0.5));
	}
}

SpellHeal.prototype = new Spell();
SpellHeal.prototype.constructor = Spell;
function SpellHeal(){
	//Fires a fireball
	this.constructor();
	this.name = "Heal";
	this.objectName = "SpellHeal";
	this.manaCost = 16;
	this.frame = new Point(2,10);
	this.priceBase = 8;
	this.priceExponent = 2.7;
}
SpellHeal.prototype.canCast = function(player){
	return player.life < player.lifeMax;
}
SpellHeal.prototype.use = function(player){
	var heal = Math.floor(3 + (player.stats.magic + this.level) * 2);
	player.heal += heal;
}
SpellHeal.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.perks.slowWound += this.level * (0.05 + power * 0.05);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defenceFire += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceSlime += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceIce += Math.floor(1 + this.level * 0.5 * (1+power));
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += this.level * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.stats.defence += 1 + Math.floor(this.level * (1 + power * 0.5));
		player.perks.slowWound += this.level * (0.05 + power*0.25);
	}
}

SpellPurify.prototype = new Spell();
SpellPurify.prototype.constructor = Spell;
function SpellPurify(){
	//Fires a fireball
	this.constructor();
	this.name = "Purify";
	this.objectName = "SpellPurify";
	this.manaCost = 12;
	this.frame = new Point(3,10);
	this.priceBase = 6;
}
SpellPurify.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i].negative){
			return true;
		}
	}
	return false;
}
SpellPurify.prototype.use = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i].negative){
			player.buffs[i].time = 0;
		}
	}
}
SpellPurify.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.defence += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.perks.poisonResist += this.level * (0.05 + power * 0.02);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.perks.lifeSteal += this.level * (0.02 + power*0.1);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.poisonResist += this.level * (0.05 + power * 0.02);
	}
}

SpellShield.prototype = new Spell();
SpellShield.prototype.constructor = Spell;
function SpellShield(){
	//Fires a fireball
	this.constructor();
	this.name = "Magic Shield";
	this.objectName = "SpellShield";
	this.manaCost = 3;
	this.frame = new Point(4,10);
	this.priceBase = 9;
	this.priceExponent = 3.0;
}
SpellShield.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffMagicShield){
			return false;
		}
	}
	return true;
}
SpellShield.prototype.use = function(player){
	var buff = new BuffMagicShield();
	buff.absorb = Math.min((player.stats.magic-1) * 0.05, 0.45);
	player.addBuff(buff)
	audio.play("spell");
}
SpellShield.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.magic += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
		player.perks.manaRegen += (this.level + power) * 0.25;
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.damageLight += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.painImmune += this.level  * (1+power) * 0.2;
		player.defenceLight += Math.floor(1 + this.level * 0.5 * (1+power));
	}
}

SpellStrength.prototype = new Spell();
SpellStrength.prototype.constructor = Spell;
function SpellStrength(){
	//Fires a fireball
	this.constructor();
	this.name = "Strength";
	this.objectName = "SpellStrength";
	this.manaCost = 16;
	this.frame = new Point(5,10);
	this.priceBase = 8;
	this.priceExponent = 3.0;
}
SpellStrength.prototype.canCast = function(player){
	for(var i=0; i < player.buffs.length; i++){
		if(player.buffs[i] instanceof BuffStrength){
			return false;
		}
	}
	return true
}
SpellStrength.prototype.use = function(player){
	var buff = new BuffStrength();
	buff.multiplier = Math.min(1.25 + (player.stats.magic-1) * 0.1, 2.5);
	player.addBuff(buff)
	audio.play("spell");
}
SpellStrength.prototype.modifyStats = function(player, type, power){
	if(type == Spell.SLOTTYPE_SPECIAL){
		player.stats.attack += this.level * 2 * (1+power);
	} else if(type == Spell.SLOTTYPE_MAGIC) {
		player.defencePhysical += this.level * (0.0125 + power*0.005);
		player.stats.attack += this.level * (1+power);
	} else if(type == Spell.SLOTTYPE_ATTACK){
		player.stats.attack += this.level * 2 * (1+power);
	} else if(type == Spell.SLOTTYPE_DEFENCE){
		player.perks.thorns += this.level * (0.10 + power * 0.04);
	}
}

 /* platformer\spook.js*/ 

Spook.prototype = new GameObject();
Spook.prototype.constructor = GameObject;
function Spook(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	this.spookCount = 8;
	this.spookTime = 8 * Game.DELTASECOND
	this.spooks = new Array();
	for(var i=0; i < 8; i++){
		this.spooks.push({
			"position" : new Point(x + Math.random()* 128, y + Math.random()* 120),
			"frame" : Math.random() * this.spookTime
		})
	}
}

Spook.prototype.update = function(){
}

Spook.prototype.render = function(g,c){
}

Spook.prototype.lightrender = function(g,c){
	for(var i=0; i < this.spooks.length; i++){
		var s = this.spooks[i];
		
		s.frame = (s.frame + this.delta) % this.spookTime;
		var sf = 9 * Math.min(s.frame / (Game.DELTASECOND * 1), 1);
		
		var f = new Point(sf%3,sf/3);
		
		
		g.renderSprite(
			"spook1",
			s.position.subtract(c),
			this.zIndex,
			f,
			false
		);
	}
}

 /* platformer\sprite_wrapper.js*/ 

class SpriteWrapper {
	constructor(js){
		this.js = js;
		
		this.animMetaData = {};
		this.offset = new Point(js.offsetx,js.offsety);
		
		for(let i=0; i < js.animation.length; i++){
			let a = js.animation[i];
			let totalLen = 0.0;
			for(let j=0; j < a.frames.length; j++){ totalLen += a.frames[j].t; }
			
			this.animMetaData[a.name] = {
				index : i,
				total : totalLen
			};
		}
	}
	frame(name, progress){
		progress = Math.max(Math.min( progress, 1 ), 0);
		if(name in this.animMetaData){
			let index = this.animMetaData[name].index;
			let anim = this.js.animation[index];
			let total = this.animMetaData[name].total * progress;
			
			let fend = 0.0;
			for(let i=0; i < anim.frames.length; i++){
				fend += anim.frames[i].t;
				if(fend >= total){
					return new Point(anim.frames[i].x, anim.frames[i].y);
				}
			}
		}
		return new Point();
	}
	getFrameData(frame, framey){
		let framex = frame;
		if(frame instanceof Point){
			framex = frame.x;
			framey = frame.y;
		}
		if(framey in this.js.data) if(framex in this.js.data[framey] ){
			return this.js.data[framey][framex];
		}
		return null;
	}
	getHitBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_HITAREA);
	}
	getAttackBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_ATTACKAREA);
	}
	getGuardBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_GUARDAREA);
	}
	getAreaOfType(frame, gameObject, type){
		gameObject = gameObject || {};
		
		let fdata = this.getFrameData(frame);
		let output = new Array();
		let flip = !!gameObject.flip;
		let position = gameObject.position;
		
		if(fdata){
			for(let i=0; i < fdata.length; i++){
				let fd = fdata[i];
				if(fd.type == type){
					if(flip){
						output.push(new Line(
							position.x + (fd.u - this.offset.x) * -1,
							position.y + (fd.y - this.offset.y), 
							position.x + (fd.x - this.offset.x) * -1,
							position.y + (fd.v - this.offset.y)
						));
					} else {
						output.push(new Line(
							position.x + (fd.x - this.offset.x),
							position.y + (fd.y - this.offset.y), 
							position.x + (fd.u - this.offset.x),
							position.y + (fd.v - this.offset.y)
						));
					}
				}
			}
		}
		return output;
	}
}
SpriteWrapper.TYPE_HITAREA = 0;
SpriteWrapper.TYPE_CRITAREA = 1;
SpriteWrapper.TYPE_ATTACKAREA = 2;
SpriteWrapper.TYPE_GUARDAREA = 3;

 /* platformer\start.js*/ 

var version = "0.5.1";

function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	NPC.variables = {};
	
	g.pause = false;
	
	g.addObject( new TitleMenu() );
	//return;
	
	setTimeout(function(){
		new Player(0,0);		
		_player.lightRadius = true;
		_player.downstab = true;
		_player.doubleJump = true;
		//_player.dodgeFlash = true;
		_player.walljump = true;
		//WorldLocale.loadMap("gateway.tmx");
		WorldLocale.loadMap("temple2.tmx", "test");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			//_player.stat_points = 6;
			//_player.life = _player.lifeMax = 36;
			_player.mana = _player.manaMax = 36;
			//_player.money = 36000;
			
			
			NPC.set("long_sword",1);
			NPC.set("broad_sword",1);
			NPC.set("morningstar",1);
			NPC.set("bloodsickle",1);
			NPC.set("burningblade",1);
			
			
			//NPC.set("templeCompleted", 2);
			_player.spells.push( new SpellBolt());
			_player.spells.push( new SpellFire());
			_player.spells.push( new SpellSlimeGernade());
			_player.spells.push( new SpellFlash());
			_player.spells.push( new SpellHeal());
			_player.spells.push( new SpellPurify());
			_player.spells.push( new SpellShield());
			_player.spells.push( new SpellStrength());
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

 /* platformer\temple4transport.js*/ 

class Temple4Transport extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - (d[0] * 0.5);
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.startPosition = this.position.scale(1);
		this.stopPosition = this.position.scale(1);
		
		this.addModule(mod_block);
		
		this.moving = false;
		this.speed = ops.getFloat("speed", 0.5);
		this.launchTime = ops.getFloat("launchtime", 2.0) * Game.DELTASECOND;
		this.stopPosition.x = ops.getFloat("stopx", this.stopPosition.x);
		this.stopPosition.y = ops.getFloat("stopy", this.stopPosition.y);
		
		this.distance = this.position.subtract(this.stopPosition).magnitude();
		this.movementSpeed = this.speed / this.distance;
		
		this._waitTime = 0.0;
		this._progress = 0.0;
		
		this.on("collideTop", function(obj){
			if(obj instanceof Player){
				this.moving = true;
			} else {
				
			}
		});
	}
	update(){
		if(this.moving){
			if(this._waitTime < this.launchTime){
				this._waitTime += this.delta;
			} else {
				this._progress = Math.clamp01(this._progress + this.movementSpeed * this.delta);
				this.position = Point.lerp(this.startPosition, this.stopPosition, this._progress);
			}
			
		}
	}
	
	render(g,c){
		g.color = [1.0,0.8,0.8,1.0];
		g.scaleFillRect(
			this.position.x - c.x,
			this.position.y - c.y,
			this.width,
			this.height
		);
	}
}
self["Temple4Transport"] = Temple4Transport;

 /* platformer\tilerules.js*/ 

tilerules.rules["world"] = {
	959:tilerules.ignore,
	960:tilerules.edge_right,
	989:tilerules.ceil_1to0,
	990:tilerules.ceil_0to1,
	991:tilerules.edge_left,
	992:tilerules.ignore,
	1021:tilerules.slope_1to0,
	1022:tilerules.slope_0to1
};

tilerules.rules["default"] = {
	9:tilerules.slope_1tohalf,
	10:tilerules.slope_halfto0,
	11:tilerules.slope_1to0,
	12:tilerules.slope_0to1,
	13:tilerules.slope_0tohalf,
	14:tilerules.slope_halfto1,
	41:tilerules.ignore,
	42:tilerules.ignore,
	43:tilerules.ignore,
	44:tilerules.ignore,
	45:tilerules.ignore,
	47:tilerules.ignore,
	
	73:tilerules.slope_1tohalf,
	74:tilerules.slope_halfto0,
	75:tilerules.slope_1to0,
	76:tilerules.slope_0to1,
	77:tilerules.slope_0tohalf,
	78:tilerules.slope_halfto1,
	105:tilerules.ignore,
	106:tilerules.ignore,
	107:tilerules.ignore,
	108:tilerules.ignore,
	109:tilerules.ignore,
	110:tilerules.ignore,
	
	137:tilerules.slope_1tohalf,
	138:tilerules.slope_halfto0,
	139:tilerules.slope_1to0,
	140:tilerules.slope_0to1,
	141:tilerules.slope_0tohalf,
	142:tilerules.slope_halfto1,
	169:tilerules.ignore,
	170:tilerules.ignore,
	171:tilerules.ignore,
	172:tilerules.ignore,
	173:tilerules.ignore,
	174:tilerules.ignore,
	
	201:tilerules.onewayup,
	202:tilerules.onewayup,
	203:tilerules.onewayup,
	204:tilerules.onewayup,
	205:tilerules.onewayup,
	206:tilerules.onewayup,
	233:tilerules.ignore,
	234:tilerules.ignore,
	235:tilerules.ignore,
	236:tilerules.ignore,
	237:tilerules.ignore,
	238:tilerules.ignore,
	
	905:tilerules.ignore, 906:tilerules.ignore, 907:tilerules.ignore, 
	908:tilerules.ignore, 909:tilerules.ignore, 910:tilerules.ignore, 
	937:tilerules.ceil_1tohalf,
	938:tilerules.ceil_halfto0,
	939:tilerules.ceil_1to0,
	940:tilerules.ceil_0to1,
	941:tilerules.ceil_0tohalf,
	942:tilerules.ceil_halfto1,
	
	1003:tilerules.ceil_1to0,
	1004:tilerules.ceil_0to1,
};

tilerules.rules["firepits"] = mergeLists({
	98:tilerules.ignore, 99:tilerules.ignore,
	225:tilerules.ignore, 226:tilerules.ignore, 227:tilerules.ignore, 228:tilerules.ignore, 229:tilerules.ignore, 230:tilerules.ignore,
	257:tilerules.ignore, 291:tilerules.ignore, 293:tilerules.ignore, 321:tilerules.ignore, 323:tilerules.ignore, 359:tilerules.ceil_1to0, 360:tilerules.ceil_0to1,
	353:tilerules.ignore, 385:tilerules.ignore, 386:tilerules.ignore, 386:tilerules.ignore, 387:tilerules.ignore, 388:tilerules.ignore,
	389:tilerules.ignore, 390:tilerules.ignore, 417:tilerules.ignore, 418:tilerules.ignore, 419:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["temple4"] = mergeLists({
	51:tilerules.onewayup, 52:tilerules.onewayup, 53:tilerules.onewayup,
	83:tilerules.ignore, 84:tilerules.ignore, 85:tilerules.ignore, 86:tilerules.ignore, 87:tilerules.ignore,
	115:tilerules.ignore, 116:tilerules.ignore, 117:tilerules.ignore, 118:tilerules.ignore, 119:tilerules.ignore,
	147:tilerules.ignore, 148:tilerules.ignore, 149:tilerules.ignore, 150:tilerules.ignore, 151:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["town"] = mergeLists({
	39:tilerules.ignore, 40:tilerules.ignore, 136:tilerules.ignore, 321:tilerules.ignore, 326:tilerules.ignore,
	331:tilerules.ignore, 358:tilerules.ignore, 359:tilerules.ignore, 360:tilerules.ignore, 361:tilerules.ignore, 393:tilerules.ignore,
	425:tilerules.ignore, 457:tilerules.ignore, 491:tilerules.ignore, 492:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["lighthouse"] = mergeLists({
	37:tilerules.ignore, 38:tilerules.ignore, 39:tilerules.ignore, 40:tilerules.ignore,
	97:tilerules.ignore, 98:tilerules.ignore, 99:tilerules.ignore
}, tilerules.rules["default"]);

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
	
	this.resetOnDeath = false;
	this.chaintype = "break";
	this.chaintime = Game.DELTASECOND * 0.15;
	this.chaintimer = this.chaintime;
	this.chainActive = false;
	this.chainSize = 10;
	this.canUnbreak = true;
	this.target = false;
	this.resetOnSleep = 0;
	this.tileLayer = game.tileCollideLayer;
	this.explode = 1;
	this.triggersave = false;
	
	this.breakable = true;
	this.fixable = true;
	
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
	if("breakable" in ops){
		this.breakable =  ops["breakable"] * 1;
	}
	if("fixable" in ops){
		this.fixable =  ops["fixable"] * 1;
	}
	if("chain" in ops){
		this.chain = ops["chain"] * 1;
	}
	if("resetonsleep" in ops){
		this.resetOnSleep = ops["resetonsleep"];
	}
	if("resetondeath" in ops){
		this.resetOnDeath = ops["resetondeath"] * 1;
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
			if(this.triggersave){
				NPC.set(this.triggersave, 1);
			}
			if(!this.broken){
				obj.trigger("break_tile", this, damage);
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
	if(this.resetOnDeath){
		this.on("player_death", function(){
			if(this.startBroken){
				this.break(false);
			}else{
				this.unbreak(false);
			}
		});
	}
	if("triggersave" in ops){
		this.triggersave = ops["triggersave"];
		if(NPC.get(this.triggersave) != undefined){
			var tempChain = this.chain;
			this.chain = 0;
			if(NPC.get(this.triggersave)){
				this.break(false);
			} else {
				this.unbreak(false);
			}
			this.chain = tempChain;
		}
	}
}
BreakableTile.prototype.unbreak = function(explode){
	if(this.broken && this.undertile != 0 && this.fixable){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "unbreak";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.triggersave){
			NPC.set(this.triggersave, 0);
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
	if(!this.broken && this.breakable && this.undertile != 0){
		if(this.chain) {
			this.chainActive = true;
			this.chaintype = "break";
		}
		if(explode){
			game.addObject(new EffectExplosion(this.center.x, this.center.y,"crash"));
		}
		if(this.triggersave){
			NPC.set(this.triggersave, 1);
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

SpeedTile.prototype = new GameObject();
SpeedTile.prototype.constructor = GameObject;
function SpeedTile(x, y, d, ops){	
	this.constructor();
	this.padding = 8;
	this.origin.x = this.origin.y = 0.0;
	this.width = Math.roundTo(d[0],16) + this.padding * 2;
	this.height = Math.roundTo(d[1],16);
	this.position.x = x - 0.5 * this.width;
	this.position.y = y - 0.5 * this.height;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			var dir = this.position.subtract(obj.position);
			if(obj.states.rolling && obj.dodgeFlash){
				if((obj.flip && dir.x < 0) || (!obj.flip && dir.x > 0)){
					this.break();
				}
			}
		}
	});
}
SpeedTile.prototype.break = function(){
	var right = (this.position.x + this.width) - this.padding * 2;
	var bottom = this.position.y + this.height;
	
	for(var x = this.position.x + this.padding; x < right; x+=16){
		for(var y = this.position.y; y < bottom; y+=16){
			game.setTile(x,y,game.tileCollideLayer,0);
		}
	}
	
	game.addObject(new EffectExplosion(this.position.x + this.width * 0.5, this.position.y + this.height * 0.5,"crash"));
	this.destroy();
}

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

 /* platformer\transition.js*/ 

Tranistion.prototype = new GameObject();
Tranistion.prototype.constructor = GameObject;
function Tranistion(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.zIndex = 99;
	this.frame = new Point(0,3);
	this.sprite = "doors"
	
	this.active = 0;
	this.time = 0.0;
	
	if("map" in ops){
		this.map = ops["map"];
	}
	if("start" in ops) {
		this.start = ops["start"];
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(!this.active){
				audio.play("open", this.position);
				Background.setTint([0,0,0,1],Game.DELTASECOND);
			}
			this.active = 1;
		}
	});
}

Tranistion.prototype.update = function(){
	if(this.active){
		game.pause = true;
		this.time += game.deltaUnscaled;
		this.frame.x = Math.min(this.frame.x + game.deltaUnscaled * 0.5, 3);
		
		if(this.time > Game.DELTASECOND){
			WorldLocale.loadMap(this.map, this.start, function(){
				Background.setTint([1.0,1.0,1.0,1.0],Game.DELTASECOND * 0.2);
				game.pause = false;
			});
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
	this.blockOnboard = new Array();
	
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
	this.on("collideTop", function(obj){
		if(this.blockOnboard.indexOf(obj) < 0){
			this.blockOnboard.push(obj);
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

Treads.prototype.update = function(){
	if(this.block_isOnboard(_player)){
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
	this.blockOnboard = new Array();
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

Gears.prototype = new GameObject();
Gears.prototype.constructor = GameObject;
function Gears(x,y,d,ops){
	this.constructor();
	this.position.x = x - d[0] * 0.5;
	this.position.y = y - d[1] * 0.5;
	this.origin = new Point();
	this.zIndex = 1;
	this.width = d[0];
	this.height = 64;
	this.frame = new Point(0,0);
	this.sprite = "gear1"
	
	this.speed = 0.4;
	this.startX = this.position.x;
	this.moveStart = 0;
	this.moveEnd = 0;
	
	this.duckForce = 1.5;
	this.turnTransfer = 0.7;
	this.turnForce = 0.0;
	this.turnForceMax = 4.0;
	this.turnForceDrag = 0.05;
	this.turnObjectMove = 0.3;
	
	if("start" in ops){
		this.moveStart = ops["start"] * 1;
	}
	if("end" in ops){
		this.moveEnd = ops["end"] * 1;
	}
	
	this.forwardDirection = this.moveEnd > 0 ? 1 : -1;
	
	this.on("collideObject", function(obj){
		if(obj.hasModule(mod_rigidbody)){
			if(obj.force.y > 0){
				var fallThreshold = obj.states.duck ? 8 : 14;
				if(obj.position.y + fallThreshold < this.position.y + this.height){
					obj.position.y -= this.turnForce * this.delta * this.turnObjectMove;
					obj.trigger( "collideVertical", 1);
				}
			}
		
			if(obj instanceof Player){
				this.turnForce += obj.force.x * this.delta * this.turnTransfer;
				this.turnForce = Math.max(Math.min(this.turnForce, this.turnForceMax),-this.turnForceMax);
				
				if(obj.states.duck){
					obj.position.y += this.delta * this.duckForce;
				}
			}
		}
	});
	
	this.on("player_death", function(){
		this.position.x = this.startX;
	});
}

Gears.prototype.update = function(){
	
	if(this.turnForce == 0){
		
	} else {
		var f = (this.turnForce > 0 && this.forwardDirection > 0) || (this.turnForce < 0 && this.forwardDirection < 0);
		if(f){
			//Going towards end
			this.position.x += this.forwardDirection * Math.abs(this.turnForce) * this.speed * this.delta;
			var dif = this.position.x - this.startX;
			if((this.forwardDirection < 0 && dif < this.moveEnd) || (this.forwardDirection > 0 && dif > this.moveEnd)){
				this.position.x = this.startX + this.moveEnd;
				this.turnForce = 0;
			}
		} else {
			//Going towards start
			this.position.x -= this.forwardDirection * Math.abs(this.turnForce) * this.speed * this.delta;
			var dif = this.position.x - this.startX;
			if((this.forwardDirection > 0 && dif < this.moveStart) || (this.forwardDirection < 0 && dif > this.moveStart)){
				this.position.x = this.startX + this.moveStart;
				this.turnForce = 0;
			}
		}
	}
	
	this.frame.x = Math.mod(this.frame.x - this.turnForce * 0.1 * this.delta,5);
	this.turnForce *= 1 - (this.turnForceDrag * this.delta);
}

Gears.prototype.render = function(g,c){
	for(var i=0; i < this.width; i+= 16) {
		var f = new Point((this.frame.x+i) % 5, 0);
		g.renderSprite(this.sprite,this.position.add(new Point(i,0)).subtract(c), this.zIndex, f, false);
	}
}

 /* platformer\tree.js*/ 

Tree.prototype = new GameObject();
Tree.prototype.constructor = GameObject;
function Tree(x, y, d){
	this.constructor();
	this.position.x = x;
	this.position.y = y + d[1] * 0.5;
	this.width = 112;
	this.sprite = "trees";
	this.zIndex = 2;
	
	this.frame.x = 0;
	this.frame.y = 1;
	this.windInOutSpeed = 0.01;
	this.windSpeed = 0.125;
	this.windStrength = 1.5;
	this.distanceVariation = 0.05;
}

	
Tree.prototype.render = function(g,c){}
	
Tree.prototype.prerender = function(g,c){
	//Trunk
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(1,0),this.flip);
	g.renderSprite(this.sprite,this.position.add(new Point(0,-48)).subtract(c),this.zIndex,new Point(0,0),this.flip);
	
	//Leaves
	for(var i=0; i < Tree.leavesPositions.length; i++){
		var t = game.timeScaled;
		var pos = Tree.leavesPositions[i].add(new Point(this.forward()*16,0));
		var d = 0.75 + (i / Tree.leavesPositions.length) * 0.25;
		var color = [Math.lerp(0.5,1,d),Math.lerp(0.6,1,d),Math.lerp(0.7,1,d),1.0];
		var posV = (pos.x + pos.y * 0.2) * this.distanceVariation;
		var wind = 1 + Math.sin(t * this.windInOutSpeed) * 0.5;
		var offset = pos.add(new Point(
			wind * this.windStrength * Math.sin(posV + t * this.windSpeed),
			wind * this.windStrength * Math.cos(posV + t * this.windSpeed) * 0.25
		));
		
		g.renderSprite(this.sprite,this.position.add(offset).subtract(c),this.zIndex,this.frame,false,{"u_color":color});
	}
	
}
Tree.leavesPositions = [
	new Point(-28,-40),
	new Point(28,-40),
	new Point(0,-32),
	new Point(0,-80),
	new Point(-18,-68),
	new Point(18,-68),
	new Point(0,-56),
];

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
	
	if("triggersave" in o){
		this.triggersave = o["triggersave"];
		if(NPC.get(this.triggersave)){
			this.trigger("activate");
		}
	}
	
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
			if(obj instanceof GameObject){
				if("_tid" in obj && obj._tid == name){
					out.push(obj);
				}
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
		
	o = o || {};
	this.team = 0;
	this.lifeMax = this.life = 1;
	this.defencePhysical = 0;
	this.defenceFire = 0;
	this.defenceSlime = 0;
	this.defenceIce = 0;
	this.defenceLight = 0;
	
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
AttackTrigger.prototype.hurt = function(obj,damage){
	if(this.life > 0){
		var flatDamage = Combat.calcDamage.apply(this,[damage]);
		this.life -= flatDamage;
		this.trigger("hurt", obj, flatDamage);
		if(this.life <= 0){
			this.trigger("death");
		}
	}
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
	this.frame.x = 0;
	this.frame.y = 0;
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
	});
	
	this.render = function(g,c){
		this.frame.x = this.triggerCount > 0 ? 1 : 0;
		
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

class PressureSwitch extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.sprite = "switch_pressure";
		this.playerover = false;
		this.frame = new Point(0,0);
		this.targets = new Array();
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(obj.grounded){
					this.press();
				}
			}
		});
		
		if("target" in ops){
			this.targets = ops.target.split(",");
		}
	}
	
	press(){
		if(!this.playerover){
			Trigger.activate(this.targets);
			this.playerover = true;
		}
	}
	
	update(){
		if(this.playerover){
			this.frame.x = Math.min(this.frame.x + this.delta * 0.5, 2);
			this.playerover = false;
		} else {
			this.frame.x = Math.max(this.frame.x - this.delta * 0.5, 0);
		}
	}
}

self["PressureSwitch"] = PressureSwitch;

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

 /* platformer\walker.js*/ 

Walker.prototype = new GameObject();
Walker.prototype.constructor = GameObject;
function Walker(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 24;
	this.sprite = "walker";
	this.speed = 0.35;
	this.speedBoost = 30.0;
	this.zIndex = 13;
	this.start = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.seatObj = new GameObject(x,y);
	this.seatObj.width = 32;
	this.seatObj.height = 16;
	this.seatObj.addModule( mod_block );
	//this.seatObj.visible = false;
	
	this.life = 256;
	
	
	this.mass = 1.0;
	this.pushable = false;
	this.gravity = 0.4;
	
	this.stepAnim = 0.0;
	this.standTime = 0.0;
	this.walkerID = false;
	this._wasOnboard = false;
	this.isCharging = false;
	
	this.on("collideObject",function(obj){
		if(obj instanceof Player){
			this.seatObj.trigger("collideObject", obj);
			obj.trigger("collideObject", this.seatObj);
		} else if(obj instanceof PressureSwitch){
			obj.press();
		} else if(obj.hasModule(mod_combat)){
			if(this.isCharging){
				var d = Combat.getDamage();
				d.fixed = Math.min(obj.life, this.life);
				obj.hurt(this, d);
			}
		}
	});
	this.on("hurt_other", function(obj, damage){
		this.life -= damage;
	});
	this.on("sleep", function(){
		if(this.walkerID){
			this.destroy();
		} else {
			this.position.x = this.start.x;
			this.position.y = this.start.y;
		}
	})
	this.on("getOff", function(obj){
		obj.force.x = this.force.x;
	});
	this.on("destroy", function(){
		this.seatObj.destroy();
	});
}
Walker.prototype.update = function(){
	var progress = this.standTime / Walker.STAND_TIME;
	this.isCharging = false;
	
	if(this.seatObj.block_isOnboard(_player)){
		this._wasOnboard = _player;
		if(this.standTime < Walker.STAND_TIME){
			//standing up
			this.frame = Walker.anim_stand.frame(progress);
			this.standTime = Math.min(this.standTime+this.delta, Walker.STAND_TIME);
			_player.position.x = Math.lerp(_player.position.x, this.position.x, progress);
		} else {
			//Player on board
			if(input.state("dodge") > 0){
				this.force.x = this.forward() * this.speedBoost;
				this.isCharging = true;
				game.slow(0.35,3);
				
				this.frame.x = 0;
				this.frame.y = 3;
				
			} else {				
				if(input.state("left") > 0){
					this.force.x -= this.speed * this.delta;
					this.flip = true;
				}
				if(input.state("right") > 0){
					this.force.x += this.speed * this.delta;
					this.flip = false;
				}
				
				this.stepAnim = (this.stepAnim + this.delta * Math.abs(this.force.x) * 0.2) % 6;
				this.frame.x = this.stepAnim % 3;
				this.frame.y = this.stepAnim / 3;
			}
			
			
			
			_player.position.x = this.position.x;
			_player.force.x = 0;
			
			if(Math.abs(this.force.x) < 0.1){
				this.stepAnim = 0.0;
			}
		}
	} else {
		//Sitting down
		this.frame = Walker.anim_stand.frame(progress);
		this.standTime = Math.max(this.standTime - this.delta, 0);
		
		if(this._wasOnboard){
			this.trigger("getOff", this._wasOnboard);
			this._wasOnboard = false;
		}
	}
	
	//Change seat position
	this.seatObj.fullUpdate();
	this.seatObj.position.x = this.position.x;
	this.seatObj.position.y = this.position.y - (progress*8.0);
}

Walker.STAND_TIME = Game.DELTASECOND * 0.5;
Walker.anim_stand = new Sequence([
	[2,2,0.333],
	[1,2,0.333],
	[0,2,0.333]
]);

class Cart extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.start = new Point(x,y);
		this.sprite = "walker";
		
		this.width = 24;
		this.height = 24;
		this.frame = new Point(3,0);
		this.speed = 3;
		this.damage = 10;
		this.stunTime = Game.DELTASECOND * 0.125;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_block);
		
		this.pushable = false;
		this.friction = 0.2;
		this.moving = false;
		
		this.on("spellFlash", function(spell){
			this.moving = true;
		});
		this.on("collideHorizontal", function(v){
			this.moving = false;
		});
		this.on("sleep", function(){
			this.position.x = this.start.x;
			this.position.y = this.start.y;
			this.force = new Point();
			this.moving = false;
		})
		this.on("collideObject", function(obj){
			if(this.moving && obj.hasModule(mod_combat)){
				
				if(obj.life > 0){
					var topY = this.position.y - this.height * 0.5 + 1;
					var botY = obj.position.y + this.origin.y * this.height;
					
					if(topY < botY && this.delta > 0){
						obj.invincible = 0;
						obj.hurt(this, this.damage);
					}
				}
			}
		});
		this.on("hurt_other", function(obj, damage){
			game.slow(0,this.stunTime);
		});
		
		this.flip = ops.getBool("flip", false);
	}
	update(){
		if(this.moving){
			this.force.x += this.forward() * this.speed * this.delta;
		}
	}
}
self["Cart"] = Cart;

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

 /* platformer\wip.js*/ 

WIP.prototype = new GameObject();
WIP.prototype.constructor = GameObject;
function WIP(x, y, d, o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 48;
	this.height = 48;
	this.sprite = "wip";
	this.zIndex = 1;
}
WIP.prototype.render = function(g,c){
	let rad = 80 + Math.abs(Math.sin(game.timeScaled * 0.1)) * 80;
	Background.pushLight(this.position.subtract(new Point(16,12)), rad, COLOR_FIRE);
	GameObject.prototype.render.apply(this,[g,c]);
}

 /* platformer\worldmap.js*/ 

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
WorldLocale.currentMapName = null;
WorldLocale.loadMap = function(map, start, callback){
	//Save current map reveal first
	var pm = game.getObject(PauseMenu);
	if(pm instanceof PauseMenu) {
		pm.saveMapReveal();
	}
	
	_player.keys = new Array();
	PauseMenu.mapIcons = new Array();
	
	var file = map;
	game.loadMap(file, function(starts){
		WorldLocale.currentMapName = map;
		
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
		
		if(callback instanceof Function){
			callback.apply(self, [map]);
		}
	});
}
WorldLocale.save = function(){
	var q = {}
	var i = 0;
	while("q"+i in Quests){
		q["q"+i] = Quests["q"+i];
		i++;
	}
	
	var location = {
		"map" : game.newmapName,
		"x" : _player.position.x,
		"y" : _player.position.y
		
	}
	
	var data = {
		"savedate" : new Date * 1,
		"quests" : q,
		"location" : location,
		"variables" : NPC.variables,
		"player" : _player.toJson(),
		"settings" : Settings
	}
	
	game.save(data);
}
WorldLocale.profile = 0;
WorldLocale.load = function(){
	game.load(function(data){
		if(data){
			new Player();
			_player.fromJson(data.player);
			
			NPC.variables = data.variables;
			
			game.loadMap(data.location.map, function(starts){
				_player.position.x = data.location.x;
				_player.position.y = data.location.y;
				
				game.addObject(_player);
				game.addObject(new PauseMenu(0,0));
				game.addObject(new Background(0,0));
			});
		}
		
	}, WorldLocale.profile);
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

 /* platformer\scenes\temple4warp.js*/ 

Temple4warp.prototype = new GameObject();
Temple4warp.prototype.constructor = GameObject;
function Temple4warp(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	
	this.active = false;
	
	this.progress = 0.0;
	this.progressTotal = Game.DELTASECOND;
	this.phase = 0;
	
	this.camera = new Point(this.position.x+64,this.position.y-1632)
	
	this.on("struck",function(obj,pos,damage){
		if( !this.active && obj instanceof Player ) {
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
		}
	});
}
Temple4warp.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		
		if(this.phase == 0){
			if(this.progress >= this.progressTotal){
				this.progress = 0;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
			}
		} else if( this.phase == 1 ) {
			//Fade out
			var p = this.progress / this.progressTotal;
			Renderer.tint = [1-p,1-p,1-p,1];
			if(this.progress >= this.progressTotal){
				this.progress = -Game.DELTASECOND * 0.5;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
				_player.destroy();
			}
		} else if( this.phase == 2 ) {
			//Fade in
			var p = Math.max(this.progress / this.progressTotal,0);
			Renderer.tint = [p,p,p,1];
			
			game.camera.x = this.camera.x - game.resolution.x * 0.5;
			game.camera.y = this.camera.y + game.resolution.y * 0.5;
			
			if(this.progress >= this.progressTotal){
				this.progress = -Game.DELTASECOND * 1.5;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
			}
		} else if (this.phase == 3){
			if(this.progress > 0){
				var shake = new Point(Math.random()*5,Math.random()*5);
				game.camera.x = this.camera.x - game.resolution.x * 0.5 + shake.x;
				game.camera.y = this.camera.y + game.resolution.y * 0.5 + shake.y;
			}
			if(this.progress >= this.progressTotal){
				this.progress = 0;
				this.progressTotal = Game.DELTASECOND * 1.2;
				this.phase++;
			}
		}  else if( this.phase == 4 ) {
			//Fade out
			var p = this.progress / this.progressTotal;
			Renderer.tint = [1-p,1-p,1-p,1];
			game.camera.y -= game.deltaUnscaled * p * 40;
			if(this.progress >= this.progressTotal){
				this.phase++;
			}
		} else {
			game.pause = false;
			var pausemenu = game.getObject(PauseMenu);
			var currentMapReveal = pausemenu.map_reveal;
			WorldLocale.loadMap("temple4b.tmx","warp",function(){
				Renderer.tint = [1,1,1,1];
				var pausemenu = game.getObject(PauseMenu);
				var mapw = Math.floor(game.map.width/16);
				for(var i=0; i < currentMapReveal.length; i++){
					if(currentMapReveal[i] > 0){
						if(i>mapw*2&&i<mapw*10&&i%mapw>7&&i%mapw<27){
							pausemenu.map_reveal[i+mapw*2] = 1;
						} else {
							pausemenu.map_reveal[i] = 1;
						}
					}
				}
			});
		}
		
		this.progress += game.deltaUnscaled;
	}
}
Temple4warp.prototype.idle = function(){}
Temple4warp.prototype.render = function(g,c){
	g.color = COLOR_LIGHTNING;
	g.scaleFillRect(
		(this.position.x - this.origin.x * this.width) - c.x,
		(this.position.y - this.origin.y * this.height) - c.y,
		this.width,	this.height
	);
	Background.pushLight(this.position,300,COLOR_LIGHTNING);
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

 /* platformer\animations\axedog.janim*/ 

self.spriteWrap["axedog"] = new SpriteWrapper({"name":"axedog","sprite":"axedog.png","data":{"0":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}],"1":[{"x":19,"y":11,"u":43,"v":48,"type":0,"rotation":0}],"2":[{"x":19,"y":11,"u":43,"v":48,"type":0,"rotation":0}]},"1":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}],"1":[{"x":21,"y":11,"u":46,"v":48,"type":0,"rotation":0},{"x":46,"y":11,"u":62,"v":48,"type":2,"rotation":0}],"2":[{"x":19,"y":11,"u":43,"v":48,"type":0,"rotation":0}]},"2":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}],"1":[{"x":21,"y":11,"u":46,"v":48,"type":0,"rotation":0},{"x":46,"y":11,"u":62,"v":48,"type":2,"rotation":0}]},"3":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}],"1":[{"x":21,"y":11,"u":46,"v":48,"type":0,"rotation":0}]},"4":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}]},"5":{"0":[{"x":21,"y":11,"u":45,"v":48,"type":0,"rotation":0}]}},"animation":[{"name":"walk","time":0.8,"frames":[{"x":0,"y":0,"t":0.125},{"x":0,"y":1,"t":0.125},{"x":0,"y":2,"t":0.125},{"x":0,"y":3,"t":0.125},{"x":0,"y":4,"t":0.125},{"x":0,"y":5,"t":0.125}]},{"name":"attack","time":2,"frames":[{"x":1,"y":0,"t":0.75},{"x":1,"y":1,"t":0.0625},{"x":1,"y":2,"t":0.0625},{"x":1,"y":3,"t":0.625}]},{"name":"hurt","time":1,"frames":[{"x":2,"y":0,"t":0.125}]}],"slicex":64,"slicey":48,"offsetx":"32","offsety":"33"});



 /* platformer\animations\player.janim*/ 

self.spriteWrap["player"] = new SpriteWrapper({"name":"player","sprite":"player.png","data":{"0":{"0":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"1":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"2":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"3":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"4":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"5":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"6":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"7":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"8":[{"x":19,"y":29,"u":46,"v":61,"type":0,"rotation":0},{"x":43,"y":45,"u":57,"v":61,"type":3,"rotation":0}],"9":[{"x":19,"y":34,"u":46,"v":61,"type":0,"rotation":0},{"x":43,"y":45,"u":57,"v":61,"type":3,"rotation":0}],"10":[{"x":19,"y":34,"u":46,"v":61,"type":0,"rotation":0},{"x":43,"y":45,"u":57,"v":61,"type":3,"rotation":0}]},"1":{"0":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"1":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"2":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"3":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"4":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"5":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"6":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"7":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"8":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"9":[{"x":19,"y":29,"u":46,"v":64,"type":0,"rotation":0},{"x":43,"y":37,"u":57,"v":53,"type":3,"rotation":0}],"10":[{"x":21,"y":26,"u":45,"v":64,"type":0,"rotation":0}]},"2":{"1":[{"x":21,"y":37,"u":45,"v":63,"type":0,"rotation":0}],"2":[{"x":21,"y":37,"u":45,"v":63,"type":0,"rotation":0}],"3":[{"x":21,"y":37,"u":45,"v":63,"type":0,"rotation":0}],"4":[{"x":21,"y":37,"u":45,"v":63,"type":0,"rotation":0}],"6":[{"x":25,"y":28,"u":46,"v":64,"type":0,"rotation":0}],"7":[{"x":27,"y":28,"u":47,"v":64,"type":0,"rotation":0}],"8":[{"x":27,"y":28,"u":48,"v":64,"type":0,"rotation":0}],"9":[{"x":25,"y":33,"u":48,"v":64,"type":0,"rotation":0}]},"3":{"0":[{"x":20,"y":25,"u":42,"v":64,"type":0,"rotation":0}],"1":[{"x":22,"y":27,"u":44,"v":60,"type":0,"rotation":0},{"x":29,"y":51,"u":39,"v":74,"type":2,"rotation":0}],"2":[{"x":22,"y":28,"u":44,"v":60,"type":0,"rotation":0},{"x":29,"y":51,"u":39,"v":74,"type":2,"rotation":0}],"3":[{"x":20,"y":29,"u":46,"v":62,"type":0,"rotation":0}],"4":[{"x":20,"y":32,"u":46,"v":64,"type":0,"rotation":0}],"5":[{"x":20,"y":32,"u":44,"v":64,"type":0,"rotation":0}],"6":[{"x":20,"y":32,"u":44,"v":64,"type":0,"rotation":0}],"7":[{"x":19,"y":32,"u":44,"v":64,"type":0,"rotation":0}],"8":[{"x":20,"y":32,"u":43,"v":64,"type":0,"rotation":0}]},"4":{"0":[{"x":21,"y":31,"u":45,"v":64,"type":0,"rotation":0}],"1":[{"x":21,"y":31,"u":45,"v":64,"type":0,"rotation":0},{"x":45,"y":35,"u":72,"v":46,"type":2,"rotation":0}],"2":[{"x":21,"y":31,"u":45,"v":64,"type":0,"rotation":0},{"x":45,"y":35,"u":65,"v":46,"type":2,"rotation":0}],"3":[{"x":21,"y":31,"u":45,"v":64,"type":0,"rotation":0}],"4":[{"x":21,"y":31,"u":45,"v":64,"type":0,"rotation":0}],"5":[{"x":16,"y":31,"u":40,"v":64,"type":0,"rotation":0},{"x":20,"y":38,"u":68,"v":46,"type":2,"rotation":0}],"6":[{"x":18,"y":31,"u":42,"v":64,"type":0,"rotation":0}],"7":[{"x":18,"y":32,"u":39,"v":64,"type":0,"rotation":0}],"8":[{"x":21,"y":31,"u":41,"v":64,"type":0,"rotation":0}],"9":[{"x":21,"y":31,"u":41,"v":64,"type":0,"rotation":0},{"x":54,"y":41,"u":85,"v":49,"type":2,"rotation":0}],"10":[{"x":21,"y":31,"u":41,"v":64,"type":0,"rotation":0}]},"5":{"0":[{"x":21,"y":28,"u":46,"v":64,"type":0,"rotation":0}],"1":[{"x":21,"y":28,"u":46,"v":64,"type":0,"rotation":0}],"2":[{"x":25,"y":28,"u":50,"v":64,"type":0,"rotation":0},{"x":50,"y":40,"u":77,"v":54,"type":2,"rotation":0}],"3":[{"x":27,"y":28,"u":52,"v":64,"type":0,"rotation":0},{"x":51,"y":36,"u":69,"v":45,"type":2,"rotation":0}],"4":[{"x":27,"y":28,"u":52,"v":64,"type":0,"rotation":0}],"6":[{"x":26,"y":31,"u":46,"v":64,"type":0,"rotation":0}],"8":[{"x":24,"y":25,"u":44,"v":62,"type":0,"rotation":0},{"x":44,"y":55,"u":64,"v":62,"type":2,"rotation":0}],"9":[{"x":24,"y":25,"u":44,"v":62,"type":0,"rotation":0},{"x":44,"y":7,"u":64,"v":53,"type":2,"rotation":0}],"10":[{"x":24,"y":25,"u":44,"v":62,"type":0,"rotation":0},{"x":44,"y":7,"u":64,"v":25,"type":2,"rotation":0}],"11":[{"x":24,"y":25,"u":44,"v":62,"type":0,"rotation":0}]},"6":{"0":[{"x":26,"y":18,"u":41,"v":62,"type":0,"rotation":0}],"1":[{"x":26,"y":18,"u":41,"v":62,"type":0,"rotation":0}],"2":[{"x":26,"y":18,"u":41,"v":55,"type":0,"rotation":0}],"7":[{"x":19,"y":23,"u":41,"v":61,"type":0,"rotation":0}]},"7":{"2":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}],"3":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}],"4":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}],"5":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}],"6":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}],"7":[{"x":24,"y":21,"u":46,"v":64,"type":0,"rotation":0}]},"8":{"1":[{"x":21,"y":28,"u":46,"v":64,"type":0,"rotation":0}]},"9":{"0":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0}],"1":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0}],"2":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0}],"3":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0},{"x":56,"y":46,"u":83,"v":54,"type":2,"rotation":0}],"4":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0},{"x":51,"y":46,"u":78,"v":54,"type":2,"rotation":0}],"5":[{"x":18,"y":36,"u":44,"v":61,"type":0,"rotation":0}]},"10":{"2":[{"x":21,"y":28,"u":46,"v":64,"type":0,"rotation":0}],"10":[{"x":21,"y":28,"u":46,"v":64,"type":0,"rotation":0}]},"11":{"0":[{"x":20,"y":26,"u":44,"v":64,"type":0,"rotation":0}],"1":[{"x":22,"y":27,"u":44,"v":62,"type":0,"rotation":0},{"x":22,"y":51,"u":41,"v":74,"type":2,"rotation":0}],"2":[{"x":22,"y":27,"u":44,"v":60,"type":0,"rotation":0},{"x":32,"y":51,"u":47,"v":74,"type":2,"rotation":0}],"3":[{"x":22,"y":27,"u":44,"v":62,"type":0,"rotation":0}]}},"animation":[{"name":"run","time":0.6,"frames":[{"x":0,"y":1,"t":0.125},{"x":1,"y":1,"t":0.125},{"x":2,"y":1,"t":0.125},{"x":3,"y":1,"t":0.125},{"x":4,"y":1,"t":0.125},{"x":5,"y":1,"t":0.125},{"x":6,"y":1,"t":0.125},{"x":7,"y":1,"t":0.125},{"x":8,"y":1,"t":0.125},{"x":9,"y":1,"t":0.125}]},{"name":"idle","time":1.5,"frames":[{"x":0,"y":0,"t":0.125},{"x":1,"y":0,"t":0.25},{"x":2,"y":0,"t":0.375},{"x":3,"y":0,"t":0.125},{"x":4,"y":0,"t":0.25},{"x":5,"y":0,"t":0.375}]},{"name":"turn","time":0.6,"frames":[{"x":3,"y":3,"t":0.125},{"x":4,"y":3,"t":0.125},{"x":5,"y":3,"t":0.125},{"x":6,"y":3,"t":0.125},{"x":7,"y":3,"t":0.125},{"x":8,"y":3,"t":0.125}]},{"name":"attack6","time":0.5,"frames":[{"x":0,"y":11,"t":0.125},{"x":1,"y":11,"t":0.1875},{"x":2,"y":11,"t":0.1875},{"x":3,"y":11,"t":0.25}]},{"name":"attack5","time":0.5,"frames":[{"x":1,"y":9,"t":0.125},{"x":2,"y":9,"t":0.125},{"x":3,"y":9,"t":0.5},{"x":4,"y":9,"t":0.125},{"x":5,"y":9,"t":0.125}]},{"name":"attack0","time":0.5,"frames":[{"x":0,"y":4,"t":0.125},{"x":1,"y":4,"t":0.125},{"x":2,"y":4,"t":0.25},{"x":3,"y":4,"t":0.375}]},{"name":"attack1","time":0.5,"frames":[{"x":4,"y":4,"t":0.25},{"x":5,"y":4,"t":0.125},{"x":6,"y":4,"t":0.5}]},{"name":"attack2","time":0.5,"frames":[{"x":7,"y":4,"t":0.25},{"x":8,"y":4,"t":0.125},{"x":9,"y":4,"t":0.125},{"x":10,"y":4,"t":0.375}]},{"name":"attack3","time":0.5,"frames":[{"x":0,"y":5,"t":0.25},{"x":1,"y":5,"t":0.125},{"x":2,"y":5,"t":0.125},{"x":3,"y":5,"t":0.125},{"x":4,"y":5,"t":0.25}]},{"name":"attack4","time":0.5,"frames":[{"x":6,"y":5,"t":0.25},{"x":8,"y":5,"t":0.15625},{"x":9,"y":5,"t":0.15625},{"x":10,"y":5,"t":0.15625},{"x":11,"y":5,"t":0.15625}]},{"name":"grab","time":1,"frames":[{"x":0,"y":6,"t":0.15625},{"x":1,"y":6,"t":0.15625},{"x":2,"y":6,"t":0.4375}]},{"name":"jump2","time":0.25,"frames":[{"x":1,"y":2,"t":0.15625},{"x":2,"y":2,"t":0.15625},{"x":3,"y":2,"t":0.15625},{"x":4,"y":2,"t":0.15625}]},{"name":"duck","time":0.5,"frames":[{"x":8,"y":0,"t":0.15625},{"x":9,"y":0,"t":0.15625},{"x":10,"y":0,"t":0.3125}]},{"name":"dash","time":1,"frames":[{"x":1,"y":8,"t":0.15625},{"x":10,"y":10,"t":0.15625},{"x":2,"y":10,"t":0.625},{"x":1,"y":5,"t":0.15625}]},{"name":"spell","time":1,"frames":[{"x":2,"y":7,"t":0.15625},{"x":3,"y":7,"t":0.3125},{"x":4,"y":7,"t":0.15625},{"x":5,"y":7,"t":0.15625},{"x":6,"y":7,"t":0.15625},{"x":7,"y":7,"t":0.15625}]},{"name":"new_anim","time":1,"frames":[{"x":1,"y":11,"t":1}]}],"slicex":64,"slicey":64,"offsetx":"32","offsety":"49"});



 /* platformer\animations\slimerilla.janim*/ 

self.spriteWrap["slimerilla"] = new SpriteWrapper({"name":"slimerilla","sprite":"slimerilla.gif","data":{"0":{"0":[{"x":39,"y":18,"u":63,"v":64,"type":0,"rotation":0}],"1":[{"x":39,"y":18,"u":63,"v":64,"type":0,"rotation":0}],"2":[{"x":39,"y":18,"u":63,"v":64,"type":0,"rotation":0}]},"1":{"0":[{"x":32,"y":17,"u":61,"v":64,"type":0,"rotation":0}],"1":[{"x":37,"y":21,"u":64,"v":64,"type":0,"rotation":0},{"x":29,"y":0,"u":96,"v":64,"type":2,"rotation":0}],"2":[{"x":37,"y":21,"u":64,"v":64,"type":0,"rotation":0}],"3":[{"x":37,"y":21,"u":64,"v":64,"type":0,"rotation":0}]},"2":{"0":[{"x":39,"y":21,"u":63,"v":64,"type":0,"rotation":0}],"1":[{"x":39,"y":21,"u":63,"v":64,"type":0,"rotation":0}],"2":[{"x":39,"y":21,"u":63,"v":64,"type":0,"rotation":0}],"3":[{"x":39,"y":21,"u":63,"v":64,"type":0,"rotation":0}]},"3":{"0":[{"x":39,"y":21,"u":63,"v":64,"type":0,"rotation":0}],"1":[{"x":39,"y":20,"u":63,"v":63,"type":0,"rotation":0}],"2":[{"x":39,"y":19,"u":63,"v":62,"type":0,"rotation":0}],"3":[{"x":35,"y":32,"u":66,"v":64,"type":0,"rotation":0}]}},"animation":[{"name":"idle","time":2,"frames":[{"x":0,"y":0,"t":0.125},{"x":1,"y":0,"t":0.125},{"x":2,"y":0,"t":0.125},{"x":1,"y":0,"t":0.125}]},{"name":"attack","time":3,"frames":[{"x":0,"y":1,"t":1.0625},{"x":1,"y":1,"t":0.0625},{"x":2,"y":1,"t":0.0625},{"x":3,"y":1,"t":0.625}]},{"name":"appear","time":0.8,"frames":[{"x":0,"y":4,"t":0.125},{"x":1,"y":4,"t":0.125},{"x":2,"y":4,"t":0.125},{"x":2,"y":3,"t":0.28125},{"x":3,"y":3,"t":0.125},{"x":0,"y":0,"t":0.125}]},{"name":"walk","time":0.5,"frames":[{"x":0,"y":2,"t":0.25},{"x":1,"y":2,"t":0.25},{"x":2,"y":2,"t":0.25},{"x":3,"y":2,"t":0.25}]}],"slicex":96,"slicey":64,"offsetx":"48","offsety":"48"});

