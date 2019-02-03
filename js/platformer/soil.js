class Soil extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.visible = false;
		
		this.fillArea();
		
		this.on("struck", function(obj, area){
			
			if(obj instanceof Player && obj.states.drilling){
				//Requires drill 
				let ends = area.end.ceil(16);
				let bounds = this.bounds();
				for(let x = area.start.x; x <= ends.x; x++) for(let y = area.start.y; y <= ends.y; y++){
					let _x = Math.min(x, area.end.x);
					let _y = Math.min(y, area.end.y);
					
					if( bounds.overlaps(new Point(_x,_y)) ){
						game.setTile(_x, _y, game.tileCollideLayer, 0);
					}
				}
			}
		});
		
	}
	fillArea(){
		let c = this.corners();
		for(let x = c.left; x < c.right; x+=16) for(let y = c.top; y < c.bottom; y+=16) {
			game.setTile(x, y, game.tileCollideLayer, 1);
		}
	}
}

self["Soil"] = Soil;