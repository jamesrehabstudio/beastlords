precision mediump float;
uniform sampler2D u_image;
uniform vec4 u_color;
varying vec2 v_texCoord;

void main() {
	vec4 color = texture2D(u_image, v_texCoord);
	color.a *= color.r * u_color.a;
	color.rgb = vec3(u_color.rgb);
	gl_FragColor = color;
}