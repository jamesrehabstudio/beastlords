class Checkpoint extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 48;
		this.sprite = "policeman";
		this.swrap = spriteWrap["policeman"];
		this.activated = false;
		
		this.addModule( mod_talk );
		
		this.loadSprites = ["policeman","policebox"];
		this.loadAudio = [];
		
		this.on("collideObject",function(obj){
			/*
			if(!this.activated && obj instanceof Player){
				this.activate(obj);
			}
			*/
		});
		this.on("wakeup", function(){
			this._lookTime = 4.0;
		});
		this.on("added", function(){
			let sm = new SpellMaster(this.position.x + 48, this.position.y+16);
			game.addObject(sm);
		});
		this.on("open", function(){
			game.ga_event("checkpoint");
			
			_player.heal = _player.lifeMax;
			_player.manaHeal = _player.manaMax;
			
			DialogManager.set( this.getText() );
			
			DialogManager.choices = i18n("save_choice");
			
			game.pause = true;
		});
		this.on("close", function(){
			game.pause = false;
		});
		
		this._lookTime = 0.0;
		this._idle = 0.0;
		this._tap = 0.0;
		
	}
	activate(obj){
		//Deativate all other points
		var allpoints = game.getObjects(Checkpoint);
		for(var i=0; i < allpoints.length; i++){
			allpoints[i].activated = false;
		}
		
		this.activated = true;
		
		audio.play("item1");
		game.slow(0,Game.DELTASECOND*0.3333);
		
		Checkpoint.saveState(obj);
	}
	getText(){
		
		if( !NPC.get("npc_save") ){
			//introduction
			NPC.set("npc_save", 1);
			return i18n("save_special")[0];
		}
		
		return i18n("save_common");
	}
	update(){
		if( this.open ) {
			//Talking
			let dir = _player.position.x > this.position.x ? "talkr" : "talkl";
			this.talkMovePlayer();
			
			if( !DialogManager.filling ){
				this.frame = this.swrap.frame(dir, Math.mod(game.time * 4, 1.0));
			} else {
				this.frame = this.swrap.frame(dir, 0);
			}
			
			if( !DialogManager.show ){
				if( DialogManager.cursor == 0){
					this.activate(_player);
				}
				this.close();
			}
		
		} else {
			//Idle
			if( this._lookTime > 0 ){
				let dir = _player.position.x > this.position.x ? "lookright" : "lookleft";
				let p = 1 - Math.clamp01(this._lookTime / 4.0);
				
				this.frame = this.swrap.frame(dir, Math.pingpong01(this._lookTime,4));
				this._lookTime -= this.delta;			
				this._idle = 3.0;
				this._tap = 0.0;
			} else {
				if( this._tap > 0 ){
					let p = 1 - Math.clamp01( this._tap / 3 );
					this.frame = this.swrap.frame("tap", p);
					this._tap -= this.delta;
				} else {
					this.frame = this.swrap.frame("idle", Math.mod(game.timeScaled, 1.0));
					this._idle -= this.delta;
					if( this._idle < 0.0 ) {
						this._tap = 3.0;
						this._idle = 7 + Math.random() * 7;
					}
				}
			}
		}
		
		Background.pushLight(this.position.add(new Point(40,-8)),140,[1.0,0.8,0.5,1.0]);
	}
	render(g,c){
		this.flip = false;
		super.render(g,c);
		g.renderSprite("policebox", this.position.subtract(c), this.zIndex-1, new Point(), false );
	}
	hudrender(g,c){
		if( this.open ){
			DialogManager.render(g,c);
		}
	}
}
Checkpoint.respawn = function(){
	Checkpoint.loadState();
}
Checkpoint.saveState = function(obj){
	//Write data
	PauseMenu.saveMapReveal();
	
	game.save( Checkpoint.createSaveData(obj) );
}
	
Checkpoint.createSaveData = function(obj){
	//obj.checkpoint.x = obj.position.x;
	//obj.checkpoint.y = obj.position.y;
	
	//Checkpoint.state.money = obj.money;
	//Checkpoint.state.music = audio.alias["music"];
	//Get quest data
	
	var q = {}
	/*
	var i = 0;
	while("q"+i in Quests){
		q["q"+i] = Quests["q"+i];
		i++;
	}
	*/
	
	
	
	//Save map and location
	var location = {
		"music" : audio.alias["music"],
		"map" : game.newmapName,
		"x" : obj.position.x,
		"y" : obj.position.y
		
	}
	
	//Build data
	var data = {
		"version" : version,
		"savedate" : new Date * 1,
		"quests" : q,
		"location" : location,
		"variables" : NPC.variables,
		"mapreveal" : WorldMap.map,
		"base_difficulty" : Spawn.base_difficulty,
		"player" : obj.toJson(),
		"sessionId" : sessionId,
		"settings" : Settings
	}
	return data;
	
}
Checkpoint.loadState = function(){
	//obj.position.x = obj.checkpoint.x ;
	//obj.position.y = obj.checkpoint.y ;
	//obj.money = Checkpoint.state.money;
	
	//audio.playAs(Checkpoint.state.music, "music");
	game.load(function(data){
		if(data){
			new Player();
			_player.fromJson(data.player);
			
			Spawn.base_difficulty = data.base_difficulty;
			NPC.variables = data.variables;
			WorldMap.map = data.mapreveal;
			
			game.loadMap(data.location.map, function(starts){
				sessionId = data.sessionId;
				_player.position.x = data.location.x;
				_player.position.y = data.location.y;
				audio.playAs(data.location.music, "music");
				
				game.addObject(_player);
				game.addObject(new PauseMenu(0,0));
				game.addObject(new Background(0,0));
				
				game.ga_event("respawn");
			});
		}
		
	}, Checkpoint.profile);
}
Checkpoint.profile = 0;

Checkpoint.state = {
	"money" : 0,
	"music" : "",
}
self["Checkpoint"] = Checkpoint;