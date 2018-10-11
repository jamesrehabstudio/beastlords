class FinalGuardian extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.width = d[0];
		this.height = d[1];
		this.addModule(mod_rigidbody);
		this.pushable = false;
		
		this.bossvars = [
			"boss_FireKeeper",
			"boss_Poseidon",
			"boss_PitMonster",
		];
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player) {
				if(this.allDead){
					//End demo
					this.rigidbodyActive = false;
					game.clearAll();
					game.addObject( new DemoThanks(0,0) );
				} else {
					obj.position.x = (
						this.corners().left - obj.width * 0.5
					);
				}
			}
		});
	}
	render(g,c){
		if(this.allDead){
			g.color = [0.2,1.0,0.2,1.0];
		} else {
			g.color = [0.8,0.2,0.0,1.0];
		}
		
		g.drawRect(
			this.position.x - this.width*0.5 - c.x,
			this.position.y - this.height*0.5 - c.y,
			this.width,
			this.height,
			this.zIndex
		);
	}
	postrender(g,c){
		let output = "";
		
		for(let i=0; i < this.bossvars.length; i++){
			output += this.bossvars[i].replace("boss_","") + ":\n";
			if(NPC.get(this.bossvars[i])){
				output += "Dead";
			} else {
				output += "Alive";
			}
			output += "\n";
		}
		
		textArea(g,output,
			this.position.x - this.width*0.5 - c.x,
			this.position.y - this.height*0.5 - c.y,
			512, 512
		);
		
	}
	get allDead(){
		for(let i=0; i < this.bossvars.length; i++){
			if(!NPC.get(this.bossvars[i])){
				return false;
			}
		}
		return true;
	}
}

self["FinalGuardian"] = FinalGuardian;