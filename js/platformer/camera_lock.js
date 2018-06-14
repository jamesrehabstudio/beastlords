class CameraLock extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.visible = false;
		
		this.lockUp = ops.getBool("lockup", true);
		this.lockDown = ops.getBool("lockdown", true);
		this.lockRight = ops.getBool("lockright", true);
		this.lockLeft = ops.getBool("lockleft", true);
		
		this._camera = null;
		this._count = 0;
		
		this.on("collideObject",function(obj){
			if(obj.hasModule(mod_camera)){
				this._camera = obj;
				if(this._count <= 0){
					this.trigger("cameraEnter", obj);
				}
				this._count = 2;
			}
		});
		
		this.on("cameraEnter", function(obj){
			if(obj.camera_lockers.indexOf(this) < 0){
				obj.camera_lockers.push(this);
				
				//Transition camera
				obj.camera_transition = game.camera.scale(1);
				obj.camera_tracking = 0.0;
			}
		});
		this.on("cameraExit", function(obj){
			let index = obj.camera_lockers.indexOf(this);
			if(index >= 0){
				obj.camera_lockers.remove(index);
				
				//Transition camera
				obj.camera_transition = game.camera.scale(1);
				obj.camera_tracking = 0.0;
			}
		});
	}
	idle(){}
	update(){
		if(this._camera){
			if(this._count == 1){
				this.trigger("cameraExit", this._camera);
				this._camera = null;
				this._count = 0;
			} else {
				this._count--;
			}
		}
		
	}
	limit(pos){
		let output = pos.scale(1);
		let camPos = this.position.subtract( game.resolution.scale(0.5) );
		
		if(this.lockUp){ output.y = Math.max(output.y, camPos.y ); }
		if(this.lockDown){ output.y = Math.min(output.y, camPos.y ); }
		if(this.lockLeft){ output.x = Math.max(output.x, camPos.x ); }
		if(this.lockRight){ output.x = Math.min(output.x, camPos.x ); }
		
		return output;
	}
}

self["CameraLock"] = CameraLock;