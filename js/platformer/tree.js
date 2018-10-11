Tree.prototype = new GameObject();
Tree.prototype.constructor = GameObject;
function Tree(x, y, d){
	this.constructor();
	this.position.x = x;
	this.position.y = y + d[1] * 0.5;
	this.width = 112;
	this.sprite = "trees";
	this.zIndex = 99;
	
	this.frame.x = 0;
	this.frame.y = 1;
	this.windInOutSpeed = 0.01;
	this.windSpeed = 0.125;
	this.windStrength = 1.5;
	this.distanceVariation = 0.05;
}

	
Tree.prototype.render = function(g,c){}
	
Tree.prototype.prerender = function(g,c){
	//Trunk
	g.renderSprite(this.sprite,this.position.subtract(c),this.zIndex,new Point(1,0),this.flip);
	g.renderSprite(this.sprite,this.position.add(new Point(0,-48)).subtract(c),this.zIndex,new Point(0,0),this.flip);
	
	//Leaves
	for(var i=0; i < Tree.leavesPositions.length; i++){
		var t = game.timeScaled * 30.0;
		var pos = Tree.leavesPositions[i].add(new Point(this.forward()*16,0));
		var d = 0.75 + (i / Tree.leavesPositions.length) * 0.25;
		var color = [Math.lerp(0.5,1,d),Math.lerp(0.6,1,d),Math.lerp(0.7,1,d),1.0];
		var posV = (pos.x + pos.y * 0.2) * this.distanceVariation;
		var wind = 1 + Math.sin(t * this.windInOutSpeed) * 0.5;
		var offset = pos.add(new Point(
			wind * this.windStrength * Math.sin(posV + t * this.windSpeed),
			wind * this.windStrength * Math.cos(posV + t * this.windSpeed) * 0.25
		));
		
		g.renderSprite(this.sprite,this.position.add(offset).subtract(c),this.zIndex,this.frame,false,{"u_color":color});
	}
	
}
Tree.leavesPositions = [
	new Point(-28,-40),
	new Point(28,-40),
	new Point(0,-32),
	new Point(0,-80),
	new Point(-18,-68),
	new Point(18,-68),
	new Point(0,-56),
];