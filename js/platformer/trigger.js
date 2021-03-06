Trigger.prototype = new GameObject();
Trigger.prototype.constructor = GameObject;
function Trigger(x,y,d,o){
	this.constructor();
	
	if(d instanceof Array){
		this.width = d[0];
		this.height = d[1];
	}
	
	this.position.x = x - (this.width/2);
	this.position.y = y - (this.height/2);
	this.origin.x = this.origin.y = 0;
	
	this.targets = new Array();
	this.background = null;
	this.darknessFunction = null;
	this.darknessColour = null;
	this.dustCount = null;
	this.sealevel = null;
	this.triggerCount = 0;
	this.retrigger = 1;
	this.retriggertime = Game.DELTASECOND;
	this.retriggertimeCooldown = 0;
	this.mustwaitinside = false;
	this.music = false;
	
	this.countdown = 0;
	this.timer = 0;
	this.time = 0;
	
	this._isover = false
	
	
	this.requirements = o.getList("requirements",new Array());
	
	
	if("target" in o){
		this.targets = o.target.split(",");
	}
	if("darkness" in o){
		this.darknessFunction = new Function("c","return " + o.darkness)
	}
	if("darknesscolor" in o){
		try{
			var colour = o["darknesscolor"].split(",");
			this.darknessColour = [
				colour[0] * 1,
				colour[1] * 1,
				colour[2] * 1,
			]
		} catch(err){}
	}
	if("background" in o){
		this.background = o["background"];
	}
	if("dustcount" in o){
		this.dustCount = o["dustcount"] * 1;
	}
	if("sealevel" in o){
		this.sealevel = o["sealevel"] * 1;
	}
	if("retrigger" in o){
		this.retrigger = o.retrigger * 1;
	}
	if("retriggertime" in o){
		this.retriggertime = o.retriggertime * Game.DELTASECOND;
	}
	if("timer" in o){
		this.time = o["timer"] * Game.DELTASECOND;
		this.timer = this.time;
	}
	if("mustwaitinside" in o){
		this.mustwaitinside = o["mustwaitinside"];
	}
	if("music" in o){
		this.music = o["music"];
	}
	
	this.on("activate", function(obj){
		if(this.retrigger || this.triggerCount == 0){
			this.triggerCount++;
			
			if(this.triggersave){
				NPC.set(this.triggersave, this.triggerCount);
			}
			
			if(this.retriggertimeCooldown <= 0){
				this.retriggertimeCooldown = this.retriggertime;
				if(
					this.darknessFunction instanceof Function ||
					this.darknessColour instanceof Array ||
					this.dustCount != undefined ||
					this.sealevel != undefined ||
					this.background
				){
					var b = game.getObject(Background);
					if(b instanceof Background){
						
						if(this.darknessFunction instanceof Function)
							b.darknessFunction = this.darknessFunction;
						
						if(this.darknessColour instanceof Array)
							b.ambience = this.darknessColour;
						
						if(this.dustCount != undefined)
							b.dustAmount = this.dustCount;
						
						if(this.sealevel != undefined)
							b.sealevel = this.sealevel;
						
						if(this.background)
							if(this.background in Background.presets)
								b.preset = Background.presets[this.background];
					}
				}
				
				if(this.music){
					audio.playAs(this.music,"music");
				}
				//trigger connected objects
				if(this.targets.length > 0){
					for(var i=0; i < this.targets.length; i++){
						var objects = Trigger.getTargets(this.targets[i]);
						for(var j=0; j < objects.length; j++){
							objects[j].trigger("activate", this);
						}
					}
				}
			}
		}
	});
	
	if("triggersave" in o){
		this.triggersave = o["triggersave"];
		if(NPC.get(this.triggersave)){
			this.trigger("activate");
		}
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.hasRequirments()){
				//Trigger doesn't activate until certain requirements have been met.
				
				if(this.time <= 0){
					this.trigger("activate");
				}else{
					this.countdown = true;
					this._isover = true;
				}
			}
		}
	});
}

Trigger.prototype.hasRequirments = function(){
	for(let i=0; i < this.requirements.length; i++){
		if( !NPC.get(this.requirements[i]) ){
			return false;
		}
	}
	return true;
}

Trigger.prototype.update = function(){
	if(this.countdown){
		if(!this._isover && this.mustwaitinside){
			this.timer = this.time;
			this.countdown = false;
		}
		if(this.timer <= 0){
			this.timer = this.time;
			this.countdown = false;
			this.trigger("activate");
		}
		this.timer -= this.delta;
	}
	this.retriggertimeCooldown -= this.delta;
	this._isover = false;
}
Trigger.prototype.idle = function(){}

Trigger.getTargets = function(name){
	var out = new Array();
	if(game instanceof Game){
		for(var i=0; i < game.objects.length; i++){
			var obj = game.objects[i];
			if(obj instanceof GameObject){
				if("_tid" in obj && obj._tid == name){
					out.push(obj);
				}
			}
		}
	}
	return out;
}
Trigger.activate = function(targets){
	var objects = Trigger.getTargets(targets);
	for(var j=0; j < objects.length; j++){
		objects[j].trigger("activate", this);
	}	
}

AttackTrigger.prototype = Trigger.prototype;
AttackTrigger.prototype.constructor = GameObject;
function AttackTrigger(x,y,d,o){
	Trigger.apply(this,[x,y,d,o]);
	this.clearEvents("collideObject");
		
	o = o || {};
	this.team = 0;
	this.lifeMax = this.life = 1;
	this.defencePhysical = 0;
	this.defenceFire = 0;
	this.defenceSlime = 0;
	this.defenceIce = 0;
	this.defenceLight = 0;
	
	if(!("retrigger" in o)){
		this.retrigger = 0;
	}
	if("life" in o){
		this.lifeMax = this.life = o["life"] * 1;
	}
	
	this.on("struck", EnemyStruck);
	this.on("hurt", function(obj,damage){
		//this.states.attack = 0;
		audio.play("hurt");
	});
	this.on("death", function(){
		this.trigger("activate");
		if(this.retrigger){
			this.dead = false;
			this.life = this.lifeMax;
			this.interactive = true;
		} else {
			this.destroy();
		}
	});
}
AttackTrigger.prototype.hurt = function(obj,damage){
	if(this.life > 0){
		var flatDamage = Combat.calcDamage.apply(this,[damage]);
		this.life -= flatDamage;
		this.trigger("hurt", obj, flatDamage);
		if(this.life <= 0){
			this.trigger("death");
		}
	}
}

Switch.prototype = Trigger.prototype;
Switch.prototype.constructor = GameObject;
function Switch(x,y,d,o){
	o = o || {};
	Trigger.apply(this,[x,y,d,o]);
	
	//Clear the on touch trigger
	this.clearEvents("collideObject");
	
	this.sprite = "switch";
	this.playerover = false;
	this.frame.x = 0;
	this.frame.y = 0;
	this.zIndex = -1;
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			this.playerover = true;
			if(this.triggerCount==0 && this.retrigger && input.state("up") == 1){
				this.trigger("open");
			}
		}
	});
	this.on("open", function(){
		if(this.time <= 0){
			this.trigger("activate");
		}else{
			this.countdown = true;
		}
		audio.play("switch");
	});
	
	this.render = function(g,c){
		this.frame.x = this.triggerCount > 0 ? 1 : 0;
		
		if(this.triggerCount==0 && this.retrigger){
			Background.pushLight(this.position.add(new Point(this.width*0.5,this.height*0.5)),96);
		}
		GameObject.prototype.render.apply(this,[g,c]);
	}
	
	this.postrender = function(g,c){
		if(this.triggerCount==0 && this.retrigger){
			if(this.playerover){
				var pos = _player.position.subtract(c);
				pos.y -= 24;
				g.renderSprite("text",g,pos,this.zIndex,new Point(4,6));
				this.playerover = false;
			}
		}
	}
}

class GearSwitch extends GameObject{
	constructor(x, y, d, o){
		super(x,y,d,o);
		this.origin = new Point();
		this.position.x = x;
		this.position.y = y;
		this.width = 24;
		this.height = 24;
		
		this.rotation = 0.0;
		this.rotation_to = 0.0;
		
		this.sprite = "switch_pressure";
		
		this.targets = o.getString("target","").split(",");
		this.turnAmount = o.getFloat("turnamount", 12);
		this.speed = o.getFloat("speed", 1.0) * 24;
		
		this.addModule(mod_combat);
		this.life = this.lifeMax = 999;
		
		this.on("hurt", function(obj){
			this.rotation_to += 12;
			this.life = this.lifeMax;
			Trigger.activate(this.targets);
		});
	}
	update(){
		if(this.rotation < this.rotation_to){
			this.rotation += this.delta * this.speed;
			
			if(this.rotation >= this.rotation_to){
				this.rotation = this.rotation_to;
			}
		}
	}
	render(g,c){
		g.renderSprite(
			this.sprite,
			this.position.subtract(c),
			this.zIndex,
			this.frame,
			this.flip,
			{
				"rotate" : this.rotation
			}
		);
	}
}

self["GearSwitch"] = GearSwitch;

class PressureSwitch extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = 32;
		this.height = 32;
		
		this.sprite = "switch_pressure";
		this.playerover = false;
		this.frame = new Point(0,0);
		this.targets = new Array();
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(obj.grounded){
					this.press();
				}
			}
		});
		
		if("target" in ops){
			this.targets = ops.target.split(",");
		}
	}
	
	press(){
		if(!this.playerover){
			Trigger.activate(this.targets);
			this.playerover = true;
		}
	}
	
	update(){
		if(this.playerover){
			this.frame.x = Math.min(this.frame.x + this.delta * 0.5, 2);
			this.playerover = false;
		} else {
			this.frame.x = Math.max(this.frame.x - this.delta * 0.5, 0);
		}
	}
}

self["PressureSwitch"] = PressureSwitch;