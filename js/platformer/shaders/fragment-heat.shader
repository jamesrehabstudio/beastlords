precision mediump float;
uniform sampler2D u_image;
uniform float heat;
varying vec2 v_texCoord;

void main() {
	vec4 color = texture2D(u_image, v_texCoord);
	color.r = color.r * (1.0-heat) + heat;
	color.g = color.g * (1.0-heat) + heat * 0.4;
	color.b = color.b * (1.0-heat);
	gl_FragColor = color;
}