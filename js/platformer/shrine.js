Shrine.prototype = new GameObject();
Shrine.prototype.constructor = GameObject;
function Shrine(x, y, d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "shrine";
	
	this.frame.x = 0;
	this.frame.y = 0;
	
	this.width = 64;
	this.height = 32;
	
	this.addModule( mod_talk );
	
	this.useable = true;
	this.spells = new Array();
	
	this.useTimer = Game.DELTASECOND;
	
	if("spells" in ops){
		var s = ops["spells"].split(",");
		for(var i=0; i < s.length; i++){
			try{
				var newSpell = new self[s[i].trim()]();
				if(!(newSpell instanceof Spell)){
					throw "Invalid";
				}
				this.spells.push(newSpell);
			}catch(e){
				console.warn("Invalid spell name: "+s[i]);
			}
		}
	}
	
	this.on("open", function(){
		if(this.useable){
			this.use();
		}
		this.close();
	});
	
	this.on("close", function(){
		
	});
	
	
}


Shrine.prototype.update = function(){
	
	//Animate
	if(this.useable){
		Background.pushLight(this.position, 64, COLOR_FIRE);
		this.frame.y = (this.frame.y + this.delta * 0.5) % 4;
	} else {
		this.frame.x = 1; 
		this.frame.y = 0;
	}
}

Shrine.prototype.use = function(){
	for(var i=0; i < this.spells.length; i++){
		var alreadyOwned = false;
		for(var j=0; j < _player.spells.length; j++){
			if(_player.spells[j].name == this.spells[i].name){
				alreadyOwned = true;
				_player.spells[j].stock = _player.spells[j].stockMax;
			}
		}
		if(!alreadyOwned){
			_player.spells.push(this.spells[i]);
		}
		
	}
	game.addObject(new ShrineEffect(this.position.x, this.position.y));
	this.useable = false;
}

Shrine.prototype.render = function(g,c){
	GameObject.prototype.render.apply(this,[g,c]);
	
	for(var i=0; i < this.spells.length; i++){
		var spell = this.spells[i];
		if(spell instanceof Spell){
			var ypos = 16 * i;
			g.renderSprite(this.sprite,this.position.add(new Point(0,-32-ypos)).subtract(c),0,new Point(1,1));
			if(this.useable){
				spell.render(g,this.position.add(new Point(0,-24-ypos)).subtract(c));
			}
		}
	}
}

ShrineEffect.prototype = new GameObject();
ShrineEffect.prototype.constructor = GameObject;
function ShrineEffect(x, y, d, ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.sprite = "bullets";
	this.frame = new Point(3,2);
	
	this.finalPosition = new Point(40,12);
	this.sparksCount = 12;
	this.sparkForce = 3;
	this.sparkSpeed = 0.1;
	this.sparks = new Array();
	for(var i=0; i < this.sparksCount; i++){
		this.sparks.push({
			"position" : this.position.subtract(game.camera),
			"force" : new Point(
				this.sparkForce * Math.sin((i/this.sparksCount) * Math.PI * 2), 
				this.sparkForce * Math.cos((i/this.sparksCount) * Math.PI * 2)
			)
		})
	}
}
ShrineEffect.prototype.hudrender = function(g,c){
	for(var i=0; i < this.sparksCount; i++){
		var spark = this.sparks[i];
		if(spark.force.length() < 0.2){
			spark.position = Point.lerp(spark.position, this.finalPosition, this.delta * this.sparkSpeed);
		} else {
			spark.position = spark.position.add(spark.force.scale(this.delta));
			spark.force = spark.force.scale(1-(0.1*this.delta));
		}
		g.renderSprite(this.sprite,spark.position,1,this.frame);
	}
	
	if(spark.position.subtract(this.finalPosition).length() < 1.0){
		this.destroy();
	}
}