function game_start(g){
	//g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
	
	
	setTimeout(function(){
		new Player(0,0);
		WorldLocale.loadMap("temple1.tmx");
		setTimeout(function(){
			game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 480;
		}, 1000);
	},100);
	/**/
}