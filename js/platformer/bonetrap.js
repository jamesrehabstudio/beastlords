class BoneTrap extends GameObject {
	constructor(x,y,d,o){
		super(x,y,d,o);
		this.position.x = x;
		this.position.y = y;
		this.width = 64;
		this.height = 16;
		this.zIndex = 99;
		this.sprite = "bonetrap";
		
		this.strength = 4.5;
		
		this._life = 0.0;
		this._rest = 0.0;
		this._caught = null;
		
		this.hands = [
			{x:4, frame:new Point(0,1), z:-1 },
			{x:16, frame:new Point(0,2), z:-1 },
			{x:-8, frame:new Point(0,3), z:-1 }
		];
		
		this.on("collideObject",function(obj){
			if(this._rest <= 0 && this._life <= 0 ){
				if(obj instanceof Player){
					this._caught = obj;
					this._life = 8.0;
				}
			}
		});
	}
	update(){
		if(this._life > 0){
			if(this._caught) {
				
				if(this.delta > 0){
					//Struggle 
					if(input.state("jump") == 1) { this._life -= 0.25; }
					if(input.state("left") == 1) { this._life -= 0.25; }
					if(input.state("right") == 1) { this._life -= 0.25; }
					if(input.state("left") > 1) { this._life -= this.delta * 0.5; }
					if(input.state("right") > 1) { this._life -= this.delta * 0.5; }
				}
				
				this._caught.position.x = Math.lerp(this._caught.position.x, this.position.x, this.delta * this.strength);
				this._caught.force.y = Math.max(this._caught.force.y, 0);
				
				this._life -= this.delta;
				
				if(this._life <= 0){
					this.release();
				}
			}
		} else if(this._rest > 0){
			this._rest -= this.delta;
		}
	}
	release(){
		this._caught = null;
		this._life = 0.0;
		this._rest = 2.0;
	}
	render(g,c){
		super.render(g,c);
		
		if( this._caught ){
			let reach = Math.lerp(24, 0, 1.0 );
			
			for(let i=0; i < this.hands.length; i++){
				let pos = new Point( this._caught.position.x + this.hands[i].x, this.position.y + reach );
				g.renderSprite(this.sprite, pos.subtract(c), this.zIndex + this.hands[i].z, this.hands[i].frame, this.flip );
			}
		}
	}
}

self["BoneTrap"] = BoneTrap;