TitleCard.prototype = new GameObject();
TitleCard.prototype.constructor = GameObject;
function TitleCard(x,y,p,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 128;
	
	this.progress = 0.0;
	this.play = false;
	this.text = "Place holder text";
	
	//Get title text
	try{
		var ct = RandomTemple.currentTemple;
		this.text = i18n("templenames")[ct];
	} catch (e){}
	
	this.on("collideObject", function(obj){
		if( obj instanceof Player ) {
			this.play = true;
		}
	});
}

TitleCard.prototype.idle = function(g,c){return true;}

TitleCard.prototype.postrender = function(g,c){
	if( this.play ){
		this.progress += this.delta / (Game.DELTASECOND*3);
		
		var border = Math.min(Math.sin(Math.PI*this.progress)*3, 1) * 64;
		g.color = [0.0,0.0,0.0,0.5];
		g.scaleFillRect(0, 0, game.resolution.x, border);
		g.scaleFillRect(0, game.resolution.y-border, game.resolution.x, border);
		
		textArea(g,
			this.text,
			game.resolution.x * 0.5 - this.text.length * window.text_size * 0.5,
			game.resolution.y * 0.5 - window.text_size * 0.5
		);
		
		if( this.progress >= 1.0 ) {
			this.destroy();
		}
	}
}