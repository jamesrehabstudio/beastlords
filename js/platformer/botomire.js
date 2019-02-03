class Botomire extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 112;
		this.sprite = "botomire";
		this.speed = 1.0;
		
		this.addModule(mod_combat);
		this.addModule(mod_rigidbody);
		
		this.parts = {
			"head" : {
				"offset" : new Point(-8,-32),
				"frame" : new Point(),
				"z" : 3,
				"guard" : new Line(-32,-28,32,-6)
			},
			"jaw" : {
				"offset" : new Point(0,-26),
				"frame" : new Point(1,0),
				"z" : 2,
				"guard" : new Line(-32,-12,32,20)
			},
			"gun" : {
				"offset" : new Point(-22,-16),
				"frame" : new Point(0,1),
				"z" : -1
			},
			"body" : {
				"offset" : new Point(-16,10),
				"frame" : new Point(2,0),
				"z" : 0,
				"guard" : new Line(-32,-16,32,40)
			},
			"leg" : {
				"base" : new Point(-24,36),
				"offset" : new Point(0,0),
				"frame" : new Point(0,2),
				"z" : 1
			}
		};
		
		this.difficulty = ops.getInt("difficulty", Spawn.difficulty);
		
		this.lifeMax = this.life = 500;
		this.damage = Spawn.damage(10, this.difficulty);
		this.death_time = Game.DELTASECOND * 4;
		
		this._gunopen = 0.0;
		this._walkAnim = 0.0;
		this._retreat = 0.0;
		
		this._cooldown = 0.0;
		this._mattack = 0.0;
		this.guard.omidirectional = true;
		
		this.on("hurt", function(obj, damage){
			
			
			this.force.x = -this.forward() * this.speed;
			
			if(this._retreat <= 0){
				let kb_time = Math.clamp( 0.25 + damage / 20.0, 0.25, 3.0 );
				this._retreat = Game.DELTASECOND * kb_time;
			}
			
			if(this._mattack < Botomire.MATTACK_TIME * 0.80){
				this._mattack = 0.0;
			}
			
			if(this.life > 0){
				//Must be killed out right
				this.life = this.lifeMax;
			}
		});
		this.on("block", function(obj, damage){
			audio.play("block");
			console.log("block");
		});
		this.on("in_lava", function(lava){
			this.life = 0;
			this.isDead();
		});
		this.on("death", function(obj, damage){
			audio.play( "kill", this.position );
			this.destroy();
		});
		
		this.combat_shieldArea = function(){
			var output = new Array();
			for(let i in this.parts){
				if("guard" in this.parts[i]){
					let g = this.parts[i].guard;
					if(this.flip){ g = new Line( g.end, g.start ); }
					g = g.correct();
					
					let p = this.position.add( new Point( this.parts[i].offset.x * this.forward(), this.parts[i].offset.y ) );
					let l = g.transpose( p );
					output.push(l);
				}
			}
			return output;
		};
		
	}
	update(){
		
		if(this.life > 0){
			let dif = this.target().position.subtract(this.position);
			
			this.flip = dif.x < 0;
			
			if(this._mattack > 0){
				if(this._gunopen < 1){
					this._gunopen = Math.clamp01(this._gunopen + this.delta * 1.0);
				} else {
					this._mattack -= this.delta;
					if(Timer.isAt(this._mattack, Botomire.MATTACK_TIME * 0.95, this.delta)){
						this.fire();
					}
					if(Timer.isAt(this._mattack, Botomire.MATTACK_TIME * 0.80, this.delta)){
						this.fire();
					}
				}
				
			} else if(this._gunopen > 0) {
				this._gunopen = Math.clamp01(this._gunopen - this.delta * 1.0);
				
			}  else {
				
				this._cooldown -= this.delta;
				if(this._cooldown < 0){
					this._cooldown = Botomire.COOLDOWN;
					this._mattack = Botomire.MATTACK_TIME;
				}
			}
			
			if(this._retreat > 0){
				this.force.x += -this.forward() * this.delta * this.speed * 6;
				this._retreat -= this.delta;
			} else {
				this.force.x += this.forward() * this.delta * this.speed;
			}
		
		} else {
			this.force.y = 0;
		}
		
		this._walkAnim = Math.mod(this._walkAnim + this.delta * 0.25 * this.force.x, 1.0);
		
		this.parts.jaw.offset = Point.lerp(Botomire.JAW_CLOSED, Botomire.JAW_OPEN, this._gunopen);
		this.parts.gun.offset = Point.lerp(Botomire.GUN_CLOSED, Botomire.GUN_OPEN, this._gunopen);
		
		this.parts.leg.offset.x = this.parts.leg.base.x + Math.sin(this._walkAnim * 6.28) * 4;
		this.parts.leg.offset.y = this.parts.leg.base.y + Math.min( -Math.cos(this._walkAnim * 6.28) * 4, 0);
		
	}
	fire(){
		let ops = new Options();
		ops["team"] = this.team;
		ops["damage"] = this.damage;
		ops["rotation"] = this.flip ? 180 : 0;
		let missile = Bullet.createHomingMissile(this.position.x + this.forward() * 16, this.position.y, ops);
		game.addObject(missile);
	}
	render(g,c){
		for(let p in this.parts){
			let part = this.parts[p];
			
			let pos = this.position.add(part.offset.scale(this.forward(),1));
			g.renderSprite(this.sprite, pos.subtract(c), this.zIndex + part.z ,part.frame, this.flip, { "u_color" : this.tint } );
		}
	}
}
Botomire.MATTACK_TIME = 4.0;
Botomire.COOLDOWN = 3.0;
Botomire.JAW_CLOSED = new Point(0,-26);
Botomire.JAW_OPEN = new Point(0,12);
Botomire.GUN_CLOSED = new Point(-20,-16);
Botomire.GUN_OPEN = new Point(4,-16);

self["Botomire"] = Botomire;