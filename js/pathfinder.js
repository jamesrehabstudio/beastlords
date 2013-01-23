// Async JS for finding paths off the game's main thread.

self.objects = {};
self.structure = false;

self.onmessage = function(e){
	if ( e.data.structure != undefined ){
		self.structure = e.data.structure;
	} else if ( e.data.object != undefined ){
		self.objects[e.data.object.id] = e.data.object;
	}
}

function distance(a,b){
	var x = a.x - b.x;
	var y = a.y - b.y;
	
	return Math.sqrt(x * x + y * y);
}

function linkTo (current,target,path){
	//Create path if this if the first test
	path = path || {'length':0,'chain':[]};
	
	//Kill chain if it's too long
	if( path.chain.length > 8 ) return false;
	for(var i=0; i<path.chain.length;i++){
		//End Path if it has gone back on itself
		if( path.chain[i] == this ) return false;
	}
	
	//Start by adding this node
	path.chain.push(current);
	
	//_me is set to this node's values, and not just its index
	var _me = self.structure[current];	
	
	//Sort connections in order of distance from target
	_me.connections.sort(function(a,b){
		return distance(structure[a],target) < distance(structure[b],target) ? 1 : -1;
	});
	
	for(var i=0; i < _me.connections.length;i++){
		temp = linkTo(_me.connections[i],target,path);
		if( temp ){
			return path;
		}
	}
	path.chain.pop();
	return false;
}

var update = function(){
	if ( self.structure ) {
		var index=false;
		for(index in self.objects) break;
		if ( index ) {
			self.objects[index].x += 3;
			self.postMessage( {'object':self.objects[index]} );
			delete self.objects[index];
		}
	}
	//self.postMessage( '' );
	setTimeout( update, 20 );
}

update();