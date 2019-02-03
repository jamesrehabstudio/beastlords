var version = "0.5.6";
var sessionId = generateId();
var debug = false;

function game_start(g){
	
	/*
	let go = new GameObject(0,0);
	go.time = 0.0;
	go.render = function(g,c){
		this.time = (this.time + this.delta) % 28;
		cutscenes["intro"].render(g,new Point, this.time );
	}
	g.addObject(go);
	return;
	*/
	
	DemoThanks.deaths = 0;
	DemoThanks.kills = 0;
	DemoThanks.items = 0;
	DemoThanks.time = 0;
	NPC.variables = {};
	
	g.notrack = true;
	g.pause = false;
	
	g.addObject( new TitleMenu() );
	//return;


	setTimeout(function(){
		
		//return;
		
		new Player(0,0);		
		_player.lightRadius = true;
		_player.downstab = true;
		//_player.doubleJump = true;
		//_player.walljump = true;
		//_player.dodgeFlash = true;
		//WorldLocale.loadMap("gateway.tmx");
		WorldLocale.loadMap("demo.tmx", "test");
		setTimeout(function(){
			//game.getObject(Background).preset = Background.presets.cavefire;
			//_player.stat_points = 6;
			//_player.life = _player.lifeMax = 36;
			//_player.mana = _player.manaMax = 36;
			//_player.money = 36000;
			
			
			//NPC.set("whip",1);
			//NPC.set("king_sword",1);
			//NPC.set("autodrill",1);
			
			//NPC.set("baseball_bat",1);
			//NPC.set("broad_sword",1);
			//NPC.set("morningstar",1);
			//NPC.set("bloodsickle",1);
			//NPC.set("burningblade",1);
			//NPC.set("twin_blades",1);
			
			
			
			//NPC.set("templeCompleted", 2);
			//_player.spells.push( new SpellIce());
			//_player.spells.push( new SpellBolt());
			//_player.spells.push( new SpellFire());
			//_player.spells.push( new SpellSlimeGernade());
			//_player.spells.push( new SpellFlash());
			//_player.spells.push( new SpellHeal());
			//_player.spells.push( new SpellPurify());
			//_player.spells.push( new SpellShield());
			//_player.spells.push( new SpellStrength());
			//_player.addXP(24024);
			
		}, 1000);
	},100);

}