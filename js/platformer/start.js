function game_start(g){
	//g.addObject( new TitleMenu() );
	//g.addObject( new DemoThanks() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		_player.doubleJump = true;
		//_player.dodgeFlash = true;
		_player.grabLedges = true;
		WorldLocale.loadMap("temple4.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
			_player.addXP(1600);
			_player.life = _player.lifeMax = 48;
			_player.mana = _player.manaMax = 36;
			audio.playAs("music_temple4");
			//audio.playAs("music_temple4","music");
		}, 1000);
	},100);
	/**/
}