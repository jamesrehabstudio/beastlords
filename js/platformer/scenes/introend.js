SceneEndIntro.prototype = new GameObject();
SceneEndIntro.prototype.constructor = GameObject;
function SceneEndIntro(x,y){
	this.position.x = x;
	this.position.y = y;
	this.width = 64;
	this.height = 64;
	
	this.progress = 0.0;
	this.phase = 0;
		
	this.objPlayer = {"pos":new Point(1744, 144),"frame":0,"frame_row":0,"visible":true};
	this.objZoder = {"pos":new Point(2032, 116),"frame":0,"frame_row":1,"visible":true};
	this.objSpear = {"pos":new Point(1992, 116),"frame":1,"frame_row":0,"visible":false};
	
	this.playerFrame = 0;
	this.fatherFrame = 0;
	
	this.activated = false;
	this.clearAll = false;
	
	this.stars = [];
	for(var i=0; i < 32; i++){
		this.stars.push( {"pos":new Point(256*Math.random(),300+Math.random()*200), "speed":0.5+Math.random()*1.2} );
	}
	
	this.villagers = [];
	for(var i=0; i < 8; i++){
		var fr = i == 4 ? 0 : 1+Math.floor(Math.random()*3);
		this.villagers.push( {"pos":new Point(Math.random()*16+1832+(i*16),192), "frame_row":fr, "frame":0} );
	}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			if( !this.activated ) {
				this.trigger("activate");
			}
		}
	});
	this.on("activate", function(){
		this.activated = true;
		_player.visible = false;
		_player.stun = Game.DELTAYEAR;
		_player.lock_overwrite = new Line(1760,0,1760+256,240);
	});
	
	localStorage.setItem("playedintro", true);
}
SceneEndIntro.prototype.idle = function(){}

SceneEndIntro.prototype.update = function(){
	if( this.activated ) {
		this.progress += this.delta / Game.DELTASECOND;
		
		if( this.progress > 1.0 && this.progress < 4.0 ) {
			var p = (this.progress - 1.0) / 3.0;
			this.objZoder.pos = Point.lerp(new Point(2032, 116), new Point(1992, 116), p);
		}
		
		if( this.progress > 5.0 && this.progress < 6.0 ) {
			var p = (this.progress - 5.0) / 1.0;
			this.objPlayer.pos = Point.lerp(new Point(1744, 144), new Point(1800, 144), p);
		}
		
		if( this.progress > 8.0 && this.progress < 10.0 ) {
			if( this.progress < 9.5 ) {
				//Wind up for attack
				this.objZoder.frame = 0;
				this.objZoder.frame_row = 2;
			} else {
				var p = (this.progress - 9.5) / 0.5;
				this.objZoder.frame = 2;
				this.objZoder.frame_row = 0;
				this.objSpear.visible = true;
				this.objSpear.pos = Point.lerp(new Point(1992, 116), this.objPlayer.pos, p);
			}
		}
		
		if( this.progress > 10.0 ) {
			if( !this.clearAll ) {
				game.clearAll();
				game.addObject(this);
				audio.play("slash");
				audio.stopAs("music");
				this.clearAll = true;
			}
		}
	}
}

SceneEndIntro.prototype.render = function(g,c){
	if( this.activated ) {
		if( this.clearAll ) {
			//Death
			if( this.progress < 13.0 ) {
				g.color = (this.progress * 6.0) % 1.0 > 0.5 ? [0.0,0.0,0.0,1.0] : [0.7,0.0,0.0,1.0];
				g.scaleFillRect(0,0,256,240);
				sprites.player.render(g,new Point(128,120), 4, 0, false);
			} else {
				g.color = [0.0,0.0,0.0,1.0];
				g.scaleFillRect(0,0,256,240);
				
				var lowest = 0;
				for(var i=0; i < this.stars.length; i++){
					this.stars[i].pos.y -= this.stars[i].speed * this.delta;
					if( this.stars[i].pos.y > lowest ) lowest = this.stars[i].pos.y;
					sprites.bullets.render(g, this.stars[i].pos, 3, 2);
				}
				sprites.title.render(g, new Point(0, lowest), 0, 2);
				
				if( lowest <= 0 ) {
					this.destroy();
					game.addObject( new TitleMenu() );
				}
			}
		} else {
			//Cut scene
			sprites.player.render(g,this.objPlayer.pos.subtract(c), 0, 3, false);
			sprites.player.render(g,this.objPlayer.pos.subtract(c), this.objPlayer.frame, this.objPlayer.frame_row, false);
			
			sprites.zoder.render(g,this.objZoder.pos.subtract(c), this.objZoder.frame, this.objZoder.frame_row, true);
			
			if( this.objSpear.visible ) {
				sprites.zoder.render(g,this.objSpear.pos.subtract(c), this.objSpear.frame, this.objSpear.frame_row, true);
			}
			
			for(var i=0; i < this.villagers.length; i++ ){
				sprites.characters.render(g,this.villagers[i].pos.subtract(c), this.villagers[i].frame, this.villagers[i].frame_row, false);
			}
		}
	}
}