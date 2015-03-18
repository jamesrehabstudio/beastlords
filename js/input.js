function Input() {
	this.CHROME_MAP = { "-1":'click', 72:"block", 74:"fire", 75:"jump", 65:'left', 68:'right', 83:'down', 87:'up', 32:'space', 13:'pause',16:'select' };

	this.states;
	this.mouseCenter;
	
	this.init();
}

Input.prototype.init = function() {
	input_self = this;
	this.states = {};
	this.mouseCenter = new Point(0,0);
	
	window.onkeydown = function(e){ input_self.stateDown( e.keyCode ); }
	window.onkeyup = function(e){ input_self.stateUp( e.keyCode ); }
	window.onmousemove = function(e){ input_self.stateMove(e);}
	window.onmousedown = function(e){ input_self.stateDown(-1);}
	window.onmouseup = function(e){ input_self.stateUp(-1);}
	
	window.onblur = function(e){ input_self.clearAll(); }
}

Input.prototype.clearAll = function(e){
	for( var i in this.states ) {
			this.states[i] = 0;
	}
}

Input.prototype.stateMove = function(e){
	this.mouseCenter.x = e.clientX / 3; 
	this.mouseCenter.y = e.clientY / 3; 
}

Input.prototype.state = function( key ) {
	if ( this.states[key] != undefined ) {
		return this.states[key];
	}
	return 0;
}

Input.prototype.stateDown = function( code ) {
	if ( this.CHROME_MAP[code] != undefined ) {
		var button = this.CHROME_MAP[code];
		if ( this.states[button] == undefined ) { this.states[button] = 0; }
		this.states[button] += 1;
	}
	//console.log(code);
}

Input.prototype.stateUp = function( code ) {
	if ( this.CHROME_MAP[code] != undefined ) {
		var button = this.CHROME_MAP[code];
		this.states[button] = 0;
	}
}

Input.prototype.update = function( ) {
	for( var i in this.states ) {
		if ( this.states[i] > 0 ) {
			this.states[i]++;
		}
	}
}