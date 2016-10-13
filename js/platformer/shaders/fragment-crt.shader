precision mediump float;

#define M_PI 3.1415926535897932384626433832795
#define CURVE 0.00625
#define LINES 2048.0
#define LOW 0.02
#define BLUR 0.001
#define RATIO 0.5625

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
	vec4 additive = clamp(u_color - 1.0,0.0,1.0);
	vec4 multiply = clamp(u_color,0.0,1.0);
	
	float c1 = cos((v_texCoord.x*(512.0/u_resolution.x))*2.0*M_PI);
	float c2 = cos((v_texCoord.y*(512.0/u_resolution.y))*2.0*M_PI);
	
	vec2 uv = vec2(
		v_texCoord.x + c1 * CURVE - 0.01,
		v_texCoord.y + c2 * CURVE - 0.01
	);
	
	vec4 color1 = additive + multiply * texture2D(u_image, uv) * vec4(1.2,0.833333,1.0,1.0);
	vec4 color2 = additive + multiply * texture2D(u_image, uv+vec2(BLUR,0)) * vec4(0.83333,1.2,1.0,1.0);
	
	vec4 fcolor = (color1 + color2) * 0.6;
	
	fcolor.r = (0.8 + sin((uv.y+LOW*0.0) * LINES) * 0.2) * fcolor.r;
	fcolor.g = (0.8 + sin((uv.y+LOW*1.0) * LINES) * 0.2) * fcolor.g;
	fcolor.b = (0.8 + sin((uv.y+LOW*2.0) * LINES) * 0.2) * fcolor.b;
	
	gl_FragColor = fcolor;
}