class MapTempleManager3 extends GameObject {
	get ready(){ return this._warmup > 3; } 
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.width = d[0];
		this.height = d[1];
		this.visible = false;
		
		this.on("collideObject", function(obj){
			if(obj instanceof Player){
				if(!NPC.get("temple3_introplay") && Trigger.hasRequirments(MapTempleManager3.closeRequirements)){
					//Play the intro for the first time
					this._playIntro = true;
				}
			}
		});
		
		this._onwakeup = true;
		this._playIntro = false;
		this._introTime = 0.0;
		this._closePorts = false;
		this._removePorts = false;
		this._warmup = 0;
	}
	idle(){}
	turnLights(t=true){
		let lights = game.getObjects(LightStrobe);
		for(let i=0; i < lights.length; i++){
			lights[i].visible = t;
		}
	}
	update(){
		if(this._playIntro){
			if(this._introTime < 1.0) {
				//Fade out
				let d = Math.clamp01(this._introTime);
				_background.ambience = [
					Math.lerp(_background.ambience[0], 0, d),
					Math.lerp(_background.ambience[1], 0, d),
					Math.lerp(_background.ambience[2], 0, d),
				];
			} else if(this._introTime < 3.0) {
				//wait
				audio.playAs("music_temple3","music");
			} else if(this._introTime < 4.0) {	
				//Fade out
				let d = Math.clamp01(this._introTime-3.0);
				this.turnLights(true);
				_background.ambience = [
					Math.lerp(_background.ambience[0], 0.20, d),
					Math.lerp(_background.ambience[1], 0.25, d),
					Math.lerp(_background.ambience[2], 0.30, d),
				];
			} else {
				_background.ambience = [0.20,0.25,0.30];
				this._playIntro = false;
				NPC.set("temple3_introplay",1);
				
			}
			this._introTime += this.delta;
		}
		
		if(this.ready){
			if(this._onwakeup){
				//Do this once on wake up
				if(!NPC.get("temple3_introplay")){
					//turn off all strobes
					this.turnLights(false);
				} else {
					audio.playAs("music_temple3","music");
				}
			}
			
			if( !this._closePorts && Trigger.hasRequirments(MapTempleManager3.closeRequirements) ){
				Trigger.activate("portcullis");
				this._closePorts = true;
			}
			
			if( !this._removePorts && Trigger.hasRequirments(MapTempleManager3.removeRequirements) ){
				let ports = Trigger.getTargets("portcullis");
				for(let i=0; i < ports.length; i++){
					ports[i].destroy();
				}
				this._removePorts = true;
			}
			
			this._onwakeup = false;
		} else {
			this._warmup++;
		}
	}
}
MapTempleManager3.closeRequirements = ["boss_Ammit"];
MapTempleManager3.removeRequirements = ["boss_Poseidon"];
MapTempleManager3.firstActive = false;

self["MapTempleManager3"] = MapTempleManager3;