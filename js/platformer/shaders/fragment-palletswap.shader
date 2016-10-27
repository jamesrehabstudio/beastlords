precision mediump float;

#define SEG 0.25
#define CMAX 0.99

uniform sampler2D u_image;
uniform sampler2D u_colorgrid;
uniform vec4 u_color;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
	vec4 additive = clamp(u_color - 1.0,0.0,1.0);
	vec4 multiply = clamp(u_color,0.0,1.0);
	vec4 color = additive + multiply * texture2D(u_image, v_texCoord);
	
	float r = min(1.0 - color.r,CMAX);
	float g = min(color.g,CMAX);
	float b = min(color.b,CMAX);
	vec2 grid = vec2(
		floor(mod(r * 16.0, 4.0)) * SEG + g * SEG,
		floor((r * 16.0) / 4.0) * SEG + b * SEG
	);
	vec4 gridColor = texture2D(u_colorgrid, grid);
	
	
	gl_FragColor = gridColor;
}