class Shockcrawler extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "shockcrawler";
		this.width = this.height = 16;
		
		this.addModule(mod_combat);
		this.addModule(mod_crawler);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.flip = ops.getBool("flip", false);
		
		this.life = this.lifeMax = 1;
		this.xpDrop = Spawn.xp(2,this.difficulty);
		this.death_time = 0.5;
		this.damage = 0;
		this.damageLight = Spawn.damage(4, this.difficulty);
		this.defenceLight = Spawn.defence(4,this.difficulty);
		this.moneyDrop = Spawn.money(3,this.difficulty);
		this.crawler_speed = 1.5;
		this.idleMargin = 128;
		this.damageContact = 1.0;
		
		this.on("hurt", function(){
			audio.play("hurt",this.position);
		});
		this.on("struck", function(obj){
			if( obj.hasModule(mod_combat) && obj.team != this.team ){
				//obj.hurt( this, this.getDamage() );
			}
		});
		
		this.on("death", function(){
			this.destroy();
			Item.drop(this);
			audio.play("kill",this.position); 
			createExplosion(this.position, 32 );
		});
	}
	update(){
		this.frame.x = (this.frame.x + this.delta * 10) % 5;
		Background.pushLight(this.position, 96, COLOR_LIGHTNING);
	}
	render(g,c){
		//g.color = [1,0.5,0.5,1.0];
		//g.drawRect(this.position.x-c.x-this.width*this.origin.x, this.position.y-c.y-this.height*this.origin.y,this.width, this.height, this.zIndex);
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, this.flip, {
			"rotation" : this.crawler_rotation,
			"u_color" : this.tint
		});
	}
}

self["Shockcrawler"] = Shockcrawler;