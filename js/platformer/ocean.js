Ocean.prototype = new GameObject();
Ocean.prototype.constructor = GameObject;
function Ocean(x,y,d,o){
	this.constructor();
	this.position.x = x;
	this.position.y = y;
	this.width = d[0];
	this.height = d[1];
	this.sprite = "halo";
	
	this.inc = 2;
	this.waveheight = 32;
	this.wavelength = 0.025;
	this.speed = 0.1;
	this.turbulence = 5.5;
	this.turbulenceScale = 0.2;
	
	this.blocks = null;
	
	o = o || {};
}

Ocean.prototype.update = function(){
	if(this.blocks instanceof Array){
		for(var i=0; i < this.blocks.length; i++){
			var block = this.blocks[i];
			block.position.y = (this.position.y+block.height*0.5) - this.topOfWave(block.position.x+block.width*0.5);
		}
	} else{
		//Gather blocks
		var objs = game.overlaps(this.bounds());
		this.blocks = new Array();
		for(var i=0; i < objs.length; i++){
			if(objs[i] instanceof Block){
				this.blocks.push(objs[i]);
			}
		}
	}
	
}

Ocean.prototype.topOfWave = function(x){
	x = x + Math.sin(x*this.turbulenceScale)*this.turbulence;
	var wave = x*this.wavelength + game.timeScaled*this.speed;
	var height = (this.height - this.waveheight) + (this.waveheight * 0.5 * (1+Math.sin(wave)));
	return height;
}

Ocean.prototype.render = function(g,c){
	//this.renderold(g,c);
	var corners = this.corners();
	var segwidth = 240;
	var offsetx = -6;
	
	for(var posx = corners.left; posx < corners.right; posx += segwidth){
		offsetx += segwidth;
		if(posx + segwidth > c.x && posx < c.x + game.resolution.x){
			g.renderSprite(
				this.sprite,
				new Point(posx,corners.top).add(new Point(120,120)).subtract(c),
				this.zIndex,
				this.frame,
				this.flip,
				{
					"u_dimensions" : [offsetx,corners.top,segwidth,segwidth],
					"u_color" : [0.5,0.7,0.9,1.0],
					"u_time" : game.timeScaled,
					"u_wavesize" : [this.wavelength, this.waveheight, this.speed],
					"shader" : "water"
				}
			);
		}
	}
}

Ocean.prototype.renderold = function(g,c){
	var start = Math.max(c.x-this.inc, this.position.x-this.width*0.5);
	var end = Math.min(c.x+game.resolution.x+this.inc, this.position.x+this.width*0.5);
	var bottom = this.position.y + this.height*0.5;
	
	start = Math.roundTo(start,this.inc);
	
	//Render wave whites
	g.color = [0.7,0.7,0.7,1.0];
	for(var i=start; i < end; i+=this.inc){
		var height = this.topOfWave(i+4);
		
		g.scaleFillRect(
			i - c.x,
			bottom - height - c.y,
			this.inc,
			height
		);
	}
	
	
	g.color = [0.1,0.4,0.6,1.0];
	for(var i=start; i < end; i+=this.inc){
		var height = this.topOfWave(i);
		
		g.scaleFillRect(
			i - c.x,
			bottom - height - c.y,
			this.inc,
			height
		);
	}
	
	
}