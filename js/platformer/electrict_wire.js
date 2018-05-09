class ElectricWire extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.startPosition = this.position.scale(1);
		
		this.sprite = "items";
		this.frame = new Point(10,1);
		
		this.speed = 1;
		
		this.width = 12;
		this.height = 12;
		
		this.path = d;
		
		this._progress = 0.0;
		this._point = -1;
		this._distance = 1.0;
		
		this.damage = this.damageFire = this.damageSlime = this.damageIce = this.damageFixed = 0;
		this.damageLight = 12;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				obj.hurt(this);
			}
		});
		
		this.next();
	}
	next(){
		this._progress = 0;
		this._point = (this._point+1) % this.path.length;
		let last = this.path[ this._point ];
		let next = this.path[ this._point < this.path.length-1 ? this._point+1 : 0 ];
		this._distance = Math.max( last.subtract(next).length(), 0.1);
	}
	update(){
		this._progress += (this.speed * this.delta) / (this._distance / UNITS_PER_METER);
		if(this._progress >= 1){ this.next(); }
		
		let last = this.path[ this._point ];
		let next = this.path[ this._point < this.path.length-1 ? this._point+1 : 0 ];
		
		this.position = Point.lerp(last,next,this._progress).add(this.startPosition);
	}
	
}

self["ElectricWire"] = ElectricWire;