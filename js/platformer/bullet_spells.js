class FireballSpell extends GameObject{
	constructor(x,y,size,ops){
		super(x,y,size,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = this.height = size;
		this.ignoreList = new Array();
		this.zIndex = 50;
		this.sprite = "circle256";
		this.size = size;
		
		ops = Options.convert(ops);
		
		this.team = ops.getInt("team", 1);
		this.owner = ops.get("owner", null);
		this.damage = 0;
		this.damageFire = ops.getInt("damage", 10);
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		this.gravity = 0;
		this.friction = 0;
		this.friction_y = 0;
		
		this._smoke = 0.0;
		this._spark = 0.0;
		
		this.particles = ParticleSystem.fire(x,y,size);
		this.particles.destroyOnSleep = false;
		this.particles.allowIdle = false;
		
		this.on("sleep", function(){ 
			this.destroy(); 
		});
		this.on(["collideHorizontal", "collideVertical"], function(obj){ 
			//Hit wall
			createExplosion(this.position, 12 + this.size);
			audio.play("explode4", this.position);
			
			this.destroy();
			
		});
		this.on("collideObject", function(obj){ 
			if( obj.hasModule(mod_combat) && obj.team != this.team ){
				if( this.ignoreList.indexOf( obj ) < 0 ){
					//Hit target
					createExplosion(this.position, 12 + this.size);
					audio.play("explode4", this.position);
					game.slow(0.0, 0.125);
					shakeCamera(3.0, 0.5);
					
					obj.invincible = 0.0;
					obj.hurt( this, Combat.getDamage.apply(this) );
					this.ignoreList.push(obj);
				}
			}
		});
		this.on("destroy", function(){ 
			this.particles.loop = false;
		});
	}
	setSize(size){
		this.size = size;
		this.width = this.height = this.size;
		
		this.particles.setCount( Math.floor(16 + this.size) );
		this.particles.sizeStart = 1.0 * ( this.size / 6.0 );
	}
	increasePower(){
		this.damageFire += 3;
		this.setSize(this.size + 1);
	}
	update(){
		this._smoke += this.delta;
		this._spark += this.delta;
		
		if( this._smoke >= FireballSpell.SMOKE_TIME ){
			let f = new Point(
				this.force.x * Math.random() * 0.5,
				this.force.y * Math.random() * 0.5 - 2.0
			);
			Background.pushSmoke(this.position, this.size*0.5, f, 1);
			this._smoke = this._smoke - FireballSpell.SMOKE_TIME;
		}
		
		if( this._spark >= FireballSpell.SPARK_TIME ){
			let ff = new FireFly(this.position.x, this.position.y);
			ff.force = new Point( Math.random() - 0.5, Math.random() - 0.5 ).scale(6.0);
			game.addObject(ff);
			
			this._spark = this._spark - FireballSpell.SPARK_TIME * Math.randomRange(0.5,1.5);
		}
		
		this.particles.position = this.position.scale(1);
		
		Background.pushLight(this.position, this.size * 6.0, COLOR_FIRE);
	}
	render(g,c){
		let s = this.size * (0.8 + Math.random() * 0.4);
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, new Point(), false, {
			"scalex" : s / 256,
			"scaley" : s / 256,
			"u_color" : COLOR_FIRE
		});
	}
}
FireballSpell.SMOKE_TIME = Game.DELTASECOND * 0.0625;
FireballSpell.SPARK_TIME = Game.DELTASECOND * 0.172;

class IceballSpell extends GameObject {
	constructor(x,y,d,ops) {
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "spell_ice";
		this.width = this.height = 12;
		this.team = 1;
		this.frame.x = 5;
		this.frame.y = 0;
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		this.force.y = -5;
		
		this.damage = 0;
		this.damageIce = 10;
		this.ignoreList = new Array();
		
		this.mode = 0;
		this._spikeCount = 6;
		this._spikeX = x;
		this._water = null;
		
		this.on("sleep", function(){
			this.destroy();
		});
		
		this.on("collideHorizontal", function(h){
			if( this.mode == 1 ){
				this.destroy();
			}
		});
			
		this.on("collideVertical", function(v){
			//Shatter
			if( this.mode == 0 && v > 0){ 
				this._spikeX = this.position.x; 
				this.mode = 1;
			}
		});
		this.on("collideObject", function(obj){
			if( this.mode == 0 ){
				
				if (obj instanceof Puddle ){
					this._spikeX = this.position.x; 
					this.mode = 1;
				}
				
				if( obj.hasModule(mod_combat) && obj.team != this.team ){
					if(this.ignoreList.indexOf( obj ) < 0 ){
						//Hit enemies on the way to the floor
						
						obj.hurt( this, Combat.getDamage.apply(this) );
						this.ignoreList.push(obj);
					}
				}
				
			} else {
				if (obj instanceof Puddle ){
					this._water = obj;
					this.position.y = obj.corners().top - 8;
					this.force.y = 0.0;
				}
			}
		});
	}
	createSpike(x,y){
		let spike = new IceballFloor(x,y);
		spike.team = this.team;
		spike.damageIce = this.damageIce;
		game.addObject(spike);
		
		/*
		if(this._water != null){
			spike.setWater( this._water );
		}
		*/
		
		this._spikeCount--;
	}
	update(){
		if(this.mode == 0){
			this.flip = this.force.x < 0;
		} else if(this.mode == 1){
			//this.visible = false;
			this.force.x = this.forward() * 4;
			
			if( Math.abs(this.position.x - this._spikeX) >= 16 ){
				this._spikeX = this.position.x;
				
				if( this._water != null){
					this.createSpike(this.position.x, this.position.y+8);
				} else if( this.grounded ){
					this.createSpike(this.position.x, this.position.y);
				} else {
					this.destroy();
				}
				
				this._water = null;
			}
			
			if( this._spikeCount <= 0 ){
				this.destroy();
			}
		}
	}
}
class IceballFloor extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.position = this.position.round(16).add(new Point(-8,0));
		this.sprite = "spell_ice";
		this.width = 12;
		this.height = 48;
		
		this.ignoreList = new Array();
		this._time = 0.0;
		
		this._blockPos = new Point(x-8, y+8);
		this._blockType = 0;
		this._blockTime = 0.0;
		
		let area = new Line(this._blockPos.subtract(new Point(7,7)), this._blockPos.add(new Point(7,7)));
		let objs = game.overlaps(area);
		for( let i = 0; i < objs.length; i++ ){
			if( objs[i] instanceof Puddle ){
				this.setWater( objs[i] );
				break;
			}
		}
		
		this.on("destroy", function(){
			if( this._blockType > 0){
				game.setTile(this._blockPos.x, this._blockPos.y, undefined, 0);
			}
		});
		
		this.on("sleep", function(){
			this.destroy();
		});
		
		this.on("collideObject", function(obj){
			if(this.frame.x >= 1 ) {
			
				if( obj.hasModule(mod_combat) && obj.team != this.team ){
					if(this.ignoreList.indexOf( obj ) < 0 ){
						//Hit enemies on the way to the floor
						
						obj.hurt( this, Combat.getDamage.apply(this) );
						this.ignoreList.push(obj);
					}
				}
			}
		});
	}
	setWater(obj){
		if( game.getTile(this._blockPos.x, this._blockPos.y ) == 0 ){
			//Create block below water level
			if( obj instanceof Lava ) {
				this._blockType = 2;
				createExplosion(this._blockPos, 16);
			} else {
				this._blockType = 1;
			}
			this._blockTime = IceballFloor.TIME_BLOCK;
			game.setTile(this._blockPos.x, this._blockPos.y, undefined, 1024);
		}
	}
	update(){
		this._time += this.delta;
		let p = this._time / IceballFloor.TIME_SPIKE;
		let f = Math.clamp01( p > 0.5 ? 1 - p : p ) * 2;
		this.frame.x = Math.clamp( f * 4, 0, 3 );
		
		if( this._blockTime > 0){
			this._blockTime -= this.delta; 
		} else if(this._time >= IceballFloor.TIME_SPIKE){
			this.destroy();
		}
	}
	render(){}
	postrender(g,c){
		if( this._blockTime > 0 ){
			let p = 1 - this._blockTime / IceballFloor.TIME_BLOCK;
			if( this._blockType == 1 ) {
				g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex-1, new Point(4,0), false, {
					"scaley" : Math.max( 1 - p, 0.125 )
				} );
			} else if( this._blockType == 2 ){
				let f = Math.clamp( 6 + p * 1.2 * 5, 6, 10 );
				g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex-1, new Point(f,0), false );
			}
		}
		
		if(this._time < IceballFloor.TIME_SPIKE){
			super.render(g,c);
		}
	}
}
IceballFloor.TIME_BLOCK = 6.0;
IceballFloor.TIME_SPIKE = 0.8;