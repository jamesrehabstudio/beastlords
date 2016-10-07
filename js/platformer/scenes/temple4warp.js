Temple4warp.prototype = new GameObject();
Temple4warp.prototype.constructor = GameObject;
function Temple4warp(x,y,d,options){
	options = options || {};
	
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	
	this.active = false;
	
	this.progress = 0.0;
	this.progressTotal = Game.DELTASECOND;
	this.phase = 0;
	
	this.camera = new Point(this.position.x+64,this.position.y-1632)
	
	this.on("struck",function(obj,pos,damage){
		if( !this.active && obj instanceof Player ) {
			audio.stopAs("music");
			audio.play("crash");
			this.active = true;
		}
	});
}
Temple4warp.prototype.update = function(){
	if( this.active ) {
		//Progress to the end of the level
		game.pause = true;
		
		if(this.phase == 0){
			if(this.progress >= this.progressTotal){
				this.progress = 0;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
			}
		} else if( this.phase == 1 ) {
			//Fade out
			var p = this.progress / this.progressTotal;
			Renderer.tint = [1-p,1-p,1-p,1];
			if(this.progress >= this.progressTotal){
				this.progress = -Game.DELTASECOND * 0.5;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
				_player.destroy();
			}
		} else if( this.phase == 2 ) {
			//Fade in
			var p = Math.max(this.progress / this.progressTotal,0);
			Renderer.tint = [p,p,p,1];
			
			game.camera.x = this.camera.x - game.resolution.x * 0.5;
			game.camera.y = this.camera.y + game.resolution.y * 0.5;
			
			if(this.progress >= this.progressTotal){
				this.progress = -Game.DELTASECOND * 1.5;
				this.progressTotal = Game.DELTASECOND * 0.8;
				this.phase++;
			}
		} else if (this.phase == 3){
			if(this.progress > 0){
				var shake = new Point(Math.random()*5,Math.random()*5);
				game.camera.x = this.camera.x - game.resolution.x * 0.5 + shake.x;
				game.camera.y = this.camera.y + game.resolution.y * 0.5 + shake.y;
			}
			if(this.progress >= this.progressTotal){
				this.progress = 0;
				this.progressTotal = Game.DELTASECOND * 1.2;
				this.phase++;
			}
		}  else if( this.phase == 4 ) {
			//Fade out
			var p = this.progress / this.progressTotal;
			Renderer.tint = [1-p,1-p,1-p,1];
			game.camera.y -= game.deltaUnscaled * p * 40;
			if(this.progress >= this.progressTotal){
				this.phase++;
			}
		} else {
			game.pause = false;
			var pausemenu = game.getObject(PauseMenu);
			var currentMapReveal = pausemenu.map_reveal;
			WorldLocale.loadMap("temple4b.tmx","warp",function(){
				Renderer.tint = [1,1,1,1];
				var pausemenu = game.getObject(PauseMenu);
				var mapw = Math.floor(game.map.width/16);
				for(var i=0; i < currentMapReveal.length; i++){
					if(currentMapReveal[i] > 0){
						if(i>mapw*2&&i<mapw*10&&i%mapw>7&&i%mapw<27){
							pausemenu.map_reveal[i+mapw*2] = 1;
						} else {
							pausemenu.map_reveal[i] = 1;
						}
					}
				}
			});
		}
		
		this.progress += game.deltaUnscaled;
	}
}
Temple4warp.prototype.idle = function(){}
Temple4warp.prototype.render = function(g,c){
	g.color = COLOR_LIGHTNING;
	g.scaleFillRect(
		(this.position.x - this.origin.x * this.width) - c.x,
		(this.position.y - this.origin.y * this.height) - c.y,
		this.width,	this.height
	);
	Background.pushLight(this.position,300,COLOR_LIGHTNING);
}