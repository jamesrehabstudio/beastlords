Villager.prototype = new GameObject();
Villager.prototype.constructor = GameObject;
function Villager(x,y,t,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = 16;
	this.height = 32;
	this.start_x = x;
	this.sprite = "characters";
	this.town = t || _world.towns[1];
	
	this.state = 0;
	this.speed = 0.5 + Math.random() * 0.9;
	
	this.addModule(mod_talk);
	
	this.path = Math.floor(Math.random()*3); //0 back and forth, 1 loop, 2 still
	this.direction = Math.random()>0.5?1:-1;
	
	var m = Villager.getMessage(this.town);
	
	this.message = m.message;
	
	o = o || {};
	try{
		this.builder = "builder" in o;
		if( "path" in o ){
			this.path = 1 * o.path;
		}
		if( "script" in o ){
			
		}
		
	} catch(err){}

	this.base_frame = 0;
	this.frame_row = 1;
	
	if(m.frames.length > 0 ){
		var f = m.frames[ Math.floor( Math.random()*m.frames.length ) ];
		this.base_frame = f[0];
		this.frame_row = f[1];
	}
	
	this.frame = this.base_frame;
}
Villager.prototype.update = function(){
	if( this.open ){
		game.pause = true;
		if(input.state("fire") == 1){
			this.state++;
			if( this.state >= this.message.length ){
				this.state = 0;
				this.close();
				game.pause = false;
			}
		}
		if( input.state("jump") == 1 || input.state("pause") == 1 || input.state("select") == 1){
			this.close();
			game.pause = false;
		}
	} else {
		if( this.builder ) {
			this.frame = (this.frame + this.delta * 0.125) % 3;
			this.frame_row = 3;
			this.direction = 0;
		} else if( this.path == 0 ){
			if(this.position.x-this.start_x < -64) this.direction = 1;
			if(this.position.x-this.start_x > 64) this.direction = -1;
		} else if( this.path == 1) {
			if(this.direction < 0 && this.position.x+32 < _player.lock.start.x) this.position.x = _player.lock.end.x + 32;
			if(this.direction > 0 && this.position.x-32 > _player.lock.end.x) this.position.x = _player.lock.start.x - 32;
		} else {
			this.direction = 0;
		}
		this.position.x +=this.direction * this.delta * this.speed;
		this.flip = this.direction < 0;
		
		this.frame = Math.max( (this.frame + Math.abs(this.direction) * this.delta * this.speed * 0.2) % (this.base_frame+3), this.base_frame);
	}
}
Villager.prototype.hudrender = function(g,c){	
	if( this.open > 0 ) {
		//Get message
		var m = this.message[this.state];
		
		//m = m.replace("%TOWNNAME%",this.town.name);
		
		renderDialog(g, m);
	}
}
Villager.prototype.idle = function(){}
Villager.getMessage = function(town){
	return Villager.TextOptions[0];
	
	var total = 0.0;
	for(var i=0; i < Villager.TextOptions.length; i++) {
		var conditions = Villager.TextOptions[i].conditions;
		if(
			(!("nation" in conditions ) || conditions.nation == town.nation) &&
			(!("faith" in conditions ) || conditions.faith == town.faith) &&
			(!("capital" in conditions ) || conditions.capital == town.capital) &&
			(!("min_size" in conditions ) || conditions.min_size <= town.size) &&
			(!("max_size" in conditions ) || conditions.max_size >= town.size) &&
			(!("min_town" in conditions ) || conditions.min_town <= town.id) &&
			(!("max_town" in conditions ) || conditions.max_town >= town.id)
		) {
			total += Villager.TextOptions[i].rarity;
		}
	}
	var roll = Math.random() * total;
	for(var i=0; i < Villager.TextOptions.length; i++) {
		var conditions = Villager.TextOptions[i].conditions;
		if(
			(!("nation" in conditions ) || conditions.nation == town.nation) &&
			(!("faith" in conditions ) || conditions.faith == town.faith) &&
			(!("capital" in conditions ) || conditions.capital == town.capital) &&
			(!("min_size" in conditions ) || conditions.min_size <= town.size) &&
			(!("max_size" in conditions ) || conditions.max_size >= town.size) &&
			(!("min_town" in conditions ) || conditions.min_town <= town.id) &&
			(!("max_town" in conditions ) || conditions.max_town >= town.id)
		) if(roll <= Villager.TextOptions[i].rarity) {
			return Villager.TextOptions[i];
		} else {
			roll -= Villager.TextOptions[i].rarity;
		}
	}
	return Villager.TextOptions[0];
}
Villager.script = {
	"q0_0" : function(world){
		var talk = i18n("villagerq0_0");
		var quest = quests.q0;
		if(quest == "complete") return talk[3];
		if(quest == 0){
			world.q0 = 1;
			return talk[0];
		}
		return talk [quest];
	}
	
}
Villager.TextOptions = [
{"rarity":1.0,"frames":[],"conditions":{"capital":true,"faith":1,"nation":1,"min_size":0,"max_size":5},"message":["Hello."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3],[0,4],[0,5]],"conditions":{},"message":["Good day."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["Good luck on your journey. Bring your father back safely."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["No matter how far you go, you'll always have a home here."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["When you return we'll have a celebration in your honour."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"max_town":0},"message":["All of %TOWNNAME% wishes you luck on your journey."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3],[0,4],[0,5]],"conditions":{"min_town":1,"max_size":1},"message":["What are you?"]},
{"rarity":1.0,"frames":[[0,1]],"conditions":{"min_town":1},"message":["You're a strange looking creature, aren't you?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["Welcome to the %TOWNNAME%."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["It's a fine day, is it not?"]},
{"rarity":1.0,"frames":[[0,4],[0,5]],"conditions":{"min_town":1},"message":["You're one of those creatures. You stole my brother.","I want him back!"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1},"message":["My son was taken by the trance. I hope he's safe."]},
{"rarity":1.0,"frames":[[0,4],[0,5]],"conditions":{"min_town":4},"message":["Why are all the people taken by the trance always so weird?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":4,"min_size":2},"message":["My neighbour was taken by the trance.","He was a weird one. But he meant no harm to anyone.","He didn't deserve that."]},
{"rarity":1.0,"frames":[[0,1]],"conditions":{"min_town":3},"message":["My husband was taken by the trance.","What was worse is a few weeks later one of your kind broke into my home.","We put it right. It was hanged in the town square."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["Poor creature, is there any hope for something like you?"]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["Get to the church, maybe God can still save your soul."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":0},"message":["I will pray for you, poor forsaken beast."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Get away from me, vile thing."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Your kind is a blight to this world."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":1},"message":["Do the only decent thing, end your sorry life."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":2},"message":["Your presence is corrupting. Get out of our fair town."]},
{"rarity":1.0,"frames":[[0,1],[0,2],[0,3]],"conditions":{"min_town":1,"faith":2},"message":["The mere sight of you is harmful to my spirit."]},
{"rarity":1.0,"frames":[[0,2],[0,3]],"conditions":{"min_town":1,"nation":2},"message":["Strong warriors like you would serve well in the militias."]},
{"rarity":1.0,"frames":[[0,2],[0,3]],"conditions":{"min_town":1,"nation":2},"message":["You hold your weapon well. A sign of a true warrior."]}
];