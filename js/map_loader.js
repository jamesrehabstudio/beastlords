MapLoader = {};
MapLoader.loadMap = function(map,options){
	var g = window.game;
	
	//Get map from mapname
	if(!(map in window._map_maps)){
		console.error("Cannot find map with name: "+ map);
		return;
	} else{
		map = window._map_maps[map];
	}
	
	var playerStartPositions = new Array();
	
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
		if(obj[3] == "Player"){
			playerStartPositions.push(obj);
		} else {
			try{
				g.addObject( new window[obj[3]](
					obj[0],
					obj[1],
					obj[2],
					obj[4]
				));
			} catch(err){
				console.error("Unable to add object: "+ obj[2]);
			}
		}
	}
	var mapTiles = [];
	if( "map" in map ) {
		mapTiles = PauseMenu.convertTileDataToMapData(map["map"]);
	}
	
	if( _player instanceof Player ){
		window._player.keys = new Array();
		window._player.lock_overwrite = false;
	} else {
		window._player = new Player();
	}
	
	//Default player spawns positions
	_player.position.x = 64;
	_player.position.y = 200;
	
	//Go through all player starts and determine the correct start
	for(var i=0;i<playerStartPositions.length;i++){
		var obj = playerStartPositions[i];
		if(i==0){
			//First Player will be default unless a better match is made
			window._player.position.x = obj[0];
			window._player.position.y = obj[1];
		}
		if("start" in obj[4]){
			if(
				obj[4].start == options.start ||
				obj[4].start == "west" && options.direction.x >= 0 ||
				obj[4].start == "east" && options.direction.x < 0
			){
				window._player.position.x = obj[0];
				window._player.position.y = obj[1];
				break;
			}
		}
	}
	
	g.addObject(window._player);
	
	var pm = new PauseMenu();
	pm.map = mapTiles;
	pm.mapDimension = mapDimension;
	
	g.addObject(pm);
	g.addObject(new Background());
}

MapLoader.loadMapTmx = function(url, callback){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4){
			//AJAX load
			try{
				var parser = new DOMParser();
				var xml = parser.parseFromString(xhttp.response, "text/xml");
				var starts = MapLoader.parseMap(xml);
				
				if(callback instanceof Function){
					callback.apply(window,[starts]);
				}
			} catch(err){
				console.error(err);
			}
		}
	}
	xhttp.open("GET",url,true);
	xhttp.send();
}

MapLoader.parseTile = function(tile,tilesets){
	tile *= 1;
	var subtract = 1;
	var flags = Math.abs(tile & 0xF0000000);
	var utile = Math.abs(tile & 0x0FFFFFFF);
	
	for(var i=0; i < tilesets.length; i++){
		if(utile >= tilesets[i]){
			subtract = tilesets[i];
		}
	}
	subtract -= 1;
	return flags + (utile - subtract);
}

MapLoader.parseMap = function(xml){
	var tileset = "";
	var tilesets = new Array();
	var playerStart = new Array();
	
	var out = {
		"tileset" : "",
		"width" : 0,
		"height" : 0,
		"layers" : new Array(),
		"layersProperties" : new Array(),
		"map" : new Array(),
		"objects" : new Array(),
		"starts" : new Array(),
		"collisionLayer" : 0,
		"order" : new Array()
	}
	
	try{
		//Load sprites
		var filename = xml.getElementsByTagName("tileset")[0].getElementsByTagName("image")[0].getAttribute("source");
		sprite = new Sprite(filename,{offset:new Point(0, 0),width:16,height:16});
	} catch(err){
		
	}
	
	var tilesetXml = xml.getElementsByTagName("tileset");
	for(var i=0; i < tilesetXml.length; i++){
		var name = tilesetXml[i].getAttribute("name");
		tilesets.push(tilesetXml[i].getAttribute("firstgid") * 1);
		if(i==0 || name in window.tiles) out.tileset = name;
	}
	
	var tileLayers = xml.getElementsByTagName("layer");
	for(var i=0; i < tileLayers.length; i++){
		var t = tileLayers[i];
		var name = t.getAttribute("name");
		var tiles = t.getElementsByTagName("data")[0].innerHTML.split(",");
		
		out.width = t.getAttribute("width") * 1;
		out.height = t.getAttribute("height") * 1;
		
		if("map"==name){
			out.map = new Array();
		} else{
			var properties = tileLayers[i].getElementsByTagName("property");
			var props = {};
			for(var j=0; j < properties.length; j++){
				var propName = properties[j].getAttribute("name");
				var value = properties[j].getAttribute("value");
				if(!isNaN(value)){ value = value * 1;}
				props[propName] = value;
			}
			out.layers.push(new Array());
			out.layersProperties.push(props);
			if("front"==name){
				out.order.push("o");
			}
			out.order.push(i);
		}
		
		for(var j=0; j < tiles.length; j++){
			if("map"==name){
				if((j%out.width) < out.width/16 && Math.floor(j/out.width) < out.height/15){
					out.map.push(MapLoader.parseTile(tiles[j],tilesets));
				}
			} else {
				if("front"==name){
					out.collisionLayer = i;
				}
				out.layers[i].push(MapLoader.parseTile(tiles[j],tilesets));
			}
			/*
			if("top"==name){
				out.layers[3].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("front"==name){
				out.layers[2].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("back"==name){
				out.layers[1].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("far"==name){
				out.layers[0].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("map"==name){
				if((j%out.width) < out.width/16 && Math.floor(j/out.width) < out.height/15){
					out.map.push(MapLoader.parseTile(tiles[j],tilesets));
				}
			}
			*/
		}
	}
	
	out.map = MapLoader.convertTileDataToMapData(out.map);
	
	/*
	if(tileset in window.tiles){
		window.tiles[tileset].use(window.game);
	} else if(sprite instanceof Sprite){
		var temp;
		if(sprite.width > 256){
			temp = new Tileset(sprite,tileRules.big);
		} else {
			temp = new Tileset(sprite,tileRules.small);
		}
		temp.use(window.game);
	} else {
		window.tiles.tiles7.use(window.game);
	}	

	var pm = new PauseMenu();
	pm.map = PauseMenu.convertTileDataToMapData(maptiles);
	pm.mapDimension = new Line(0,0,Math.floor(width/16),Math.floor(height/15));
	game.addObject(pm);
	
	var bg = new Background();
	game.addObject(bg);
	*/
	var objects = xml.getElementsByTagName("object");
	for(var i=0; i < objects.length; i++){
		obj = objects[i];
		var name = obj.getAttribute("name");
		var x = obj.getAttribute("x") * 1;
		var y = obj.getAttribute("y") * 1;
		var w = 0;
		var h = 0;
		var points = new Array();
		
		if(obj.getAttribute("width")){
			w = obj.getAttribute("width") * 1;
		}
		if(obj.getAttribute("height")){
			h = obj.getAttribute("height") * 1;
		}
		
		var rect = !obj.getAttribute("gid");
		if(rect){
			x += Math.floor(w/2); 
			y += Math.floor(h/2);
		}else{
			x += Math.floor(w/2); 
			y -= Math.floor(h/2);
		}
		
		let polygon = obj.getElementsByTagName("polygon")[0];
		if(polygon){
			let coord = polygon.getAttribute("points").split(" ");
			for(let j=0; j < coord.length; j++){
				let xy = coord[j].split(",");
				points.push({
					x: xy[0] * 1.0,
					y: xy[1] * 1.0
				});
			}
			
		}
		
		let polyline = obj.getElementsByTagName("polyline")[0];
		if(polyline){
			let coord = polyline.getAttribute("points").split(" ");
			for(let j=0; j < coord.length; j++){
				let xy = coord[j].split(",");
				points.push({
					x: xy[0] * 1.0,
					y: xy[1] * 1.0
				});
			}
			
		}
		
		//Build properties
		var properties = {};
		if(obj.children.length > 0){
			var props = obj.getElementsByTagName("property");
			for(var j=0; j < props.length; j++){
				var p = props[j];
				properties[p.getAttribute("name")] = p.getAttribute("value");
			}
		}
		
		try{
			if(name == "Player"){
				var start = false;
				if("start" in properties){
					start = properties["start"];
				}
				
				var player = {
					"x" : x,
					"y" : y,
					"start" : start
				};
				
				out.starts.push(player);
				playerStart.push(player);
			} else {
				out.objects.push({"name":name,"x":x,"y":y,"width":w,"height":h,"properties":properties, "points":points});
			}
		} catch(err){
			console.error("Cannot add object: "+name+", "+err);
		}
	}
	
	game.useMap(out);
	
	if(MapLoader.flight){
		_player.spellsCounters.flight = 99999
	}
	if(MapLoader.level > 1){
		var xp = Math.floor( Math.pow( MapLoader.level-1,1.8 ) * 50 );
		_player.addXP(xp);
	}
	
	return playerStart;
}
MapLoader.convertTileDataToMapData = function(data){
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

MapLoader.mapname = "testmap.tmx"
MapLoader.flight = false;
MapLoader.level = 1;