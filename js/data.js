function DataManager() {	
	this.temples = [
		{"tiles":"tiles1","size":10,"maxkeys":1,"treasures":[1,2],"boss":["Chort"],"miniboss":["Skeleton","Oriax"],"majormonster":["Bear","Skeleton"],"minormonster":["Beaker","Shell"],"minorfly":["Batty"]},
		{"tiles":"tiles3","size":11,"maxkeys":2,"treasures":[1,3],"boss":["Marquis"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Shell"],"minorfly":["Amon","Batty"]},
		{"tiles":"tiles2","size":12,"maxkeys":2,"treasures":[2,4],"boss":["Minotaur","Ammit"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Amon"],"minorfly":["Batty","Ghoul"]},
		{"tiles":"tiles5","size":13,"maxkeys":3,"treasures":[3,4],"boss":["Minotaur","Garmr"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Amon"],"minorfly":["Ghoul"]},
		{"tiles":"tiles4","size":14,"maxkeys":3,"treasures":[3,5],"boss":["Zoder"],"miniboss":["Knight","Oriax"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Ratgut"],"minorfly":["Batty","Svarog"]},
		{"tiles":"tiles2","size":15,"maxkeys":4,"treasures":[2,4],"boss":["Poseidon"],"miniboss":["Knight","Oriax","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Ratgut"],"minorfly":["Batty"]},
		
		
		{"tiles":"tiles5","size":16,"maxkeys":4,"treasures":[2,4],"boss":["Garmr"],"miniboss":["Knight","Malphas","ChazBike"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Ratgut"],"minorfly":["Batty","Svarog"]},
		{"tiles":"tiles2","size":17,"maxkeys":4,"treasures":[2,4],"boss":["Zoder"],"miniboss":["Knight","Malphas","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Amon"],"minorfly":["Batty","Svarog"]},
		{"tiles":"tiles2","size":18,"maxkeys":5,"treasures":[2,4],"boss":["Poseidon"],"miniboss":["Knight","Malphas","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Amon"],"minorfly":["Batty","Svarog"]}
	];
	
	/* Set data */
	
	this.treasures = [
		{"tags":["goods","chest"],"name":"life","rarity":0.5,"pathSize":1,"doors":0.0,"pergame":9999,"price":20},
		{"tags":["goods","chest"],"name":"mana_small","rarity":0.3,"pathSize":1,"doors":0.0,"pergame":9999,"price":30},
		{"tags":["treasure","chest","shop"],"name":"xp_big","rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":40},
		{"tags":["treasure","chest"],"name":"money_bag","rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
		{"tags":["treasure","shop"],"name":"life_up","rarity":0.01,"pathSize":4,"doors":0.5,"pergame":9999,"price":500},
		{"tags":["stone","chest"],"name":"waystone","rarity":0.2,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
		
		{"tags":["treasure","chest","weapon"],"name":"short_sword","rarity":0.2,"pathSize":2,"doors":0.0,"pergame":10,"price":20},
		{"tags":["treasure","chest","weapon"],"name":"long_sword","rarity":0.3,"pathSize":3,"doors":0.0,"pergame":10,"price":30},
		{"tags":["treasure","chest","weapon"],"name":"spear","rarity":0.2,"pathSize":3,"doors":0.5,"pergame":10,"price":30},
		{"tags":["weapon"],"name":"tower_shield","rarity":0.05,"pathSize":4,"doors":0.5,"pergame":10,"price":50},
		
		{"tags":["treasure","shop"],"name":"seed_oriax","rarity":0.1,"pathSize":6,"doors":0.3,"pergame":1,"price":100},
		{"tags":["treasure","shop"],"name":"seed_bear","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"seed_malphas","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"seed_cryptid","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"seed_knight","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"seed_minotaur","rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		{"tags":["treasure","shop"],"name":"seed_plaguerat","rarity":0.05,"pathSize":5,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure","shop"],"name":"seed_marquis","rarity":0.06,"pathSize":3,"doors":0.1,"pergame":1,"price":90},
		{"tags":["treasure","shop"],"name":"seed_batty","rarity":0.01,"pathSize":7,"doors":0.1,"pergame":1,"price":150},
		
		{"tags":["treasure","shop"],"name":"pedila","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		{"tags":["treasure","shop"],"name":"haft","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		{"tags":["treasure","shop"],"name":"zacchaeus_stick","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		{"tags":["treasure","shop"],"name":"fangs","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		{"tags":["chest","treasure","shop"],"name":"passion_fruit","rarity":0.1,"pathSize":2,"doors":0.0,"pergame":9999,"price":100},
		{"tags":["treasure","shop"],"name":"shield_metal","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70},
		//{"tags":["treasure","shop"],"name":"magic_gem","rarity":0.05,"pathSize":6,"doors":0.1,"pergame":1,"price":100},
		{"tags":["treasure","shop"],"name":"snake_head","rarity":0.04,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure","shop"],"name":"broken_banana","rarity":0.05,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure","shop"],"name":"blood_letter","rarity":0.05,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure","shop"],"name":"red_cape","rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"chort_nose","rarity":0.08,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"plague_mask","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":50},
		{"tags":["treasure","shop"],"name":"spiked_shield","rarity":0.04,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		
		{"tags":["chest","alter"],"name":"charm_sword","rarity":0.03,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["chest"],"name":"charm_mana","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure","shop"],"name":"charm_alchemist","rarity":0.1,"pathSize":5,"doors":0.1,"pergame":1,"price":80},
		{"tags":["chest","treasure","shop"],"name":"charm_musa","rarity":0.04,"pathSize":6,"doors":0.3,"pergame":1,"price":120},
		{"tags":["treasure"],"name":"charm_wise","rarity":0.04,"pathSize":3,"doors":0.3,"pergame":1,"price":80},
		{"tags":["chest","shop"],"name":"charm_methuselah","rarity":0.06,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["treasure"],"name":"charm_barter","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":80},
		{"tags":["chest","shop"],"name":"charm_elephant","rarity":0.1,"pathSize":4,"doors":0.1,"pergame":1,"price":70}
	];
	
	this.rules = {
		"start": function(){ return [[this.roomFromTags(["entry"]),1,0]]; 
		},
		"final" : function(level, direction,options){ 
			if(level==options.size) return [[this.roomFromTags(["entry_final"]),direction,0]]; 
			if(level==0) {
				if( direction > 0 ) return [[this.roomFromTags(["exit_w"]),direction,0]]; 
				return [[this.roomFromTags(["exit_e"]),direction,0]]; 
			}
			if(level==1) return [[this.roomFromTags(["boss"]),direction,0]]; 
			if(level==2) return [[this.roomFromTags(["walk"]),direction,0]]; 
			if((level==3 || seed.randomBool(0.1)) && this.keysRemaining()>0 ) return [[this.roomFromTags(["door"]),direction,0,{"door":this.randomKey(0.1)}]];
			if(this.shop_counter < 1 && seed.randomBool(0.9-((level-3)*.1)) ) return [[this.roomFromTags(["shop"]),direction,0,{"shop":true}]];
			if(level > 4 && seed.randomBool(.3) ) return [["j",direction,-1],["j",direction,1],["j",direction,0]]; 
			return [[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0]]; 
		},
		"main" : function(level, direction,options){ 
			if(level==options.size) return [[this.roomFromTags(["entry"]),direction,0]]; 
			if(level==0) {
				if( direction > 0 ) return [[this.roomFromTags(["exit_w"]),direction,0]]; 
				return [[this.roomFromTags(["exit_e"]),direction,0]]; 
			}
			if(level==1) return [[this.roomFromTags(["boss"]),direction,0]]; 
			if((level==2 || seed.randomBool(0.1)) && this.keysRemaining()>0 ) return [[this.roomFromTags(["door"]),direction,0,{"door":this.randomKey(0.1)}]];
			if(this.shop_counter < 1 && seed.randomBool(0.9-((level-3)*.1)) ) return [[this.roomFromTags(["shop"]),direction,0,{"shop":true}]];
			if(level > 3 && seed.randomBool(.3) ) return [["j",direction,-1],["j",direction,1],["j",direction,0]]; 
			return [[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0]]; 
		},
		"item" : function(level,direction,options,cursor){
			if(level==0) {
				if( direction > 0 ) return [[this.roomFromTags(["item_w"], options),direction,0,{"item":options.item}]];
				else return [[this.roomFromTags(["item_e"], options),direction,0,{"item":options.item}]];
			}
			if(level==(options.size-2) && this.keysRemaining()>0 && seed.randomBool("doors" in options ? options.doors : .6) ) return [[this.roomFromTags(["door"]),direction,0,{"door":this.randomKey(0.95)}]];
			if(level==1) return [[this.roomFromTags(["miniboss"]), direction, 0]];
			if("optional" in options && seed.randomBool(0.4)) return [[this.roomFromTags(["optional"]), direction, 0]];
			if(cursor.y>1 && seed.randomBool(0.04)) return [[this.roomFromTags(["well"]), direction, 0]];
			if(seed.randomBool(.1) && level > 2) return [["j",direction,-1],["j",direction,1],[this.randomRoom(), direction, 0]]; 
			return [[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0]]; 
		},
		"prison" : function(level,direction,options){
			if(level==0) {
				if( direction > 0 ) return [[this.roomFromTags(["prison_w"], options),direction,0,{"door":this.randomKey(0.5)}]];
				else return [[this.roomFromTags(["prison_e"], options),direction,0,{"door":this.randomKey(0.5)}]];
			}
			if(seed.randomBool(0.3) && level > 1) return [["j",direction,-1],["j",direction,1],[this.randomRoom(), direction, 0]]; 
			return [[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0],[this.randomRoom(), direction, 0]]; 
		}
	}
	
	load_sprites();
	this.reset();
}

DataManager.prototype.reset = function(){
	if( game instanceof Game ) game.pause = false;
	window._player = undefined;
	window._shop = undefined;
	audio.stop("music");
	
	this.currentTemple = -1;
	this.currentTown = -1;
	
	for(var i=0; i < this.treasures.length; i++ ) this.treasures[i]["remaining"] = this.treasures[i].pergame;
}
DataManager.prototype.randomTown = function(g, town){
	var s = new Seed(town.seed);
	this.room_matrix = {};
	_map_junctions_matrix = {};
	this.properties_matrix = {};
	this.branch_matrix = {};
	this.secret_matrix = {};
	this.waterfall_matrix = {};
	this.currentTemple = -1;
	this.currentTown = town.id;
	
	var specials = {
		3: {"odds":0.3, count:0},
		4: {"odds":0.3, count:0},
		6: {"odds":0.3, count:0},
		8: {"odds":0.3, count:0}
		
	}
	
	g.clearAll();
	g.tileSprite = sprites.town;
	
	var rooms = new Array();
	var length = 4 + town.size * 2;
	for(var i=0; i < length; i++){
		if( i == 0 ) { 
			rooms[i] = 10;
		} else if ( i == length-1) {
			rooms[i] = 9;
		} else {
			rooms[i] = town.size-1;
			for(var j in specials){
				if( s.randomBool(specials[j].odds) && specials[j].count <= 0) {
					rooms[i] = j;
					specials[j].count++;
				}
			}
			if( s.randomBool(0.7) )
				g.addObject(new Villager(128+i*128,192,town));
		}
	}
	g.bounds = g.tileDimension = new Line(0,0,rooms.length*8,15);
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	g.buildCollisions();
	g.addObject(new PauseMenu());
	g.addObject(new Background());
	
	for(var i=0; i < rooms.length; i++){
		this.createRoom(g,_map_town[ rooms[i] ], new Point(i*128,0),"TOWNS_DONT_HAVE_PROPERTIES",8);
	}
	if( _player instanceof Player ) {
		_player.lock = new Line(0,0,rooms.length*128,240);
		_player.lock_overwrite = false;
		_player.keys = new Array();
	}
}
DataManager.prototype.randomLevel = function(g, temple, s){
	var success = false;
	this.currentTemple = Math.min( temple, this.temples.length-1);
	this.currentTown = -1;
	var temple = this.temples[ this.currentTemple ];
	s = s || "" + Math.random();
	window.seed = new Seed( s );
	
	g.clearAll();
	g.tileSprite = sprites[temple.tiles];
	
	while( !success ) {
		this.key_counter = 0;
		this.shop_counter = 0;
		this.branch_counter = 0;		
		
		this.room_matrix = {};
		_map_junctions_matrix = {};
		this.properties_matrix = {};
		this.branch_matrix = {};
		this.secret_matrix = {};
		this.waterfall_matrix = {};
		
		var options = {
			"rules":(this.currentTemple == 5 ? this.rules.final : this.rules.main),
			"size":temple.size
		}
		
		/*
		this.room_matrix = {
			"0_0" : 0,
			"1_0" : -1,
			"2_0" : -1,
			"3_0" : 17,
			"4_0" : -1,
			"5_0" : -1
		};
		break;
		*/
		
		success = this.addRoom(options,temple.size,1, new Point(0,0));
		//success = this.addRoom(options,1,1, new Point(0,0));
		
		if( this.junctionCount() > 0 ) {
			//Add a branch for a map
			var map_size = Math.floor(1+seed.random()*3);
			
			this.addBranch({"rules":this.rules.item,"item":"map","doors":0.0,"size":map_size}, map_size, Object.keys(_map_junctions_matrix))
			this.addBranch({"rules":this.rules.prison}, Math.floor(1+seed.random()*3), Object.keys(_map_junctions_matrix))
			
			//Add branches for items
			var current_brances = this.branch_counter;
			for(var i=0; i < Math.max(temple.treasures[1]-current_brances,temple.treasures[0]); i++ ){
				var size = seed.randomInt(2,6);
				if( this.addBranch({"rules":this.rules.item,"door":0.15,"size":size,"optional":true}, size, Object.keys(_map_junctions_matrix)) ) {
					//Branch created successfully. 
				}
			}
			
			this.addSecret({"item":"life_up"});
		} else {
			console.error("Seriously? No junctions? Try that again.");
			success = false;
		}
	}
	
	//Everything is okay, build the level
	var width = 256;
	var height = 240;
	
	this.temple_instance = false;
	if( "instance" in _world.temples[this.currentTemple] ) {
		//Get existing temple instance
		this.temple_instance = _world.temples[this.currentTemple].instance;
	}
	
	//Establish the level size and build tile matrix
	g.tileDimension = new Line(9999,9999,-9999,-9999);
	for(var i in this.room_matrix){
		pos = new Point(
			~~i.match(/(-?\d+)/g)[0],
			~~i.match(/(-?\d+)/g)[1]
		);
		if( pos.x < g.tileDimension.start.x ) g.tileDimension.start.x = pos.x;
		if( pos.y < g.tileDimension.start.y ) g.tileDimension.start.y = pos.y;
		if( pos.x > g.tileDimension.end.x ) g.tileDimension.end.x = pos.x;
		if( pos.y > g.tileDimension.end.y ) g.tileDimension.end.y = pos.y;
	}
	var tile_width = width / 16;
	var tile_height = height / 16;
	g.tileDimension.start.x *= tile_width; g.tileDimension.end.x = (g.tileDimension.end.x+1) * tile_width;
	g.tileDimension.start.y *= tile_height; g.tileDimension.end.y = (g.tileDimension.end.y+1) * tile_height;
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	var mapDimension = g.tileDimension.scale(1.0/16,1.0/15)
	var mapTiles = new Array( Math.floor( mapDimension.area() ) );
	
	
	for(var i in this.room_matrix){
		var pos = new Point(
			~~i.match(/(-?\d+)/g)[0],
			~~i.match(/(-?\d+)/g)[1]
		);
		var map_index = Math.floor( pos.x - mapDimension.start.x + (pos.y - mapDimension.start.y) * mapDimension.width() );
		
		if( mapTiles[ map_index ] == undefined )
			mapTiles[ map_index ] = 1;
		
		var room;
		if( this.room_matrix[i] == "j" ) {
			var tags = _map_junctions_matrix[i];
			room = _map_junctions[ this.getJunctionRoomIndex(tags) ];
		} else if ( this.room_matrix[i] >= 0 ) { 
			room = _map_rooms[ this.room_matrix[i] ];
		} else { 
			room = null;
		}
		
		if( room ) {
			var cursor = new Point(pos.x * width, pos.y * height );
			this.createRoom(g,room,cursor,i);
			
			//If this room uses a specific map tile
			if( "map_tile" in room ) {
				var map_tiles = room["map_tile"].split(",");
				for(var j=0; j < map_tiles.length; j++ )
					mapTiles[ map_index + j ] = map_tiles[j] - 0;
			}
		}
	}
	g.collisions.push( new Line(-512,240,-512,0) );
	//g.collisions.push( new Line(cursor,0,cursor,240) );
	
	var pm = new PauseMenu();
	pm.map = mapTiles;
	pm.mapDimension = mapDimension;
	g.addObject(pm);
	g.addObject(new Background());
	
	g.buildCollisions();
	
	//Cut out secrets
	for(var i in this.secret_matrix ){
		var pos = new Point(
			~~i.match(/(-?\d+)/g)[0],
			~~i.match(/(-?\d+)/g)[1]
		);
		var map_index = Math.floor( pos.x - mapDimension.start.x + (pos.y - mapDimension.start.y) * mapDimension.width() );
		pm.map
		this.cut( 256*(this.secret_matrix[i] > 0 ? pos.x-1 : pos.x), 240*pos.y);
		pm.map[map_index] = -pm.map[map_index];
	}
	
	//Add wall meat
	 this.wallmeat();
	 
	//Cut waterfalls
	for(var i in this.waterfall_matrix ){
		var pos = new Point(
			~~i.match(/(-?\d+)/g)[0],
			~~i.match(/(-?\d+)/g)[1]
		);
		var map_index = Math.floor( pos.x - mapDimension.start.x + (pos.y - mapDimension.start.y) * mapDimension.width() );
		var limits = new Line(
			64+pos.x*256,
			120+pos.y*240,
			192+pos.x*256,
			120+pos.y*240 + (this.waterfall_matrix[i]*256)
		);
		for(var x=limits.start.x;x<=limits.end.x;x+=16)
		for(var y=limits.start.y;y<=limits.end.y;y+=16) {
			game.setTile(x,y,1,0);
			game.setTile(x,y,0,0);
		}
		var objs = game.overlaps(limits);
		for(var j=0; j < objs.lenght; j++){
			if( objs[j] instanceof DeathTrigger ){
				objs[j].destroy();
			}
		}
		for(var j=0; j <= this.waterfall_matrix[i]; j++){
			for(var x=0;x<4;x++){
				game.addObject(new CollapseTile(pos.x*256+104+x*16,(pos.y+j)*240+184));
			}
			game.setTile(limits.start.x-16,(pos.y+j)*240+112,1,0);
			game.setTile(limits.start.x-16,(pos.y+j)*240+128,1,0);
			game.setTile(limits.end.x+16,(pos.y+j)*240+112,1,0);
			game.setTile(limits.end.x+16,(pos.y+j)*240+128,1,0);
			
			var wf_i = j>=this.waterfall_matrix[i] ? 2 : (j==0?0:1);
			game.addObject( new Waterfall(pos.x*256+128,(pos.y+j)*240+120,wf_i));
		}
	}
	
	if( this.temple_instance ) {
		pm.map_reveal = this.temple_instance.map;
		_player.keys = this.temple_instance.keys;
		for(var i=0; i<this.temple_instance.items.length; i++) g.addObject(this.temple_instance.items[i]);
		for(var i=0; i<this.temple_instance.shops.length; i++) g.addObject(this.temple_instance.shops[i]);
	}
}

DataManager.prototype.createRoom = function(g,room,cursor,id,room_size){
	var layers = ["back","front"];
	
	if( this.currentTemple < 0 || this.currentTemple >= this.temples.length ) {
		var temple = this.temples[ 0 ];
	} else {
		var temple = this.temples[ this.currentTemple ];
	}
	
	var minormonster = temple.minormonster;
	var minorfly = temple.minorfly;
	var majormonster = temple.majormonster;
	var miniboss = temple.miniboss;
	var boss = temple.boss;
	
	var ts = 16;
	room_size = room_size || 16;
	
	//Render tiles
	for(var j=0; j < layers.length; j++ ) {
		if( layers[j] in room ) {
			for(var i=0; i < room[layers[j]].length; i++){
				var x = Math.floor( i % ( room_size * room.width ) );
				var y = Math.floor( i / ( room_size * room.width ) );
				var offset = Math.floor( 
					Math.floor( (x-g.tileDimension.start.x) + Math.floor( cursor.x / ts ) ) + 
					Math.floor( ((y-g.tileDimension.start.y) + Math.floor( cursor.y / ts ) ) * g.tileDimension.width() )
				);
				g.tiles[j][offset] = room[layers[j]][i];
			}
		}
	}
	
	//Add objects
	for(var j=0; j < room.objects.length; j++){
		var obj = room.objects[j];
		var objectName = obj[2];
		var properties = obj[3];
		var addObject = true;
		
		if( id in this.properties_matrix ){
			var props = this.properties_matrix[id];
		}
		
		if( "min_temple" in properties && this.currentTemple < properties["min_temple"]-0 ) addObject = false;
		if( "max_temple" in properties && this.currentTemple > properties["max_temple"]-0 ) addObject = false;
		if( "rarity" in properties && seed.random() > properties["rarity"]-0 ) addObject = false;		
		
		if( addObject ){
			if(objectName == "Boss") objectName = boss[ Math.floor( seed.random() *  boss.length ) ];
			if(objectName == "Miniboss") objectName = miniboss[ Math.floor( seed.random() * miniboss.length ) ];
			if(objectName == "MajorMonster") objectName = majormonster[ Math.floor( seed.random() * majormonster.length ) ];
			if(objectName == "MinorMonster") objectName = minormonster[ Math.floor( seed.random() * minormonster.length ) ];
			if(objectName == "MinorFly") objectName = minorfly[ Math.floor( seed.random() * minorfly.length ) ];
			
			//Debug mode
			if( window.debug && objectName == "Player" ) objectName = "Debuger";
			
			var new_obj;
			var props = (id in this.properties_matrix ? this.properties_matrix[id] : {});

			if( objectName == "Player" && window._player != undefined ) {
				//Special rules for player
				new_obj = _player;
				new_obj.position.x = cursor.x + obj[0]; 
				new_obj.position.y = cursor.y + obj[1]; 
				new_obj.checkpoint = new Point(_player.position.x, _player.position.y);
			} else if ( WorldMap.Shops.indexOf( objectName ) >= 0 ) {
				//Special rules for shops
				if( !this.temple_instance )
					new_obj = new window[objectName](cursor.x + obj[0], cursor.y + obj[1], null, obj[3]);
				else
					new_obj = false;
			} else if ( objectName == "Treasure" || objectName == "Item" ) {
				//Special rules for items
				if( !this.temple_instance ) {
					new_obj = new Item(cursor.x + obj[0], cursor.y + obj[1]);
					if( "item" in props && props.item != undefined ) {
						new_obj.setName(props.item);
					} else {
						var treasure = this.randomTreasure(Math.random(),["treasure"]);
						new_obj.setName(treasure.name);
						treasure.remaining--;
					}
				}
			} else if ( objectName == "Door" ){
				//Special rules for doors
				new_obj = new Door(cursor.x + obj[0], cursor.y + obj[1]);
				if("door" in props) new_obj.name = "key_" + props["door"];
			} else {
				//Generic object
				try { 
					new_obj = new window[objectName](cursor.x + obj[0], cursor.y + obj[1], null, obj[3]); 
				} catch (err) { console.error( "Could not create object: " + objectName ); }
			}
			
			g.addObject( new_obj );
		}
	}
	
	//Add collisions
	if( "lines" in room ) {
		for(var j=0; j < room.lines.length; j++){
			var line = room.lines[j];
			temp = new Line( 
				new Point( cursor.x + line[0], cursor.y + line[1] ),
				new Point( cursor.x + line[2], cursor.y + line[3] )
			);
			g.collisions.push( temp );
		}
	}
}

DataManager.prototype.randomKey = function(oddsOfReuse){
	if( seed.randomBool(oddsOfReuse) && this.existingKeys().length > 0 ) {
		return this.randomExistingKey();
	}
	return this.key_counter;
}
DataManager.prototype.randomExistingKey = function(){
	var keys = this.existingKeys();
	var key = keys[ Math.floor( keys.length * seed.random()) ];
	return key.match(/\d+$/)[0] - 0;
}

DataManager.prototype.existingKeys = function(){
	var out = [];
	for(var i in this.properties_matrix){
		if( "item" in this.properties_matrix[i] ){
			if( this.properties_matrix[i]["item"].match(/^key_\d+$/) ) {
				out.push( this.properties_matrix[i]["item"] );
			}
		}
	}
	return out;
}
DataManager.prototype.existingKeysIndex = function(){
	var keys = this.existingKeys();
	var out = new Array();
	for(var i=0; i < keys.length; i++ ){
		try{
			out.push( keys[0].match(/\d+$/)[0] - 0 );
		} catch (err) {}
	}
	return out;
}

DataManager.prototype.keysRemaining = function(){
	var temple = this.temples[ this.currentTemple ];
	return temple.maxkeys - this.key_counter;
}
DataManager.prototype.getJunctionRoomIndex = function(tags){
	var out = [];
	var dir = ["n","e","s","w"];
	for( var i=0; i < _map_junctions.length; i++ ) {
		var match = true;
		for(var j=0; j < dir.length; j++ ){
			var o = dir[j];
			if((_map_junctions[i].type.indexOf(o) < 0) != (tags.indexOf(o) < 0))
				match = false;
		}
		if( match ) out.push(i);
	}
	return out[0];
}
DataManager.prototype.addBranch = function(options, level, junctions, current_branch){
	var compass = ["n","e","s","w"];
	
	junctions.sort(function(){ return seed.random()-.5; });
	compass.sort(function(){ return seed.random()-.5; });
	this.branch_counter++;
	
	options["branch_id"] = this.branch_counter;
	
	if( current_branch ) {
		this.branch_matrix[current_branch][0].children.push( options["branch_id"] );
	}
	
	for( var i=0; i < junctions.length; i++ ) {
		var _i = junctions[i];
		var tags = _map_junctions_matrix[_i];
		pos = new Point( ~~_i.match(/(-?\d+)/g)[0], ~~_i.match(/(-?\d+)/g)[1] );
		this.branch_matrix[ options.branch_id ] = [{"id":_i,"d":"x","children":[]}];
		
		for(var j=0; j < compass.length; j++ ){
			//Check the four cardinal directions to see if one is free
			var d = compass[j];
			if( tags.indexOf( d ) < 0 ) {
				//This direction is free.
				tags.push(d);
				if( d == "n" ) {
					if( this.addRoom(options, level, 0, new Point(pos.x, pos.y-1), new Point(0,1)) ){
						this.branch_matrix[ options.branch_id ][0]["d"] = d;
						return true;
					}
				} else if ( d == "e" ) {
					if( this.addRoom(options, level, 1, new Point(pos.x+1, pos.y)) ){
						this.branch_matrix[ options.branch_id ][0]["d"] = d;
						return true;
					}
				} else if ( d == "s" ) {
					if( this.addRoom(options, level, 0, new Point(pos.x, pos.y+1), new Point(0,-1)) ){
						this.branch_matrix[ options.branch_id ][0]["d"] = d;
						return true;
					}
				} else if ( d == "w" ) {
					if( this.addRoom(options, level, -1, new Point(pos.x-1, pos.y)) ){
						this.branch_matrix[ options.branch_id ][0]["d"] = d;
						return true;
					}
				}
				tags.remove(tags.indexOf(d))
			}
		}
	}
	this.branch_counter--;
	return false;
}
DataManager.prototype.killBranch = function(bid){
	if( bid in this.branch_matrix ) {
		
		for( i=0; i < this.branch_matrix[bid][0].children.length; i++){
			this.killBranch(this.branch_matrix[bid][0].children[i]);
		}
		
		var orig = this.branch_matrix[bid][0];
		_map_junctions_matrix[ orig.id ].remove( _map_junctions_matrix[ orig.id ].indexOf( orig.d ) );
		
		
		for( i=1; i < this.branch_matrix[bid].length; i++){
			var id = this.branch_matrix[bid][i];
			if( id in this.properties_matrix ) {
				if( "shop" in this.properties_matrix[ id ] ) this.shop_counter--;
				//if( new_key ) this.key_counter--;
			}
			delete this.room_matrix[ id ];
			delete _map_junctions_matrix[ id ];
			delete this.properties_matrix[ id ];
			delete this.branch_matrix[ id ];			
			delete this.waterfall_matrix[ id ];			
		}
	}
}
DataManager.prototype.addSecret = function(options){
	var locations = Object.keys(this.room_matrix).sort(function(){ return seed.random() - 0.5; });
	
	var directions = [1,-1];
	var room_id = this.roomFromTags(["secret"]);
	var room = _map_rooms[ room_id ];
	var banlist = [0,1,2];
	
	for(var i=0; i < locations.length; i++){
		if( banlist.indexOf( this.room_matrix[ locations[i] ] ) < 0 ){
			directions.sort(function(){ return seed.random() - 0.5; });
			
			for(var j=0; j<directions.length; j++){
				var pos = new Point(
					~~locations[i].match(/(-?\d+)/g)[0] + directions[j],
					~~locations[i].match(/(-?\d+)/g)[1]
				);
				var id = ~~pos.x+"_"+~~pos.y;
			
				if( this.isFree(room, directions[j], pos) ){
					this.room_matrix[id] = room_id;
					this.secret_matrix[id] = directions[j];
					if(options instanceof Object) this.properties_matrix[id] = options;
					return true;
				}
			}
		}
	}
	return false;
}

DataManager.prototype.addRoom = function(options, level, direction, cursor, connector){
	//List of rooms to try
	var r = [];
	
	//Clone room matrix for debugging
	if( window.debug ) {
		if( window._rd == undefined ) {			
			window._rd = {};
			window._rdl = 0;
		}
		_rdl++;
		_rd[_rdl] = {};
		for(var i in this.room_matrix )
			_rd[_rdl][i] = this.room_matrix[i];
	}
	
	
	if( connector instanceof Point ) {
		//connecting room
		var _d = seed.random();
		r.push( ["j", 1, 0] );
		r.push( ["j", -1, 0] );
	} else {
		//Use assigned rule set
		r = options.rules.apply(this,[level,direction,options,cursor]);
	}
	
	//Scramble order
	r.sort(function(a,b){ return seed.random()-.5; } )
	
	var success = false;
	
	for(var j = 0; j < r.length; j++ ) {
		//Go through rooms until one fits
		var room_data = r[j];
		var room;
		var isJunction = room_data[0] == "j";
		if( isJunction ) room = {"width":1}
		else room = _map_rooms[ room_data[0] ];
		var new_direction = room_data[1];
		var temp_properties = room_data.length > 3 ? room_data[3] : {};
	
		if( this.isFree( room, new_direction, cursor ) ) {
			success = true;
		
			//fill in tiles
			for( i=0; i < room.width; i++){
				var pos = new Point( cursor.x + i * new_direction, cursor.y );
				var id = ~~pos.x +"_"+ ~~pos.y;
				this.room_matrix[ id ] = -1;
				
				if( "branch_id" in options ) this.branch_matrix[options.branch_id].push(id);
				
				var top_left = new_direction > 0 ? (i==0) : (i==room.width-1);
				
				if( top_left ) {
					this.room_matrix[ id ] = room_data[0];
					this.properties_matrix[ id ] = temp_properties;
					
					if( isJunction ) {
						_map_junctions_matrix[ id ] = [];

						if( connector instanceof Point ) {
							if( new_direction > 0 ) _map_junctions_matrix[ id ].push( "e" ); else _map_junctions_matrix[ id ].push( "w" ); 
							if( connector.y > 0 ) _map_junctions_matrix[ id ].push( "s" ); else _map_junctions_matrix[ id ].push( "n" ); 
						} else {
							if( room_data[2] != 0 ){
								if( new_direction > 0 ) _map_junctions_matrix[ id ].push( "w" ); else _map_junctions_matrix[ id ].push( "e" );
								if( room_data[2] > 0 ) _map_junctions_matrix[ id ].push( "s" ); else _map_junctions_matrix[ id ].push( "n" );
							} else {
								_map_junctions_matrix[ id ].push( "w" );
								_map_junctions_matrix[ id ].push( "e" );
							}
						}
					}
				}
			}
			
			//Add waterfall
			if( 
				this.currentTemple == 3 &&
				seed.randomBool(0.6) &&
				this.isValidWaterfall(cursor) &&
				this.isValidWaterfall(new Point(cursor.x, cursor.y+1))
			){
				this.waterfall_matrix = {};
				var waterfallHeight = 0;
				while( this.isValidWaterfall( new Point(cursor.x, cursor.y+1+waterfallHeight) )){
					waterfallHeight++;
				}
				var id = ~~cursor.x +"_"+ ~~cursor.y;
				this.waterfall_matrix[ id ] = waterfallHeight;
			}
			
			var new_key = false;
			var bid = false;
			//var current_junctions = Object.keys(_map_junctions_matrix);
			//console.log(room_id +" "+current_junctions+" "+room.tags);
			
			if( "door" in temp_properties ){
				if( this.existingKeysIndex().indexOf(temp_properties.door) < 0 ) {
					var key_name = "key_" + this.key_counter;
					var branch_size = "size" in options ? Math.floor(options.size/2) : 8;
					this.key_counter++;
					bid = this.branch_counter + 1;
					success = this.addBranch({
							"rules":this.rules.item,
							"item":key_name,
							"difficulty":2,
							"size":branch_size
						}, 
						8, 
						Object.keys(_map_junctions_matrix),
						("branch_id" in options ? options.branch_id : false)
					);
					//console.log("Room: " + room_id + " _ " + success + " " + current_junctions );
				}
			}
			if( "shop" in temp_properties ){
				this.shop_counter++;
			}
			
			//More rooms to go?
			if( level > 0 ){
				
				if( isJunction ) {
					//This is a junction, go up
					if( connector instanceof Point ){
						//Connect to previous room
						var next_cursor = new Point(cursor.x + room.width * new_direction, cursor.y);
						success = success && this.addRoom(options, level-1, new_direction, next_cursor);
					} else {
						//New junction
						if( room_data[2] != 0 ) {
							var next_cursor = new Point(cursor.x, cursor.y + room_data[2]);
							success = success && this.addRoom(options, level-1, new_direction, next_cursor, new Point(0,-room_data[2]));
						} else {
							//This may be a junction, but it doesn't go upstairs
							var next_cursor = new Point(cursor.x + room.width * new_direction, cursor.y);
							success = success && this.addRoom(options, level-1, new_direction, next_cursor);
						}
					}
				} else {
					var next_cursor = new Point(cursor.x + room.width * new_direction, cursor.y);
					success = success && this.addRoom(options, level-1, new_direction, next_cursor);
				}
				
				
				if( !success ) {
					//clear this room
					for( i=0; i < room.width; i++){
						var pos = new Point( cursor.x + i * new_direction, cursor.y );
						var id = ~~pos.x +"_"+ ~~pos.y;
						delete this.room_matrix[ id ];
						delete _map_junctions_matrix[ id ];
						delete this.properties_matrix[ id ];
						delete this.branch_matrix[ id ];
						delete this.waterfall_matrix[ id ];
						if( bid ) this.killBranch( bid );
						if( new_key ) this.key_counter--;
						if( "shop" in temp_properties ) this.shop_counter--;
					}
				} else {
					return true;
				}
			} else { 
				return true;
			}
		}
		
		//All pieces fit, end
		//if( success ) return true; 
	}
	return false;
}
DataManager.prototype.getRoomMatrix = function(pos){
	var id = ~~pos.x +"_"+~~pos.y;
	if( id in this.room_matrix ) {
		return this.room_matrix[id];
	}
	return null;
}
DataManager.prototype.isFree = function(room, direction, cursor){
	room = room || {"width":1};
	for( i=0; i < room.width; i++){
		var pos = new Point( cursor.x + i * direction, cursor.y );
		var id = ~~pos.x +"_"+ ~~pos.y;
		if( id in this.room_matrix ) return false
	}
	return true;
}
DataManager.prototype.isValidWaterfall = function(pos){
	var room = this.getRoomMatrix(pos);
	if(!room) return false;
	if(room == "j") return false;
	if(room >= 0 && _map_rooms[room].rarity <= 0) return false;
	return true
}

DataManager.prototype.roomConditions = function(room, options){
	if( "min_temple" in room && room["min_temple"]-0 > this.currentTemple ) return false;
	if( "max_temple" in room && room["max_temple"]-0 < this.currentTemple ) return false;
	if( "valid_temples" in room && room["valid_temples"].split(",").indexOf( ""+this.currentTemple ) < 0 ) return false;
	if( options instanceof Object ){
		if( "min_difficulty" in room && ( !("difficulty" in options) || (room["min_difficulty"]-0 > options["difficulty"]-0) ) ) return false;
		if( "max_difficulty" in room && "difficulty" in options && room["max_difficulty"]-0 < options["difficulty"]-0 ) return false;
		if("tags" in options && (!("tags" in room) || (options.tags.intersection(room.tags).length < 1)) ) return false;
	} else {
		if( "min_difficulty" in room ) return false;
	}
	return true;
}
DataManager.prototype.randomRoom = function(options){
	var total = 0.0;
	for(var i=0; i<_map_rooms.length; i++) if( this.roomConditions(_map_rooms[i],options) ) total += _map_rooms[i].rarity;
	var roll = seed.random() * total;
	for(var i=0; i<_map_rooms.length; i++) {
		if( this.roomConditions(_map_rooms[i],options) ) {
			if( roll < _map_rooms[i].rarity ) return i;
			roll -= _map_rooms[i].rarity;
		}
	}
	return 1;
}
DataManager.prototype.roomFromTags = function(tags,options){
	var rooms = this.roomsFromTags(tags,options);
	if( rooms.length > 0 )
		return rooms[Math.floor( seed.random() * rooms.length )];
	return this.randomRoom();
}
DataManager.prototype.roomsFromTags = function(tags,options){
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

DataManager.prototype.junctionCount = function(){
	return Object.keys(_map_junctions_matrix).length;
}
DataManager.prototype.cut = function(x,y){
	var l = new Line(
		(Math.floor(x/256)*256)+144,
		(Math.floor(y/240)*240)+64,
		(Math.floor(x/256)*256)+368,
		(Math.floor(y/240)*240)+184
	);
	
	for(var x=l.start.x; x < l.end.x; x += 16)
	for(var y=l.start.y; y < l.end.y; y += 16) {
		game.addObject( new BreakableTile(x + 8, y + 8) );
	}
}
DataManager.prototype.wallmeat = function(){
	var rooms = Object.keys( this.room_matrix ).sort(function(){ return seed.random() - 0.5; });
	for(var i in this.room_matrix ) {
		if( seed.randomBool(0.2) ) {
			p = new Point(
				256 * ~~i.match(/(-?\d+)/g)[0],
				240 * ~~i.match(/(-?\d+)/g)[1]
			);
			var tiles = new Array();
			for(var y=144; y < 240; y+=16) for(var x=0; x < 256; x+=16) {
				if( ( game.getTile(p.x+x,p.y+y) != 232 && game.getTile(p.x+x,p.y+y) != 0 ) && ( game.getTile(p.x+x+16,p.y+y) == 0 || game.getTile(p.x+x-16,p.y+y) == 0) ){
					tiles.push( new Point(p.x+x+8,p.y+y+8) );
				}
			}
			
			if( tiles.length > 0 ) {
				var tile = tiles[ Math.floor( tiles.length * seed.random() ) ];
				var breakable = new BreakableTile( tile.x,  tile.y );
				var item_name = "coin_3";
				if( seed.randomBool(0.85) ){
					var item_name = "life_small";
				}
				breakable.item = new Item( tile.x,  tile.y, item_name);
				game.addObject( breakable );
			}
		}
	}
}
DataManager.prototype.randomTreasure = function(roll, tags){
	tags = tags || [];
	var total = 0.0;
	for(var i=0; i<this.treasures.length; i++) if(this.treasures[i].remaining > 0) if(this.treasures[i].tags.intersection(tags).length == tags.length) total += this.treasures[i].rarity;
	roll *= total;
	for(var i=0; i<this.treasures.length; i++) if(this.treasures[i].remaining > 0) if(this.treasures[i].tags.intersection(tags).length == tags.length) {
		if( roll < this.treasures[i].rarity ) return this.treasures[i];
		roll -= this.treasures[i].rarity;
	}
	return this.treasures[0];
}
DataManager.prototype.damage = function(level){
	var damage = 5; //0 very little
	
	switch(level){
		case 1: damage = 10; break;//1 weak, bashing into normal enemy
		case 2: damage = 15; break;//2 strike from minor enemy
		case 3: damage = 20; break;//3 strike from major enemy
		case 4: damage = 25; break;//4 strike from miniboss
		case 5: damage = 30; break;//5 strike from boss
		case 6: damage = 40; break;//6 strike from SUPER boss
	}
	
	var multi = 1 + this.currentTemple * 0.22;
	damage = Math.floor( damage * multi );
	return damage;
}
DataManager.prototype.life = function(level){
	if( level == 0 ) return 3; //Always one shot
	var multi = 5 + this.currentTemple * 3.125;
	return Math.floor( multi * level );
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

var sprites = {};
var audio = {};
var RT = "/";

filter_hurt = function(d,i){
	d[i] = Math.floor(d[i+1]*0.9);
	d[i+1] = Math.floor(d[i+1]*0.3);
	d[i+2] = 0;
}
filter_gold = function(d,i){
	if( d[i+3] > 0 && Math.abs( (d[i] + d[i+1] + d[i+2]) - d[i]*3 ) < 6 ){
		d[i+1] = Math.floor( d[i+1]*0.9 );
		d[i+2] = Math.floor( d[i+1]*0.2 );
	}
}
filter_enchanted = function(d,i,w){
	if( d[i+3] > 10 && (d[i+0] != 248 || d[i+1] != 56 || d[i+2] != 0)) {
		var dirs = [i+4,i-4,i-w*4,i+w*4];
		for(var j=0; j<dirs.length; j++){
			if(d[dirs[j]+3] < 10){
				d[dirs[j]+0] = 248;
				d[dirs[j]+1] = 56;
				d[dirs[j]+2] = 0;
				d[dirs[j]+3] = 255;
			}
		}
	}
}

filter_pack_enemies = {
	"hurt":filter_hurt,
	"t1" : function(d,i){ d[i+0] = Math.floor(d[i+0]*1.3); d[i+1] = Math.floor(d[i+1]*0.7); d[i+2] = Math.floor(d[i+2]*0.5); },
	"t2" : function(d,i){ var r = d[i+0]; d[i+0] = d[i+1]; d[i+1] = r; },
	"t3" : function(d,i){ var g = d[i+1]; d[i+1] = d[i+2]; d[i+2] = g; },
	"t4" : function(d,i){ var b = d[i+2]; d[i+2] = d[i+0]; d[i+0] = b; },
	"t5" : function(d,i){ d[i+0]=d[i+1]=d[i+2]=Math.floor((d[i+0]+d[i+1]+d[i+2])/2.5); },
	//"t6" : function(d,i){ d[i+0] = Math.floor(d[i+0]*0.7); d[i+1] = Math.floor(d[i+1]*0.6); d[i+2] = Math.floor(d[i+2]*1.6); },
	//"t7" : function(d,i){ d[i+0] = Math.floor(d[i+0]*0.6); d[i+1] = Math.floor(d[i+1]*0.5); d[i+2] = Math.floor(d[i+2]*1.9); },
	//"t8" : function(d,i){ d[i+0] = Math.floor(d[i+0]*0.8); d[i+1] = Math.floor(d[i+1]*1.3); d[i+2] = Math.floor(d[i+2]*0.5); },
	//"t9" : function(d,i){ d[i+0]=d[i+1]=d[i+2]=Math.floor((d[i+0]+d[i+1]+d[i+2])/2.5); },
	"special" : filter_enchanted
}

function load_sprites (){
	sprites['text'] = new Sprite(RT+"img/text.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['pig'] = new Sprite(RT+"img/pig.gif", {offset:new Point(0, 0),width:32,height:40});
	sprites['title'] = new Sprite(RT+"img/title.gif", {offset:new Point(0, 0),width:256,height:240});
	sprites['dreams'] = new Sprite(RT+"img/dreams.gif", {offset:new Point(0, 0),width:256,height:240});
	
	sprites['items'] = new Sprite(RT+"img/items.gif", {offset:new Point(8, 8),width:16,height:16,"filters":{"gold":filter_gold}});
	sprites['waystones'] = new Sprite(RT+"img/waystones.gif", {offset:new Point(16, 24),width:32,height:48});
	sprites['alter'] = new Sprite(RT+"img/alter.gif", {offset:new Point(32, 128),width:64,height:128});
	sprites['arena'] = new Sprite(RT+"img/arena.gif", {offset:new Point(64, 128),width:128,height:128});
	sprites['shops'] = new Sprite(RT+"img/shops.gif", {offset:new Point(80, 104),width:160,height:128});
	sprites['bullets'] = new Sprite(RT+"img/bullets.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['cornerstones'] = new Sprite(RT+"img/cornerstones.gif", {offset:new Point(48, 48),width:96,height:96});
	sprites['map'] = new Sprite(RT+"img/map.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['doors'] = new Sprite(RT+"img/doors.gif", {offset:new Point(16, 32),width:32,height:64});
	
	sprites['sword1'] = new Sprite(RT+"img/sword1.gif", {offset:new Point(24, 32),width:48,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['sword2'] = new Sprite(RT+"img/sword2.gif", {offset:new Point(10, 32),width:64,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['sword3'] = new Sprite(RT+"img/sword3.gif", {offset:new Point(26, 32),width:80,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['magic_effects'] = new Sprite(RT+"img/magic_effects.gif", {offset:new Point(16, 32),width:32,height:48});
	
	sprites['amon'] = new Sprite(RT+"img/amon.gif", {offset:new Point(8, 8),width:16,height:16,"filters":filter_pack_enemies});
	sprites['batty'] = new Sprite(RT+"img/batty.gif", {offset:new Point(16, 24),width:32,height:48,"filters":filter_pack_enemies});
	sprites['beaker'] = new Sprite(RT+"img/beaker.gif", {offset:new Point(12, 16),width:24,height:24,"filters":filter_pack_enemies});
	sprites['bear'] = new Sprite(RT+"img/bear.gif", {offset:new Point(14, 16),width:32,height:32,"filters":filter_pack_enemies});
	sprites['characters'] = new Sprite(RT+"img/characters.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['chaz'] = new Sprite(RT+"img/chaz.gif", {offset:new Point(20, 16),width:40,height:32,"filters":filter_pack_enemies});
	sprites['chazbike'] = new Sprite(RT+"img/chazbike.gif", {offset:new Point(24, 32),width:48,height:48,"filters":filter_pack_enemies});
	sprites['deckard'] = new Sprite(RT+"img/deckard.gif", {offset:new Point(24, 30),width:64,height:48,"filters":filter_pack_enemies});
	sprites['ghoul'] = new Sprite(RT+"img/ghoul.gif", {offset:new Point(16, 24),width:32,height:48,"filters":filter_pack_enemies});
	sprites['ending'] = new Sprite(RT+"img/ending.gif", {offset:new Point(48, 32),width:96,height:64});
	sprites['igbo'] = new Sprite(RT+"img/igbo.gif", {offset:new Point(26, 40),width:64,height:64,"filters":filter_pack_enemies});
	sprites['knight'] = new Sprite(RT+"img/knight.gif", {offset:new Point(24, 16),width:48,height:32,"filters":filter_pack_enemies});
	sprites['malphas'] = new Sprite(RT+"img/malphas.gif", {offset:new Point(16, 32),width:48,height:48,"filters":filter_pack_enemies});
	sprites['oriax'] = new Sprite(RT+"img/oriax.gif", {offset:new Point(16, 16),width:32,height:32,"filters":filter_pack_enemies});
	sprites['player'] = new Sprite(RT+"img/player.gif", {offset:new Point(24, 32),width:48,height:48,"filters":{"enchanted":filter_enchanted,"hurt":filter_hurt}});
	sprites['ratgut'] = new Sprite(RT+"img/ratgut.gif", {offset:new Point(24, 16),width:48,height:32,"filters":filter_pack_enemies});
	sprites['retailers'] = new Sprite(RT+"img/retailers.gif", {offset:new Point(24, 48),width:48,height:64});
	sprites['shell'] = new Sprite(RT+"img/shell.gif", {offset:new Point(8, 8),width:16,height:16,"filters":filter_pack_enemies});
	sprites['shooter'] = new Sprite(RT+"img/shooter.gif", {offset:new Point(32, 24),width:64,height:48,"filters":filter_pack_enemies});
	sprites['skele'] = new Sprite(RT+"img/skele.gif", {offset:new Point(24, 16),width:48,height:32,"filters":filter_pack_enemies});
	sprites['svarog'] = new Sprite(RT+"img/svarog.gif", {offset:new Point(24, 24),width:48,height:48,"filters":filter_pack_enemies});
	sprites['yakseyo'] = new Sprite(RT+"img/yakseyo.gif", {offset:new Point(24, 16),width:48,height:32,"filters":filter_pack_enemies});
	sprites['yeti'] = new Sprite(RT+"img/yeti.gif", {offset:new Point(24, 24),width:48,height:48,"filters":filter_pack_enemies});
	
	sprites['ammit'] = new Sprite(RT+"img/ammit.gif", {offset:new Point(32, 32),width:64,height:64,"filters":{"hurt":filter_hurt}});
	sprites['garmr'] = new Sprite(RT+"img/garmr.gif", {offset:new Point(40, 24),width:80,height:64,"filters":{"hurt":filter_hurt}});
	sprites['megaknight'] = new Sprite(RT+"img/megaknight.gif", {offset:new Point(32, 32),width:96,height:64,"filters":{"hurt":filter_hurt}});
	sprites['minotaur'] = new Sprite(RT+"img/minotaur.gif", {offset:new Point(24, 80),width:64,height:80,"filters":{"hurt":filter_hurt}});
	sprites['pigboss'] = new Sprite(RT+"img/pigboss.gif", {offset:new Point(32, 36),width:64,height:64,"filters":{"hurt":filter_hurt}});
	sprites['poseidon'] = new Sprite(RT+"img/poseidon.gif", {offset:new Point(52, 48),width:112,height:96,"filters":{"hurt":filter_hurt}});
	sprites['zoder'] = new Sprite(RT+"img/zoder.gif", {offset:new Point(32, 32),width:80,height:64,"filters":{"hurt":filter_hurt}});
	
	sprites['prisoner'] = new Sprite(RT+"img/prisoner.gif", {offset:new Point(16, 24),width:32,height:48});
	
	sprites['tiles1'] = new Sprite(RT+"img/tiles/tiles1.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles2'] = new Sprite(RT+"img/tiles/tiles2.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles3'] = new Sprite(RT+"img/tiles/tiles3.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles4'] = new Sprite(RT+"img/tiles/tiles4.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles5'] = new Sprite(RT+"img/tiles/tiles5.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['town'] = new Sprite(RT+"img/tiles/town.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['world'] = new Sprite(RT+"img/tiles/world.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['waterfall'] = new Sprite(RT+"img/waterfall.gif", {offset:new Point(64, 120),width:128,height:240});
	
	for( var i in sprites ) {
		sprites[i].name = i;
	}
}

window.audio = new AudioPlayer({
	"music_goeson" : {"url":RT+"sounds/music_goeson.mp3"},
	"music_goodbye" : {"url":RT+"sounds/music_goodbye.mp3"},
	"music_intro" : {"url":RT+"sounds/music_intro.ogg", "music":true,"loop":0.0},
	"music_temple1" : {"url":RT+"sounds/music_temple1.ogg","music":true,"loop":24.0},
	"music_town" : {"url":RT+"sounds/music_intro.ogg","music":true,"loop":0.0},
	//"music_town" : {"url":RT+"sounds/music_town.mp3","music":true,"loop":0.0},
	"music_sleep" : {"url":RT+"sounds/music_sleep.mp3"},
	"music_world" : {"url":RT+"sounds/music_world.ogg","music":true,"loop":29.5384},
	"fanfair" : {"url":RT+"sounds/fanfair.ogg","music":true},
	
	"block" : {"url":RT+"sounds/block.wav"},
	"burst1" : {"url":RT+"sounds/burst1.wav"},
	"clang" : {"url":RT+"sounds/clang.wav"},
	"coin" : {"url":RT+"sounds/coin.wav"},
	"cracking" : {"url":RT+"sounds/cracking.wav"},
	"crash" : {"url":RT+"sounds/crash.wav"},
	"cursor" : {"url":RT+"sounds/cursor.wav"},
	"danger" : {"url":RT+"sounds/danger.wav"},
	"equip" : {"url":RT+"sounds/equip.wav"},
	"explode1" : {"url":RT+"sounds/explode1.wav"},
	"explode2" : {"url":RT+"sounds/explode2.wav"},
	"gulp" : {"url":RT+"sounds/gulp.wav"},
	"heal" : {"url":RT+"sounds/heal.wav"},
	"hurt" : {"url":RT+"sounds/hurt.wav"},
	"item1" : {"url":RT+"sounds/item1.wav"},
	"jump" : {"url":RT+"sounds/jump.wav"},
	"key" : {"url":RT+"sounds/key.wav"},
	"kill" : {"url":RT+"sounds/kill.wav"},
	"land" : {"url":RT+"sounds/land.wav"},
	"levelup" : {"url":RT+"sounds/levelup.wav"},
	"levelup2" : {"url":RT+"sounds/levelup2.wav"},
	"negative" : {"url":RT+"sounds/negative.wav"},
	"lift" : {"url":RT+"sounds/lift.wav"},
	"open" : {"url":RT+"sounds/open.wav"},
	"pause" : {"url":RT+"sounds/pause.wav"},
	"pickup1" : {"url":RT+"sounds/pickup1.wav"},
	"playerhurt" : {"url":RT+"sounds/playerhurt.wav"},
	"playerdeath" : {"url":RT+"sounds/playerdeath.wav"},
	"slash" : {"url":RT+"sounds/slash.wav"},
	"spell" : {"url":RT+"sounds/spell.wav"},
	"swing" : {"url":RT+"sounds/swing.wav"},
	"unpause" : {"url":RT+"sounds/unpause.wav"},
});