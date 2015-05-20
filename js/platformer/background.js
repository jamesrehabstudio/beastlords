Background.prototype = new GameObject();
Background.prototype.constructor = GameObject;
function Background(x,y){
	this.constructor();
	
	this.sprite = game.tileSprite;
	this.backgrounds = [
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,41,42,9,9,9,9,9,9,9,9,9,41,42,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,9,9,9,9,9,9,9,9,57,58,9,9,57,58,9,30,31,32,32,32,64,48,9,57,58,9,9,73,74,9,46,0,0,0,0,0,47,9,73,74,9,9,89,90,9,62,0,0,0,0,0,63,9,89,90,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,91,92,62,0,0,0,0,0,63,91,92,9,9,9,9,107,108,62,0,0,0,0,0,63,107,108,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,9,9,9,9,62,0,0,0,0,0,63,9,9,9,9,93,94,94,93,12,28,28,28,28,28,13,93,94,94,93,109,110,110,109,94,93,93,94,93,94,93,109,110,110,109]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,77,78,9,9,9,9,9,27,27,9,9,27,27,9,9,27,27,9,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,25,0,0,26,25,0,0,26,25,0,0,26,91,92,9,25,0,0,26,25,0,0,26,25,0,0,26,107,108,9,25,0,0,26,25,0,0,26,25,0,0,26,9,9,9,9,28,28,9,9,28,28,9,9,28,28,9,9,9,9,93,94,9,93,94,9,94,94,93,9,94,94,93,94,94,109,110,93,109,110,93,110,110,109,93,110,110,109,110,110,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,29,9,9,29,9,9,29,9,9,29,9,9,29,9,9,45,91,92,45,91,92,45,91,92,45,91,92,45,9,9,45,107,108,45,107,108,45,107,108,45,107,108,45,9,9,45,27,27,45,27,27,45,27,27,45,27,27,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,0,0,45,0,0,45,0,0,45,0,0,45,9,9,45,28,28,45,28,28,45,28,28,45,28,28,45,9,94,45,94,93,45,94,94,45,93,94,45,94,93,45,93,110,61,110,109,61,110,110,61,109,110,61,110,109,61,109,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]},
		{ "rarity":1, "tags":["normal"],"temples":[0,1,2,3,4,5,6,7,8],"tiles":[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,30,31,32,64,48,9,9,9,9,9,9,9,91,92,9,46,0,0,0,47,9,91,92,9,9,9,9,107,108,9,62,0,0,0,63,9,107,108,9,9,9,9,9,9,9,62,0,0,0,63,9,9,9,9,9,9,9,30,31,32,79,0,0,0,80,32,64,48,9,9,9,9,46,0,0,0,0,0,0,0,0,0,47,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,9,9,62,0,0,0,0,0,0,0,0,0,63,9,9,93,94,12,28,28,28,28,28,28,28,28,28,13,9,9,109,109,94,94,94,93,94,94,94,94,94,93,94,93,94,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110,109,109,110,110,110,109,110,110,110,110,110,109,110,109,110]}
	];
	
	this.saved_rooms = {};
	this.animation = 0;
	this.walls = true;
}
Background.prototype.prerender = function(g,c){
	var screen_width = 256;
	var screen_height = 240;
	var c_x = c.x%screen_width;
	if(c.x < 0 && c_x != 0) c_x = screen_width+c_x;
	var offset = 8 + c_x * 0.0625;
	var room_off = c_x > 128 ? -2 : -1;
	var room_matrix_index = new Point(Math.floor(c.x/screen_width), Math.floor(c.y/screen_height));
	var rooms = [
		this.roomAtLocation(room_matrix_index.x - (room_off), room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x - (room_off+1), room_matrix_index.y),
		this.roomAtLocation(room_matrix_index.x - (room_off+2), room_matrix_index.y)
	];
	
	this.sprite.renderScale(g, new Line(0,0,256,180), 203);
	
	if( room_matrix_index.y > 0 && this.walls ) {
		//Background wall
		for(x=0; x < 18; x++) for(y=0; y < 15; y++) {
			var tile = 104 + (y%2==1?16:0) + (x%2==1?1:0);
			var pos_x = x*16 - ((c_x/2) % 32);
			this.sprite.render(g, new Point(pos_x, y*16), tile );
		}
	} else {
		//Clouds
		var sky_offset = this.animation / 20.0;
		var sky_tile_offset = Math.floor(sky_offset/16);
		for(l=0; l < 17; l++) for(x=0; x < 17; x++) for(y=0; y < 2; y++) {
			var y_offset = Math.min( 4 * Math.abs( room_matrix_index.y ), 32);
			var c_x_minus = c.x - game.bounds.start.x;
			//layer 3
			if(l==0) this.sprite.render(g, new Point(x*16-((c_x_minus*0.025)%16), 168+y*16), 202+(y*16) );
			//layer 2
			if(l==1) this.sprite.render(g, new Point(x*16-((c_x_minus*0.125)%16), (y_offset*0.5)+176+y*16), 201+(y*16) );
			//layer 1
			if(l==2) this.sprite.render(g, new Point(x*16-((c_x_minus*0.333)%16), (y_offset*2)+184+y*16), 200+(y*16) );
			
			var tile = 224 + 8+((x+sky_tile_offset)%8) + 16*y;
			if(l==3) this.sprite.render(g, new Point(x*16-(sky_offset%16), 144+y*16), tile );
		}
	}
	
	if(this.walls ) for(var i=0; i < rooms.length; i++) {
		if( rooms[i] >= 0 && rooms[i] < this.backgrounds.length ) {
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
	this.animation += this.delta;
}
Background.prototype.roomAtLocation = function(x,y){
	if(y==0 && (x==0||x==1)) return -1;
	
	try {
	var code = x+"_"+y;
		if( code in this.saved_rooms ) {
			return this.saved_rooms[code];
		} else if( code in dataManager.slices.peek().data ) {
			var tags = ["normal"];
			var total = 0;
			for(var i=0; i<this.backgrounds.length; i++) if(this.backgrounds[i].tags.intersection(tags).length>0) total += this.backgrounds[i].rarity;
			var roll = Math.random() * total;
			for(var i=0; i<this.backgrounds.length; i++) if(this.backgrounds[i].tags.intersection(tags).length>0) {
				if( roll < this.backgrounds[i].rarity ) {
					this.saved_rooms[code] = i;
					return i;
				}
				roll -= this.backgrounds[i].rarity;
			}
		}
	} catch (err) {
		return -1;
	}
}
Background.prototype.idle = function(){}