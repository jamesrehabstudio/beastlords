var mod_camera = {
	"init" : function(){
		this.camera_attitude_v = false;
		this.camera_transition = this.position.scale(1);
		this.camera_transitionTime = Game.DELTASECOND * 0.6;
		this.camera_tracking = 1;
		this.camera_vtracking = 0.0;
		this.camerShake = new Point();
		this.cameraOcclusions = new Array();
		this.camera_inairLimitBot = 180;
		this.camera_inairLimitTop = 32;
		this.camera_narrowVRange = 0.0;
		this.cameraPreviousRule = null;
		this.camera_lockers = new Array();
		
		this.camera_customtile = {
			77 : 8,
			92 : 4,
			93 : 0,
			108: 0,
			109: 0,
			124: 20
		};
		
		this.cameraGetMapTile = function(pos){
			let p = pos.scale(new Point(1 / 256, 1 / 240)).floor();
			let index = p.x + p.y * (game.map.width / 16);
			let tile = game.map.map[index];
			if(tile in this.camera_customtile){ tile = this.camera_customtile[tile];}
			return tile;
		}
		this.cameraGetMapTileData = function(pos){
			let mtile = this.cameraGetMapTile(pos);
			
			if(mtile != null){
				
				let mx = Math.floor(mtile / 16);
				let my = Math.floor(mtile % 16);
				
				var output = {
					"position" : pos.scale(1),
					
					"bot" : Math.floor(my / 8) % 2 == 0,
					"top" : Math.floor(my / 4) % 2 == 0,
					"rgt" : Math.floor(my / 2) % 2 == 0,
					"lft" : Math.floor(my / 1) % 2 == 0,
					
					"tiley" : my,
					"tilex" : mx
				};
				
				output["cTL"] = (output.top && output.lft) && Math.floor(mx / 8) % 2 != 0;
				output["cBL"] = (output.bot && output.lft) && Math.floor(mx / 4) % 2 != 0;
				output["cTR"] = (output.top && output.rgt) && Math.floor(mx / 2) % 2 != 0;
				output["cBR"] = (output.bot && output.rgt) && Math.floor(mx / 1) % 2 != 0;
				
				return output;
			}
			
			return null;
		}
	},
	
	"update" : function(){
		
		
		
		//let mapTileSize = new Point(16,15);
		//let twidth = game.map.width / mapTileSize.x;
		//let theight = game.map.height / mapTileSize.y;
		
		
	
		//let index = p.x + p.y * twidth;
		//let mtile = game.map.map[index];
		//let mtile = this.cameraGetMapTile(this.position);
		
		let trule = this.cameraGetMapTileData(this.position);
		
		if(trule != null){
			this.cameraPreviousRule = trule;
		} else {
			trule = this.cameraPreviousRule;
		}
		
		let p = trule.position.scale(new Point(1 / 256, 1 / 240)).floor();
		let f = this.position.subtract(p.scale(256,240));
		
		let bot = trule.bot;
		let top = trule.top;
		let rgt = trule.rgt;
		let lft = trule.lft;
		
		/*
		let mx = Math.floor(mtile / 16);
		let my = Math.floor(mtile % 16);
		
		
		
		let cTL = (top && lft) && Math.floor(mx / 8) % 2 != 0;
		let cBL = (bot && lft) && Math.floor(mx / 4) % 2 != 0;
		let cTR = (top && rgt) && Math.floor(mx / 2) % 2 != 0;
		let cBR = (bot && rgt) && Math.floor(mx / 1) % 2 != 0;
		*/
		
		if((bot || top) && !(lft || rgt)){
			this.camera_attitude_v = true;
		} else if(!(bot || top) && (lft || rgt)){
			this.camera_attitude_v = false;
		}
		
		let limitsTL = new Point(p.x * 256, p.y * 240);
		
		let v = this.camera_attitude_v;
		
		if((top && f.y < 80) || (bot && f.y > 216)){
			v = true;
		} else if((lft && f.x < 32) || (rgt && f.x > 224)){
			v = false;
		}
		
		let newPos = this.position.subtract(game.resolution.scale(0.5));
		
		//Narrow the vertical range if player is wall jumping
		if(!this.grounded && this.states.againstwall) { this.camera_narrowVRange = 3.0; }
		if(this.camera_narrowVRange > 0){
			this.camera_narrowVRange -= this.delta;
			this.camera_inairLimitTop = Math.lerp(this.camera_inairLimitTop, 80, this.delta * 4);
		} else {
			this.camera_inairLimitTop = Math.lerp(this.camera_inairLimitTop, 24, this.delta * 4);
		}
		
		if(this.camera_tracking < 1.0){
			this.camera_vtracking = 0.0;
		} else if(!this.grounded){ 
			//Limit the Y movement while in the air
			this.camera_vtracking = 1.0;
			let topLimit = this.position.y - this.camera_inairLimitTop;
			let botLimit = this.position.y - this.camera_inairLimitBot;
			newPos.y = Math.min( game.camera.y, topLimit ); 
			newPos.y = Math.max( newPos.y, botLimit ); 
		} else{
			newPos.y = Math.lerp( newPos.y, game.camera.y, this.camera_vtracking ); 
			this.camera_narrowVRange = 0.0;
			this.camera_vtracking = Math.clamp01( this.camera_vtracking - this.delta );
		}
		
		if((bot || top) && (bot != top)){
			if(this.camera_attitude_v){
				//if(trule.cBL || trule.cTL){lft = false;}
				//if(trule.cBR || trule.cTR){rgt = false;}
			} else {
				if(trule.cBL || trule.cBR){bot = false;}
				if(trule.cTL || trule.cTR){top = false;}
			}
			if(v != this.camera_attitude_v){
				this.camera_attitude_v = v;
				this.camera_transition = game.camera.scale(1);
				if(trule.cTL || trule.cBL || trule.cTR || trule.cBR){
					this.camera_tracking = 0.0;
				}
			}
		}
		
		if(!bot){ newPos.y = Math.min(limitsTL.y, newPos.y); }
		if(!top){ newPos.y = Math.max(limitsTL.y, newPos.y); }
		if(!rgt){ newPos.x = Math.min(limitsTL.x-(game.resolution.x-256), newPos.x); }
		if(!lft){ newPos.x = Math.max(limitsTL.x, newPos.x); }
		
		if(!rgt && !lft){newPos.x = limitsTL.x - (game.resolution.x*0.5-128);}
		if(!bot && !top){ this.camera_vtracking = 0.0; }
		
		for(let i = 0; i < this.camera_lockers.length; i++){
			newPos = this.camera_lockers[i].limit(newPos);
		}
		
		
		this.camera_tracking = Math.clamp01(this.camera_tracking + this.delta / this.camera_transitionTime);
		
		game.camera = Point.lerp(this.camera_transition, newPos, this.camera_tracking);
		
		if(this.camerShake.x > 0){
			var shake = new Point(0.5 - Math.random(), 0.5 - Math.random()).normalize();
			
			game.camera = game.camera.add(shake.scale(this.camerShake.y));
			this.camerShake.x -= game.deltaUnscaled;
		}
	},
	"postrender" : function(g,c){
		let occsize = new Point(256,240);
		let occ = [
			[true, true, true],
			[true, false, true],
			[true, true, true],
		];
		
		let p = c.add(game.resolution.scale(0.5)).scale(1/occsize.x,1/occsize.y).floor().scale(occsize);
		let trule = this.cameraGetMapTileData(p);
		
		if(trule != null){
			occ[0][1] = !trule.top;
			occ[2][1] = !trule.bot;
			occ[1][0] = !trule.lft;
			occ[1][2] = !trule.rgt;
			
			if(trule.top){
				let ntrule = this.cameraGetMapTileData(p.add(new Point(0, -occsize.y)));
				if(ntrule != null){
					occ[0][0] = !ntrule.lft && occ[0][0];
					occ[0][2] = !ntrule.rgt && occ[0][2];
				}
			}
			if(trule.bot){
				let ntrule = this.cameraGetMapTileData(p.add(new Point(0, occsize.y)));
				if(ntrule != null){
					occ[2][0] = !ntrule.lft && occ[2][0];
					occ[2][2] = !ntrule.rgt && occ[2][2];
				}
			}
			if(trule.lft){
				let ntrule = this.cameraGetMapTileData(p.add(new Point(-occsize.x,0)));
				if(ntrule != null){
					occ[0][0] = !ntrule.top && occ[0][0];
					occ[2][0] = !ntrule.bot && occ[2][0];
				}
			}
			if(trule.rgt){
				let ntrule = this.cameraGetMapTileData(p.add(new Point(occsize.x,0)));
				if(ntrule != null){
					occ[0][2] = !ntrule.top && occ[0][2];
					occ[2][2] = !ntrule.bot && occ[2][2];
				}
			}
			
			g.color = COLOR_BLACK;
			for(let y=-1; y < 2; y++) for(let x=-1; x < 2; x++){
				if(occ[y+1][x+1]){
					g.drawRect(
						(p.x-c.x) + occsize.x * x,
						(p.y-c.y) + occsize.y * y,
						occsize.x,
						occsize.y
					);
				}
			}
		}
	}
}
self["shakeCamera"] = function(time, strength){
	self._player.camerShake = new Point(time, strength);
}