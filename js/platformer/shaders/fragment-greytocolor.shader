precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
uniform vec4 u_color;

void main() {
	vec4 color = texture2D(u_image, v_texCoord);
	if( abs((color.r+color.g+color.b)-color.r*3.0) < 0.04 ) {
		gl_FragColor = color * u_color;
	} else { 
		gl_FragColor = color;
	}
}