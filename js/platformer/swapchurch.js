class SwapChurch extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		
		this.zIndex = -4;
		this.sprite = "swapchurch";
		
		this.width = d[0];
		this.height = d[1];
		
		this._selection = NPC.get("swapchurch");
		this._curtains = 0.0;
		this._priestFrame = new Point();
		
		this.addModule(mod_talk);
		
		this.on("open", function(){
			if( SwapChurch.intro ) {
				DialogManager.set( i18n("swapchurch_intro") );
				SwapChurch.intro = false;
			} else {
				let current = Math.clamp( NPC.get("swapchurch"), 0, 4 );
				DialogManager.set( i18n("swapchurch_change")[current] );
				DialogManager.choices = ["Show me another", "No thanks"];
			}
			game.pause = true;
			audio.play("pause");
		});
		this.on("close", function(){
			game.pause = false;
		});
	}
	update(){
		
		//Talk
		if ( this.open ) {
			this.talkMovePlayer();
			
			if( DialogManager.show ){
				
			} else {
				
				if ( DialogManager.cursor == 0){
					NPC.set("swapchurch", Math.mod( NPC.get("swapchurch") + 1, 5) );
				}
				
				this.close();
			}
		}
		
		
		//Animate and change background
		if( this._selection == NPC.get("swapchurch")){
			this._curtains = Math.clamp01( this._curtains - this.delta);
		} else {
			this._curtains = Math.clamp01( this._curtains + this.delta);
			
			if( this._curtains >= 1){
				this._selection = NPC.get("swapchurch");
				switch(this._selection){
					case 1: this._priestFrame.y = 1; break;
					case 2: this._priestFrame.y = 2; break;
					case 3: this._priestFrame.y = 3; break;
					default: this._priestFrame.y = 0; break;
				}
			}
		}
		
		if(this._selection != NPC.get("swapchurch")){
			//Strip
			this._priestFrame.x = Math.clamp( 7 + 6 * this._curtains, 7, 9);
		} else if( this._curtains > 0 ) {
			this._priestFrame.x = Math.clamp( 4 + 7 * (1-this._curtains), 4, 7);
			if( this._priestFrame.x >= 7) { 
				this._priestFrame.x = 0; 
			}
		} else {
			this._priestFrame.x = Math.mod( this._priestFrame.x + this.delta * 4, 4 );
		}
	}
	render(g,c){
		//Background
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, new Point(0,0), false );
		
		g.renderSprite("priest", this.position.subtract(c), this.zIndex+9, this._priestFrame, true );
		
		//Step
		g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex+10, new Point(1,0), false );
		
		if( this._selection == 3 ){ 
			//Show the spinning cube
			let spin = Math.mod( game.timeScaled * 1.57, 360 );
			
			g.renderMesh(
				"regcube", 
				this.position.subtract(SwapChurch.priest_offset).subtract(c),
				this.zIndex,
				{
					"rotate" : [0.31, spin, 0]
				}
			);
		} else {
			switch(this._selection){
				case 0: this.frame = new Point(0,1); break; //Oblivion
				case 1: this.frame = new Point(0,2); break; //Mechanism
				case 2: this.frame = new Point(1,1); break; // Pain
				default: this.frame = new Point(1,0); break; //None
			}
			g.renderSprite(this.sprite, this.position.subtract(c), this.zIndex, this.frame, false );
		}
		
		
		//Draw curtain
		for( let i = 0; i < 8; i++ ){
			let offset = new Point(4, -88 + i * 32 );
			offset.y = Math.min( offset.y, Math.lerp( -88, 88, this._curtains ) );
			g.renderSprite(this.sprite, this.position.add(offset).subtract(c), this.zIndex+9-i, SwapChurch.curtains_frame, false );
		}
		
	}
	hudrender(g,c){
		if( this.open ){
			DialogManager.render(g,c);
		}
	}
}
SwapChurch.intro = true;
SwapChurch.curtains_frame = new Point(1, 2);
SwapChurch.priest_offset = new Point(80, 24);

self["SwapChurch"] = SwapChurch;