Trigger.prototype = new GameObject();
Trigger.prototype.constructor = GameObject;
function Trigger(x,y,n,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.origin.x = this.origin.y = 0;
	
	this.width = this.height = 32;
	this.targets = new Array();
	this.darknessFunction = null;
	this.triggerCount = 0;
	this.retrigger = 1;
	
	o = o || {};
	if("width" in o){
		this.width = o.width * 1;
	}
	if("height" in o){
		this.height = o.height * 1;
	}
	if("target" in o){
		this.targets = o.target.split(",");
	}
	if("darkness" in o){
		this.darknessFunction = new Function("c","return " + o.darkness)
	}
	if("retrigger" in o){
		this.retrigger = o.retrigger * 1;
	}
	
	this.on("collideObject", function(obj){
		if(obj instanceof Player){
			if(this.retrigger || this.triggerCount == 0){
				this.triggerCount++;
				
				if(this.darknessFunction instanceof Function){
					var b = game.getObject(Background);
					if(b instanceof Background){
						b.darknessFunction = this.darknessFunction;
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
}
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