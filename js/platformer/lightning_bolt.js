class LightningBolt extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 24;
		this.origin.y = 1;
		
		this.randomSeed = ""+Math.random();
		
		this.addModule(mod_rigidbody);
		this.pushable = false;
		
		this.active = false; 
		
		ops = ops || new Options();
		
		this.loop = ops.getBool("loop", false);
		this.startTime = ops.getFloat("time", 2) * Game.DELTASECOND;
		this.firstTime = ops.getFloat("firsttime", this.startTime);
		
		this.countdown = this.firstTime;
		this.bolttime = LightningBolt.BOLT_TME;
		this.damage = 24;
		this._ignorelist = new Array();
		
		
		this.on("sleep", function(){
			if(this.loop){
				this.reset();
				this.countdown = this.firstTime;
			} else {
				this.destroy();
			}
		})
	}
	
	reset(){
		this.countdown = this.startTime;
		this.bolttime = LightningBolt.BOLT_TME;
		this._ignorelist = new Array();
	}
	
	update(){
		if(this.active){
			if(this.countdown > 0){
				this.countdown -= this.delta;
				if(this.countdown <= 0){
					createExplosion(this.position, 56 );
					audio.play("lightning1", this.position);
				}
			} else if(this.bolttime > 0){
				
				let hits = game.overlaps(new Point(this.position.x-12, game.camera.y), new Point(this.position.x+12, this.position.y));
				for(let i=0; i < hits.length; i++){
					this.struck(hits[i]);
				}
				
				this.bolttime -= this.delta;
			} else {
				if(this.loop){
					this.reset();
				} else {
					this.destroy();
				}
			}
		} else {
			if(this.grounded){
				this.active = true;
			}
		}
	}
	
	struck(obj){
		if(obj.hasModule(mod_combat) && this._ignorelist.indexOf(obj) < 0){
			let d = Combat.getDamage();
			d.light = this.damage;
			obj.hurt(this, d);
			this._ignorelist.push(obj);
			
			//Stun enemies
			if(!(obj instanceof Player)){ obj.stun = Game.DELTASECOND * 1.25; }
		}
	}
	
	lightrender(g,c){
		if(this.active && this.countdown < 0){
			g.color = [1,1,1,1];
			g.scaleFillRect(0,0,490,240);
		}
	}
	
	render(g,c){
		if(this.active){
			
			if(this.countdown > LightningBolt.WARNING_TME){
				//Show nothing, getting ready
			} else if(this.countdown > 0){
				let r = (game.timeScaled*2) % 1;
				for(let j=0; j < 4; j++){
					let a = 1;
					if(j==0) a = r;
					if(j==3) a = 1-r;
					
					let color = [
						COLOR_LIGHTNING[0],
						COLOR_LIGHTNING[1],
						COLOR_LIGHTNING[2],
						a
					]
					this.renderRipple(g,c,r*16+j*10,color);
				}
			} else {
				let s = new Seed(this.randomSeed);
				let curr = new Point(this.position.x, this.position.y);
				for(let i=0; i < 20; i++){
					let next = new Point(
						this.position.x + (s.random()-0.5) * 16,
						curr.y - (12 + s.random() * 32),
					);
					g.renderLine(
						curr.subtract(c),
						next.subtract(c),
						2, COLOR_LIGHTNING
					)
					curr = next;
				}
			}
		}
	}
	
	renderRipple(g,c,r,color){
		let segments = 12;
		
		for(let i=0; i < segments; i++){
			let p = i / segments;
			let q = (i+1) / segments;
			
			let a = p * -Math.PI;
			let b = q * -Math.PI;
			
			g.renderLine(
				this.position.subtract(c).add(new Point(Math.cos(a), Math.sin(a)).scale(r)),
				this.position.subtract(c).add(new Point(Math.cos(b), Math.sin(b)).scale(r)),
				1, color
			);
		}
	}
}
LightningBolt.renderBolt = function(g,c,start,end,seed=""){
	let s = new Seed(seed);
	let dif = end.subtract(start);
	let dir = dif.normalize();
	let prp = new Point(-dir.y, dir.x);
	
	let curr = start.scale(1);
	let distance = dif.length();
	
	while(distance > 0){
		let range = Math.min(8 + s.random() * 32, distance);
		let shake = (s.random()-0.5) * 32;
		
		distance -= range;
		if(distance<=0) { shake = 0.0;}
		
		let next = curr.add(dir.scale(range)).add(prp.scale(shake));
		g.renderLine(
			curr.subtract(c),
			next.subtract(c),
			2, COLOR_LIGHTNING
		)
		curr = next;
	}
}
LightningBolt.BOLT_TME = Game.DELTASECOND * 0.125;
LightningBolt.WARNING_TME = Game.DELTASECOND * 2;
self["LightningBolt"] = LightningBolt;