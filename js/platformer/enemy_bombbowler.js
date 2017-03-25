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
		_player.addXP(this.xp_award);
		Item.drop(this);
		audio.play("kill",this.position);
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
				if(bottom.overlaps(obj.shieldArea())){
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
	this.rotate = (this.rotate + this.delta * 5 * this.force.x) % 360;
	
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