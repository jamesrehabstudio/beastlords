precision mediump float;

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec4 u_color_edge;
uniform vec2 u_size;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
	float color = texture2D(u_image, v_texCoord).r;
	
	float intensity = 1.0 - u_intensity;
	
	bool blank = false;
	bool edge = false;
	
	if(color > intensity){
		edge = texture2D(u_image, v_texCoord + vec2(u_size.x, 0)).r < intensity || edge;
		edge = texture2D(u_image, v_texCoord + vec2(-u_size.x, 0)).r < intensity || edge;
		edge = texture2D(u_image, v_texCoord + vec2(0,u_size.y)).r < intensity || edge;
		edge = texture2D(u_image, v_texCoord + vec2(0,-u_size.y)).r < intensity || edge;
	} else {
		blank = true;
	}
	
	if(blank){
		gl_FragColor = vec4(0,0,0,0);
	} else {
		gl_FragColor = u_color;
	}
	if(edge){
		gl_FragColor = u_color_edge;
	}
}