Background.prototype = new GameObject();
Background.prototype.constructor = GameObject;
function Background(x,y){
	this.constructor();
	
	this.sprite = game.tileSprite;
	this.backgrounds = [
		{ "tags":[],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,41,42,9,9,9,9,9,9,9,9,9,9,9,9,9,57,58,9,9,9,9,9,9,9,9,9,9,9,9,9,57,58,9,9,9,9,9,9,9,9,9,9,9,9,9,57,58,9,9,27,27,27,27,9,9,9,9,9,9,9,73,74,9,25,0,0,0,0,26,9,43,44,9,9,9,89,90,9,25,0,0,0,0,26,9,59,60,9,9,9,9,9,9,25,0,0,0,0,26,9,75,76,9,9,9,9,91,92,25,0,0,0,0,26,91,92,9,9,9,9,9,107,108,25,0,0,0,0,26,107,108,9,9,9,9,9,9,9,25,0,0,0,0,26,9,9,9,9,9,9,9,9,9,25,0,0,0,0,26,9,9,9,9,9,9,9,9,9,9,28,28,28,28,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]}
	]
}
Background.prototype.prerender = function(g,c){
	var screen_width = 256;
	var screen_height = 240;
	var c_x = c.x < 0 ? (screen_width+(c.x%screen_width)) : (c.x%screen_width);
	var offset = 8 + c_x * 0.0625;
	var room_off = c_x > 128 ? -2 : -1;
	var room_matrix_index = new Point(Math.floor(c.x/screen_width), Math.floor(c.y/screen_height));
	var rooms = [
		this.roomAtLocation(room_matrix_index.x + room_off, room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x + room_off+1, room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x + room_off+2, room_matrix_index.y)
	];
	
	if( room_matrix_index.y > 0 ) {
		for(x=0; x < 18; x++) for(y=0; y < 15; y++) {
			var tile = 104 + (y%2==1?16:0) + (x%2==1?1:0);
			var pos_x = x*16 - ((c_x/2) % 32);
			this.sprite.render(g, new Point(pos_x, y*16), tile );
		}
	}
	
	for(var i=0; i < 3; i++) {
		for(x=0; x < 15; x++) for(y=0; y < 15; y++) {
			var index = x + Math.floor(y*15);
			var tile = this.backgrounds[rooms[i]].tiles[index];
			var pos_x = (x*16-(c_x-offset)) - ((i+room_off)*(screen_width-16));
			
			if( tile > 0 ){
				this.sprite.render(g, new Point(pos_x, y*16), tile-1 );
			}
		}
	}
	
}
Background.prototype.roomAtLocation = function(x,y){
	return 0;
}