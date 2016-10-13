precision mediump float;

uniform sampler2D u_image;
uniform vec4 u_color;

varying vec2 v_texCoord;

void main() {
	vec4 additive = clamp(u_color - 1.0,0.0,1.0);
	vec4 multiply = clamp(u_color,0.0,1.0);
	gl_FragColor = additive + multiply * texture2D(u_image, v_texCoord);
}