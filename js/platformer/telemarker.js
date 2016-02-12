TeleMarker.prototype = new GameObject();
TeleMarker.prototype.constructor = GameObject;
function TeleMarker(x, y, obj){	
	this.constructor();
	
	this.size = 64;
	this.resolution = new Point(this.size, -this.size);
	this.position.x = x - this.size * 0.5;
	this.position.y = y - this.size * 0.5;
	this.interactive = false;
	this.timer = 0.0;
	this.currentBackground = false;
	
	//Restore whatever the current darkness level was.
	var b = game.getObject(Background);
	if(b instanceof Background){
		this.currentdarknessFunction = b.darknessFunction;
		this.on("destroy", function(){
			var b = game.getObject(Background);
			b.darknessFunction = this.currentdarknessFunction;
		})
	}
	
	var gl = game.g;
	this.buffer = gl.createF(this.size);

	this.buffer.use(gl);
	var tempres = game.resolution;
	game.resolution = this.resolution;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0,0,this.size,this.size);
	
	obj.render(gl, new Point(this.size*-0.5, this.size*0.5).add(obj.position));
	
	game.backBuffer.use(gl);
	game.resolution = tempres;
	gl.viewport(0,0,game.resolution.x,game.resolution.y);
}

TeleMarker.prototype.render = function(g,c){
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_CONSTANT_ALPHA );
	
	var geo = Sprite.RectBuffer(this.position.subtract(c), 64,64);
	var tex = Sprite.RectBuffer(new Point(), 1,1);
	var shader = window.materials["color"].use();
	
	var buffer = g.createBuffer();
	g.bindBuffer( g.ARRAY_BUFFER, buffer );
	g.bufferData( g.ARRAY_BUFFER, geo, g.DYNAMIC_DRAW);
	shader.set("a_position");
	
	var tbuffer = g.createBuffer();
	g.bindBuffer( g.ARRAY_BUFFER, tbuffer );
	g.bufferData( g.ARRAY_BUFFER, tex, g.DYNAMIC_DRAW);
	shader.set("a_texCoord");
	
	shader.set("u_resolution", game.resolution.x, game.resolution.y);
	shader.set("u_camera", 0,0);
	g.bindTexture(g.TEXTURE_2D, this.buffer.texture);
	
	var progress = Math.abs(Math.sin(this.timer * 0.05));
	shader.set("u_color", [progress,progress,1,0.5*Math.sqrt(progress)]);
	
	g.drawArrays(g.TRIANGLE_STRIP, 0, geo.length/2);
	g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA );
	
	this.timer += this.delta;
	Background.pushLight( this.position.add(new Point(this.size/2,this.size/2)).subtract(c), 120 );
}