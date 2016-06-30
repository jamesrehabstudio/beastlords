function game_start(g){
	//g.addObject( new TitleMenu() );
	//g.addObject( new DemoThanks() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		WorldLocale.loadMap("temple3.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
		}, 1000);
	},100);
	/**/
}