class DemoThanks extends GameObject{	
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.sprite = "title";
		this.zIndex = 999;
		this.visible = true;
		this.page = 0;
		this.start = false;
		
		this.title_position = -960;
		this.castle_position = 240;
		
		this.progress = 0;
		this.cursor = 1;
		this.current_player = false;
		
		this.starPositions = [
			new Point(84,64),
			new Point(102,80),
			new Point(99,93),
			new Point(117,99),
			new Point(117,111),
			new Point(128,71),
			new Point(191,41),
			new Point(64,108 ),
			new Point(158,65),
			new Point(15,5),
			new Point(229,69)
		];
		
		this.stars = [
			{ "pos" : new Point(), "timer" : 10 },
			{ "pos" : new Point(), "timer" : 20 },
			{ "pos" : new Point(), "timer" : 0 }
		];
		
		this.on("collideObject", function(obj){
			if( obj instanceof Player){
				if(!this.start){
					mod_hud.countItems();
					
					this.current_player = obj;
					//Game over, clear all
					game.clearAll();
					game.addObject(this);
					
					//Start the game over animation
					this.start = true;
				}
			}
		});
	}
	update(){
		if(this.start){
			if(this.progress >= 8.0){
				if(input.state("pause") == 1){
					audio.play("pause");
					this.saveNewgamePlus();
					
					delete self._player;
					game.clearAll();
					game.pause = false;
					game.deltaScale = 1.0;
					
					game_start(game);
				}
			} else {
				if(input.state("pause") == 1){
					this.progress = 10.0;
				}
			}
			
			this.progress += this.delta / Game.DELTASECOND;
		}
	}
	saveNewgamePlus(){
		this.current_player.life = this.current_player.lifeMax;
		let savedata = Checkpoint.createSaveData(this.current_player);
		let keep = []
		
		for(let _var in savedata.variables){
			//Reset all non-item variables
			
			if(mod_hud.KEEP_VARS.indexOf(_var) >= 0){
				//Do nothing, keep variable
			} else if(mod_hud.ITEM_LIST.indexOf(_var) >= 0){
				//Do nothing, keep variable
			} else {
				delete savedata.variables[_var];
			}
		}
		
		savedata.variables["short_sword"] = 1;
		savedata.variables["small_shield"] = 1;
		savedata["base_difficulty"] = Spawn.base_difficulty + 1;
		savedata["location"]["map"] = game.newmapName;
		savedata["location"]["x"] = 128.00;
		savedata["location"]["y"] = 784.00;
		
		game.save( savedata );
	}
	postrender(g,c){
		if(this.start){
			var xpos = (game.resolution.x - 427) * 0.5;
			
			var pan = Math.min(this.progress/8, 1.0);
			
			g.renderSprite(this.sprite,new Point(xpos,0),this.zIndex,new Point(0,2));
			
			//Random twinkling stars
			for(var i=0; i<this.stars.length; i++) {
				var star = this.stars[i];
				var frame = 2;
				if( 
					this.stars[i].timer > Game.DELTASECOND * 1.0 * 0.3 && 
					this.stars[i].timer < Game.DELTASECOND * 1.0 * 0.67
				) frame = 3;
					
				g.renderSprite("bullets",star.pos.add(new Point(xpos,0)),this.zIndex,new Point(frame,2));
				star.timer -= this.delta;
				if( star.timer <= 0 ){
					star.timer = Game.DELTASECOND * 1.0;
					star.pos = this.starPositions[ Math.floor(Math.random()*this.starPositions.length) ];
				}			
			}
			this.stars.timer = Math.min(this.stars.timer, this.progress+this.stars.reset);
			if( this.progress > this.stars.timer ) {
				this.stars.pos = new Point(Math.random() * 256,Math.random() * 112);
				this.stars.timer += this.stars.reset;
			}
			
			g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.castle_position, 0, pan)),this.zIndex,new Point(0,1));
			g.renderSprite(this.sprite,new Point(xpos,Math.lerp( this.title_position, 0, pan)),this.zIndex,new Point(0,0));
			
			textArea(g,"Copyright 2018",8,4);
			textArea(g,"Version "+version,8,228);
		}
	}
	hudrender(g,c){	
		if( this.progress >= 8 ) {
			var y_pos = Math.lerp(240,20, Math.min( (this.progress-8)/2, 1) );
			var x_pos = game.resolution.x * 0.5 - 256 * 0.5;
			
			var timeMinutes = Math.floor(DemoThanks.time / Game.DELTAMINUTE);
			var timeSeconds = Math.floor((DemoThanks.time - timeMinutes*Game.DELTAMINUTE)/ Game.DELTASECOND);
			if(timeSeconds < 10) timeSeconds = "0"+timeSeconds;
			
			let item_text = this.current_player.hud_showItemCount + " / " + mod_hud.ITEM_LIST.length;
			
			boxArea(g,x_pos,y_pos,256,200);
			
			textArea(g,"Thank you for playing!",x_pos+16,y_pos+16);
			
			textArea(g,"Kills: "+DemoThanks.kills ,x_pos+16,y_pos+40);
			textArea(g,"Items: "+item_text ,x_pos+16,y_pos+64);
			textArea(g,"Deaths: "+DemoThanks.deaths ,x_pos+16,y_pos+88);
			textArea(g,"Time: "+timeMinutes+":"+timeSeconds ,x_pos+16,y_pos+112);
			
			textArea(g,"Play again in new game plus",x_pos+16,y_pos+164);
			textArea(g,"Press start",x_pos+16,y_pos+176);
		}	
	}
}
DemoThanks.prototype.idle = function(){}

DemoThanks.deaths = 0;
DemoThanks.kills = 0;
DemoThanks.items = 0;
DemoThanks.time = 0;

self["DemoThanks"] = DemoThanks;
