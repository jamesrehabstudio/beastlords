Spawn.prototype = new GameObject();
Spawn.prototype.constructor = GameObject;
function Spawn(x,y,d,ops){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.visible = false;
	this.width = 16;
	this.height = 16;
	
	this.on("open",function(obj){
	});
	
	ops = ops || {};
	
	this.difficulty = ops.difficulty || dataManager.currentTemple;
	this.theme = ops.theme || "default";
	
	if( "tags" in ops ){
		this.tags = ops.tags.split(",");
	} else { 
		this.tags = new Array();
	}
	
	this.enemies = [];
	
	this.spawn();
}

Spawn.prototype.spawn = function(){
	try{
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
		
		for(var j=0; j < selected.enemies.length; j++){
			var name = selected.enemies[j];
			try {
				var object = new window[ name ]( 
					this.position.x + j * 24,
					this.position.y 
				);
				game.addObject( object );
				this.enemies.push( object );
			} catch (e) {
				console.error( "cannot create object: " + name );
			}
		}
	} catch( err ) {
		console.error( "No valid enemy matching tags: " + this.tags );
	}
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
		{"tags":["major","ranged"],"difficulty":[2,99],"enemies":["Chaz"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Igbo"]},
		{"tags":["major"],"difficulty":[4,99],"enemies":["Yeti"]},
		
		{"tags":["minor"],"difficulty":[0,99],"enemies":["Flederknife"]},
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
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Laughing","Laughing","Laughing","Laughing","Laughing","Laughing"]},
		{"tags":["minor","flying"],"difficulty":[2,99],"enemies":["Ghoul"]},
		{"tags":["minor","flying"],"difficulty":[3,99],"enemies":["Svarog"]}
		
		
	]
};