var version = "0.4.3";

function game_start(g){
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	NPC.variables = {};
	
	g.pause = false;
	
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
	//return;
	
	setTimeout(function(){
		new Player(0,0);		
		//_player.lightRadius = true;
		//_player.downstab = true;
		//_player.doubleJump = true;
		//_player.dodgeFlash = true;
		//_player.walljump = true;
		//WorldLocale.loadMap("townhub.tmx");
		//WorldLocale.loadMap("gateway.tmx", "gatetemple2");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			//_player.stat_points = 6;
			//_player.life = _player.lifeMax = 36;
			//_player.mana = _player.manaMax = 36;
			//_player.money = 36000;
			
			//NPC.set("long_sword",1);
			//NPC.set("broad_sword",1);
			//NPC.set("morningstar",1);
			//NPC.set("bloodsickle",1);
			//NPC.set("burningblade",1);
			
			//NPC.set("templeCompleted", 2);
			//_player.spells.push( new SpellFire());
			//_player.spells.push( new SpellSlimeGernade());
			//_player.spells.push( new SpellFlash());
			//_player.spells.push( new SpellHeal());
			//_player.spells.push( new SpellPurify());
			//_player.spells.push( new SpellShield());
			//_player.spells.push( new SpellStrength());
		}, 1000);
	},100);
	/**/
}