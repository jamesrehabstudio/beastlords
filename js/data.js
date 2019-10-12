function game_start(g){
	var shaders = window.shaders;
	
	new Material(g.g, "default", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-default"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "tiles", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-tile"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "hurt", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-default"],"settings":{"u_color":[0.8,0.1,0.0,1.0]}} );
	new Material(g.g, "gold", {"fs":shaders["fragment-greytocolor"],"vs":shaders["2d-vertex-default"], "settings":{"u_color":[1.0,0.9,0.2,1.0]}} );
	new Material(g.g, "color", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "heat", {"fs":shaders["fragment-heat"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "blur", {"fs":shaders["2d-fragment-blur"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "enchanted", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-default"], "settings":{"u_color":[1.0,0.0,0.3,1.0]}} );
	new Material(g.g, "item", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "halo", {"fs":shaders["2d-fragment-redasalpha"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "fire", {"fs":shaders["fragment-fire"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "water", {"fs":shaders["fragment-water"],"vs":shaders["2d-vertex-default"]} );
	
	new Material(g.g, "t1", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-default"], "settings":{"u_shift":[0.1]}} );
	new Material(g.g, "t2", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-default"], "settings":{"u_shift":[-0.1]}} );
	new Material(g.g, "t3", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-default"], "settings":{"u_shift":[0.2]}} );
	new Material(g.g, "t4", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-default"], "settings":{"u_shift":[0.3]}} );
	new Material(g.g, "t5", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-default"], "settings":{"u_shift":[0.5]}} );
	
	new Material(g.g, "backbuffer", {"fs":shaders["2d-fragment-shader"],"vs":shaders["back-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	window["shader_crt"] = new Material(g.g, "backbuffercrt", {"fs":shaders["fragment-crt"],"vs":shaders["back-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "backbuffercolorblind", {"fs":shaders["fragment-highcontrast"],"vs":shaders["back-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "backbuffernes", {"fs":shaders["fragment-palletswap"],"vs":shaders["back-vertex-shader"], "settings":{"u_colorgrid":"nescolors", "u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "backbuffergb", {"fs":shaders["fragment-palletswap"],"vs":shaders["back-vertex-shader"], "settings":{"u_colorgrid":"dotmatcolors", "u_color":[1.0,1.0,1.0,1.0]}} );
	
	new Material(g.g, "solid", {"fs":shaders["2d-fragment-solid"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "lightbeam", {"fs":shaders["2d-fragment-lightbeam"],"vs":shaders["2d-vertex-shader"]} );
	
	load_sprites();
}

var sprites = {};
var meshes = {};
var tiles = {};
var audio = {};
var RT = "";

function load_sprites (){	
	meshes['slash1'] = new Mesh(RT+"mesh/slash1.json", {"fs":"fragment-sword"});
	meshes['slash2'] = new Mesh(RT+"mesh/slash2.json", {"fs":"fragment-sword"});
	meshes['slash3'] = new Mesh(RT+"mesh/slash3.json", {"fs":"fragment-sword"});
	meshes['slashd'] = new Mesh(RT+"mesh/slashd.json", {"fs":"fragment-sword"});
	meshes['slashu'] = new Mesh(RT+"mesh/slashu.json", {"fs":"fragment-sword"});
	meshes['slashc'] = new Mesh(RT+"mesh/slashc.json", {"fs":"fragment-sword"});
	
	meshes['garmr_head'] = new Mesh(RT+"mesh/garmr_head.json", {"image":"garmr_texture"});
	meshes['garmr_headscream'] = new Mesh(RT+"mesh/garmr_headscream.json", {"image":"garmr_texture"});
	meshes['garmr_chest'] = new Mesh(RT+"mesh/garmr_chest.json", {"image":"garmr_texture"});
	meshes['garmr_body'] = new Mesh(RT+"mesh/garmr_body.json", {"image":"garmr_texture"});
	meshes['garmr_armupper'] = new Mesh(RT+"mesh/garmr_armupper.json", {"image":"garmr_texture"});
	meshes['garmr_armlower'] = new Mesh(RT+"mesh/garmr_armlower.json", {"image":"garmr_texture"});
	sprites['garmr_texture'] = new Sprite(RT+"img/garmr_texture.png", {offset:new Point(0, 0), width:256,height:256});
	
	meshes['regcube'] = new Mesh(RT+"mesh/regcube.json", {"image":"regcube_tx"});
	sprites['regcube_tx'] = new Sprite(RT+"img/regcube.png", {offset:new Point(0, 0), width:64,height:64});
	
	sprites['bgfirepit01'] = new Sprite(RT+"img/background/firepit01.png", {offset:new Point(0, 0),width:256,height:96});
	sprites['bgfirepit02'] = new Sprite(RT+"img/background/firepit02.png", {offset:new Point(0, 0),width:256,height:256});
	
	sprites['bgfirecave'] = new Sprite(RT+"img/background/firecave.png", {offset:new Point(0, 0),width:592,height:416});
	sprites['bgclouds'] = new Sprite(RT+"img/background/clouds.png", {offset:new Point(64, 32),width:128,height:64});
	sprites['bgrain'] = new Sprite(RT+"img/background/bg_rain.png", {offset:new Point(80, 80),width:160,height:160});
	sprites['bgpipes'] = new Sprite(RT+"img/background/pipes.png", {offset:new Point(0, 0),width:240,height:240});
	
	sprites['sky_storm1'] = new Sprite(RT+"img/background/sky_storm1.png", {offset:new Point(213, 0),width:427,height:240});
	
	sprites['text'] = new Sprite(RT+"img/text.png", {offset:new Point(0, 0),width:8,height:8,alwaysloaded:true});
	sprites['numbers'] = new Sprite(RT+"img/numbers.png", {offset:new Point(0, 0),width:8,height:8});
	sprites['pig'] = new Sprite(RT+"img/pig.png", {offset:new Point(0, 0),width:32,height:40});
	sprites['title'] = new Sprite(RT+"img/title.png", {offset:new Point(0, 0),width:427,height:240});
	sprites['loading'] = new Sprite(RT+"img/loading.png", {offset:new Point(120, 120),width:240,height:240});
	sprites['dreams'] = new Sprite(RT+"img/dreams.png", {offset:new Point(0, 0),width:256,height:16});
	
	sprites['nescolors'] = new Sprite(RT+"img/nescolors.png", {offset:new Point(0, 0),width:64,height:64,alwaysloaded:true});
	sprites['dotmatcolors'] = new Sprite(RT+"img/dotmatcolors.png", {offset:new Point(0, 0),width:64,height:64,alwaysloaded:true});
	
	
	sprites['effect_block'] = new Sprite(RT+"img/effect_block.png", {offset:new Point(0, 40),width:32,height:64,fs:"fragment-sparks"});
	sprites['effect_fire'] = new Sprite(RT+"img/effect_fire.png", {offset:new Point(32, 32),width:64,height:64,fs:"fragment-fire"});
	sprites['effect_hurt'] = new Sprite(RT+"img/effect_hurt.png", {offset:new Point(0, 16),width:80,height:32,fs:"fragment-sparks"});
	
	sprites['player'] = new Sprite(RT+"img/player.png", {
		offset:new Point(32, 49),
		width:64,
		height:64,
		custom_offset: {
			"0_6" : new Point(0,21), "1_6" : new Point(0,21), "2_6" : new Point(0,21), "3_6" : new Point(0,50), "4_6" : new Point(0,18)
		},
		alwaysloaded:true,
	});
	
	
	sprites['test_temple4'] = new Sprite(RT+"maps/temple4.png", {offset:new Point(0, 0),width:4096,height:1800});
	sprites['demo_tut'] = new Sprite(RT+"img/demo_tut.png", {offset:new Point(32, 32),width:64,height:64});
	
	
	sprites['items'] = new Sprite(RT+"img/items.png", {offset:new Point(8, 8),width:16,height:16, alwaysloaded:true});
	sprites['items_glow'] = new Sprite(RT+"img/items.png", {offset:new Point(8, 8),width:16,height:16,"fs":"2d-fragment-glow"});
	sprites['waystones'] = new Sprite(RT+"img/waystones.png", {offset:new Point(16, 24),width:32,height:48});
	sprites['alter'] = new Sprite(RT+"img/alter.png", {offset:new Point(32, 128),width:64,height:128});
	sprites['arena'] = new Sprite(RT+"img/arena.png", {offset:new Point(64, 128),width:128,height:128});
	sprites['shops'] = new Sprite(RT+"img/shops.png", {offset:new Point(88, 104),width:176,height:128});
	sprites['bookrider'] = new Sprite(RT+"img/bookrider.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['bullets'] = new Sprite(RT+"img/bullets.png", {offset:new Point(16, 16),width:32,height:32,alwaysloaded:true});
	sprites['explosion'] = new Sprite(RT+"img/explosion.png", {offset:new Point(64, 64),width:128,height:128});
	sprites['halo'] = new Sprite(RT+"img/halo.png", {offset:new Point(120, 120),width:240,height:240});
	sprites['lighthalo'] = new Sprite(RT+"img/halo.png", {offset:new Point(120, 120),width:240,height:240,mixtype:Material.MIX_ADDITIVE});
	sprites['haloarea'] = new Sprite(RT+"img/haloarea.png", {offset:new Point(0, 0),width:256,height:256,"fs":"fragment-lightarea",mixtype:Material.MIX_ADDITIVE,alwaysloaded:true});
	sprites['cornerstones'] = new Sprite(RT+"img/cornerstones.png", {offset:new Point(48, 48),width:96,height:96});
	//sprites['map'] = new Sprite(RT+"img/map.png", {offset:new Point(0, 0),width:8,height:8});
	//sprites['map'] = new Sprite(RT+"img/maptiles.png", {offset:new Point(0, 0),width:8,height:8});
	sprites['map'] = new Sprite(RT+"img/tiles/maptiles2.png", {offset:new Point(0, 0),width:8,height:8, alwaysloaded:true});
	sprites['map_large'] = new Sprite(RT+"img/tiles/map_large.png", {offset:new Point(0, 0),width:8,height:8});
	sprites['map_small'] = new Sprite(RT+"img/tiles/map_small.png", {offset:new Point(0, 0),width:4,height:4});
	sprites['mapicons'] = new Sprite(RT+"img/mapicons.png", {offset:new Point(0, 0),width:8,height:8});
	sprites['doors'] = new Sprite(RT+"img/doors.png", {offset:new Point(16, 32),width:64,height:64});
	sprites['gate'] = new Sprite(RT+"img/gate.png", {offset:new Point(16, 24),width:32,height:48});
	
	//sprites['sword1'] = new Sprite(RT+"img/sword1.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['sword1'] = new Sprite(RT+"img/weapon01.png", {offset:new Point(16, 25),width:40,height:40});
	sprites['sword2'] = new Sprite(RT+"img/sword2.png", {offset:new Point(17, 24),width:64,height:48});
	sprites['sword3'] = new Sprite(RT+"img/sword3.png", {offset:new Point(26, 24),width:80,height:48});
	sprites['sword4'] = new Sprite(RT+"img/sword4.png", {offset:new Point(30, 34),width:80,height:64});
	sprites['magic_effects'] = new Sprite(RT+"img/magic_effects.png", {offset:new Point(16, 32),width:32,height:48});
	
	sprites['amon'] = new Sprite(RT+"img/amon.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['attrib_icons'] = new Sprite(RT+"img/attrib_icons.png", {offset:new Point(0, 0),width:32,height:32,alwaysloaded:true});
	sprites['axedog'] = new Sprite(RT+"img/axedog.png", {offset:new Point(32, 33),width:64,height:48});
	sprites['axesub'] = new Sprite(RT+"img/axesub.png", {offset:new Point(26, 49),width:64,height:64});
	sprites['baller'] = new Sprite(RT+"img/baller.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['batty'] = new Sprite(RT+"img/batty.png", {offset:new Point(16, 24),width:32,height:48});
	sprites['beaker'] = new Sprite(RT+"img/beaker.png", {offset:new Point(12, 16),width:24,height:24});
	sprites['bear'] = new Sprite(RT+"img/bear.png", {offset:new Point(40, 32),width:80,height:48});
	sprites['bigbones'] = new Sprite(RT+"img/bigbones.png", {offset:new Point(24, 28),width:77,height:56});
	sprites['boarbow'] = new Sprite(RT+"img/boarbow.png", {offset:new Point(28, 32),width:64,height:48});
	sprites['bombbowler'] = new Sprite(RT+"img/bombbowler.png", {offset:new Point(40, 50),width:80,height:80});
	sprites['bombjar'] = new Sprite(RT+"img/bombjar.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['bonethrower'] = new Sprite(RT+"img/bonethrower.png", {offset:new Point(24, 40),width:64,height:64});
	sprites['bonetrap'] = new Sprite(RT+"img/bonehands.png", {offset:new Point(40, 16),width:80,height:24});
	sprites['booksummoner'] = new Sprite(RT+"img/booksummoner.png", {offset:new Point(32, 48),width:64,height:64});
	sprites['bookreptile'] = new Sprite(RT+"img/bookreptile.png", {offset:new Point(32, 34),width:64,height:48});
	sprites['botomire'] = new Sprite(RT+"img/botomire.png", {offset:new Point(40, 32),width:80,height:64});
	sprites['cape1'] = new Sprite(RT+"img/cape1.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['characters'] = new Sprite(RT+"img/characters.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['characters2'] = new Sprite(RT+"img/characters2.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['chainface'] = new Sprite(RT+"img/chainface.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['chaz'] = new Sprite(RT+"img/chaz.png", {offset:new Point(18, 25),width:48,height:40});
	sprites['checkpoint'] = new Sprite(RT+"img/checkpoint.png", {offset:new Point(8, 32),width:16,height:64});
	sprites['chests'] = new Sprite(RT+"img/chests.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['biker'] = new Sprite(RT+"img/bikerrhino.png", {offset:new Point(40, 68),width:80,height:80});
	sprites['armwrestle'] = new Sprite(RT+"img/biker.png", {offset:new Point(40, 52),width:80,height:80});
	sprites['chickenchain'] = new Sprite(RT+"img/chickenchain.png", {offset:new Point(20, 32),width:48,height:48});
	sprites['chickendrill'] = new Sprite(RT+"img/chickendrill.png", {offset:new Point(20, 33),width:56,height:56});
	sprites['circle256'] = new Sprite(RT+"img/circle256.png", {offset:new Point(128, 128),width:256,height:256,alwaysloaded:true});
	sprites['cryptkeeper'] = new Sprite(RT+"img/cryptkeeper.png", {offset:new Point(36, 36),width:64,height:64});
	sprites['crowd01'] = new Sprite(RT+"img/crowd01.png", {offset:new Point(64, 24),width:128,height:48});
	sprites['deckard'] = new Sprite(RT+"img/deckard.png", {offset:new Point(48, 52),width:96,height:80});
	sprites['derring'] = new Sprite(RT+"img/derring.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['donkeyknife'] = new Sprite(RT+"img/donkeyknife.png", {offset:new Point(28, 42),width:64,height:64});
	sprites['drill'] = new Sprite(RT+"img/drill.png", {offset:new Point(15, 56),width:32,height:64});
	sprites['drillerkiller'] = new Sprite(RT+"img/drillerkiller.png", {offset:new Point(32, 72),width:96,height:96});
	sprites['drillorb'] = new Sprite(RT+"img/drillorb.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['gatekeeper'] = new Sprite(RT+"img/gatekeeper.png", {offset:new Point(48, 47),width:96,height:64});
	sprites['gradient_add'] = new Sprite(RT+"img/gradient.png", {offset:new Point(0, 0),width:48,height:48,mixtype:Material.MIX_ADDITIVE,alwaysloaded:true});
	sprites['gear1'] = new Sprite(RT+"img/gear1.png", {offset:new Point(0, 0),width:16,height:64});
	sprites['electrolizard'] = new Sprite(RT+"img/electrolizard.png", {offset:new Point(48, 64),width:160,height:96});
	sprites['elevator'] = new Sprite(RT+"img/elevator.png", {offset:new Point(16, 24),width:32,height:48});
	sprites['flameman'] = new Sprite(RT+"img/flameman.png", {offset:new Point(40, 52),width:80,height:80});
	sprites['flameslime'] = new Sprite(RT+"img/flameslime.png", {offset:new Point(32, 52),width:64,height:64});
	sprites['flederknife'] = new Sprite(RT+"img/flederknife.png", {offset:new Point(16, 32),width:48,height:48});
	sprites['firebird'] = new Sprite(RT+"img/firebird.png", {offset:new Point(32, 48),width:64,height:64});
	sprites['frogchef'] = new Sprite(RT+"img/frogchef.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['frogmonster'] = new Sprite(RT+"img/frogmonster.png", {offset:new Point(72, 72),width:144,height:144});
	sprites['flyingslime'] = new Sprite(RT+"img/flyingslime.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['fly'] = new Sprite(RT+"img/fly.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['ghoul'] = new Sprite(RT+"img/ghoul.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['ending'] = new Sprite(RT+"img/ending.png", {offset:new Point(48, 32),width:96,height:64});
	sprites['hammermather'] = new Sprite(RT+"img/hammemathers.png", {offset:new Point(24, 28),width:56,height:40});
	sprites['hammerman'] = new Sprite(RT+"img/hammerman.png", {offset:new Point(40, 32),width:80,height:48});
	sprites['hooksailor'] = new Sprite(RT+"img/hooksailor.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['igbo'] = new Sprite(RT+"img/igbo.png", {offset:new Point(38, 44),width:96,height:64});
	sprites['knight'] = new Sprite(RT+"img/knight.png", {offset:new Point(32, 44),width:96,height:64});
	sprites['knior'] = new Sprite(RT+"img/knior.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['lamps'] = new Sprite(RT+"img/lamps.png", {offset:new Point(8, 16),width:16,height:32});
	sprites['landingpage'] = new Sprite(RT+"img/landingpage.png", {offset:new Point(0, 0),width:215,height:120});
	sprites['laughing'] = new Sprite(RT+"img/laughing.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['lava'] = new Sprite(RT+"img/lava.png", {offset:new Point(0, 0),width:64,height:64,fs:"fragment-lavapool"});
	sprites['ooze'] = new Sprite(RT+"img/ooze.png", {offset:new Point(0, 0),width:256,height:256,fs:"fragment-ooze"});
	//sprites['ooze'] = new Sprite(RT+"img/ooze.png", {offset:new Point(0, 0),width:256,height:256});
	sprites['lavafalls'] = new Sprite(RT+"img/lavafalls.png", {offset:new Point(0, 112),width:32,height:112,fs:"fragment-lava"});
	sprites['lavasnake'] = new Sprite(RT+"img/lavasnake.png", {offset:new Point(56, 32),width:80,height:80});
	sprites['lilghost'] = new Sprite(RT+"img/lilghost.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['librarian'] = new Sprite(RT+"img/librarian.png", {offset:new Point(24, 37),width:48,height:64});
	sprites['manonfire'] = new Sprite(RT+"img/manonfire.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['malphas'] = new Sprite(RT+"img/malphas.png", {offset:new Point(16, 32),width:48,height:48});
	sprites['malsum'] = new Sprite(RT+"img/malsum.png", {offset:new Point(24, 23),width:48,height:32});
	sprites['mech'] = new Sprite(RT+"img/mech.png", {offset:new Point(56, 72),width:112,height:144});
	sprites['moleminer'] = new Sprite(RT+"img/moleminer.png", {offset:new Point(24, 20),width:48,height:32});
	sprites['monsterlock'] = new Sprite(RT+"img/monsterlock.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['npc_smith'] = new Sprite(RT+"img/npc_smith.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['nolt'] = new Sprite(RT+"img/nolt.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['oriax'] = new Sprite(RT+"img/oriax.png", {offset:new Point(32, 40),width:64,height:64});
	sprites['phantom_ghost'] = new Sprite(RT+"img/phantom.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['phantomgraves'] = new Sprite(RT+"img/phantomgraves.png", {offset:new Point(40, 40),width:80,height:80});
	//sprites['player'] = new Sprite(RT+"img/player.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['pigbot'] = new Sprite(RT+"img/pigbot.png", {offset:new Point(136,88),width:224,height:176});
	sprites['pigbossnude'] = new Sprite(RT+"img/pigbossnude.png", {offset:new Point(48, 68),width:96,height:96});
	sprites['pitmonster'] = new Sprite(RT+"img/pitmonster.png", {offset:new Point(48, 32),width:96,height:80});
	sprites['playerbath'] = new Sprite(RT+"img/playerbath.png", {offset:new Point(24, 48),width:48,height:48});
	sprites['polate'] = new Sprite(RT+"img/polate.png", {offset:new Point(68, 40),width:136,height:64});
	
	sprites['policebox'] = new Sprite(RT+"img/policebox.png", {offset:new Point(52, 32),width:112,height:64});
	sprites['policeman'] = new Sprite(RT+"img/policeman.png", {offset:new Point(24, 34),width:48,height:64});
	
	sprites['portholeman'] = new Sprite(RT+"img/portholeman.png", {offset:new Point(16, 24),width:48,height:48});
	sprites['pothead'] = new Sprite(RT+"img/pothead.png", {offset:new Point(24, 34),width:48,height:48});
	sprites['priest'] = new Sprite(RT+"img/priest.png", {offset:new Point(24, 32),width:48,height:64});
	sprites['pubs'] = new Sprite(RT+"img/pubs.png", {offset:new Point(120, 80),width:272,height:96});
	sprites['raindrops'] = new Sprite(RT+"img/raindrops.png", {offset:new Point(8, 16),width:16,height:16});
	sprites['ratgut'] = new Sprite(RT+"img/ratgut.png", {offset:new Point(22, 20),width:48,height:32});
	sprites['referee'] = new Sprite(RT+"img/referee.png", {offset:new Point(32, 32),width:64,height:48});
	sprites['ring'] = new Sprite(RT+"img/ring.png", {offset:new Point(120, 120),width:240,height:240,mixtype:Material.MIX_ADDITIVE});
	sprites['riveteer'] = new Sprite(RT+"img/riveteer.png", {offset:new Point(24, 31),width:48,height:48});
	sprites['retailers'] = new Sprite(RT+"img/retailers.png", {offset:new Point(24, 48),width:48,height:64});
	sprites['rhinowrestler'] = new Sprite(RT+"img/rhinowrestler.png", {offset:new Point(56, 96),width:128,height:128});
	sprites['sailorsaturn'] = new Sprite(RT+"img/sailorsaturn.png", {offset:new Point(32, 48),width:64,height:64});
	sprites['sailorsmasher'] = new Sprite(RT+"img/sailorsmasher.png", {offset:new Point(40, 52),width:80,height:80});
	sprites['samrat'] = new Sprite(RT+"img/samrat.png", {offset:new Point(32, 49),width:64,height:64});
	sprites['shell'] = new Sprite(RT+"img/shell.png", {offset:new Point(8, 8),width:16,height:16});
	sprites['shields'] = new Sprite(RT+"img/shields.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['shieldslots'] = new Sprite(RT+"img/shieldslots.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['shooter'] = new Sprite(RT+"img/shooter.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['shockcrawler'] = new Sprite(RT+"img/shockcrawler.png", {offset:new Point(16, 24),width:32,height:32});
	sprites['shockowl'] = new Sprite(RT+"img/shockowl.png", {offset:new Point(32, 48),width:64,height:64});
	sprites['shrine'] = new Sprite(RT+"img/shrine.png", {offset:new Point(32, 16),width:64,height:32});
	sprites['slashes01'] = new Sprite(RT+"img/slashes01.png", {offset:new Point(8, 32),width:64,height:64});
	sprites['slime'] = new Sprite(RT+"img/slime.png", {offset:new Point(16, 32),width:32,height:48});
	sprites['slimerilla'] = new Sprite(RT+"img/slimerilla.png", {offset:new Point(48, 48),width:96,height:64});
	sprites['slimegrenadier'] = new Sprite(RT+"img/slimegrenadier.png", {offset:new Point(28, 40),width:64,height:64});
	sprites['slugplatform'] = new Sprite(RT+"img/slugplatform.png", {offset:new Point(44, 8),width:88,height:48});
	sprites['snake'] = new Sprite(RT+"img/snake.png", {offset:new Point(24, 24),width:32,height:32});
	sprites['skele'] = new Sprite(RT+"img/skele.png", {offset:new Point(24, 48),width:64,height:64});
	sprites['spell_ice'] = new Sprite(RT+"img/spell_ice.png", {offset:new Point(8, 48),width:16,height:64});
	sprites['spearbe'] = new Sprite(RT+"img/spearbe.png", {offset:new Point(40, 58),width:80,height:80});
	sprites['spikebug'] = new Sprite(RT+"img/spikebug.png", {offset:new Point(16, 24),width:32,height:32});
	sprites['spikewall'] = new Sprite(RT+"img/spikewall.png", {offset:new Point(32, 0),width:64,height:16});
	sprites['spinning_twinblades'] = new Sprite(RT+"img/spinning_twinblades.png", {offset:new Point(34, 24),width:64,height:16});
	sprites['spook1'] = new Sprite(RT+"img/spook1.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['statues'] = new Sprite(RT+"img/statues.png", {offset:new Point(32, 56),width:64,height:64});
	sprites['statue_player'] = new Sprite(RT+"img/statue_player.png", {offset:new Point(32, 48),width:64,height:96});
	sprites['svarog'] = new Sprite(RT+"img/svarog.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['swapchurch'] = new Sprite(RT+"img/swapchurch.png", {offset:new Point(196, 112),width:232,height:176});
	sprites['switch'] = new Sprite(RT+"img/switch.png", {offset:new Point(0, 4),width:16,height:40});
	sprites['switch_pressure'] = new Sprite(RT+"img/switch_pressure.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['thunderlizard'] = new Sprite(RT+"img/thunderlizard.png", {offset:new Point(64, 100),width:160,height:128});
	sprites['treads'] = new Sprite(RT+"img/treads.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['trees'] = new Sprite(RT+"img/trees.png", {offset:new Point(28, 48),width:56,height:48});
	sprites['owlwizzard'] = new Sprite(RT+"img/owlwizzard.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['walker'] = new Sprite(RT+"img/walker.png", {offset:new Point(32, 52),width:64,height:64});
	sprites['warbus'] = new Sprite(RT+"img/warbus.png", {offset:new Point(32, 32),width:64,height:48});
	sprites['wip'] = new Sprite(RT+"img/wip.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['whips'] = new Sprite(RT+"img/whips.png", {offset:new Point(46,32),width:160,height:48});
	sprites['worldmap'] = new Sprite(RT+"img/worldmap.png", {offset:new Point(0, 0),width:208,height:208});
	sprites['white'] = new Sprite(RT+"img/white.png", {offset:new Point(0, 0),width:1,height:1,alwaysloaded:true});
	sprites['whiteline'] = new Sprite(RT+"img/white.png", {offset:new Point(0, 0.5),width:1,height:1,alwaysloaded:true});
	sprites['white_add'] = new Sprite(RT+"img/white.png", {offset:new Point(0, 0),width:1,height:1,mixtype:Material.MIX_ADDITIVE});
	sprites['yakseyo'] = new Sprite(RT+"img/yakseyo.png", {offset:new Point(24, 16),width:48,height:32});
	sprites['yeti'] = new Sprite(RT+"img/yeti.png", {offset:new Point(24, 24),width:48,height:48});
	
	sprites['cutscene_intro'] = new Sprite(RT+"img/cutscene_intro.png", {offset:new Point(128, 72),width:256,height:144});
	sprites['cutscene_wedding_guests'] = new Sprite(RT+"img/cutscene_wedding_guests.png", {offset:new Point(128, 64),width:256,height:128});
	sprites['cutscene_wedding'] = new Sprite(RT+"img/cutscene_wedding.png", {offset:new Point(128, 72),width:256,height:144});
	sprites['cutscene_pigintro'] = new Sprite(RT+"img/cutscene_pigintro.png", {offset:new Point(128, 72),width:256,height:144});
	sprites['cutscene_wrestler'] = new Sprite(RT+"img/cutscene_wrestler.png", {offset:new Point(128, 72),width:256,height:144});
	sprites['cutscene_punchout'] = new Sprite(RT+"img/cutscene_punchout.png", {offset:new Point(40, 40),width:80,height:80});
	
	sprites['swordtest'] = new Sprite(RT+"img/sword_test.png", {offset:new Point(15, 56),width:32,height:64,alwaysloaded:true});
	sprites['swordeffect'] = new Sprite(RT+"img/swordeffect.png", {offset:new Point(48, 49),width:112,height:64});
	sprites['swordeffectv'] = new Sprite(RT+"img/swordeffectv.png", {offset:new Point(32, 49),width:64,height:112});
	
	sprites['bossface'] = new Sprite(RT+"img/bossface.png", {offset:new Point(0, 0),width:90,height:120});
	
	sprites['ammit'] = new Sprite(RT+"img/ammit.png", {offset:new Point(40, 56),width:96,height:80});
	sprites['garmr'] = new Sprite(RT+"img/garmr.png", {offset:new Point(64, 72),width:144,height:144});
	sprites['garmr_large'] = new Sprite(RT+"img/garmr_large.png", {offset:new Point(56, 61),width:112,height:80});
	sprites['garmr_small'] = new Sprite(RT+"img/garmr_small.png", {offset:new Point(24, 38),width:80,height:48});
	sprites['megaknight'] = new Sprite(RT+"img/megaknight.png", {offset:new Point(56, 40),width:160,height:72});
	sprites['minotaur'] = new Sprite(RT+"img/minotaur.png", {offset:new Point(24, 80),width:64,height:80});
	sprites['pigbossknight'] = new Sprite(RT+"img/pigbossknight.png", {offset:new Point(32, 44),width:64,height:88});
	sprites['pigboss'] = new Sprite(RT+"img/pigboss.png", {offset:new Point(32, 36),width:64,height:64});
	sprites['poseidon'] = new Sprite(RT+"img/poseidon.png", {offset:new Point(84, 88),width:160,height:120});
	sprites['zoder'] = new Sprite(RT+"img/zoder.png", {offset:new Point(32, 32),width:80,height:64});
	
	sprites['prisoner'] = new Sprite(RT+"img/prisoner.png", {offset:new Point(16, 24),width:32,height:48});	
	sprites['spellmaster'] = new Sprite(RT+"img/spellmaster.png", {offset:new Point(24, 32),width:48,height:48});	
	
	sprites['bg7'] = new Sprite(RT+"img/tiles/bg7.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['bg8'] = new Sprite(RT+"img/tiles/bg8.png", {offset:new Point(0, 0),width:16,height:16});
	
	sprites['detritus1'] = new Sprite(RT+"img/tiles/detritus1.png", {offset:new Point(16, 24),width:32,height:32});
	sprites['detritus3'] = new Sprite(RT+"img/tiles/detritus3.png", {offset:new Point(16, 24),width:32,height:32});
	
	sprites['tilesintro'] = new Sprite(RT+"img/tiles/tilesintro.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['town'] = new Sprite(RT+"img/tiles/town.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['world'] = new Sprite(RT+"img/tiles/world.png", {offset:new Point(0, 0),width:16,height:16});
	
	sprites['tiles0'] = new Sprite(RT+"img/tiles/tiles0.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles1'] = new Sprite(RT+"img/tiles/tiles1.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles2'] = new Sprite(RT+"img/tiles/tiles2.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles3'] = new Sprite(RT+"img/tiles/tiles3.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles4'] = new Sprite(RT+"img/tiles/tiles4.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles5'] = new Sprite(RT+"img/tiles/tiles5.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles6'] = new Sprite(RT+"img/tiles/tiles6.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles7'] = new Sprite(RT+"img/tiles/tiles7.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['gateway'] = new Sprite(RT+"img/tiles/gateway.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['phantom'] = new Sprite(RT+"img/tiles/phantom.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple1'] = new Sprite(RT+"img/tiles/temple1.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple2'] = new Sprite(RT+"img/tiles/temple2.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple3'] = new Sprite(RT+"img/tiles/temple3.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple4'] = new Sprite(RT+"img/tiles/temple4.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple5'] = new Sprite(RT+"img/tiles/temple5.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['firepits'] = new Sprite(RT+"img/tiles/firepits.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['pit'] = new Sprite(RT+"img/tiles/pit.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['lighthouse'] = new Sprite(RT+"img/tiles/lighthouse.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['templeice'] = new Sprite(RT+"img/tiles/templeice.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['cave'] = new Sprite(RT+"img/tiles/cave.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['planes'] = new Sprite(RT+"img/tiles/planes.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['town'] = new Sprite(RT+"img/tiles/town.png", {offset:new Point(0, 0),width:16,height:16});
	
	tiles['testtile'] = new Tilesheet(RT+"img/tiles/temple4.png");
	
	for( var i in sprites ) {
		sprites[i].name = i;
	}
	
	/*
	tiles["tilesintro"] = new Tileset(sprites["tilesintro"],tileRules["small"]);
	tiles["town"] = new Tileset(sprites["town"],tileRules["small"]); tiles["town"].blank = 16;
	
	tiles["tiles0"] = new Tileset(sprites["tiles0"],tileRules["small"]);
	tiles["tiles1"] = new Tileset(sprites["tiles1"],tileRules["small"]);
	tiles["tiles2"] = new Tileset(sprites["tiles2"],tileRules["small"]);
	tiles["tiles3"] = new Tileset(sprites["tiles3"],tileRules["small"]);
	tiles["tiles4"] = new Tileset(sprites["tiles4"],tileRules["small"]);
	tiles["tiles5"] = new Tileset(sprites["tiles5"],tileRules["small"]);
	tiles["tiles6"] = new Tileset(sprites["tiles6"],tileRules["small"]);
	tiles["tiles7"] = new Tileset(sprites["tiles7"],tileRules["small"]);
	
	
	tiles["world"] = new Tileset(sprites["world"],tileRules["world"],{
		66 : {"frames":[66,67,68,68,67,66], "speed":5.0},
		//Make the following collision tiles invisible
		959 : {"frames":[1024], "speed":0.0},
		960 : {"frames":[1024], "speed":0.0},
		989 : {"frames":[1024], "speed":0.0},
		990 : {"frames":[1024], "speed":0.0},
		991 : {"frames":[1024], "speed":0.0},
		992 : {"frames":[1024], "speed":0.0},
		1021 : {"frames":[1024], "speed":0.0},
		1022 : {"frames":[1024], "speed":0.0},
		1023 : {"frames":[1024], "speed":0.0}
	});
	*/
	
	tiles["gateway"] = new Tilesheet(RT+"img/tiles/gateway.png", {
		"animations" : {
			1023 : {"frames":[1024], "speed":0.0}
		}
	});
	tiles["phantom"] = new Tilesheet(RT+"img/tiles/phantom.png", {
		"animations" : {
			1023 : {"frames":[1024], "speed":0.0}
		}
	});
	tiles["temple1"] = new Tilesheet(RT+"img/tiles/temple1.png", {
		"animations" : {
			357 : {"frames":[357,357,357,357,357,357,357,357,357,357,358,359,360,361,362], "speed":8.0},
			499 : {"frames":[499,499,499,499,499,499,499,500,501,502,503,504,499,499,499], "speed":8.0},
			1023 : {"frames":[1024], "speed":0.0}
		}
	});
	tiles["temple2"] = new Tilesheet(RT+"img/tiles/temple2.png", {		
		"animations" : {
			201 : {"frames":[1024], "speed":0.0},
			577 : {"frames":[1024], "speed":0.0},
			
			275 : {"frames":[275,277,279], "speed":9.0},
			276 : {"frames":[276,278,280], "speed":9.0},
			307 : {"frames":[307,309,311], "speed":9.0},
			308 : {"frames":[308,310,312], "speed":9.0},
			//slime flow
			326 : {"frames":[326,327,328], "speed":9.0},
			327 : {"frames":[326,327,328], "speed":6.0},
			328 : {"frames":[326,327,328], "speed":3.0},
			
			358 : {"frames":[358,359,360], "speed":18.0},
			390 : {"frames":[390,391,392], "speed":9.0},
			422 : {"frames":[422,423,424], "speed":9.0}
		}
	});
	tiles["temple3"] = new Tilesheet(RT+"img/tiles/temple3.png", {
		"animations" : {
			385 : {"frames":[385,386,387,388,389], "speed":5.0},
			
			195 : {"frames":[195,196,197,197,196,195], "speed":3.0},
			196 : {"frames":[196,197,197,196,195,195], "speed":3.0},
			197 : {"frames":[197,197,196,195,195,196], "speed":3.0},
			
			203 : {"frames":[1024], "speed":0.0},
			1023 : {"frames":[1024], "speed":0.0},
		}
	});
	tiles["temple4"] = new Tilesheet(RT+"img/tiles/temple4.png", {
		"animations" : {
			//204 : {"frames":[1024], "speed":0.0},
			1023 : {"frames":[1024], "speed":0.0}
		}
	});	
	tiles["firepits"] = new Tilesheet(RT+"img/tiles/firepits.png", {
		"animations" : {}
	});
	tiles["town"] = new Tilesheet(RT+"img/tiles/town.png", {
		"animations" : {
			201 : {"frames":[1024], "speed":0.0},
			15 : {"frames":[15,79,143,143,79,15], "speed":5.0},
			16 : {"frames":[16,80,144,144,80,16], "speed":5.0},
			17 : {"frames":[17,81,145,145,81,17], "speed":5.0},
			47 : {"frames":[47,111,175,175,111,47], "speed":5.0},
			48 : {"frames":[48,112,176,176,112,48], "speed":5.0},
			49 : {"frames":[49,113,177,177,113,49], "speed":5.0},
			
			321 : {"frames":[321,322,323], "speed":5.0},
			1023 : {"frames":[1024], "speed":0.0}
		}
	});
	tiles["pit"] = new Tilesheet(RT+"img/tiles/pit.png", {
		"animations" : {}
	});
	
	/*
	tiles["temple5"] = new Tileset(sprites["temple5"],tileRules["big"], {
	});
	tiles["cave"] = new Tileset(sprites["cave"],tileRules["big"], {
		321 : {"frames":[321,322,323], "speed":6.0}
	});
	tiles["planes"] = new Tileset(sprites["planes"],tileRules["big"], {
		321 : {"frames":[321,322,323], "speed":4.0},
		322 : {"frames":[322,323,321], "speed":4.0},
		323 : {"frames":[323,321,322], "speed":4.0}
	});
	
	tiles["lighthouse"] = new Tileset(sprites["lighthouse"],tileRules["big"], {
	});
	tiles["templeice"] = new Tileset(sprites["templeice"],tileRules["big"], {
		21 : {"frames":[21,24,27], "speed":8.0},
		22 : {"frames":[22,25,28], "speed":8.0},
		23 : {"frames":[23,26,29], "speed":8.0},
		53 : {"frames":[53,56,59], "speed":8.0},
		54 : {"frames":[54,57,60], "speed":8.0},
		55 : {"frames":[55,58,61], "speed":8.0},
		85 : {"frames":[85,88,91], "speed":8.0},
		86 : {"frames":[86,89,92], "speed":8.0},
		87 : {"frames":[87,90,93], "speed":8.0},
		
		204 : {"frames":[1024], "speed":0.0},
		1023 : {"frames":[1024], "speed":0.0}
	});
	*/
}


AudioPlayer.getList({
	"music_goeson" : {"url":RT+"sounds/music_goeson.mp3", "music":true},
	"music_goodbye" : {"url":RT+"sounds/music_goodbye.mp3", "music":true},
	"music_intro" : {"url":RT+"sounds/music_intro.ogg", "music":true,"loop":0.0},
	"music_gateway" : {"url":RT+"sounds/music_gateway.ogg","music":true,"loop":1.826},
	"music_temple1" : {"url":RT+"sounds/music_temple1.ogg","music":true,"loop":73.205},
	"music_temple2" : {"url":RT+"sounds/music_temple2.ogg","music":true,"loop":28.822},
	"music_temple3" : {"url":RT+"sounds/music_temple3.ogg","music":true,"loop":0},
	"music_temple4" : {"url":RT+"sounds/music_temple4.ogg","music":true,"loop":32.011},
	"music_boss01" : {"url":RT+"sounds/music_boss01.ogg","music":true,"loop":13.430},
	"music_town" : {"url":RT+"sounds/music_town.ogg","music":true,"loop":0.0},
	"music_firepits" : {"url":RT+"sounds/music_firepits.ogg","music":true,"loop":4.596},
	"music_fridge" : {"url":RT+"sounds/music_fridge.ogg","music":true,"loop":0.0},
	"music_sky_01" : {"url":RT+"sounds/music_sky_01.mp3","music":true,"loop":0.0},
	//"music_town" : {"url":RT+"sounds/music_town.mp3","music":true,"loop":0.0},
	"music_sleep" : {"url":RT+"sounds/music_sleep.mp3","music":true},
	"music_world" : {"url":RT+"sounds/music_world.ogg","music":true,"loop":29.5384},
	"fanfair" : {"url":RT+"sounds/fanfair.ogg","music":true},
	
	"barrier" : {"url":RT+"sounds/barrier.wav"},
	"block" : {"url":RT+"sounds/block.wav"},
	"bounce1" : {"url":RT+"sounds/bounce1.wav"},
	"bullet1" : {"url":RT+"sounds/bullet1.wav"},
	"burn" : {"url":RT+"sounds/burn.wav"},
	"burst1" : {"url":RT+"sounds/burst1.wav"},
	"critical" : {"url":RT+"sounds/critical.wav"},
	"clang" : {"url":RT+"sounds/clang.wav"},
	"charge" : {"url":RT+"sounds/charge.wav"},
	"chargeready" : {"url":RT+"sounds/chargeready.wav"},
	"coin" : {"url":RT+"sounds/coin.wav"},
	"cracking" : {"url":RT+"sounds/cracking.wav"},
	"crash" : {"url":RT+"sounds/crash.wav"},
	"cursor" : {"url":RT+"sounds/cursor.wav",alwaysloaded:true},
	"danger" : {"url":RT+"sounds/danger.wav"},
	"dash" : {"url":RT+"sounds/dash.wav"},
	"deathwarning" : {"url":RT+"sounds/deathwarning.wav"},
	"engine1" : {"url":RT+"sounds/engine1.wav"},
	"engine_sputter1" : {"url":RT+"sounds/engine_sputter1.wav"},
	"equip" : {"url":RT+"sounds/equip.wav"},
	"explode1" : {"url":RT+"sounds/explode1.wav"},
	"explode2" : {"url":RT+"sounds/explode2.wav"},
	"explode3" : {"url":RT+"sounds/explode3.wav"},
	"explode4" : {"url":RT+"sounds/explode4.wav"},
	"gasstart" : {"url":RT+"sounds/gasstart.wav"},
	"gulp" : {"url":RT+"sounds/gulp.wav"},
	"hardland" : {"url":RT+"sounds/hardland.wav"},
	"heal" : {"url":RT+"sounds/heal.wav"},
	"hurt" : {"url":RT+"sounds/hurt.wav"},
	"item1" : {"url":RT+"sounds/item1.wav"},
	"jump" : {"url":RT+"sounds/jump.wav"},
	"key" : {"url":RT+"sounds/key.wav"},
	"kill" : {"url":RT+"sounds/kill.wav"},
	"land" : {"url":RT+"sounds/land.wav"},
	"levelup" : {"url":RT+"sounds/levelup.wav"},
	"levelup2" : {"url":RT+"sounds/levelup2.wav"},
	"lightning1" : {"url":RT+"sounds/lightning1.wav"},
	"negative" : {"url":RT+"sounds/negative.wav"},
	"lift" : {"url":RT+"sounds/lift.wav"},
	"open" : {"url":RT+"sounds/open.wav"},
	"pause" : {"url":RT+"sounds/pause.wav",alwaysloaded:true},
	"pickup1" : {"url":RT+"sounds/pickup1.wav"},
	"playerhurt" : {"url":RT+"sounds/playerhurt.wav"},
	"playerdeath" : {"url":RT+"sounds/playerdeath.wav"},
	"powerup" : {"url":RT+"sounds/powerup.wav"},
	"quest" : {"url":RT+"sounds/quest.wav"},
	"shieldraise" : {"url":RT+"sounds/shieldraise.wav"},
	"slash" : {"url":RT+"sounds/slash.wav"},
	"splat1" : {"url":RT+"sounds/splat1.wav"},
	"spell" : {"url":RT+"sounds/spell.wav"},
	"swing" : {"url":RT+"sounds/swing.wav"},
	"swing2" : {"url":RT+"sounds/swing2.wav"},
	"switch" : {"url":RT+"sounds/switch.wav"},
	"text01" : {"url":RT+"sounds/text01.wav"},
	"tink" : {"url":RT+"sounds/tink.wav"},
	"unpause" : {"url":RT+"sounds/unpause.wav",alwaysloaded:true},
	"whiplock" : {"url":RT+"sounds/whiplock.wav"},
});
