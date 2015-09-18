precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
uniform vec4 u_color;

void main() {
	float pixSize = 1.0 / 256.0;
	vec4 color = texture2D(u_image, v_texCoord);
	if( color.a < 0.1 ) {
		if( 
			texture2D(u_image, v_texCoord - vec2(pixSize,0)).a > 0.1 || 
			texture2D(u_image, v_texCoord + vec2(pixSize,0)).a > 0.1 || 
			texture2D(u_image, v_texCoord - vec2(0, pixSize)).a > 0.1 || 
			texture2D(u_image, v_texCoord + vec2(0, pixSize)).a > 0.1
		) {
			color = u_color;
		}
	}
	gl_FragColor = color;
	//gl_FragColor = vec4(v_texCoord.x,v_texCoord.y,0,1.0);
}