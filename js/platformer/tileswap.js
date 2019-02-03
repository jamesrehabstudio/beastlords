class TileSwap extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		
		this.visible = false;
		
		this.tsleft = ops.getString("left", "");
		this.tsright = ops.getString("right", "");
		this.tstop = ops.getString("top", "");
		this.tsbottom = ops.getString("bottom", "");
		this.swap = ops.getString("swap","");
		
		this._active = 0;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				this._active = 2;
				
				if(this.swap){
					game.setTileset(this.swap);
				}
			}
		});
		this.on("new_room", function(x,y){
			if(this._active > 0){
				let ts = "";
				if(x < 0 && this.tsleft) { ts = this.tsleft; }
				if(x > 0 && this.tsright) { ts = this.tsright; }
				if(y < 0 && this.tstop) { ts = this.tstop; }
				if(y > 0 && this.tsbottom) { ts = this.tsbottom; }
				game.setTileset(ts);
			}
		});
	}
	update(){
		this._active = Math.max(this._active-1, 0);
	}
}

self["TileSwap"] = TileSwap;