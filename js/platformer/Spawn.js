Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = 16;
	this.height = 16;
	this.difficulty = Spawn.difficulty;
	this.specific = null;
	this.autodestroy = 0;
	this.enemies = new Array();
	this.active = false;
	this.timer = 0.0;
	this.timerTotal = 0.0;
	
	this.on("activate",function(obj){
		this.spawn();
		this.active = true;
	});
	
	ops = ops || {};
	var autospawn = 1;
	
	if("enemies" in ops){
		this.specific = ops["enemies"].split(",");
	}
	if("theme" in ops){
		this.theme = ops.theme;
	}
	if("difficulty" in ops){
		this.difficulty = ops.difficulty * 1;
	}
	if("autodestroy" in ops){
		this.autodestroy = ops.autodestroy * 1;
	}
	if("autospawn" in ops){
		autospawn = ops.autospawn * 1;
		this.active = autospawn;
	}
	if("respawn" in ops){
		this.on("wakeup",function(){
			if(this.active && !this.isAlive()){
				this.spawn();
			}
		});
	}
	if( "tags" in ops ){
		this.tags = ops.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	if("timer" in ops){
		this.timerTotal = ops["timer"] * Game.DELTASECOND;
		this.timer = this.timerTotal;
	}
	if("trigger" in ops){
		this._tid = ops.trigger;
	}
	
	if(autospawn){
		//Spawn on creation
		this.spawn();
	}
}

Spawn.prototype.update = function(){
	if(this.timerTotal > 0){
		this.timer -= this.delta;
		if(this.timer <= 0){
			this.timer = this.timerTotal;
			if(!this.isAlive()){
				this.spawn();
			}
		}
	}
}

Spawn.prototype.spawn = function(){
	try{
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
	var alive = false;
	for(i=0; i < this.enemies.length; i++){
		if(game.objects.indexOf(this.enemies[i]) >= 0){
			if(this.enemies[i].life > 0){
				alive = true;
			}
		}
	}
	return alive;
}
Spawn.prototype.create = function(enemies){
	for(var j=0; j < enemies.length; j++){
		var that = this;
		var name = enemies[j];
		try {
			var object = new self[ name ]( 
				this.position.x + j * 24,
				this.position.y,
				null,
				{"difficulty":this.difficulty}
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
	
	var multi = 1 + difficulty * 0.25;
	damage = Math.floor( damage * multi );
	return damage;
}

Spawn.life = function(level, difficulty){
	
	if(difficulty == undefined){
		difficulty = Spawn.difficulty;
	}
	
	if( level == 0 ) return 3; //Always one shot
	var multi = 5 + difficulty * 3.125;
	return Math.floor( multi * level );
}

Spawn.difficulty = 0;