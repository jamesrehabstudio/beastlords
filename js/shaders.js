window.shaders = {};



 /* platformer\shaders\2d-fragment-blur.shader*/ 

window.shaders["2d-fragment-blur"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float blur;\nuniform vec4 u_color;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec4 u = texture2D(u_image, v_texCoord + vec2(0,-blur));\n	vec4 d = texture2D(u_image, v_texCoord + vec2(0,blur));\n	vec4 l = texture2D(u_image, v_texCoord + vec2(-blur,0));\n	vec4 r = texture2D(u_image, v_texCoord + vec2(blur,0));\n	\n	if( v_position.y < 3.0 ) u = color;\n	if( v_position.y > 14.0 ) d = color;\n	if( v_position.x < 3.0 ) l = color;\n	if( v_position.x > 14.0 ) r = color;\n	\n	float activeColors = 0.0;\n	if( color.a > 0.1 ) activeColors++;\n	if( u.a > 0.1 ) activeColors++;\n	if( d.a > 0.1 ) activeColors++;\n	if( l.a > 0.1 ) activeColors++;\n	if( r.a > 0.1 ) activeColors++;\n	\n	color.r = (color.r + u.r + d.r + l.r + r.r) / activeColors;\n	color.g = (color.g + u.g + d.g + l.g + r.g) / activeColors;\n	color.b = (color.b + u.b + d.b + l.b + r.b) / activeColors;\n	color.a = (color.a + u.a + d.a + l.a + r.a) / 5.0;\n	\n	//color.a = 1.0; color.r = v_position.x/16.0; color.g = v_position.y/16.0; color.b = 0.0;\n	gl_FragColor = color * u_color;\n}";



 /* platformer\shaders\2d-fragment-glow.shader*/ 

window.shaders["2d-fragment-glow"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\n\nuniform vec4 u_color;\nuniform vec2 u_frameSize;\nuniform float u_pixelSize;\n\n\nvarying vec2 v_edges;\n\nbool sample(vec2 shift){\n	vec2 check = v_edges + shift * u_frameSize;\n	if(check.x > 1.0 || check.x < 0.0 || check.y > 1.0 || check.y < 0.0){\n		return false;\n	}\n	return texture2D(u_image, v_texCoord+shift).a > 0.1;\n}\n\nvoid main() {\n	float pixSize = 1.0 / u_pixelSize;\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( color.a < 0.1 ) {\n		if( \n			sample(vec2(-pixSize,0)) || \n			sample(vec2(pixSize,0)) || \n			sample(vec2(0,-pixSize)) || \n			sample(vec2(0,pixSize))\n		) {\n			color = u_color;\n		}\n	}\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-lightbeam.shader*/ 

window.shaders["2d-fragment-lightbeam"] = "precision mediump float;\nuniform vec4 u_color;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = u_color;\n	color.a *= 1.0 - v_texCoord.y;\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-redasalpha.shader*/ 

window.shaders["2d-fragment-redasalpha"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform vec4 u_color;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	color.a *= color.r * u_color.a;\n	color.rgb = vec3(u_color.rgb);\n	gl_FragColor = color;\n}";



 /* platformer\shaders\2d-fragment-shader.shader*/ 

window.shaders["2d-fragment-shader"] = "precision mediump float;\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	gl_FragColor = additive + multiply * texture2D(u_image, v_texCoord);\n}";



 /* platformer\shaders\2d-fragment-solid.shader*/ 

window.shaders["2d-fragment-solid"] = "precision mediump float;\nuniform vec4 u_color;\n\nvoid main() {\n	gl_FragColor = u_color;\n}";



 /* platformer\shaders\2d-vertex-default.shader*/ 

window.shaders["2d-vertex-default"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec4 u_frame;\nuniform mat3 u_world;\nuniform mat3 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\nvarying vec2 v_edges;\n\nvoid main() {\n	vec3 pos = u_camera * u_world * vec3(a_position,1);\n	gl_Position = vec4(pos,1);\n	v_texCoord = vec2(\n		(a_texCoord.x+u_frame.x) * u_frame.z,\n		(a_texCoord.y+u_frame.y) * u_frame.w\n	);\n	v_position = a_position;\n	v_edges = vec2(0,0);\n	if(a_position.x > 0.0){\n		v_edges.x = 1.0;\n	}\n	if(a_position.y > 0.0){\n		v_edges.y = 1.0;\n	}\n}";



 /* platformer\shaders\2d-vertex-scale.shader*/ 

window.shaders["2d-vertex-scale"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 scale;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position * scale + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-shader.shader*/ 

window.shaders["2d-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-tile.shader*/ 

window.shaders["2d-vertex-tile"] = "attribute vec2 a_tilegrid;\nattribute vec2 a_tileuvs;\nattribute vec2 a_tile;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvec2 tile(vec2 tile){\n	float t = tile.x;\n	float flag = tile.y;\n	bool flipd = false;\n	bool flipv = false;\n	bool fliph = false;\n	bool bottom = false;\n	bool right = false;\n	\n	if( flag - 32.0 >= 0.0){\n		fliph = true;\n		flag -= 32.0;\n	}\n	if( flag - 16.0 >= 0.0){\n		flipv = true;\n		flag -= 16.0;\n	}\n	if( flag - 8.0 >= 0.0){\n		flipd = true;\n		flag -= 8.0;\n	}\n	if( flag - 4.0 >= 0.0){\n		flag -= 4.0;\n	}\n	if( flag - 2.0 >= 0.0){\n		bottom = true;\n		flag -= 2.0;\n	}\n	if( flag - 1.0 >= 0.0){\n		right = true;\n		flag -= 1.0;\n	}\n	\n	float size = 32.0;\n	float ts = 1.0 / size;\n	\n	t = t - 1.0;\n	float x = min(mod(t, size) / size, 1.0-ts);\n	float y = min(floor(t / size) / size, 1.0-ts);\n	\n	bool xPlus = right;\n	bool yPlus = bottom;\n	\n	if(flipd){\n		if(bottom){\n			if(right){\n				xPlus = true;\n				yPlus = false;\n			} else{\n				xPlus = true;\n				yPlus = true;\n			}\n		} else {\n			if(right){\n				xPlus = false;\n				yPlus = false;\n			} else{\n				xPlus = false;\n				yPlus = true;\n			}\n		}\n	}\n	\n	if(flipv){\n		yPlus = !yPlus;\n	} \n	if(fliph){\n		xPlus = !xPlus;\n	}\n	\n	if(yPlus){\n		y += ts;\n	}\n	if(xPlus){\n		x += ts;\n	}\n	\n	\n	return vec2(x,y);\n}\n\n\nvoid main() {\n	//Adjust position with camera\n	vec2 pos = a_tilegrid + u_camera - u_resolution * 0.5;\n	\n	//Flip object\n	pos.y = pos.y*-1.0;\n	\n	//Set position\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	\n	//Get UV from tile information\n	vec2 a_texCoord = tile(a_tile);\n	\n	\n	//Store new position for fragment shader\n	v_texCoord = a_texCoord;\n	v_position = a_tilegrid;\n}";



 /* platformer\shaders\back-vertex-shader.shader*/ 

window.shaders["back-vertex-shader"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	//vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(a_position, 0, 1);\n	v_texCoord = a_texCoord;\n}";



 /* platformer\shaders\fragment-crt.shader*/ 

window.shaders["fragment-crt"] = "precision mediump float;\n\n#define M_PI 3.1415926535897932384626433832795\n#define CURVE 0.00625\n#define LINES 2048.0\n#define LOW 0.02\n#define BLUR 0.001\n#define RATIO 0.5625\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	\n	float c1 = cos((v_texCoord.x*(512.0/u_resolution.x))*2.0*M_PI);\n	float c2 = cos((v_texCoord.y*(512.0/u_resolution.y))*2.0*M_PI);\n	\n	vec2 uv = vec2(\n		v_texCoord.x + c1 * CURVE - 0.01,\n		v_texCoord.y + c2 * CURVE - 0.01\n	);\n	\n	vec4 color1 = additive + multiply * texture2D(u_image, uv) * vec4(1.2,0.833333,1.0,1.0);\n	vec4 color2 = additive + multiply * texture2D(u_image, uv+vec2(BLUR,0)) * vec4(0.83333,1.2,1.0,1.0);\n	\n	vec4 fcolor = (color1 + color2) * 0.6;\n	\n	fcolor.r = (0.8 + sin((uv.y+LOW*0.0) * LINES) * 0.2) * fcolor.r;\n	fcolor.g = (0.8 + sin((uv.y+LOW*1.0) * LINES) * 0.2) * fcolor.g;\n	fcolor.b = (0.8 + sin((uv.y+LOW*2.0) * LINES) * 0.2) * fcolor.b;\n	\n	gl_FragColor = fcolor;\n}";



 /* platformer\shaders\fragment-fire.shader*/ 

window.shaders["fragment-fire"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_time;\n\nvec2 uvcord(vec2 orig, float time){\n	float x = orig.x + 0.5;\n	float y = mod(orig.y + time,0.5);\n	return vec2(x,y);\n}\n\nvoid main() {\n	float intensity1 = texture2D(u_image, v_texCoord).r;\n	float intensity2 = texture2D(u_image, uvcord(v_texCoord, u_time)).r;\n	float intensity = intensity1*intensity2;\n	vec4 color = texture2D(u_image, vec2(intensity, 1));\n	if(intensity < 0.1){\n		color.a = 0.0;\n	}\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-greytocolor.shader*/ 

window.shaders["fragment-greytocolor"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( abs((color.r+color.g+color.b)-color.r*3.0) < 0.04 ) {\n		gl_FragColor = color * u_color;\n	} else { \n		gl_FragColor = color;\n	}\n}";



 /* platformer\shaders\fragment-heat.shader*/ 

window.shaders["fragment-heat"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float heat;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	color.r = color.r * (1.0-heat) + heat;\n	color.g = color.g * (1.0-heat) + heat * 0.4;\n	color.b = color.b * (1.0-heat);\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-highcontrast.shader*/ 

window.shaders["fragment-highcontrast"] = "precision mediump float;\n\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	\n	float pix = 0.001953125;\n	float str = 1.5;\n	float bstr = 0.6;\n	\n	vec4 color1 = texture2D(u_image, v_texCoord);\n	vec4 color2 = texture2D(u_image, v_texCoord + vec2(pix,0.0));\n	vec4 color3 = texture2D(u_image, v_texCoord + vec2(-pix,0.0));\n	vec4 color4 = texture2D(u_image, v_texCoord + vec2(0.0,pix));\n	vec4 color5 = texture2D(u_image, v_texCoord + vec2(0.0,-pix));\n	\n	vec4 average = (color2 + color3 + color4 + color5) * 0.25;\n	vec4 boost = clamp((color1 - average) * str, 0.0, 1.0);\n	\n	vec4 fcolor = additive + multiply * color1 + (color1 - average) * str;\n	fcolor.r = max((fcolor.r + fcolor.g) * 0.5, fcolor.b*bstr);\n	fcolor.g = max(fcolor.r, fcolor.b*bstr);\n	fcolor.b = min(fcolor.r, fcolor.b);\n	\n	gl_FragColor = fcolor;\n}";



 /* platformer\shaders\fragment-shifthue.shader*/ 

window.shaders["fragment-shifthue"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_shift;\n\nvec3 rgb2hsv(vec3 c)\n{\n	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n	float d = q.x - min(q.w, q.y);\n	float e = 1.0e-10;\n	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec3 hsv = rgb2hsv(color.rgb);\n	hsv.x = mod(hsv.x + u_shift, 1.0);\n	vec3 rgb = hsv2rgb(hsv);\n	gl_FragColor = vec4(rgb,color.a);\n}";



 /* platformer\shaders\fragment-water.shader*/ 

window.shaders["fragment-water"] = "precision mediump float;\nuniform sampler2D u_image;\n\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\nuniform vec4 u_dimensions;\nuniform vec3 u_wavesize;\nuniform float u_time;\n\nvoid main() {\n	vec4 deepblue = vec4(0,0.2,0.5,1.0);\n	vec4 surfblue = vec4(0.9,0.95,1.0,1.0);\n	\n	float textx = v_texCoord.x + u_dimensions.x / (u_dimensions.z*0.5);\n	\n	float x = sin(textx * 30.0) * 10.0 + textx * u_dimensions.z;\n	float w = u_time * u_wavesize.z + (x * u_wavesize.x);\n	float h = (1.0 + sin(w)) * (u_wavesize.y / u_dimensions.w) * 0.5;\n	\n	vec4 color = mix(u_color,deepblue,pow(v_texCoord.y-h,0.5));\n	if(v_texCoord.y < h+0.01){\n		color = surfblue;\n	}\n	if(v_texCoord.y > h){\n		color.a = 1.0;\n	} else {\n		color.a = 0.0;\n	}\n	\n	gl_FragColor = color;\n}";

