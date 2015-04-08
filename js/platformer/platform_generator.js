PlatformGenerator.prototype = new GameObject();
PlatformGenerator.prototype.constructor = GameObject;
function PlatformGenerator(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	
	o = o || {};
	w = ("width" in o) ? o.width : 44;
		
	var start_y = 240 + Math.floor(y/240)*240;
	var space = 0;
	var continuous = 0;
	var y_offset = -1;
	for(var _x=0; _x < w; _x++){
		var start_x = (x)-(w*0.5*16);
		var c_x = start_x + (_x*16);
		var c_y = start_y+(y_offset*16);
		
		y_offset = Math.floor(Math.max(y_offset,-8*(w/(_x||1)-1)));
		y_offset = Math.min(y_offset,-1);
		
		if( space > 0 ) {
			space--;
			if( space == 2 && Math.random() < 0.7 ) {
				game.addObject(new Dropper(c_x,start_y-200));
			}
		} else {
			continuous++;
			game.addObject(new CollapseTile(c_x,c_y-8));
			if(Math.random() < 0.2){
				space = 2+Math.floor(Math.random()*4);
				var _y = Math.floor( Math.random() * 3 )
				y_offset += (Math.random()>0.5?-1:1)*_y;
				continuous = 0;
			}
		}
	}
}