precision mediump float;

#define M_PI 3.1415926535897932384626433832795
#define CURVE 0.0125
#define LINES 2048.0
#define LOW 0.02
#define BLUR 0.00125
#define RIPPLE 0.0004

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
	vec4 additive = clamp(u_color - 1.0,0.0,1.0);
	vec4 multiply = clamp(u_color,0.0,1.0);
	
	float c1 = (v_texCoord.x*(512.0/u_resolution.x)) - 0.5;
	float c2 = 0.5 - (v_texCoord.y*(512.0/u_resolution.y));
	
	vec2 uv = vec2(
		v_texCoord.x - cos(c2*M_PI) * CURVE * c1,
		v_texCoord.y + cos(c1*M_PI) * CURVE * c2
	);
	uv.y = uv.y + RIPPLE * 0.25 * sin(uv.x / RIPPLE);
	
	vec4 fcolor = vec4(0,0,0,0);
	
	if(uv.x > 0.0 && uv.y > 0.0){
		vec4 color1 = additive + multiply * texture2D(u_image, uv) * vec4(1.2,0.833333,1.0,1.0);
		vec4 color2 = additive + multiply * texture2D(u_image, uv+vec2(BLUR,0)) * vec4(0.83333,1.2,1.0,1.0);
		
		fcolor = (color1 + color2) * 0.6;
		float blowout = 1.0;
		
		fcolor.r = (0.8 + sin((uv.y+LOW*0.0) * LINES) * 0.2) * fcolor.r * blowout;
		fcolor.g = (0.8 + sin((uv.y+LOW*1.0) * LINES) * 0.2) * fcolor.g * blowout;
		fcolor.b = (0.8 + sin((uv.y+LOW*2.0) * LINES) * 0.2) * fcolor.b * blowout;
	}
	
	gl_FragColor = fcolor;
}