HotSpring.prototype = new GameObject();
HotSpring.prototype.constructor = GameObject;
function HotSpring(x,y,d){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "playerbath";
	this.width = d[0];
	this.height = d[1];
	this.zIndex = 1;
	this.idleMargin = 72;
	
	this.addModule(mod_talk);
	
	this.on("open",function(){
		game.pause = true;
		this.active = true;
		this.frame.x = this.frame.y = 0;
	});
	
	this.on("close", function(){
		game.pause = false;
		this.active = false;
		this.show = false;
		this.time = 0.0;
		
		_player.visible = true;
		Renderer.tint = [1,1,1,1];
	});
	
	this.time = 0.0;
	this.show = false;
}

HotSpring.prototype.update = function(){
	
	if(this.active){
		this.time += game.deltaUnscaled;
		
		if(this.time < Game.DELTASECOND * 0.8){
			//Fade out
			var progress = this.time / (Game.DELTASECOND * 0.8);
			Renderer.tint = [1-progress,1-progress,1-progress,1];
		} else if(this.time < Game.DELTASECOND * 2.0){
			//Fade In
			var progress = (this.time - Game.DELTASECOND*1.2) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [progress,progress,progress,1];
			this.show = true;
			_player.visible = false;
		} else if(this.time < Game.DELTASECOND * 7.0){
			//Animate
			var progress = (this.time - Game.DELTASECOND*2.0) / (Game.DELTASECOND * 5.0);
			this.frame = HotSpring.bathanimation.frame(progress);
		}  else if(this.time < Game.DELTASECOND * 7.8){
			//Fade out
			var progress = (this.time - Game.DELTASECOND*7.0) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [1-progress,1-progress,1-progress,1];
		}  else if(this.time < Game.DELTASECOND * 9.0){
			//Fade in
			var progress = (this.time - Game.DELTASECOND*8.2) / (Game.DELTASECOND * 0.8);
			Renderer.tint = [progress,progress,progress,1];
			this.show = false;
			_player.visible = true;
		} else {
			//End
			this.close();
		}
		
		if(PauseMenu.open){
			this.close();
		}
		
		//Heal
		if(Timer.isAt(this.time,Game.DELTASECOND*6.0,game.deltaUnscaled)){
			_player.life = _player.lifeMax;
			_player.mana = _player.manaMax;
		}
	}
}

	
HotSpring.prototype.render = function(g,c){
	if(this.show){
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex+1, this.frame, false);
	}
}

HotSpring.bathanimation = new Sequence([
	[0,0,0.2],
	[1,0,0.1],
	[2,0,0.1],
	[3,0,0.1],
	[0,1,0.1],
	[1,1,0.4],
	[2,1,0.1],
	[3,1,0.1],
	[0,2,0.1],
	[1,2,0.1],
	[2,2,0.5],
	[3,2,0.1],
	[0,3,1.0]
]);