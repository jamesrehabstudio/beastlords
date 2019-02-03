class CutscenePlayer {
	get duration(){ return this.data.duration; }
	constructor(data){
		this.data = data;
		this.zIndex = 999;
	}
	getIndex(time, layer){
		let output = 0;
		for(let j=0; j < layer.keyframes.length; j++){
			if( layer.keyframes[j].time > time ){
				return output;
			} else {
				output = j;
			}
		}
		return  output;
	}
	render(g,offset,time){
		//adjust for changing resolutions
		offset = new Point(offset.x - (427-game.resolution.x) * 0.5, offset.y);
		
		for(let i=0; i < this.data.layers.length; i++){
			let layer = this.data.layers[i];
			if(layer.keyframes.length > 0){
				let index = this.getIndex(time, layer);
				let indexn = Math.min(index+1, layer.keyframes.length-1);
				let frame = layer.keyframes[index];
				let framen = layer.keyframes[indexn];
				
				let framelerp = frame.time == framen.time ? 0.0 : (time - frame.time) / Math.abs(frame.time - framen.time);
				
				if(frame.visible){
					let color = [
						Math.lerp( frame.color.r, framen.color.r, framelerp),
						Math.lerp( frame.color.g, framen.color.g, framelerp),
						Math.lerp( frame.color.b, framen.color.b, framelerp),
						1.0
					];
					let pos = Point.lerp(frame.position, framen.position, framelerp);
					let scalex = Math.lerp(frame.scale.x, framen.scale.x, framelerp);
					let scaley = Math.lerp(frame.scale.y, framen.scale.y, framelerp);
					let sprite = frame.sprite;
					let f = new Point(frame.frame.x, frame.frame.y);
					let rotation = Math.lerp(frame.rotation, framen.rotation, framelerp);
					
					g.renderSprite(sprite,pos.add(offset),this.zIndex-i,f,false,{
						"rotation" : rotation,
						"scalex" : scalex,
						"scaley" : scaley,
						"u_color" : color,
					});
				}
			}
			
		}
		
		//Draw black boarder
		let w = Math.ceil ( (game.resolution.x - 256) * 0.5 );
		g.color = [0,0,0,1];
		g.drawRect(0,0,game.resolution.x,game.resolution.y,this.zIndex-10);
		g.drawRect(0,0,game.resolution.x,48,this.zIndex+10);
		g.drawRect(0,192,game.resolution.x,48,this.zIndex+10);
		g.drawRect(0,48,w,144,this.zIndex+10);
		g.drawRect(game.resolution.x-w,48,w,144,this.zIndex+10);
	}
}
self.cutscenes = {};