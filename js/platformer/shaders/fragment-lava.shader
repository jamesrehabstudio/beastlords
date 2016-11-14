precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
uniform float u_intensity;

void main() {
	float intensity = clamp(u_intensity * texture2D(u_image, v_texCoord).r,0.0,1.0);
	vec4 color = texture2D(u_image, vec2(intensity, 1));
	if(intensity < 0.1){
		color.a = 0.0;
	}
	gl_FragColor = color;
}