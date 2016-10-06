Igbo.prototype = new GameObject();
Igbo.prototype.constructor = GameObject;
function Igbo(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 36;
	this.height = 48;
	this.sprite = "igbo";
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	this.times = {
		"attack" : Game.DELTASECOND * 1.5,
		"cooldown" : Game.DELTASECOND * 3.5,
	}
	this.states = {
		"attack" : 0,
		"cooldown" : this.times.cooldown
	}
	
	this.guard.active = true;
	this.guard.x = 8;
	this.guard.y = -20;
	this.guard.w = 24;
	this.guard.h = 46;	
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.damage = Spawn.damage(4,this.difficulty);
	this.collideDamage = Spawn.damage(2,this.difficulty);
	this.death_time = Game.DELTASECOND;
	this.mass = 3.0;
	this.friction = 0.4;
	
	this.on("block", function(obj,pos,damage){
		if( this.team == obj.team ) return;
		if( this.inviciple > 0 ) return;
		
		var dir = this.position.subtract(obj.position);
		
		this.states.block = Game.DELTASECOND * 0.5;
	
		//blocked
		obj.force.x += (dir.x > 0 ? -3 : 3) * this.delta;
		audio.playLock("block",0.1);
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
	});
	this.on("death", function(obj){
		Item.drop(this,15);
		audio.play("kill",this.position);
		this.destroy();
	});
}
Igbo.prototype.update = function(){	
	if(this.life > 0){
		var dir = this.position.subtract(_player.position);
		
		if(this.states.attack > 0 ){
			this.states.attack -= this.delta;
			this.frame = Igbo.anim_attack.frame(1-this.states.attack/this.times.attack);
			this.guard.active = false;
			if(Timer.isAt(this.states.attack,this.times.attack*0.5,this.delta)){
				this.fire(4,0.0);
			}
		} else {
			this.states.cooldown -= this.delta;
			
			this.flip = dir.x > 0;
			this.guard.active = true;
			this.frame.x = (this.frame.x + this.delta * 0.2) % 4;
			this.frame.y = 0;
			
			if(this.states.cooldown <= 0){
				this.states.attack = this.times.attack;
				this.states.cooldown = this.times.cooldown;
			}
		}
	} else {
		this.guard.active = false;
		this.frame.x = 2;
		this.frame.y = 2;
	}
}

Igbo.prototype.fire = function(amount, skiprandom){
	var xoff = 32;
	for(var i=0; i < amount; i++){
		var xpos = this.forward() * xoff;
		var ftower = new FlameTower(xpos+this.position.x, this.position.y);
		ftower.damage = this.damage;
		ftower.time = Game.DELTASECOND * i * -0.2;
		game.addObject(ftower);
		xoff += Math.random() > skiprandom ?  40 : 80;
	}
}

Igbo.prototype.render = function(g,c){
	if(this.guard.active){
		g.renderSprite(
			this.sprite,
			this.position.add(new Point(this.forward() * 24, 0)).subtract(c),
			this.zIndex + 1,
			new Point(0,3),
			this.flip
		);
	}
	GameObject.prototype.render.apply(this,[g,c]);
}

Igbo.anim_attack = new Sequence([
	[0,1,0.1],
	[1,1,0.1],
	[2,1,0.5],
	[3,1,0.1],
	[0,2,0.1],
	[1,2,0.5]
])