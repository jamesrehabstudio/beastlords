precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
uniform float u_time;

vec2 uvcord(vec2 orig, float time){
	float x = orig.x + 0.5;
	float y = mod(orig.y + time,0.5);
	return vec2(x,y);
}

void main() {
	float intensity1 = texture2D(u_image, v_texCoord).r;
	float intensity2 = texture2D(u_image, uvcord(v_texCoord, u_time)).r;
	float intensity = intensity1*intensity2;
	vec4 color = texture2D(u_image, vec2(intensity, 1));
	if(intensity < 0.1){
		color.a = 0.0;
	}
	gl_FragColor = color;
}