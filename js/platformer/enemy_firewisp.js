class FireWisp extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "lilghost";
		this.width = 16;
		this.height = 16;
		this.speed = 2.5;
		
		this.addModule(mod_combat);
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		this.amplitude = ops.getFloat("amplitude", 40.0);
		this.frequency = ops.getFloat("frequency", 1.0) * Math.PI;
		this.delay = ops.getFloat("delay", 2.0);
		this.hurtByDamageTriggers = false;
		
		this.initPos = this.position.scale(1);
		this.lifeMax = this.life = Spawn.life(0,this.difficulty);
		this.damage = Spawn.damage(3,this.difficulty);
		
		this.on("death", function(){
			this.hide();
			audio.play("hurt",this.position);
			audio.play("kill",this.position);
		});
		this.on("collideObject", function(obj){
			if(this.visible && obj.hasModule(mod_combat) && obj.team != this.team){
				obj.hurt( this, this.getDamage() );
			}
		});
		
		this._sway = 0.0;
		this._delay = this.delay * Math.random();
	}
	hide(){
		this.interactive = this.visible = false;
		this._delay = this.delay;
	}
	spawn(){
		this.flip = Math.random() > 0.5;
		
		this.position.x = game.camera.x + (this.flip ? game.resolution.x : 0) + ( this.forward() * 8 );
		this.position.y = this.initPos.y;
		this.interactive = this.visible = true;
		this.life = this.lifeMax;
		this._sway = 0.0;
	}
	idle(){}
	update(){
		if(this.life > 0 && this.visible){
			if(!this.isOnscreen()){
				//Off screen reset
				this.hide();
			} else {
				//Move
				this._sway += this.delta;
				this.position.x += UNITS_PER_METER * this.speed * this.delta * this.forward();
				this.position.y = this.initPos.y + Math.sin(this._sway * this.frequency) * this.amplitude;
			}
		} else {
			//Dead
			if(this._delay <= 0){
				this.spawn();
			} else if( new Line(game.camera, game.camera.add(game.resolution) ).overlaps(this.initPos) ){
				this._delay -= this.delta;
			} 
		}
	}
	render(g,c){}
	postrender(g,c){ super.render(g,c); }
}

self["FireWisp"] = FireWisp;