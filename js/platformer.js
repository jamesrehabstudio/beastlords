

 /* platformer/alter.js*/ 

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
	
	var tresure = dataManager.randomTreasure(Math.random(),["shop","chest"]);
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
		boxArea(g,16,48,224,64);
		textArea(g,this.message[0],32,64,192,64);
		
		
		boxArea(g,16,120,64,56);
		textArea(g," Yes",32,136);
		textArea(g," No",32,152);
		
		sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
	}
}

 /* platformer/arena.js*/ 

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
		var treasure = dataManager.randomTreasure(Math.random(),["shop","chest"]); 
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
						var x_off = i*(240/current_wave.count)-120;
						var enemy_list = current_temple[current_wave["type"]];
						var enemy_name = enemy_list[Math.floor(Math.random()*enemy_list.length)];
						var enemy = new window[enemy_name](this.position.x+x_off, this.position.y);
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

 /* platformer/background.js*/ 

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
Background.prototype.prerender = function(g,c){
	var screen_width = 256;
	var screen_height = 240;
	var c_x = c.x%screen_width;
	if(c.x < 0 && c_x != 0) c_x = screen_width+c_x;
	var offset = 8 + c_x * 0.0625;
	var room_off = c_x > 128 ? -2 : -1;
	var room_matrix_index = new Point(Math.floor(c.x/screen_width), Math.floor(c.y/screen_height));
	var rooms = [
		this.roomAtLocation(room_matrix_index.x - (room_off), room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x - (room_off+1), room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x - (room_off+2), room_matrix_index.y)
	];
	
	if( room_matrix_index.y > 0 && this.walls ) {
		//Background wall
		for(x=0; x < 18; x++) for(y=0; y < 15; y++) {
			var tile = 104 + (y%2==1?16:0) + (x%2==1?1:0);
			var pos_x = x*16 - ((c_x/2) % 32);
			this.sprite.render(g, new Point(pos_x, y*16), tile );
		}
	} else {
		//Clouds
		var sky_offset = this.animation / 20.0;
		var sky_tile_offset = Math.floor(sky_offset/16);
		for(l=0; l < 17; l++) for(x=0; x < 17; x++) for(y=0; y < 2; y++) {
			var y_offset = Math.min( 4 * Math.abs( room_matrix_index.y ), 32);
			var c_x_minus = c.x - game.bounds.start.x;
			//layer 3
			if(l==0) this.sprite.render(g, new Point(x*16-((c_x_minus*0.025)%16), 168+y*16), 202+(y*16) );
			//layer 2
			if(l==1) this.sprite.render(g, new Point(x*16-((c_x_minus*0.125)%16), (y_offset*0.5)+176+y*16), 201+(y*16) );
			//layer 1
			if(l==2) this.sprite.render(g, new Point(x*16-((c_x_minus*0.333)%16), (y_offset*2)+184+y*16), 200+(y*16) );
			
			var tile = 224 + 8+((x+sky_tile_offset)%8) + 16*y;
			if(l==3) this.sprite.render(g, new Point(x*16-(sky_offset%16), 144+y*16), tile );
		}
	}
	
	if(this.walls ) for(var i=0; i < rooms.length; i++) {
		if( rooms[i] >= 0 && rooms[i] < this.backgrounds.length ) {
			for(x=0; x < 15; x++) for(y=0; y < 15; y++) {
				var index = x + Math.floor(y*15);
				var tile = this.backgrounds[rooms[i]].tiles[index];
				var pos_x = (x*16-(c_x-offset)) - ((i+room_off)*(screen_width-16));
				
				if( tile > 0 ){
					this.sprite.render(g, new Point(pos_x, y*16), tile-1 );
				}
			}
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
		} else if( code in dataManager.room_matrix ) {
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

 /* platformer/boss_ammit.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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

 /* platformer/boss_chort.js*/ 

Chort.prototype = new GameObject();
Chort.prototype.constructor = GameObject;
function Chort(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 28;
	this.height = 56;
	this.sprite = sprites.pigboss;
	this.speed = .1;
	this.active = false;
	this.start_x = x;
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(26);
	this.collideDamage = 5;
	this.damage = dataManager.damage(4);
	this.landDamage = dataManager.damage(6);
	
	this.mass = 6.0;
	
	this.states = {
		"attack" : 0,
		"cooldown" : 100.0,
		"jump_phase" : 0,
		"land_wait" : 0.0,
		"recover" : 0.0,
		"backup" : false
	}
	
	this.attack_times = {
		"warm" : 24,
		"release" : 10,
		"cool" : 5
	}
	
	this.on("collideVertical", function(y){
		if( y > 0 && this.states.jump_phase == 2) {
			this.force.x = 0;
			this.states.recover = Game.DELTASECOND * 2;
		} 
		if ( y < 0 && this.states.jump_phase == 1) {
			this.force.x = 0;
			this.states.jump_phase = 2;
			this.states.land_wait = Game.DELTASECOND;
		}
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function )
			if( this.force.y > 5 ) 
				obj.hurt( this, this.landDamage );
			else
				obj.hurt( this, this.collideDamage );
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
		
		Item.drop(this,24);
		audio.play("kill");
		this.destroy();
	});
	this.calculateXP();
}
Chort.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( this.life > 0 && this.states.recover <= 0 && this.active ) {
		if ( this.states.cooldown <= 0 ){
			//In air attack
			this.friction = 0.04;
			
			if( this.states.land_wait <= 0 && this.states.jump_phase == 2){
				this.gravity = 1.0;
				this.collideDamage = 15;
			} 
			if( this.states.jump_phase == 1 ){
				//Aim for player
				var direction = dir.x > 0 ? -1 : 1;
				this.force.x += direction * this.speed * 6.0 * this.delta;
			}
			this.states.land_wait -= this.delta;
		} else {
			//Ground actions
			if( this.states.attack <= 0 ) {
				if( this.states.backup && this.position.x - this.start_x > 64) this.states.backup = false;
				if( !this.states.backup && this.position.x - this.start_x < -64) this.states.backup = true;
				
				this.friction = 0.1;
				var direction = this.states.backup ? 1 : -1;
				this.force.x += direction * this.speed * this.delta;
				
				if( Math.abs(dir.x) < 48 && this.states.attack < -10 ) this.states.attack = this.attack_times.warm;
				
				this.flip = dir.x > 0;
				this.states.cooldown -= this.delta;
				if( this.states.cooldown <= 0 ) {
					this.gravity = 0.2;
					this.force.y = -12;
					this.states.jump_phase = 1;
				}
			} else {
				this.force.x = 0;
				if( this.states.attack <= this.attack_times.release && this.states.attack > this.attack_times.cool ) {
					this.strike( new Line(12,-6,32,10), "hurt" );
				}
			}
			this.states.attack -= this.delta;
		}
	} else {
		this.collideDamage = 5;
		this.states.jump_phase = 0;
		this.gravity = 1.0;
		this.states.cooldown = Game.DELTASECOND * 3;
		this.states.recover -= this.delta;
	}
	
	/* animation */
	if( this.states.jump_phase == 0 ) {
		if( this.states.recover > 0 ) { 
			this.frame_row = 1; 
			this.frame = 3; 
			this.width = 48;
		} else {
			this.width = 28;
			if( this.states.attack > 0 ) {
				this.frame_row = 2; 
				this.frame = 0; 
				if( this.states.attack <= this.attack_times.release ) this.frame = 1;
				if( this.states.attack <= this.attack_times.cool ) this.frame = 2;
			} else {
				this.frame_row = 0; 
				this.frame = (this.frame + this.delta * Math.abs(this.force.x) * 0.3) % 3;
			}
		}
	} else {
		this.width = 48;
		this.frame_row = 1;
		this.frame = 1;
		if( this.force.y > 0.3 ) this.frame = 2;
		if( this.force.y < -0.3 ) { this.frame = 0; this.width = 28; }
	}
}

 /* platformer/boss_garmr.js*/ 

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
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	this.addModule( mod_boss );
	
	this.states = {
		"troll_cooldown" : Game.DELTASECOND * 16,
		"troll_timer" : 0,
		"troll_release" : false,
		"cooldown" : 0
	}
	
	this.life = dataManager.life(0);
	this.mass = 5.0;
	this.damage = dataManager.damage(4);
	this.collideDamage = dataManager.damage(1);
	this.stun_time = 0;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
			//Boss fight
			this.flip = dir.x > 0;
			_player.force.x += (this.flip ? -1 : 1) * 0.55;
			this.states.cooldown -= this.delta;
			if( this.states.cooldown <= 0 ){
				this.states.cooldown = Game.DELTASECOND * 0.6;
				var offset = Math.random() > 0.5 ? -8 : 10;
				var bullet = new Bullet(this.position.x, this.position.y + offset);
				bullet.blockable = true;
				bullet.team = this.team;
				bullet.damage = this.damage;
				bullet.knockbackScale = 0.0;
				bullet.force = new Point((this.flip?-1:1)*3, 0);
				game.addObject(bullet);
			}
			this.projection.x = this.position.x;
			this.projection.y = this.position.y - 64;
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
				this.states.troll_cooldown = Game.DELTASECOND * (20+Math.random()*20);
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
	
	if( (this.closeToBoss || this.states.troll_timer > 0 || this.active) && this.life > 0 ) {
		var flip = this.projection.x - _player.position.x > 0;
		this.sprite.render(g,this.projection.subtract(c),this.projection_frame,this.projection_frame_row, flip);
	}
}
Garmr.prototype.idle = function(){}

 /* platformer/boss_marquis.js*/ 

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
	this.damage = 25;
	this.collideDamage = 10;
	this.inviciple_tile = this.stun_time;
	this.death_time = Game.DELTASECOND * 3;
	
	this.guard.active = true;
	this.guard.y = 8;
	this.guard.h = 48;
	this.guard.x = 0;
	this.guard.w = 28;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		this.states.attack = -1.0;
		//this.states.cooldown = (Math.random() > 0.6 ? 0.0 : 10.0);
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

 /* platformer/boss_minotaur.js*/ 

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
	
	this.states = {
		"attack" : 0,
		"prep" : 0,
		"cooldown" : Game.DELTASECOND * 2,
		"dizzy" : 0
	}
	
	this.life = dataManager.life(24);
	this.mass = 5.0;
	this.damage = 25;
	this.collideDamage = 25;
	this.inviciple_tile = this.stun_time;
	this.collisionReduction = -1.0;
	this.death_time = Game.DELTASECOND * 3;
	this.death_time = Game.DELTASECOND * 3;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(dir){
		if( this.states.attack > 0 && Math.abs(this.force.x) > 1.0 ) {
			this.states.attack = 0;
			this.states.cooldown = Game.DELTASECOND;
			this.states.dizzy = Game.DELTASECOND * 3.5;
			
			if( dir > 0 ) {
				game.addObject(new EffectExplosion(this.position.x + 20, this.position.y-32));
			} else {
				game.addObject(new EffectExplosion(this.position.x - 20, this.position.y-32));
			}
		}
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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

 /* platformer/boss_poseidon.js*/ 

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
	
	this.death_time = Game.DELTASECOND * 3;
	this.life = dataManager.life(26);
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
			else
				obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
				this.states.cooldown = Game.DELTASECOND * 3;
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

 /* platformer/boss_zoder.js*/ 

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
	
	this.attack_warm = 24.0;
	this.attack_time = 10.5;
	this.attack_rest = 7.0;
	this.thrust_power = 6;
	
	this.life = dataManager.life(24);
	this.damage = 50;
	this.collideDamage = 20;
	this.mass = 5.0;
	this.friction = 0.4;
	this.death_time = Game.DELTASECOND * 3;
	this.stun_time = 0;
	
	this.cooldown_time = Game.DELTASECOND * 1.6;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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

 /* platformer/bullet.js*/ 

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
	this.on("struck", function(obj){ if(this.blockable && obj.team!=this.team) this.trigger("death");});
	this.on("death", function(){ this.destroy();});
	
	this.team = 0;
	this.damage = 8;
	this.mass = 0.0;
	this.gravity = 0.0;
	this.friction = 0.0;
	this.flip = d < 0;
}
Bullet.prototype.update = function(){
	this.range -= this.force.length() * this.delta;
	if( this.range <= 0 ) this.destroy();
	
	if(this.effect!=null){
		if( this.effect_time <= 0 ){
			game.addObject( new this.effect(this.position.x, this.position.y) );
			this.effect_time = Game.DELTASECOND * 0.125;
		}
		this.effect_time -= this.delta;
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
	this.frame = (this.frame + (this.delta * 0.3)) % 2;
	this.life -= this.delta;
	if( this.life <= 0 ){
		this.trigger("death");
	}
}

 /* platformer/cornerstone.js*/ 

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
			ga("send","game","cornerstone","level",dataManager.currentTemple);
		}
	});
	
	var tile = this.broken ? 0 : window.BLANK_TILE;
	for(var _x=0; _x < this.width; _x+=16) for(var _y=0; _y < this.height; _y+=16) {
		game.setTile(
		-32 + x + _x,
		-32 + y +_y,
		1,tile);
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

 /* platformer/deathtrigger.js*/ 

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
			if( obj.name.match(/coin_\d+/) ) {
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


 /* platformer/debugger.js*/ 

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
Debuger.prototype.update = function(){
	if ( input.state('left') > 0 ) {  this.position.x -= this.speed * this.delta }
	if ( input.state('right') > 0 ) {  this.position.x += this.speed * this.delta }
	if ( input.state('up') > 0 ) {  this.position.y -= this.speed * this.delta }
	if ( input.state('down') > 0 ) {  this.position.y += this.speed * this.delta }
}

 /* platformer/door.js*/ 

Door.prototype = new GameObject();
Door.prototype.constructor = GameObject;
function Door(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 64;
	this.name = "";
	this.sprite = sprites.doors;
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16),
		new Point(x,y-32),
	];
	
	for(var i=0; i < this.door_blocks.length; i++){
		game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, window.BLANK_TILE);
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ){
			var dir = this.position.subtract(obj.position);
			for( var i=0; i < obj.keys.length; i++ ) {
				if( this.name == obj.keys[i].name ) {
					this.trigger("death");
					return;
				}
			}
		}
	});
	this.on("death", function(obj){
		for(var i=0; i < this.door_blocks.length; i++){
			game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, 0);
		}
		audio.playLock("open",1.0);
		this.destroy();
	});
}
Door.prototype.update = function(){
	var r = this.name.match(/\d+/) - 0;
	this.frame = r % 8;
	this.frame_row = Math.floor( r / 8 );
}

 /* platformer/effects.js*/ 

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
	audio.play(sound);
}

EffectExplosion.prototype.update = function(){
	this.frame = this.frame + (this.speed * game.deltaUnscaled);
	this.frame_row = 1;
	
	if(this.frame >= 3) this.destroy();
}

EffectSmoke.prototype = new GameObject();
EffectSmoke.prototype.constructor = GameObject;
function EffectSmoke(x, y){	
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
}

EffectSmoke.prototype.update = function(){
	this.frame = 0;
	this.frame_row = 2;
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
}

EffectIce.prototype.update = function(){
	this.frame = Math.max((this.frame+game.deltaUnscaled*0.2)%6,2);
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

 /* platformer/enemy_amon.js*/ 

Amon.prototype = new GameObject();
Amon.prototype.constructor = GameObject;
function Amon(x,y){
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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
		}
	});
	/*
	this.on("collideHorizontal", function(dir){
		this.force.x *= -1;
	});
	this.on("collideVertical", function(dir){
		this.force.y *= -1;
	});
	*/
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	this.life = dataManager.life(3);
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
	this.calculateXP();
}
Amon.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	if( this.stun < 0 ) {
		if( Math.abs( this.force.x ) > 0.1 ) {
			this.backupForce = new Point(this.force.x, this.force.y);
		} else {
			this.force = new Point(this.backupForce.x, this.backupForce.y);
		}
		this.flip = this.force.x < 0;
	} else {
		this.force.x = this.force.y = 0;
	}
}

 /* platformer/enemy_batty.js*/ 

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
	this.collideDamage = dataManager.damage(2);
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
		if( this.team != obj.team && obj.hurt instanceof Function ) {
			obj.hurt( this, this.collideDamage );
			this.states.attack = 0;
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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
					if( dir.y + 16.0 > 0 ) {
						this.states.lockon = true;
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

 /* platformer/enemy_beaker.js*/ 

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
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("collideHorizontal", function(x){
		this.states.backwards = !this.states.backwards;
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
				this.states.cooldown = Game.DELTASECOND * 3;
				this.states.jumps = 0;
			}
			this.force.x += direction * speed;
			this.force.y = -jump;
		}
		
		if( Math.abs( this.force.x ) > 0.5 ) this.flip = this.force.x < 0;
		if( Math.abs(dir.x) > 100 ) this.states.backwards = false;
		
		/* counters */
		this.states.cooldown -= this.delta;
	}
	
	this.friction = this.grounded ? 0.4 : 0.025;
	
	/* Animation */
	this.frame = 0;
	if( this.states.cooldown < 5 ) this.frame = 1;
	if( !this.grounded ) this.frame = 2;
}

 /* platformer/enemy_bear.js*/ 

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
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		this.hurt(obj,damage);
	});
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
		} else {
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

 /* platformer/enemy_chaz.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("hurt", function(obj,damage){
		this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("death", function(obj,pos,damage){
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill");
		this.destroy();
	});
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

 /* platformer/enemy_chazbike.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
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

 /* platformer/enemy_crusher.js*/ 

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

 /* platformer/enemy_deckard.js*/ 

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
			obj.hurt( this, this.collideDamage );
			this.states.attack = 0;
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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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

 /* platformer/enemy_derring.js*/ 

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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
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
	this.calculateXP();
}
Derring.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 2;
	this.flip = this.force.x < 0;
}

 /* platformer/enemy_dropper.js*/ 

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
		game.addObject( bullet );
	}
	this.cooldown -= this.delta;
}

 /* platformer/enemy_father.js*/ 

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

 /* platformer/enemy_ghoul.js*/ 

Ghoul.prototype = new GameObject();
Ghoul.prototype.constructor = GameObject;
function Ghoul(x,y){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 20;
	this.height = 48;
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
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			obj.hurt( this, this.collideDamage );
			obj.statusEffects.weaken = Game.DELTASECOND * 15;
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
	
	this.frame = (this.frame + (this.delta * 0.2)) % 3;
	this.frame_row = 0;
}

 /* platformer/enemy_igbo.js*/ 

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
	this.guard.x = 14;
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
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
				new Point( range, (this.states.attack_down ? 8 : 24) ) ), 
				this.states.attack_down ? "struck" : "hurt"
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


 /* platformer/enemy_knight.js*/ 

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
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		
		var dir = this.position.subtract(obj.position);
		//blocked
		obj.force.x += (dir.x > 0 ? -1 : 1) * this.delta;
		//this.force.x += (dir.x < 0 ? -1 : 1) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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

 /* platformer/enemy_malphas.js*/ 

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
		if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
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
			if( this.states.attack <= 0 ) {
				this.states.attack_low = Math.random() < 0.75 ? !this.states.attack_low : this.states.attack_low;
				this.states.attack = this.attack_time;
			}
			if( this.states.combo <= 0 ) {
				//End combo
				this.states.cooldown = Game.DELTASECOND * 2;
				this.states.combo_timer = Game.DELTASECOND * 4;
				this.states.attack_low = false;
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

 /* platformer/enemy_malsum.js*/ 

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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
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

 /* platformer/enemy_oriax.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function ) obj.hurt( this, this.collideDamage );
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

 /* platformer/enemy_ratgut.js*/ 

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
	
	this.attack_release = Game.DELTASECOND * 1.2;
	this.attack_time = Game.DELTASECOND * 2.0;
	
	this.on("collideObject", function(obj){
		if( this.team != obj.team && obj.hasModule(mod_combat) ) {
			obj.statusEffects.poison = Game.DELTASECOND * 15;
			obj.hurt( this, this.collideDamage );
			
			this.states.cooldown = Game.DELTASECOND * 3;
			this.states.runaway = Game.DELTASECOND * 1.5;
		}
	});
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.force.x = -this.force.x;
		this.hurt(obj,damage);
	});
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

 /* platformer/enemy_shooter.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt(obj,damage);
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
	this.calculateXP();
}
Shooter.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	
	if( Math.abs( dir.x ) < 128 ) {
		this.flip = dir.x > 0;
		this.frame = ( this.frame + this.delta * 0.1 ) % 2;
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
			this.cooldown = Game.DELTASECOND * 0.6;
			var shooter_direction = Math.floor( Math.random() * this.bullet_y_pos.length);
			var y = this.bullet_y_pos[ shooter_direction ];
			this.frame_row = shooter_direction;
			var direction = this.flip ? 1 : -1;
			var bullet = new Bullet(
				this.position.x,
				this.position.y + y, 
				-direction
			);
			bullet.damage = this.damage;
			//bullet.speed = 0.8;
			game.addObject( bullet );
		}
		this.cooldown -= this.delta;
	} else if ( Math.abs( this.position.x - this.start_x ) < this.max_distance ){
		this.flip = dir.x > 0;
		var direction = this.flip ? -1 : 1;
		this.force.x += this.delta * this.speed * direction;
	}
}
Shooter.prototype.idle = function(){}

 /* platformer/enemy_skeleton.js*/ 

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
			else 
				obj.hurt( this, this.collideDamage );
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
		if( this.team == obj.team ) return;
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

 /* platformer/enemy_snakebullet.js*/ 

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
	
	this.on("struck", function(obj,pos,damage){
		this.hurt( obj, this.damage );
		audio.play("hurt");
	});
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

 /* platformer/enemy_svarog.js*/ 

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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		this.hurt( obj, damage );
	});
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		if( obj.hurt instanceof Function && obj.invincible < 0 ) {
			obj.hurt( this, this.damage );
			this.force.x *= -1;
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

 /* platformer/enemy_yakseyo.js*/ 

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
	this.on("struck", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if(this.states.phase == 2){
			this.hurt(obj,damage);
		}
	});
	this.on("hurt", function(){
		audio.play("hurt");
	});
	this.on("death", function(obj){
		Item.drop(this,24);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
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

 /* platformer/enemy_yeti.js*/ 

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
			obj.hurt( this, this.collideDamage );
		}
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
	this.calculateXP();
}
Yeti.prototype.update = function(){
	if ( this.stun <= 0 && this.life > 0 ) {
		var dir = this.position.subtract( _player.position );
		
		if( this.states.cooldown <= 0 ){
			if( !this.states.attack_release && this.states.attack < this.attack_release ) {
				this.states.attack_release = true;
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

 /* platformer/exit.js*/ 

Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y){
	this.constructor();
	this.sprite = sprites.cornerstones;
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = 16;
	this.height = 240;
	
	this.visible = false;
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			window._world.trigger("activate");
		}
	});
}
Exit.prototype.idle = function(){}

 /* platformer/healer.js*/ 

Healer.prototype = new GameObject();
Healer.prototype.constructor = GameObject;
function Healer(x,y,n,options){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = sprites.retailers;
	this.width = 16;
	this.height = 32;
	this.zIndex = 5;
	this.life = 1;
	
	this.frame = 0;
	this.frame_row = 1;
	
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
		if( this.price > 0 ) {
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		}
		if( input.state("fire") == 1 ){
			if( this.cursor == 0 || this.price <= 0 ) {
				if( this.price <= _player[this.currency] ) {
					if( this.type == 0 ){ 
						_player.manaHeal = Number.MAX_VALUE;
						audio.play("item1");
					} else if ( this.type == 1 ){
						if( this.cursor == 0 ) _player.heal = Number.MAX_VALUE;
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
	this.frame = this.open > 0 ? 1 : 0;
}
Healer.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		boxArea(g,16,48,224,64);
		textArea(g,this.message[this.type].replace("%PRICE%",this.price),32,64,192,64);
		
		if( this.price > 0 ) {
			boxArea(g,16,120,64,56);
			textArea(g," Yes",32,136);
			textArea(g," No",32,152);
			
			sprites.text.render(g, new Point(28,136+this.cursor*16), 95);
		}
	}
}

 /* platformer/item.js*/ 

Item.prototype = new GameObject();
Item.prototype.constructor = GameObject;
function Item(x,y,name){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 18;
	this.height = 16;
	this.name = "";
	this.sprite = sprites.items;
	this.sleep = null;
	
	this.frames = false;
	this.animation_frame = Math.random() * 3;
	this.animation_speed = 0.25;
	
	if( name != undefined ) {
		this.setName( name );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player && this.interactive ){
			if( this.name.match(/^key_\d+$/) ) if( obj.keys.indexOf( this ) < 0 ) { obj.keys.push( this ); game.slow(0,10.0); audio.play("key"); }
			if( this.name == "life" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 100; }
			if( this.name == "life_up" ) { obj.lifeMax += 20; obj.heal += 20; }
			if( this.name == "life_small" ) { if(obj.life >= obj.lifeMax) return; obj.heal = 20; }
			if( this.name == "mana_small" ) { if(obj.mana >= obj.manaMax) return; obj.manaHeal = 3; audio.play("gulp"); }
			if( this.name == "money_bag" ) { obj.money += Math.floor(30*(1+dataManager.currentTemple*0.33)); audio.play("pickup1"); }
			if( this.name == "xp_big" ) { obj.addXP(50); audio.play("pickup1"); }
			if( this.name == "short_sword") { if( !obj.hasEquipment("short_sword") ) { obj.equipment.push(this); audio.play("pickup1"); } else { obj.waystones+=3;  audio.play("coin"); } }
			if( this.name == "long_sword") { if( !obj.hasEquipment("long_sword") ) { obj.equipment.push(this); audio.play("pickup1"); } else { obj.waystones+=3;  audio.play("coin"); } }
			if( this.name == "spear") { if( !obj.hasEquipment("spear") ) { obj.equipment.push(this); audio.play("pickup1"); } else { obj.waystones+=3;  audio.play("coin"); } }
			if( this.name == "small_shield") { if( !obj.hasEquipment("small_shield") ) { obj.equipment.push(this); audio.play("pickup1"); } else { obj.waystones+=3;  audio.play("coin"); } }
			if( this.name == "tower_shield") { if( !obj.hasEquipment("tower_shield") ) { obj.equipment.push(this); audio.play("pickup1"); } else { obj.waystones+=3;  audio.play("coin"); } }
			if( this.name == "map") { game.getObject(PauseMenu).revealMap(); audio.play("pickup1"); }
			
			if( this.name == "coin_1") { obj.addMoney(1); audio.play("coin"); }
			if( this.name == "coin_2") { obj.addMoney(5); audio.play("coin"); }
			if( this.name == "coin_3") { obj.addMoney(10); audio.play("coin"); }
			if( this.name == "waystone") { obj.addWaystone(1); audio.play("coin"); }
			
			//Enchanted items
			if( this.name == "seed_oriax") { obj.stats.attack+=1; audio.play("levelup"); }
			if( this.name == "seed_bear") { obj.stats.defence+=1; audio.play("levelup"); }
			if( this.name == "seed_malphas") { obj.stats.technique+=1; audio.play("levelup"); }
			if( this.name == "seed_cryptid") { obj.attackEffects.slow[0] += .2; audio.play("levelup"); }
			if( this.name == "seed_knight") { obj.invincible_time+=16.666; audio.play("levelup"); }
			if( this.name == "seed_minotaur") { obj.on("collideObject", function(obj){ if( this.team != obj.team && obj.hurt instanceof Function ) obj.hurt( this, Math.ceil(this.damage/5) ); }); }
			if( this.name == "seed_plaguerat") { 
				obj.attackEffects.poison[0] += 1.0; 
				obj.life_steal = Math.min(obj.life_steal+0.2,0.4); 
				obj.statusEffectsTimers.poison = obj.statusEffects.poison = Game.DELTAYEAR;
				obj.trigger("status_effect", "poison");
				obj.on("added",function(){
					obj.statusEffectsTimers.poison=this.statusEffects.poison=Game.DELTAYEAR; 
					this.trigger("status_effect", "poison");
				}); 
				audio.play("levelup"); 
			}
			if( this.name == "seed_marquis") { obj.stun_time = 0; audio.play("levelup"); }
			if( this.name == "seed_batty") { obj.spellsCounters.flight=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.flight=Game.DELTAYEAR}); audio.play("levelup"); }
			
			if( this.name == "pedila") { obj.spellsCounters.feather_foot=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.feather_foot=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "haft") { obj.equip_sword.bonus_def = obj.equip_sword.bonus_def+1 || 1; obj.equip_sword.level++; audio.play("levelup"); }
			if( this.name == "zacchaeus_stick") { obj.money_bonus += 0.5; audio.play("levelup"); }
			if( this.name == "fangs") { obj.life_steal = Math.min(obj.life_steal+0.2,0.4); audio.play("levelup"); }
			if( this.name == "passion_fruit") { obj.manaHeal = obj.heal = Game.DELTAYEAR; audio.play("levelup"); }
			if( this.name == "shield_metal") { if( obj.equip_shield == null ) return; obj.equip_shield.bonus_def = obj.equip_shield.bonus_def + 1 || 1; audio.play("levelup"); }
			if( this.name == "magic_gem"){ obj.spellsCounters.magic_sword=Game.DELTAYEAR; obj.on("added",function(){this.spellsCounters.magic_sword=Game.DELTAYEAR}); audio.play("levelup"); }
			if( this.name == "snake_head") { obj.attackEffects.poison[0] += .2; audio.play("levelup"); }
			if( this.name == "broken_banana") { obj.attackEffects.weaken[0] += .2; audio.play("levelup"); }
			if( this.name == "blood_letter") { obj.attackEffects.bleeding[0] += .2; audio.play("levelup"); }
			if( this.name == "red_cape") { obj.attackEffects.rage[0] += .2; audio.play("levelup"); }
			if( this.name == "chort_nose") { obj.waystone_bonus += .08; audio.play("levelup"); }
			if( this.name == "plague_mask") { obj.spellsCounters.poison=0; obj.on("status_effect",function(i){ this.spellsCounters.poison=0; }); audio.play("levelup"); }
			if( this.name == "spiked_shield") { obj.on("block", function(o,p,d){ if(o.hurt instanceof Function) o.hurt(this,Math.floor(d/2)); }); audio.play("levelup"); }
			
			if( this.name == "charm_sword") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_mana") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_alchemist") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_musa") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_wise") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_methuselah") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_barter") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			if( this.name == "charm_elephant") { obj.equipCharm(this); this.destroy(); audio.play("equip"); }
			var pm = game.getObject(PauseMenu);
			if( pm != null && this.message != undefined ) {
				pm.message( this.message );
			}
			this.interactive = false;
			this.destroy();
		}
	});
}
Item.prototype.setName = function(n){
	this.name = n;
	//Equipment
	if(n == "short_sword") { 
		this.frame = 0; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=2; this.bonus_att=0;
		this.stats = {"warm":10.5, "strike":8.5,"rest":5.0,"range":12, "sprite":sprites.sword1 };
		return; 
	}
	if(n == "long_sword") { 
		this.frame = 1; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=2; 
		this.stats = {"warm":15.0, "strike":10,"rest":7.0,"range":18, "sprite":sprites.sword2 };
		return; 
	}
	if(n == "broad_sword") { 
		this.frame = 3; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=3; 
		this.stats = {"warm":17.0, "strike":8.5,"rest":5.0,"range":18, "sprite":sprites.sword2 };
		return; 
	}
	if(n == "spear") { 
		this.frame = 2; this.frame_row = 2; 
		this.isWeapon = true; this.twoHanded = false;
		this.level=1; this.bonus_att=4; 
		this.stats = {"warm":21.5, "strike":13.5,"rest":8.0,"range":27, "sprite":sprites.sword3 };
		return; 
	}
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	
	if( this.name.match(/^key_\d+$/) ) { this.frame = this.name.match(/\d+/) - 0; this.frame_row = 0; return; }
	if(n == "life") { this.frame = 0; this.frame_row = 1; return; }
	if(n == "life_up") { this.frame = 6; this.frame_row = 1; return; }
	if(n == "small_shield") { this.frame = 0; this.frame_row = 3; return; }
	if(n == "tower_shield") { this.frame = 1; this.frame_row = 3; return; }
	if(n == "map") { this.frame = 3; this.frame_row = 1; return }
	
	if(n == "life_small") { this.frame = 1; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "mana_small") { this.frame = 4; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "money_bag") { this.frame = 5; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	if(n == "xp_big") { this.frame = 2; this.frame_row = 1; this.addModule(mod_rigidbody); this.pushable=false; return; }
	
	if(n == "coin_1") { this.frames = [7,8,9,-8]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_2") { this.frames = [10,11,12,-11]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "coin_3") { this.frames = [13,14,15,-14]; this.frame_row = 1; this.addModule(mod_rigidbody); this.bounce = 0.5; return; }
	if(n == "waystone") { this.frames = [13,14,15]; this.frame_row = 0; this.addModule(mod_rigidbody); this.bounce = 0.0; return; }
	
	if( this.name == "seed_oriax") { this.frame = 0; this.frame_row = 4; this.message = "Oriax Seed\nDamage up.";}
	if( this.name == "seed_bear") { this.frame = 1; this.frame_row = 4; this.message = "Onikuma Seed\nDefence up.";}
	if( this.name == "seed_malphas") { this.frame = 2; this.frame_row = 4; this.message = "Malphas Seed\nTechnique up.";}
	if( this.name == "seed_cryptid") { this.frame = 3; this.frame_row = 4; this.message = "Yeti Seed\nCold Strike.";}
	if( this.name == "seed_knight") { this.frame = 4; this.frame_row = 4; this.message = "Guard Seed\nIncreased invincibility.";}
	if( this.name == "seed_minotaur") { this.frame = 5; this.frame_row = 4; this.message = "Minotaur Seed\nCrashing into enemies hurts them.";}
	if( this.name == "seed_plaguerat") { this.frame = 6; this.frame_row = 4; this.message = "Plague Rat Seed\nYou carry the plague.";}
	if( this.name == "seed_marquis") { this.frame = 7; this.frame_row = 4; this.message = "Marquis Seed\nPain no longer phases you.";}
	if( this.name == "seed_batty") { this.frame = 8; this.frame_row = 4; this.message = "Batty Seed\nYou can fly.";}
	
	if( this.name == "pedila") { this.frame = 0; this.frame_row = 5; this.message = "Pedila\nFantastically light shoes.";}
	if( this.name == "haft") { this.frame = 2; this.frame_row = 5; this.message = "Haft\nCurrent weapon defence up.";}
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
			_player.manaMax -= 3;
			_player.mana -= 3;
		});
	}
	if( this.name == "charm_alchemist") { this.frame = 2; this.frame_row = 8; this.message = "Alchemist Charm\nDoubles Waystone collection.";}
	if( this.name == "charm_musa") { this.frame = 3; this.frame_row = 8; this.message = "Musa's Charm\nGold heals wounds.";}
	if( this.name == "charm_wise") { this.frame = 4; this.frame_row = 8; this.message = "Wiseman's Charm\nGreater Experience.";}
	if( this.name == "charm_methuselah") { this.frame = 5; this.frame_row = 8; this.message = "Methuselah's Charm\nImmune to all statuses.";}
	if( this.name == "charm_barter") { this.frame = 6; this.frame_row = 8; this.message = "Barterer's Charm\nItems in shop are cheaper.";}
	if( this.name == "charm_elephant") { this.frame = 7; this.frame_row = 8; this.message = "Elephant Charm\nWounds open slowly.";}
	
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
Item.drop = function(obj,money,sleep){
	var money_only = obj.hasModule(mod_boss);
	if(Math.random() > (_player.life / _player.lifeMax) && !money_only){
		var item = new Item( obj.position.x, obj.position.y, "life_small" );
		if( sleep != undefined ) item.sleep = sleep;
		game.addObject( item );
	} else if (Math.random() < _player.waystone_bonus && !money_only) {
		var item = new Item( obj.position.x, obj.position.y, "waystone" );
		if( sleep != undefined ) item.sleep = sleep;
		game.addObject( item );
	} else {
		var bonus = _player.money_bonus || 1.0;
		//money = money == undefined ? (Math.max(dataManager.currentTemple*2,0)+(2+Math.random()*4)) : money;
		money = money == undefined ? (2+Math.random()*4) : money;
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
	}
}

 /* platformer/lift.js*/ 

Lift.prototype = new GameObject();
Lift.prototype.constructor = GameObject;
function Lift(x,y){
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
	
	this.mass = 0;
	this.gravity = 0.0;
}

Lift.prototype.idle = function(){}
Lift.prototype.update = function(){
	//slow down lift
	this.force.y *= 0.9;
	
	var dir = this.position.subtract( _player.position );
	var goto_y = 200 + (Math.floor( _player.position.y / 240 ) * 240);
	if( this.onboard ) {
		if( input.state("up") > 0 ) {
			this.force.y = -this.speed;
			audio.playLock("lift",0.2);
		} else if( input.state("down") > 0 ) {
			this.force.y = this.speed;
			audio.playLock("lift",0.2);
		}
	} else {
		var speed = Math.min(Math.max(goto_y - this.position.y,-4.5),4.5);
		this.force.y = speed;
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

 /* platformer/mapdebug.js*/ 

MapDebug.prototype = new GameObject();
MapDebug.prototype.constructor = GameObject;
function MapDebug(x,y){
	_rd
	this.slice = 0;
	this.offset = new Point(0,0);
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
		
		for(var i in _rd[this.slice] ){
			var tile = _rd[this.slice][i] == "j" ? 8 : 0;
			var pos = new Point(
				size.x * ~~i.match(/(-?\d+)/g)[0],
				size.y * ~~i.match(/(-?\d+)/g)[1]
			);
			sprites.map.render(g,pos.subtract(this.offset),tile,0)
		}
	} catch (err) {}
}
MapDebug.prototype.idle = function(){}

 /* platformer/menu_pause.js*/ 

PauseMenu.prototype = new GameObject();
PauseMenu.prototype.constructor = GameObject;
function PauseMenu(){
	this.constructor();
	this.sprite = game.tileSprite;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
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
				_world.trigger("reset");
				return;
			}
		} else if( this.page == 0 ) {
			//Equipment page
			if( input.state("up") == 1 ) { this.cursor-=1; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor+=1; audio.play("cursor"); }
			
			this.cursor = Math.max( Math.min( this.cursor, _player.equipment.length -1 ), 0 );
			
			if( input.state("fire") == 1 ) {
				var item = _player.equipment[this.cursor];
				audio.play("equip");
				if( item.name.match(/shield/) ){
					_player.equip( _player.equip_sword, item );
				} else {
					_player.equip( item, _player.equip_shield );
				}
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
				if( input.state("left") == 1 ) { this.page = ( this.page + 1 ) % 4; audio.play("cursor"); }
				if( input.state("right") == 1 ) { this.page = (this.page<=0 ? 3 : this.page-1); audio.play("cursor"); }
			}
		}
	} else {
		if( ( input.state("pause") == 1 || input.state("select") == 1 ) && _player instanceof Player && _player.life > 0 ) {
			this.open = true;
			_player.equipment.sort( function(a,b){ if( a.name.match(/shield/) ) return 1; return -1; } );
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
		switch( this.map[map_index] ){
			case 1: lock = new Line(-256,0,512,240); break;
			case 2: lock = new Line(-256,-240,512,240); break;
			case 3: lock = new Line(-256,0,512,480); break;
			case 4: lock = new Line(-256,-240,256,240); break;
			case 5: lock = new Line(0,-240,512,240); break;
			case 6: lock = new Line(-256,0,256,480); break;
			case 7: lock = new Line(0,0,512,480); break;
			case 8: lock = new Line(0,-240,256,480); break;
			case 9: lock = new Line(-256,-240,512,480); break;
			case 10: lock = new Line(0,-240,512,480); break;
			case 11: lock = new Line(-256,-240,256,480); break;
			case 12: lock = new Line(0,0,512,240); break;
			case 13: lock = new Line(-256,0,256,240); break;
			case 14: lock = new Line(0,0,256,240); break;
			case 15: lock = new Line(0,0,512,240); break;
			default: lock = new Line(0,0,256,240); break;
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
PauseMenu.prototype.revealMap = function(){
	for(var i=0; i < this.map.length; i++ ) {
		if( this.map_reveal[i] == undefined ) this.map_reveal[i] = 0;
		this.map_reveal[i] = Math.max( this.map_reveal[i], 1 );
	}
}
PauseMenu.prototype.render = function(g,c){
	/*
	var ani = [0,1,2,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,6,7,7,7,7,7,8,9,10];
	var row = ani[ Math.floor( Math.min(this.cursor,ani.length-1) ) ];

	sprites.pig.render(g,new Point(128,128), 0, row );
	this.cursor += 0.15 * this.delta;
	*/
	/* mini map */
	
	if( _player instanceof Player ) {
		g.fillStyle = "#000";
		g.scaleFillRect(216,8,32,24);
		this.renderMap(g,new Point(Math.floor(-_player.position.x/256), Math.floor(-_player.position.y/240)), new Point(232,24), new Line(-16,-16,16,8));
	}
	
	if( this.message_time > 0 ) {
		boxArea(g,16,16,224,64);
		textArea(g,this.message_text,32,32,192);
	}
	
	if( this.open && _player instanceof Player ) {
		if( _player.life <= 0 ) {
			sprites.title.render(g,new Point(), 3);
			boxArea(g,68,168,120,40);
			textArea(g,"Press start",84,184);
		} else if( this.page == 0 ) {
			//Equipment
			
			boxArea(g,68,8,120,224);
			textArea(g,"Equipment",94,20);
			
			for(var i=0; i < _player.equipment.length; i++ ) {
				var _y = 40 + i * 24;
				_player.equipment[i].position.x = 0;
				_player.equipment[i].position.y = 0;
				_player.equipment[i].render( g, new Point(-96, -_y));
				
				if( "bonus_att" in _player.equipment[i] ) textArea(g,"\v"+_player.equipment[i].bonus_att,112,_y-4);
				if( "bonus_def" in _player.equipment[i] ) textArea(g,"\b"+_player.equipment[i].bonus_def,144,_y-4);
				
				if( _player.equip_sword == _player.equipment[i] || _player.equip_shield == _player.equipment[i] ) {
					g.fillStyle = "#007800";
					g.scaleFillRect(88,_y,8,8);
					textArea(g,"E",88, _y );
				}
			}
			//Draw cursor
			textArea(g,"@",80, 36 + this.cursor * 24 );
			
		} else if ( this.page == 1 ) {
			//Map
			boxArea(g,16,8,224,224);
			textArea(g,"Map",118,20);
			this.renderMap(g,this.mapCursor,new Point(32,24), new Line(0,0,24*8,24*8) );
			
		} else if ( this.page == 2 ) {
			//Stats page
			boxArea(g,68,8,120,224);
			
			textArea(g,"Attributes",88,20);
			
			textArea(g,"Points: "+_player.stat_points ,88,36);
			
			var attr_i = 0;
			for(attr in _player.stats) {
				var y = attr_i * 28;
				textArea(g,attr ,88,60+y);
				g.fillStyle = "#e45c10";
				for(var i=0; i<_player.stats[attr]; i++)
					g.scaleFillRect(88+i*4, 72 + y, 3, 8 );
				
				if( _player.stat_points > 0 ) {
					//Draw cursor
					g.fillStyle = "#FFF";
					if( this.stat_cursor == attr_i )
						g.scaleFillRect(80, 62 + y, 4, 4 );
				}
				attr_i++;
			}
		} else if ( this.page == 3 ) {
			//Spells
			boxArea(g,52,8,152,224);
			textArea(g,"Spells",104,20);
			
			var spell_i = 0;
			for(spell in _player.spellsUnlocked) {
				var y = spell_i * 16;
				textArea(g,_player.spellsUnlocked[spell] ,72,36+y);
				if(_player.selectedSpell == spell ) textArea(g,"@",62,36+y);
				if( spell in _player.spellsCounters && _player.spellsCounters[spell] > 0 ) {
					var remaining = Math.min( Math.floor((8*_player.spellsCounters[spell]) / _player.spellEffectLength), 8);
					var y_offset = 8 - remaining;
					g.fillStyle = "#3CBCFC";
					g.scaleFillRect(184, 36+y+y_offset, 8, remaining );
					sprites.text.render(g,new Point(184,36+y), 5, 6);
				}
				
				spell_i++;
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
			if( this.map[i] > 0 && this.map_reveal[i] > 0 )  {
				var tile = new Point(
					this.mapDimension.start.x + (i%this.mapDimension.width() ),
					this.mapDimension.start.y + Math.floor(i/this.mapDimension.width() )
				);
				var pos = new Point( 
					(this.mapDimension.start.x*8) + (cursor.x*8) + (i%this.mapDimension.width() ) * size.x, 
					(this.mapDimension.start.y*8) + (cursor.y*8) + Math.floor(i/this.mapDimension.width() ) * size.y 
				);
				if( pos.x >= limits.start.x && pos.x < limits.end.x && pos.y >= limits.start.y && pos.y < limits.end.y ) {
					sprites.map.render(g,pos.add(offset),this.map[i]-1,(this.map_reveal[i]>=2?0:1));
					
					if( this.map_reveal[i] >= 2 ) {					
						for(var j=0; j < doors.length; j++ ){
							if( tile.x == Math.floor(doors[j].position.x/256) && tile.y == Math.floor(doors[j].position.y/240) ){
								var door_id = doors[j].name.match(/(\d+)/)[0] - 0;
								sprites.map.render(g,pos.add(offset),door_id,2);
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
			g.fillStyle = "#F00";
			g.scaleFillRect(pos.x + offset.x, pos.y + offset.y, 5, 5 );
		}
	} catch (err) {}
}

 /* platformer/menu_title.js*/ 

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
	
	this.message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra sodales enim, quis ornare elit vehicula vel. Praesent tincidunt molestie augue, a euismod massa. Vestibulum eu neque quis dolor egestas aliquam. Vestibulum et finibus velit. Phasellus rutrum consectetur tellus a maximus. Suspendisse commodo lobortis sapien, at eleifend turpis aliquet vitae. Mauris convallis, enim sit amet sodales ornare, nisi felis interdum ex, eget tempus nulla ex vel mauris.";
	this.options = [
		"Death is not the end. If you die you will return to the entrance of the area.",
		"You only have one chance. Death will will send you to the beginning of your quest."
	];
}

TitleMenu.prototype.update = function(){
	if( this.sprite.loaded && audio.isLoaded("music_intro") && !this.start ) {
		this.loading = false;
		if( this.progress == 0 ) audio.playAs("music_intro","music");
		
		if( this.start_options ) {
			this.progress = 10.0;
			if( input.state("up") == 1 ) { this.cursor = 0; audio.play("cursor"); }
			if( input.state("down") == 1 ) { this.cursor = 1; audio.play("cursor"); }
		} else {
			this.progress += this.delta / Game.DELTASECOND;
		}
		
		if( input.state("pause") == 1 || input.state("fire") == 1 ) {
			if( this.progress < 9.0 || this.progress > 24.0 ) {
				this.progress = 9.0;
			} else if( this.start_options ) {
				//Start game
				audio.play("pause");
				this.startGame();
			} else {
				this.start_options = true;
			}
		}
		
		if( this.progress > 48 ) this.progress = 9.0;
		
	}
}

TitleMenu.prototype.render = function(g,c){
	if( this.loading ){ 
		g.font = (30*pixel_scale)+"px monospace";
		g.fillStyle = "#FFF";
		g.fillText("Loading", 64*pixel_scale, 120*pixel_scale);
	} else if( this.start ) {
		
	} else {
		var pan = Math.min(this.progress/8, 1.0);
		
		this.sprite.render(g,new Point(),2);
		
		//Random twinkling stars
		for(var i=0; i<this.stars.length; i++) {
			var frame = 2;
			if( 
				this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
				this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
			) frame = 3;
				
			sprites.bullets.render(g,this.stars[i].pos,frame,2);
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
		
		this.sprite.render(g,new Point(0,Math.lerp( this.castle_position, 0, pan)),1);
		this.sprite.render(g,new Point(0,Math.lerp( this.title_position, 0, pan)),0);
		
		if( this.progress >= 9.0 && this.progress < 24.0  ){
			if( this.start_options ) {
				boxArea(g,32,32,192,88);
				textArea(g,this.options[this.cursor],48,48,160);
				boxArea(g,68,146,120,56);
				textArea(g,"Easy",92,162);
				textArea(g,"Hard core",92,178);
				sprites.text.render(g, new Point(80,162+(16*this.cursor)),15,5);
			} else { 
				boxArea(g,68,168,120,40);
				textArea(g,"Press start",84,184);
			}
		}
		
		if( this.progress >= 24 ) {
			var y_pos = Math.lerp(240,0, Math.min( (this.progress-24)/8, 1) );
			boxArea(g,0,y_pos,256,240);
			textArea(g,this.message,16,y_pos+16,240);
		}
	}
}
TitleMenu.prototype.idle = function(){}

TitleMenu.prototype.startGame = function(){
	this.start = true;
	
	dataManager.reset();
	
	var world = new WorldMap(0,0);
	world.mode = this.cursor > 0 ? 1 : 0;
	
	ga("send","game","gamestart","difficulty",world.mode);
	
	game.clearAll();
	game.addObject(world);
	audio.stop("music_intro");
}

 /* platformer/modules.js*/ 

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
				var mass = Math.max( 1.0 - Math.max(this.mass - obj.mass, 0), 0);
				this.force.y += dir.y * this.friction * mass * this.delta;
				this.force.x += dir.x * this.friction * mass * this.delta;
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
		this.camera_target = new Point();
		game.camera.x = this.position.x - 160;
		game.camera.y = this.position.y - 120;
	},
	'update' : function(){		
		var screen = new Point(256,240);
		game.camera.x = this.position.x - (256 / 2);
		game.camera.y = Math.floor( this.position.y  / screen.y ) * screen.y;
		
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
			game.camera.x = Math.min( Math.max( game.camera.x, this._lock_current.start.x ), this._lock_current.end.x - screen.x );
			game.camera.y = Math.min( Math.max( game.camera.y, this._lock_current.start.y ), this._lock_current.end.y - screen.y );
		}
	}
}

var mod_combat = {
	"init" : function() {
		this.life = 100;
		this.invincible = 0;
		this.invincible_time = 10.0;
		this.damage = 10;
		this.collideDamage = 5;
		this.damageReduction = 0.0;
		this.team = 0;
		this.stun = 0;
		this.stun_time = 10.0;
		this.death_time = 0;
		this._hurt_strobe = 0;
		this._death_clock = Number.MAX_VALUE;
		this._death_explosion_clock = Number.MAX_VALUE;
		this.damage_buffer = 0;
		this.buffer_damage = false;
		this._damage_buffer_timer = 0;
		this.xp_award = 0;
		
		this.attackEffects = {
			"slow" : [0,10],
			"poison" : [0,10],
			"cursed" : [0,15],
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
		
		var self = this;
		this.guard = {
			"x" : 4,
			"y" : -5,
			"h" : 16,
			"w" : 16,
			"active" : false
		};
		this._shield = new GameObject();
		this._shield.life = 1;
		
		this.on("added",function(){ 
			for(var i in this.statusEffectsTimers )this.statusEffectsTimers[i] = -1;
			game.addObject(this._shield); 
		});
		this._shield.on("struck",function(obj,position,damage){
			if( obj != self ) 
				self.trigger("block",obj,position,damage);
		});
			
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
						//
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
					this._death_clock = this.death_time;
					this._death_explosion_clock = this.death_time;
					this.interactive = false;
				} else {
					game.addObject(new EffectExplosion(this.position.x,this.position.y));
					this.trigger("death");
				}
			}
		}
		this.hasStatusEffect = function(){
			for(var i in this.statusEffects)
				if(this.statusEffects[i] > 0 )
					return true;
			return false;
		}
		this.hurt = function(obj, damage){
			if( this.statusEffects.bleeding > 0 ) damage *= 2;
			if( this.statusEffects.rage > 0 ) damage = Math.floor( damage * 1.5 );
			if( "statusEffects" in obj && obj.statusEffects.weaken > 0 ) damage = Math.ceil(damage/3);
			if( "statusEffects" in obj && obj.statusEffects.rage > 0 ) damage = Math.floor(damage*1.5);
			
			//Add effects to attack
			if( "attackEffects" in obj ){
				for( var i in obj.attackEffects ) {
					if( Math.random() < obj.attackEffects[i][0] )
						this.statusEffects[i] = Math.max( Game.DELTASECOND * obj.attackEffects[i][1], this.statusEffects[i] );
						this.statusEffectsTimers[i] = this.statusEffects[i] - Game.DELTASECOND * 0.5;
						this.trigger("status_effect", i);
				}
			}
			
			if( this.invincible <= 0 ) {
				//Apply damage reduction as percentile
				damage = Math.max( damage - Math.ceil( this.damageReduction * damage ), 1 );
				
				if( this.buffer_damage ) 
					this.damage_buffer += damage;
				else
					this.life -= damage;
				
				var dir = this.position.subtract( obj.position ).normalize();
				var scale = ("knockbackScale" in obj) ? obj.knockbackScale : 1.0;
				this.force.x += dir.x * ( 3/Math.max(this.mass,0.3) ) * scale;
				this.invincible = this.invincible_time;
				this.stun = this.stun_time;
				this.trigger("hurt",obj,damage);
				this.isDead();
				obj.trigger("hurt_other",this,damage);
			}
		}
		this.calculateXP = function(scale){
			if(!(this instanceof Player) && !this.hasModule(mod_boss))
				this.filter = "t"+dataManager.currentTemple;
			
			scale = scale == undefined ? 1 : scale;
			this.xp_award = 0;
			this.xp_award += this.life / 8;
			this.xp_award += this.damage / 5;
			if( this.speed != undefined )
				this.xp_award += Math.max((this.speed-0.3)*3,0);
			this.xp_award += this.bounds().area() / 400;
			this.xp_award = Math.floor(this.xp_award * scale);
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
					if( i == "poison" ) { this.life -= 1; this.isDead(); }
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
		
		if( this.life <= 0 ) this._death_clock -= game.deltaUnscaled;
		if( this._death_clock <= 0 ) this.trigger("death");
		if( this.life <= 0 && this._death_clock < this._death_explosion_clock) {
			//Create explosion
			game.addObject(new EffectExplosion(
				this.position.x + this.width*(Math.random()-.5), 
				this.position.y + this.height*(Math.random()-.5)
			));
			this._death_explosion_clock = this._death_clock - Game.DELTASECOND * .25;
		}
		
		this._shield.interactive = this.guard.active;
		this._shield.team = this.team;
		if( this.guard.active ) {
			this._shield.position.x = this.position.x+(this.flip?-1:1)*this.guard.x;
			this._shield.position.y = this.position.y+this.guard.y;
			this._shield.width = this.guard.w;
			this._shield.height = this.guard.h;
		} else {
			this._shield.position.x = -Number.MAX_VALUE;
			this._shield.position.y = -Number.MAX_VALUE;
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
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, 1, 0);
			_player.lock_overwrite = false;
		}
		this._boss_is_active = function(){
			if( !this.active ) {
				this.interactive = false;
				var dir = this.position.subtract( _player.position );
				if( Math.abs( dir.x ) < 64 && Math.abs( dir.y ) < 64 ){
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
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, 1, window.BLANK_TILE);
			_player.lock_overwrite = this.boss_lock;
			this.interactive = true;
		});
		this.on("death", function() {
			for(var i=0; i < this.boss_doors.length; i++ )
				game.setTile(this.boss_doors[i].x, this.boss_doors[i].y, 1, 0);
			_player.lock_overwrite = false;
		});
	},
	"update" : function(){
		this._boss_is_active();
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

 /* platformer/player.js*/ 

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
	this.equipment = [new Item(0,0,"short_sword"), new Item(0,0,"small_shield")];
	this.spells = [];
	this.charm = false;
	
	this.equip_sword = this.equipment[0];
	this.equip_shield = this.equipment[1];
	
	
	window._player = this;
	this.sprite = sprites.player;
	
	this.inertia = 0.9; 
	this.jump_boost = false;
	this.states = {
		"duck" : false,
		"guard" : true,
		"attack" : 0.0,
		"stun" : 0.0,
		"start_attack" : false,
		"death_clock" : Game.DELTASECOND
	};
	
	this.attackProperites = {
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
	}
	
	this.on("pre_death", function(){
		game.slow(0,this.death_time);
		audio.stopAs("music");
	});
	this.on("death", function(){
		this.position.x = 128;
		this.position.y = 200;
		for(var i=0; i < game.objects.length; i++ )
			game.objects[i].trigger("player_death");
		game.getObject(PauseMenu).open = true;
		audio.play("playerdeath");
		this.destroy();
		
		ga("send","game","death","temple",dataManager.currentTemple);
		ga("send","game","death","level",this.level);
	});
	this.on("land", function(){
		audio.play("land");
	});
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
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
		if( this.inviciple > 0 ) return;
		
		this.hurt(obj,damage);
	});
	this.on("hurt", function(obj, damage){
		this.states.attack = 0;
		game.slow(0,5.0);
		audio.play("playerhurt");
	})
	this.on("hurt_other", function(obj, damage){
		this.life = Math.min( this.life + Math.round(damage * this.life_steal), this.lifeMax );
	});
	this.on("added", function(){
		this.damage_buffer = 0;
		this.lock_overwrite = false;
		this.checkpoint = new Point(this.position.x, this.position.y);
		this.force.x = this.force.y = 0;
		
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
	
	this.life = 0;
	this.lifeMax = 100;
	this.mana = 3;
	this.manaMax = 3;
	this.money = 0;
	this.waystones = 0;
	this.heal = 100;
	this.healMana = 0;
	this.damage = 5;
	this.team = 1;
	this.mass = 1;
	this.death_time = Game.DELTASECOND * 2;
	this.invincible_time = 20;
	this.autoblock = true;
	
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
	
	this.stats = {
		"attack" : 1,
		"defence" : 1,
		"technique" : 1
	}
	
	this.equip(this.equipment[0], this.equipment[1]);
	
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
			if( this.mana >= 2 && this.invincible < this.invincible_time ){
				this.mana -= 2;
				this.invincible = Game.DELTASECOND * 20; 
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
					if( map instanceof PauseMenu) map.revealMap();
				}
				this.spellsCounters.magic_armour = this.spellEffectLength * 2; 
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
		"feather_foot" : 0,
		"thorns" : 0,
		"magic_song" : 0
	};
	this.money_bonus = 1.0;
	this.waystone_bonus = 0.02;
	this.life_steal = 0.0;
	
	this.addXP(0);
}

Player.prototype.update = function(){
	var speed = 1.25;
	if( this.spellsCounters.haste > 0 ) speed = 1.4;
	this.states.guard = false;
	
	this.buffer_damage = this.hasCharm("charm_elephant");
	if( this.manaHeal > 0 ){
		this.mana = Math.min(this.mana += 2, this.manaMax);
		this.manaHeal-= 2;
		if( this.mana >= this.manaMax ) this.manaHeal = 0;
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
		if( this.states.attack <= 0 && this.stun <= 0 && this.delta > 0) {
			if ( !this.autoblock ) {
				if( input.state('block') > 0 ){
					this.force.x = Math.min( Math.max( this.force.x, -2), 2);
					this.states.guard = this.states.attack <= 0;
				}
			} else {
				this.states.guard = this.states.attack <= 0;
			}
			
			if ( input.state('left') > 0 ) { this.force.x -= speed * this.delta * this.inertia; this.stand(); this.flip = true;}
			if ( input.state('right') > 0 ) { this.force.x += speed * this.delta * this.inertia; this.stand(); this.flip = false; }
			if ( input.state('fire') == 1 ) { this.attack(); }
			
			if ( input.state('down') > 0 && this.grounded ) { this.duck(); } else { this.stand(); }
			if ( input.state('up') == 1 ) { this.stand(); }
			
			if( this.spellsCounters.flight > 0 ) {
				this.gravity = 0.1;
				if ( input.state('down') > 0 ) { this.force.y += speed * this.delta * 0.3 }
				if ( input.state('up') > 0 || input.state('jump') > 0 ) { this.force.y -= speed * this.delta * 0.3 }
			} else { 
				if ( input.state('jump') == 1 && this.grounded ) { this.jump(); }
				this.gravity = 1.0; 
			}
		}
		
		//Apply jump boost
		if ( input.state('jump') > 0 && !this.grounded && this.jump_boost ) { 
			var boost = this.spellsCounters.feather_foot > 0 ? 0.7 : 0.45;
			this.force.y -= this.gravity * boost * this.delta; 
		} else {
			this.jump_boost = false;
		}
		
		this.friction = this.grounded ? 0.2 : 0.05;
		this.inertia = this.grounded ? 0.9 : 0.2;
		this.height = this.states.duck ? 24 : 30;
		
		if ( this.states.attack > this.attackProperites.rest && this.states.attack <= this.attackProperites.strike ){
			//Play sound effect for attack
			if( !this.states.startSwing ) {
				audio.play("swing");
				if( this.spellsCounters.magic_sword > 0 || this.hasCharm("charm_sword") ){
					var offset_y = this.states.duck ? 6 : -6;
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
			if( this.spellsCounters.magic_strength > 0 ) temp_damage = Math.floor(temp_damage*1.25);
			this.strike(new Line(
				new Point( 12, (this.states.duck ? 4 : -4) ),
				new Point( 12+this.attackProperites.range , (this.states.duck ? 4 : -4)-4 )
			), "struck", temp_damage );
		} else {
			this.states.startSwing = false;
		}
	}
	
	//Shield
	this.guard.active = this.states.guard;
	this.guard.y = this.states.duck ? this.shieldProperties.duck : this.shieldProperties.stand;
	
	//Animation
	if ( this.stun > 0 || this.life < 0 ) {
		this.stand();
		this.frame = 4;
		this.frame_row = 0;
	} else {
		if( this.states.duck ) {
			this.frame = 3;
			this.frame_row = 1;
			
			if( this.states.attack > 0 ) this.frame = 2;
			if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
			if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
		} else {
			this.frame_row = 0;
			if( this.states.attack > 0 ) this.frame_row = 2;
			if( Math.abs( this.force.x ) > 0.1 ) {
				this.frame = (this.frame + this.delta * 0.1 * Math.abs( this.force.x )) % 3;
			} else {
				this.frame = 0;
			}
		}
		
		if( this.states.attack > 0 ) this.frame = 2;
		if( this.states.attack > this.attackProperites.rest ) this.frame = 1;
		if( this.states.attack > this.attackProperites.strike ) this.frame = 0;		
	}
	
	//Timers
	var attack_decrement_modifier = this.spellsCounters.haste > 0 ? 1.3 : 1.0;
	this.states.attack -= this.delta * attack_decrement_modifier;
	for(var i in this.spellsCounters ) {
		this.spellsCounters[i] -= this.delta;
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
		this.position.y += 3.9999999;
		this.states.duck = true;
		if( this.grounded )	this.force.x = 0;
	}
}
Player.prototype.jump = function(){ 
	var force = 7;
	this.force.y -= force; 
	this.grounded = false; 
	this.jump_boost = true; 
	this.stand(); 
	audio.play("jump");
}
Player.prototype.attack = function(){
	if( this.states.attack <= 0 ) {
		this.states.attack = this.attackProperites.warm;
		if( this.grounded ) {
			this.force.x = 0;
		}
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
			if( shield.name == "small_shield" ){
				this.shieldProperties.duck = 6.0;
				this.shieldProperties.stand = -5.0;
				this.shieldProperties.frame_row = 3;
				this.guard.h = 16;
			} else if ( shield.name == "tower_shield" ){
				this.attackProperites.warm += 15.0;
				this.attackProperites.strike +=  12.0;
				this.attackProperites.rest +=  12.0;
				this.shieldProperties.duck = -5.0;
				this.shieldProperties.stand = -5.0;
				this.guard.h = 32;
				this.shieldProperties.frame_row = 4;
			} else {
				this.shieldProperties.duck = -Number.MAX_VALUE;
				this.shieldProperties.stand = -Number.MAX_VALUE;
				this.shieldProperties.frame_row = 5;
				this.guard.h = 16;
			}
		} else {
			this.shieldProperties.duck = -Number.MAX_VALUE;
			this.shieldProperties.stand = Number.MAX_VALUE;
			this.shieldProperties.frame_row = 5;
		}
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
		ga("send","game","levelup","level",this.level);
		
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
	var shield_frame = (this.states.duck ? 1:0) + (this.states.guard ? 0:2);
	this.sprite.render(g, this.position.subtract(c), shield_frame, this.shieldProperties.frame_row, this.flip);
	
	
	if( this.spellsCounters.flight > 0 ){
		var wings_offset = new Point((this.flip?8:-8),0);
		sprites.magic_effects.render(g,this.position.subtract(c).add(wings_offset),3-(this.spellsCounters.flight*0.2)%3, 0, this.flip);
	}
	
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.spellsCounters.magic_armour > 0 ){
		this.sprite.render(g,this.position.subtract(c),this.frame, this.frame_row, this.flip, "enchanted");
	}
	if( this.spellsCounters.thorns > 0 ){
		sprites.magic_effects.render(g,this.position.subtract(c),3, 0, this.flip);
	}
	
	//Render current sword
	var weapon_filter = this.spellsCounters.magic_strength > 0 ? "enchanted" : "default";
	this.attackProperites.sprite.render(g, this.position.subtract(c), this.frame, this.frame_row, this.flip, weapon_filter);
	
	
	/* Render HP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,7,(this.lifeMax/4)+2,10);
	g.fillStyle = "#000";
	g.scaleFillRect(8,8,this.lifeMax/4,8);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#F00";
	g.scaleFillRect(8,8,Math.max(this.life/4,0),8);
	g.closePath();
	
	/* Render Buffered Damage */
	g.beginPath();
	g.fillStyle = "#A81000";
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
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,19,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,20,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#3CBCFC";
	g.scaleFillRect(8,20,Math.floor(25*(this.mana/this.manaMax)),2);
	g.closePath();
	
	/* Render XP */
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(7,25,25+2,4);
	g.fillStyle = "#000";
	g.scaleFillRect(8,26,25,2);
	g.closePath();
	g.beginPath();
	g.fillStyle = "#FFF";
	g.scaleFillRect(8,26,Math.floor( ((this.experience-this.prevLevel)/(this.nextLevel-this.prevLevel))*25 ),2);
	g.closePath();
	
	textArea(g,"$"+this.money,8, 216 );
	textArea(g,"#"+this.waystones,8, 216+12 );
	
	if( this.stat_points > 0 )
		textArea(g,"Press Start",8, 32 );
	
	//Keys
	for(var i=0; i < this.keys.length; i++) {
		this.keys[i].sprite.render(g, new Point(223+i*4, 40), this.keys[i].frame, this.keys[i].frame_row, false );
	}
	
	//Charm
	if(this.charm instanceof Item ){
		this.charm.position.x = this.charm.position.y = 0;
		this.charm.render(g,new Point(-(this.lifeMax*0.25 + 20),-15));
	}
}

 /* platformer/prisoner.js*/ 

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
Prisoner.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.phase == 1 ){
		boxArea(g,16,16,224,64);
		textArea(g, this.message_thanks, 32,32,192);
	}
	if( this.alert == 1 && this.phase == 0 ){
		boxArea(g,16,16,224,64);
		textArea(g, this.message_help, 32,32,192);
	}
}

 /* platformer/renderers.js*/ 

var textLookup = [
	" ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
	"0","1","2","3","4","5","6","7","8","9",":",";","<","=",">","?",
	":","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
	"P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
	"'","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
	"p","q","r","s","t","u","v","w","x","y","z","{","}","\v","\b","@"
];
function boxArea(g,x,y,w,h){
	g.fillStyle = "#000";
	g.scaleFillRect(x, y, w, h );
	g.fillStyle = "#FFF";
	g.scaleFillRect(x+7, y+7, w-14, h-14 );
	g.fillStyle = "#000";
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
				sprites.text.render(g,new Point(_x*8+x,_y*12+y),index);
				_x++;
			}
		}
	}
}

 /* platformer/shop.js*/ 

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
		
		boxArea(g,16,16,224,64);
		if( this.soldout ) {
			textArea(g,this.message[1],32,32,192);
		} else {
			if( this.items[this.cursor] instanceof Item && "message" in this.items[this.cursor] ){
				textArea(g,this.items[this.cursor].message,32,32,192);
			} else {
				textArea(g,this.message[0],32,32,192);
			}
		}
	}
}

 /* platformer/start.js*/ 

function game_start(g){
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
}

 /* platformer/tiles.js*/ 

window.BLANK_TILE = 166;

CollapseTile.prototype = new GameObject();
CollapseTile.prototype.constructor = GameObject;
function CollapseTile(x,y){
	this.constructor();
	this.position.x = x-8;
	this.position.y = y-8;
	this.sprite = game.tileSprite;
	this.origin = new Point(0.0, 1);
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
		game.setTile(this.position.x, this.position.y, 1, window.BLANK_TILE);
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
	game.setTile(this.position.x, this.position.y, 1, 0);
}
CollapseTile.prototype.destroy = function(){
	game.setTile(this.position.x, this.position.y, 1, 0);
	GameObject.prototype.destroy.apply(this);
}

BreakableTile.prototype = new GameObject();
BreakableTile.prototype.constructor = GameObject;
function BreakableTile(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	this.death_time = Game.DELTASECOND * 0.15;
	
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
		if( game.getTile(this.position.x, this.position.y ) != 0 ) {
			game.addObject(new EffectExplosion(this.position.x, this.position.y,"crash"));
			game.setTile(this.position.x, this.position.y, 1, 0 );
			if( this.item instanceof Item){
				this.item.position.x = this.position.x;
				this.item.position.y = this.position.y;
				game.addObject( this.item );
			}
			//Set off neighbours
			var hits = game.overlaps(new Line(
				this.position.x - 24, this.position.y - 24,
				this.position.x + 24, this.position.y + 24
			));
			for(var i=0; i<hits.length; i++) if( hits[i] instanceof BreakableTile && hits[i].life > 0 ) {
				hits[i].trigger("struck", _player, this.position, 1);
			}
		}
		this.destroy();
	}
}

 /* platformer/villager.js*/ 

Villager.prototype = new GameObject();
Villager.prototype.constructor = GameObject;
function Villager(x,y,t){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.start_x = x;
	this.sprite = sprites.characters;
	this.town = t;
	
	this.state = 0;
	this.speed = 0.5 + Math.random() * 0.9;
	
	this.addModule(mod_talk);
	
	this.path = Math.floor(Math.random()*3); //0 back and forth, 1 loop, 2 still
	this.direction = Math.random()>0.5?1:-1;
	
	var m = Villager.getMessage(this.town);
	
	this.message = m.message;
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
		if( this.path == 0 ){
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
Villager.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if( this.open > 0 ) {
		var m = this.message[this.state].replace("%TOWNNAME%",this.town.name);
		boxArea(g,16,48,224,64);
		textArea(g,m,32,64,192,64);
	}
}
Villager.prototype.idle = function(){}
Villager.getMessage = function(town){
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

 /* platformer/WaystoneChest.js*/ 

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
	
	this.door_blocks = [
		new Point(x,y+16),
		new Point(x,y),
		new Point(x,y-16)
	];
	
	if(this.door){
		this.frame = 1;
		for(var i=0; i < this.door_blocks.length; i++){
			game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, window.BLANK_TILE);
		}
	}
}
WaystoneChest.prototype.update = function(g,c){
	if( this.open > 0 ) {
		if( _player.waystones > 0 ) {
			_player.waystones -= 1;
			if(this.door){
				for(var i=0; i < this.door_blocks.length; i++){
					game.setTile(this.door_blocks[i].x, this.door_blocks[i].y, 1, 0);
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
			this.destroy();
		} else {
			audio.play("negative");
			this.close();
		}
	}
}

 /* platformer/worldmap.js*/ 

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
	//this.seed = "0.08346258359961212";
	this.active = true;
	this.mode = 0;
	
	window._world = this;
	this.sprite = sprites.world;
	
	this.camera = new Point();
	this.player_goto = new Point(16*37,16*7);
	this.player = new Point(16*37,16*7);
	
	this.width = 64;
	this.height = 128;
	this.tiles = [
		[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,22,20,20,20,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,22,20,20,20,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,33,20,20,20,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,33,20,20,20,20,41,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,22,20,34,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,22,21,1,1,1,1,1,1,1,22,20,34,25,25,25,25,4,25,25,25,25,25,25,65,25,17,1,1,1,1,1,1,182,181,1,1,1,1,1,1,1,19,25,25,25,133,25,25,25,25,25,25,25,25,25,25,25,33,20,20,21,1,22,20,34,33,20,20,20,20,20,20,20,34,25,25,25,133,25,25,25,25,25,25,25,88,66,105,25,33,20,180,180,180,180,181,183,184,1,1,1,1,1,1,1,19,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,19,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,65,25,25,25,36,178,178,178,178,178,184,1,182,181,1,1,1,1,1,1,19,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,19,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,88,66,66,66,66,105,25,25,36,24,1,1,1,1,1,1,1,183,184,1,1,1,1,1,22,34,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,19,25,4,25,25,25,25,25,25,25,25,25,4,25,25,49,25,25,65,25,25,25,25,25,25,25,17,1,1,1,1,1,182,181,1,1,1,1,1,1,1,1,19,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,23,35,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,65,25,25,25,25,25,25,25,17,1,1,1,1,1,183,184,1,1,1,1,1,1,1,1,19,25,25,25,25,72,57,25,25,25,25,25,25,25,25,25,36,18,18,24,1,1,1,23,18,18,35,25,25,25,25,25,25,25,25,25,25,72,57,25,65,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,25,25,25,49,25,71,66,66,66,89,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,23,18,18,35,25,4,25,25,25,25,25,25,49,25,65,25,25,25,65,88,66,66,40,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,49,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,22,21,1,1,1,19,25,25,25,25,25,25,88,66,87,66,105,25,25,25,65,65,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,49,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,23,24,1,1,1,19,25,25,25,88,66,66,105,25,49,25,25,25,25,25,104,105,36,24,1,1,1,1,1,182,180,181,1,1,1,1,1,1,1,1,19,25,25,56,50,50,73,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,35,25,25,65,25,56,50,50,73,25,25,25,25,25,25,36,24,1,1,1,1,1,1,179,133,177,1,1,1,1,1,1,1,1,19,25,25,49,25,25,25,25,25,36,18,18,18,24,1,1,1,1,1,1,1,1,1,1,1,1,182,181,1,1,19,25,25,65,25,49,25,25,25,25,25,36,18,18,18,24,1,1,1,1,1,1,1,179,49,177,1,1,1,1,1,1,1,1,19,25,25,49,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,184,1,1,23,35,25,65,25,49,25,25,25,4,25,17,1,1,1,1,1,1,1,1,1,182,180,194,49,177,1,1,1,1,1,1,1,1,19,25,25,72,57,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,65,25,72,57,25,25,25,25,17,1,1,1,1,1,1,1,1,1,179,25,25,49,177,1,1,1,1,1,1,1,1,19,25,25,25,49,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,65,25,25,49,25,25,25,36,24,1,1,1,1,1,1,1,1,182,194,25,56,73,177,1,1,1,1,1,1,1,1,19,25,25,25,49,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,65,25,25,49,25,25,25,17,1,1,1,1,1,1,1,1,1,179,25,56,73,25,177,1,1,1,1,1,1,1,1,19,25,25,25,72,57,25,25,33,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,38,66,105,25,25,72,57,25,25,33,21,1,1,1,1,1,1,1,182,194,25,49,25,196,184,1,1,1,1,1,1,1,1,19,25,25,25,25,49,25,25,25,33,20,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,22,20,34,25,25,25,25,25,49,25,25,25,193,180,180,180,180,180,180,180,194,25,56,73,25,177,1,1,1,1,1,1,1,1,1,19,25,25,25,25,72,57,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,72,57,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,177,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,49,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,177,1,1,1,1,1,1,1,1,1,23,35,25,25,25,25,49,25,25,25,25,56,73,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,22,34,25,25,25,25,25,4,25,25,49,25,25,25,25,56,50,50,50,50,50,50,50,73,25,196,184,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,55,50,50,50,50,73,25,25,33,21,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,148,51,50,50,50,50,73,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,49,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,196,178,178,178,178,178,178,178,184,1,1,1,1,1,1,1,1,1,1,1,19,25,25,25,25,49,25,25,25,25,25,25,25,25,33,20,20,21,1,1,1,1,1,1,1,1,22,34,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,18,35,25,25,72,57,25,25,25,25,25,25,25,25,25,25,33,20,20,21,1,1,1,1,1,19,25,25,25,25,25,56,50,50,50,50,73,25,25,4,25,88,66,40,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,18,35,25,72,57,25,25,25,25,25,25,25,25,25,25,25,25,33,41,20,20,20,41,34,25,25,25,56,50,73,25,25,25,25,25,25,25,88,66,105,25,33,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,195,25,72,50,50,50,57,25,25,25,25,25,25,25,25,25,65,25,25,25,65,56,50,50,50,73,25,25,25,25,25,25,25,25,88,105,25,25,25,25,33,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,195,25,25,25,72,50,50,50,50,50,50,50,50,50,86,50,50,50,86,54,25,25,25,25,25,25,25,88,66,66,66,66,105,25,25,25,25,25,25,25,25,25,33,20,20,20,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,195,25,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,65,49,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,195,25,25,25,25,25,25,25,25,25,25,71,66,66,66,68,87,66,66,66,66,66,66,66,105,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,195,25,25,25,25,25,25,25,88,105,25,25,25,25,49,25,25,25,25,25,25,25,25,25,4,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,33,21,1,1,1,1,1,1,1,1,1,22,20,20,20,20,20,21,1,1,1,1,1,183,178,178,195,25,25,25,25,65,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,22,34,25,25,25,25,25,33,20,21,1,1,1,1,1,1,183,178,195,25,25,65,25,25,25,25,25,49,25,25,25,4,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,33,21,1,1,1,1,1,1,1,38,66,66,105,25,25,25,25,25,72,50,57,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,33,21,1,1,1,1,1,1,1,19,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,22,34,25,25,25,25,25,25,4,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,19,25,25,25,133,25,25,25,25,25,33,21,1,1,1,1,1,19,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,19,25,25,25,49,25,25,25,25,25,25,17,1,1,1,1,1,19,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,193,181,1,1,1,1,1,1,19,25,25,25,49,25,25,25,25,25,25,17,1,1,1,1,22,34,25,25,25,25,25,25,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,19,25,25,25,49,25,25,25,25,25,25,33,20,20,20,41,34,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,34,25,25,25,49,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,25,25,25,25,72,57,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,72,50,57,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,104,66,66,89,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,72,50,57,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,4,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,25,25,25,25,25,55,57,25,25,25,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,72,50,57,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,22,21,1,1,1,25,25,25,25,25,49,72,50,50,57,25,25,25,25,25,25,88,66,105,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,56,50,150,25,25,25,25,25,25,25,25,25,177,1,1,1,1,23,24,1,1,1,25,25,25,25,25,49,25,25,25,72,50,50,57,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,55,50,50,50,50,50,53,50,73,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,49,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,49,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,4,25,25,25,25,25,49,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,182,180,181,1,25,25,25,25,25,49,25,25,25,25,25,25,72,50,50,57,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,4,25,25,49,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,179,25,177,1,25,25,25,25,25,49,25,25,25,25,25,25,25,88,66,87,105,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,56,73,25,25,25,25,25,72,50,57,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,23,18,184,1,25,25,25,25,25,49,25,25,25,25,25,25,25,65,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,56,50,50,50,73,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,65,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,4,49,25,25,25,25,4,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,49,25,25,25,25,25,25,25,65,25,72,50,50,57,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,72,50,57,25,25,25,36,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,72,57,25,25,25,88,66,69,105,25,25,25,25,72,57,25,25,25,25,25,25,25,56,50,73,25,25,25,25,25,25,25,25,25,25,25,25,88,66,87,66,66,66,40,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,65,25,65,25,25,25,25,25,25,49,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,66,66,105,25,72,50,57,25,33,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,65,25,65,25,25,25,25,25,25,72,50,57,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,88,105,25,65,25,25,25,25,25,25,25,25,72,50,50,50,57,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,72,50,57,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,65,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,55,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,4,25,25,25,49,33,21,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,65,25,25,104,66,66,89,25,4,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,88,87,66,40,1,1,1,1,1,1,1,1,1,1,1,1,1,66,66,66,66,66,66,87,66,66,105,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,88,105,49,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,66,66,66,105,25,49,25,33,21,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,72,50,57,25,4,25,25,25,25,104,66,89,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,72,50,57,17,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,17,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,33,21,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,49,25,17,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,72,150,17,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,4,25,25,65,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,65,25,25,25,25,25,25,55,50,50,150,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,72,57,25,25,25,25,25,25,25,65,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,4,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,104,66,89,25,25,56,50,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,104,66,66,87,66,89,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,49,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,25,25,56,73,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,49,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,182,180,181,1,1,1,1,1,1,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,56,50,73,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,33,20,20,20,20,20,34,25,177,1,1,1,1,1,1,25,25,25,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,4,25,25,25,36,178,178,178,178,178,178,178,178,184,1,1,1,1,1,1,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,65,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,56,73,25,25,25,25,104,89,25,25,25,25,25,25,25,25,25,178,178,178,195,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,65,25,25,25,25,25,25,25,25,177,1,1,1,183,178,195,25,25,25,36,18,18,18,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,56,73,25,25,4,25,25,25,104,89,25,25,25,25,25,25,36,184,1,1,1,1,1,183,195,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,56,73,25,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,104,89,25,25,25,25,36,24,1,1,1,1,1,1,1,183,195,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,56,50,73,25,25,25,25,25,25,25,25,25,65,25,25,25,36,24,1,1,1,1,1,1,1,1,1,179,33,21,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,104,66,66,66,40,1,1,1,1,1,1,1,1,1,1,179,25,17,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,56,50,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,179,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,4,25,25,17,1,1,1,1,1,1,1,1,1,1,1,179,25,193,181,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,55,50,50,50,50,50,50,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,182,194,25,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,4,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,182,194,25,25,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,133,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,179,25,25,25,25,193,181,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,49,25,25,49,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,17,1,1,1,1,1,1,1,1,1,1,1,179,25,25,25,25,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,72,50,50,73,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,18,24,1,1,1,1,1,1,1,1,1,1,1,183,195,25,25,25,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,195,25,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,18,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,178,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,36,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,24,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,177,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,196,178,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,195,25,25,25,25,25,25,25,25,25,25,25,25,25,196,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,195,25,25,25,25,25,25,25,25,25,196,178,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,183,178,178,178,178,178,178,178,178,178,184,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,130,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,132,166,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,114,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,82,82,82,82,82,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,98,98,98,98,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,98,98,98,98,98,98,98,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,98,98,98,98,98,98,98,98,98,98,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,98,98,98,98,98,98,98,114,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,98,98,98,98,98,98,98,99,0,97,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,98,98,98,98,98,98,98,98,99,0,97,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,98,98,98,98,98,98,98,98,114,115,0,97,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,83,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,97,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,98,98,99,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,98,98,98,98,98,98,114,115,0,81,82,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,113,98,98,98,98,98,98,98,98,98,99,0,0,0,97,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,83,0,81,82,98,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,98,98,98,98,99,0,81,82,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,99,0,113,114,114,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,113,98,98,98,98,98,98,98,114,115,0,97,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,98,99,0,0,0,0,97,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,98,99,0,0,0,97,98,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,131,0,0,0,0,0,0,0,0,0,0,0,25,97,98,82,83,0,0,97,98,114,98,98,99,0,0,0,0,0,0,0,0,0,0,0,113,98,98,98,98,98,99,0,81,82,98,98,98,98,98,98,98,98,98,0,0,0,0,0,0,0,0,0,147,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,83,0,97,99,0,113,98,99,0,0,0,0,0,0,0,0,0,0,0,0,113,114,98,98,98,99,0,97,98,98,98,98,98,98,98,98,114,115,0,0,0,0,0,0,0,0,0,134,130,131,0,0,0,0,0,0,0,0,0,0,113,98,98,98,99,0,97,99,0,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,114,98,99,0,97,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,146,146,147,0,0,0,0,0,0,0,0,0,0,0,97,98,98,115,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,115,0,97,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,146,146,134,131,0,0,0,0,0,0,0,0,0,81,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,147,0,0,0,0,0,0,0,0,0,97,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,147,0,0,0,0,0,0,0,0,0,113,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,147,0,0,0,0,0,81,82,83,0,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,166,163,0,0,0,0,0,97,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,166,163,0,0,0,0,0,0,113,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,98,98,114,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,130,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,132,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,130,132,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,130,132,146,146,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,166,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,83,0,0,0,129,132,146,146,146,146,146,146,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,98,99,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,98,99,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,115,0,0,0,161,164,146,146,146,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,162,162,164,146,146,146,146,146,146,146,146,146,146,146,146,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,162,164,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,166,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,132,146,146,146,146,146,146,146,146,146,146,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,130,132,146,146,146,146,146,146,146,146,166,162,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,132,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,134,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,132,146,146,146,146,146,146,146,146,146,146,146,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,166,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,132,146,146,146,146,146,146,146,146,146,146,166,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,166,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,147,0,0,0,0,0,81,82,82,82,83,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,146,146,146,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,147,0,0,0,81,82,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,145,146,146,146,146,146,146,146,166,162,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,146,146,147,0,0,0,97,98,98,98,98,98,98,83,0,0,0,0,0,0,0,0,0,0,161,162,164,146,146,166,162,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,146,146,166,162,163,0,0,81,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,161,162,162,163,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,166,162,163,0,0,0,0,97,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,162,163,0,0,0,0,0,0,97,98,98,98,98,98,98,114,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,82,82,83,0,97,98,98,98,98,98,114,115,0,81,82,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,99,0,97,98,98,98,98,99,0,0,0,97,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,98,98,98,98,99,0,113,114,114,114,114,115,0,81,82,98,98,98,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,99,0,0,0,0,0,0,0,0,97,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,114,98,99,0,81,82,82,82,82,82,82,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,99,0,97,99,0,97,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,99,0,113,115,0,97,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,99,0,0,0,0,97,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,82,82,82,82,98,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,98,114,98,98,98,98,98,98,98,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,98,98,98,98,98,98,99,0,97,98,98,98,98,114,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,114,98,98,98,98,98,99,0,97,98,114,114,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,113,114,114,114,114,115,0,113,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	];
	
	this.temples = [];
	for(var i=0; i<9; i++) this.temples.push({ "number":i, "complete":false, "position":new Point(), "seed":i+this.seed });
	this.temples[0].position.x = 54*16; this.temples[0].position.y = 16*16;
	this.temples[1].position.x = 5*16; this.temples[1].position.y = 6*16;
	this.temples[2].position.x = 49*16; this.temples[2].position.y = 39*16;
	this.temples[3].position.x = 10*16; this.temples[3].position.y = 45*16;
	this.temples[4].position.x = 33*16; this.temples[4].position.y = 74*16;
	this.temples[5].position.x = 61*16; this.temples[5].position.y = 57*16; this.temples[5].complete = true;
	this.temples[6].position.x = 56*16; this.temples[6].position.y = 83*16;
	this.temples[7].position.x = 8*16; this.temples[7].position.y = 107*16;
	this.temples[8].position.x = 24*16; this.temples[8].position.y = 8*16;
	
	this.towns = [];
	for(var i=0; i<7; i++) this.towns.push({ "id":i, "nation":Math.floor(Math.random()*3), "faith":Math.floor(Math.random()*3), "capital":false, "position":new Point(), "size":Math.floor(1+Math.random()*3), "seed":i+this.seed });
	this.towns[0].position.x = 37*16; this.towns[0].position.y = 6*16; this.towns[0].name = "Aghalee"; size = 1
	this.towns[1].position.x = 37*16; this.towns[1].position.y = 27*16; this.towns[1].name = "Bessbrook";
	this.towns[2].position.x = 44*16; this.towns[2].position.y = 53*16; this.towns[2].name = "Creggan";
	this.towns[3].position.x = 51*16; this.towns[3].position.y = 74*16; this.towns[3].name = "Drumhillock";
	this.towns[4].position.x = 27*16; this.towns[4].position.y = 76*16; this.towns[4].name = "Eshbrack";
	this.towns[5].position.x = 4*16; this.towns[5].position.y = 41*16; this.towns[5].name = "Fairhill";
	this.towns[6].position.x = 3*16; this.towns[6].position.y = 96*16; this.towns[6].name = "Glenanne";
	
	this.animation = 0;
	
	
	audio.playAs("music_world", "music");
	this.on("activate", function(){
		audio.playAs("music_world", "music");
		this.active = true;
		game.addObject( this );
		game.pause = false;
		
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
			this.player = new Point(16*37,16*6);
			this.player_goto = new Point(16*37,16*6);
			dataManager.reset();
			
			this.trigger("activate");
		}
	});
}

WorldMap.prototype.update = function(){
	if( this.active ){
		game.clearAll();
		game.addObject( this );
	}
	
	if( this.player_goto.x == this.player.x && this.player_goto.y == this.player.y ) {
		var current = new Point( this.player_goto.x, this.player_goto.y );
		if( input.state("left") > 0 ) this.player_goto.x = this.player.x - 16;
		else if( input.state("right") > 0 ) this.player_goto.x = this.player.x + 16;
		else if( input.state("up") > 0 ) this.player_goto.y = this.player.y - 16;
		else if( input.state("down") > 0 ) this.player_goto.y = this.player.y + 16;
		
		if( !this.passable(this.player_goto.x, this.player_goto.y) ){
			this.player_goto = current;
		}
	}
	
	this.player_goto.x = Math.floor(this.player_goto.x/16)*16;
	this.player_goto.y = Math.floor(this.player_goto.y/16)*16;
	
	/* Move to the goto location */
	if( Math.abs( this.player.x - this.player_goto.x ) <= (this.delta*this.speed) )
		this.player.x = this.player_goto.x;
	else
		this.player.x += ( (this.player_goto.x > this.player.x ) ? 1 : -1 ) * this.delta * this.speed;
	
	if( Math.abs( this.player.y - this.player_goto.y )  <= (this.delta*this.speed) )	
		this.player.y = this.player_goto.y;
	else
		this.player.y += ( (this.player_goto.y > this.player.y ) ? 1 : -1 ) * this.delta * this.speed;
		
	/* Inside temple? */
	for(var i=0; i < this.temples.length; i++ ){
		if( this.active && this.temples[i].position.subtract(this.player).length() < 0.5 && !this.temples[i].complete ){
			this.active = false;
			this.player.y += 16;
			this.player_goto.y = this.player.y;
			dataManager.randomLevel(game, i, this.temples[i].seed);
			audio.playAs("music_temple1", "music");
		}
	}
	
	/* Inside town? */
	for(var i=0; i < this.towns.length; i++ ){
		if( this.active && this.towns[i].position.subtract(this.player).length() < 0.5 ){
			this.active = false;
			this.player.y += 16;
			this.player_goto.y = this.player.y;
			dataManager.randomTown(game, this.towns[i]);
			audio.playAs("music_town", "music");
		}
	}
	
	/* Lock camera */
	this.animation += this.delta * 0.1;
	this.camera = this.player.subtract( new Point(128,120) );
	
	this.camera.x = Math.max( this.camera.x, 0 );
	this.camera.x = Math.min( this.camera.x, this.width * 16 - 256);
	this.camera.y = Math.max( this.camera.y, 0 );
	this.camera.y = Math.min( this.camera.y, this.height * 16 - 240 );
}
WorldMap.prototype.passable = function(x,y){
	var block_list = [0,37,38,39,40,64,65,66,67,68,69,87,88,103,104];
	var index = Math.floor(x/16) + Math.floor((y/16)*this.width);
	var t = this.tiles[0][index]-1;
	var r = this.tiles[1][index];
	return block_list.indexOf( t ) < 0 && r == 0;
}
WorldMap.prototype.idle = function(){}
WorldMap.prototype.render = function(g,c){
	c = new Point( Math.floor(this.camera.x/16), Math.floor(this.camera.y/16) );
	var animated = [0,3];
	
	for(x=0; x < 17; x++) for(y=0; y < 16; y++) {
		var index = (c.x+x) + Math.floor((c.y+y)*this.width);
		var top = this.tiles[1][index]-1;
		var bottom = this.tiles[0][index]-1;
		
		if( animated.indexOf(top) >= 0) top = top + Math.floor( this.animation % 3 );
		if( animated.indexOf(bottom) >= 0) bottom = bottom + Math.floor( this.animation % 3 );
		
		this.sprite.render(g, new Point(x*16-(this.camera.x%16), y*16-(this.camera.y%16)), bottom );
		this.sprite.render(g, new Point(x*16-(this.camera.x%16), y*16-(this.camera.y%16)), top );
	}
	
	for(var i=0; i < this.temples.length; i++ ){
		var complete_frame = this.temples[i].complete ? 4 : 3;
		this.sprite.render(g, this.temples[i].position.subtract(this.camera), complete_frame, 5 );
	}
	
	this.sprite.render(g, this.player.subtract(this.camera), 0, 13 );
	
	for(var i=0; i < this.towns.length; i++ ){
		this.renderTown(g, this.towns[i].position.subtract(this.camera), this.towns[i] );
	}
}
WorldMap.prototype.renderTown = function(g,c,town){
	var size = Math.min(town.size-1,3);
	this.sprite.render(g, new Point(c.x,c.y), 3+size, 7 );
	
	this.sprite.render(g, new Point(c.x,c.y-12), town.faith+6, 8 );
	this.sprite.render(g, new Point(c.x,c.y-12), town.nation+6, 9 );
	
}
WorldMap.Shops = [
	"Alter",
	"Arena",
	"Prisoner",
	"Shop",
	"WaystoneChest"
];

 /* platformer/scenes/ending.js*/ 

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
		}
	} else if( this.phase == 3 ){
		//Show Scores
		if(input.state("pause") == 1) {
			//Return to title screen
			game.clearAll();
			game.addObject(new TitleMenu());
			audio.stopAs("music");
		}
	}
	
	if(this.phase < 3 && input.state("pause") == 1 ) this.phase = 3;
}
SceneEnding.prototype.render = function(g,c){
	for(var x=0; x<17; x++) for(var y=0; y<16; y++) {
		var tile = y <= 0 ? 32 : 96;
		var off = c.x % 16;
		game.tileSprite.render(g,new Point(x*16-off,208+y*16),tile);
	}
	
	if( this.phase == 0 ) {
		g.fillStyle = "#000";
		g.scaleFillRect(0, 0, 256, 240 );
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
		boxArea(g,0,0,256,240);
	}
}
SceneEnding.prototype.idle = function(){}