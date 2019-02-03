precision mediump float;

uniform sampler2D u_image;
varying vec2 v_texCoord;

uniform float u_time;
uniform vec4 u_color;
uniform vec4 u_color2;

void main() {
	float time = u_time + (1.0 - pow(v_texCoord.y, 0.25));
	vec4 color = mix(u_color,u_color2,u_time);
	color.a = 0.0;
	
	if(time * 2.4 > v_texCoord.x){
		color.a = 1.0;
	}
	if(time > v_texCoord.x){
		color.a = 0.0;
	}
	
	//texture2D(u_image, vec2(intensity, 1));
	gl_FragColor = color;
}