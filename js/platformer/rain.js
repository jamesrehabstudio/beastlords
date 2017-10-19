Rain.prototype = new GameObject();
Rain.prototype.constructor = GameObject;
function Rain(x, y, d, o){
	this.constructor();
	this.origin = new Point();
	this.position.x = x - d[0] * 0.5;
	this.position.y = y - d[1] * 0.5;
	this.width = d[0];
	this.height = 1024;
	
	this.angle = -0.3;
	this.lineSize = 1024;
	this.splashTime = Game.DELTASECOND * 0.2;
	
	this.dropDensity = 1.0;
	this.dropSize = 1.0;
	this.dropSpeed = 1.0;
	
	if("dropdensity" in o){
		this.dropDensity = o["dropdensity"] * 1;
	}	
	if("dropsize" in o){
		this.dropSize = o["dropsize"] * 1;
	}
	if("dropspeed" in o){
		this.dropSpeed = o["dropspeed"] * 1;
	}
	
	this.lines = new Array();
	this._addLinePosition = 0.0;
	
	
	
}

Rain.prototype.update = function(){
	if(this._addLinePosition < this.width){
		let d_multiplier = 1.0 / this.dropDensity;
		let angle = this.angle + (0.5 - Math.random()) * 0.1;
		this._addLinePosition += d_multiplier * (4 + Math.floor(Math.random() * 16));
		
		var newLine = new Line(
			this.position.add(new Point(this._addLinePosition, 0)),
			this.position.add(new Point(
				this._addLinePosition + Math.sin(angle)*this.lineSize,
				Math.cos(angle)*this.lineSize
			))
		);
		
		let trace = game.t_raytrace(newLine, function(p){
			let tr = this.getTileRule(p.x, p.y);
			return tr != tilerules.ignore && tr != tilerules.onewayup;
		});
		
		if(trace){
			newLine.end = trace;
		}
		
		let l_multiplier = this.lineSize / newLine.length();
		
		newLine.dropSpeed = l_multiplier * (0.016 + Math.random() * 0.008) * this.dropSpeed;
		newLine.dropLength = l_multiplier * 0.01 * this.dropSize;
		newLine.dropPosition = Math.random();
		
		this.lines.push(newLine);
	}
}

Rain.prototype.render = function(g,c){
	let screen = new Line(game.camera, game.camera.add(game.resolution));
	
	for(let i=0; i < this.lines.length; i++){
		let l = this.lines[i];
		let top = (game.camera.y - l.start.y) / Math.abs(l.start.y - l.end.y);
		let bot = (game.camera.y + 240 - l.start.y) / Math.abs(l.start.y - l.end.y);
		
		l.dropPosition = Math.max(l.dropPosition + this.delta * l.dropSpeed, top);
		
		if(l.dropPosition < 1 && l.dropPosition + l.dropLength > 1){
			//drop made contact with end, draw splash
			l.splash = this.splashTime;
		}
		if(l.dropPosition >= bot){
			//drop reached bottom of screen, move it to the top
			l.dropPosition = top;
		}
		if(screen.overlaps(l)){
			//Line is onscreen, render it
			if(l.splash > 0){
				//Render the splash
				let p = 1 - (l.splash / this.splashTime);
				let splash_frame = new Point(
					(p * 6) % 3,
					p * 2
				);
				g.renderSprite(
					"raindrops",
					l.end.subtract(c),
					this.zIndex,
					splash_frame,
					false,
					{
						u_color : Rain.Color
					}
				);
				l.splash -= this.delta;
			}
			if(l.dropPosition > 0 && l.dropPosition < 1){
				//Drop on screen, render it
				let newStart = Point.lerp(l.start, l.end, l.dropPosition);
				let newEnd = Point.lerp(l.start, l.end, Math.min(l.dropPosition + l.dropLength,1.0));
				
				g.renderLine(
					newStart.subtract(c),
					newEnd.subtract(c),
					1,
					Rain.Color
				);
			}
		}
		
	}
}
Rain.Color = [1.0,1.0,1.0,0.6];
