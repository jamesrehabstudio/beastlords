precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;

void main() {
	vec4 color = texture2D(u_image, v_texCoord);
	color.a *= color.r;
	color.rgb = vec3(1,1,1);
	gl_FragColor = color;
}