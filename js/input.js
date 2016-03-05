function Input() {
	this.INPUT_KEYS = ["block","click","down","fire","left","jump","pause","right","select","space","up","spell"];
	this.CHROME_MAP = { "-1":'click', 16:"block", 74:"fire", 75:"jump", 65:'left', 68:'right', 83:'down', 69:'spell', 87:'up', 32:'space', 13:'pause',81:'select' };
	this.XBOX_MAP = {14:"left",15:"right",12:"up",13:"down",0:"jump",2:"fire",3:"spell",5:"block",8:"select",9:"pause"};
	this.AXIS_THRESHOLD = 0.3;

	this.states = {};
	this.joystates = {};
	this.mouseCenter;
	
	this.init();
}

Input.prototype.init = function() {
	input_self = this;
	for(var i=0; i < this.INPUT_KEYS.length; i++) {
		this.states[this.INPUT_KEYS[i]] = 0;
		this.joystates[this.INPUT_KEYS[i]] = 0;
	}
	this.mouseCenter = new Point(0,0);
	
	window.onkeydown = function(e){ input_self.stateDown( e.keyCode ); }
	window.onkeyup = function(e){ input_self.stateUp( e.keyCode ); }
	window.onmousemove = function(e){ input_self.stateMove(e);}
	window.onmousedown = function(e){ input_self.stateDown(-1);}
	window.onmouseup = function(e){ input_self.stateUp(-1);}
	
	if( "getGamepads" in navigator ) {
		
	} else if( "webkitGetGamepads" in navigator ) {
		navigator.getGamepads = navigator.webkitGetGamepads;
	}
	
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
	if ( key in this.states && key in this.joystates ) {
		return Math.max(this.states[key], this.joystates[key]);
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
	
	//Update controller layout
	var cont = navigator.getGamepads()[0];
	var map = this.XBOX_MAP;
	
	if( cont != undefined ) {
		/*
		this.joystates["left"] = ( cont.axes[0] < -this.AXIS_THRESHOLD ) ? this.joystates["left"]+1 : 0;
		this.joystates["right"] = ( cont.axes[0] > this.AXIS_THRESHOLD ) ? this.joystates["right"]+1 : 0;
		this.joystates["up"] = ( cont.axes[1] < -this.AXIS_THRESHOLD ) ? this.joystates["up"]+1 : 0;
		this.joystates["down"] = ( cont.axes[1] > this.AXIS_THRESHOLD ) ? this.joystates["down"]+1 : 0;
		*/
		for(var i in map) if( i in cont.buttons ) {
			var button = map[i];
			if( cont.buttons[i].pressed ) {
				this.joystates[button] += 1;
			} else { 
				this.joystates[button] = 0;
			}
		}
	}
}
