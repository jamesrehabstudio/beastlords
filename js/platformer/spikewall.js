class SpikeWall extends GameObject {
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 64;
		this.height = d[1];
		this.sprite = "spikewall";
		
		this.delayTime = o.getFloat("delaytime", 3.0) * Game.DELTASECOND;
		this.moveTime = o.getFloat("moveTime", 0.5);
		this.damageFixed = o.getInt("damage",12);
		this.timeOffset = o.getFloat("timeoffset",0.0);
		this.shakeTime = o.getFloat("shaketime",0.5);
		this.horizontal = o.getBool("horizontal", false);
		
		this._active = true;
		this._anim = 0.0;
		this._delay = 2.0;
		this._shake = 0.0;
		
		if(this.horizontal){
			this.width = d[0];
			this.height = 64;
		}
		
		this.on("collideObject",function(obj){
			if(this.frame.y <= 1 || this.frame.y >= 6){
				if(obj instanceof Player){
					obj.hurt( this, Combat.getDamage.apply(this) );
				}
			}
		});
	}
	update(){
		let total = (this.delayTime + this.moveTime) * 2.0;
		let time = ( game.timeScaled + this.timeOffset ) % total;
		
		this._shake = 0.0;
		
		if(time < this.delayTime){
			//Rest open
			this._anim = 0.0;
			if(time > this.delayTime - this.shakeTime ) { this._shake = 1.0; }
		} else if(time < this.delayTime + this.moveTime) {
			//Moving to close
			this._anim = 0.0 + 0.5 * ( ( time - this.delayTime ) / this.moveTime );
		} else if(time < this.delayTime * 2.0 + this.moveTime) {
			//Rest closed
			this._anim = 0.5;
			if(time > (this.delayTime * 2.0 + this.moveTime) - this.shakeTime ) { this._shake = 1.0; }
		} else {
			//Moving to open
			this._anim = 0.5 + 0.5 * ( ( time - (this.delayTime * 2.0 + this.moveTime) ) / this.moveTime );
		}
		
		this.frame.y = Math.floor( this._anim * 7 );
	}
	render(){}
	postrender(g,c){
		let shake = new Point( 0.5-Math.random(), 0.5-Math.random() ).scale(2 * this._shake);
		if(this.horizontal){
			for(let x = 0; x < this.width; x+=16){
				g.renderSprite(
					this.sprite,
					this.position.add(shake).add(new Point(x - this.width*0.5 + 16,0)).subtract(c),
					this.zIndex,
					this.frame,
					this.flip,
					{"rotation" : 90}
				);
			}
		} else {
		
			for(let y = 0; y < this.height; y+=16){
				g.renderSprite(
					this.sprite,
					this.position.add(shake).add(new Point(0,y-this.height*0.5)).subtract(c),
					this.zIndex,
					this.frame,
					this.flip
				);
			}
		}
	}
}

self["SpikeWall"] = SpikeWall;