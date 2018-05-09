class ChainFace extends GameObject {
	get reach(){ if(this.direction % 2 == 0){ return this.height; } return this.width; } 
	set reach(v){ if(this.direction % 2 == 0){ return this.height = v; } return this.width = v; } 
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "chainface";
		
		this.addModule(mod_combat);
		
		this.direction = ops.getInt("direction",0);
		this.speed = ops.getFloat("speed",6.0);
		this.delay = ops.getFloat("delay",2.5);
		this.damage = ops.getInt("damage",10);
		
		this.rotation = 0.0;
		this.fullreach = 24;
		this.minreach = 16;
		
		this.width = this.minreach;
		this.height = this.minreach;
		
		if(this.direction == 0){
			this.fullreach = d[1];
			this.origin.y = 1;
			this.width = 48;
			this.position.y = y + d[1] * 0.5;
		} else if(this.direction == 1){
			this.fullreach = d[0];
			this.origin.x = 0;
			this.height = 48;
			this.position.x = x - d[0] * 0.5;
			this.rotation = 90;
		} else if(this.direction == 2){
			this.fullreach = d[1];
			this.origin.y = 0;
			this.width = 48;
			this.position.y = y - d[1] * 0.5;
			this.rotation = 180;
		} else if(this.direction == 3){
			this.fullreach = d[0];
			this.origin.x = 1;
			this.height = 48;
			this.position.x = x + d[0] * 0.5;
			this.rotation = 270;
		}
		
		this._delay = 0.0;
		this._extend = true;
		this._extending = false;
		this._overshoot = 0.0;
		
		this.on("collideObject", function(obj){
			if(obj.hasModule(mod_combat) && obj.team != this.team){
				obj.hurt(this, this.getDamage());
			}
		});
	}
	update(){
		if(this._overshoot > 0){
			this._overshoot -= this.delta * ChainFace.OVERSHOOT_RECALL;
		}
		
		if(this._delay > 0){
			this._delay -= this.delta;
		} else if(!this._extend) {
			//Withdraw
			this.reach = this.reach - this.delta * this.speed * UNITS_PER_METER;
			if(this.reach <= this.minreach){
				this.reach = this.minreach;
				this._extend = true;
				this._delay = this.delay;
			}
		} else if( this._extending || this.targetInRange( this.target().position ) ) {
			//Target within area
			this.reach = this.reach + this.delta * this.speed * UNITS_PER_METER;
			this._extending = true;
			if(this.reach >= this.fullreach){
				this.reach = this.fullreach;
				this._extend = false;
				this._delay = this.delay;
				this._extending = false;
				this._overshoot = ChainFace.OVERSHOOT;
				shakeCamera(0.2, 1);
			}
		} else {
			//Idle
		}
	}
	targetInRange(pos){
		if(this.direction % 2 == 0){
			//vert
			return Math.abs(this.position.x - pos.x) < 56;
		} else {
			//Horz
			return Math.abs(this.position.y - pos.y) < 56;
		}
	}
	render(g,c){
		if(this.direction == 0){
			//Bottom to top
			let top = this.corners().top;
			g.renderSprite(this.sprite, new Point(this.position.x,top).subtract(c), this.zIndex, this.frame, false, {"rotation":this.rotation});
			for(let i=24; i < this.reach; i+=24){
				let os = Math.lerp(-this._overshoot,0, Math.clamp01(i/ChainFace.OVERSHOOT_RANGE)) + i;
				g.renderSprite(this.sprite, new Point(this.position.x,top+os).subtract(c), this.zIndex, new Point(0,1), false, {"rotation":this.rotation});
			}
		} else if(this.direction == 1){
			//Right to left
			let right = this.corners().right;
			g.renderSprite(this.sprite, new Point(right,this.position.y).subtract(c), this.zIndex, this.frame, false, {"rotation":this.rotation});
			for(let i=24; i < this.reach; i+=24){
				let os = Math.lerp(-this._overshoot,0, Math.clamp01(i/ChainFace.OVERSHOOT_RANGE)) + i;
				g.renderSprite(this.sprite, new Point(right-os,this.position.y).subtract(c), this.zIndex, new Point(0,1), false, {"rotation":this.rotation});
			}
		} else if(this.direction == 2){
			//Top to bottom
			let bottom = this.corners().bottom;
			g.renderSprite(this.sprite, new Point(this.position.x,bottom).subtract(c), this.zIndex, this.frame, false, {"rotation":this.rotation});
			for(let i=24; i < this.reach; i+=24){
				let os = Math.lerp(-this._overshoot,0, Math.clamp01(i/ChainFace.OVERSHOOT_RANGE)) + i;
				g.renderSprite(this.sprite, new Point(this.position.x,bottom-os).subtract(c), this.zIndex, new Point(0,1), false, {"rotation":this.rotation});
			}
		} else {
			//Left to right
			let left = this.corners().left;
			g.renderSprite(this.sprite, new Point(left,this.position.y).subtract(c), this.zIndex, this.frame, false, {"rotation":this.rotation});
			for(let i=24; i < this.reach; i+=24){
				let os = Math.lerp(-this._overshoot,0, Math.clamp01(i/ChainFace.OVERSHOOT_RANGE)) + i;
				g.renderSprite(this.sprite, new Point(left+os,this.position.y).subtract(c), this.zIndex, new Point(0,1), false, {"rotation":this.rotation});
			}
		}
	}
}
ChainFace.OVERSHOOT = 16;
ChainFace.OVERSHOOT_RANGE = 128;
ChainFace.OVERSHOOT_RECALL = 40;

self["ChainFace"] = ChainFace;