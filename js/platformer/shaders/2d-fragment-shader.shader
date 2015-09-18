precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
uniform vec4 u_color;

void main() {
	gl_FragColor = u_color * texture2D(u_image, v_texCoord);
	//gl_FragColor = vec4(v_texCoord.x,v_texCoord.y,0,1.0);
}