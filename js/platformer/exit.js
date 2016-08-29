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
			if(this.start){
				WorldMap.open(this.start);
			} else {
				WorldMap.open();
			}
		}
	});
}
Exit.prototype.idle = function(){}

DemoExit.prototype = new GameObject();
DemoExit.prototype.constructor = GameObject;
function DemoExit(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0] * 1;
	this.height = d[1] * 1;
	
	var options = o || {};
	this.visible = false;
	
	this.on("collideObject",function(obj){
		if( obj instanceof Player ) {
			audio.stopAs("music");
			
			var completed = NPC.get("templeCompleted") * 1;
			var next = completed + 1;
			
			WorldLocale.loadMap("temple"+next+".tmx");
		}
	});
}