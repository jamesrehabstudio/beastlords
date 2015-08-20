Mayor.prototype = new GameObject();
Mayor.prototype.constructor = GameObject;
function Mayor(x, y){
	this.constructor();
	this.position.x = x;
	this.position.y = y+8;
	this.sprite = sprites.characters2;
	
	this.frame = 0;
	this.frame_row = 0;
	
	this.width = this.height = 48;
	
	this.addModule( mod_talk );
	this.text = i18n("mayor_intro");
	this.text_progress = 0;
	this.cursor = 0;
	this.peopleFree = 0;
	
	this.projects = {};
	this.projectCount = 0;
	this.fetchProjects();
	
	this.on("open", function(){
		game.pause = true;
		audio.play("pause")
	});
	this.on("close", function(){
		game.pause = false;
		audio.play("unpause")
	});
}

Mayor.prototype.fetchProjects = function(){
	this.projects = {};
	this.projectCount = 0;
	
	if( window._world instanceof WorldMap ) {
		this.peopleFree = window._world.town.people;
		
		for(var i in window._world.town.buildings ){
			var building = window._world.town.buildings[i];
			this.peopleFree -= building.people;
			
			if( building.complete && Mayor.ongoingProjects.indexOf(i) >= 0 ){
				this.projects[i] = building;
				this.projectCount++;
			} else if ( !building.complete && building.unlocked ) {
				this.projects[i] = building;
				this.projectCount++;
			}
		}
	}
}

Mayor.prototype.update = function(){
	this.frame = (this.frame + this.delta * 0.2) % 4;
	
	if( this.open ) {
		game.pause = true;
		if( Mayor.introduction ) {
			if( input.state("fire") == 1 ) {
				this.text_progress++;
				if( this.text_progress >= this.text.length){
					this.close();
					Mayor.introduction = false;
				}
			}
		} else { 
			var selected = null;
			var j = 0;
			for(var i in this.projects ) {
				if( j == this.cursor ) {
					selected = this.projects[i]; break;
				}
				j++
			}
			if( input.state("pause") == 1 || input.state("jump") == 1 ) {
				this.close();
			}
			if( input.state("up") == 1 ) {
				this.cursor = Math.max(this.cursor-1, 0);
				audio.play("cursor")
			}
			if( input.state("down") == 1 ) {
				this.cursor = Math.min(this.cursor+1, this.projectCount-1);
				audio.play("cursor")
			}
			if( selected ) {
				if( input.state("left") == 1 && selected.people > 0) {
					selected.people--;
					this.peopleFree++;
					audio.play("cursor")
				}
				if( input.state("right") == 1 && this.peopleFree > 0) {
					selected.people++;
					this.peopleFree--;
					audio.play("cursor")
				}
			}
		}
	}
}

Mayor.prototype.postrender = function(g,c){
	if( this.open ) {
		if( Mayor.introduction ) {
			renderDialog(g, this.text[this.text_progress]);
		} else {
			var left = game.resolution.x / 2 - 128;
			boxArea(g, left-16, 8, 256+32, 224);
			textArea(g, "$"+_world.town.money, left, 24);
			textArea(g, "People: "+ this.peopleFree, left, 36);
			
			var j = 0;
			for(var i in this.projects ) {
				//List projects
				var name = i18n("building_names")[i];
				
				textArea(g, name, left+16, j*12+56);
				textArea(g, "People: "+ this.projects[i].people, left+160, j*12+56);
				j++;
			}
			//Draw cursor
			textArea(g, "@", left, this.cursor*12+56);
		}
	}
}


Mayor.ongoingProjects = ["farm", "mine", "smith"];
Mayor.introduction = true;