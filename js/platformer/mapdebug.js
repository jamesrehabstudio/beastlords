MapDebug.prototype = new GameObject();
MapDebug.prototype.constructor = GameObject;
function MapDebug(x,y){
	_rd
	this.slice = 0;
	this.offset = new Point(0,0);
}
MapDebug.prototype.update = function(){
	if( input.state("up") == 1) this.offset.y -= 8;
	if( input.state("down") == 1) this.offset.y += 8;
	if( input.state("left") == 1) this.offset.x -= 8;
	if( input.state("right") == 1) this.offset.x += 8;
	
	if( input.state("fire") == 1) this.slice--;
	if( input.state("jump") == 1) this.slice++;
}
MapDebug.prototype.render = function(g,c){
	try {
		var size = new Point(8,8);
		
		for(var i in _rd[this.slice] ){
			var tile = _rd[this.slice][i] == "j" ? 8 : 0;
			var pos = new Point(
				size.x * ~~i.match(/(-?\d+)/g)[0],
				size.y * ~~i.match(/(-?\d+)/g)[1]
			);
			sprites.map.render(g,pos.subtract(this.offset),tile,0)
		}
	} catch (err) {}
}
MapDebug.prototype.idle = function(){}