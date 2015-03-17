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
		var tresure = dataManager.randomTresure(Math.random()); 
		tresure.remaining--;
		
		item = new Item(this.position.x-26+(i*52), this.position.y-104, tresure.name);
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
			this.open = 0;
			game.pause = false;
			
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 ){
			this.open = 0;
			game.pause = false;
		}
	}
	
	if( this.active ) {
		var total_life = 0;
		this.enemies_ready -= this.delta;
		for(var i=0; i < this.enemies.length; i++){
			total_life += Math.max(this.enemies[i].life, 0);
			this.enemies[i].interactive = this.enemies_ready <= 0;
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
		textArea(g,this.message[0],32,64,192,64);
		
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