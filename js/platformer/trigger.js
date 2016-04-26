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
	this.darknessFunction = null;
	this.darknessColour = null;
	this.dustCount = null;
	this.sealevel = null;
	this.triggerCount = 0;
	this.retrigger = 1;
	this.retriggertime = Game.DELTASECOND;
	this.retriggertimeCooldown = 0;
	
	this.countdown = 0;
	this.timer = 0;
	this.time = 0;
	
	o = o || {};
	
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
	
	this.on("activate", function(obj){
		if(this.retrigger || this.triggerCount == 0){
			this.triggerCount++;
			if(this.retriggertimeCooldown <= 0){
				this.retriggertimeCooldown = this.retriggertime;
				if(
					this.darknessFunction instanceof Function ||
					this.darknessColour instanceof Array ||
					this.dustCount != undefined ||
					this.sealevel != undefined
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
					}
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
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.time <= 0){
				this.trigger("activate");
			}else{
				this.countdown = true;
			}
		}
	});
}

Trigger.prototype.update = function(){
	if(this.countdown){
		if(this.timer <= 0){
			this.timer = this.time;
			this.countdown = false;
			this.trigger("activate");
		}
		this.timer -= this.delta;
	}
	this.retriggertimeCooldown -= this.delta;
}
Trigger.prototype.idle = function(){}

Trigger.getTargets = function(name){
	var out = new Array();
	if(game instanceof Game){
		for(var i=0; i < game.objects.length; i++){
			var obj = game.objects[i];
			if("_tid" in obj && obj._tid == name){
				out.push(obj);
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

Switch.prototype = Trigger.prototype;
Switch.prototype.constructor = GameObject;
function Switch(x,y,d,o){
	o = o || {};
	if(!("retrigger" in o)){
		//Set retrigger to 0 by default
		o["retrigger"] == 0;
	}
	Trigger.apply(this,[x,y,d,o]);
	
	//Clear the on touch trigger
	this.clearEvents("collideObject");
	
	this.sprite = sprites["switch"];
	this.playerover = false;
	this.frame = 0;
	this.frame_row = 0;
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
		this.frame = 1;
	});
	
	this.render = function(g,c){
		if(this.triggerCount==0 && this.retrigger){
			Background.pushLight(this.position.add(new Point(this.width*0.5,this.height*0.5)).subtract(c),96);
		}
		GameObject.prototype.render.apply(this,[g,c]);
	}
	
	this.postrender = function(g,c){
		if(this.triggerCount==0 && this.retrigger){
			if(this.playerover){
				var pos = _player.position.subtract(c);
				pos.y -= 24;
				sprites.text.render(g,pos,4,6);
				this.playerover = false;
			}
		}
	}
}
	