MapDebug.prototype = new GameObject();
MapDebug.prototype.constructor = GameObject;
function MapDebug(x,y){
	this.slice = 0;
	this.offset = new Point(-104,-96);
}
MapDebug.prototype.update = function(){
	if( input.state("up") == 1) this.offset.y -= 8;
	if( input.state("down") == 1) this.offset.y += 8;
	if( input.state("left") == 1) this.offset.x -= 8;
	if( input.state("right") == 1) this.offset.x += 8;
	
	if( input.state("fire") == 1) this.slice--;
	if( input.state("jump") == 1) this.slice++;
}
MapDebug.prototype.hudrender = function(g,c){
	try {
		var size = new Point(8,8);
		//this.slice = Math.min(Math.max(this.slice,0),RandomTemple.test.slices.length-1);
		this.slice = Math.min(Math.max(this.slice,0),MapSlice.testslice.length-1);
		
		//var slice = RandomTemple.test.slices[this.slice].data;
		var slice = MapSlice.testslice[this.slice].data;
		for(var i in slice ){
			if( slice[i].room != -1 ) {
				var pos = MapSlice.idToLoc(i);
				for(var w=0; w < slice[i].width; w++) for(var h=0; h < slice[i].height; h++) {
					var pos = MapSlice.idToLoc(i);
					var tileY = 0;
					if( h > 0) tileY += 8;
					if( h >= slice[i].height-1) tileY += 4;
					if( w > 0) tileY += 2;
					if( w < slice[i].width-1) tileY += 1;
					var mpos = pos.add(new Point(w,h)).scale(8).subtract(this.offset);
					sprites.map.render(g,mpos,0,tileY);
				}
			}
		}
	} catch (err) {}
}
MapDebug.prototype.idle = function(){}