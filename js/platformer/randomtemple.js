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
	//s = "00.5598861731123179";
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
	
	g.tileSprite = sprites.tiles7;
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
			var dim = new Point(obj[2][0],obj[2][1]);
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