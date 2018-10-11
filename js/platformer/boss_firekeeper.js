class FireKeeper extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = 64;
		
		this.addModule(mod_rigidbody);
		this.addModule(mod_combat);
		this.addModule(mod_boss);
		
		this.life = this.lifeMax = 1;
		this.deathTrigger = ops.getString("deathtrigger", "firekeeperdeath");
		
		this.on("destroy", function(){
			Trigger.activate(this.deathTrigger);
		});
		this.on("death", function(){
			this.destroy();
		});
	}
	render(g,c){
		g.color = [1.0,0.8,0.0,1.0];
		g.drawRect(
			this.position.x - 32 - c.x,
			this.position.y - 32 - c.y,
			this.width,
			this.height,
			this.zIndex
		);
	}
}

self["FireKeeper"] = FireKeeper;