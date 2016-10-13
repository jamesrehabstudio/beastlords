precision mediump float;


uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
	vec4 additive = clamp(u_color - 1.0,0.0,1.0);
	vec4 multiply = clamp(u_color,0.0,1.0);
	
	float pix = 0.001953125;
	float str = 1.5;
	float bstr = 0.6;
	
	vec4 color1 = texture2D(u_image, v_texCoord);
	vec4 color2 = texture2D(u_image, v_texCoord + vec2(pix,0.0));
	vec4 color3 = texture2D(u_image, v_texCoord + vec2(-pix,0.0));
	vec4 color4 = texture2D(u_image, v_texCoord + vec2(0.0,pix));
	vec4 color5 = texture2D(u_image, v_texCoord + vec2(0.0,-pix));
	
	vec4 average = (color2 + color3 + color4 + color5) * 0.25;
	vec4 boost = clamp((color1 - average) * str, 0.0, 1.0);
	
	vec4 fcolor = additive + multiply * color1 + (color1 - average) * str;
	fcolor.r = max((fcolor.r + fcolor.g) * 0.5, fcolor.b*bstr);
	fcolor.g = max(fcolor.r, fcolor.b*bstr);
	fcolor.b = min(fcolor.r, fcolor.b);
	
	gl_FragColor = fcolor;
}