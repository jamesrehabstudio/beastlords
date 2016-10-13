var version = "0.4.2";

function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	NPC.variables = {};
	
	g.pause = false;
	
	g.addObject( new TitleMenu() );
	//g.addObject( new DemoThanks() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		_player.doubleJump = true;
		//_player.dodgeFlash = true;
		_player.grabLedges = true;
		//WorldLocale.loadMap("temple3.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
			_player.stat_points = 4;
			_player.life = _player.lifeMax = 30;
			_player.mana = _player.manaMax = 30;
			//audio.playAs("music_temple4");
			//audio.playAs("music_temple4","music");
		}, 1000);
	},100);
	/**/
}