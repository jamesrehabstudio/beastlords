function DataManager() {
	//Main pipeline for level assests
}

DataManager.prototype.getLevel = function( callback, context ) {
	/*
	$.ajax( {
		url : ""
	} );
	*/
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
			game.addObject( new Prop(x*prop_size,y*prop_size, game.sprites.tile_grass) );
		}
	}
	
	for( y = -size; y < size; y++ ){
		temp = new Prop(-168,y*prop_size, game.sprites.tile_road);
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

function _randompos(){
	var distance = 300 + ( Math.random() * 400 );
	var angle = Math.random() * 2 * Math.PI;
	
	return new Point( 
		Math.sin( angle ) * distance,
		Math.cos( angle ) * distance
	);
}	