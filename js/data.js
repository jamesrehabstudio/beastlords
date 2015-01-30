function DataManager() {
	//Main pipeline for level assests
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
	sprites['knight'] = new Sprite(RT+"img/knight.gif", {offset:new Point(14, 16),width:32,height:32});/*
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