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