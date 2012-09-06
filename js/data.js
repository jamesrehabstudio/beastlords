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
	game.addObject( new Zombie(-32,200) );
	game.addObject( new Tree() );
	
	game.collisions.push( new Line( new Point( -14, 0 ), new Point( 14, 0 ) ) );
	game.collisions.push( new Line( new Point( 14, 0 ), new Point( 14, 14 ) ) );
	game.collisions.push( new Line( new Point( 14, 14 ), new Point( -14, 14 ) ) );
	game.collisions.push( new Line( new Point( -14, 14 ), new Point( -14, 0 ) ) );
	
}