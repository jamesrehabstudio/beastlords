MonsterLock.prototype = new GameObject();
MonsterLock.prototype.constructor = GameObject;
function MonsterLock(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 32;
	this.height = 32;
	this.zIndex = 20;
	
	this.sprite = "monsterlock";
	
	o = o || {};
	
	this.addModule(mod_combat);
	
	this.target = false;
	this._tid = false;
	this.interactive = false;
	
	this.frame = new Point(0,0);
	this.frameFace = new Point(0,0);
	
	if("trigger" in o){
		this._tid = o["trigger"];
	}
	if("target" in o){
		this.target = o["target"];
	}
	
	this.on("activate", function(){
		this.interactive = true;
		if(this.target){
			Trigger.activate(this.target);
		}
	});
	
	this.on("hurt", function(obj, damage){
		audio.play("hurt",this.position);
	});
	
	this.on("death", function(){
		this.interactive = false;
		this.visible = false;
		if(this.target){
			Trigger.activate(this.target);
		}
	});
}

MonsterLock.prototype.update = function(){
	if(1){
		var dir = this.position.subtract(_player.position);
		this.frame.x = (this.frame.x + this.delta * 0.5) % 6;
		this.frame.y = 0;
		
		if(this.stun > 0 || this.life <= 0){
			this.frameFace.x = 5;
			this.frameFace.y = 3;
		} else if(Math.abs(dir.x) < 96 && Math.abs(dir.y) < 32){
			this.frameFace.x = 4;
			this.frameFace.y = 3;
		} else {
			this.frameFace.x = (this.frameFace.x + this.delta * 0.4) % 4;
			this.frameFace.y = 3;
		}
	}
}

MonsterLock.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex+1,this.frameFace);
}

MonsterDoor.prototype = new GameObject();
MonsterDoor.prototype.constructor = GameObject;
function MonsterDoor(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 64;
	this.zIndex = 20;
	
	this.sprite = "monsterlock";
	this.visible = false;
	this.open = true;
	this.openProgress = 0.0;
	this.frame.x = 0;
	this.frame.y = 1;
	
	if("trigger" in o){
		this._tid = o["trigger"];
	}
	
	this.on("activate", function(){
		this.open = !this.open;
	});
}

MonsterDoor.prototype.update = function(){
	var prog = this.openProgress / MonsterDoor.TIME_OPEN;
	
	if(this.open){
		if(this.openProgress >= 0){
			this.visible = true;
			this.openProgress -= this.delta;
			this.frame.x = Math.floor(prog*6);
			this.frame.y = 1;
		} else {
			this.visible = false;
		}
	} else {
		this.visible = true;
		if(this.openProgress < MonsterDoor.TIME_OPEN){
			this.openProgress += this.delta;
			this.frame.x = Math.floor(prog*6);
			this.frame.y = 1;
		} else {
			this.frame.x = 0;
			this.frame.y = 2;
		}
	}
	
	if(prog > 0){
		Background.pushLight(this.position, prog * 120, MonsterDoor.LOCK_COLOR);
	}
}
MonsterDoor.TIME_OPEN = Game.DELTASECOND * 0.4;
MonsterDoor.LOCK_COLOR = [0.9,0,1.0,1.0];