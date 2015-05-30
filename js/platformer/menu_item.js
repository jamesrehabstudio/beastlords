ItemMenu.prototype = new GameObject();
ItemMenu.prototype.constructor = GameObject;
function ItemMenu(unlocks){
	this.constructor();
	this.sprite = sprites.items;
	this.zIndex = 999;
	
	this.open = false;
	this.page = 1;
	this.progress = 0;
	
	game.pause = true;
	
	this.unlocks = unlocks || [];
	this.complete = this.unlocks.length <= 0;
	
	this.burst = null;
	this.burstProgress = 999;
	this.scrollProgress = 1;
	
	if( !this.complete ){
		this.burst = this.itemPosition( this.unlocks.peek() );
		this.scrollProgress = 0;
	}
	
	this.scroll = new Point(0,0);
}
ItemMenu.prototype.idle = function(){}
ItemMenu.prototype.update = function(){
	this.burstProgress += game.deltaUnscaled / Game.DELTASECOND;
	
	if( this.scrollProgress < 1.0 ) {
		var scrollTo = this.burst.y - 120;
		this.scroll.y = Math.lerp(this.scroll.y, scrollTo, this.scrollProgress);
		this.scrollProgress += game.deltaUnscaled / (Game.DELTASECOND*0.5);
	} else if( this.complete ) {
		if( (input.state("pause") == 1 || input.state("jump") == 1 ) && this.complete) {
			game.pause = false;
			this.destroy();
		} else if( input.state("up") > 0 ) {
			this.scroll.y -= game.deltaUnscaled * 3.0;
		} else if ( input.state("down") > 0 ) {
			this.scroll.y += game.deltaUnscaled * 3.0;
		}
	} else {
		this.progress += game.deltaUnscaled / Game.DELTASECOND;
		
		if( this.progress >= 1 ) {
			audio.play("spell");
			this.burstProgress = 0;
			this.burst = this.itemPosition(this.unlocks.pop()).add(new Point(12,12));
			
			if( this.unlocks.length > 0 ) {
				this.progress = 0;
				this.scrollProgress = 0;
			} else { 
				this.complete = true;
			}
		}
	}
}
ItemMenu.prototype.itemPosition = function(name){
	var columnWidth = 6;
	var index = 0;
	for(var i=0; i < dataManager.treasures.length; i++) 
		if( dataManager.treasures[i].name == name )
			index = i;
		
	var colmpos = (index % columnWidth);
	var x = 16 + colmpos * 40;
	var y = 24 + Math.floor(index / columnWidth) * 40;
	return new Point(x,y);
}
ItemMenu.prototype.postrender = function(g,c){
	g.color = [0.0,0.3,0.4,1.0];
	g.scaleFillRect(0,0,256,240);
	
	var columnWidth = 6;
	var scrollHeight = Math.max( 
		Math.ceil( (dataManager.treasures.length+1) / columnWidth ) * 40 - (240-24), 0 
	);
	
	this.scroll.y = Math.min(Math.max(this.scroll.y,0), scrollHeight);
	
	textArea(g,"Unlocked Items", 72+this.scroll.x,8-this.scroll.y);
	
	for(var i=0; i < dataManager.treasures.length; i++) {
		var name = dataManager.treasures[i].name;
		
		switch(dataManager.treasures[i].unlocked * 1) {
			case 1 : g.color = [0.8,0.6,0.9,1.0]; break;
			case 2 : g.color = [1.0,1.0,1.0,1.0]; break;
			default : g.color = [0.2,0.1,0.6,1.0]; break;
		}
		
		var colmpos = (i % columnWidth);
		var x = 16 + colmpos * 40;
		var y = 24 + Math.floor(i / columnWidth) * 40;
		var pos = new Point(x+12,y+12);
		g.scaleFillRect(x,y-this.scroll.y,24,24);
		
		if( dataManager.treasures[i].unlocked > 0 && this.unlocks.indexOf(name) < 0  ){
			Item.prototype.setName.apply(this, [ name ] );
			this.sprite.render(g,pos.subtract(this.scroll),this.frame, this.frame_row);
		} else {
			this.sprite.render(g,pos.subtract(this.scroll),12, 0);
		}
	}
	
	if( this.burst instanceof Point && this.burstProgress <= 1.0 ) {
		//Animation
		var radius = this.burstProgress * 48;
		var points = 16;
		for(var j=0; j < points; j++){
			var angle = (j/points) * Math.PI * 2;
			var p = new Point(radius*Math.sin(angle),radius*Math.cos(angle));
			sprites.bullets.render(g,p.add(this.burst).subtract(this.scroll),2,2);
		}
	}
}