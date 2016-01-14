MapDebug.prototype = new GameObject();
MapDebug.prototype.constructor = GameObject;
function MapDebug(x,y){
	this.constructor();
}

MapDebug.loadMap = function(url){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4 && xhttp.status == 200){
			var parser = new DOMParser();
			var xml = parser.parseFromString(xhttp.response, "text/xml");
			
			MapDebug.parseMap(xml);
		}
	}
	xhttp.open("GET",url,true);
	xhttp.send();
}

MapDebug.parseTile = function(tile,tilesets){
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

MapDebug.parseMap = function(xml){
	var tileset = "";
	var tilesets = new Array();
	var width = 0;
	var height = 0;
	var tilesout = [new Array(), new Array(), new Array()];
	var maptiles = new Array();
	var sprite = false;
	
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
		if(i==0) tileset = name;
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
				tilesout[2].push(MapDebug.parseTile(tiles[j],tilesets));
			} else if("back"==name){
				tilesout[1].push(MapDebug.parseTile(tiles[j],tilesets));
			} else if("far"==name){
				tilesout[0].push(MapDebug.parseTile(tiles[j],tilesets));
			} else if("map"==name){
				if((j%width) < width/16 && Math.floor(j/height) < height/15){
					maptiles.push(MapDebug.parseTile(tiles[j],tilesets));
				}
			}
		}
	}
	
	game.clearAll();
	game.tiles = tilesout;
	game.tileDimension = new Line(0,0,width,height);
	game.bounds = new Line(0,0,width*16,height*15);
	
	if(sprite instanceof Sprite){
		game.tileSprite = sprite;
	}else if(tileset in sprites){
		game.tileSprite = sprites[tileset];
	} else {
		game.tileSprite = sprites.tiles7;
	}
	
	if(!window._world) {
		var wd = new WorldMap(0,0);
		game.addObject(wd);
	}
		

	var pm = new PauseMenu();
	pm.map = PauseMenu.convertTileDataToMapData(maptiles);
	pm.mapDimension = new Line(0,0,Math.floor(width/16),Math.floor(height/15));
	game.addObject(pm);
	
	var objects = xml.getElementsByTagName("object");
	for(var i=0; i < objects.length; i++){
		obj = objects[i];
		var name = obj.getAttribute("name");
		var x = 8 + obj.getAttribute("x") * 1;
		var y = 8 + obj.getAttribute("y") * 1;
		
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
				var newobj = new window[name](x,y,null,properties);
				game.addObject(newobj);
			}
		} catch(err){}
	}
	
	if(!(_player instanceof Player)){
		var player = new Player(64,176);
		game.addObject(player);
	}
	
	if(MapDebug.flight){
		_player.spellsCounters.flight = 99999
	}
	if(MapDebug.level > 1){
		var xp = Math.floor( Math.pow( MapDebug.level-1,1.8 ) * 50 );
		_player.addXP(xp);
	}
}

MapDebug.mapname = "testmap.tmx"
MapDebug.flight = false;
MapDebug.level = 1;