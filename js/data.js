function DataManager() {
	//Main pipeline for level assests
	this.rooms = [
		{"rarity":0,"width":512,"objects":[],"lines":[[128,32,320,32],[64,208,0,208],[64,192,64,208],[96,176,96,192],[96,192,64,192],[464,176,96,176],[512,208,480,208],[480,192,464,192],[464,192,464,176],[480,208,480,192],[128,-16,128,32],[320,32,320,128],[320,128,432,128],[432,128,432,32],[432,32,512,32]]},
		{"rarity":0,"width":256,"objects":[],"lines":[[16,32,240,32],[0,160,16,160],[16,160,16,32],[256,208,0,208],[0,0,0,160],[240,160,256,160],[256,160,256,0],[240,32,240,160]]},
		{"rarity":1.0,"width":256,"objects":[],"lines":[[0,32,256,32],[256,208,0,208]]},
		{"rarity":0.8,"width":256,"objects":[[128,192,"Knight"]],"lines":[[0,32,256,32],[256,208,0,208]]},
		{"rarity":0.5,"width":256,"objects":[],"lines":[[0,32,256,32],[64,208,0,208],[172,208,128,208],[256,208,236,208]]},
		{"rarity":0.5,"width":512,"objects":[[64,104,"Skeleton"]],"lines":[[0,32,512,32],[512,208,0,208],[32,144,32,160],[48,144,32,144],[48,128,48,144],[32,160,480,160],[480,160,480,144],[480,144,464,144],[464,144,464,128],[464,128,48,128]]},
		{"rarity":0.3,"width":256,"objects":[],"lines":[[16,32,256,32],[64,208,0,208],[64,192,64,208],[48,192,64,192],[48,176,48,192],[64,128,64,176],[0,160,32,160],[32,144,16,144],[32,160,32,144],[64,176,48,176],[144,128,64,128],[0,32,0,160],[16,144,16,32],[144,160,144,128],[176,160,144,160],[176,192,176,160],[208,192,176,192],[256,208,208,208],[208,208,208,192]]},
		{"rarity":0.3,"width":512,"objects":[],"lines":[[16,32,496,32],[512,208,0,208],[464,160,512,160],[320,144,320,160],[320,160,384,160],[384,160,384,144],[384,144,320,144],[464,144,464,160],[496,144,464,144],[496,32,496,144],[512,160,512,0],[16,144,16,32],[144,160,256,160],[256,160,256,144],[256,144,144,144],[144,144,144,160],[0,160,64,160],[64,160,64,144],[64,144,16,144],[0,0,0,160]]}
	];
}

var RT = "";

DataManager.prototype.getLevel = function( callback, context, name ) {
	$.ajax({
		//url: RT+"save.php",
		url: "/maps/map0004.map",
		type : "GET",
		data : { name : name },
		contentType : "JSON",
		success: callback,
		error: function(a,b,c){ alert("unable to level:\n"+c); }
	})
}

DataManager.prototype.randomLevel = function(g){
	var cursor = 0;
	var size = ~~(Math.random() * 6 + 8);
	for(var i=0; i < size; i++){
		var room;
		
		if( i == 0 ) room = this.rooms[0];
		else if( i >= size-1 ) room = this.rooms[1];
		else room = this.rooms[ this.randomRoom() ];
		
		this.addRandomRoom(g,room,cursor);
		
		cursor += room.width;
	}
	g.collisions.push( new Line(0,240,0,0) );
	g.collisions.push( new Line(cursor,0,cursor,240) );
	g.addObject( new Player( 32, 120 ) );
	_player.lock = _player.lock = new Line(0,0,cursor,240);
}

DataManager.prototype.addRandomRoom = function(g,room,cursor){
	for(var j=0; j < room.objects.length; j++){
		var obj = room.objects[j];
		g.addObject( new window[obj[2]](cursor + obj[0],obj[1]) );
	}
	
	for(var j=0; j < room.lines.length; j++){
		var line = room.lines[j];
		temp = new Line( 
			new Point( cursor + line[0], line[1] ),
			new Point( cursor + line[2], line[3] )
		);
		g.collisions.push( temp );
	}
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

function delete_me_create_map () {
	game.addObject( new Player(-32,0) );
	
	for( var i = 0; i < 5; i++ ) {
		random = _randompos();
		game.addObject( new ZombieSpawner(random.x,random.y) );
	}
	
	var prop_size = 128;
	var size = 7;
	for( x = -size; x < size; x++ ) {
		for( y = -size; y < size; y++ ) {
			game.addObject( new Prop(x*prop_size,y*prop_size, sprites.tile_grass) );
		}
	}
	
	for( y = -size; y < size; y++ ){
		temp = new Prop(-168,y*prop_size, sprites.tile_road);
		temp.zIndex = -9998;
		game.addObject( temp );
	}
	
	game.addObject( new Tree(0,0) );
	game.addObject( new Tree(-100, -820) );
	game.addObject( new Tree(500, 840) );
	
	game.collisions.push( new Line( new Point( -14, 0 ), new Point( 7, 0 ) ) );
	game.collisions.push( new Line( new Point( 7, 0 ), new Point( 7, 14 ) ) );
	game.collisions.push( new Line( new Point( 7, 14 ), new Point( -14, 14 ) ) );
	game.collisions.push( new Line( new Point( -14, 14 ), new Point( -14, 0 ) ) );
	
	game.collisions.push( new Line( new Point( -800, -800 ), new Point( 800, -800 ) ) );
	game.collisions.push( new Line( new Point( 800, -800 ), new Point( 800, 800 ) ) );
	game.collisions.push( new Line( new Point( 800, 800 ), new Point( -800, 800 ) ) );
	game.collisions.push( new Line( new Point( -800, 800 ), new Point( -800, -800 ) ) );
	
}

var sprites = {}

function load_sprites (){
	//sprites['player'] = new Sprite(RT+"img/dude.png", {offset:new Point(12, 20),width:24,height:32});
	sprites['player'] = new Sprite(RT+"img/player.gif", {offset:new Point(12, 16),width:24,height:32});
	sprites['knight'] = new Sprite(RT+"img/knight.gif", {offset:new Point(14, 16),width:32,height:32});
	sprites['skele'] = new Sprite(RT+"img/skele.gif", {offset:new Point(14, 16),width:32,height:32});/*
	sprites['tree_trunk_ash'] = new Sprite(RT+"img/tree_trunk_ash.png", {offset:new Point(14, 145)});
	sprites['tree_brush_ash'] = new Sprite(RT+"img/tree_brush_ash.png", {offset:new Point(26, 16)});
	sprites['health_bar'] = new Sprite(RT+"img/health_bar.png",{offset:new Point(),width:88,height:16});
	sprites['spawner'] = new Sprite(RT+"img/spawner.png",{offset:new Point(20,24),height:48});
	sprites['bullman'] = new Sprite(RT+"img/bullman.png",{offset:new Point(20,32),width:40,height:40});

	sprites['tile_road'] = new Sprite(RT+"img/tiles/road_center.png");
	sprites['tile_road_parking_h'] = new Sprite(RT+"img/tiles/road_parking_h.png");
	sprites['manholecover'] = new Sprite(RT+"img/tiles/manholecover.png");
	sprites['pavement_h'] = new Sprite(RT+"img/tiles/pavement_h.png");
	
	sprites['tile_grass'] = new Sprite(RT+"img/tiles/grass.png");
	sprites['grass_ditch1'] = new Sprite(RT+"img/tiles/grass_ditch1.png");
	sprites['grass_path_v'] = new Sprite(RT+"img/tiles/grass_path_v.png");
	sprites['grass_pavement1'] = new Sprite(RT+"img/tiles/grass_pavement1.png");
	sprites['grass_pavement2'] = new Sprite(RT+"img/tiles/grass_pavement2.png");
	sprites['grass_pavement3'] = new Sprite(RT+"img/tiles/grass_pavement3.png");
	sprites['grass_pavement4'] = new Sprite(RT+"img/tiles/grass_pavement4.png");
	sprites['grass_weeds1'] = new Sprite(RT+"img/tiles/grass_weeds1.png");
	
	sprites['rock01'] = new Sprite(RT+"img/tiles/rock01.png");
	sprites['rock02'] = new Sprite(RT+"img/tiles/rock02.png");
	sprites['rock03'] = new Sprite(RT+"img/tiles/rock03.png");
	sprites['rock04'] = new Sprite(RT+"img/tiles/rock04.png");
	sprites['rock05'] = new Sprite(RT+"img/tiles/rock05.png");
	sprites['rock06'] = new Sprite(RT+"img/tiles/rock06.png");
	
	sprites['house_roof1'] = new Sprite(RT+"img/tiles/house_roof1.png");
	sprites['house_roof_dec1'] = new Sprite(RT+"img/tiles/house_roof_dec1.png");
	sprites['house_wall1'] = new Sprite(RT+"img/tiles/house_wall1.png");
	sprites['house_door1'] = new Sprite(RT+"img/tiles/house_door1.png");
	sprites['house_window1'] = new Sprite(RT+"img/tiles/house_window1.png");
	sprites['house_trapdoor'] = new Sprite(RT+"img/tiles/house_trapdoor.png",{height:32});
	
	sprites['tile_electricbox_small'] = new Sprite(RT+"img/tiles/electricbox_small.png",{offset:new Point(0,16)});
	sprites['stonewall_h'] = new Sprite(RT+"img/tiles/stonewall_h.png",{offset:new Point(0,24)});
	sprites['stonewall_v'] = new Sprite(RT+"img/tiles/stonewall_v.png",{offset:new Point(0,24)});
	sprites['cobblestonewall_h'] = new Sprite(RT+"img/tiles/cobblestonewall_h.png",{offset:new Point(0,24)});
	sprites['cobblestonewall_v'] = new Sprite(RT+"img/tiles/cobblestonewall_v.png",{offset:new Point(0,24)});
	sprites['ivy_small'] = new Sprite(RT+"img/tiles/ivy_small.png");
	sprites['picket_fence_h'] = new Sprite(RT+"img/tiles/picket_fence_h.png",{offset:new Point(24,24)});
	sprites['woodpost1'] = new Sprite(RT+"img/tiles/woodpost1.png",{offset:new Point(3,15)});
	sprites['woodpost2'] = new Sprite(RT+"img/tiles/woodpost2.png",{offset:new Point(3,15)});
	sprites['woodpost3'] = new Sprite(RT+"img/tiles/woodpost3.png",{offset:new Point(3,15)});
	
	sprites['terrace_01'] = new Sprite(RT+"img/tiles/terrace_01.png",{offset:new Point(0,300)});
	sprites['hotspot'] = new Sprite(RT+"img/tiles/manholecover.png",{offset:new Point(16,16)});
	*/
	for( var i in sprites ) {
		sprites[i].name = i;
	}
}

function _randompos(){
	var distance = 300 + ( Math.random() * 400 );
	var angle = Math.random() * 2 * Math.PI;
	
	return new Point( 
		Math.sin( angle ) * distance,
		Math.cos( angle ) * distance
	);
}	