WorldMap = {};
WorldMap.map = [];
WorldMap.width = 96;
WorldMap.height = 32;
WorldMap.mapProperties = {
	"gateway.tmx" : { offset : new Point(0,12), color : 0 },
	"temple1.tmx" : { offset : new Point(16,13), color : 1 },
	"temple2.tmx" : { offset : new Point(62,1), color : 2 },
	"temple3.tmx" : { offset : new Point(37,13), color : 3 },
	"temple4.tmx" : { offset : new Point(25,0), color : 4 },
	"mills.tmx" : { offset : new Point(8,21), color : 5 },
	"pit.tmx" : { offset : new Point(75,14), color : 6 },
	"townhub.tmx" : { offset : new Point(51,12), color : 7 },
};
WorldMap.colors = [
	[0.3,0.6,0.7,1],
	[0.8,0.5,0.0,1],
	[0.2,0.8,0.0,1],
	[0.2,0.0,0.5,1],
	[0.5,0.3,0.0,1],
	[0.6,0.1,0.0,1],
	[0.3,0.2,0.3,1],
	[0.8,0.7,0.7,1],
];
WorldMap.pos2mapPos = function(pos){
	let offset = new Point();
	if(game.map.filename in WorldMap.mapProperties){
		offset = WorldMap.mapProperties[game.map.filename].offset;
	}
	return pos.scale(1/256,1/240).floor().add(offset);
}
WorldMap.pos2mapIndex = function(pos){
	let offset = new Point();
	if(game.map.filename in WorldMap.mapProperties){
		offset = WorldMap.mapProperties[game.map.filename].offset;
	}
	pos = pos.scale(1/256,1/240).floor().add(offset);
	return Math.floor( pos.x + pos.y * WorldMap.width );
	
}
WorldMap.revealTile = function(pos, tile){
	let color = 0;
	if(game.map.filename in WorldMap.mapProperties){
		color = WorldMap.mapProperties[game.map.filename].color;
	}
	
	let ftile = tile + (color << 8);
	WorldMap.map[WorldMap.pos2mapIndex(pos)] = ftile;
}
WorldMap.render = function(g, offset, area, large=false){
	if(area == undefined) { area = new Line(0,0,WorldMap.width, WorldMap.height); }
	
	let size = large ? 8 : 4;
	let sprite = large ? "map_large" : "map_small";
	
	let mixcolor = function(c){
		let mix = [0.1,0.3,0.5,1];
		let d = 0.0;
		return [
			Math.lerp(c[0], mix[0], d),
			Math.lerp(c[1], mix[1], d),
			Math.lerp(c[2], mix[2], d),
			Math.lerp(c[3], mix[3], d),
		];
	}
	
	for(let x = area.start.x; x < area.end.x; x++ ) for(let y = area.start.y; y < area.end.y; y++ ) {
		let index = x + y * WorldMap.width;
		let tdata =  WorldMap.map[index];
		if(tdata != undefined && tdata >= 0){
			let tile = tdata& 255;
			let color = tdata >> 8;
			let frame = new Point(Math.floor(tile/16), Math.mod(tile,16));
		
			g.color = mixcolor(WorldMap.colors[color]);
			g.drawRect(x*size+offset.x, y*size+offset.y,size,size, 0);
			g.renderSprite(sprite, new Point(x,y).scale(size).add(offset), 1, frame, false);
		}
	}
}


WorldLocale = {};
WorldLocale.currentMapName = null;
WorldLocale.loadMap = function(map, start, callback){
	//Save current map reveal first
	PauseMenu.saveMapReveal();
	
	_player.keys = new Array();
	PauseMenu.mapIcons = new Array();
	
	var file = map;
	game.loadMap(file, function(starts){
		WorldLocale.currentMapName = map;
		
		//Determine player start location
		if(starts.length > 0){
			var index = WorldLocale.getMapIndex(starts,start);
			if(index >= 0){
				//Player start matches specified location start
				_player.position = new Point(starts[index].x,starts[index].y);
				game.addObject(_player);
			} else {
				//No start location specified, pick the first start
				_player.position = new Point(starts[0].x,starts[0].y);
				game.addObject(_player);
			}
		} else {
			//No player start, just force one in
			_player.position = new Point(64,192);
			game.addObject(_player);
		}
		game.addObject(new PauseMenu(0,0));
		game.addObject(new Background(0,0));
		
		if(callback instanceof Function){
			callback.apply(self, [map]);
		}
	});
}
WorldLocale.getMapIndex = function(list,key){
	for(var i=0; i < list.length; i++){
		if(list[i].start == key){
			return i;
		}
	}
	return -1;
}