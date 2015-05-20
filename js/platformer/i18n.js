window.language = "english";
window._messages = {
	"intro_text" : {
		"english" : "The folk of the land of Cahan have been plagued for centuries by a yearly spell they call \"The Trance\". Victims are drawn to the bowels of demonic temples where they're never heard from again. After our hero lost his father to the trance, he set on a mission to rescue him. You must destroy the five demonic temples to enter the final temple that houses your father.",
		"engrish" : "Ethnic Cahan of land, has been plagued for centuries by every year spell which they referred to as a \"Trance\". Victims, they are drawn deep into the demon of the temple that is never heard from again. Our hero, after losing his father to the trance, he was set to turn on the mission to rescue him. You must destroy the 5 devil temple to enter the housing final temple your father."
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
	}
};
function i18n(name,replace){
	replace = replace || {};
	var out = "";
	if( name in window._messages ){
		if( window.language in window._messages[name] ){
			out = window._messages[name][window.language];
		}
	}
	for(var i in replace){
		out = out.replace(i, replace[i]);
	}
	return out;
}