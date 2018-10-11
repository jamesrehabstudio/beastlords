class MapTemple1Door extends GameObject {
	get locked(){ return NPC.get("maptemple1door_lock") == 1; }
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this._lockdelay = 0.0;
		this._target = null;
		
		this.on("collideObject",function(obj){
			if(obj instanceof Player){
				if(this.locked && obj.force.x > 0){
					obj.position.x = Math.min(
						this.corners().left - obj.width * 0.5,
						obj.position.x
					);
					obj.trigger("collideHorizontal", 1);
				} else {
					if(!NPC.get("maptemple1door_lock")){
						if( obj.downstab ){
							this._target = obj;
							this._lockdelay = 0.5 * Game.DELTASECOND;
						}
					}
				}
				
			}
		});
	}
	update(){
		if(this._target && this._lockdelay > 0){
			this._lockdelay -= this.delta;
			
			if(this._target.position.x > this.position.x){
				this._target = null;
				this._lockdelay = 0.0;
			} else if(this._lockdelay <= 0){
				NPC.set("maptemple1door_lock", 1);
			}
		}
	}
	render(g,c){
		if(this.locked){
			g.color = [0.8,0.2,0.0,1.0];
			g.drawRect(
				this.position.x - this.width*0.5 - c.x,
				this.position.y - this.height*0.5 - c.y,
				this.width,
				this.height,
				this.zIndex
			);
		}
	}
}
self["MapTemple1Door"] = MapTemple1Door;

class MapTemple1Switch extends GameObject {
	get locked(){ return NPC.get("maptemple1door_lock") == 1; }
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.sprite = "switch_pressure";
		
		this._time = 0.0;
		
		this._target = null;
		this._door = null;
		
		this.on("collideObject",function(obj){
			if(obj instanceof Player){
				if(this.locked){
					if(obj.grounded){
						//press button
						this._door = game.getObject(MapTemple1Door);
						this._target = obj;
						this._target.pause = true;
						
					} else {
						obj.position.x = Math.min(obj.position.x, this.position.x+20);
					}
				}
			}
		});
	}
	idle(){}
	update(){
		if(this.locked && !this._door){
			this.frame.x = Math.clamp(this.frame.x - game.deltaUnscaled*8, 0, 2);
		} else {
			this.frame.x = Math.clamp(this.frame.x + game.deltaUnscaled*8 , 0, 2);
		}
		if(this._door && this._time < 5){
			this._time += this.delta;
			
			if(this._time >= 2 && this._time < 3){
				cameraLookat(this._door.position);
			} else if(this._time >= 3 && this._time < 4){
				NPC.set("maptemple1door_lock", 2);
			} else if(this._time >= 4 && this._time < 5){
				cameraLookat();
			} else {
				//cameraLookat();
				this._target.pause = false;
			}
		}
	}
	render(g,c){
		let pos = this.corners();
		g.renderSprite(this.sprite, new Point(this.position.x, pos.bottom).subtract(c), this.zIndex, this.frame, false);
	}
}

self["MapTemple1Switch"] = MapTemple1Switch;