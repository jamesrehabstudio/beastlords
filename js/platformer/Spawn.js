Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = d[0];
	this.height = d[1];
	this.difficulty = Spawn.difficulty;
	this.specific = null;
	this.autodestroy = 0;
	this.enemies = new Array();
	this.enemiesLimit = 1;
	this.active = false;
	this.respawn = false;
	this.timer = 0.0;
	this.timerTotal = 0.0;
	this.edgespawn = false;
	this.idleMargin = 0;
	this.spawnRest = Game.DELTASECOND * 20;
	this.lastSpawn = Number.MIN_SAFE_INTEGER;
	
	this.on("activate",function(obj){
		this.clear();
		this.spawn();
		this.active = true;
	});
	
	this.options = ops || {};
	var autospawn = 1;
	
	if("enemies" in this.options){
		this.specific = this.options["enemies"].split(",");
	}
	if("limit" in this.options){
		this.enemiesLimit = this.options.limit * 1;
	}
	if("theme" in this.options){
		this.theme = this.options.theme;
	}
	if("difficulty" in this.options){
		this.difficulty = this.options.difficulty * 1;
	}
	if("autodestroy" in this.options){
		this.autodestroy = this.options.autodestroy * 1;
	}
	if("autospawn" in this.options){
		autospawn = this.options.autospawn * 1;
		this.active = autospawn;
	}
	if("edgespawn" in this.options){
		this.edgespawn = this.options.edgespawn * 1;
	}
	if("respawn" in this.options){
		this.respawn = this.options["respawn"] * 1;
	}
	if( "tags" in this.options ){
		this.tags = this.options.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	if("timer" in this.options){
		this.timerTotal = this.options["timer"] * Game.DELTASECOND;
		this.timer = this.timerTotal;
	}
	if("spawnrest" in this.options){
		this.spawnRest = this.options.spawnrest * Game.DELTASECOND;
	}
	if("trigger" in this.options){
		this._tid = this.options.trigger;
	}
	
	this.on("wakeup",function(){
		if(this.active && this.count() < this.enemiesLimit){
			this.spawn();
		}
	});
}

Spawn.prototype.update = function(){
	if(this.count() >= this.enemiesLimit){
		this.lastSpawn = game.timeScaled;
	} else {
		if(this.timerTotal > 0){
			this.timer -= this.delta;
			if(this.timer <= 0){
				this.timer = this.timerTotal;
				this.spawn();
			}
		}
	}
}

Spawn.prototype.spawn = function(){
	try{
		if(this.lastSpawn + this.spawnRest > game.timeScaled){
			return;
		}
		
		this.lastSpawn = game.timeScaled;
		this.active = this.respawn;
		
		if(this.specific instanceof Array){
			this.create(this.specific);
		}else {
			if(!(this.theme in Spawn.enemies )) {
				this.theme = "default";
			}
			
			var list = Spawn.enemies[this.theme];
			var indices = new Array();
			this.enemies = new Array();
			
			for(var i=0; i < list.length; i++){
				if( 
					list[i].difficulty[0] <= this.difficulty && 
					list[i].difficulty[1] >= this.difficulty && 
					this.tags.intersection(list[i].tags).length == this.tags.length
				){
					indices.push( i );
				}
			}
			var selected = list[indices[ Math.floor( Math.random() * indices.length ) ]];
			
			this.create(selected.enemies);
		}
	} catch( err ) {
		console.error( "No valid enemy matching tags: " + this.tags );
	}
}
Spawn.prototype.isAlive = function(enemies){
	return this.count() > 0;
}
Spawn.prototype.count = function(enemies){
	var count = 0;
	for(i=0; i < this.enemies.length; i++){
		if(game.objects.indexOf(this.enemies[i]) >= 0){
			if(this.enemies[i].life > 0){
				count++;
			}
		}
	}
	return count;
}
Spawn.prototype.create = function(enemies){
	for(var j=0; j < enemies.length; j++){
		var that = this;
		var name = enemies[j];
		try {
			var sposition = this.spawnPosition(j);
			var object = new self[ name ]( 
				sposition.x,
				sposition.y,
				null,
				this.options
				//{"difficulty":this.difficulty}
			);
			object.on("swap", function(obj){
				that.enemies.remove(that.enemies.indexOf(this));
				that.enemies.push(obj);
				if(that.autodestroy){
					obj.on("sleep", function(){this.destroy();});
				}
			});
			if(this.autodestroy){
				object.on("sleep", function(){this.destroy();});
			}
			game.addObject( object );
			this.enemies.push( object );
		} catch (e) {
			console.error( "cannot create object: " + name );
		}
	}
}
Spawn.prototype.spawnPosition = function(i){
	if(this.edgespawn){
		var c = this.corners();
		var leftPos = game.camera.x;
		var rightPos = game.camera.x + game.resolution.x
		var left = c.left < leftPos;
		var right = c.right > rightPos;
		if(left && right){
			if(Math.random()>0.5){
				return new Point(leftPos, this.position.y);
			} else {
				return new Point(rightPos, this.position.y);
			}
		} else {
			if(left){
				return new Point(leftPos, this.position.y);
			} else{
				return new Point(rightPos, this.position.y);
			}
		}
	} else {
		return new Point(this.position.x + i*24, this.position.y);
	}
	return new Point(this.position.x, this.position.y);
}
Spawn.prototype.clear = function(){
	for(var i=0; i < this.enemies.length; i++){
		if(this.enemies[i] instanceof GameObject){
			this.enemies[i].destroy();
		}
	}
	this.enemies = new Array();
}

Spawn.addToList = function(pos,list, type, max, ops){
	var slot = -1;
	var obj;
	max = max == undefined ? 5 : max;
	
	for(var i=0; i < max; i++){
		if(i >= list.length ){
			slot = i;
			break;
		} else if(list[i] instanceof type){
			if(game.objects.indexOf(list[i]) < 0 || list[i].life <= 0){
				slot = i;
				break;
			}
		}
	}
	
	if(slot >= 0){
		obj = new type(pos.x, pos.y, false, ops);
		//obj.on("sleep", function(){ this.destroy();});
		obj.xp_award = 0;
		game.addObject(obj);
		list[slot] = obj;
	}
	
	return obj;
}
Spawn.countList = function(list){
	var count = 0;
	for(var i=0; i < list.length; i++){
		if(list[i] instanceof GameObject){
			if(game.objects.indexOf(list[i]) >= 0 && list[i].life > 0){
				count++;
			}
		}
	}
	return count;
}

Spawn.enemies = {
	"boss" : [
		{"tags":[],"difficulty":[0,0],"enemies":["Chort"]},
		{"tags":[],"difficulty":[1,1],"enemies":["Marquis"]},
		{"tags":[],"difficulty":[2,2],"enemies":["Minotaur"]},
		{"tags":[],"difficulty":[2,2],"enemies":["Ammit"]},
		{"tags":[],"difficulty":[3,3],"enemies":["Garmr"]},
		{"tags":[],"difficulty":[3,3],"enemies":["Zoder"]},
		{"tags":[],"difficulty":[4,4],"enemies":["Poseidon"]}
	],
	"default" : [
		//{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]},
		
		{"tags":["miniboss"],"difficulty":[0,0],"enemies":["Skeleton"]},
		{"tags":["miniboss"],"difficulty":[2,3],"enemies":["ChickenChain"]},
		{"tags":["miniboss"],"difficulty":[0,0],"enemies":["Bear"]},
		{"tags":["miniboss"],"difficulty":[1,2],"enemies":["Oriax"]},
		{"tags":["miniboss"],"difficulty":[1,99],"enemies":["Knight"]},
		{"tags":["miniboss"],"difficulty":[3,3],"enemies":["Yeti"]},
		{"tags":["miniboss"],"difficulty":[3,4],"enemies":["Igbo"]},
		{"tags":["miniboss"],"difficulty":[4,99],"enemies":["ChazBike"]},
		{"tags":["miniboss"],"difficulty":[3,99],"enemies":["Baller"]},
		
		{"tags":["major"],"difficulty":[1,3],"enemies":["Skeleton"]},
		{"tags":["major"],"difficulty":[0,2],"enemies":["Bear"]},
		{"tags":["major"],"difficulty":[3,4],"enemies":["Oriax"]},
		{"tags":["major","ranged"],"difficulty":[0,99],"enemies":["Chaz"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Igbo"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Yeti"]},
		{"tags":["major","ranged"],"difficulty":[4,99],"enemies":["ChickenChain"]},
		
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Flederknife"]},
		{"tags":["minor"],"difficulty":[2,99],"enemies":["Flederknife","Flederknife"]},
		{"tags":["minor"],"difficulty":[1,99],"enemies":["HammerMathers"]},
		{"tags":["minor"],"difficulty":[3,99],"enemies":["Ratgut"]},
		{"tags":["minor"],"difficulty":[4,99],"enemies":["Skeleton"]},
		//{"tags":["major"],"difficulty":[0,99],"enemies":["Malsum"]},
		{"tags":["minor"],"difficulty":[4,99],"enemies":["Oriax"]},
		{"tags":["minor"],"difficulty":[0,2],"enemies":["Beaker"]},
		{"tags":["minor","ledge"],"difficulty":[0,1],"enemies":["Shell"]},
		{"tags":["minor","ledge"],"difficulty":[0,99],"enemies":["Axedog"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Batty"]},
		{"tags":["minor","flying"],"difficulty":[0,3],"enemies":["Amon"]},
		{"tags":["minor","flying"],"difficulty":[2,4],"enemies":["Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Laughing","Laughing","Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Ghoul"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]}
	],
	"undead" : [
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Ghoul"]},
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Ratgut"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Batty"]},
		{"tags":["minor","flying"],"difficulty":[0,99],"enemies":["Svarog"]},
		{"tags":["major"],"difficulty":[0,99],"enemies":["Skeleton"]},
		{"tags":["miniboss"],"difficulty":[0,99],"enemies":["BigBones"]}
	]
};

Spawn.damage = function(level,difficulty){
	var damage = 5; //0 very little
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	switch(level){
		case 1: damage = 2.5; break;//1 weak, bashing into normal enemy
		case 2: damage = 4.0; break;//2 strike from minor enemy
		case 3: damage = 5.0; break;//3 strike from major enemy
		case 4: damage = 6.0; break;//4 strike from miniboss
		case 5: damage = 7.5; break;//5 strike from boss
		case 6: damage = 10.0; break;//6 strike from SUPER boss
	}
	
	var multi = 1 + difficulty * 0.3;
	damage = Math.floor( damage * multi );
	return damage;
}

Spawn.life = function(level, difficulty){
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	if( level == 0 ) return 3; //Always one shot
	var multi = 1 + difficulty * 0.6;
	return Math.floor( multi * level * 9 );
}

Spawn.difficulty = 0;