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

window.shaders["2d-vertex-scale"] = "precision mediump float;\n\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 scale;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position * scale + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-shader.shader*/ 

window.shaders["2d-vertex-shader"] = "precision mediump float;\n\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nvoid main() {\n	vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.y = u_resolution.y + pos.y*-1.0;\n	pos.y = pos.y*-1.0;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);\n	v_texCoord = a_texCoord;\n	v_position = a_position;\n}";



 /* platformer\shaders\2d-vertex-tile.shader*/ 

window.shaders["2d-vertex-tile"] = "attribute vec2 a_position;\nattribute vec2 a_texCoord;\nattribute vec2 a_tiles;\nuniform float u_uvtilewidth;\nuniform float u_tilesize;\nuniform mat3 u_world;\nuniform mat3 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\nvarying vec2 v_edges;\n\nvoid main() {\n	vec3 pos = u_camera * u_world * vec3(a_position,1);\n	gl_Position = vec4(pos,1);\n	\n	float f = u_tilesize / u_uvtilewidth;\n	float tsw = u_uvtilewidth / u_tilesize;\n	\n	vec2 texCoord = a_texCoord;\n\n	float tile = a_tiles.x;\n	float flag = a_tiles.y;\n	\n	bool flagH = flag >= 4.0;\n	if(flagH) { flag -= 4.0; }\n	bool flagV = flag >= 2.0;\n	if(flagV) { flag -= 2.0; }\n	bool flagD = flag >= 1.0;\n	\n	if(flagD){\n		float t = texCoord.x;\n		texCoord.x = f + texCoord.y * -1.0;\n		texCoord.y = f + t * -1.0;\n	}\n	if(flagH){\n		texCoord.x = f + texCoord.x * -1.0;\n	}\n	if(flagV){\n		texCoord.y = f + texCoord.y * -1.0;		\n	}\n	\n	\n	vec2 t = vec2(\n		f * floor(mod(tile, tsw)),\n		f * floor(tile / tsw)\n	);\n	v_texCoord = vec2(\n		(texCoord.x + t.x),\n		(texCoord.y + t.y)\n	);\n	v_position = a_position;\n	v_edges = vec2(0,0);\n	if(a_position.x > 0.0){\n		v_edges.x = 1.0;\n	}\n	if(a_position.y > 0.0){\n		v_edges.y = 1.0;\n	}\n}";



 /* platformer\shaders\3d-vertex-default.shader*/ 

window.shaders["3d-vertex-default"] = "attribute vec3 a_position;\nattribute vec2 a_texCoord;\nuniform mat4 u_world;\nuniform mat4 u_camera;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\nvarying vec2 v_edges;\n\nvoid main() {\n	vec4 pos = vec4(a_position,1.0);\n	\n	//Invert Y axis\n	pos.y = 1.0-pos.y;\n	\n	//pos = u_world * pos;\n	pos = u_camera * u_world * pos;\n	\n	//Compress Z plane\n	pos.z = pos.z * 0.001;\n	\n	v_texCoord = vec2(a_texCoord.x, 1.0-a_texCoord.y);\n	v_position = a_position.xy;\n	\n	gl_Position = vec4(pos.xyz,1);\n}";



 /* platformer\shaders\back-vertex-shader.shader*/ 

window.shaders["back-vertex-shader"] = "precision mediump float;\n\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	//vec2 pos = a_position + u_camera - u_resolution * 0.5;\n	//pos.x = pos.x - u_resolution.x;\n	gl_Position = vec4(a_position, 0, 1);\n	v_texCoord = a_texCoord;\n}";



 /* platformer\shaders\fragment-crt.shader*/ 

window.shaders["fragment-crt"] = "precision mediump float;\n\n#define M_PI 3.1415926535897932384626433832795\n#define CURVE 0.0125\n#define LINES 2048.0\n#define LOW 0.02\n#define BLUR 0.00125\n#define RIPPLE 0.0004\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	\n	float c1 = (v_texCoord.x*(512.0/u_resolution.x)) - 0.5;\n	float c2 = 0.5 - (v_texCoord.y*(512.0/u_resolution.y));\n	\n	vec2 uv = vec2(\n		v_texCoord.x - cos(c2*M_PI) * CURVE * c1,\n		v_texCoord.y + cos(c1*M_PI) * CURVE * c2\n	);\n	uv.y = uv.y + RIPPLE * 0.25 * sin(uv.x / RIPPLE);\n	\n	vec4 fcolor = vec4(0,0,0,0);\n	\n	if(uv.x > 0.0 && uv.y > 0.0){\n		vec4 color1 = additive + multiply * texture2D(u_image, uv) * vec4(1.2,0.833333,1.0,1.0);\n		vec4 color2 = additive + multiply * texture2D(u_image, uv+vec2(BLUR,0)) * vec4(0.83333,1.2,1.0,1.0);\n		\n		fcolor = (color1 + color2) * 0.6;\n		float blowout = 1.0;\n		\n		fcolor.r = (0.8 + sin((uv.y+LOW*0.0) * LINES) * 0.2) * fcolor.r * blowout;\n		fcolor.g = (0.8 + sin((uv.y+LOW*1.0) * LINES) * 0.2) * fcolor.g * blowout;\n		fcolor.b = (0.8 + sin((uv.y+LOW*2.0) * LINES) * 0.2) * fcolor.b * blowout;\n	}\n	\n	gl_FragColor = fcolor;\n}";



 /* platformer\shaders\fragment-fire.shader*/ 

window.shaders["fragment-fire"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_time;\n\nvec2 uvcord(vec2 orig, float time){\n	float x = orig.x + 0.5;\n	float y = mod(orig.y + time,0.5);\n	return vec2(x,y);\n}\n\nvoid main() {\n	float intensity1 = texture2D(u_image, v_texCoord).r;\n	float intensity2 = texture2D(u_image, uvcord(v_texCoord, u_time)).r;\n	float intensity = intensity1*intensity2;\n	vec4 color = texture2D(u_image, vec2(intensity, 1));\n	if(intensity < 0.1){\n		color.a = 0.0;\n	}\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-greytocolor.shader*/ 

window.shaders["fragment-greytocolor"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	if( abs((color.r+color.g+color.b)-color.r*3.0) < 0.04 ) {\n		gl_FragColor = color * u_color;\n	} else { \n		gl_FragColor = color;\n	}\n}";



 /* platformer\shaders\fragment-heat.shader*/ 

window.shaders["fragment-heat"] = "precision mediump float;\nuniform sampler2D u_image;\nuniform float heat;\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	color.r = color.r * (1.0-heat) + heat;\n	color.g = color.g * (1.0-heat) + heat * 0.4;\n	color.b = color.b * (1.0-heat);\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-highcontrast.shader*/ 

window.shaders["fragment-highcontrast"] = "precision mediump float;\n\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	\n	float pix = 0.001953125;\n	float str = 1.5;\n	float bstr = 0.6;\n	\n	vec4 color1 = texture2D(u_image, v_texCoord);\n	vec4 color2 = texture2D(u_image, v_texCoord + vec2(pix,0.0));\n	vec4 color3 = texture2D(u_image, v_texCoord + vec2(-pix,0.0));\n	vec4 color4 = texture2D(u_image, v_texCoord + vec2(0.0,pix));\n	vec4 color5 = texture2D(u_image, v_texCoord + vec2(0.0,-pix));\n	\n	vec4 average = (color2 + color3 + color4 + color5) * 0.25;\n	vec4 boost = clamp((color1 - average) * str, 0.0, 1.0);\n	\n	vec4 fcolor = additive + multiply * color1 + (color1 - average) * str;\n	fcolor.r = max((fcolor.r + fcolor.g) * 0.5, fcolor.b*bstr);\n	fcolor.g = max(fcolor.r, fcolor.b*bstr);\n	fcolor.b = min(fcolor.r, fcolor.b);\n	\n	gl_FragColor = fcolor;\n}";



 /* platformer\shaders\fragment-lava.shader*/ 

window.shaders["fragment-lava"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_intensity;\n\nvoid main() {\n	float intensity = clamp(u_intensity * texture2D(u_image, v_texCoord).r,0.0,1.0);\n	vec4 color = texture2D(u_image, vec2(intensity, 1));\n	if(intensity < 0.1){\n		color.a = 0.0;\n	}\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-lavapool.shader*/ 

window.shaders["fragment-lavapool"] = "precision mediump float;\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_size;\nuniform float u_time;\n\nvarying vec2 v_texCoord;\n\nconst float pixsize = 0.015625;\n\nvoid main() {\n	vec2 uv = v_texCoord;\n	float xscale = 1.0 / u_size.x;\n	float yscale = 1.0 / u_size.y;\n	uv.y = uv.y + (sin((v_texCoord.x+u_time*xscale) * (u_size.x * 0.1)) - 1.0) * (1.0/u_size.y);\n	\n	vec4 c_glow = vec4(1.0,1.0,0.2,1.0);\n	vec4 c_body = vec4(0.9,0.0,0.2,1.0);\n	vec4 c_deep = vec4(1.0,1.0,0.2,1.0);\n	//vec4 c_deep = vec4(0.2,0.0,0.2,1.0);\n	\n	float bubbles = texture2D(u_image, mod((v_texCoord * u_size * pixsize) + vec2(0.0,u_time*0.1),1.0)).r;\n	\n	vec4 color = mix(c_body, c_deep, uv.y);\n	color = mix(c_glow, color, clamp(0.25 * uv.y * u_size.y,0.0,1.0));\n	color = mix(color, c_glow, bubbles * (1.0-min(v_texCoord.y/yscale*0.015625,1.0)));\n	\n	\n	if(uv.y < 0.0){\n		color.a = 0.0;\n	}\n	\n	gl_FragColor = color;\n	//gl_FragColor = vec4(random(v_texCoord.x),random(v_texCoord.y),0.0,1.0);\n	\n}";



 /* platformer\shaders\fragment-lightarea.shader*/ 

window.shaders["fragment-lightarea"] = "precision mediump float;\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec2 u_radius;\nuniform float u_time;\n\nvarying vec2 v_texCoord;\n\nconst float pixsize = 0.00416666666666666666666666666667;\n\nvoid main() {\n	vec2 uv = v_texCoord;\n	\n	if(uv.x < u_radius.x){\n		uv.x = uv.x / u_radius.x * 0.5;\n	} else if(uv.x > 1.0 - u_radius.x){\n		uv.x = 0.5 + (uv.x + u_radius.x - 1.0) / u_radius.x * 0.5;\n	} else {\n		uv.x = 0.5;\n	}\n	\n	\n	if(uv.y < u_radius.y){\n		uv.y = uv.y / u_radius.y * 0.5;\n	} else if(uv.y > 1.0 - u_radius.y){\n		uv.y = 0.5 + (uv.y + u_radius.y - 1.0) / u_radius.y * 0.5;\n	} else {\n		uv.y = 0.5;\n	}\n	\n	vec4 color = u_color * texture2D(u_image, uv);\n	gl_FragColor = color;\n	//gl_FragColor = vec4(random(v_texCoord.x),random(v_texCoord.y),0.0,1.0);\n	\n}";



 /* platformer\shaders\fragment-mesh.shader*/ 

window.shaders["fragment-mesh"] = "precision mediump float;\n\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\n\nuniform vec4 u_color;\n\nvoid main() {\n	gl_FragColor = texture2D(u_image, v_texCoord);\n}";



 /* platformer\shaders\fragment-ooze.shader*/ 

window.shaders["fragment-ooze"] = "precision mediump float;\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec4 u_highlight;\nuniform vec2 u_size;\nuniform vec3 u_buldge1;\nuniform vec3 u_buldge2;\nuniform vec3 u_buldge3;\nuniform vec3 u_buldge4;\nuniform vec3 u_buldge5;\nuniform vec3 u_buldge6;\nuniform float u_waves;\nuniform float u_wavefreq;\nuniform float u_time;\n\nvarying vec2 v_texCoord;\nvarying vec2 v_position;\n\nconst float colordepth = 8.0;\nconst float margin = 32.0;\nconst float pi = 3.1415926535897932384626433832795;\n\nfloat inv(float a){\n	return abs(max(min(a,1.0),-1.0));\n}\nfloat saturate(float a){\n	return max(min(a,1.0),0.0);\n}\n/*\nfloat floorFloat(float a){\n	return floor(a*colordepth) / colordepth;\n}\nfloat roundFloat(float a){\n	if(mod(a, 1.0) >= 0.5) {\n		return ceil(a*colordepth) / colordepth;\n	}\n	return floor(a*colordepth) / colordepth;\n}\nvec4 downsampleColor(vec4 a){\n	bool oddVline = mod(gl_FragCoord.y,2.0) < 1.0;\n	bool oddHline = mod(gl_FragCoord.x,2.0) < 1.0;\n	bool ditter = (oddHline && !oddVline) || (!oddHline && oddVline);\n	\n	if(ditter){\n		return vec4(floorFloat(a.x),floorFloat(a.y),floorFloat(a.z),a.a);\n	}\n	return vec4(roundFloat(a.x),roundFloat(a.y),roundFloat(a.z),a.a);\n}\n*/\nfloat smooth(float f){\n	//return cos(max(f, 0.0) * pi * 0.5);\n	return 0.5 + atan(pi * (max(f,0.0)-0.5)) / (pi*0.6666);\n}\nvoid main() {\n	vec2 uv = v_texCoord;\n	vec2 xy = uv * u_size;\n	vec4 color = u_color;\n	\n	float rise = ( 1.0 + sin(u_time + xy.x * u_wavefreq) ) * u_waves * 0.5;\n	\n	rise = max( u_buldge1.z * smooth(1.0 - (abs(xy.x-u_buldge1.x)) / u_buldge1.y), rise);\n	rise = max( u_buldge2.z * smooth(1.0 - (abs(xy.x-u_buldge2.x)) / u_buldge2.y), rise);\n	rise = max( u_buldge3.z * smooth(1.0 - (abs(xy.x-u_buldge3.x)) / u_buldge3.y), rise);\n	rise = max( u_buldge4.z * smooth(1.0 - (abs(xy.x-u_buldge4.x)) / u_buldge4.y), rise);\n	rise = max( u_buldge5.z * smooth(1.0 - (abs(xy.x-u_buldge5.x)) / u_buldge5.y), rise);\n	rise = max( u_buldge6.z * smooth(1.0 - (abs(xy.x-u_buldge6.x)) / u_buldge6.y), rise);\n	\n	float level = margin - rise;\n	\n	if(xy.y < level ){\n		color = vec4(0.0,0.0,0.0,0.0);\n	} else if (xy.y < level + 1.0){\n		color = u_highlight + texture2D(u_image, gl_FragCoord.xy / 240.0);\n	} else if (xy.y < level + 6.0 || xy.x < 2.0 || xy.x > u_size.x - 2.0){\n		color = mix(u_color, u_highlight, 0.4);\n	}\n	\n	gl_FragColor = color;\n	//gl_FragColor = vec4(u_bubbles,0.0,1.0);\n	\n}\n";



 /* platformer\shaders\fragment-palletswap.shader*/ 

window.shaders["fragment-palletswap"] = "precision mediump float;\n\n#define SEG 0.25\n#define CMAX 0.99\n\nuniform sampler2D u_image;\nuniform sampler2D u_colorgrid;\nuniform vec4 u_color;\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	vec4 additive = clamp(u_color - 1.0,0.0,1.0);\n	vec4 multiply = clamp(u_color,0.0,1.0);\n	vec4 color = additive + multiply * texture2D(u_image, v_texCoord);\n	\n	float r = min(1.0 - color.r,CMAX);\n	float g = min(color.g,CMAX);\n	float b = min(color.b,CMAX);\n	vec2 grid = vec2(\n		floor(mod(r * 16.0, 4.0)) * SEG + g * SEG,\n		floor((r * 16.0) / 4.0) * SEG + b * SEG\n	);\n	vec4 gridColor = texture2D(u_colorgrid, grid);\n	\n	\n	gl_FragColor = gridColor;\n}";



 /* platformer\shaders\fragment-shifthue.shader*/ 

window.shaders["fragment-shifthue"] = "precision mediump float;\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\nuniform float u_shift;\n\nvec3 rgb2hsv(vec3 c)\n{\n	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n	float d = q.x - min(q.w, q.y);\n	float e = 1.0e-10;\n	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main() {\n	vec4 color = texture2D(u_image, v_texCoord);\n	vec3 hsv = rgb2hsv(color.rgb);\n	hsv.x = mod(hsv.x + u_shift, 1.0);\n	vec3 rgb = hsv2rgb(hsv);\n	gl_FragColor = vec4(rgb,color.a);\n}";



 /* platformer\shaders\fragment-sparks.shader*/ 

window.shaders["fragment-sparks"] = "precision mediump float;\n\nuniform sampler2D u_image;\nuniform vec4 u_color;\nuniform vec4 u_color_edge;\nuniform vec2 u_size;\nuniform float u_intensity;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n	float color = texture2D(u_image, v_texCoord).r;\n	\n	float intensity = 1.0 - u_intensity;\n	\n	bool blank = false;\n	bool edge = false;\n	\n	if(color > intensity){\n		edge = texture2D(u_image, v_texCoord + vec2(u_size.x, 0)).r < intensity || edge;\n		edge = texture2D(u_image, v_texCoord + vec2(-u_size.x, 0)).r < intensity || edge;\n		edge = texture2D(u_image, v_texCoord + vec2(0,u_size.y)).r < intensity || edge;\n		edge = texture2D(u_image, v_texCoord + vec2(0,-u_size.y)).r < intensity || edge;\n	} else {\n		blank = true;\n	}\n	\n	if(blank){\n		gl_FragColor = vec4(0,0,0,0);\n	} else {\n		gl_FragColor = u_color;\n	}\n	if(edge){\n		gl_FragColor = u_color_edge;\n	}\n}";



 /* platformer\shaders\fragment-sword.shader*/ 

window.shaders["fragment-sword"] = "precision mediump float;\n\nuniform sampler2D u_image;\nvarying vec2 v_texCoord;\n\nuniform float u_time;\nuniform vec4 u_color;\nuniform vec4 u_color2;\n\nvoid main() {\n	vec4 color = mix(u_color,u_color2,u_time);\n	color.a = 0.0;\n	\n	if(u_time * 2.4 > v_texCoord.x){\n		color.a = 1.0;\n	}\n	if(u_time > v_texCoord.x){\n		color.a = 0.0;\n	}\n	\n	//texture2D(u_image, vec2(intensity, 1));\n	gl_FragColor = color;\n}";



 /* platformer\shaders\fragment-water.shader*/ 

window.shaders["fragment-water"] = "precision mediump float;\nuniform sampler2D u_image;\n\nvarying vec2 v_texCoord;\nuniform vec4 u_color;\nuniform vec4 u_dimensions;\nuniform vec3 u_wavesize;\nuniform float u_time;\n\nvoid main() {\n	vec4 deepblue = vec4(0,0.2,0.5,1.0);\n	vec4 surfblue = vec4(0.9,0.95,1.0,1.0);\n	\n	float textx = v_texCoord.x + u_dimensions.x / (u_dimensions.z*0.5);\n	\n	float x = sin(textx * 30.0) * 10.0 + textx * u_dimensions.z;\n	float w = u_time * u_wavesize.z + (x * u_wavesize.x);\n	float h = (1.0 + sin(w)) * (u_wavesize.y / u_dimensions.w) * 0.5;\n	\n	vec4 color = mix(u_color,deepblue,pow(v_texCoord.y-h,0.5));\n	if(v_texCoord.y < h+0.01){\n		color = surfblue;\n	}\n	if(v_texCoord.y > h){\n		color.a = 1.0;\n	} else {\n		color.a = 0.0;\n	}\n	\n	gl_FragColor = color;\n}";

