Weapon = {
	"STATE_STANDING" : "standing",
	"STATE_CHARGED" : "charged",
	"STATE_JUMPING" : "jumping",
	"STATE_DUCKING" : "ducking",
	"playerState" : function(player){
		var state = Weapon.STATE_STANDING;
		if(player.attstates.charge >= player.speeds.charge){
			state = Weapon.STATE_CHARGED;
		} else if(!player.grounded){ 
			state = Weapon.STATE_JUMPING;
		} else if(player.states.duck){
			state = Weapon.STATE_DUCKING;
		}
		return state;
	},
	"animations" : [
		new Sequence([[0,4,0.10],[1,4,0.10],[2,4,0.10],[3,4,0.10]]),
		new Sequence([[4,4,0.10],[5,4,0.10],[6,4,0.10],[7,4,0.10]]),
		new Sequence([[7,4,0.10],[8,4,0.10],[9,4,0.10],[10,4,0.10]]),
		new Sequence([[1,8,0.10],[2,8,0.10],[3,8,0.10],[4,8,0.10],[5,8,0.10]]),
		new Sequence([[1,9,0.10],[2,9,0.10],[3,9,0.10],[4,9,0.10],[5,9,0.10]]),
		new Sequence([[0,5,0.10],[1,5,0.10],[2,5,0.10],[3,5,0.10],[4,5,0.10],[5,5,0.10],[6,5,0.10]])
	]
};


createWeaponTemplate = function(warmTime, baseTime, restTime, missTime, length){
	return {
		"damage" : 3.0,
		"standing" : {
			"alwaysqueue" : 0,
			"length" : 3,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : 0.05*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : 0.05*Game.DELTASECOND,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3
			},
			2 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.5,
				"warm" : 1.2*warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":2.5*restTime*Game.DELTASECOND,
				"miss":missTime*1.2*Game.DELTASECOND,
				"animation" : 2,
				"force" : new Point(3.0, 0.0),
				"pause" : 0.05*Game.DELTASECOND,
				"knockback" : 5,
				"stun" : 0.25 * Game.DELTASECOND,
				"movement" : 0.3
			}
		},
		"ducking" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,8), new Point(length,12)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest": restTime*Game.DELTASECOND,
				"miss": missTime*Game.DELTASECOND,
				"animation" : 4,
				"force" : new Point(0.0, 0.0),
				"stun" : 0.3 * Game.DELTASECOND,
				"movement" : 0.0
			}
		},
		"jumping" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-24), new Point(length,12)),
				"damage":0.8,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":restTime*Game.DELTASECOND,
				"animation" : 3,
				"pause" : 0.05*Game.DELTASECOND,
				"stun" : 0.5 * Game.DELTASECOND,
				"movement" : 1.0
			}
		},
		"charged" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,12)),
				"damage":2.5,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":1.5*restTime*Game.DELTASECOND,
				"miss":2.0*restTime*Game.DELTASECOND,
				"animation" : 5,
				"stun" : 0.7 * Game.DELTASECOND,
				"force" : new Point(4.5, 0.0),
				"movement" : 0.0
			}
		}
	};
}

var WeaponStats = {
	"short_sword" : createWeaponTemplate(0.05,0.30,0.08,0.15,38),
	"long_sword" : createWeaponTemplate(0.10,0.333,0.1,0.2,42),
	"broad_sword" : createWeaponTemplate(0.20,0.35,0.1,0.3,42)
}

WeaponStats.short_sword.damage = 3;
WeaponStats.short_sword.standing.alwaysqueue = 1;

WeaponStats.long_sword.damage = 4;
WeaponStats.long_sword.standing.alwaysqueue = 0;

WeaponStats.broad_sword.damage = 5;
WeaponStats.broad_sword.standing.alwaysqueue = 0;