class Teleporter extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 48;
		this.sprite = "gate";
		this.zIndex = 99;
		
		this.frame = new Point(4,0);
		
		this.visible = ops.getBool("visible", true);
		
		this.teleportPosition = new Point(
			ops.getFloat("tpx", x),
			ops.getFloat("tpy", y)
		);
		
		this.on("collideObject", function(obj){
			if(Teleporter.cooldown < game.time){
				if(obj instanceof Player && this.delta > 0 && input.state("up") == 1){
					obj.position = this.teleportPosition.scale(1);
					Teleporter.cooldown = game.time;
				}
			}
		});
	}
}
Teleporter.cooldown = 0.0;

self["Teleporter"] = Teleporter;