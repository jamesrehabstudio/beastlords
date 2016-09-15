function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	
	//g.addObject( new TitleMenu() );
	//g.addObject( new DemoThanks() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		_player.doubleJump = true;
		//_player.dodgeFlash = true;
		//_player.grabLedges = true;
		//WorldLocale.loadMap("temple3.tmx");
		WorldLocale.loadMap("test.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
			_player.stat_points = 5;
			_player.life = _player.lifeMax = 42;
			_player.mana = _player.manaMax = 36;
			//audio.playAs("music_temple4");
			//audio.playAs("music_temple4","music");
		}, 1000);
	},100);
	/**/
}