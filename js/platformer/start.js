function game_start(g){
	var shaders = window.shaders;
	
	new Material(g.g, "default", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "hurt", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"],"settings":{"u_color":[0.8,0.1,0.0,1.0]}} );
	new Material(g.g, "gold", {"fs":shaders["fragment-greytocolor"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,0.9,0.2,1.0]}} );
	new Material(g.g, "color", {"fs":shaders["2d-fragment-shader"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "heat", {"fs":shaders["fragment-heat"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "blur", {"fs":shaders["2d-fragment-blur"],"vs":shaders["2d-vertex-scale"]} );
	new Material(g.g, "enchanted", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-shader"], "settings":{"u_color":[1.0,0.0,0.3,1.0]}} );
	new Material(g.g, "item", {"fs":shaders["2d-fragment-glow"],"vs":shaders["2d-vertex-shader"]} );
	
	new Material(g.g, "t1", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.1]}} );
	new Material(g.g, "t2", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[-0.1]}} );
	new Material(g.g, "t3", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.2]}} );
	new Material(g.g, "t4", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.3]}} );
	new Material(g.g, "t5", {"fs":shaders["fragment-shifthue"],"vs":shaders["2d-vertex-shader"], "settings":{"u_shift":[0.5]}} );
	
	new Material(g.g, "backbuffer", {"fs":shaders["2d-fragment-shader"],"vs":shaders["back-vertex-shader"], "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "solid", {"fs":shaders["2d-fragment-solid"],"vs":shaders["2d-vertex-shader"]} );
	new Material(g.g, "lightbeam", {"fs":shaders["2d-fragment-lightbeam"],"vs":shaders["2d-vertex-shader"]} );
	
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
}