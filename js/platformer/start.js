function game_start(g){
	new Material(g.g, "default", {"fs":"2d-fragment-shader","vs":"2d-vertex-shader", "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "hurt", {"fs":"2d-fragment-shader","vs":"2d-vertex-shader","settings":{"u_color":[0.8,0.1,0.0,1.0]}} );
	new Material(g.g, "gold", {"fs":"fragment-greytocolor","vs":"2d-vertex-shader", "settings":{"u_color":[1.0,0.9,0.2,1.0]}} );
	new Material(g.g, "heat", {"fs":"fragment-heat","vs":"2d-vertex-shader"} );
	new Material(g.g, "blur", {"fs":"2d-fragment-blur","vs":"2d-vertex-scale"} );
	new Material(g.g, "enchanted", {"fs":"2d-fragment-glow","vs":"2d-vertex-shader", "settings":{"u_color":[1.0,0.0,0.3,1.0]}} );
	
	new Material(g.g, "t1", {"fs":"fragment-shifthue","vs":"2d-vertex-shader", "settings":{"u_shift":[0.1]}} );
	new Material(g.g, "t2", {"fs":"fragment-shifthue","vs":"2d-vertex-shader", "settings":{"u_shift":[-0.1]}} );
	new Material(g.g, "t3", {"fs":"fragment-shifthue","vs":"2d-vertex-shader", "settings":{"u_shift":[0.2]}} );
	new Material(g.g, "t4", {"fs":"fragment-shifthue","vs":"2d-vertex-shader", "settings":{"u_shift":[0.3]}} );
	new Material(g.g, "t5", {"fs":"fragment-shifthue","vs":"2d-vertex-shader", "settings":{"u_shift":[0.5]}} );
	
	new Material(g.g, "backbuffer", {"fs":"2d-fragment-shader","vs":"back-vertex-shader", "settings":{"u_color":[1.0,1.0,1.0,1.0]}} );
	new Material(g.g, "solid", {"fs":"2d-fragment-solid","vs":"2d-vertex-shader"} );
	new Material(g.g, "lightbeam", {"fs":"2d-fragment-lightbeam","vs":"2d-vertex-shader"} );
	
	g.addObject( new TitleMenu() );
	//dataManager.randomLevel(game,0);
}