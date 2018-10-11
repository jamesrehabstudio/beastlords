class FireFly extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.position.x = x;
		this.position.y = y;
		this.sprite = "circle256";
		this.width = this.height = 8;
		
		this.addModule( mod_rigidbody );
		this.pushable = false;
		this.collisionReduction = -0.95;
		this.bounce = 0.95;
		this.gravity = 0.5;
		this.friction = 0.025;
		this.createSmokeTrail = true;
		
		this.color = [1.0,0.5,0.1,1.0];
		this.lightRadius = 64.0;
		this.tailSpeed = 2.0;
		this.smokeFrequency = 4;
		this.tail = new Array();
		this.size = 4;
		
		this._smokeCount = 0;
		
		for(let i = 0; i < 5; i++ ){
			this.tail.push( {
				position : new Point(x,y),
				size : i / 5
			} );
		}
		
		this.on("sleep", function(){ this.destroy(); } )
	}
	update(){
		for(let i=0; i < this.tail.length; i++){
			this.tail[i].size -= this.delta * this.tailSpeed;
			
			if( this.tail[i].size <= 0){
				this._smokeCount++;
				
				if( this._smokeCount >= this.smokeFrequency){
					//Create smoke puff
					this._smokeCount = 0;
					Background.pushSmoke(this.position, this.size * 2, this.force.scale(0.8));
				}
				
				this.tail[i].size = 1 + this.tail[i].size;
				this.tail[i].position = this.position.scale(1);
			}
		}
		if( this.lightRadius > 0 ){
			Background.pushLight(this.position, this.lightRadius, this.color);
		}
		if( this.force.sqrMagnitude() < 0.125 ){
			this.destroy();
		}
	}
	render(g,c){
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, false, {u_color:this.color, scalex:this.size/256, scaley:this.size/256});
		for(let i=0; i < this.tail.length; i++){
			let t = this.tail[i];
			let s = t.size * this.size;
			g.renderSprite(this.sprite, t.position.subtract(c), this.zIndex, this.frame, false, {u_color:this.color, scalex:s/256, scaley:s/256});
		}
		
	}
}

createExplosion = function(pos, size){
	let smoke = Math.max(4 + size / 12, 6);
	let flies = Math.max(2 + size / 28, 2);
	
	for(let i=0; i < flies; i++){
		let ff = new FireFly(pos.x, pos.y);
		ff.force = new Point( Math.random() - 0.5, Math.random() - 0.5 );
		ff.force = ff.force.normalize(5 + Math.min( 0.125 * size, 3.0) );
		
		game.addObject(ff);
	}
	for(let i=0; i < smoke; i++){
		let direction = new Point( Math.random() - 0.5, Math.random() - 0.5 ).normalize();
		Background.pushSmoke( pos.add(direction.scale(size*0.25)), 16+(size/12)+Math.random()*16, direction.add(new Point(0,-0.5)).scale(0.8) );
	}
}