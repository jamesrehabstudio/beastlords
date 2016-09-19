attribute vec2 a_position;
attribute vec2 a_tile;
uniform vec2 u_resolution;
uniform vec2 u_camera;

varying vec2 v_texCoord;
varying vec2 v_position;

vec2 tile(vec2 tile){
	float t = tile.x;
	float flag = tile.y;
	bool flipd = false;
	bool flipv = false;
	bool fliph = false;
	bool bottom = false;
	bool right = false;
	
	if( flag - 32.0 >= 0.0){
		fliph = true;
		flag -= 32.0;
	}
	if( flag - 16.0 >= 0.0){
		flipv = true;
		flag -= 16.0;
	}
	if( flag - 8.0 >= 0.0){
		flipd = true;
		flag -= 8.0;
	}
	if( flag - 4.0 >= 0.0){
		flag -= 4.0;
	}
	if( flag - 2.0 >= 0.0){
		bottom = true;
		flag -= 2.0;
	}
	if( flag - 1.0 >= 0.0){
		right = true;
		flag -= 1.0;
	}
	
	float size = 32.0;
	float ts = 1.0 / size;
	
	t = t - 1.0;
	float x = min(mod(t, size) / size, 1.0-ts);
	float y = min(floor(t / size) / size, 1.0-ts);
	
	bool xPlus = right;
	bool yPlus = bottom;
	
	if(flipd){
		if(bottom){
			if(right){
				xPlus = true;
				yPlus = false;
			} else{
				xPlus = true;
				yPlus = true;
			}
		} else {
			if(right){
				xPlus = false;
				yPlus = false;
			} else{
				xPlus = false;
				yPlus = true;
			}
		}
	}
	
	if(flipv){
		yPlus = !yPlus;
	} 
	if(fliph){
		xPlus = !xPlus;
	}
	
	if(yPlus){
		y += ts;
	}
	if(xPlus){
		x += ts;
	}
	
	
	return vec2(x,y);
}


void main() {
	//Adjust position with camera
	vec2 pos = a_position + u_camera - u_resolution * 0.5;
	
	//Flip object
	pos.y = pos.y*-1.0;
	
	//Set position
	gl_Position = vec4(pos/(u_resolution*0.5), 0, 1);
	
	//Get UV from tile information
	vec2 a_texCoord = tile(a_tile);
	
	
	//Store new position for fragment shader
	v_texCoord = a_texCoord;
	v_position = a_position;
}