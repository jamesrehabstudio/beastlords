BombBowler.prototype = new GameObject();
BombBowler.prototype.constructor = GameObject;
function BombBowler(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 52;
	this.height = 60;
	
	this.sprite = "bombbowler";
	this.paletteSwaps = ["t0","t0","t0","t3","t4"];
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj,pos,damage){
		
		Item.drop(this);
		audio.play("kill",this.position); 
		createExplosion(this.position, 40 );
		this.destroy();
	});
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(3,this.difficulty);
	this.collideDamage = Spawn.damage(4,this.difficulty);
	this.moneyDrop = Spawn.money(5,this.difficulty);
	this.xpDrop = Spawn.xp(4,this.difficulty);
	this.mass = 5.0;
	this.friction = 0.005;
	this.death_time = Game.DELTASECOND * 2;
	this.pushable = false;
	this.stun_time = 0;
	
	this.states = {
		"cooldown" : Game.DELTASECOND * 1.0
	};
	
	this.calculateXP();
	
}
BombBowler.prototype.update = function(){
	var dir = this.position.subtract(_player.position);
	this.previousForceX = this.force.x;
	
	if( this.life > 0 ) {
		if(this.states.cooldown <= 0){
			this.flip = dir.x > 0;
			var bomb = new BombBowl(this.position.x, this.position.y);
			bomb.force.x = (this.flip ? -1 : 1) * 4;
			bomb.damage = this.damage;
			game.addObject(bomb);
			this.states.cooldown = Game.DELTASECOND * 3;
		}
		this.states.cooldown -= this.delta;
	}
	
	/* Animate */
	if( this.life <= 0 ) {
		this.frame.x = 0;
		this.frame.y = 0;
	} else {
		this.frame.x = 0;
		this.frame.y = 0;
	}
}

BombBowl.prototype = new GameObject();
BombBowl.prototype.constructor = GameObject;
function BombBowl(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 14;
	this.height = 14;
	this.zIndex = 1;

	this.sprite = "bullets";
	this.frame.x = 6;
	this.frame.y = 0;
	this.rotate = 0.0;
	this.damage = 1;
	
	this.timer = 3.0 * Game.DELTASECOND;
	this.cooldown = 0.5* Game.DELTASECOND;
	
	this.addModule( mod_rigidbody );
	this.pushable = false;
	this.collisionReduction = -1.0;
	this.friction = 0;
	
	this.on("sleep", function(){
		this.destroy();
	});
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.cooldown <= 0){
				//test if shield is hit
				var c = this.corners();
				var bottom = new Line(c.left,c.bottom-8,c.right,c.bottom);
				var shields = obj.combat_shieldArea();
				if( shields.length > 0 && bottom.overlaps(shields[0]) ){
					this.cooldown = Game.DELTASECOND * 0.5;
					this.force.x *= -1;
					audio.play("block")
				} else{
					this.explode();
				}
			}
		} else if(obj instanceof BombBowler){
			if(this.cooldown <= 0){
				this.explode();
			}
		}
	});
}
BombBowl.prototype.explode = function(){
	c = this.corners();
	l = new Line(c.left - 24, c.top - 24, c.right + 24, c.bottom + 24);
	list = game.overlaps(l);
	for(var i=0; i < list.length; i++){
		var obj = list[i];
		
		obj.trigger("blasted", this);
		
		if(obj instanceof Player){
			obj.hurt(this, this.damage);
		} else if(obj.hasModule(mod_combat)){
			obj.hurt(this, this.damage * 5);
		}
	}
	shakeCamera(Game.DELTASECOND * 0.5, 4);
	//audio.play("explode3");
	
	var explosion = new EffectBang(this.position.x,this.position.y);
	game.addObject(explosion);
	
	Background.flash = [1,1,1,1];
	this.destroy();
}
BombBowl.prototype.render = function(g,c){
	this.rotate = (this.rotate + this.delta * 90 * this.force.x) % 360;
	
	if(this.timer <= 0){
		this.explode();
	} else if(this.timer < Game.DELTASECOND * 0.5){
		this.filter = "hurt";
	} else if(this.timer < Game.DELTASECOND){
		var flash = Math.floor((20/Game.DELTASECOND)*10)%2;
		if(flash){
			this.filter = "hurt";
		}else {
			this.filter = "hurt";
		}
		
	}
	this.cooldown -= this.delta;
	this.timer -= this.delta;
	
	g.renderSprite(
		this.sprite,
		this.position.subtract(c),
		this.zIndex,
		this.frame,
		this.flip,
		{
			"shader" : this.filter,
			"rotate" : this.rotate
		}
	)
}

class Fuse extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.totalLength = 0.0;
		this.spark = 0.0;
		this.playing = false;
		
		this.sparkPoint = new Array();
		this.fushPoints = new Array();
		for(let i=0; i < d.length; i++){
			let distance = 0.0;
			let direction = new Point();
			let seg = 3;
			
			this.sparkPoint.push( d[i].add(this.position) );
			
			if(i > 0){ 
				distance = d[i-1].subtract(d[i]).magnitude(); 
				direction = d[i-1].subtract(d[i]).normalize();
				this.totalLength += distance;
			}
			
			for(let dis = 0; dis <= distance; dis += seg){
				let pos = d[i].add( this.position ).add( direction.scale(seg) );
				let mpos = new Point( pos.x + Math.cos(pos.y) * 2, pos.y + Math.cos(pos.x) * 2 );
				this.fushPoints.push( mpos );
			}
		}
		
		this.on("activate", function(){
			this.spark = 0.0;
			this.playing = true;
		});
		
		this._tid = ops.getString("trigger", null);
		this.speed = ops.getFloat("speed", 2.0);
	}
	getSparkPos(delta=0.0){
		let ddis = this.totalLength * delta;
		
		let curdis = 0.0;
		for(let i=1; i < this.sparkPoint.length; i++){
			let distance = this.sparkPoint[i-1].subtract(this.sparkPoint[i]).magnitude(); 
			
			if(curdis + distance >= ddis){
				let d = ddis - curdis;
				let e = 1.0 - ( d / distance );
				let direction = this.sparkPoint[i-1].subtract( this.sparkPoint[i] ); 
				
				return this.sparkPoint[i].add( direction.scale( e ) );
			}
			
			curdis += distance;
		}
		return this.position;
	}
	render(g,c){
		if(this.playing){
			this.spark += this.delta / this.speed;
			if(this.spark > 1){
				this.spark = 0.0;
				this.playing = false;
			}
		}
		
		for(let i=0; i < this.fushPoints.length - 1; i++){
			g.renderLine( this.fushPoints[i].subtract(c), this.fushPoints[i+1].subtract(c), 1, COLOR_WHITE );
		}
		
		if(this.spark > 0 && this.playing){
			let sparkPos = this.getSparkPos( this.spark );
			g.renderSprite("items",sparkPos.subtract(c),this.zIndex, new Point(10,1), this.flip);
		}
		
	}
}
self["Fuse"] = Fuse;

class Bomb extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.sprite = "bullets";
		this.frame.x = 6;
		this.frame.y = 0;
		
		this.zIndex = 20;
		
		this.width = this.height = 24;
		
		this.delay = ops.getFloat("delay", 0.0);
		this.start = ops.getBool("startactive", false);
		this.radius = ops.getInt("radius", 24);
		this.destroyOnExplode = ops.getBool("destroyonexplode", true);
		this._tid = ops.getString("trigger", null);
		
		this.on("activate",function(){
			this.start = true;
		});
	}
	update(){
		if(this.start){
			if(this.delay > 0.0){
				this.delay -= this.delta;
			} else {
				this.explode();
				this.start = false;
			}
		}
	}
	explode(){
		let radP = new Point(this.radius, this.radius);
		let hits = game.overlaps(this.position.subtract(radP), this.position.add(radP));
		
		for(let i = 0; i < hits.length; i++){
			hits[i].trigger("blasted", this);
			if( hits[i].hasModule(mod_combat) ){
				
			}
			
		}
		
		if(this.destroyOnExplode){
			this.destroy();
		}
	}
}
self["Bomb"] = Bomb;