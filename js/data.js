function DataManager() {
	//Main pipeline for level assests
}

DataManager.prototype.getLevel = function( callback, context, name ) {
	$.ajax({
		url: "/save.php",
		type : "GET",
		data : { name : name },
		contentType : "JSON",
		success: callback
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
	sprites['player'] = new Sprite("/img/dude.png", {offset:new Point(12, 28),width:24,height:32});
	sprites['tree_trunk_ash'] = new Sprite("/img/tree_trunk_ash.png", {offset:new Point(14, 145)});
	sprites['tree_brush_ash'] = new Sprite("/img/tree_brush_ash.png", {offset:new Point(26, 16)});
	sprites['health_bar'] = new Sprite("/img/health_bar.png",{offset:new Point(),width:88,height:16});
	sprites['spawner'] = new Sprite("/img/spawner.png",{offset:new Point(20,24),height:48});
	sprites['bullman'] = new Sprite("/img/bullman.png",{offset:new Point(20,32),width:40,height:40});

	sprites['tile_grass'] = new Sprite("/img/tiles/grass.png");
	sprites['tile_road'] = new Sprite("/img/tiles/road_center.png");
	sprites['tile_road_parking_h'] = new Sprite("/img/tiles/road_parking_h.png");
	
	sprites['tile_electricbox_small'] = new Sprite("/img/tiles/electricbox_small.png",{offset:new Point(0,16)});
	sprites['tile_stonewall_h'] = new Sprite("/img/tiles/stonewall_h.png",{offset:new Point(0,24)});
	sprites['tile_stonewall_v'] = new Sprite("/img/tiles/stonewall_v.png",{offset:new Point(0,24)});
	sprites['cobblestonewall_h'] = new Sprite("/img/tiles/cobblestonewall_h.png",{offset:new Point(0,24)});
	sprites['cobblestonewall_v'] = new Sprite("/img/tiles/cobblestonewall_v.png",{offset:new Point(0,24)});
	sprites['manholecover'] = new Sprite("/img/tiles/manholecover.png");
	
	
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