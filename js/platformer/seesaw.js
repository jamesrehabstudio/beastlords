class SeeSaw extends GameObject {
	constructor(x,y,path,ops){
		super(x,y,path,ops);
		
		this.position.x = x;
		this.position.y = y;
		
		this.sprite = "elevator";
		
		this.platformDistance = ops.getFloat("platformdistance", 88.0);
		this.force = ops.getFloat("force", 0.0);
		this.maxspeed = ops.getFloat("maxspeed", 16.0);
		this.canmove = ops.getBool("canmove",true);
		this._tid = ops.getString("trigger",null);
		
		this.points = new Array();
		this.platforms = new Array();
		this.platformPosition = 0.0;
		this.moveForce = ops.getFloat("startforce", this.force);
		
		this.totalLength = 0.0;
		
		let top = 9999;
		let bot = -9999;
		let left = 9999;
		let right = -9999;
		
		for(let i=0; i < path.length; i++){
			let distance = 0.0;
			
			if(i > 0){
				distance = path[i-1].subtract(path[i]).magnitude();
				this.totalLength += distance;
			}
			
			this.points.push ( path[i].add( this.position ) );
			
			top = Math.min(this.points[i].y, top);
			bot = Math.max(this.points[i].y, bot);
			left = Math.min(this.points[i].x, left);
			right = Math.max(this.points[i].x, right);
		}
		
		let margin = 16;
		this.width = Math.abs(left - right) + margin * 2;
		this.height = Math.abs(top - bot) + margin * 2;
		this.position.x = Math.lerp(left,right,0.5) - margin;
		this.position.y = Math.lerp(top,bot,0.5) - margin;
		
		
		let div = this.totalLength / Math.round(this.totalLength / this.platformDistance);
		
		for(let i=0; i < this.totalLength; i += div){
			this.platforms.push( {
				"wiggle" : 0.0,
				"delta" : (i / this.totalLength),
				"standing" : new Array(),
				"lastx" : this.position.x
			} );
		}
		
		this.on("activate", function(){
			this.canmove = true;
		});
		
		this.on("collideObject", function(obj){
			if( obj.hasModule(mod_rigidbody) && obj.gravity > 0){
				if(!obj.grounded && obj.force.y > 0 && obj.pushable){
					
					for(let i=0; i < this.platforms.length; i++){
						let p = this.getPlatformPosition(i);
						
						if( Math.abs( p.x - obj.position.x ) < (obj.width*0.5+16) ) {
							
							let f = obj.force.y * UNITS_PER_METER * obj.deltaPrevious * 1.2;
							let b = obj.corners().bottom;
							
							if(b >= p.y && obj.positionPrevious.y <= p.y){
								this.platforms[i].wiggle = Math.clamp01(obj.force.y * 0.125);
								
								obj.trigger("collideVertical", 1);
								//obj.grounded = true;
								this.platforms[i].standing.push(obj);
								
							}
						}
						
					}
					
				}
			}
		});
	}
	getPlatformPosition(index){
		return this.getPosition( Math.mod( this.platforms[index].delta + this.platformPosition, 1.0 ) );
	}
	getPosition(delta=0.0){
		let ddis = this.totalLength * delta;
		
		let curdis = 0.0;
		for(let i=1; i < this.points.length; i++){
			let distance = this.points[i-1].subtract(this.points[i]).magnitude(); 
			
			if(curdis + distance >= ddis){
				let d = ddis - curdis;
				let e = 1.0 - ( d / distance );
				let direction = this.points[i-1].subtract( this.points[i] ); 
				
				return this.points[i].add( direction.scale( e ) );
			}
			
			curdis += distance;
		}
		return this.position;
	}
	getPositionNormal(delta=0.0){
		let ddis = this.totalLength * delta;
		
		let curdis = 0.0;
		for(let i=1; i < this.points.length; i++){
			let distance = this.points[i-1].subtract(this.points[i]).magnitude(); 
			
			if(curdis + distance >= ddis){
				return this.points[i-1].subtract(this.points[i]).normalize();
			}
			
			curdis += distance;
		}
		return this.position;
	}
	update(){
		
		this.moveForce = Math.clamp ( this.moveForce + this.delta * this.force * 8.0, -this.maxspeed, this.maxspeed );
		
		for(let i=0; i < this.platforms.length; i++){
			if(this.platforms[i].standing.length >= 0){
			
				let d = Math.mod( this.platforms[i].delta + this.platformPosition, 1.0 );
				let p = this.getPosition(d);
				let n = this.getPositionNormal(d);
				
				for(let j=0; j < this.platforms[i].standing.length; j++){
					let obj = this.platforms[i].standing[j];
					
					if(obj instanceof Player){
						obj.camera_narrowVRange = Math.clamp01(obj.camera_narrowVRange + this.delta * 5.0);
						//obj.camera_narrowVRange = 3.0;
					}
					
					if( !obj._isAdded || (!obj.grounded && obj.force.y < 0) || Math.abs(p.x - obj.position.x) > (obj.width*0.5+16) ){
						//Remove object
						this.platforms[i].standing.remove(j);
						j--;
					} else {
						//Apply weight
						obj.position.y = p.y - obj.height * ( 1 - obj.origin.y );
						obj.position.x += p.x - this.platforms[i].lastx;
						obj.force.y = 0;
						obj.trigger("collideVertical", 1);
						//obj.grounded = true;
						
						let dot = n.dot( new Point(0.0,-1.0) );
						this.moveForce = Math.clamp ( this.moveForce + this.delta * dot * 8.0, -this.maxspeed, this.maxspeed );
					}
				}
				this.platforms[i].wiggle *= 1.0 - 0.8 * this.delta;
				this.platforms[i].lastx = p.x;
			}
		}
		
		let friction = 1 - this.delta * 0.3; 
		this.moveForce = this.moveForce * friction;
		let speed = this.moveForce * this.delta * ( 8.0 / this.totalLength );
		
		if(this.canmove){
			this.platformPosition = Math.mod( this.platformPosition + speed, 1.0);
		}
	}
	render(g,c){
		
		for(let i=0; i < this.platforms.length; i++){
			let rotation = Math.sin(i + game.timeScaled * 8) * this.platforms[i].wiggle * 45;
			g.renderSprite(this.sprite, this.getPlatformPosition(i).subtract(c), this.zIndex, this.frame, this.flip, {"rotation":rotation} );
		}
	}
}

self["SeeSaw"] = SeeSaw;