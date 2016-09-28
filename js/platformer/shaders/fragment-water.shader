precision mediump float;
uniform sampler2D u_image;

varying vec2 v_texCoord;
uniform vec4 u_color;
uniform vec4 u_dimensions;
uniform vec3 u_wavesize;
uniform float u_time;

void main() {
	vec4 deepblue = vec4(0,0.2,0.5,1.0);
	vec4 surfblue = vec4(0.9,0.95,1.0,1.0);
	
	float textx = v_texCoord.x + u_dimensions.x / (u_dimensions.z*0.5);
	
	float x = sin(textx * 30.0) * 10.0 + textx * u_dimensions.z;
	float w = u_time * u_wavesize.z + (x * u_wavesize.x);
	float h = (1.0 + sin(w)) * (u_wavesize.y / u_dimensions.w) * 0.5;
	
	vec4 color = mix(u_color,deepblue,pow(v_texCoord.y-h,0.5));
	if(v_texCoord.y < h+0.01){
		color = surfblue;
	}
	if(v_texCoord.y > h){
		color.a = 1.0;
	} else {
		color.a = 0.0;
	}
	
	gl_FragColor = color;
}