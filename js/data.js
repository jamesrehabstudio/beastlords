window._version = "0.2.0";

function DataManager() {
	this.temples = [
		{"tiles":"tiles1","size":10,"maxkeys":1,"treasures":[1,2],"boss":["Chort"],"miniboss":["Skeleton","Oriax"],"majormonster":["Bear","Skeleton"],"minormonster":["Beaker","Shell"],"minorfly":["Batty"]},
		{"tiles":"tiles3","size":11,"maxkeys":2,"treasures":[1,3],"boss":["Marquis"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Shell"],"minorfly":["Amon","Batty"]},
		{"tiles":"tiles2","size":12,"maxkeys":2,"treasures":[2,3],"boss":["Minotaur","Ammit"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Amon"],"minorfly":["Batty","Ghoul"]},
		{"tiles":"tiles5","size":10,"maxkeys":3,"treasures":[2,3],"boss":["Minotaur","Garmr"],"miniboss":["Knight","Oriax"],"majormonster":["Bear","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Amon"],"minorfly":["Ghoul"]},
		{"tiles":"tiles4","size":11,"maxkeys":1,"treasures":[3,4],"boss":["Zoder"],"miniboss":["Knight","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Ratgut"],"minorfly":["Batty","Ghoul"]},
		{"tiles":"tilesintro","size":12,"maxkeys":3,"treasures":[1,2],"boss":["Poseidon"],"miniboss":["Knight","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Ratgut"],"minorfly":["Batty"]},
		//{"tiles":"tiles2","size":2,"maxkeys":0,"treasures":[0,0],"boss":["Poseidon"],"miniboss":["Knight","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Batty","Ratgut"],"minorfly":["Batty"]},
		
		
		{"tiles":"tiles5","size":16,"maxkeys":4,"treasures":[2,4],"boss":["Garmr"],"miniboss":["Knight","Malphas","ChazBike"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Ratgut"],"minorfly":["Batty","Svarog"]},
		{"tiles":"tiles2","size":17,"maxkeys":4,"treasures":[2,4],"boss":["Zoder"],"miniboss":["Knight","Malphas","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Amon"],"minorfly":["Batty","Svarog"]},
		{"tiles":"tiles2","size":18,"maxkeys":5,"treasures":[2,4],"boss":["Poseidon"],"miniboss":["Knight","Malphas","ChazBike","Igbo"],"majormonster":["Yeti","Skeleton","Chaz"],"minormonster":["Beaker","Amon"],"minorfly":["Batty","Svarog"]}
	];
	
	/* Set data */
	
	this.treasures = [
		{"tags":["goods","chest"],"name":"life","unlocked":1,"rarity":0.5,"pathSize":1,"doors":0.0,"pergame":9999,"price":20},
		{"tags":["goods","chest"],"name":"mana_small","unlocked":1,"rarity":0.3,"pathSize":1,"doors":0.0,"pergame":9999,"price":30},
		{"tags":["chest","shop"],"name":"xp_big","unlocked":1,"rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":40},
		{"tags":["treasure","chest"],"name":"money_bag","unlocked":1,"rarity":0.4,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
		{"tags":["treasure","shop"],"name":"life_up","unlocked":1,"rarity":0.01,"pathSize":4,"doors":0.5,"pergame":9999,"price":500},
		{"tags":["stone","chest"],"name":"waystone","unlocked":1,"rarity":0.2,"pathSize":2,"doors":0.0,"pergame":9999,"price":20},
		
		{"tags":["treasure","chest","weapon"],"name":"short_sword","unlocked":1,"rarity":0.2,"pathSize":2,"doors":0.0,"pergame":10,"price":20},
		{"tags":["treasure","chest","weapon"],"name":"long_sword","unlocked":1,"rarity":0.3,"pathSize":3,"doors":0.0,"pergame":10,"price":30},
		{"tags":["treasure","chest","weapon"],"name":"spear","unlocked":1,"rarity":0.2,"pathSize":3,"doors":0.5,"pergame":10,"price":30},
		{"tags":["weapon"],"name":"tower_shield","unlocked":1,"rarity":0.05,"pathSize":4,"doors":0.5,"pergame":10,"price":50},
		
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
	
	this.rules = {
		"start": function(){ return [[this.roomFromTags(["entry"]),1,0]]; 
		},
		"final" : function(level, direction,options){ 
			if(level==options.size) return this.roomsFromTags(["entry_final"]);
			if(level==0) return this.roomsFromTags(["exit_w","exit_e"]);
			if(level==1) return this.roomsFromTags(["boss"]);
			if(level==2) return this.roomsFromTags(["walk"]);
			if(level==3) return this.roomsFromTags(["door"]);
			if(seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
			return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
		},
		"main" : function(level,options,cursor){ 
			if(level==options.size) return this.roomsFromTags(["entry"]);
			if(level==0) return this.roomsFromTags(["exit_w","exit_e"]);
			if(level==1) return this.roomsFromTags(["boss"]);
			if(level==2) return this.roomsFromTags(["door"]);
			if(seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
			return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
		},
		"item" : function(level,direction,options,cursor){
			//if(level==options.size) return this.roomsFromTags(["entry"]);
			if(level==0) return this.roomsFromTags(["item_w","item_e"]);
			if(level==1) return this.roomsFromTags(["miniboss"]);
			if("optional" in options && seed.randomBool(0.4)) return this.roomsFromTags(["optional"]);
			if(seed.randomBool(0.1) && this.keysRemaining()>0) return this.roomsFromTags(["door"]);
			return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
		},
		"prison" : function(level,direction,options){
			if(level==0) return this.roomsFromTags(["prison_w","prison_e"], options);
			return [this.randomRoom(),this.randomRoom(),this.randomRoom(),this.randomRoom()];
		}
	}
	
	this.treasures.sort(function(a,b){
		var _a = a.unlocked > 0 ? 0 : 999999;
		var _b = b.unlocked > 0 ? 0 : 999999;
		_a -= a.pergame;
		_b -= b.pergame;
		return _a - _b;
	});
	
	this.unlocks = [];
	for(var i=0; i < this.treasures.length; i++){
		var name = this.treasures[i].name;
		if( localStorage.getItem("item_"+name) ) {
			this.treasures[i].unlocked = localStorage.getItem("item_"+name);
		}
	}
	
	localStorage.setItem("version", window._version);
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
	
	this.unlocks = [];
	for(var i=0; i < this.treasures.length; i++ ) {
		if(this.treasures[i].unlocked > 0) {
			this.treasures[i]["remaining"] = this.treasures[i].pergame;
		} else { 
			this.treasures[i]["remaining"] = 0;
		}
	}
}
DataManager.prototype.itemGet = function(name){
	for(var i=0; i < this.treasures.length; i++){
		if( this.treasures[i].name == name ) {
			
			if( this.treasures[i].unlocked == 0 && this.unlocks.indexOf(name) < 0){
				this.unlocks.push( name );
			}
			this.treasures[i].unlocked = 2;
			localStorage.setItem("item_"+name,2);
		}
	}
}
DataManager.prototype.itemUnlock = function(name){
	for(var i=0; i < this.treasures.length; i++){
		if( this.treasures[i].name == name ) {
			
			if( this.treasures[i].unlocked == 0 && this.unlocks.indexOf(name) < 0){
				this.unlocks.push( name );
				this.treasures[i].unlocked = 1;
				localStorage.setItem("item_"+name,1);
			}
		}
	}
}
	
DataManager.prototype.loadMap = function(g,map,options){
	this.slices = [];
	g.clearAll();
	g.tileSprite = sprites.town;
	options = options || {};
	
	if( "tileset" in map ) g.tileSprite = sprites[map.tileset];
	if( "tileset" in options ) g.tileSprite = sprites[options.tileset];
	
	g.bounds = new Line(0,0,map.width*256,map.height*240);
	var mapDimension = new Line(0,0,map.width,map.height);
	g.tileDimension = new Line(
		g.bounds.start.x/16,
		g.bounds.start.y/16,
		g.bounds.end.x/16,
		g.bounds.end.y/16
	);
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	g.buildCollisions();
	for(var i=0; i < map.front.length; i++){
		if("front" in map) g.tiles[2][i] = map.front[i];
		if("back" in map) g.tiles[1][i] = map.back[i];
		if("far" in map) g.tiles[0][i] = map.far[i];
	}
	if("objects" in map) for(var i=0; i < map.objects.length; i++){
		var obj = map.objects[i];
		g.addObject( new window[obj[2]](
			obj[0],
			obj[1],
			null,
			obj[3]
		));
	}
	var mapTiles = [];
	if( "map_tile" in map ) {
		var map_tiles = map["map_tile"].split(",");
		for(var j=0; j < map_tiles.length; j++ ){
			mapTiles[j] = map_tiles[j];
		}
	}
	if( _player instanceof Player ){
		_player.keys = new Array();
	}
	if( _player instanceof Player && !game.getObject(Player) ) {
		g.addObject(_player);
		if( "direction" in options && options.direction.x < 0 ){
			_player.position.x = g.bounds.end.x - 64;
			_player.position.y = 200;
			_player.flip = true;
		} else {
			_player.position.x = 64;
			_player.position.y = 200;
			_player.flip = false;
		}
		_player.lock = g.bounds;
		_player.lock_overwrite = false;
		_player.keys = new Array();
	}
	var pm = new PauseMenu();
	pm.map = mapTiles;
	pm.mapDimension = mapDimension;
	
	g.addObject(pm);
	g.addObject(new Background());
}
DataManager.prototype.randomTown = function(g, town){
	var s = new Seed(town.seed);
	
	this.currentTemple = -1;
	this.currentTown = town.id;
	this.slices = [];
	
	var specials = {
		3: {"odds":0.4, count:0},
		4: {"odds":0.0, count:0},
		6: {"odds":0.3, count:0},
		8: {"odds":0.3, count:0}
		
	}
	
	g.clearAll();
	g.tileSprite = sprites.town;
	
	var rooms = new Array();
	var length = 6 + town.size * 2;
	var pos = 0;
	for(var i=0; i < length; i++){
		if( i == 0 ) { 
			rooms[pos] = 10;
		} else if ( i == length-1) {
			rooms[pos] = 9;
		} else {
			rooms[pos] = town.size-1;
			for(var j in specials){
				if( s.randomBool(specials[j].odds) && specials[j].count <= 0) {
					rooms[pos] = j;
					specials[j].count++;
				}
			}
			if( s.randomBool(0.7) )
				g.addObject(new Villager(128+pos*128,192,town));
		}
		try{
			var w = _map_town[ rooms[pos] ].width;
			pos += w;
		} catch ( err) {
			pos++;
		}
	}
	g.bounds = g.tileDimension = new Line(0,0,pos*8,15);
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	g.buildCollisions();
	g.addObject(new PauseMenu());
	g.addObject(new Background());
	
	for(var i=0; i < rooms.length; i++){
		if( rooms[i] != undefined && rooms[i] >= 0 ) {
			this.createRoom(g,_map_town[ rooms[i] ], new Point(i*128,0),"TOWNS_DONT_HAVE_PROPERTIES",{"room_size":8});
		}
	}
	if( _player instanceof Player ) {
		_player.lock = new Line(0,0,pos*128,240);
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
		
		this.slices = [new MapSlice()];
		
		var options = {
			"rules":(this.currentTemple == 5 ? this.rules.final : this.rules.main),
			"size":temple.size
		}
		
		success = this.addRoom(options,temple.size, new Point(3,0));
		//success = this.addRoom(options,1,1, new Point(0,0));
		
		
		if( this.slices.peek().entrancesCount() > 0) {
			//Add a branch for a map
			var map_size = Math.floor(1+seed.random()*3);			
			this.addBranch({"rules":this.rules.item,"item":"map","doors":0.0,"size":map_size}, map_size, this.slices.peek().getEntrances());
			this.addBranch({"rules":this.rules.prison}, Math.floor(1+seed.random()*3), this.slices.peek().getEntrances());
			
			/*
			//Add branches for items
			var current_brances = this.branch_counter;
			
			for(var i=0; i < Math.max(temple.treasures[1]-current_brances,temple.treasures[0]); i++ ){
				var size = seed.randomInt(2,6);
				if( this.addBranch({"rules":this.rules.item,"door":0.15,"size":size,"optional":true}, size, this.slices.peek().getJunctions()) ) {
					//Branch created successfully. 
				}
			}
			
			this.addSecret({"item":"life_up"});
			console.log("Add well? " + this.addWell(this.slices.peek().filter({"width":1,"rarity":0.001})) );
			*/
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
	var mapDimension = this.slices.peek().size();
	g.tileDimension = mapDimension.scale(16,15);
	
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	var mapTiles = new Array( Math.floor( mapDimension.area() ) );
	
	var slice = this.slices.peek();
	for(var i in slice.data){
		try{
			var room_options = {};
			var pos = MapSlice.idToLoc(i);
			var map_index = Math.floor( pos.x - mapDimension.start.x + (pos.y - mapDimension.start.y) * mapDimension.width() );
			var secret = slice.data[i].secret ? -1 : 1;
			
			//if( mapTiles[ map_index ] == undefined )
			//	mapTiles[ map_index ] = secret;
			
			var room;
			if( slice.data[i].room == "j" ) {
				var tags = slice.data[i].junctions;
				room = _map_junctions[ this.getJunctionRoomIndex(tags) ];
			} else if ( slice.data[i].room >= 0 ) { 
				room = _map_rooms[ slice.data[i].room ];
			} else { 
				room = null;
			}
			
			room_options["id"] = i;
			room_options["entrances"] = new Array();
			for(var ent in slice.data[i].entrances ){
				if( slice.data[i].entrances[ent] ){
					room_options["entrances"].push( MapSlice.idToLoc(ent) );
				}
			}
			
			if( room ) {
				var cursor = new Point(pos.x * width, pos.y * height );
				this.createRoom(g,room,cursor,room_options);
				
				//If this room uses a specific map tile
				/*
				if( "map_tile" in room ) {
					var map_tiles = room["map_tile"].split(",");
					for(var j=0; j < map_tiles.length; j++ ){
						mapTiles[ map_index + j ] = map_tiles[j] * secret;
					}
				}
				*/
				var mapWidth = slice.data[i].width;
				var mapHeight = slice.data[i].height;
				for(var mapx=0; mapx < mapWidth; mapx++)
				for(var mapy=0; mapy < mapHeight; mapy++){
					var tileY = 0
					if( mapy > 0) tileY += 8;
					if( mapy >= mapHeight-1) tileY += 4;
					if( mapx > 0) tileY += 2;
					if( mapx < mapWidth-1) tileY += 1;
					//var tile = tileY * 16;
					var map_index = Math.floor( 
						(mapx + pos.x) - mapDimension.start.x + 
						((mapy + pos.y) - mapDimension.start.y) * mapDimension.width() 
					);
					mapTiles[ map_index ] = tileY;
				}
			}
		} catch (err){
			console.error("Cannot create room at: " +i+"... "+err);
		}
	}
	//g.collisions.push( new Line(-512,240,-512,0) );
	//g.collisions.push( new Line(cursor,0,cursor,240) );
	
	var pm = new PauseMenu();
	pm.map = mapTiles;
	pm.mapDimension = mapDimension;
	g.addObject(pm);
	g.addObject(new Background());
	
	g.buildCollisions();
	
	//Cut out secrets
	/*
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
	*/
	
	//Add wall meat
	this.wallmeat();
	
	if( this.temple_instance ) {
		pm.map_reveal = this.temple_instance.map;
		_player.keys = this.temple_instance.keys;
		for(var i=0; i<this.temple_instance.items.length; i++) g.addObject(this.temple_instance.items[i]);
		for(var i=0; i<this.temple_instance.shops.length; i++) g.addObject(this.temple_instance.shops[i]);
	}
}

DataManager.prototype.createRoom = function(g,room,cursor,room_options){
	var layers = ["far","back","front"];
	
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
	
	var width = ("width" in room) ? room.width : 1;
	var height = ("height" in room) ? room.height : 1;
	
	var ts = 16;
	room_options = room_options || {};
	var room_size = room_options.room_size || 16;
	
	
	//Render tiles
	for(var j=0; j < layers.length; j++ ) {
		if( layers[j] in room ) {
			var layer = room[layers[j]];
			if( layer instanceof Function ) layer = layer(seed, width, height, room_options);
			
			for(var i=0; i < layer.length; i++){
				var x = Math.floor( i % ( room_size * width ) );
				var y = Math.floor( i / ( room_size * width ) );
				var offset = Math.floor( 
					Math.floor( (x-g.tileDimension.start.x) + Math.floor( cursor.x / ts ) ) + 
					Math.floor( ((y-g.tileDimension.start.y) + Math.floor( cursor.y / ts ) ) * g.tileDimension.width() )
				);
				g.tiles[j][offset] = layer[i];
			}
		}
	}
	
	if( dataManager.currentTemple >= 0 && (cursor.x != 0 || cursor.y != 0) ) {
		var bgsize = room_size - 1;
		for(var w=0; w < width; w++ ){
			var bg = Background.rooms[Math.floor(Math.random()*Background.rooms.length)];
			for(var i=0; i < bg.tiles.length; i++){
				var x = Math.floor( i % bgsize );
				var y = Math.floor( i / bgsize );
				var offset = Math.floor( 
					w * bgsize + 
					Math.floor( (x-g.tileDimension.start.x) + Math.floor( (cursor.x) / (room_size+1) ) ) + 
					Math.floor( ((y-g.tileDimension.start.y) + Math.floor( cursor.y / (room_size) ) ) * g.tileDimension.width() )
				);
				g.tiles[0][offset] = bg.tiles[i];
			}
		}
	}
	
	//Add objects
	if("objects" in room ) for(var j=0; j < room.objects.length; j++){
		var obj = room.objects[j];
		var objectName = obj[2];
		var properties = obj[3];
		var addObject = true;
		
		var props = {};
		try{
			var id = room_options.id;
			props = this.slices.peek().data[id].properties;
		} catch (err) {}
		
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
				if("door" in props) new_obj.name = props["door"];
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
		if( "item" in this.properties_matrix[i] && this.properties_matrix[i].item != undefined ){
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
		var intersect = tags.intersection(_map_junctions[i].type);
		if(intersect.length == tags.length && intersect.length == _map_junctions[i].type.length ){
			out.push(i);
		}
	}
	return out[0];
}
DataManager.prototype.addBranch = function(options, level, entrances){
	
	entrances.sort(function(){ return seed.random()-.5; });
	
	for( var i=0; i < entrances.length; i++ ) {
		var entrance = entrances[i];
		var pos = MapSlice.idToLoc(entrance);
		
		//Create new slice
		var bid = this.slices.length;
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

DataManager.prototype.addSecret = function(options){
	var locations = this.slices.peek().keys().sort(function(){ return seed.random() - 0.5; });
	
	var directions = [1,-1];
	var banlist = [0,1,2];
	
	for(var i=0; i < locations.length; i++){
		if( banlist.indexOf( this.slices.peek().data[locations[i]].room ) < 0 ){
			directions.sort(function(){ return seed.random() - 0.5; });
			
			for(var j=0; j<directions.length; j++){
				var tag = directions[j] > 0 ? "secret_w" : "secret_e";
				var room_id = this.roomFromTags([tag]);
				var room = _map_rooms[ room_id ];
				
				var pos = MapSlice.idToLoc(locations[i]);
				pos.x += directions[j];
				var id = MapSlice.locToId(pos);
			
				if( this.isFree(room, directions[j], pos) ){
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

DataManager.prototype.addRoom = function(options, level, cursor){
	//List of rooms to try
	var r = options.rules.apply(this,[level,options,cursor]);
	
	//Scramble order
	r.sort(function(a,b){ return seed.random()-.5; } )
	
	var success = false;
	
	for(var j = 0; j < r.length; j++ ) {
		//Go through rooms until one fits
		var room_id = r[j];
		//var isJunction = room_data[0] == "j";
		//if( isJunction ) room = {"width":1, "entrances":[0,0]}
		var room = _map_rooms[ room_id ];
		
		var temp_properties = {};
		if( "item" in options ) {
			temp_properties["item"] = options["item"];
		}
		
		var entrances = room.entrances || [ [0,0],[room.width,0]];
		
	
		//if( this.isFree( room, new_direction, cursor ) ) {
		for(var ent=0; ent < entrances.length; ent++ ){
			var entrance = new Point(entrances[ent][0], entrances[ent][1]);
			var cursorEnter = cursor.subtract(entrance);
			if( this.isFree( room, cursorEnter ) ) {
				success = true;
				bid = false;
				
				this.slices.peek().add(cursorEnter,room,temp_properties);
				this.slices.peek().useEntrance(cursorEnter,entrance);
				
				if("secret" in options) this.slices.peek().setSecret(cursor,options.secret);
				
				if( "key_required" in room ){
					var key_name = "key_" + this.key_counter;
					var branch_size = "size" in options ? Math.floor(options.size/2) : 4;
					this.key_counter++;
					console.log("New Key " + key_name);
					bid = this.slices.length;
					this.slices.peek().setProperty(cursorEnter,"door",key_name);
					success = this.addBranch({
							"rules":this.rules.item,
							"item":key_name,
							"difficulty":2,
							"size":branch_size
						}, 
						branch_size, 
						this.slices.peek().getEntrances()
					);
				}
				/*
				if( "door" in temp_properties ){
					if( this.existingKeysIndex().indexOf(temp_properties.door) < 0 ) {
						var key_name = "key_" + this.key_counter;
						var branch_size = "size" in options ? Math.floor(options.size/2) : 4;
						this.key_counter++;
						bid = this.slices.length;
						success = this.addBranch({
								"rules":this.rules.item,
								"item":key_name,
								"difficulty":2,
								"size":branch_size
							}, 
							branch_size, 
							this.slices.peek().getJunctions()
						);
						//console.log("Room: " + room_id + " _ " + success + " " + current_junctions );
					}
				}
				if( "shop" in temp_properties ){
					this.shop_counter++;
				}
				*/
				//More rooms to go?
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
						if( this.addRoom(options, level-1, next_cursor) ) {
							this.slices.peek().useEntrance(cursorEnter,nextEntrance);
							break;
						} else if ( cur >= exits.length -1 ) {
							success = false;
						}
					}
					//success = success && this.addRoom(options, level-1, new_direction, next_cursor);
					
					
					if( !success ) {
						//clear this room
						//if(bid) this.revertSlice(bid);
						this.slices.peek().remove(cursorEnter, room);
					} else {
						return true;
					}
				} else { 
				/*
					var loopSuccess = false;
					var junx = this.slices.peek().getJunctions();
					for(var i=0; i < junx.length; i++){
						if( "item" in options && options.item.match(/key_\d+/) ){
							var dest = MapSlice.idToLoc(junx[i]);
							if( dest.y != cursor.y ) {
								var key = options.item.match(/\d+/)[0] - 0;
								var ops = {"door" : key};
								this.slices.push( this.slices.peek().clone() );
								loopSuccess = this.attemptLoop(ops,0,new_direction,new Point(cursor.x+new_direction,cursor.y),dest);
								if(loopSuccess) 
									break;
								else
									this.slices.pop();
							}
						}
					}
					if( loopSuccess ) {
						this.slices.peek().set(cursor, dataManager.roomFromTags(["item"]));
					}
				*/
					return true;
				}
			}
		}
		
		//All pieces fit, end
		//if( success ) return true; 
	}
	return false;
}

DataManager.prototype.attemptLoop = function(options,level,direction,cursor,destination,connection){
	if( level > 30 ) {
		console.error("Couldn't reach destination in "+level+" steps.");
		return false;
	} else if( cursor.x == destination.x && cursor.y == destination.y ) {
		var id = ~~cursor.x +"_"+ ~~cursor.y;
		var d = "x";
		if( connection ) {
			if( connection > 0 ) d="n";
			if( connection < 0 ) d="s";
		} else {
			if( direction > 0 ) d="w";
			if( direction < 0 ) d="e";
		}
		this.slices.peek().setJunction(cursor,d);
		console.log("Reached Destination!!!");
		return true;
	} else if( connection ) {
		if( this.isFree(null,direction,cursor) ){
			var id = ~~cursor.x +"_"+ ~~cursor.y;
			this.slices.peek().add(cursor,"j");
			
			var d = cursor.x < destination.x ? 1 : -1;
			if(cursor.y == destination.y ){
				this.slices.peek().setJunction(cursor,(d<0?"w":"e"));
				this.slices.peek().setJunction(cursor,(connection>0?"n":"s"));
				
				var c = new Point(cursor.x+d, cursor.y);
				if(!this.attemptLoop(options,level+1,d,c,destination) ){
					//Clean up
					this.slices.peek().remove(cursor);
					return false;
				}
			} else {
				this.slices.peek().setJunction(id, ["n","s"]);
				var v = cursor.y < destination.y ? 1 : -1;
				var c = new Point(cursor.x, cursor.y + v );
				if( !this.attemptLoop(options,level+1,d,c,destination, v) ){
					this.slices.peek().remove(cursor);
					return false;
				}
			}
		} else {
			return false;
		}
	} else if(level > 0 && cursor.y != destination.y && seed.randomBool(0.8) ){
		//Match height
		if( this.isFree(null,direction,cursor) ){
			var d = cursor.x < destination.x ? 1 : -1;
			var id = ~~cursor.x +"_"+ ~~cursor.y;
			
			this.slices.peek().add(id,"j");
			this.slices.peek().setJunction(id,(direction>0?"w":"e"));
			this.slices.peek().setJunction(id,(cursor.y>destination.y?"n":"s"));
			
			var v = cursor.y < destination.y ? 1 : -1;
			var c = new Point(cursor.x, cursor.y + v );
			if(!this.attemptLoop(options,level+1,d,c,destination, v)){
				this.slices.peek().remove(id);
				return false;
			}
		} else {
			return false;
		}		
	} else {
		var room_id = this.randomRoom();
		var room = _map_rooms[ room_id ];
		var ops = options;
		if( "door" in options && Math.abs(cursor.x-destination.x) < 3 && cursor.y == destination.y){
			room_id = dataManager.roomFromTags(["door"]);
			var room = _map_rooms[ room_id ];
		}
		while(cursor.y==destination.y && Math.abs(cursor.x-destination.x) < room.width){
			room_id = this.randomRoom();
			room = _map_rooms[ room_id ];
		}
		if( this.isFree(room,direction,cursor) ) {
			var c = new Point(cursor.x+room.width*direction, cursor.y);
			var p = {};
			if("tags" in room && room.tags.indexOf("door") >= 0 ) {
				p = {"door":options.door};
				ops = {};
			}
			this.slices.peek().add(cursor, room, p, direction);
			if(!this.attemptLoop(ops,level+1,direction,c,destination)){
				this.slices.peek().remove(id, room);
				return false;
			}
		} else {
			return false;
		}
	}
	return true;
}

DataManager.prototype.addWell = function(junctions){
	junctions.sort(function(a,b){ MapSlice.idToLoc(a).y - MapSlice.idToLoc(a).y });
	var size = 6 + Math.floor(seed.random() * 5);
	var item = this.randomTreasure(seed.random(), [], {"remaining":-999,"locked":true});
	var options = {
		"secret":true,
		"rules":this.rules.item,
		"difficulty":2,
		"size":size,
		"item" : item.name
	}
	
	for(var i=0; i < junctions.length; i++){
		var cursor = MapSlice.idToLoc(junctions[i]);
		if(
			this.slices.peek().isFree(cursor.add(new Point(0,1))) &&
			this.slices.peek().isFree(cursor.add(new Point(0,2)))
		){
			rid = this.slices.length;
			this.slices.push( this.slices.peek().clone() );
			this.slices.peek().add(cursor,this.roomFromTags(["well"]));
			this.slices.peek().add(cursor.add(new Point(0,1)),"j");
			this.slices.peek().setJunction(cursor.add(new Point(0,1)),["n","s"]);
			this.slices.peek().setSecret(cursor.add(new Point(0,1)),true);
			this.slices.peek().add(cursor.add(new Point(0,2)),"j");
			this.slices.peek().setJunction(cursor.add(new Point(0,2)),["n","well"]);
			this.slices.peek().setSecret(cursor.add(new Point(0,2)),true);
			
			if( this.addBranch(options, options.size, [MapSlice.locToId(cursor.add(new Point(0,2)))], ["e","w"]) ){
				return true;
			} else {
				this.revertSlice(rid);
			}
		}
	}
	return false;
}
	
DataManager.prototype.isFree = function(room, cursor){
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
DataManager.prototype.revertSlice = function(i){
	this.slices = this.slices.slice(0,i)
}
DataManager.prototype.cut = function(x,y){
	var l = new Line(
		(Math.floor(x/256)*256)+144,
		(Math.floor(y/240)*240)+64,
		(Math.floor(x/256)*256)+368,
		(Math.floor(y/240)*240)+168
	);
	
	for(var x=l.start.x; x < l.end.x; x += 16)
	for(var y=l.start.y; y < l.end.y; y += 16) {
		game.addObject( new BreakableTile(x + 8, y + 8) );
	}
}
DataManager.prototype.wallmeat = function(){
	for(var i in this.slices.peek().data ) {
		if( seed.randomBool(0.2) ) {
			p = MapSlice.idToLoc(i);
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
DataManager.prototype.randomTreasure = function(roll, tags, ops){
	tags = tags || [];
	ops = ops || {};
	ops.remaining = ops.remaining || 0;
	
	var shortlist = [];
	var total = 0.0;
	for(var i=0; i<this.treasures.length; i++) 
		if((!ops.locked && this.treasures[i].remaining > ops.remaining) || (ops.locked && this.treasures[i].unlocked <= 0))
			if(this.treasures[i].tags.intersection(tags).length == tags.length) {
				total += this.treasures[i].rarity;
				shortlist.push(this.treasures[i]);
			}
	roll *= total;
	for(var i=0; i<shortlist.length; i++) {
		if( roll < shortlist[i].rarity ) return shortlist[i];
		roll -= shortlist[i].rarity;
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

DataManager.prettyBlocks = function(data, w){
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
					if( Math.random() < 0.5 ) {
						data[i] = 98 + Math.floor(6*Math.random());
					} else {
						data[i] = 114 + Math.floor(6*Math.random());
					}
				}
			} else if(b[1]>0 && b[3]==0 && b[5]>0 && b[7]==0){
				data[i] = 17; //top left corner
			} else if(b[1]>0 && b[3]>0 && b[5]==0 && b[7]==0){
				data[i] = 24; //top right corner
			} else if(b[1]==0 && b[3]==0 && b[5]>0 && b[7]>0){
				data[i] = 33; //bottom left corner
			} else if(b[1]==0 && b[3]>0 && b[5]==0 && b[7]>0){
				data[i] = 40; //bottom right corner
			} else if(b[1]>0 && b[3]>0 && b[5]>0 && b[7]==0) {
				data[i] = 18 + Math.floor(6*Math.random()); //top tile	
			} else if(b[1]==0 && b[3]>0 && b[5]>0 && b[7]>0) {
				data[i] = 34 + Math.floor(6*Math.random()); //bottom tile	
			} else if(b[1]>0 && b[3]==0 && b[5]>0 && b[7]>0) {
				data[i] = 97 + (Math.random()<0.5?0:16); //left tile	
			} else if(b[1]>0 && b[3]>0 && b[5]==0 && b[7]>0) {
				data[i] = 104 + (Math.random()<0.5?0:16); //right tile	
			}
		}
	}
	return data;
}

function MapSlice() {
	this.data = {};
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
	this.data[loc] = {
		"width" : 1,
		"height" : 1,
		"room" : room_id,
		"entrances" : {},
		"properties" : p,
		"secret" : secret
	}
	
	if( room instanceof Object ){ 
		var width = ("width" in room) ? room["width"] : 1;
		var height = ("height" in room) ? room["height"] : 1;
		this.data[loc]["width"] = width;
		this.data[loc]["height"] = height;
		var entrances = ("entrances" in room) ? room.entrances : [[0,0],[width,0]];
		
		for(var i=0; i < entrances.length; i++){
			ent = MapSlice.locToId(new Point(entrances[i][0],entrances[i][1]));
			this.data[loc].entrances[ent] = false;
		}
		
		for(var x=0; x< width; x++) for(var y=0; y< height; y++){
			if( x!=0 || y!=0 ) {
				this.add(new Point(pos.x+x, pos.y+y), -1, p);
			}
		}
	}
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
	room = room || {};
	var width = ("width" in room) ? room.width : 1;
	var height = ("height" in room) ? room.width : 1;
	
	var pos = MapSlice.idToLoc(loc);
	for(var x=0; x<width; x++) for(var y=0; y<height; y++){
		id = MapSlice.locToId(new Point(pos.x+x,pos.y+y));
		if( id in this.data ){
			delete this.data[id];
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
					console.log("Entrance found!");
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
MapSlice.prototype.getEntrances = function(){
	out = [];
	for(var id in this.data){
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
MapSlice.prototype.keys = function(){
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
			if("width" in f && room.width != f.width) addit = false;
			if("rarity" in f && room.rarity < f.rarity) addit = false;
			if("raritylt" in f && room.rarity > f.raritylt) addit = false;
		} else {
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
MapSlice.prototype.clone = function(){
	out = new MapSlice();
	for(var i in this.data){
		out.add(i,this.data[i].room,this.data[i].properties);
		out.data[i].secret = this.data[i].secret;
		out.data[i].entrances = {};
		for(var j in this.data[i].entrances){
			out.data[i].entrances[j] = this.data[i].entrances[j];
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

var sprites = {};
var audio = {};
var RT = "";

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
	sprites['dreams'] = new Sprite(RT+"img/dreams.gif", {offset:new Point(0, 0),width:256,height:16});
	sprites['transform'] = new Sprite(RT+"img/transform.gif", {offset:new Point(16, 17),width:33,height:34});
	
	sprites['items'] = new Sprite(RT+"img/items.gif", {offset:new Point(8, 8),width:16,height:16,"filters":{"gold":filter_gold}});
	sprites['waystones'] = new Sprite(RT+"img/waystones.gif", {offset:new Point(16, 24),width:32,height:48});
	sprites['alter'] = new Sprite(RT+"img/alter.gif", {offset:new Point(32, 128),width:64,height:128});
	sprites['arena'] = new Sprite(RT+"img/arena.gif", {offset:new Point(64, 128),width:128,height:128});
	sprites['shops'] = new Sprite(RT+"img/shops.gif", {offset:new Point(80, 104),width:160,height:128});
	sprites['bullets'] = new Sprite(RT+"img/bullets.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['cornerstones'] = new Sprite(RT+"img/cornerstones.gif", {offset:new Point(48, 48),width:96,height:96});
	//sprites['map'] = new Sprite(RT+"img/map.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['map'] = new Sprite(RT+"img/maptiles.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['doors'] = new Sprite(RT+"img/doors.gif", {offset:new Point(16, 32),width:32,height:64});
	sprites['gate'] = new Sprite(RT+"img/gate.gif", {offset:new Point(16, 24),width:32,height:48});
	
	sprites['sword1'] = new Sprite(RT+"img/sword1.gif", {offset:new Point(24, 32),width:48,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['sword2'] = new Sprite(RT+"img/sword2.gif", {offset:new Point(10, 32),width:64,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['sword3'] = new Sprite(RT+"img/sword3.gif", {offset:new Point(26, 32),width:80,height:48,"filters":{"enchanted":filter_enchanted}});
	sprites['magic_effects'] = new Sprite(RT+"img/magic_effects.gif", {offset:new Point(16, 32),width:32,height:48});
	
	sprites['amon'] = new Sprite(RT+"img/amon.gif", {offset:new Point(8, 8),width:16,height:16,"filters":filter_pack_enemies});
	sprites['batty'] = new Sprite(RT+"img/batty.gif", {offset:new Point(16, 24),width:32,height:48,"filters":filter_pack_enemies});
	sprites['beaker'] = new Sprite(RT+"img/beaker.gif", {offset:new Point(12, 16),width:24,height:24,"filters":filter_pack_enemies});
	sprites['bear'] = new Sprite(RT+"img/bear.gif", {offset:new Point(14, 16),width:32,height:32,"filters":filter_pack_enemies});
	sprites['bigbones'] = new Sprite(RT+"img/bigbones.gif", {offset:new Point(24, 28),width:77,height:56,"filters":filter_pack_enemies});
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
	sprites['playerhuman'] = new Sprite(RT+"img/playerhuman.gif", {offset:new Point(24, 32),width:48,height:48,"filters":{"enchanted":filter_enchanted,"hurt":filter_hurt}});
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
	
	sprites['tiles0'] = new Sprite(RT+"img/tiles/tiles0.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles1'] = new Sprite(RT+"img/tiles/tiles1.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles2'] = new Sprite(RT+"img/tiles/tiles2.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles3'] = new Sprite(RT+"img/tiles/tiles3.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles4'] = new Sprite(RT+"img/tiles/tiles4.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles5'] = new Sprite(RT+"img/tiles/tiles5.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tilesintro'] = new Sprite(RT+"img/tiles/tilesintro.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['town'] = new Sprite(RT+"img/tiles/town.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['world'] = new Sprite(RT+"img/tiles/world.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['waterfall'] = new Sprite(RT+"img/waterfall.gif", {offset:new Point(64, 120),width:128,height:240});
	
	for( var i in sprites ) {
		sprites[i].name = i;
	}
}

window.audio = new AudioPlayer({
	"music_goeson" : {"url":RT+"sounds/music_goeson.mp3", "music":true},
	"music_goodbye" : {"url":RT+"sounds/music_goodbye.mp3", "music":true},
	"music_intro" : {"url":RT+"sounds/music_intro.ogg", "music":true,"loop":0.0},
	"music_temple1" : {"url":RT+"sounds/music_temple1.ogg","music":true,"loop":24.0},
	"music_town" : {"url":RT+"sounds/music_intro.ogg","music":true,"loop":0.0},
	//"music_town" : {"url":RT+"sounds/music_town.mp3","music":true,"loop":0.0},
	"music_sleep" : {"url":RT+"sounds/music_sleep.mp3","music":true},
	"music_world" : {"url":RT+"sounds/music_world.ogg","music":true,"loop":29.5384},
	"fanfair" : {"url":RT+"sounds/fanfair.ogg","music":true},
	
	"block" : {"url":RT+"sounds/block.wav"},
	"burst1" : {"url":RT+"sounds/burst1.wav"},
	"critical" : {"url":RT+"sounds/critical.wav"},
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