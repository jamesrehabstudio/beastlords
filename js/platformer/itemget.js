class ItemGet extends GameObject {
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		
		this.width = 256;
		this.height = 96;
		this.speed = 12;
		
		this.title = "Double jump";
		this.text = "Press JUMP while in the air to perform a second jump. This can help you reach high locations.";
		
		this._delay = 0.0;
		this._progress = 0;
		
		this.sprite = "items";
		this.frame = new Point(0,0);
		this._showitem = true;
		
		game.pause = true;
		
		
	}
	target(){ return _player; }
	idle(){}
	update(){
		if(!game.pause || PauseMenu.open){
			this.destroy();
		}  else if(this._delay > 0 ) {
			this._delay -= game.deltaUnscaled;
		} else {
			this._progress = Math.min(this._progress + game.deltaUnscaled * this.speed, this.text.length);
			
			if(this._showitem){
				this.target().frame.x = this.target().frame.y = 7;
			}
			
			if(input.state("fire") == 1 || input.state("jump") == 1 ){
				if(this._progress < this.text.length){
					this._progress = this.text.length;
				} else {
					game.pause = false;
				}
			}
		}
	}
	render(g,c){
		if(this._showitem){
			g.renderSprite(this.sprite,this.target().position.add(new Point(this.target().forward()*12,-40)).subtract(c),this.zIndex,this.frame, false);
		}
	}
	hudrender(g,c){
		if(this._delay <= 0){
			let _x = (game.resolution.x - this.width) * 0.5;
			
			let visibleText = this.text.substr(0,this._progress) + CHAR_ESCAPE + this.text.substr(this._progress);
			visibleText = this.title + "\n" + visibleText;
			
			let displayHeight = this.text ? this.height : 40;
			
			textBox(
				g,
				visibleText, 
				_x, 32, this.width, displayHeight
			);
		}
	}
}
ItemGet.create = function(name){
	var ig = new ItemGet();
	ig.title = name;
	if(name == "doublejump") {
		ig.title = i18n("item_doublejump");
		ig.text = i18n("item_doublejump_desc");
		ig.frame = new Point(0,5);
		ig._delay = 1.25;
	} else if(name == "long_sword") {
		ig.title = "Long Sword";
		ig.text = "";
		ig.frame.x = 1; ig.frame.y = 2; 
	} else if(name == "burningblade") {
		ig.title = "Burning Blade";
		ig.text = "";
		ig.frame.x = 5; ig.frame.y = 2; 
	} else if(name == "bloodsickle") {
		ig.title = "Blood Sickle";
		ig.text = "";
		ig.frame.x = 4; ig.frame.y = 2; 
	}
	
	ig.title = DialogManager.substitute(ig.title);
	ig.text = DialogManager.substitute(ig.text);
	game.addObject(ig);
}
self["ItemGet"] = ItemGet;