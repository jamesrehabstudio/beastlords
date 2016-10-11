window._version = "0.3.1";

function DataManager() {	
	localStorage.setItem("version", window._version);
	load_sprites();
	//this.reset();
}

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
	new Material(g.g, "solid", {"fs":shaders["2d-fragment-solid"],"vs":shaders["2d-vertex-default"]} );
	new Material(g.g, "lightbeam", {"fs":shaders["2d-fragment-lightbeam"],"vs":shaders["2d-vertex-shader"]} );
}

DataManager.prototype.reset = function(){
	if( game instanceof Game ) game.pause = false;
	window._player = undefined;
	window._shop = undefined;
	audio.stop("music");
	
	this.currentTemple = -1;
	this.currentTown = -1;
	this.monsterDifficulty = 0;
	
	this.unlocks = [];
	for(var i=0; i < Item.treasures.length; i++ ) {
		if(Item.treasures[i].unlocked > 0) {
			Item.treasures[i]["remaining"] = Item.treasures[i].pergame;
		} else { 
			Item.treasures[i]["remaining"] = 0;
		}
	}
}
DataManager.prototype.itemGet = function(name){
	/*
	for(var i=0; i < Item.treasures.length; i++){
		if( Item.treasures[i].name == name ) {
			
			if( Item.treasures[i].unlocked == 0 && this.unlocks.indexOf(name) < 0){
				this.unlocks.push( name );
			}
			this.treasures[i].unlocked = 2;
			localStorage.setItem("item_"+name,2);
		}
	}
	*/
}
DataManager.prototype.itemUnlock = function(name){
	/*
	for(var i=0; i < this.treasures.length; i++){
		if( this.treasures[i].name == name ) {
			
			if( this.treasures[i].unlocked == 0 && this.unlocks.indexOf(name) < 0){
				this.unlocks.push( name );
				this.treasures[i].unlocked = 1;
				localStorage.setItem("item_"+name,1);
			}
		}
	}
	*/
}
DataManager.prototype.townFromTag = function(tag){
	for(var i=0; i < _map_town.length; i++){
		if( "tags" in _map_town[i] && _map_town[i].tags.indexOf(tag) >= 0 ){
			return i;
		}
	}
	if( tag != "house") {
		return this.townFromTag("house");
	}
	return -1;
}
DataManager.prototype.randomTown = function(g, town){
	this.currentTemple = -1;
	this.currentTown = town.id;
	this.slices = [];
		
	g.clearAll();
	g.tileSprite = sprites.town;
	
	var pos = 1;
	var rooms = new Array();
	
	rooms.push( this.townFromTag( "exit_w" ) );
	for( i in _world.town.buildings ){
		var building = _world.town.buildings[i];
		if( building.complete ){
			var room_id = this.townFromTag( i );
			if( room_id >= 0 ) {
				var room = _map_town[room_id];
				rooms[pos] = room_id;
				pos += room.width;
			}
		} else if ( building.progress > 0 ) {
			var wip = "wip" + Math.floor(Math.min( building.progress / 10, 2));
			rooms[pos] = this.townFromTag( wip );
			pos += 2;
		}
	}
	rooms[pos] = this.townFromTag( "exit_e" );
	pos++;
	
	g.bounds = g.tileDimension = new Line(0,0,pos*8,15);
	g.tiles = [
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() ),
		new Array( ~~g.tileDimension.area() )
	];
	g.buildCollisions();
	g.addObject(new PauseMenu());
	g.addObject(new Background());
	
	for(var i=0; i < rooms.length; i++){
		if( rooms[i] != undefined && rooms[i] >= 0 ) {
			this.createRoom(g,_map_town[ rooms[i] ], new Point(i*128,0),{"background":false, "room_size":8});
		}
	}
	if( _player instanceof Player ) {
		_player.lock = new Line(0,0,pos*128,240);
		_player.lock_overwrite = false;
		_player.keys = new Array();
//		_player.position.x = 72;
//		_player.position.y = 200;
//		g.addObject(_player);
	}
}

var sprites = {};
var tiles = {};
var audio = {};
var RT = "";

var tileRules = { 
	"big" : {
		9:Tileset.slope_1tohalf,
		10:Tileset.slope_halfto0,
		11:Tileset.slope_1to0,
		12:Tileset.slope_0to1,
		13:Tileset.slope_0tohalf,
		14:Tileset.slope_halfto1,
		41:Tileset.ignore,
		42:Tileset.ignore,
		43:Tileset.ignore,
		44:Tileset.ignore,
		45:Tileset.ignore,
		47:Tileset.ignore,
		
		73:Tileset.slope_1tohalf,
		74:Tileset.slope_halfto0,
		75:Tileset.slope_1to0,
		76:Tileset.slope_0to1,
		77:Tileset.slope_0tohalf,
		78:Tileset.slope_halfto1,
		105:Tileset.ignore,
		106:Tileset.ignore,
		107:Tileset.ignore,
		108:Tileset.ignore,
		109:Tileset.ignore,
		110:Tileset.ignore,
		
		137:Tileset.slope_1tohalf,
		138:Tileset.slope_halfto0,
		139:Tileset.slope_1to0,
		140:Tileset.slope_0to1,
		141:Tileset.slope_0tohalf,
		142:Tileset.slope_halfto1,
		169:Tileset.ignore,
		170:Tileset.ignore,
		171:Tileset.ignore,
		172:Tileset.ignore,
		173:Tileset.ignore,
		174:Tileset.ignore,
		
		201:Tileset.onewayup,
		202:Tileset.onewayup,
		203:Tileset.onewayup,
		204:Tileset.onewayup,
		205:Tileset.onewayup,
		206:Tileset.onewayup,
		233:Tileset.ignore,
		234:Tileset.ignore,
		235:Tileset.ignore,
		236:Tileset.ignore,
		237:Tileset.ignore,
		238:Tileset.ignore,
	},
	"small" : {
		65:Tileset.onewayup,
		66:Tileset.onewayup,
		67:Tileset.onewayup,
		81:Tileset.ignore,
		82:Tileset.ignore,
		83:Tileset.ignore,
		137:Tileset.slope_1tohalf,
		138:Tileset.slope_halfto0,
		139:Tileset.slope_1to0,
		140:Tileset.slope_0to1,
		141:Tileset.slope_0tohalf,
		142:Tileset.slope_halfto1,
		169:Tileset.ignore,
		170:Tileset.ignore,
		171:Tileset.ignore,
		172:Tileset.ignore,
		173:Tileset.ignore,
		174:Tileset.ignore
	},
	"world" : {
		959:Tileset.ignore,
		960:Tileset.edge_right,
		989:Tileset.ceil_1to0,
		990:Tileset.ceil_0to1,
		991:Tileset.edge_left,
		992:Tileset.ignore,
		1021:Tileset.slope_1to0,
		1022:Tileset.slope_0to1
	}
};

function load_sprites (){	
	sprites['bgfirecave'] = new Sprite(RT+"img/background/firecave.png", {offset:new Point(0, 0),width:592,height:416});
	sprites['bgclouds'] = new Sprite(RT+"img/background/clouds.png", {offset:new Point(64, 32),width:128,height:64});
	sprites['bgrain'] = new Sprite(RT+"img/background/bg_rain.png", {offset:new Point(80, 80),width:160,height:160});
	
	sprites['sky_storm1'] = new Sprite(RT+"img/background/sky_storm1.png", {offset:new Point(213, 0),width:427,height:240});
	
	sprites['text'] = new Sprite(RT+"img/text.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['numbers'] = new Sprite(RT+"img/numbers.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['pig'] = new Sprite(RT+"img/pig.gif", {offset:new Point(0, 0),width:32,height:40});
	sprites['title'] = new Sprite(RT+"img/title.gif", {offset:new Point(0, 0),width:427,height:240});
	sprites['loading'] = new Sprite(RT+"img/loading.png", {offset:new Point(120, 120),width:240,height:240});
	sprites['dreams'] = new Sprite(RT+"img/dreams.gif", {offset:new Point(0, 0),width:256,height:16});
	sprites['transform'] = new Sprite(RT+"img/transform.gif", {offset:new Point(16, 17),width:33,height:34});
	
	
	sprites['effect_fire'] = new Sprite(RT+"img/effect_fire.png", {offset:new Point(32, 32),width:64,height:64});	
	
	
	sprites['items'] = new Sprite(RT+"img/items.png", {offset:new Point(8, 8),width:16,height:16});
	sprites['waystones'] = new Sprite(RT+"img/waystones.gif", {offset:new Point(16, 24),width:32,height:48});
	sprites['alter'] = new Sprite(RT+"img/alter.gif", {offset:new Point(32, 128),width:64,height:128});
	sprites['arena'] = new Sprite(RT+"img/arena.gif", {offset:new Point(64, 128),width:128,height:128});
	sprites['shops'] = new Sprite(RT+"img/shops.gif", {offset:new Point(80, 104),width:160,height:128});
	sprites['bookrider'] = new Sprite(RT+"img/bookrider.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['bullets'] = new Sprite(RT+"img/bullets.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['explosion'] = new Sprite(RT+"img/explosion.gif", {offset:new Point(64, 64),width:128,height:128});
	sprites['halo'] = new Sprite(RT+"img/halo.gif", {offset:new Point(120, 120),width:240,height:240});
	sprites['cornerstones'] = new Sprite(RT+"img/cornerstones.gif", {offset:new Point(40, 56),width:96,height:96});
	//sprites['map'] = new Sprite(RT+"img/map.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['map'] = new Sprite(RT+"img/maptiles.gif", {offset:new Point(0, 0),width:8,height:8});
	sprites['doors'] = new Sprite(RT+"img/doors.gif", {offset:new Point(16, 32),width:64,height:64});
	sprites['gate'] = new Sprite(RT+"img/gate.gif", {offset:new Point(16, 24),width:32,height:48});
	
	//sprites['sword1'] = new Sprite(RT+"img/sword1.gif", {offset:new Point(24, 32),width:48,height:48});
	sprites['sword1'] = new Sprite(RT+"img/weapon01.png", {offset:new Point(16, 25),width:40,height:40});
	sprites['sword2'] = new Sprite(RT+"img/sword2.gif", {offset:new Point(17, 24),width:64,height:48});
	sprites['sword3'] = new Sprite(RT+"img/sword3.gif", {offset:new Point(26, 24),width:80,height:48});
	sprites['sword4'] = new Sprite(RT+"img/sword4.gif", {offset:new Point(30, 34),width:80,height:64});
	sprites['magic_effects'] = new Sprite(RT+"img/magic_effects.gif", {offset:new Point(16, 32),width:32,height:48});
	
	sprites['amon'] = new Sprite(RT+"img/amon.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['axedog'] = new Sprite(RT+"img/axedog.gif", {offset:new Point(20, 26),width:40,height:40});
	sprites['axesub'] = new Sprite(RT+"img/axesub.png", {offset:new Point(26, 49),width:64,height:64});
	sprites['baller'] = new Sprite(RT+"img/baller.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['batty'] = new Sprite(RT+"img/batty.gif", {offset:new Point(16, 24),width:32,height:48});
	sprites['beaker'] = new Sprite(RT+"img/beaker.gif", {offset:new Point(12, 16),width:24,height:24});
	sprites['bear'] = new Sprite(RT+"img/bear.png", {offset:new Point(40, 32),width:80,height:48});
	sprites['bigbones'] = new Sprite(RT+"img/bigbones.gif", {offset:new Point(24, 28),width:77,height:56});
	sprites['bookreptile'] = new Sprite(RT+"img/bookreptile.png", {offset:new Point(32, 34),width:64,height:48});
	sprites['bombbowler'] = new Sprite(RT+"img/bombbowler.png", {offset:new Point(40, 50),width:80,height:80});
	sprites['bombjar'] = new Sprite(RT+"img/bombjar.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['cape1'] = new Sprite(RT+"img/cape1.gif", {offset:new Point(24, 24),width:48,height:48});
	sprites['characters'] = new Sprite(RT+"img/characters.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['characters2'] = new Sprite(RT+"img/characters2.gif", {offset:new Point(24, 32),width:48,height:48});
	sprites['checkpoint'] = new Sprite(RT+"img/checkpoint.gif", {offset:new Point(8, 32),width:16,height:64});
	sprites['chaz'] = new Sprite(RT+"img/chaz.gif", {offset:new Point(18, 25),width:48,height:40});
	sprites['biker'] = new Sprite(RT+"img/biker.png", {offset:new Point(40, 52),width:80,height:80});
	sprites['chickenchain'] = new Sprite(RT+"img/chickenchain.png", {offset:new Point(20, 32),width:48,height:48});
	sprites['chickendrill'] = new Sprite(RT+"img/chickendrill.png", {offset:new Point(20, 33),width:56,height:56});
	sprites['cryptkeeper'] = new Sprite(RT+"img/cryptkeeper.png", {offset:new Point(36, 36),width:64,height:64});
	sprites['deckard'] = new Sprite(RT+"img/deckard.png", {offset:new Point(48, 52),width:96,height:80});
	sprites['donkeyknife'] = new Sprite(RT+"img/donkeyknife.png", {offset:new Point(28, 42),width:64,height:64});
	sprites['elevator'] = new Sprite(RT+"img/elevator.gif", {offset:new Point(16, 24),width:32,height:48});
	sprites['flameman'] = new Sprite(RT+"img/flameman.png", {offset:new Point(40, 52),width:80,height:80});
	sprites['flederknife'] = new Sprite(RT+"img/flederknife.gif", {offset:new Point(16, 32),width:48,height:48});
	sprites['frogmonster'] = new Sprite(RT+"img/frogmonster.gif", {offset:new Point(72, 72),width:144,height:144});
	sprites['flyingslime'] = new Sprite(RT+"img/flyingslime.gif", {offset:new Point(24, 24),width:48,height:48});
	sprites['ghoul'] = new Sprite(RT+"img/ghoul.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['ending'] = new Sprite(RT+"img/ending.gif", {offset:new Point(48, 32),width:96,height:64});
	sprites['hammermather'] = new Sprite(RT+"img/hammemathers.gif", {offset:new Point(24, 28),width:56,height:40});
	sprites['igbo'] = new Sprite(RT+"img/igbo.png", {offset:new Point(32, 48),width:64,height:72});
	sprites['knight'] = new Sprite(RT+"img/knight.gif", {offset:new Point(24, 44),width:64,height:64});
	sprites['lamps'] = new Sprite(RT+"img/lamps.gif", {offset:new Point(8, 16),width:16,height:32});
	sprites['laughing'] = new Sprite(RT+"img/laughing.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['lilghost'] = new Sprite(RT+"img/lilghost.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['librarian'] = new Sprite(RT+"img/librarian.png", {offset:new Point(24, 37),width:48,height:64});
	sprites['manonfire'] = new Sprite(RT+"img/manonfire.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['malphas'] = new Sprite(RT+"img/malphas.gif", {offset:new Point(16, 32),width:48,height:48});
	sprites['malsum'] = new Sprite(RT+"img/malsum.png", {offset:new Point(24, 23),width:48,height:32});
	sprites['oriax'] = new Sprite(RT+"img/oriax.gif", {offset:new Point(32, 40),width:64,height:64});
	sprites['phantom'] = new Sprite(RT+"img/phantom.png", {offset:new Point(32, 32),width:64,height:64});
	sprites['phantomgraves'] = new Sprite(RT+"img/phantomgraves.png", {offset:new Point(40, 40),width:80,height:80});
	//sprites['player'] = new Sprite(RT+"img/player.gif", {offset:new Point(24, 32),width:48,height:48});
	sprites['player'] = new Sprite(RT+"img/player.png", {offset:new Point(32, 49),width:64,height:64});
	sprites['playerbath'] = new Sprite(RT+"img/playerbath.png", {offset:new Point(24, 48),width:48,height:48});
	sprites['ratgut'] = new Sprite(RT+"img/ratgut.gif", {offset:new Point(22, 20),width:48,height:32});
	sprites['ring'] = new Sprite(RT+"img/ring.gif", {offset:new Point(120, 120),width:240,height:240});
	sprites['retailers'] = new Sprite(RT+"img/retailers.gif", {offset:new Point(24, 48),width:48,height:64});
	sprites['samrat'] = new Sprite(RT+"img/samrat.png", {offset:new Point(48, 40),width:128,height:64});
	sprites['shell'] = new Sprite(RT+"img/shell.gif", {offset:new Point(8, 8),width:16,height:16});
	sprites['shields'] = new Sprite(RT+"img/shields.png", {offset:new Point(16, 16),width:32,height:32});
	sprites['shooter'] = new Sprite(RT+"img/shooter.gif", {offset:new Point(32, 32),width:64,height:64});
	sprites['shockowl'] = new Sprite(RT+"img/shockowl.png", {offset:new Point(24, 32),width:48,height:48});
	sprites['slime'] = new Sprite(RT+"img/slime.gif", {offset:new Point(16, 16),width:32,height:32});
	sprites['slimerilla'] = new Sprite(RT+"img/slimerilla.gif", {offset:new Point(48, 48),width:96,height:64});
	sprites['slimegrenadier'] = new Sprite(RT+"img/slimegrenadier.gif", {offset:new Point(28, 40),width:64,height:64});
	sprites['slugplatform'] = new Sprite(RT+"img/slugplatform.gif", {offset:new Point(44, 8),width:88,height:48});
	sprites['snake'] = new Sprite(RT+"img/snake.gif", {offset:new Point(24, 24),width:32,height:32});
	sprites['skele'] = new Sprite(RT+"img/skele.gif", {offset:new Point(24, 16),width:48,height:32});
	sprites['spearbe'] = new Sprite(RT+"img/spearbe.png", {offset:new Point(28, 34),width:96,height:56});
	sprites['statues'] = new Sprite(RT+"img/statues.gif", {offset:new Point(32, 56),width:64,height:64});
	sprites['svarog'] = new Sprite(RT+"img/svarog.gif", {offset:new Point(24, 24),width:48,height:48});
	sprites['switch'] = new Sprite(RT+"img/switch.gif", {offset:new Point(0, 4),width:16,height:40});
	sprites['treads'] = new Sprite(RT+"img/treads.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['trees'] = new Sprite(RT+"img/trees.png", {offset:new Point(28, 48),width:56,height:48});
	sprites['owlwizzard'] = new Sprite(RT+"img/owlwizzard.png", {offset:new Point(24, 24),width:48,height:48});
	sprites['yakseyo'] = new Sprite(RT+"img/yakseyo.gif", {offset:new Point(24, 16),width:48,height:32});
	sprites['yeti'] = new Sprite(RT+"img/yeti.gif", {offset:new Point(24, 24),width:48,height:48});
	
	sprites['swordtest'] = new Sprite(RT+"img/sword_test.png", {offset:new Point(15, 56),width:32,height:64});
	sprites['swordeffect'] = new Sprite(RT+"img/swordeffect.png", {offset:new Point(48, 33),width:112,height:48});
	
	sprites['bossface'] = new Sprite(RT+"img/bossface.gif", {offset:new Point(0, 0),width:90,height:120});
	
	sprites['ammit'] = new Sprite(RT+"img/ammit.gif", {offset:new Point(40, 40),width:80,height:64});
	sprites['garmr'] = new Sprite(RT+"img/garmr.png", {offset:new Point(80, 68),width:160,height:136});
	sprites['megaknight'] = new Sprite(RT+"img/megaknight.gif", {offset:new Point(32, 32),width:96,height:64});
	sprites['minotaur'] = new Sprite(RT+"img/minotaur.gif", {offset:new Point(24, 80),width:64,height:80});
	sprites['pigboss'] = new Sprite(RT+"img/pigboss.gif", {offset:new Point(32, 36),width:64,height:64});
	sprites['poseidon'] = new Sprite(RT+"img/poseidon.png", {offset:new Point(84, 88),width:160,height:120});
	sprites['zoder'] = new Sprite(RT+"img/zoder.gif", {offset:new Point(32, 32),width:80,height:64});
	
	sprites['prisoner'] = new Sprite(RT+"img/prisoner.gif", {offset:new Point(16, 24),width:32,height:48});	
	
	sprites['bg7'] = new Sprite(RT+"img/tiles/bg7.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['bg8'] = new Sprite(RT+"img/tiles/bg8.gif", {offset:new Point(0, 0),width:16,height:16});
	
	sprites['detritus1'] = new Sprite(RT+"img/tiles/detritus1.gif", {offset:new Point(16, 24),width:32,height:32});
	sprites['detritus3'] = new Sprite(RT+"img/tiles/detritus3.gif", {offset:new Point(16, 24),width:32,height:32});
	
	sprites['tilesintro'] = new Sprite(RT+"img/tiles/tilesintro.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['town'] = new Sprite(RT+"img/tiles/town.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['world'] = new Sprite(RT+"img/tiles/world.png", {offset:new Point(0, 0),width:16,height:16});
	
	sprites['tiles0'] = new Sprite(RT+"img/tiles/tiles0.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles1'] = new Sprite(RT+"img/tiles/tiles1.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles2'] = new Sprite(RT+"img/tiles/tiles2.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles3'] = new Sprite(RT+"img/tiles/tiles3.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles4'] = new Sprite(RT+"img/tiles/tiles4.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles5'] = new Sprite(RT+"img/tiles/tiles5.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles6'] = new Sprite(RT+"img/tiles/tiles6.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles7'] = new Sprite(RT+"img/tiles/tiles7.gif", {offset:new Point(0, 0),width:16,height:16});
	sprites['tiles_phantom'] = new Sprite(RT+"img/tiles/phantom.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple1'] = new Sprite(RT+"img/tiles/temple1.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple2'] = new Sprite(RT+"img/tiles/temple2.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple3'] = new Sprite(RT+"img/tiles/temple3.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['temple4'] = new Sprite(RT+"img/tiles/temple4.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['cave'] = new Sprite(RT+"img/tiles/cave.png", {offset:new Point(0, 0),width:16,height:16});
	sprites['planes'] = new Sprite(RT+"img/tiles/planes.png", {offset:new Point(0, 0),width:16,height:16});
	
	for( var i in sprites ) {
		sprites[i].name = i;
	}
	
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
	
	tiles["phantom"] = new Tileset(sprites["tiles_phantom"],tileRules["big"], {
		1023 : {"frames":[1024], "speed":0.0}
	});
	tiles["temple1"] = new Tileset(sprites["temple1"],tileRules["big"], {
		321 : {"frames":[321,322,323], "speed":6.0},
		357 : {"frames":[357,357,357,357,357,357,357,357,357,357,358,359,360,361,362], "speed":8.0},
		499 : {"frames":[499,499,499,499,499,499,499,500,501,502,503,504,499,499,499], "speed":8.0}
	});
	tiles["temple2"] = new Tileset(sprites["temple2"],tileRules["big"], {
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
	});
	tiles["temple3"] = new Tileset(sprites["temple3"],tileRules["big"], {
		385 : {"frames":[385,386,387,388,389], "speed":5.0},
		
		195 : {"frames":[195,196,197,197,196,195], "speed":3.0},
		196 : {"frames":[196,197,197,196,195,195], "speed":3.0},
		197 : {"frames":[197,197,196,195,195,196], "speed":3.0},
		
		203 : {"frames":[1024], "speed":0.0},
	});
	tiles["temple4"] = new Tileset(sprites["temple4"],tileRules["big"], {
		1023 : {"frames":[1024], "speed":0.0}
	});
	tiles["cave"] = new Tileset(sprites["cave"],tileRules["big"], {
		321 : {"frames":[321,322,323], "speed":6.0}
	});
	tiles["planes"] = new Tileset(sprites["planes"],tileRules["big"], {
		321 : {"frames":[321,322,323], "speed":4.0},
		322 : {"frames":[322,323,321], "speed":4.0},
		323 : {"frames":[323,321,322], "speed":4.0}
	});
}

window.audio = new AudioPlayer({
	"music_goeson" : {"url":RT+"sounds/music_goeson.mp3", "music":true},
	"music_goodbye" : {"url":RT+"sounds/music_goodbye.mp3", "music":true},
	"music_intro" : {"url":RT+"sounds/music_intro.ogg", "music":true,"loop":0.0},
	"music_temple1" : {"url":RT+"sounds/music_temple1.ogg","music":true,"loop":73.205},
	"music_temple2" : {"url":RT+"sounds/music_temple2.ogg","music":true,"loop":28.822},
	"music_temple3" : {"url":RT+"sounds/music_temple3.ogg","music":true,"loop":0},
	"music_temple4" : {"url":RT+"sounds/music_temple4.ogg","music":true,"loop":32.011},
	"music_town" : {"url":RT+"sounds/music_town.ogg","music":true,"loop":0.0},
	//"music_town" : {"url":RT+"sounds/music_town.mp3","music":true,"loop":0.0},
	"music_sleep" : {"url":RT+"sounds/music_sleep.mp3","music":true},
	"music_world" : {"url":RT+"sounds/music_world.ogg","music":true,"loop":29.5384},
	"fanfair" : {"url":RT+"sounds/fanfair.ogg","music":true},
	
	"barrier" : {"url":RT+"sounds/barrier.wav"},
	"block" : {"url":RT+"sounds/block.wav"},
	"burst1" : {"url":RT+"sounds/burst1.wav"},
	"critical" : {"url":RT+"sounds/critical.wav"},
	"clang" : {"url":RT+"sounds/clang.wav"},
	"charge" : {"url":RT+"sounds/charge.wav"},
	"chargeready" : {"url":RT+"sounds/chargeready.wav"},
	"coin" : {"url":RT+"sounds/coin.wav"},
	"cracking" : {"url":RT+"sounds/cracking.wav"},
	"crash" : {"url":RT+"sounds/crash.wav"},
	"cursor" : {"url":RT+"sounds/cursor.wav"},
	"danger" : {"url":RT+"sounds/danger.wav"},
	"deathwarning" : {"url":RT+"sounds/deathwarning.wav"},
	"equip" : {"url":RT+"sounds/equip.wav"},
	"explode1" : {"url":RT+"sounds/explode1.wav"},
	"explode2" : {"url":RT+"sounds/explode2.wav"},
	"explode3" : {"url":RT+"sounds/explode3.wav"},
	"explode4" : {"url":RT+"sounds/explode4.wav"},
	"gulp" : {"url":RT+"sounds/gulp.wav"},
	"heal" : {"url":RT+"sounds/heal.wav"},
	"hurt" : {"url":RT+"sounds/hurt.wav"},
	"item1" : {"url":RT+"sounds/item1.wav"},
	"jump" : {"url":RT+"sounds/jump.wav"},
	"key" : {"url":RT+"sounds/key.wav"},
	"kill" : {"url":RT+"sounds/kill.wav"},
	"land" : {"url":RT+"sounds/land.wav"},
	"levelup" : {"url":RT+"sounds/levelup.wav"},
	"levelup2" : {"url":RT+"sounds/levelup2.wav"},
	"negative" : {"url":RT+"sounds/negative.wav"},
	"lift" : {"url":RT+"sounds/lift.wav"},
	"open" : {"url":RT+"sounds/open.wav"},
	"pause" : {"url":RT+"sounds/pause.wav"},
	"pickup1" : {"url":RT+"sounds/pickup1.wav"},
	"playerhurt" : {"url":RT+"sounds/playerhurt.wav"},
	"playerdeath" : {"url":RT+"sounds/playerdeath.wav"},
	"powerup" : {"url":RT+"sounds/powerup.wav"},
	"quest" : {"url":RT+"sounds/quest.wav"},
	"slash" : {"url":RT+"sounds/slash.wav"},
	"spell" : {"url":RT+"sounds/spell.wav"},
	"swing" : {"url":RT+"sounds/swing.wav"},
	"switch" : {"url":RT+"sounds/switch.wav"},
	"text01" : {"url":RT+"sounds/text01.wav"},
	"tink" : {"url":RT+"sounds/tink.wav"},
	"unpause" : {"url":RT+"sounds/unpause.wav"},
});
