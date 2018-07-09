class Darkness extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x - d[0] * 0.5;
		this.position.y = y - d[1] * 0.5;
		this.width = d[0];
		this.height = d[1];
		this.origin = new Point();
		
		this.zIndex = 99;
		this.speed = 8;
		this.damage = 1;
		this.tickTime = Game.DELTASECOND * 0.4;
		
		this._pushback = 0.0;
		this._delay = 0.0;
		this._tickTime = this.tickTime;
		this._tick = false;
		
		this.on("collideObject", function(obj){
			/*
			if(obj instanceof DarknessWard && obj._lit > 0){
				if(obj.position.x > this.position.x + this._pushback){
					this._pushback = Math.max( obj.position.x - this.position.x, this._pushback );
					this._delay = Game.DELTASECOND * 1.0;
				}
			}
			*/
			if(obj instanceof Player ){
				if( Darkness.immune <= game.timeScaled && this._tick ) {
					
					if(Timer.interval(game.timeScaled, 0.25, game.delta) ){
						obj.life -= this.damage;
						obj.displayDamage(this.damage);
						obj.isDead();
						this._tick = false;
					}
				}
			}
		});
	}
	update(){
		this._tick = true;
		/*
		if(this._delay <= 0){
			this._pushback = Math.max( this._pushback - this.delta * this.speed, 0.0 );
		} else {
			this._delay -= this.delta;
		}
		
		this._tickTime -= this.delta;
		
		if(this._tickTime <= 0){
			this._tick = true;
			this._tickTime = this.tickTime + this._tickTime;
		} else {
			this._tick = false;
		}
		*/
	}
	render(){}
	lightrender(g,c){
		g.color = [0.03125,0.03125,0.03125,1.0];
		g.drawRect(
			this._pushback + this.position.x - c.x,
			this.position.y - c.y,
			this.width - this._pushback,
			this.height,
			this.zIndex
		);
	}
}
Darkness.immune = 0.0;
self["Darkness"] = Darkness;

class DarknessWard extends GameObject{
	get range(){ return 120 * Math.clamp01( this._lit / 2.0 ); }
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.sprite = "axedog";
		this.zIndex = 1;
		this.idleMargin = 120;
		
		
		this.speed = 36.0;
		this.litTime = Game.DELTASECOND * 10.0;
		
		this.isBlock = ops.getBool("isblock", true);
		this.alwaysOn = ops.getBool("alwayson", false);
		
		
		if(this.isBlock){
			this.addModule(mod_rigidbody);
			this.addModule(mod_block);
		
			this.on("collideLeft", function(obj){
				if(obj instanceof Player){
					this.force.x += this.speed * this.delta;
				}
			});
			this.on("collideRight", function(obj){
				if(obj instanceof Player){
					this.force.x -= this.speed * this.delta;
				}
			});
			
			this.pushable = false;
		}
		
		this.on("struck", function(obj){
			if(obj instanceof Player){
				this._lit = this.litTime;
			}
		});
		this.on("land", function(obj){
			let hit = game.overlaps(this.bounds().transpose(new Point(0,16)));
			for(let i=0; i < hit.length; i++){
				if(hit[i] instanceof BreakableTile){
					hit[i].break();
				}
			}
		});
	}
	update(){
		if(this.alwaysOn){
			this._lit = this.litTime;
		}
		if(this._lit > 0){
			this._lit -= this.delta;
			
			let range = 110 ** 2;
			let dis = (this.position.subtract(_player.position)).sqrMagnitude();
			
			if(dis <= this.range ** 2){
				Darkness.immune = game.timeScaled + Game.DELTASECOND * 0.5;
			}
		}
	}
	lightrender(g,c){
		//let r = Math.clamp01( this._lit / 2.0 );
		g.renderSprite(
			"lighthalo",
			this.position.subtract(c),
			100,
			new Point(),
			false,
			{
				"scale" : this.range / 120.0,
				"u_color" : [1.0,0.9,0.8,1.0]
			}
		);
	}
}

self["DarknessWard"] = DarknessWard;