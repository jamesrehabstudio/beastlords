class WhipPoint extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "items";
		this.frame = new Point(15, 4);
		this.width = d[0];
		this.height = d[1];
		this.zIndex = -9;
		
		this.on("struck", function(obj, line){
			obj.trigger("whip_point_hit", this, line.center().floor(16,16));
		});
	}
	render(){}
	postrender(g,c){
		super.render(g,c);
	}
}
self["WhipPoint"] = WhipPoint;

class MetalHook extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "items";
		this.frame = new Point(15, 4);
		this.width = d[0];
		this.height = d[1];
		this.zIndex = -9;
	}
}
self["MetalHook"] = MetalHook;

class ElectricBox extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "items";
		this.frame = new Point(15, 4);
		this.width = 32;
		this.height = 32;
		this.zIndex = -9;
		
		this.targets = ops.getList("target", []);
		
		this.on("flashSpell", function(spell){
			Trigger.activate(this.targets);
		});
	}
	render(g,c){
		let corners = this.corners();
		g.drawRect(corners.left-c.x, corners.top-c.y, this.width, this.height, this.zIndex);
	}
}
self["ElectricBox"] = ElectricBox;
/*
class PlayerWhipPiece extends GameObject{
	get topParent(){ if(this.parent instanceof PlayerWhipPiece) { return this.parent.topParent; } return this; }
	constructor(x,y,parent, target){
		super(x,y);
		this.position.x = x;
		this.position.y = y;
		this.widht = this.height = PlayerWhipPiece.WHIP_PIECE_LENGTH;
		this.parent = parent;
		this.target = target;
		this.child = null;
		
		//this.addModule(mod_rigidbody);
		this.friction = 0;
		this.force = new Point();
		this.elasticity = .25;
		this.pushable = false;
		this.zIndex = 2;
		
		this.stepper = 0.0;
		
		if(this.parent instanceof PlayerWhipPiece){
			this.parent.child = this;
		}
	}
	destroy(){
		if(this.parent instanceof PlayerWhipPiece){
			this.parent.destroy();
		}
		super.destroy();
	}
	idle(){}
	update(){
		this.stepper -= this.delta;
		if(this.stepper <= 0){
			this.stepper += PlayerWhipPiece.STEP;
			this.step();
		}
	}
	step(){
		let dif = this.target.position.subtract(this.position);
		let dir = dif.normalize();
		
		let gotopos = this.parent.position.add(dir.scale(PlayerWhipPiece.WHIP_PIECE_LENGTH));
		let move = gotopos.subtract(this.position);
		
		move.x = Math.clamp(move.x, -PlayerWhipPiece.MAXSPEED, PlayerWhipPiece.MAXSPEED);
		move.y = Math.clamp(move.y, -PlayerWhipPiece.MAXSPEED, PlayerWhipPiece.MAXSPEED);
		
		game.t_move(this, move.x, move.y);
	}
	render(g,c){
		g.renderLine(
			this.position.subtract(c),
			this.parent.position.subtract(c),
			2, COLOR_BLACK, this.zIndex
		);
		g.renderLine(
			this.position.subtract(c),
			this.parent.position.subtract(c),
			1, COLOR_WHIP, this.zIndex+1
		);
	}
}
PlayerWhipPiece.create = function(parent, target){
	let startPos = parent.position;
	for(let i=0; i < 80 / PlayerWhipPiece.WHIP_PIECE_LENGTH; i++){
		let d = i / 20.0;
		let x = Math.lerp(startPos.x, target.position.x, d);
		let y = Math.lerp(startPos.y, target.position.y, d);
		parent = game.addObject(new PlayerWhipPiece(x, y, parent, target));
	}
	return parent;
}
PlayerWhipPiece.MAXSPEED = 8;
PlayerWhipPiece.STEP = 1/60;
PlayerWhipPiece.FRICTION = 1.00;
PlayerWhipPiece.SPRING = 0.06;
PlayerWhipPiece.TENSION = 0.8;
PlayerWhipPiece.TRANSFER_UP = 1.0;
PlayerWhipPiece.WHIP_PIECE_LENGTH = 6;
*/