precision mediump float;

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec2 u_size;
uniform vec2 u_bubbles;
uniform vec3 u_distortion;
uniform float u_time;
uniform float scalex;

varying vec2 v_texCoord;
varying vec2 v_position;

const float pixsize = 0.015625;

float inv(float a){
	return abs(max(min(a,1.0),-1.0));
}
float saturate(float a){
	return max(min(a,1.0),0.0);
}

void main() {
	vec2 uv = v_texCoord;
	float xscale = 1.0 / u_size.x;
	float yscale = 1.0 / u_size.y;
	float stepDis = u_size.x * abs(u_distortion.x-uv.x);
	
	float uvWaveOff = (sin((v_texCoord.x+u_time*xscale) * (u_size.x * 0.1)) - 1.0) * (0.5/u_size.y);
	float uvStepOff = u_distortion.z * yscale * saturate(stepDis * 0.0625 - 0.125) - yscale * 2.0;
	//uv.y = uv.y + mix(uvWaveOff, uvStepOff, u_distortion.y);
	uv.y = uv.y + mix(uvWaveOff, uvStepOff, u_distortion.y * (1.0-saturate(stepDis * 0.03125)));
	
	vec4 c_glow = vec4(0.8,1.0,0.6,1.0);
	vec4 c_body = vec4(0.0,0.3,0.2,1.0);
	vec4 c_deep = vec4(0.0,0.0,0.1,1.0);
	//vec4 c_deep = vec4(0.2,0.0,0.2,1.0);
	
	float drainStrength = u_bubbles.y - saturate(u_size.x * 0.125 * abs(uv.x - u_bubbles.x));
	float bubbles = texture2D(u_image, mod((v_texCoord * u_size * pixsize) + vec2(0.0,u_time*8.0),1.0)).r * 0.2;
	float edges = 0.0;
	
	//add left edge
	edges += max(1.0-uv.x * u_size.x,0.0);
	edges += max((uv.x-(1.0-xscale)) * u_size.x,0.0);
	edges += max(1.0-uv.y * 0.25 * u_size.y,0.0);
	
	vec4 color = mix(c_body, c_deep, uv.y);
	color = mix(color, c_glow, edges);
	
	color = mix(color, c_glow, bubbles * saturate(drainStrength));
	//color = mix(color, c_glow, bubbles * (1.0-min(v_texCoord.y/yscale*0.015625,1.0)));
	
	
	if(uv.y < 0.0){
		color.a = 0.0;
	}
	
	gl_FragColor = color;
	//gl_FragColor = vec4(u_bubbles,0.0,1.0);
	
}
