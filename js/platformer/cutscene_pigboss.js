class CutscenePigboss extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "cutscene_pigintro";
		this.zIndex = 1001;
		
		this._time = 0.0;
		game.pause = true;
	}
	idle(){}
	update(){
		this._time += game.deltaUnscaled;
		if(input.state("pause") == 1){
			this._time = 14;
		}
		if( this._time >= 14 ){
			game.pause = false;
			this.destroy();
		}
	}
	hudrender(g,c){
		let pos = game.resolution.scale(0.5);
		
		//Background
		if( this._time < 6.0 ){
			let s = 1 + (this._time * 0.03125);
			g.renderSprite(this.sprite, pos, this.zIndex, new Point(0,0), false, {
				"scalex" : s,
				"scaley" : s
			} );
		} else {
			g.renderSprite(this.sprite, pos, this.zIndex, new Point(0,1), false, {
				"u_color" : this.tint,
			} );
		}
		
		if( this._time < 2.0) {
			//wait
		} else if( this._time < 4.0) {
			//Eyes
			let t = this._time - 2;
			let p = Math.pingpong01( t * 2, 4 );
			let shift = Point.lerp(new Point(0,64), new Point(0,0), p**2);
			g.renderSprite(this.sprite, pos.add(shift), this.zIndex+1, new Point(0,2), false );
		} else if ( this._time < 6.0) {
			//Swoosh
			let t = this._time - 4.0;
			g.renderSprite(this.sprite, pos.add(new Point(0,144-t*1440)), this.zIndex+1, new Point(0,3), false, {
				"scalex" : (0.5 + t*4),
				"scaley" : (0.5 + t*4),
			} );
		} else if ( this._time < 8.0) {
			//Flex
			let t = this._time - 6.0;
			let p = Math.pingpong01( t*2, 4 );
			let shift = Point.lerp(new Point(0,144), new Point(0,0), p);
			g.renderSprite(this.sprite, pos.add(shift), this.zIndex+1, new Point(1,0), false );
		} else {
			//Pose
			let t = this._time - 8.0;
			let p = Math.clamp01( t * 1.25 );
			let shift = Point.lerp(new Point(256,0), new Point(0,0), p);
			shift.x += t * 2 - 6;
			g.renderSprite(this.sprite, pos.add(shift).add(new Point(this._time*4-48)), this.zIndex+1, new Point(1,2), false, {
				"u_color" : this.tint,
			} );
			g.renderSprite(this.sprite, pos.add(shift), this.zIndex+2, new Point(1,1), false, {
				"u_color" : this.tint,
			} );
		}
		
		//Draw chains
		if( this._time > 7.5 ){
			let t = this._time - 7.5;
			let a = -45 * Math.deg2rad;
			
			let v = -(this._time * 2.0) % 1.0;
			let o1 = new Point(Math.sin(a), Math.cos(a) ).scale(192 * v);
			let o2 = new Point(Math.sin(a), Math.cos(a) ).scale(192 * (1+v));
			let o3 = new Point(Math.sin(a), Math.cos(a) ).scale(192 * (2+v));
			let c = new Point(t * 256 - 192, 0);
			
			
			g.renderSprite(this.sprite, pos.add(o1).add(c), this.zIndex+3, new Point(1,3), false, {"rotation":-45} );
			g.renderSprite(this.sprite, pos.add(o2).add(c), this.zIndex+3, new Point(1,3), false, {"rotation":-45} );
			g.renderSprite(this.sprite, pos.add(o3).add(c), this.zIndex+3, new Point(1,3), false, {"rotation":-45} );
		}
		
		if( this._time > 13){
			let p = 1 - Math.clamp01( (this._time - 13) * 2 );
			this.tint = [p,p,p,1];
		}
		
		//Draw black barrier
		let w = Math.ceil ( (game.resolution.x - 256) * 0.5 );
		g.color = [0,0,0,1];
		
		g.drawRect(0,0,game.resolution.x,48,this.zIndex+10);
		g.drawRect(0,192,game.resolution.x,48,this.zIndex+10);
		g.drawRect(0,48,w,144,this.zIndex+10);
		g.drawRect(game.resolution.x-w,48,w,144,this.zIndex+10);
	}
}