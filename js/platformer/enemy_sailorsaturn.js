class SailorSaturn extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "sailorsaturn";
		this.width = 32;
		this.height = 40;
		
		this.addModule( mod_combat );
		this.addModule( mod_rigidbody );
		
		this.on("hurt", function(obj, damage){
			audio.play("hurt", this.position);
		});
		this.on("death", function(){
			audio.play("kill",this.position); 
			createExplosion(this.position, 40 );
			Item.drop(this);
			this.destroy();
		});
	}
	update(){
		if(1){
			
		} else if(0){
			
		}
	}
}
self["SailorSaturn"] = SailorSaturn;