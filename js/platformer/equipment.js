Weapon = {
	"STATE_STANDING" : "standing",
	"STATE_CHARGED" : "charged",
	"STATE_JUMPING" : "jumping",
	"STATE_DUCKING" : "ducking",
	"STATE_JUMPUP" : "jumpup",
	"STATE_DOWNATTACK" : "downattack",
	"playerState" : function(player){
		var state = Weapon.STATE_STANDING;
		if(player.downstab && !player.grounded && input.state("down") > 0){
			state = Weapon.STATE_DOWNATTACK;
		} else if(player.states.dash > 0){
			state = Weapon.STATE_CHARGED;
		} else if(!player.grounded){ 
			if(player.states.justjumped > 0.0){
				state = Weapon.STATE_JUMPUP;
			} else {
				state = Weapon.STATE_JUMPING;
			}
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
		new Sequence([[0,5,0.10],[1,5,0.10],[2,5,0.10],[3,5,0.10],[4,5,0.10],[5,5,0.10],[6,5,0.10]]),
		new Sequence([[7,5,0.20],[8,5,0.20],[9,5,0.20],[10,5,0.20],[11,5,0.20]]),
		new Sequence([[0,11,0.12],[1,11,0.08],[2,11,0.08],[3,11,0.08],[4,11,0.12]])
	]
};


createWeaponTemplate = function(warmTime, baseTime, restTime, missTime, length){
	return {
		"color1" : [.7,.8,1,1],
		"color2" : [1,1,1,1],
		"damage" : 3.0,
		"range" : length,
		"onEquip" : function(player){},
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
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.5*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash2"
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
				"pause" : Game.DELTAFRAME30 * 2,
				"knockback" : 5,
				"stun" : 0.25 * Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash3"
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
				"animation" : 5,
				"force" : new Point(0.0, 0.0),
				"stun" : 0.3 * Game.DELTASECOND,
				"movement" : 0.0,
				"mesh" : "slash3"
			}
		},
		"jumping" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.0,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 0,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.75*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
			1 : {
				"strike" : new Line(new Point(0,-8), new Point(length,-4)),
				"damage":1.2,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND,
				"miss":missTime*Game.DELTASECOND,
				"animation" : 1,
				"pause" : Game.DELTAFRAME30,
				"stun" : 0.75*Game.DELTASECOND,
				"movement" : 0.3,
				"mesh" : "slash1"
			},
		},
		"jumpup" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-24), new Point(length,12)),
				"damage":0.8,
				"warm" :0,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":restTime*Game.DELTASECOND*0.8,
				"miss":restTime*Game.DELTASECOND,
				"animation" : 4,
				"pause" : Game.DELTAFRAME30 * 2,
				"stun" : 0.5 * Game.DELTASECOND,
				"knockback" : new Point(0.0, -14.0),
				"force" : new Point(0, -2.0),
				"movement" : 0.3,
				"mesh" : "slashu"
			}
		},
		"charged" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(0,-8), new Point(length,12)),
				"damage":3.5,
				"warm" : warmTime*Game.DELTASECOND,
				"time" : 1.5*baseTime*Game.DELTASECOND,
				"rest":0.8*restTime*Game.DELTASECOND,
				"miss":1.0*restTime*Game.DELTASECOND,
				"animation" : 3,
				"stun" : 0.7 * Game.DELTASECOND,
				"force" : new Point(12.0, 0.0),
				"movement" : 0.1,
				"audio" : "swing2",
				"mesh" : "slashc"
				//"airtime" : (warmTime+1.5*baseTime+restTime) * Game.DELTASECOND
			}
		},
		"downattack" : {
			"alwaysqueue" : 0,
			"length" : 1,
			0 : {
				"strike" : new Line(new Point(-10,0), new Point(10,length)),
				"damage":1.0,
				"warm" : 0.05*Game.DELTASECOND,
				"time" : 0.25*Game.DELTASECOND,
				"rest": 0.08*Game.DELTASECOND,
				"miss": 0.10*Game.DELTASECOND,
				"animation" : 6,
				"stun" : 0.7 * Game.DELTASECOND,
				"movement" : 1.0,
				"mesh" : "slashd"
				//"airtime" : 0.3 * Game.DELTASECOND
			}
		}
	};
}

var WeaponStats = {
	//warmTime, baseTime, restTime, missTime, length
	"short_sword" : createWeaponTemplate(0.05,0.25,0.08,0.10,38),
	"long_sword" : createWeaponTemplate(0.10,0.25,0.1,0.2,48),
	"broad_sword" : createWeaponTemplate(0.20,0.25,0.1,0.3,42),
	"morningstar" : createWeaponTemplate(0.08,0.35,0.08,0.35,40),
	"bloodsickle" : createWeaponTemplate(0.05,0.25,0.08,0.15,36),
	"burningblade" : createWeaponTemplate(0.05,0.25,0.1,0.2,38),
}

WeaponStats.short_sword.damage = 1;
WeaponStats.short_sword.standing.alwaysqueue = 1;

WeaponStats.long_sword.damage = 1.5;
WeaponStats.long_sword.standing.alwaysqueue = 0;

WeaponStats.broad_sword.damage = 2;
WeaponStats.broad_sword.standing.alwaysqueue = 0;

WeaponStats.morningstar.damage = 2;
WeaponStats.morningstar.standing.alwaysqueue = 0;
WeaponStats.morningstar.standing.length = 1;
WeaponStats.morningstar.standing[0]["force"] = new Point(1.0,0.0);

WeaponStats.bloodsickle.damage = 0.8;
WeaponStats.bloodsickle.standing.alwaysqueue = 1;
WeaponStats.bloodsickle.standing.length = 2;
WeaponStats.bloodsickle.onEquip = function(player){ player.perks.lifeSteal += 0.06; },

WeaponStats.burningblade.damage = 1.0;
WeaponStats.burningblade.standing.alwaysqueue = 1;
WeaponStats.burningblade.standing[2]["force"] = new Point(0.0,0.0);
WeaponStats.burningblade.onEquip = function(player){ player.damageFire += Math.floor(_player.stats.attack * 0.5); },
WeaponStats.burningblade.color1 = COLOR_FIRE;
WeaponStats.burningblade.color2 = [1,0.5,0.0,1.0];