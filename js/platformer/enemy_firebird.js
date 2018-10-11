class FireBird extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 32;
		this.sprite = "firebird";
		
		this.addModule( mod_combat );
		this.addModule( mod_rigidbody );
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.death_time = Game.DELTASECOND * 4;
		this.lifeMax = this.life = Spawn.life(3,this.difficulty);
		this.damage = 0;
		this.damageFire = Spawn.damage(2,this.difficulty);
		this.xpDrop = Spawn.xp(5,this.difficulty);
		
		this.speed = 10.0;
		this.pushable = false;
		
		this._outofcontrol = 0.0;
		this._turntime = 0.0;
		this._useTorch = true;
		this._walkanim = 0.0;
		this._retreat = 0.0;
		
		this.on("collideHorizontal", function(h){
			if(this._retreat <= 0 && this._turntime <= 0){
				this._retreat = Game.DELTASECOND * 2;
				this.turn();
			}
		});
		
		this.on("collideObject", function(obj){
			if(obj instanceof Airjet && obj.active){
				if(this.grounded){
					this.grounded = false;
					this.force.y = -5;
				} else {
					
				}
			}
		});
		
		this.on("hurt", function(){
			audio.play("hurt");
		});
		this.on("pre_death", function(){
			this._outofcontrol = this.flip ? -2 : 0; 
		});
		this.on("death", function(){
			Item.drop(this);
			audio.play("kill");
			this.destroy();
		});
	}
	
	turn(){
		this.flip = !this.flip;
		this._turntime = FireBird.TIME_TURN;
		this.frame = new Point(1, 3);
	}
	dropFire(){
		var fire = new Fire(this.position.x, this.position.y - this.height * 0.5);
		fire.grounded = false;
		fire.force.y = -5;
		fire.damageFire = this.damageFire;
		game.addObject(fire);
	}
	update(){
		var dir = this.position.subtract(_player.position);
		
		if(this.life > 0){
			
			if(this._turntime > 0){
				//Turn animation
				this._useTorch = false;
				this._turntime -= this.delta;
				
				let p = 1.0 - this._turntime / FireBird.TIME_TURN;
				this.frame.x = 1 + Math.min(p * 3, 2);
				this.frame.y = 3;
			} else {
				let dif = this.target().position.subtract(this.position);
				this._useTorch = true;
				
				this._walkanim = (this._walkanim + this.delta * Math.abs(this.force.x) * 4.0) % 8;
				this.frame.x = this._walkanim % 4;
				this.frame.y = this._walkanim / 4;
			
				if(this._retreat > 0){
					this._retreat -= this.delta;
					this.addHorizontalForce(this.speed * this.forward());
					
					if(this._retreat <= 0){ 
						this.turn();
					}
				} else {
					this.addHorizontalForce(this.speed * this.forward());
					if((this.flip && dif.x > 0 ) || (!this.flip && dif.x < 0)){
						//Turn around
						this.turn();
					}
				}
			}
			
			
			
		} else {
			//Exploding
			this.frame.x = 3;
			this.frame.y = 2;
			
			this.grounded = false;
			this._useTorch = false;
			this._outofcontrol += this.delta;
			this.force.y = -this.gravity * 1.3;
			this.force.x += this.speed * 3.0 * this.delta * Math.sin(this._outofcontrol * 3.14);
			this.flip = this.force.x < 0;
			
			if(Timer.interval(2+this._outofcontrol, Game.DELTASECOND*0.5, this.delta)){
				this.dropFire();
			}
		}
		
		if(this._useTorch){
			//Hit objects in areas
			let firearea = new Line(
				this.position.x + this.forward() * 24,
				this.position.y - 8,
				this.position.x + this.forward() * 32,
				this.position.y
			);
			firearea.correct();
			
			var hits = game.overlaps(firearea);
			
			for(var i=0; i < hits.length; i++){
				if( hits[i] instanceof Player && hits[i].intersects(firearea) ){
					hits[i].hurt(this, this.getDamage());
				}
			}
			
			Background.pushLight(firearea.center(), 96, COLOR_FIRE);
		}
	}
	render(g,c){
		super.render(g,c);
		
		if(this._useTorch){
			g.renderSprite("bullets",this.position.add( new Point(this.forward() * 28,-4 )).subtract(c), this.zIndex+1, new Point(5,1), !this.flip );
		}
	}
}
FireBird.TIME_TURN = Game.DELTASECOND * 0.4;

self["FireBird"] = FireBird;