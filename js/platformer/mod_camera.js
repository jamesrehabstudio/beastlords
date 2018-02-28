var mod_camera = {
	"init" : function(){
		this.camera_attitude_v = false;
		this.camera_transition = this.position.scale(1);
		this.camera_transitionTime = Game.DELTASECOND * 0.6;
		this.camera_tracking = 1;
		this.camerShake = new Point();
		this.cameraOcclusions = new Array();
		
		this.cameraGetMapTile = function(pos){
			var re = {
				196:0, 197:0, 198:0, 199:64,204:0,205:0,206:0,207:64,
				212:0, 213:0, 214:0, 220:0,221:0,222:0,
				236:0, 237:8, 253:8
			};
			let p = pos.scale(new Point(1 / 256, 1 / 240)).floor();
			let index = p.x + p.y * (game.map.width / 16);
			let tile = game.map.map[index];
			if(tile in re){ tile = re[tile];}
			return tile;
		}
		this.cameraRenderOcclusion = function(g,c, pos){
			
			let mtile = this.cameraGetMapTile(pos);
			if(mtile != null){
				let mx = Math.floor(mtile / 16);
				let my = Math.floor(mtile % 16);
				
				let m = pos.scale(1/256,1/240).floor().scale(256,240);
				let bot = Math.floor(my / 8) % 2 == 0;
				let top = Math.floor(my / 4) % 2 == 0;
				let rgt = Math.floor(my / 2) % 2 == 0;
				let lft = Math.floor(my / 1) % 2 == 0;
				
				g.color = [0,0,0,1];
				if(!bot){ g.scaleFillRect(m.add(new Point(0,240).subtract(c)),256,240); }
				if(!top){ g.scaleFillRect(m.add(new Point(0,-240).subtract(c)),256,240); }
				if(!rgt){ g.scaleFillRect(m.add(new Point(256,0).subtract(c)),256,240); }
				if(!lft){ g.scaleFillRect(m.add(new Point(-256,0).subtract(c)),256,240); }
			}
		}
	},
	
	"update" : function(){
		let mapTileSize = new Point(16,15);
		let twidth = game.map.width / mapTileSize.x;
		let theight = game.map.height / mapTileSize.y;
		let p = this.position.scale(new Point(1 / 256, 1 / 240)).floor();
		let m = p.scale(256,240);
		let f = this.position.subtract(p.scale(256,240));
	
		let index = p.x + p.y * twidth;
		//let mtile = game.map.map[index];
		let mtile = this.cameraGetMapTile(this.position);
		
		let mx = Math.floor(mtile / 16);
		let my = Math.floor(mtile % 16);
		
		let bot = Math.floor(my / 8) % 2 == 0;
		let top = Math.floor(my / 4) % 2 == 0;
		let rgt = Math.floor(my / 2) % 2 == 0;
		let lft = Math.floor(my / 1) % 2 == 0;
		
		let cTL = (top && lft) && Math.floor(mx / 8) % 2 != 0;
		let cBL = (bot && lft) && Math.floor(mx / 4) % 2 != 0;
		let cTR = (top && rgt) && Math.floor(mx / 2) % 2 != 0;
		let cBR = (bot && rgt) && Math.floor(mx / 1) % 2 != 0;
		
		let limitsTL = new Point(p.x * 256, p.y * 240);
		
		let v = this.camera_attitude_v;
		if((top && f.y < 80) || (bot && f.y > 216)){
			v = true;
		} else if((lft && f.x < 32) || (rgt && f.x > 224)){
			v = false;
		}
		
		let newPos = this.position.subtract(game.resolution.scale(0.5));
		
		if((bot || top) && (bot != top)){
			if(this.camera_attitude_v){
				if(cBL || cTL){lft = false;}
				if(cBR || cTR){rgt = false;}
			} else {
				if(cBL || cBR){bot = false;}
				if(cTL || cTR){top = false;}
			}
			if(v != this.camera_attitude_v){
				this.camera_attitude_v = v;
				this.camera_transition = game.camera.scale(1);
				if(cTL || cBL || cTR || cBR){
					this.camera_tracking = 0.0;
				}
			}
		}
		
		if(!bot){ newPos.y = Math.min(limitsTL.y, newPos.y); }
		if(!top){ newPos.y = Math.max(limitsTL.y, newPos.y); }
		if(!rgt){ newPos.x = Math.min(limitsTL.x-(game.resolution.x-256), newPos.x); }
		if(!lft){ newPos.x = Math.max(limitsTL.x, newPos.x); }
		
		if(!rgt && !lft){newPos.x = limitsTL.x - (game.resolution.x*0.5-128);}
		
		this.camera_tracking = Math.clamp01(this.camera_tracking + this.delta / this.camera_transitionTime);
		
		game.camera = Point.lerp(this.camera_transition, newPos, this.camera_tracking);
		
		if(this.camerShake.x > 0){
			var shake = new Point(0.5 - Math.random(), 0.5 - Math.random()).normalize();
			
			game.camera = game.camera.add(shake.scale(this.camerShake.y));
			this.camerShake.x -= game.deltaUnscaled;
		}
	},
	"postrender" : function(g,c){
		this.cameraRenderOcclusion(g,c,this.position);
		
		let mtile = this.cameraGetMapTile(this.position);
		let mx = Math.floor(mtile / 16);
		let my = Math.floor(mtile % 16);
		
		let m = this.position.scale(1/256,1/240).floor().scale(256,240);
		let bot = Math.floor(my / 8) % 2 == 0;
		let top = Math.floor(my / 4) % 2 == 0;
		let rgt = Math.floor(my / 2) % 2 == 0;
		let lft = Math.floor(my / 1) % 2 == 0;
		g.color = [0,0,0,1];
		if(bot){ this.cameraRenderOcclusion(g,c,this.position.add(new Point(0,240))); }
		if(top){ this.cameraRenderOcclusion(g,c,this.position.add(new Point(0,-240))); }
		//if(!top){ g.scaleFillRect(m.add(new Point(0,-240).subtract(c)),256,240); }
		//if(!rgt){ g.scaleFillRect(m.add(new Point(256,0).subtract(c)),256,240); }
		//if(!lft){ g.scaleFillRect(m.add(new Point(-256,0).subtract(c)),256,240); }
		
	}
}
self["shakeCamera"] = function(time, strength){
	self._player.camerShake = new Point(time, strength);
}