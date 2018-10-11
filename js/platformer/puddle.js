
class Puddle extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.origin.x = 0;
		this.origin.y = 1;
		this.position.x = x - d[0]*0.5;
		this.position.y = y + d[1]*0.5;
		
		this.width = d[0];
		this.height = d[1];
		this.speed = 0.25 * self.UNITS_PER_METER;
		this.emptyOnStart = 0;
		this.resetOnSleep = 0;
		this.triggersave = false;
		this.waterBuoyancy = 2.0;
		
		this.fullheight = this.height;
		this.waveSize = 0;
		this.waveFrequency = 0;
		this.waveSpeed = 0;
		
		this.active = 0;
		this.filling = 0;
		this.noFill = 0;
		this.noDrain = 0;
		this._drainTileTest = 0;
		
		this.color1 = [0.74,0.75,0.8,1.0];
		this.color2 = [0.95,0.96,1.0,1.0];		
		
		this._ignoreList = new Array();
		this._nextIgnoreList = new Array();
		
		this._stepTime = this.stepTimeTotal = 0.0625;
		this.drainPos = this.width * 0.5;
		this.viscosity = 0.25;
		this.electrified = 0.0;
		
		this.buldges = [
			{x:0,speed:0,width:0,height:0,time:0},
			{x:0,speed:0,width:0,height:0,time:0},
			{x:0,speed:0,width:0,height:0,time:0},
			{x:0,speed:0,width:0,height:0,time:0},
			{x:0,speed:0,width:0,height:0,time:0},
			{x:0,speed:0,width:0,height:0,time:0},
		];
		
		
		this.on("collideObject", function(obj){
			let xpos = obj.position.x - this.position.x;
			
			if( obj.hasModule(mod_rigidbody) && obj.gravity > 0){
				if(this._ignoreList.indexOf(obj) < 0){
					if(obj.force.y > 2){
						this._nextIgnoreList.push(obj);
						this.addBuldge(xpos, obj.force.y * obj.mass);
					}
				}
			}
			if(this.electrified > 0 && obj.hasModule(mod_combat)){
				if( obj.defenceLight < 99) {
					let damage = Combat.getDamage.apply(this);
					damage.light = 15;
					obj.hurt(this, damage);
				}
			}
			if(obj instanceof ElectricWire || obj instanceof Shockcrawler){
				this.electrified = 0.25;
				if(this._stepTime <= 0){
					this.addBuldge(xpos, 8 + Math.random() * 5);
				}
			}
		});
		
		ops = ops || new Options();
		
		if("trigger" in ops){
			this._tid = ops.trigger;
		}
	}
	update(){
		this._ignoreList = this._nextIgnoreList;
		this._nextIgnoreList = new Array();
		
		if(this._stepTime <= 0) {this._stepTime = this.stepTimeTotal; }
		this._stepTime -= this.delta;
		
		for(let j=0; j < this.buldges.length; j++){
			if(this.buldges[j].height > 0){
				this.buldges[j].time += this.delta;
				this.buldges[j].height -= this.delta * 16 * this.viscosity;
				this.buldges[j].x += this.buldges[j].speed * this.delta * UNITS_PER_METER;
				
				if(this.buldges[j].x < 0) {
					this.buldges[j].x = 0;
					this.buldges[j].speed *= -0.8
				}
				if(this.buldges[j].x > this.width) {
					this.buldges[j].x = this.width;
					this.buldges[j].speed *= -0.8
				}
			}
		}
		
		this.electrified -= this.delta;
		
		if(this.electrified > 0.0){
			this.glow(64,COLOR_LIGHTNING);
		}
	}
	glow(radius, color){
		Background.pushLightArea(new Line(
			this.position.x,
			this.position.y - this.height,
			this.position.x + this.width,
			this.position.y 
		),radius,color);
	}
	addBuldge(xpos, force){
		force = Math.abs(force);
		
		let w = Math.min(force, 16) * 2;
		let h = w * 1 * this.viscosity;
		let s = 4 * force * (this.viscosity * 0.5);
		let a = [ 
			{x:xpos-8,speed:s,width:w,height:h,time:0},
			{x:xpos+8,speed:-s,width:w,height:h,time:0},
		];
		
		for(let i=0; i < a.length; i++){
			
			let lowest = a[i].height;
			let lowestIndex = -1;
			
			for(let j=0; j < this.buldges.length; j++){
				if(this.buldges[j].height < lowest ){
					lowest = this.buldges[j].height;
					lowestIndex = j;
				}
			}
			
			if(lowestIndex >= 0){
				this.buldges[lowestIndex] = a[i];
			}
		}
	}
	floatObject(obj){
		let top = this.corners().top;
		let buoyancy = Math.clamp01( ( (obj.position.y + 16) - top ) / 80 );
		let pushUp = Math.lerp(0.0, this.waterBuoyancy, buoyancy);
		
		if(obj.grounded){
			obj.grounded = false;
			obj.force.y = 0.0;
		}
		
		obj.force.y -= pushUp * UNITS_PER_METER * this.delta;
		obj.force.y = Math.clamp( obj.force.y, -10, 5 );
		
		if(obj instanceof Player){
			obj.states.ledgePosition = false;
			if(obj.delta > 0 && input.state("jump") == 1){
				obj.jump();
			}
		}
	}
	buldgeToArray(i){
		return [
			this.buldges[i].x,
			this.buldges[i].width,
			this.buldges[i].height * Math.clamp01(this.buldges[i].time * 5),
		];
	}
	render(g,c){}
	objectpostrender(g,c){
		let margin = 32;
		
		g.renderSprite(
			"ooze", 
			this.position.subtract(new Point(0,this.height+margin)).subtract(c),
			this.zIndex,
			new Point(),
			false,
			{
				"u_size" : [this.width, this.height+margin],
				"u_resolution" : [game.resolution.x, game.resolution.y],
				"scalex" : this.width / 256.0,
				"scaley" : (this.height+margin) / 256.0,
				"u_color" : this.color1,
				"u_highlight" : this.color2,
				"u_buldge1" : this.buldgeToArray(0),
				"u_buldge2" : this.buldgeToArray(1),
				"u_buldge3" : this.buldgeToArray(2),
				"u_buldge4" : this.buldgeToArray(3),
				"u_buldge5" : this.buldgeToArray(4),
				"u_buldge6" : this.buldgeToArray(5),
				"u_wavefreq" : this.waveFrequency,
				"u_waves" : this.waveSize,
				"u_time" : game.timeScaled * this.waveSpeed
			}
		)
		
		
		/*
		if(this.active){
			for(var x=0; x < this.width; x+=16){
				var pos = new Point(
					x + Math.round(this.position.x/16)*16,
					this.position.y - this.height
				);
				var _t = 0;
				if(x>0) _t += 1;
				if(x+16>=this.width) _t += 1;
				var tile = Drain.TILES[_t]-1;
				var tilex = tile%32;
				var tiley = Math.floor(tile/32);
				g.renderSprite(game.map.tileset,pos.subtract(c),this.zIndex,new Point(tilex,tiley));
				
				//Render bottom row of tiles to hide edge
				var tile = game.getTile(this.position.x+x,this.position.y+8,game.tileCollideLayer) - 1;
				g.renderSprite(game.map.tileset,this.position.add(new Point(x,0)).subtract(c),this.zIndex,new Point(tile%32,tile/32));
			}
		}
		*/
	}
}
self["Puddle"] = Puddle;