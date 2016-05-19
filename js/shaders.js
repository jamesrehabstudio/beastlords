window.shaders = {};



 /* platformer\shaders\2d-fragment-blur.shader*/ 

window.shaders["2d-fragment-blur"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float blur;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec4 u = texture2D(u_image, v_texCoord + vec2(0,-blur));\n	vec4 d = texture2D(u_image, v_texCoord + vec2(0,blur));\n	vec4 l = texture2D(u_image, v_texCoord + vec2(-blur,0));\n	vec4 r = texture2D(u_image, v_texCoord + vec2(blur,0));\n	\n	if( v_position.y < 3.0 ) u = color;\n	if( v_position.y > 14.0 ) d = color;\n	if( v_position.x < 3.0 ) l = color;\n	if( v_position.x > 14.0 ) r = color;\n	\n	float activeColors = 0.0;\n	if( color.a > 0.1 ) activeColors++;\n	if( u.a > 0.1 ) activeColors++;\n	if( d.a > 0.1 ) activeColors++;\n	if( l.a > 0.1 ) activeColors++;\n	if( r.a > 0.1 ) activeColors++;\n	\n	color.r = (color.r + u.r + d.r + l.r + r.r) / activeColors;\n	color.g = (color.g + u.g + d.g + l.g + r.g) / activeColors;\n	color.b = (color.b + u.b + d.b + l.b + r.b) / activeColors;\n	color.a = (color.a + u.a + d.a + l.a + r.a) / 5.0;\n	\n	//color.a = 1.0; color.r = v_position.x/16.0; color.g = v_position.y/16.0; color.b = 0.0;\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-glow.shader*/ 

window.shaders["2d-fragment-glow"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	float pixSize = 1.0 / 256.0;\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( color.a < 0.1 ) {\n		if( \n			texture2D(u_image, v_texCoord - vec2(pixSize,0)).a > 0.1 || \n			texture2D(u_image, v_texCoord + vec2(pixSize,0)).a > 0.1 || \n			texture2D(u_image, v_texCoord - vec2(0, pixSize)).a > 0.1 || \n			texture2D(u_image, v_texCoord + vec2(0, pixSize)).a > 0.1\n		) {\n			color = u_color;\n		}\n	}\n	gl_FragColor = color;\n	//gl_FragColor = vec4(v_texCoord.x,v_texCoord.y,0,1.0);\n}";



 /* platformer\shaders\2d-fragment-lightbeam.shader*/ 

window.shaders["2d-fragment-lightbeam"] = "precision mediump float;\nuniform vec4 u_color;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = u_color;\n	color.a *= 1.0 - v_texCoord.y;\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-shader.shader*/ 

window.shaders["2d-fragment-shader"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	vec4 additive = u_color - 1.0;\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	gl_FragColor = additive + multiply * texture2D(u_image, v_texCoord);\n}";



 /* platformer\shaders\2d-fragment-solid.shader*/ 

window.shaders["2d-fragment-solid"] = "precision mediump float;\nuniform vec4 u_color;\n\nvoid main() {\n	gl_FragColor = u_color;\n}";



 /* platformer\shaders\2d-vertex-scale.shader*/ 

window.shaders["2d-vertex-scale"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 scale;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position * scale + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-shader.shader*/ 

window.shaders["2d-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\back-vertex-shader.shader*/ 

window.shaders["back-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	//vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(a_position, 0, 1);\n	v_texCoord = a_texCoord;\n}";



 /* platformer\shaders\fragment-greytocolor.shader*/ 

window.shaders["fragment-greytocolor"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( abs((color.r+color.g+color.b)-color.r*3.0) < 0.04 ) {\n		gl_FragColor = color * u_color;\n	} else { \n		gl_FragColor = color;\n	}\n}";



 /* platformer\shaders\fragment-heat.shader*/ 

window.shaders["fragment-heat"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float heat;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	color.r = color.r * (1.0-heat) + heat;\n	color.g = color.g * (1.0-heat) + heat * 0.4;\n	color.b = color.b * (1.0-heat);\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-shifthue.shader*/ 

window.shaders["fragment-shifthue"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_shift;\n\nvec3 rgb2hsv(vec3 c)\n{\n	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n	float d = q.x - min(q.w, q.y);\n	float e = 1.0e-10;\n	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec3 hsv = rgb2hsv(color.rgb);\n	hsv.x = mod(hsv.x + u_shift, 1.0);\n	vec3 rgb = hsv2rgb(hsv);\n	gl_FragColor = vec4(rgb,color.a);\n}";

