Exit.prototype = new GameObject();
Exit.prototype.constructor = GameObject;
function Exit(x,y,d,o){
	this.constructor();
	this.sprite = "cornerstones";
	this.position.x = x - 8;
	this.position.y = y + 8;
	this.width = d[0] * 1;
	this.height = d[1] * 1;
	
	var options = o || {};
	this.visible = false;
	this.offset = new Point();
	this.start = false;
	
	if("direction" in options){
		if( options.direction == "e" ) this.offset.x += 16;
		if( options.direction == "w" ) this.offset.x -= 16;
		if( options.direction == "s" ) this.offset.y += 16;
		if( options.direction == "n" ) this.offset.y -= 16;
	}
	if("start" in options){
		this.start = options["start"];
	}
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			WorldLocale.loadMap("temple1.tmx");
			return;
			
			if(this.start){
				WorldMap.open(this.start);
			} else {
				WorldMap.open();
			}
			
			/*
			if(this.location){
				window._world.trigger("activate");
				var locales = game.getObjects(WorldLocale);
				var player = game.getObject(WorldPlayer);
				for(var i=0; i < locales.length; i++){
					if(locales[i].map_id == this.location){
						player.position.x = locales[i].position.x;
						player.position.y = locales[i].position.y;
					}
				}
			} else {
				window._world.player.x += this.offset.x;
				window._world.player.y += this.offset.y;
				window._world.trigger("activate");
			}*/
		}
	});
}
Exit.prototype.idle = function(){}