precision mediump float;

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec4 u_highlight;
uniform vec2 u_size;
uniform vec3 u_buldge1;
uniform vec3 u_buldge2;
uniform vec3 u_buldge3;
uniform vec3 u_buldge4;
uniform vec3 u_buldge5;
uniform vec3 u_buldge6;
uniform float u_waves;
uniform float u_wavefreq;
uniform float u_time;

varying vec2 v_texCoord;
varying vec2 v_position;

const float colordepth = 8.0;
const float margin = 32.0;
const float pi = 3.1415926535897932384626433832795;

float inv(float a){
	return abs(max(min(a,1.0),-1.0));
}
float saturate(float a){
	return max(min(a,1.0),0.0);
}
/*
float floorFloat(float a){
	return floor(a*colordepth) / colordepth;
}
float roundFloat(float a){
	if(mod(a, 1.0) >= 0.5) {
		return ceil(a*colordepth) / colordepth;
	}
	return floor(a*colordepth) / colordepth;
}
vec4 downsampleColor(vec4 a){
	bool oddVline = mod(gl_FragCoord.y,2.0) < 1.0;
	bool oddHline = mod(gl_FragCoord.x,2.0) < 1.0;
	bool ditter = (oddHline && !oddVline) || (!oddHline && oddVline);
	
	if(ditter){
		return vec4(floorFloat(a.x),floorFloat(a.y),floorFloat(a.z),a.a);
	}
	return vec4(roundFloat(a.x),roundFloat(a.y),roundFloat(a.z),a.a);
}
*/
float smooth(float f){
	//return cos(max(f, 0.0) * pi * 0.5);
	return 0.5 + atan(pi * (max(f,0.0)-0.5)) / (pi*0.6666);
}
void main() {
	vec2 uv = v_texCoord;
	vec2 xy = uv * u_size;
	vec4 color = u_color;
	
	float rise = ( 1.0 + sin(u_time + xy.x * u_wavefreq) ) * u_waves * 0.5;
	
	rise = max( u_buldge1.z * smooth(1.0 - (abs(xy.x-u_buldge1.x)) / u_buldge1.y), rise);
	rise = max( u_buldge2.z * smooth(1.0 - (abs(xy.x-u_buldge2.x)) / u_buldge2.y), rise);
	rise = max( u_buldge3.z * smooth(1.0 - (abs(xy.x-u_buldge3.x)) / u_buldge3.y), rise);
	rise = max( u_buldge4.z * smooth(1.0 - (abs(xy.x-u_buldge4.x)) / u_buldge4.y), rise);
	rise = max( u_buldge5.z * smooth(1.0 - (abs(xy.x-u_buldge5.x)) / u_buldge5.y), rise);
	rise = max( u_buldge6.z * smooth(1.0 - (abs(xy.x-u_buldge6.x)) / u_buldge6.y), rise);
	
	float level = margin - rise;
	
	if(xy.y < level ){
		color = vec4(0.0,0.0,0.0,0.0);
	} else if (xy.y < level + 1.0){
		color = u_highlight + texture2D(u_image, gl_FragCoord.xy / 240.0);
	} else if (xy.y < level + 6.0 || xy.x < 2.0 || xy.x > u_size.x - 2.0){
		color = mix(u_color, u_highlight, 0.4);
	}
	
	gl_FragColor = color;
	//gl_FragColor = vec4(u_bubbles,0.0,1.0);
	
}
