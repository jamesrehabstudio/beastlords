function DataManager() {
	//Main pipeline for level assests
	this.rooms = [
/* intro */		{"rarity":0,"width":2,"objects":[],"lines":[[128,32,320,32],[64,208,0,208],[64,192,64,208],[96,176,96,192],[96,192,64,192],[464,176,96,176],[512,208,480,208],[480,192,464,192],[464,192,464,176],[480,208,480,192],[128,-16,128,32],[320,32,320,128],[320,128,432,128],[432,128,432,32],[432,32,512,32]]},
/* end */		{"rarity":0,"width":1,"objects":[],"lines":[[16,32,240,32],[0,160,16,160],[16,160,16,32],[256,208,0,208],[0,0,0,160],[240,160,256,160],[256,160,256,0],[240,32,240,160]]},
/* boss */		{"rarity":0,"width":1,"objects":[],"lines":[[16,32,240,32],[0,160,16,160],[16,160,16,32],[256,208,0,208],[0,0,0,160],[240,160,256,160],[256,160,256,0],[240,32,240,160]]},
/* ITM W */		{"rarity":0,"width":1,"objects":[[136,144,"Item"]],"lines":[[240,208,176,208],[0,80,240,80],[176,208,176,192],[176,192,144,192],[96,192,96,208],[96,208,0,208],[144,192,144,160],[144,160,128,160],[128,160,128,192],[128,192,96,192],[240,80,240,208]]},
/* ITM E */		{"rarity":0,"width":1,"objects":[[136,144,"Item"]],"lines":[[256,208,176,208],[16,80,256,80],[176,208,176,192],[176,192,144,192],[96,192,96,208],[96,208,16,208],[144,192,144,160],[144,160,128,160],[128,160,128,192],[128,192,96,192],[16,208,16,80]]},
/* DOOR */		{"rarity":0,"width":1,"objects":[[128,176,"Door"]],"lines":[[256,80,256,32],[0,32,0,80],[80,144,176,144],[256,208,0,208],[0,80,80,80],[80,80,80,144],[176,144,176,80],[176,80,256,80]]},


		{"rarity":1.0,"width":1,"objects":[],"lines":[[0,32,256,32],[256,208,0,208]]},
		{"rarity":0.8,"width":1,"objects":[[128,192,"Knight"]],"lines":[[0,32,256,32],[256,208,0,208]]},
		{"rarity":0.5,"width":1,"objects":[[128,240,"DeathTrigger"]],"lines":[[0,32,256,32],[64,208,0,208],[172,208,128,208],[256,208,236,208]]},
		{"rarity":0.5,"width":2,"objects":[[64,104,"Skeleton"]],"lines":[[0,32,512,32],[512,208,0,208],[32,144,32,160],[48,144,32,144],[48,128,48,144],[32,160,480,160],[480,160,480,144],[480,144,464,144],[464,144,464,128],[464,128,48,128]]},
		{"rarity":0.3,"width":1,"objects":[],"lines":[[16,32,256,32],[64,208,0,208],[64,192,64,208],[48,192,64,192],[48,176,48,192],[64,128,64,176],[0,160,32,160],[32,144,16,144],[32,160,32,144],[64,176,48,176],[144,128,64,128],[0,32,0,160],[16,144,16,32],[144,160,144,128],[176,160,144,160],[176,192,176,160],[208,192,176,192],[256,208,208,208],[208,208,208,192]]},
		{"rarity":0.3,"width":2,"objects":[],"lines":[[16,32,496,32],[512,208,0,208],[464,160,512,160],[320,144,320,160],[320,160,384,160],[384,160,384,144],[384,144,320,144],[464,144,464,160],[496,144,464,144],[496,32,496,144],[512,160,512,0],[16,144,16,32],[144,160,256,160],[256,160,256,144],[256,144,144,144],[144,144,144,160],[0,160,64,160],[64,160,64,144],[64,144,16,144],[0,0,0,160]]}
	];
	
	this.junctions = [
/**/		{"type":["n","e"],"objects":[[128,192,"Lift"]],"lines":[[144,144,256,144],[192,224,112,224],[112,224,112,0],[256,208,192,208],[192,208,192,224],[144,0,144,144],[256,144,256,0],[0,0,0,208]]},
/**/		{"type":["n","w"],"objects":[[128,192,"Lift"]],"lines":[[112,144,112,0],[144,0,144,224],[256,208,256,0],[0,0,0,144],[0,144,112,144],[144,224,64,224],[64,224,64,208],[64,208,0,208]]},
/**/		{"type":["s","e"],"objects":[[128,192,"Lift"]],"lines":[[144,224,144,240],[256,144,256,0],[0,0,0,208],[112,144,256,144],[192,224,144,224],[192,208,192,224],[256,208,192,208],[112,240,112,144]]},
/**/		{"type":["s","w"],"objects":[[128,192,"Lift"]],"lines":[[144,144,144,240],[256,208,256,0],[0,0,0,144],[0,144,144,144],[112,224,64,224],[64,224,64,208],[64,208,0,208],[112,240,112,224]]},
/**/		{"type":["n","e","w"],"objects":[[128,192,"Lift"]],"lines":[[144,144,256,144],[64,208,0,208],[192,224,64,224],[112,144,112,0],[256,208,192,208],[192,208,192,224],[144,0,144,144],[256,144,256,0],[0,144,112,144],[0,0,0,144],[64,224,64,208]]},
/**/		{"type":["s","e","w"],"objects":[[128,192,"Lift"]],"lines":[[0,32,256,32],[64,208,0,208],[64,224,64,208],[112,224,64,224],[112,240,112,224],[256,208,192,208],[192,208,192,224],[192,224,144,224],[144,224,144,240],[48,144,48,160],[48,160,208,160],[208,160,208,144],[208,144,48,144]]},
/**/		{"type":["n","s","e"],"objects":[[128,192,"Lift"]],"lines":[[144,144,256,144],[192,224,144,224],[112,240,112,0],[256,208,192,208],[192,208,192,224],[144,0,144,144],[256,144,256,0],[0,0,0,208],[144,224,144,240]]},
/**/		{"type":["n","s","w"],"objects":[[128,192,"Lift"]],"lines":[[112,144,112,0],[144,0,144,240],[256,208,256,0],[0,0,0,144],[0,144,112,144],[112,240,112,224],[112,224,64,224],[64,224,64,208],[64,208,0,208]]},
/**/		{"type":["n","s","e","w"],"objects":[[128,192,"Lift"]],"lines":[[144,144,256,144],[192,224,144,224],[112,144,112,0],[256,208,192,208],[192,208,192,224],[144,0,144,144],[256,144,256,0],[0,0,0,144],[144,224,144,240],[0,144,112,144],[112,240,112,224],[112,224,64,224],[64,224,64,208],[64,208,0,208]]}
	];
	
	this.rules = {
		"start": function(){ return [[0,1,0]]; 
		},
		"main" : function(level, direction){ 
			if(level==0) return [[1,direction,0]]; 
			if(level==1) return [[2,direction,0]]; 
			if(Math.random()>.5) return [[5,direction,-1,{"door":this.key_counter}], [this.randomRoom(), direction, 0]];
			if(Math.random()>.8 && level > 2) return [["j",direction,-1],["j",direction,1],[this.randomRoom(), direction, 0]]; 
			return [[this.randomRoom(), direction, 0]]; 
		},
		"item" : function(level,direction,options){
			if(level==0) {
				if( direction > 0 ) return [[3,direction,0,{"item":options.item}]]; 
				else return [[4,direction,0,{"item":options.item}]];
			}
			//if(Math.random()>.96) return [[5,direction,-1,{"door":this.key_counter}]]; 
			if(Math.random()>.93 && level > 2) return [["j",direction,-1],["j",direction,1],[this.randomRoom(), direction, 0]]; 
			return [[this.randomRoom(), direction, 0]]; 
		}
	}
}

DataManager.prototype.randomLevel = function(g){
	var success = false;
	
	while( !success ) {
		this.key_counter = 0;
		
		this.room_matrix = {};
		this.junctions_matrix = {};
		this.properties_matrix = {};
		this.branch_matrix = {};
		
		this.room_matrix["0_0"] = 0;
		this.room_matrix["1_0"] = -1;
		
		var options = {
			"rules":this.rules.main
		}
		
		success = this.addRoom(options,15,1, new Point(2,0));
		
		for(var i in this.branch_matrix ){
			if( !this.addBranch(this.branch_matrix[i].options, 8, this.branch_matrix[i].junctions) ) {
				console.error("Failed to create branch, map may not be completable.")
				success = false;
			}
		}
	}
	
	var width = 256;
	var height = 240;
	
	for(var i in this.room_matrix){
		pos = new Point(
			~~i.match(/(-?\d+)/g)[0],
			~~i.match(/(-?\d+)/g)[1]
		);
		
		var room;
		if( this.room_matrix[i] == "j" ) {
			var tags = this.junctions_matrix[i];
			room = this.junctions[ this.getJunctionRoomIndex(tags) ];
		} else if ( this.room_matrix[i] >= 0 ) { 
			room = this.rooms[ this.room_matrix[i] ];
		} else { 
			room = null;
		}
		
		if( room ) {
			var cursor = new Point(pos.x * width, pos.y * height );
			this.createRoom(g,room,cursor,i);
		}
	}
	g.collisions.push( new Line(0,240,0,0) );
	//g.collisions.push( new Line(cursor,0,cursor,240) );
	
	g.addObject( new Player( 32, 120 ) );
	
	//_player.lock = _player.lock = new Line(0,0,cursor,240);
	//_player.lock = _player.lock = new Line(0,0,Number.MAX_VALUE,-240);
}

DataManager.prototype.createRoom = function(g,room,cursor,id){
	for(var j=0; j < room.objects.length; j++){
		var obj = room.objects[j];
		var new_obj = new window[obj[2]](cursor.x + obj[0], cursor.y + obj[1]);
		
		g.addObject( new_obj );
		
		if( id in this.properties_matrix ){
			var props = this.properties_matrix[id];
			if(obj[2] == "Item") new_obj.name = "item" in props ? props["item"] : new_obj.name;
			if(obj[2] == "Door") new_obj.name = "key_" + ("door" in props ? props["door"] : new_obj.name);
		}
	}
	
	for(var j=0; j < room.lines.length; j++){
		var line = room.lines[j];
		temp = new Line( 
			new Point( cursor.x + line[0], cursor.y + line[1] ),
			new Point( cursor.x + line[2], cursor.y + line[3] )
		);
		g.collisions.push( temp );
	}
}

DataManager.prototype.getJunctionRoomIndex = function(tags){
	var out = [];
	var dir = ["n","e","s","w"];
	for( var i=0; i < this.junctions.length; i++ ) {
		var match = true;
		for(var j=0; j < dir.length; j++ ){
			var o = dir[j];
			if((this.junctions[i].type.indexOf(o) < 0) != (tags.indexOf(o) < 0))
				match = false;
		}
		if( match ) out.push(i);
	}
	return out[0];
}
DataManager.prototype.addBranch = function(properties, level, options){
	var compass = ["n","e","s","w"];
	
	options.sort(function(){ return Math.random()-.5; });
	
	for( var i=0; i < options.length; i++ ) {
		var _i = options[i];
		var tags = this.junctions_matrix[_i];
		pos = new Point( ~~_i.match(/(-?\d+)/g)[0], ~~_i.match(/(-?\d+)/g)[1] );
		
		//Shuffle directions
		compass.sort(function(){ return Math.random()-.5; });
		
		for(var j=0; j < compass.length; j++ ){
			//Check the four cardinal directions to see if one is free
			var d = compass[j];
			if( tags.indexOf( d ) < 0 ) {
				//This direction is free.
				if( d == "n" ) {
					if( this.addRoom(properties, level, 0, new Point(pos.x, pos.y+1), new Point(0,-1)) ){
						tags.push(d);
						return true;
					}
				} else if ( d = "e" ) {
					if( this.addRoom(properties, level, 1, new Point(pos.x+1, pos.y)) ){
						tags.push(d);
						return true;
					}
				} else if ( d = "s" ) {
					if( this.addRoom(properties, level, 0, new Point(pos.x, pos.y-1), new Point(0,1)) ){
						tags.push(d);
						return true;
					}
				} else if ( d = "w" ) {
					if( this.addRoom(properties, level, -1, new Point(pos.x-1, pos.y)) ){
						tags.push(d);
						return true;
					}
				}				
			}
		}
	}
	return false;
}

DataManager.prototype.addRoom = function(options, level, direction, cursor, connector){
		
	//List of rooms to try
	var r = [];
	
	if( connector instanceof Point ) {
		//connecting room
		var _d = Math.random();
		r.push( ["j", 1, 0] );
		r.push( ["j", -1, 0] );
	} else {
		//Use assigned rule set
		r = options.rules.apply(this,[level,direction,options]);
	}
	
	//Scramble order
	r.sort(function(a,b){ return Math.random()-.5; } )
	
	var success = false;
	
	for(var j = 0; j < r.length; j++ ) {
		//Go through rooms until one fits
		var room_data = r[j];
		var room;
		var isJunction = room_data[0] == "j";
		if( isJunction ) room = {"width":1}
		else room = this.rooms[ room_data[0] ];
		var new_direction = room_data[1];
		var temp_properties = room_data.length > 3 ? room_data[3] : {};
	
		if( this.isFree( room, new_direction, cursor ) ) {
			success = true;
		
			//fill in tiles
			for( i=0; i < room.width; i++){
				var pos = new Point( cursor.x + i * new_direction, cursor.y );
				var id = ~~pos.x +"_"+ ~~pos.y;
				this.room_matrix[ id ] = -1;
				
				var top_left = new_direction > 0 ? (i==0) : (i==room.width-1);
				
				if( top_left ) {
					this.room_matrix[ id ] = room_data[0];
					this.properties_matrix[ id ] = temp_properties;
					
					if( isJunction ) {
						this.junctions_matrix[ id ] = [];

						if( connector instanceof Point ) {
							if( new_direction > 0 ) this.junctions_matrix[ id ].push( "e" ); else this.junctions_matrix[ id ].push( "w" );
							if( connector.y > 0 ) this.junctions_matrix[ id ].push( "s" ); else this.junctions_matrix[ id ].push( "n" );
						} else {
							if( new_direction > 0 ) this.junctions_matrix[ id ].push( "w" ); else this.junctions_matrix[ id ].push( "e" );
							if( room_data[2] > 0 ) this.junctions_matrix[ id ].push( "s" ); else this.junctions_matrix[ id ].push( "n" );
						}
					}
				}
			}
			
			//More rooms to go?
			if( level > 0 ){
				
				if( "door" in temp_properties ){
					var id = ~~cursor.x +"_"+ ~~cursor.y;
					var key_name = "key_" + this.key_counter;
					this.key_counter++;
					success = success && this.createBranchNotice(id,{"rules":this.rules.item,item:key_name});
				}
				
				if( isJunction ) {
					//This is a junction, go up
					if( connector instanceof Point ){
						//Connect to previous room
						var next_cursor = new Point(cursor.x + room.width * new_direction, cursor.y);
						success = success && this.addRoom(options, level-1, new_direction, next_cursor);
					} else {
						//New junction
						var next_cursor = new Point(cursor.x, cursor.y + room_data[2]);
						success = success && this.addRoom(options, level-1, new_direction, next_cursor, new Point(0,-room_data[2]));
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
						delete this.junctions_matrix[ id ];
						delete this.properties_matrix[ id ];
						delete this.branch_matrix[ id ];
					}
				} else {
					return true;
				}
			} else { 
				return true;
			}
		}
		
		//All pieces fit, end
		if( success ) return true; 
	}
	
	return false;
}

DataManager.prototype.isFree = function(room, direction, cursor){
	for( i=0; i < room.width; i++){
		var pos = new Point( cursor.x + i * direction, cursor.y );
		var id = ~~pos.x +"_"+ ~~pos.y;
		if( id in this.room_matrix ) return false
	}
	return true;
}

DataManager.prototype.randomRoom = function(){
	var total = 0.0;
	for(var i=0; i<this.rooms.length; i++) total += this.rooms[i].rarity;
	var roll = Math.random() * total;
	for(var i=0; i<this.rooms.length; i++) {
		if( roll < this.rooms[i].rarity ) return i;
		roll -= this.rooms[i].rarity;
	}
	return 1;
}

DataManager.prototype.createBranchNotice = function(id,ops){
	var out = { "junctions":[], options:ops };
	var junctions_exist = false;
	for( var i in this.junctions_matrix ){
		out.junctions.push(i)
		junctions_exist = true;
	}
	this.branch_matrix[id] = out;
	return junctions_exist;
}

var sprites = {}
var RT = "/";
function load_sprites (){
	//sprites['player'] = new Sprite(RT+"img/dude.png", {offset:new Point(12, 20),width:24,height:32});
	sprites['items'] = new Sprite(RT+"img/items.gif", {offset:new Point(8, 8),width:16,height:16});
	sprites['doors'] = new Sprite(RT+"img/doors.gif", {offset:new Point(12, 32),width:32,height:64});
	sprites['player'] = new Sprite(RT+"img/player.gif", {offset:new Point(12, 16),width:24,height:32});
	sprites['knight'] = new Sprite(RT+"img/knight.gif", {offset:new Point(14, 16),width:32,height:32});
	sprites['skele'] = new Sprite(RT+"img/skele.gif", {offset:new Point(14, 16),width:32,height:32});
	
	for( var i in sprites ) {
		sprites[i].name = i;
	}
}