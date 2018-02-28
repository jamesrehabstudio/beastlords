class SpriteWrapper {
	constructor(js){
		this.js = js;
		
		this.animMetaData = {};
		this.offset = new Point(js.offsetx,js.offsety);
		
		for(let i=0; i < js.animation.length; i++){
			let a = js.animation[i];
			let totalLen = 0.0;
			for(let j=0; j < a.frames.length; j++){ totalLen += a.frames[j].t; }
			
			this.animMetaData[a.name] = {
				index : i,
				total : totalLen
			};
		}
	}
	frame(name, progress){
		progress = Math.max(Math.min( progress, 1 ), 0);
		if(name in this.animMetaData){
			let index = this.animMetaData[name].index;
			let anim = this.js.animation[index];
			let total = this.animMetaData[name].total * progress;
			
			let fend = 0.0;
			for(let i=0; i < anim.frames.length; i++){
				fend += anim.frames[i].t;
				if(fend >= total){
					return new Point(anim.frames[i].x, anim.frames[i].y);
				}
			}
		}
		return new Point();
	}
	getFrameData(frame, framey){
		let framex = frame;
		if(frame instanceof Point){
			framex = frame.x;
			framey = frame.y;
		}
		if(framey in this.js.data) if(framex in this.js.data[framey] ){
			return this.js.data[framey][framex];
		}
		return null;
	}
	getHitBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_HITAREA);
	}
	getAttackBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_ATTACKAREA);
	}
	getGuardBoxes(frame, gameObject){
		return this.getAreaOfType(frame, gameObject, SpriteWrapper.TYPE_GUARDAREA);
	}
	getAreaOfType(frame, gameObject, type){
		gameObject = gameObject || {};
		
		let fdata = this.getFrameData(frame);
		let output = new Array();
		let flip = !!gameObject.flip;
		let position = gameObject.position;
		
		if(fdata){
			for(let i=0; i < fdata.length; i++){
				let fd = fdata[i];
				if(fd.type == type){
					if(flip){
						output.push(new Line(
							position.x + (fd.u - this.offset.x) * -1,
							position.y + (fd.y - this.offset.y), 
							position.x + (fd.x - this.offset.x) * -1,
							position.y + (fd.v - this.offset.y)
						));
					} else {
						output.push(new Line(
							position.x + (fd.x - this.offset.x),
							position.y + (fd.y - this.offset.y), 
							position.x + (fd.u - this.offset.x),
							position.y + (fd.v - this.offset.y)
						));
					}
				}
			}
		}
		return output;
	}
}
SpriteWrapper.TYPE_HITAREA = 0;
SpriteWrapper.TYPE_CRITAREA = 1;
SpriteWrapper.TYPE_ATTACKAREA = 2;
SpriteWrapper.TYPE_GUARDAREA = 3;