Slime.prototype = new GameObject();
Slime.prototype.constructor = GameObject;
function Slime(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 16;
	this.collideDamage = 0;
	this.team = 0;
	
	this.paletteSwaps = ["t0","t0","t2","t3","t4"];
	this.addModule(mod_rigidbody);
	this.addModule(mod_combat);
	this.sprite = "slime";
	this.speed = 0.3;
	this.visible = false;
	this.interactive = false;
	this.pushable = false;
	
	o = o || {};
	
	this.difficulty = Spawn.difficulty;
	if("difficulty" in o){
		this.difficulty = o["difficulty"] * 1;
	}
	
	this.times = {
		"cooldown" : Game.DELTASECOND * 0.25 + Game.DELTASECOND * Math.random(),
		"cooldownTime" : Game.DELTASECOND * 2.0,
		"transition" : 0.0,
		"melt" : 0,
		"move" : 0
	};
	
	this.on("struck", EnemyStruck);
	this.on("hurt",function(obj,damage){
		this.times.cooldown = 0.0;
		audio.play("hurt");
	});
	this.on("hurtOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("blockOther",function(obj,damage){
		this.times.cooldown = 0.0;
	});
	this.on("death", function(obj,pos,damage){
		Item.drop(this);
		_player.addXP(this.xp_award);
		audio.play("kill");
		this.destroy();
	});
	
	//Set opening state
	if(Math.random() > 0.5){
		this.visible = true;
		this.interactive = true;
		this.pushable = true;
		this.times.move = 1;
	}
	
	this.flip = Math.random() > 0.5;
	this.life = Spawn.life(0, this.difficulty);
	this.damage = Spawn.damage(1,this.difficulty);
	this.calculateXP();
}
Slime.prototype.update = function(){
	if(!this.grounded){
		this.frame.x = 0;
		this.frame.y = 2;
	} else if(this.times.move){
		this.frame.x = (this.frame.x + Math.abs(this.force.x) * this.delta * 0.1) % 5;
		this.frame.y = 0;
		if(this.flip){
			this.force.x -= this.speed * this.delta;
		} else{
			this.force.x += this.speed * this.delta;
		}
		
		if(this.interactive){
			this.strike(new Line(new Point(0,0), new Point(12,4)));
		}
		
		
		var forwardTile = game.getTile(this.position.add(new Point(this.flip?-16:16,0)));
		var underTile = game.getTile(this.position.add(new Point(0,16)));
		if(forwardTile > 0){
			this.flip = !this.flip;
		}
		this.times.cooldown -= this.delta;
		if(this.times.cooldown <= 0){
			//Stop moving and reappear
			this.times.move = 0;
			this.force.x = 0;
			this.times.transition = 0.0;
			//If it's interactive, it means it's currently alive
			this.times.melt = this.interactive;
			this.interactive = false;
		}
	} else {
		if(this.times.melt){
			//
			this.times.transition += this.delta * 0.1;
			this.frame.x = Math.floor(this.times.transition * 5);
			this.frame.y = 1;
			if(this.times.transition >= 1){
				this.visible = false;
				this.times.move = 1;
				this.times.cooldown = this.times.cooldownTime * 0.5;
				this.flip = Math.random() > 0.5;
			}
		} else {
			//reform
			this.visible = true;
			this.times.transition += this.delta * 0.1;
			this.frame.x = 5 - Math.floor(this.times.transition * 5);
			this.frame.y = 1;
			if(this.times.transition >= 1){
				this.interactive = true;
				this.times.move = 1;
				this.times.cooldown = this.times.cooldownTime;
			}
		}
	}
}
Slime.prototype.faceTarget = function(){
	var dir = _player.position.subtract(this.position);
	this.flip = dir.x < 0;
}