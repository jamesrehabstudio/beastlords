class Statue extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.sprite = "statue_player";
		
		this.finished = ops.getBool("finished", false);
		this.variable = ops.getString("variable", "somestatuevar");
		
		this.completed = !!NPC.get(this.variable);
		this.frame = new Point(1, 0);
		this.visible = this.completed || !this.finished;
		this.blockcount = (this.width/16) * (this.height/16);
		
		
		if(this.completed){
			this.frame.x = 0;
			this.clearAllTiles();
			if(!this.finished) { this.visible = false; }
		}
		
		if(!this.finished){
			this.on("struck", function(obj, rect){
				if(obj instanceof Player){
					
					let c = this.corners();
					let played = false;
					
					let start = new Point( Math.max(c.left, rect.start.x), Math.max(c.top, rect.start.y) );
					let end = new Point( Math.min(c.right, rect.end.x), Math.min(c.bottom, rect.end.y) );
					
					let x_seg = 1 / Math.max(1, (end.x-start.x)/16);
					let y_seg = 1 / Math.max(1, (end.y-start.y)/16);
					
					for(let dx = 0; dx <= 1; dx += x_seg){
						for(let dy = 0; dy <= 1; dy += y_seg){
							
							let x = Math.clamp( Math.lerp(start.x, end.x, dx), c.left + 1, c.right - 1 );
							let y = Math.clamp( Math.lerp(start.y, end.y, dy), c.top + 1, c.bottom - 1 );
							
							let t = game.getTile(x,y);
							
							if(t > 0){
								if(!played){
									audio.play("crash", this.position);
									played = true;
								}
								game.setTile(x,y,game.tileCollideLayer,0);
								this.blockcount--;
								
								ParticleSystem.rocks(x,y);
								
								if(this.blockcount <= 0){
									this.trigger("complete");
								}
							}
						}
					}
					
					
				}
			});
		}
		
		this.on("complete", function(){
			NPC.set(this.variable, 1);
			this.completed = true;
			this.frame.x = 0;
			this.clearAllTiles();
		});
		
	}
	clearAllTiles(){
		let c = this.corners();
		
		for(let x = c.left; x < c.right; x += 16){
			for(let y = c.top; y < c.bottom; y += 16){
			
				game.setTile(x,y,game.tileCollideLayer,0);
				
			}
		}
	}
}

self["Statue"] = Statue;