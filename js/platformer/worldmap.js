var version = "0.3.1";

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
	"q0" : 0, //Magic wand
	"q1" : 0,
	"q2" : 0 //Lost souls in the phantom world
}

Settings = {
	"fullscreen" : false,
	"sfxvolume" : 1.0,
	"musvolume" : 1.0,
	"debugmap" : "testmap.tmx"
}

WorldMap = {
	"newgame" : function(){
		new Player(64,178);
		WorldMap.position = new Point(73*16,40*16);
		WorldMap.open();
		
		game.load(function(data){
			for(var q in data.quests){
				Quests[q] = data.quests[q];
			}
			NPC.variables = data.variables;
			
			if("settings" in data){
				for(var i in data["settings"]){
					if(i in Settings){
						Settings[i] = data["settings"][i];
					}
				}
			}
		});
	},
	"position" : new Point(240,256),
	"open" : function(playerLocale){
		//Save keys for temple and remove
		//Save game
		game.loadMap("world2.tmx", function(){
			if(playerLocale != undefined){
				//Change players location to the set locale
				var locales = game.getObjects(WorldLocale);
				for(var i=0; i < locales.length; i++){
					//Search for the locale that matches the playerLocale
					if(locales[i].start == playerLocale){
						WorldMap.position.x = locales[i].position.x;
						WorldMap.position.y = locales[i].position.y;
						break;
					}
				}
			}
			game.addObject(new WorldPlayer(
				WorldMap.position.x,
				WorldMap.position.y
			));
		});
	},
	"close" : function(worldLocale){
		WorldMap.position.x = worldLocale.position.x;
		WorldMap.position.y = worldLocale.position.y;
	},
	"Shops" : [
		"Alter",
		"Arena",
		"Prisoner",
		"Shop",
		"WaystoneChest"
	],
	"updateSettings" : function(){
		self.postMessage({
			"settings" : Settings
		})
	},
	"save" : function(){
		var q = {}
		var i = 0;
		while("q"+i in Quests){
			q["q"+i] = Quests["q"+i];
			i++;
		}
		
		var data = {
			"savedata" : new Date * 1,
			"quests" : q,
			"variables" : NPC.variables,
			"settings" : Settings
		}
		
		game.save(data);
	}
};

WorldPlayer.prototype = new GameObject();
WorldPlayer.prototype.constructor = GameObject;
function WorldPlayer(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.origin = new Point(-0.1,-0.3);
	//this.origin = new Point(0.2,0.2);
	
	this.height = this.width = 12;
	this.sprite = "world";
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
	this.grounded = false;
	this.force = this.force.scale( 1.0 - (0.2*this.delta) );
	if( true ){
		if( input.state("up") > 0 ) { this.force.y -= this.speed * this.delta; }
		if( input.state("down") > 0 ){ this.force.y += this.speed * this.delta; }
		if( input.state("left") > 0 ) { this.force.x -= this.speed * this.delta; }
		if( input.state("right") > 0 ) { this.force.x += this.speed * this.delta; }
	}
	
	var camx = game.resolution.x * 0.5;
	game.camera.x = Math.max( Math.min( this.position.x - camx, (game.map.width*16)-game.resolution.x), 0);
	game.camera.y = Math.max( Math.min( this.position.y - 120, (game.map.height*16)-game.resolution.y), 0);
}
WorldPlayer.prototype.render = function(g,c){
	g.color = [0.8,0.2,0.0,1.0];
	var pos = this.bounds().start;
	g.scaleFillRect(pos.x-c.x,pos.y-c.y,this.width,this.height);
}

WorldLocale.prototype = new GameObject();
WorldLocale.prototype.constructor = GameObject;
function WorldLocale(x,y,d,properties){
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.type = false;
	this.index = 0;
	this.active = false;
	this.sleepTime = Game.DELTASECOND;
	this.start = false;
	
	this.height = this.width = 8;
	this.sprite = "world";
	
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
	if("tmx" in properties){
		this.type = "tmx";
		this.index = properties["tmx"];
		this.visible = false;
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
	if("start" in properties){
		this.start = properties["start"];
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof WorldPlayer ){
			if( this.active ){
					//var dir = new Point(obj.force.x, obj.force.y);
					//_world.enterLocale( this, dir );
					
					if(this.type == "tmx"){
						WorldMap.close(this);
						WorldLocale.loadMap(this.index, this.start);
					}
			}
			this.sleepTime = Game.DELTASECOND * 0.5;
		}
	});
}
WorldLocale.prototype.update = function(){
	this.active = this.sleepTime <= 0;
	if(!this.active){
		this.sleepTime -= this.delta;
	}
}
WorldLocale.loadMap = function(map, start){
	var file = map;
	game.loadMap(file, function(starts){
		//Determine player start location
		if(starts.length > 0){
			var index = WorldLocale.getMapIndex(starts,start);
			if(index >= 0){
				//Player start matches specified location start
				_player.position = new Point(starts[index].x,starts[index].y);
				game.addObject(_player);
			} else {
				//No start location specified, pick the first start
				_player.position = new Point(starts[0].x,starts[0].y);
				game.addObject(_player);
			}
		} else {
			//No player start, just force one in
			_player.position = new Point(64,192);
			game.addObject(_player);
		}
		game.addObject(new PauseMenu(0,0));
		game.addObject(new Background(0,0));
	});
}
WorldLocale.getMapIndex = function(list,key){
	for(var i=0; i < list.length; i++){
		if(list[i].start == key){
			return i;
		}
	}
	return -1;
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
	this.sprite = "world";
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