precision mediump float;
uniform vec4 u_color;
varying vec2 v_texCoord;

void main() {
	vec4 color = u_color;
	color.a *= 1.0 - v_texCoord.y;
	gl_FragColor = color;
}