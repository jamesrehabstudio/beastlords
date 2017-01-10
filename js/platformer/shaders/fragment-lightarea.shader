precision mediump float;

uniform sampler2D u_image;
uniform vec4 u_color;
uniform vec2 u_radius;
uniform float u_time;

varying vec2 v_texCoord;

const float pixsize = 0.00416666666666666666666666666667;

void main() {
	vec2 uv = v_texCoord;
	
	if(uv.x < u_radius.x){
		uv.x = uv.x / u_radius.x * 0.5;
	} else if(uv.x > 1.0 - u_radius.x){
		uv.x = 0.5 + (uv.x + u_radius.x - 1.0) / u_radius.x * 0.5;
	} else {
		uv.x = 0.5;
	}
	
	
	if(uv.y < u_radius.y){
		uv.y = uv.y / u_radius.y * 0.5;
	} else if(uv.y > 1.0 - u_radius.y){
		uv.y = 0.5 + (uv.y + u_radius.y - 1.0) / u_radius.y * 0.5;
	} else {
		uv.y = 0.5;
	}
	
	vec4 color = u_color * texture2D(u_image, uv);
	gl_FragColor = color;
	//gl_FragColor = vec4(random(v_texCoord.x),random(v_texCoord.y),0.0,1.0);
	
}