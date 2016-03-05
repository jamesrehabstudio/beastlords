MapLoader.prototype = new GameObject();
MapLoader.prototype.constructor = GameObject;
function MapLoader(x,y){
	this.constructor();
}

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

MapLoader.loadMapTmx = function(url){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4){
			//AJAX load
			try{
				var parser = new DOMParser();
				var xml = parser.parseFromString(xhttp.response, "text/xml");
				
				MapLoader.parseMap(xml);
			} catch(err){}
		}
	}
	xhttp.open("GET",url,true);
	xhttp.send();
}

MapLoader.parseTile = function(tile,tilesets){
	tile *= 1;
	var subtract = 1;
	for(var i=0; i < tilesets.length; i++){
		if(tile >= tilesets[i]){
			subtract = tilesets[i];
		}
	}
	subtract -= 1;
	return tile - subtract;
}

MapLoader.parseMap = function(xml){
	var tileset = "";
	var tilesets = new Array();
	var width = 0;
	var height = 0;
	var tilesout = [new Array(), new Array(), new Array()];
	var maptiles = new Array();
	
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
		if(i==0 || name in window.tiles) tileset = name;
	}
	
	var tileLayers = xml.getElementsByTagName("layer");
	for(var i=0; i < tileLayers.length; i++){
		var t = tileLayers[i];
		var name = t.getAttribute("name");
		var tiles = t.getElementsByTagName("data")[0].innerHTML.split(",");
		
		width = t.getAttribute("width") * 1
		height = t.getAttribute("height") * 1
		
		for(var j=0; j < tiles.length; j++){
			if("front"==name){
				tilesout[2].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("back"==name){
				tilesout[1].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("far"==name){
				tilesout[0].push(MapLoader.parseTile(tiles[j],tilesets));
			} else if("map"==name){
				if((j%width) < width/16 && Math.floor(j/width) < height/15){
					maptiles.push(MapLoader.parseTile(tiles[j],tilesets));
				}
			}
		}
	}
	
	game.clearAll();
	game.tiles = tilesout;
	game.tileDimension = new Line(0,0,width,height);
	game.bounds = new Line(0,0,width*16,height*16);
	
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
	
	if(!window._world) {
		var wd = new WorldMap(0,0);
		game.addObject(wd);
	}
		

	var pm = new PauseMenu();
	pm.map = PauseMenu.convertTileDataToMapData(maptiles);
	pm.mapDimension = new Line(0,0,Math.floor(width/16),Math.floor(height/15));
	game.addObject(pm);
	
	var bg = new Background();
	game.addObject(bg);
	
	var objects = xml.getElementsByTagName("object");
	for(var i=0; i < objects.length; i++){
		obj = objects[i];
		var name = obj.getAttribute("name");
		var x = obj.getAttribute("x") * 1;
		var y = obj.getAttribute("y") * 1;
		var w = 16;
		var h = 16;
		
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
			if(name in window){
				var newobj = new window[name](x,y,[w,h],properties);
				game.addObject(newobj);
			}
		} catch(err){}
	}
	
	if(!(_player instanceof Player)){
		var player = new Player(64,176);
		game.addObject(player);
	}
	
	if(MapLoader.flight){
		_player.spellsCounters.flight = 99999
	}
	if(MapLoader.level > 1){
		var xp = Math.floor( Math.pow( MapLoader.level-1,1.8 ) * 50 );
		_player.addXP(xp);
	}
}

MapLoader.mapname = "testmap.tmx"
MapLoader.flight = false;
MapLoader.level = 1;