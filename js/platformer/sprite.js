class Sprite extends GameObject{
	constructor(x,y,d,ops){
		super(x,y,d,ops);
		this.position.x = x;
		this.position.y = y;
		this.scale = new Point(1,1);
		this.parallax = new Point(1,1);
		
		this.origin = new Point();
		
		
		this.sprite = ops.getString("sprite","white");
		this.zIndex = ops.getInt("zindex",0);
		this.frame.x = ops.getInt("framex",0);
		this.frame.y = ops.getInt("framey",0);
		this.scale.x = ops.getFloat("scalex",1.0);
		this.scale.y = ops.getFloat("scaley",1.0);
		this.parallax.x = ops.getFloat("parallaxx",1.0);
		this.parallax.y = ops.getFloat("parallaxy",1.0);
		this.flip = ops.getBool("flip",false);
		
		this.prerend = ops.getBool("prerender",false);
		this.rendrend = ops.getBool("render",true);
		this.postrend = ops.getBool("postrender",false);
		this.hudrend = ops.getBool("hudrender",false);
		this.lightrend = ops.getBool("lightrender",false);
	}
	idle(){}
	shouldRender(){
		if(this.alwaysRender){
			true;
		}
		return GameObject.prototype.shouldRender.apply(this);
	}
	render(g,c, force=false){
		if(this.rendrend || force){
			g.renderSprite(
				this.sprite,
				this.position.subtract(c.scale(this.parallax)),
				this.zIndex,
				this.frame,
				this.flip,
				{
					"scalex" : this.scale.x,
					"scaley" : this.scale.y,
				}
			);
		}
	}
	prerender(g,c){
		if(this.prerend){ this.render(g,c,true); }
	}
	postrender(g,c){
		if(this.postrend){ this.render(g,c,true); }
	}
	hudrender(g,c){
		if(this.hudrend){ this.render(g,c,true); }
	}
	lightrender(g,c){
		if(this.lightrend){ this.render(g,c,true); }
	}
}
self["Sprite"] = Sprite;