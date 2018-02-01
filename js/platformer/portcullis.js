class Portcullis extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.origin = new Point(0,0);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		
		this.force = new Point(0,0);
		this.closeDelay = Game.DELTASECOND * 0.0625;
		this._closeTime = this.closeDelay;
		this._open = false;
		
		
		Block.prototype.gatherTiles.apply(this, [true]);
		
		this._ylimitDown = this.position.y;
		this._ylimitUp = this.position.y;
		for(let i=1; i < 64; i++){
			let tile = game.getTile(
				this.position.x + this.width * 0.5,
				this.position.y - i * 16
			);
			if(tile == 0){
				this._ylimitUp -= 16;
			} else {
				break;
			}
		}
		
		this.addModule(mod_block);
		
		if("trigger" in ops) {
			this._tid = ops["trigger"];
		}
		
		this.on("activate", function(){
			this._open = true;
			this._closeTime = this.closeDelay;
		});
		
		this.on("collideObject", function(obj){
			if(this.force.y > 0.5 && obj.hasModule(mod_rigidbody)){
				var dir = this.position.subtract(obj.position);
				if(dir.x > 0){
					obj.position.x = this.position.x - obj.width;
				} else {
					obj.position.x = this.position.x + obj.width;
				}
			}
		});
	}
	
	update(){
		if(this._open){
			this._closeTime -= this.delta;
			this.force.y -= this.delta * 1.0;
			
			if(this._closeTime <= 0){
				this._open = false;
			}
		} else {
			this.force.y += this.delta * 1.0;
		}
		
		this.force.y = Math.max(Math.min(this.force.y, 10),-10);
		this.position.y += this.delta * this.force.y;
		
		if(this.force.y > 0){
			if(this.position.y >= this._ylimitDown){
				this.force.y = 0;
				this.position.y = this._ylimitDown;
			}
		} else {
			if(this.position.y <= this._ylimitUp){
				this.force.y = 0;
				this.position.y = this._ylimitUp;
			}
		}
		
	}
	
	idle(){}
	
	render(g,c){
		Block.prototype.render.apply(this, [g,c]);
	}
}
self.Portcullis = Portcullis;