var version = "0.4.3";

function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	NPC.variables = {};
	
	g.pause = false;
	
	//g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);
		//_player.doubleJump = true;
		//_player.dodgeFlash = true;
		//_player.grabLedges = true;
		WorldLocale.loadMap("townhub.tmx");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			_player.lightRadius = 240;
			//_player.stat_points = 6;
			//_player.life = _player.lifeMax = 36;
			//_player.mana = _player.manaMax = 36;
			
			//NPC.set("long_sword",1);
			//NPC.set("broad_sword",1);
			//NPC.set("morningstar",1);
			//NPC.set("bloodsickle",1);
			//NPC.set("burningblade",1);
			
			//NPC.set("templeCompleted", 2);
			//_player.spells.push( new Item(0,0,0,{"name":"spell_fire"}));
			//_player.spells.push( new Item(0,0,0,{"name":"spell_flash"}));
			//_player.spells.push( new Item(0,0,0,{"name":"spell_heal"});
			//audio.playAs("music_temple4");
			//audio.playAs("music_temple4","music");
		}, 1000);
	},100);
	/**/
}