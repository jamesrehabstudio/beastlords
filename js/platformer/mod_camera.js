var mod_camera = {
	"init" : function(){
		this.camera_transition = this.position.scale(1);
		this.camera_lookat = this.position.scale(1);
		this.camera_lookat_lerp = 0.0;
		this.camera_lookat_speed = 1.0;
		this.camera_lookat_use = false;
		this.camera_transitionTime = Game.DELTASECOND * 0.6;
		this.camera_vtransitionTime = Game.DELTASECOND * 0.25;
		this.camera_tracking = 1;
		this.camera_vtracking = 0.0;
		this.camera_vtrackingPos = new Point();
		this.camerShake = new Point();
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
					"tile" : mtile,
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
		
		this.on("enter_room", function(){
			this.camera_vtracking = 0.0;
		});
	},
	
	"update" : function(){
		this.camera_lookat_lerp = Math.clamp01(this.camera_lookat_lerp + this.delta * this.camera_lookat_speed * (this.camera_lookat_use?1:-1));
		
		let lookat = Point.lerp(this.position, this.camera_lookat, this.camera_lookat_lerp);
		let trule = this.cameraGetMapTileData(lookat);
		
		if(trule == null){
			if( this.cameraPreviousRule != null ) {
				//If the player is out of bounds, use last known area
				trule = this.cameraPreviousRule;
			} else {
				//If the camera was never in bounds. Stop everything
				return;
			}
		} else {
			WorldMap.revealTile(lookat, trule.tile);
		}
		
		let _t = lookat.scale(1/256,1/240).floor();
		let _s = this._prevPosition.scale(1/256,1/240).floor();
		
		let m = new Point( Math.mod( lookat.x, 256),  Math.mod( lookat.y, 240) );
		let n = new Point( Math.mod( this._prevPosition.x, 256),  Math.mod( this._prevPosition.y, 240) );
		
		let bot = trule.bot;
		let top = trule.top;
		let rgt = trule.rgt;
		let lft = trule.lft;
		let newTile = _t.x != _s.x || _t.y != _s.y;
		let transition = false;
		
		//New room?
		if(newTile && this.cameraPreviousRule){
			let changedRoom = false;
			if( _t.y > _s.y ){
				//Has moved down a room
				if( !top && !this.cameraPreviousRule.bot ){
					this.trigger("enter_room", 0, 1);
				}
			} else if (_t.y < _s.y) {
				//Has moved up a room
				if( !bot && !this.cameraPreviousRule.top ){
					this.trigger("enter_room", 0, -1);
				}
			} else if (_t.x > _s.x) {
				//Has moved right
				if( !lft && !this.cameraPreviousRule.rgt ){
					this.trigger("enter_room", 1, 0);
				}
			} else if (_t.x < _s.x) {
				//Has moved left
				if( !rgt && !this.cameraPreviousRule.lft ){
					this.trigger("enter_room", -1, 0);
				}
			}
		}
		
		//Testing tiles with corners, applying transition if player crosses line
		if( trule.bot && trule.rgt && trule.cBR ){
			rgt = (m.x*0.5) + 128 - m.y > 0;
			bot = !rgt;
			transition = ((n.x*0.5) + 128 - n.y > 0) != rgt || transition;
		}
		if( trule.bot && trule.lft && trule.cBL ){
			lft = (m.x*0.5) + m.y < 256;
			bot = !lft && bot;
			transition = ((n.x*0.5) + n.y < 256) != lft || transition;
		}
		if( trule.top && trule.lft && trule.cTL ){
			lft = m.x - (m.y*2) < 0;
			top = !lft;
			transition = (n.x - (n.y*2) < 0) != lft || transition;
		}
		if( trule.top && trule.rgt && trule.cTR ){
			rgt =  m.x + (m.y*2) > 256;
			top = !rgt && top;
			transition = (n.x + (n.y*2) > 256) != rgt || transition;
		}
		
		if( (trule.cTR || trule.cTL || trule.cBR || trule.cBL ) ){
			//Player crossed corner transition
			if( transition && !newTile ) {
				this.camera_tracking = 0.0;
				this.camera_transition = game.camera.scale(1);
			}
		}
		
		if(!this.grounded && this.camera_tracking >= 1){
			//Fix the camera while in the air
			this.camera_vtracking = 1.0;
			this.camera_vtrackingPos = game.camera.scale(1);
		} 
		
		if( this.states.againstwall && !this.grounded ){
			//Fixed area becomes narrow when the player wall jumps
			this.camera_narrowVRange = Math.clamp01(this.camera_narrowVRange + this.delta * 5.0);
		}
		
		//Define range for in-air player
		this.camera_inairLimitTop = Math.lerp(32, 80, this.camera_narrowVRange);
		this.camera_narrowVRange = Math.clamp01(this.camera_narrowVRange - this.delta);
		
		//Set new position so player is in the center of frame
		let newPos = lookat.subtract(game.resolution.scale(0.5));
		
		if( this.camera_vtracking > 0.0 ){
			//If the player is in the air, fix the camera
			this.camera_vtrackingPos.y = Math.max(this.camera_vtrackingPos.y, lookat.y - this.camera_inairLimitBot);
			this.camera_vtrackingPos.y = Math.min(this.camera_vtrackingPos.y, lookat.y - this.camera_inairLimitTop);
			
			newPos.y = Math.lerp( newPos.y, this.camera_vtrackingPos.y, Ease.inOutQuad(this.camera_vtracking) );
			this.camera_vtracking -= this.delta / this.camera_vtransitionTime;
			
		}
		
		for(let i = 0; i < this.camera_lockers.length; i++){
			//Special objects can limit the camera's movement
			newPos = this.camera_lockers[i].limit(newPos);
		}
		
		//Define the limits of the current map tile
		let limitsTL = trule.position.scale(1/256,1/240).floor().scale(256,240);
		
		//Determine which directions the camera is limited
		if(!bot){ newPos.y = Math.min(limitsTL.y, newPos.y); }
		if(!top){ newPos.y = Math.max(limitsTL.y, newPos.y); }
		if(!rgt){ newPos.x = Math.min(limitsTL.x-(game.resolution.x-256), newPos.x); }
		if(!lft){ newPos.x = Math.max(limitsTL.x, newPos.x); }
		if(!rgt && !lft){ newPos.x = limitsTL.x - (game.resolution.x*0.5-128); }
		
		//Tween the camera tracking so it is smooth
		this.camera_tracking = Math.clamp01( this.camera_tracking + this.delta / this.camera_transitionTime);
		
		//Tween the camera between fixed position and new position
		game.camera = Point.lerp(this.camera_transition, newPos, this.camera_tracking);
		
		if(this.camerShake.x > 0){
			//Add shake to camera
			var shake = new Point(0.5 - Math.random(), 0.5 - Math.random()).normalize();
			
			game.camera = game.camera.add(shake.scale(this.camerShake.y));
			this.camerShake.x -= game.deltaUnscaled;
		}
		
		//Copy current map tile rule to be used next frame
		this.cameraPreviousRule = trule;
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
self["cameraLookat"] = function(position, speed){
	let camCon = self._player;
	if(position instanceof Point){
		camCon.camera_lookat_speed = 1.0;
		camCon.camera_lookat_use = true;
		camCon.camera_lookat = position.scale(1);
		if(speed != undefined){ camCon.camera_lookat_speed = speed; }
	} else {
		//release lookup
		if(speed != undefined){ camCon.camera_lookat_speed = speed; }
		camCon.camera_lookat_use = false;
	}
}