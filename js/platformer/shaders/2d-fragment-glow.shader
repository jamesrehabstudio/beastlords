precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;

uniform vec4 u_color;
uniform vec2 u_frameSize;
uniform float u_pixelSize;


varying vec2 v_edges;

bool sample(vec2 shift){
	vec2 check = v_edges + shift * u_frameSize;
	if(check.x > 1.0 || check.x < 0.0 || check.y > 1.0 || check.y < 0.0){
		return false;
	}
	return texture2D(u_image, v_texCoord+shift).a > 0.1;
}

void main() {
	float pixSize = 1.0 / u_pixelSize;
	vec4 color = texture2D(u_image, v_texCoord);
	if( color.a < 0.1 ) {
		if( 
			sample(vec2(-pixSize,0)) || 
			sample(vec2(pixSize,0)) || 
			sample(vec2(0,-pixSize)) || 
			sample(vec2(0,pixSize))
		) {
			color = u_color;
		}
	}
	gl_FragColor = color;
}