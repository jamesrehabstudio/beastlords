window.language = "english";
window._messages = {
	"intro_text" : {
		"english" : "A distant war has torn the land to pieces. Forced from their homes your people search for a new land to settle far away from the conflict. Though peace reigns so too does poverty. To save your new homeland you journey to the castles of the mysterious Beast Lords who want for nothing to take what you need for your people to survive.",
		"engrish" : "Distant war has hurt the land. The people will search for their home to a new land is safe from a distance dispute. Look out for poverty. In the castle of a mysterious Beast Lords take what is necessary for what is needed to survive. You will save the new home."
	},
	"introduction" : {
		"english" : "Intro",
		"engrish" : "Learning"
	},
	"new_game" : {
		"english" : "New game",
		"engrish" : "Game new"
	},
	"press_start" : {
		"english" : "Press start",
		"engrish" : "Start button"
	},
	"introduction_help" : {
		"english" : "See how this story began.",
		"engrish" : "You will learn How to play. Please enjoy to the story of origin."
	},
	"start_help" : {
		"english" : "Enter the world of Beast Lords. Beware, death will end the game.",
		"engrish" : "Play the game. Please note, death is permanent."
	},
	"templenames" : {
		"english" : ["Anahilt Fortress","The Gardens of Benburb", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"],
		"engrish" : ["Anahilt Fortress","Benburb Gardens", "Carncastle", "Dunore Keep", "Edenmore Temple", "Foyal Palace"]
	},
	"mayor_intro" : {
		"english" : [
			"Hello. I'm the Mayor of our town. Life is hard here.",
			"If we all work together we can make this a better place to live.",
			"Truth is... I have no idea what I'm doing.",
			"You look like a smart guy, maybe you can help.",
			"If you speak to me you can assign people to different projects",
			"Projects will cost money, the chancellor handles that."
		],
		"engrish" : [
			"Hello. My name is mayor.",
			"Help me this town better.",
			"I know nothing.",
			"You are smart.",
			"Press people to other construction.",
			"Donate to make the construction into a new with chancellor."
		]
	},
	"chancellor_howmuch" :{
		"english" : "How much would you like to donate?",
		"engrish" : "Money is of no object.",
	},
	"chancellor_intro" : {
		"english" : [
			"I'm the chancellor of this town. I manage the money.",
			"It turns out I don't manage it very well at all.",
			"Say, you wouldn't want to donate a little to our good town?",
			"I promise, every single penny will go to good projects!"
		],
		"engrish" : [
			"My name is Chancellor. I make good with the money.",
			"The money is trouble.",
			"You can donate your money to the town through me.",
			"I'll spend your money correctly.",
			"Press people to other construction.",
			"Donate to make the construction into a new with my assistant."
		]
	},
	"builder0" : {
		"english" : "We're just just gettin' started on this one, buddy.",
		"engrish" : "Play the game. Please note, death is permanent."
	},
	"builder1" : {
		"english" : "It's lookin' good. We'll be done in no time.",
		"engrish" : "The structure is half way complete."
	},
	"builder2" : {
		"english" : "We're nearly done building this one, buddy.",
		"engrish" : "We will complete this structure in short time."
	},
	"building_names" : {
		"english" : {
			"hall" : "Town hall",
			"mine" : "Gold mine",
			"lab" : "Wizard laboratory",
			"hunter" : "Hunter's shack",
			"mill" : "Wheat mill",
			"library" : "Library",
			"inn" : "Halfway house",
			"farm" : "Farm",
			"smith" : "Black smith",
			"bank" : "Bank"
		},
		"engrish" : {
			"hall" : "Town hall",
			"mine" : "Mine",
			"lab" : "Laboratory",
			"hunter" : "Bounty",
			"mill" : "Mill",
			"library" : "Library",
			"inn" : "Inn",
			"farm" : "Farm",
			"smith" : "Black smith",
			"bank" : "Bank"
		}
	}
	
};
function i18n(name,replace){
	replace = replace || {};
	var out = "";
	if( name in window._messages ){
		if( window.language in window._messages[name] ){
			out = window._messages[name][window.language];
		}else {
			for(var i in window._messages[name]){
				out = window._messages[name][i];
				break;
			}
		}
	}
	for(var i in replace){
		out = out.replace(i, replace[i]);
	}
	return out;
}