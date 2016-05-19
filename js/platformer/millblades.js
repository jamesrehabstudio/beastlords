MillBlades.prototype = new GameObject();
MillBlades.prototype.constructor = GameObject;
function MillBlades(x, y){	
	this.constructor();
	
	this.position.x = x;
	this.position.y = y;
	this.width = 96;
	this.height = 64;
	this.zIndex = 0;
	this.sprite = "tiles0";
	
	this.speed = 1.3;	
	this.rotation = 0;
}

MillBlades.prototype.render = function(g,c){
	this.rotation += this.speed * this.delta;
	var p = this.position.subtract(c);
	var material = window.materials["default"].use();
	g.bindTexture( g.TEXTURE_2D, this.sprite.gl_tex );
	
	for(var i=0; i < 4; i++) {
		var r = this.rotation + i * 90;
		var geo = Sprite.RectBuffer(p, this.width, 32, r);
		var tex = Sprite.RectBuffer(new Point(), 1, 1);
		
		var buffer = g.createBuffer();
		var tbuffer = g.createBuffer();
		
		g.bindBuffer( g.ARRAY_BUFFER, buffer);
		g.bufferData( g.ARRAY_BUFFER, geo, g.DYNAMIC_DRAW );
		material.set("a_position");
		g.bindBuffer( g.ARRAY_BUFFER, tbuffer);
		g.bufferData( g.ARRAY_BUFFER, tex, g.DYNAMIC_DRAW );
		material.set("a_texCoord");
		material.set("u_resolution", game.resolution.x, game.resolution.y);
		material.set("u_camera", 0, 0);
		
		g.drawArrays(g.TRIANGLE_STRIP, 0, 6);
	}
}