Quests = {
	"set" : function(id,value){
		if(typeof value == "string" && value.toLowerCase() == "complete"){
			value = Quests.COMPLETED;
		}
		if(id in Quests){
			Quests[id] = value;
			try{
				//Send quest message
				var qmessage = "";
				
				if(value == Quests.COMPLETED){
					qmessage = i18n("questcomplete");
				}else{
					qmessage = i18n("quest")[id][value];
				}
				
				var pm = game.getObject(PauseMenu);
				pm.message(qmessage);
				audio.play("quest");
			} catch (err){}
		}
	},
	"list": function(){
		var i = 0;
		var out = new Array();
		while("q"+i in Quests){
			var id = "q"+i;
			var q = Quests[id];
			if(q > 0){
				var text = i18n("quest")[id];
				out.push({
					"name" : text[0],
					"description" : (q < text.length ? text[q] : ""),
					"complete" : q >= Quests.COMPLETED,
					"progress" : q
				});
			}
			i++;
		}
		out.sort(function(a,b){
			if(a.complete) return 1;
			if(b.complete) return -1;
			return a.progress - b.progress;
		});
		return out;
	},
	"COMPLETED" : 9999,
	"q0" : 0,
	"q1" : 0
}

WorldMap.prototype = new GameObject();
WorldMap.prototype.constructor = GameObject;
function WorldMap(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.life = 1;
	this.item = false;
	this.zIndex = 999;
	this.speed = 2.5;
	this.seed = "" + Math.random();
	//this.seed = "0.3662224621511996";
	this.active = true;
	this.mode = 0;
	
	this.dreams = 0;
	this.lastDream = 0;
	this.checkpoint = 0;
	
	window._world = this;
	new Player(0,0);
	
	this.camera = new Point();
	this.player_start = new Point(16*56,16*26);
	this.player = new Point(this.player_start.x,this.player_start.y);
	this.rest = 0;
	
	this.width = 112;
	this.height = 64;
	
	this.quests = {
		"q0" : 0,
		"q1" : 0
	}
	
	this.temples = [];
	for(var i=0; i<6; i++) this.temples.push({ "number":i, "complete":false, "position":new Point(), "seed":i+this.seed });
	this.temples[0].position.x = 47*16; this.temples[0].position.y = 22*16;
	this.temples[1].position.x = 16*16; this.temples[1].position.y = 20*16;
	this.temples[2].position.x = 31*16; this.temples[2].position.y = 14*16;
	this.temples[3].position.x = 59*16; this.temples[3].position.y = 18*16;
	this.temples[4].position.x = 27*16; this.temples[4].position.y = 38*16;
	this.temples[5].position.x = 84*16; this.temples[5].position.y = 59*16; 
	//this.temples[6].position.x = 52*16; this.temples[6].position.y = 1*16; this.temples[6].complete = true;
	//this.temples[7].position.x = 30*16; this.temples[7].position.y = 14*16; this.temples[7].complete = true;
	//this.temples[8].position.x = 66*16; this.temples[8].position.y = 36*16; this.temples[8].complete = true;
	
	this.towns = [];
	this.playerIcon = null;
	
	for(var i=0; i<1; i++) this.towns.push({ "id":i, "nation":Math.floor(Math.random()*3), "faith":Math.floor(Math.random()*3), "capital":false, "position":new Point(), "size":Math.floor(1+Math.random()*3), "seed":i+this.seed });
	this.towns[0].position.x = 36*16; this.towns[0].position.y = 27*16; this.towns[0].name = "Aghalee"; size = 1;
	
	this.locations = [
		{"position":new Point(61*16,59*16), "map":3}
	]
	
	this.town = {
		"people" : 5,
		"money" : 0,
		"science" : 0,
		"buildings" : {
			"hall" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : true },
			"mine" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"lab" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"hunter" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"mill" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"library" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false },
			"inn" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : false },
			"farm" : { "progress" : 1, "people" : 0, "unlocked" : true, "complete" : true },
			"smith" : { "progress" : 0, "people" : 0, "unlocked" : true, "complete" : false },
			"bank" : { "progress" : 0, "people" : 0, "unlocked" : false, "complete" : false }
		}
	};
	this.loadTown();
	
	this.animation = 0;
	
	this.on("activate", function(){
		audio.playAs("music_world", "music");
		this.active = true;
		//game.addObject( this );
		
		/* Save instance of current temple */
		if( dataManager.currentTemple >= 0 && dataManager.currentTemple < this.temples.length ) {
			var shops = [];
			for(var i=0; i < WorldMap.Shops.length; i++) shops = shops.concat( game.getObjects(window[WorldMap.Shops[i]]) );
			var instance = {
				"keys" : _player.keys,
				"items" : game.getObjects(Item),
				"map" : game.getObject(PauseMenu).map_reveal,
				"shops" : shops
			};
			this.temples[dataManager.currentTemple].instance = instance;
		}
		
		this.showMap();
		game.pause = false;
	});
	
	this.on("reset", function(){
		if( this.mode == 0 ) {
			var keys = _player.keys;
			_player.life = _player.lifeMax;
			_player.mana = _player.manaMax;
			_player.position.x = 128;
			_player.position.y = 200;
			_player._death_clock = Number.MAX_VALUE;
			_player.interactive = true;
			_player.lock_overwrite = false;
			game.addObject(_player);
			_player.keys = keys;
			audio.playAs(audio.alias["music"],"music");
			try{ 
				game.pause = false;
				game.getObject(PauseMenu).open = false; 
			} catch(err){}
		} else {
			game.clearAll();
			this.seed = this.seed = "" + Math.random();
			for(var i=0; i < this.temples.length; i++ ) {
				this.temples[i].complete = false;
				this.temples[i].seed = i+this.seed;
				delete this.temples[i].instance;
			}
			this.player = new Point(this.player_start.x,this.player_start.y);
			
			var im = new ItemMenu(dataManager.unlocks);
			im.on("destroy", function(){
				new Player(0,0);
				_world.trigger("activate");
			});
			game.addObject(im);
			
			dataManager.reset();
		}
	});
}
WorldMap.prototype.buildtiles = function(){
	game.tiles = [
		new Array(window._map_world.front.data.length),
		window._map_world.back.data,
		window._map_world.front.data,
	];
	if( this.checkpoint >= 2 ){
		this.appendTiles(window._map_world.road0,1);
	}
	if( this.checkpoint >= 5 ){
		this.appendTiles(window._map_world.road1,1);
	}
	if( this.checkpoint >= 3 ){
		this.appendTiles(window._map_world.island0,1);
		this.appendTiles(window._map_world.island0front,2);
	}
	if( this.checkpoint >= 4 ){
		this.appendTiles(window._map_world.island1,1);
		this.appendTiles(window._map_world.island1front,2);
	}
}
WorldMap.prototype.appendTiles = function(layer,index){	
	for(var i=0; i < layer.data.length; i++){
		var x = layer.xoff + Math.floor(i%layer.width);
		var y = layer.yoff + Math.floor(i/layer.width);
		var j = x + y * this.width;
		if( layer.data[i] > 0 ){
			game.tiles[index][j] = layer.data[i];
			if (layer.data[i] == 143){
				game.tiles[index][j] = 0;
			}
		}
	}
}

WorldMap.prototype.showMap = function(){
	game.clearAll();
	game.addObject(this);
	this.buildtiles();
	game.tileDimension = new Line(0,0,this.width,this.height);
	game.bounds = new Line(0,0,this.width*16,this.height*16);
	game.tileSprite = sprites.world;
	
	game.addObject(new WorldPlayer(this.player.x, this.player.y));
	
	for(var i=0; i<window._map_world.objects.length; i++){
		var objdata = window._map_world.objects[i];
		var obj = new window[objdata[2]](objdata[0], objdata[1],"none",objdata[3]);
		game.addObject(obj);
	}
	/*
	for(var i=0; i<this.towns.length; i++){
		var wl = new WorldLocale(this.towns[i].position.x, this.towns[i].position.y,"town");
		wl.index = i; wl.frame = 2 + this.towns[i].size; wl.frame_row = 7;
		game.addObject(wl);
	}
	for(var i=0; i<this.locations.length; i++){
		var wl = new WorldLocale(this.locations[i].position.x, this.locations[i].position.y,"map");
		wl.index = this.locations[i].map; wl.visible = false;
		game.addObject(wl);
	}
	
	
	for(var i=0; i<50; i++){
		game.addObject(new WorldEncounter(Math.random()*16*this.width, Math.random()*16*this.height));
	}*/
}
WorldMap.prototype.encounter = function(){
	if(!this.active) return;
	
	this.active = false;
	var pl = game.getObject(WorldPlayer);
	this.player.x = pl.position.x;
	this.player.y = pl.position.y;
	
	var temple = dataManager.temples[ Math.floor(Math.random() * 3) ];
	dataManager.currentTemple = Math.floor(Math.random() * 2);
	
	game.clearAll();
	game.tiles = [ new Array(96*15), new Array(95*15) ];
	game.tileDimension = new Line(0,0,96,15);
	game.bounds = new Line(0,0,96*16,15*16);
	game.tileSprite = sprites.town;
	for(var x=0; x < 96; x++) for(var y=0; y<15;y++){
		var i = x + 96*y;
		if( y==0) game.tiles[1][i] = window.BLANK_TILE;
		if( y==13) game.tiles[1][i] = 177 + (x%8);
		if( y>13) game.tiles[1][i] = 193 + (x%8);
	}
	_player.position.x = 768;
	_player.position.y = 192;
	
	background = new Background(0,0);
	background.walls = false;
	game.addObject(background);
	
	game.addObject(_player);
	game.addObject(new Exit(8,120));
	game.addObject(new Exit(1528,120));
	game.addObject(new PauseMenu());
	_player.lock = game.bounds;
	_player.lock_overwrite = false;
	
	for(var x=32; x < 96*16; x+=64){
		if( Math.random() < 0.4 && Math.abs(x-768) > 80 ) {
			var monster;
			if( Math.random() < 0.3 ) {
				monster = temple.majormonster[Math.floor(Math.random()*temple.majormonster.length)];
			} else {
				monster = temple.minormonster[Math.floor(Math.random()*temple.minormonster.length)];
			}
			game.addObject(new window[monster](x, 180));
		}		
	}
	dataManager.currentTemple = -1;
	audio.playAs("music_temple1", "music");
}
	
WorldMap.prototype.update = function(){
	this.animation += this.delta * 0.1;
	this.rest -= this.delta;
}
WorldMap.prototype.enterLocale = function(locale, dir){
	if( !this.active ) return;
	if( this.rest > 0 ){
		this.rest = Game.DELTASECOND * 0.25;
		return;
	}
	var type = locale.type;
	var i = locale.index;
	var avatar = window.game.getObject(WorldPlayer);
	
	if( type == "boat" ){
		objs = window.game.getObjects(WorldLocale);
		for(var i=0; i<objs.length;i++){
			if(objs[i].type=="boat" && objs[i].index==locale.gotoIndex){
				avatar.position.x = objs[i].position.x;
				avatar.position.y = objs[i].position.y;
			}
		}
		this.rest = Game.DELTASECOND * 0.25;
	} else if( type == "temple" && !this.temples[i].complete ){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		dataManager.randomLevel(game, i, this.temples[i].seed);
		var rt = new RandomTemple(i);
		rt.generate(this.temples[i].seed);
		rt.use(window.game);
		
		audio.playAs("music_temple1", "music");
	} else if(type == "town"){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		HomeVillage.create(game);
		
		audio.playAs("music_town", "music");
	} else if(type == "map"){
		this.active = false;
		this.player.x = locale.position.x;
		this.player.y = locale.position.y;
		this.rest = Game.DELTASECOND * 0.25;
		
		//Load new map
		MapLoader.loadMap(
			locale.index,
			mergeLists(locale.properties,{"direction":dir})
		);
		audio.playAs("music_town", "music");
	}
}
WorldMap.prototype.passable = function(x,y){
	var block_list = [0,37,38,39,40,64,65,66,67,68,69,87,88,103,104];
	var index = Math.floor(x/16) + Math.floor((y/16)*this.width);
	var t = this.tiles[0][index]-1;
	var r = this.tiles[1][index];
	return block_list.indexOf( t ) < 0 && r == 0;
}
WorldMap.prototype.idle = function(){}

WorldMap.prototype.saveTown = function(){
	localStorage.setItem("town_people", this.town.people);
	localStorage.setItem("town_money", this.town.money);
	localStorage.setItem("town_science", this.town.science);
	for( var i in this.town.buildings ) {
		var building = this.town.buildings[i];
		localStorage.setItem("town_building_"+i+"_complete", building.complete);
		localStorage.setItem("town_building_"+i+"_people", building.people);
		localStorage.setItem("town_building_"+i+"_progress", building.progress);
		localStorage.setItem("town_building_"+i+"_unlocked", building.unlocked);
	}
}

WorldMap.prototype.loadTown = function(){
	if( localStorage.hasOwnProperty("town_people") ) {
		
		this.town.people = localStorage.getItem("town_people")-0;
		this.town.money = localStorage.getItem("town_money")-0;
		this.town.science = localStorage.getItem("town_science")-0;
		
		for( var i in this.town.buildings ) {
			if( localStorage.hasOwnProperty("town_building_"+i+"_complete") ) {
				var building = this.town.buildings[i];
				building.complete = localStorage.getItem("town_building_"+i+"_complete") == "true";
				building.people = localStorage.getItem("town_building_"+i+"_people")-0;
				building.progress = localStorage.getItem("town_building_"+i+"_progress")-0;
				building.unlocked = localStorage.getItem("town_building_"+i+"_unlocked")  == "true";
			}
		}
	}
}

WorldMap.prototype.worldTick = function(){
	//Generate money
	this.town.money += 10;
	if( this.town.buildings.mine.complete ) {
		this.town.money += this.town.buildings.mine.people * 10;
	}
	
	//Increase scene
	var freePeople = this.town.people;
	var moneyNeeded = 0;
	for(var i in this.town.buildings){
		freePeople -= this.town.buildings[i].people;
		moneyNeeded += this.town.buildings[i].people * 20;
	}
	this.town.science += freePeople;
	
	var productionFactor = Math.min(this.town.money / moneyNeeded, 1.0);
	this.town.money = Math.max(this.town.money - moneyNeeded, 0);
	
	//Increase population
	this.town.people += Math.floor( 
		productionFactor*this.town.buildings.farm.people * 0.5 
	);
	
	//Increase production
	for(var i in this.town.buildings){
		var building = this.town.buildings[i];
		var production = productionFactor * building.people * 3;
		building.progress += Math.floor( production );
		
		if( !building.complete && building.progress > 30 ) {
			this.town.buildings[i].complete = true;
			this.town.buildings[i].people = 0;
		}
	}
	
	this.saveTown();
}

WorldMap.Shops = [
	"Alter",
	"Arena",
	"Prisoner",
	"Shop",
	"WaystoneChest"
];

WorldPlayer.prototype = new GameObject();
WorldPlayer.prototype.constructor = GameObject;
function WorldPlayer(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	//this.origin = new Point(0.2,0.2);
	
	this.height = this.width = 12;
	this.sprite = sprites.world;
	this.speed = 0.5;
	this.zIndex = 2;
	
	this.addModule(mod_rigidbody);
	this.gravity = 0;
	this.friction = 0;
	
	this.frame = 9;
	this.frame_row = 7;
}
WorldPlayer.prototype.idle = function(){}
WorldPlayer.prototype.update = function(){
	
	this.force = this.force.scale( 1.0 - (0.2*this.delta) );
	if( true ){
		if( input.state("up") > 0 ) { this.force.y -= this.speed * this.delta; }
		if( input.state("down") > 0 ){ this.force.y += this.speed * this.delta; }
		if( input.state("left") > 0 ) { this.force.x -= this.speed * this.delta; }
		if( input.state("right") > 0 ) { this.force.x += this.speed * this.delta; }
	}
	
	var camx = game.resolution.x * 0.5;
	game.camera.x = Math.max( Math.min( this.position.x - camx, (game.tileDimension.end.x)*16-256), 0);
	game.camera.y = Math.max( Math.min( this.position.y - 120, (game.tileDimension.end.y)*16-240), 0);
}

WorldLocale.prototype = new GameObject();
WorldLocale.prototype.constructor = GameObject;
function WorldLocale(x,y,type,properties){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-.5,-.5);
	this.type = type;
	this.index = 0;
	this.active = true;
	
	this.height = this.width = 8;
	this.sprite = sprites.world;
	
	this.frame = 3;
	this.frame_row = 5;
	
	properties = properties || {};
	this.properties = properties;
	
	if("var_checkpoint" in properties){
		if(properties["var_checkpoint"]*1 > window._world.checkpoint){
			this.active = false;
			this.visible = false;
		}
	}
	if("map" in properties){
		this.type = "map";
		this.index = properties["map"];
		this.visible = false;
	}
	if("boat" in properties){
		this.type = "boat";
		this.index = properties["boat"] * 1;
		this.gotoIndex = properties["to"] * 1;
		this.frame = 3;
		this.frame_row = 7;
	}
	if("temple" in properties){
		this.type = "temple";
		this.index = properties["temple"] * 1;
		this.frame = 3;
		this.frame_row = 5;
		try{
			if( _world.temples[this.index].complete ){
				this.frame = 4;
			}
		} catch (ex) {}
	}
	if("town" in properties){
		this.type = "town";
		this.index = properties["town"] * 1;
		this.frame = 3;
		this.frame_row = 7;
	}
	
	this.on("collideObject", function(obj){
		if( this.active ){
			if( obj instanceof WorldPlayer ){
				var dir = new Point(obj.force.x, obj.force.y);
				_world.enterLocale( this, dir );
			}
		}
	});
}

WorldEncounter.prototype = new GameObject();
WorldEncounter.prototype.constructor = GameObject;
function WorldEncounter(x, y){	
	this.constructor();
	x = Math.floor(x/16)*16;
	y = Math.floor(y/16)*16;
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	
	this.height = this.width = 12;
	this.sprite = sprites.world;
	this.speed = 0.125;
	this.zIndex = 1;
	
	this.addModule(mod_rigidbody);
	this.gravity = 0;
	this.friction = 0;
	
	this.frame = 1;
	this.frame_row = 13;
	
	this.target = game.getObject(WorldPlayer);
	this.on("collideObject", function(obj){
		if( obj instanceof WorldPlayer ){
			_world.encounter(this);
		} else if( obj instanceof WorldEncounter ){
			var dir = this.position.subtract(obj.position);
			obj.force = obj.force.add(dir.normalize(this.delta*0.5));
			this.force = this.force.add(dir.normalize(this.delta*-0.5));
		}
	});
	
	if(
		game.getTile(this.position, 1) != 0 ||
		this.target && this.position.subtract(this.target.position).length() < 104
	) {
		this.position.x = this.position.y = -999;
	}
	
}
WorldEncounter.prototype.update = function(){
	this.force = this.force.scale( 1.0 - (0.05*this.delta) );
	
	if( this.target == null ){
		this.target = game.getObject(WorldPlayer);
	}
	
	if( this.target instanceof WorldPlayer ) {
		var dir = this.position.subtract(this.target.position);
		if( this.active ){
			var move = dir.normalize(-1);
			this.force.x += move.x * this.speed * this.delta;
			this.force.y += move.y * this.speed * this.delta;
			if( dir.length() > 104 ) {
				this.active = false;
			}
		} else {
			if( dir.length() < 96 ) {
				this.active = true;
			}
		}
	}
}