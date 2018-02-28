Warbus.prototype = new GameObject();
Warbus.prototype.constructor = GameObject;
function Warbus(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 24;
	this.height = 32;
	this.sprite = "warbus";
	this.speed = 0.15;
	this.startPosition = new Point(x,y);
	
	this.addModule( mod_rigidbody );
	this.addModule( mod_combat );
	
	
	this.states = {
		"phase" : 3,
		"guarddown" : false,
		"attackcount" : 3,
		"attacktype" : 0,
		"attack" : 0,
		"cooldown" : 0
	}
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.life = Spawn.life(8,this.difficulty);
	this.damage = Spawn.damage(3,this.difficulty);
	this.moneyDrop = Spawn.money(8,this.difficulty);
	this.mass = 1.4;
	this.inviciple_time = this.stun_time;
	
	this.on("collideObject", function(obj){
		if( this.team == obj.team ) return;
		//if( obj.hurt instanceof Function ) obj.hurt( this, this.damage );
	});
	this.on("wakeup", function(){
		this.setPhase(Warbus.PHASE_GUARD);
	});
	this.on("hurt", function(){
		audio.play("hurt",this.position);
		this.states.cooldown -= 10;
		this.states.active = true
	});
	this.on("block", function(obj){
		audio.play("block", this.position);
		var knockback = this.states.guarddown ? 0.6 : 3.0;
		this.force.x += -this.forward() * knockback;
	});
	this.on("death", function(obj){
		Item.drop(this,30);
		
		audio.play("kill",this.position);
		this.destroy();
	});
}
Warbus.prototype.update = function(){	
	var dir = this.position.subtract(_player.position);
	
	/*
	if(input.state("left")==1)this.frame.x--;
	if(input.state("right")==1)this.frame.x++;
	if(input.state("up")==1)this.frame.y--;
	if(input.state("down")==1)this.frame.y++;
	if(input.state("jump")==1)this.flip=!this.flip;
	return;
	*/
	
	if(this.life > 0){
		if(this.states.phase == Warbus.PHASE_ATTACK){
			//attack player
			this.states.attack -= this.delta;
			var progress = 1 - Math.max(this.states.attack/Game.DELTASECOND,0);
			
			this.frame = Warbus.anim_attacks[this.states.attacktype].frame(progress);
			var attproperties = Warbus.anim_attacks[this.states.attacktype].properties(progress);
			
			if("strike" in attproperties){
				this.strike(attproperties["strike"]);
			}
			if("force" in attproperties){
				this.force.x += this.forward() * attproperties["force"] * this.delta;
			}
			
			if(Timer.interval(game.timeScaled, Game.DELTASECOND*0.3, game.delta)){
				//Delay on guard change when moving
				this.states.guarddown = _player.states.duck;
			}
			
			if(this.states.attack <= 0){
				this.flip = dir.x > 0;
				this.states.attackcount--;
				
				if(this.states.attackcount > 0){
					this.states.attack = Game.DELTASECOND;
					if(Math.random() >= 0.40){
						this.states.attacktype = this.states.attacktype == 0 ? 1 : 0;
					} else {
						this.states.attacktype = 2;
					}
				} else {
					this.nextPhase();
				}
				
			}
		} else if(this.states.phase == Warbus.PHASE_CHARGE){
			//charge player
			this.frame.y = 2;
			this.frame.x = (this.frame.x + this.delta*Math.abs(this.force.x)*0.3) % 6;
			this.states.guarddown = false;
			this.force.x += this.forward() * this.speed * this.delta * 4;
			this.states.cooldown -= this.delta;
			
			if(Math.abs(dir.x) < 64){
				this.setPhase(Warbus.PHASE_ATTACK);
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		} else if(this.states.phase == Warbus.PHASE_BACKOFF){
			//backoff
			this.flip = dir.x > 0;
			this.frame.y = 1;
			this.frame.x = (this.frame.x + this.delta*Math.abs(this.force.x)*0.3) % 4;
			this.force.x += -this.forward() * this.speed * this.delta;
			this.states.cooldown -= this.delta;
			
			if(Timer.interval(game.timeScaled, Game.DELTASECOND*0.2, game.delta)){
				//Delay on guard change when moving
				this.states.guarddown = _player.states.duck;
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		} else {
			//guard
			this.flip = dir.x > 0;
			this.states.guarddown = _player.states.duck;
			this.states.cooldown -= this.delta;
			
			if(this.states.guarddown){
				this.frame.y = 0;
				this.frame.x = Math.min(this.frame.x + this.delta*0.5, 4);
			} else {
				this.frame.x = this.frame.y = 0;
			}
			if(this.states.cooldown <= 0){
				this.nextPhase();
			}
		}
		
		this.guard.active = true;
		this.guard.y = this.states.guarddown ? 0 : -12;
	} else {
		this.guard.active = false;
		this.frame.x = 5;
		this.frame.y = 0;
	}
	
}

Warbus.prototype.setPhase = function(phase){
	var dir = this.position.subtract(_player.position);
	
	if(phase == Warbus.PHASE_ATTACK){
		this.states.attackcount = 3 + Math.round(Math.random()*4);
		this.flip = dir.x > 0;
	} else if(phase == Warbus.PHASE_CHARGE){
		this.states.cooldown = Game.DELTASECOND * 0.8;
		this.flip = dir.x > 0;
	} else if(phase == Warbus.PHASE_BACKOFF){
		this.states.cooldown = Game.DELTASECOND * 1.3;
	} else {
		this.states.cooldown = Game.DELTASECOND * (1 + Math.random()*1.2);
	}
		
	this.states.phase = phase;
}
Warbus.prototype.nextPhase = function(){
	var dir = this.position.subtract(_player.position);
	var wander = this.position.subtract(this.startPosition);
	
	if(Math.abs(wander.x) > 80 && Math.abs(wander.y) < 32){
		if(Math.abs(dir.x) < 64 && Math.random() > 0.4){
			this.setPhase(Warbus.PHASE_ATTACK);
		} else if(Math.random() > 0.8){
			this.setPhase(Warbus.PHASE_GUARD);
		} else {
			if(
				(_player.position.x > this.position.x && this.startPosition.x > this.position.x) || 
				(_player.position.x < this.position.x && this.startPosition.x < this.position.x)
			){
				this.setPhase(Warbus.PHASE_CHARGE);
			} else {
				this.setPhase(Warbus.PHASE_BACKOFF);
			}
		}
	} else {
		if(Math.abs(dir.x) < 64 && Math.random() > 0.3){
			this.setPhase(Warbus.PHASE_ATTACK);
		} else if(Math.random() > 0.7) {
			this.setPhase(Warbus.PHASE_CHARGE);
		} else {
			this.setPhase(Warbus.PHASE_GUARD);
		}
	}
}

Warbus.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	if(this.life > 0){
		var shieldZIndex = this.states.phase == Warbus.PHASE_ATTACK ? -1 : 1;
		if(this.states.guarddown){
			g.renderSprite(this.sprite,this.position.subtract(c).add(new Point(0,12)),this.zIndex+shieldZIndex,new Point(0,5),this.flip);
		} else {
			g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex+shieldZIndex,new Point(0,5),this.flip);
		}
		this.renderSword(g,c);
	}
}
Warbus.prototype.renderSword = function(g,c){
	var sframe;
	var fr = Math.floor(this.frame.y);
	var f = Math.floor(this.frame.x);
	
	if(fr in Warbus.anim_sword){
		sframe = Warbus.anim_sword[fr][f];
	}
	
	if(sframe){
		var rotation = this.forward() * sframe.r;
		var position = new Point(this.forward()*sframe.p.x, sframe.p.y);
		
		g.renderSprite("swordtest",this.position.add(position).subtract(c),this.zIndex+sframe.z,new Point(),false,{
			"rotate" : rotation
		});
	}
}

Warbus.PHASE_ATTACK = 3;
Warbus.PHASE_CHARGE = 2;
Warbus.PHASE_BACKOFF = 1;
Warbus.PHASE_GUARD = 0;

Warbus.anim_attacks = [
	new Sequence([[0,3,1.0],[1,3,0.2,{"strike":new Line(4,-8,36,-4),"force":0.4}],[2,3,1.0]]),
	new Sequence([[2,3,0.5],[3,3,0.2,{"strike":new Line(4,-8,36,-4),"force":-0.4}],[4,3,0.5],[5,3,1.0]]),
	new Sequence([[1,4,1.0],[2,4,0.2,{"strike":new Line(4,10,36,14)}],[3,4,0.2],[4,4,1.0]])
];
Warbus.anim_sword = {
	0:{
		0:{"p":new Point(-15,-2),"z":2,"r":0.0},
		1:{"p":new Point(-15,-2),"z":2,"r":0.0},
		2:{"p":new Point(-15,-2),"z":2,"r":0.0},
		3:{"p":new Point(-15,3),"z":2,"r":0.0},
		4:{"p":new Point(-15,3),"z":2,"r":0.0}
	},
	1:{
		0:{"p":new Point(-15,-3),"z":2,"r":0.0},
		1:{"p":new Point(-15,-2),"z":2,"r":0.0},
		2:{"p":new Point(-14,-2),"z":2,"r":0.0},
		3:{"p":new Point(-14,-3),"z":2,"r":0.0},
	},
	2:{
		0:{"p":new Point(-15,-2),"z":2,"r":250.0},
		1:{"p":new Point(-16,-3),"z":2,"r":250.0},
		2:{"p":new Point(-16,-2),"z":2,"r":250.0},
		3:{"p":new Point(-14,-1),"z":2,"r":250.0},
		4:{"p":new Point(-15,-2),"z":2,"r":250.0},
		5:{"p":new Point(-15,-1),"z":2,"r":250.0},
	},
	3:{
		0:{"p":new Point(-17,-10),"z":2,"r":300.0},
		1:{"p":new Point(9,-8),"z":2,"r":90.0},
		//2:{"p":new Point(18,-11),"z":2,"r":90.0},
		2:{"p":new Point(18,-11),"z":-2,"r":315.0},
		3:{"p":new Point(-15,-12),"z":2,"r":80.0},
		4:{"p":new Point(-17,-13),"z":2,"r":340.0},
		5:{"p":new Point(-17,-13),"z":2,"r":320.0},
	},
	4:{
		0:{"p":new Point(-16,2),"z":2,"r":0.0},
		1:{"p":new Point(-15,2),"z":2,"r":90.0},
		2:{"p":new Point(20,6),"z":2,"r":90.0},
		3:{"p":new Point(-14,1),"z":2,"r":45.0},
		4:{"p":new Point(-16,2),"z":2,"r":10.0}
	}
}