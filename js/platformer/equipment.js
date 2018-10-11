var PlayerAttackList = [
	{	//Standing attack 1
		"damage":1.0,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : Game.DELTASECOND * 0.3,
		"animation" : "attack0",
		"prepause" : 0.0,
		"pause" : 0.125 * Game.DELTASECOND,
		"stun" : 0.5*Game.DELTASECOND,
		"movement" : 0.3,
		"audio" : "swing",
		"mesh" : "slash1",
		"path" : [new Point(0,-10), new Point(1,-14), new Point(0.5,-18)]
	},
	{	//Standing attack 2
		"damage":1.2,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : Game.DELTASECOND * 0.3,
		"animation" : "attack1",
		"prepause" : 0.0,
		"pause" : 0.125 * Game.DELTASECOND,
		"stun" : 0.5*Game.DELTASECOND,
		"movement" : 0.3,
		"audio" : "swing",
		"mesh" : "slash2",
		"path" : [new Point(0.5,-16), new Point(1,-12), new Point(0,-8)]
	},
	{	//Standing attack 3
		"damage":1.5,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attack2",
		"force" : new Point(3.0, 0.0),
		"prepause" : 0.0,
		"pause" : 0.25 * Game.DELTASECOND,
		"knockback" : new Point(10,0),
		"stun" : 0.25 * Game.DELTASECOND,
		"movement" : 0.0,
		"audio" : "swing",
		"mesh" : "slash3",
		"path" : [new Point(0,-12), new Point(1.2,-12), new Point(1,-12)]
	},
	{	//Charge attack
		"damage":3.0,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : 1.5*Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attack3",
		"prepause" : 0.3 * Game.DELTASECOND,
		"stun" : 0.7 * Game.DELTASECOND,
		"pause" : Game.DELTASECOND * 0.25,
		"force" : new Point(12.0, 0.0),
		"movement" : 0.1,
		"audio" : "swing2",
		"mesh" : "slashc",
		"path" : [new Point(-.25,-8), new Point(1,-12), new Point(0.5,-16)]
		//"airtime" : (warmTime+1.5*baseTime+restTime) * Game.DELTASECOND
	},
	{	//uppercut
		"damage":0.8,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : 1.5*Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attack4",
		"prepause" : 0.0,
		"pause" : Game.DELTASECOND * 0.3,
		"stun" : 0.5 * Game.DELTASECOND,
		"knockback" : new Point(0.0, -8.0),
		"force" : new Point(0, -8.0),
		"movement" : 0.3,
		"audio" : "swing2",
		"mesh" : "slashu",
		"path" : [new Point(0,-8), new Point(1,-24), new Point(0.3,-32)]
	},
	{	//duck attack
		"damage":1.2,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : Game.DELTASECOND * 0.3,
		"animation" : "attack5",
		"prepause" : 0.0,
		"force" : new Point(0.0, 0.0),
		"stun" : 0.3 * Game.DELTASECOND,
		"movement" : 0.0,
		"audio" : "swing",
		"mesh" : "slash3",
		"duck" : true,
		"path" : [new Point(0,6), new Point(1.2,6), new Point(0.5,6)]
	},
	{	//Down stab
		"damage":1.0,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attack6",
		"prepause" : 0.0,
		"stun" : 0.7 * Game.DELTASECOND,
		"movement" : 1.0,
		"audio" : "swing",
		"mesh" : "slashd",
		"path" : [new Point(-0.05,8), new Point(0,36), new Point(0.05,8)]
		//"airtime" : 0.3 * Game.DELTASECOND
	},
	{	//Whip attack
		"damage":1.0,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attackwhip",
		"prepause" : 0.0,
		"stun" : 0.7 * Game.DELTASECOND,
		"movement" : 0.0,
		"audio" : "swing",
		"mesh" : "slashd",
		"path" : [new Point(-0.1,-8), new Point(0,-8), new Point(1,-8)]
		//"airtime" : 0.3 * Game.DELTASECOND
	},
	{	//Over head attack
		"damage":1.0,
		"warm" : Game.DELTASECOND,
		"cool" : Game.DELTASECOND,
		"time" : Game.DELTASECOND,
		"wait" : 0.0,
		"animation" : "attackover",
		"prepause" : 0.0,
		"pause" : 0.125 * Game.DELTASECOND,
		"stun" : 0.7 * Game.DELTASECOND,
		"movement" : 0.5,
		"audio" : "swing",
		"mesh" : null,
		"path" : [new Point(-0.75,-14), new Point(-0.1,-52), new Point(0.80,-20), new Point(1,8), new Point(1,8)]
		
		//"airtime" : 0.3 * Game.DELTASECOND
	}
];

/*
var WeaponStats = {
	//baseTime, missTime, length
	"short_sword" : createWeaponTemplate(0.25,0.10,38),
	"long_sword" : createWeaponTemplate(0.25,0.2,48),
	"broad_sword" : createWeaponTemplate(0.25,0.3,42),
	"morningstar" : createWeaponTemplate(0.45,0.35,40),
	"bloodsickle" : createWeaponTemplate(0.25,0.15,36),
	"burningblade" : createWeaponTemplate(0.25,0.2,38),
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
*/

class PlayerWeapon {
	constructor(name, warm, cool, speed, damage, range) {
		this.name = name;
		this.warm = warm;
		this.cool = cool;
		this.speed = speed;
		this.damage = damage;
		this.range = range;
		this.size = new Point(9,9);
		
		this.color1 = [1,1,1,1];
		this.color2 = [1,1,1,1];
		this.attacks = {
			"standing" : 0,
			"charged" : 3,
			"jumpup" : 4,
			"ducking" : 5,
			"downattack" : 6,
			"jumping" : 0,
		};
		this.combos = {
			0 : {"standing" : 1, "jumping":1, "ducking" : 5},
			1 : {"standing" : 2, "ducking" : 5},
			2 : {"ducking" : 5},
			5 : {"ducking" : 5}
		};
	}
	onEquip(player){}
	nextCombo(state, current){
		if(current in this.combos){
			if(state in this.combos[current]){
				return this.combos[current][state];
			}
		}
		return -1;
	}
	firstAttack(state){
		if(state in this.attacks){
			return this.attacks[state];
		}
	}
	getAttack(current){
		return PlayerAttackList[current];
	}
}
PlayerWeapon.STATE_STANDING = "standing";
PlayerWeapon.STATE_CHARGED = "charged";
PlayerWeapon.STATE_JUMPING = "jumping";
PlayerWeapon.STATE_DUCKING = "ducking";
PlayerWeapon.STATE_JUMPUP = "jumpup";
PlayerWeapon.STATE_DOWNATTACK = "downattack";
PlayerWeapon.CHARGED_INDEX = 3;
PlayerWeapon.DOWNATTACK_INDEX = 6;

WeaponList = {
	//name, warm, cool, speed, damage, range
	"short_sword" : new PlayerWeapon("short sword", 	0.125,0.250,0.125, 		1.0,	38),
	"long_sword" : new PlayerWeapon("long sword", 		0.125,0.250,0.250,		1.5,	48),
	"broad_sword" : new PlayerWeapon("broad_sword", 	0.125,0.250,0.250,		2.0,	42),
	"morningstar" : new PlayerWeapon("morning star", 	0.125,0.250,0.250,		2.0,	40),
	"bloodsickle" : new PlayerWeapon("blood sickle", 	0.125,0.250,0.250,		0.8,	36),
	"burningblade" : new PlayerWeapon("burning blade", 	0.125,0.250,0.250,		0.85,	38),
	"whip" : new PlayerWeapon("whip",		 			0.150,0.150,0.250,		1.25,	96),
	"king_sword" : new PlayerWeapon("king sword",		0.150,0.150,0.500,		2.0,	52),
};

WeaponList.morningstar.combos = {
	0 : {"standing" : 1, "jumping":1},
	1 : {"standing" : 0}
};

WeaponList.bloodsickle.combos = {
	0 : {"standing" : 1, "jumping":1},
	1 : {"standing" : 0}
};
WeaponList.burningblade.onEquip = function(player){ player.perks.fireDamage += 0.05; }
WeaponList.whip.combos = {};
WeaponList.whip.attacks = {"standing" : 7, "charged" : 7, "jumpup" : 7, "ducking" : 7, "downattack" : 7, "jumping" : 7,};
WeaponList.whip.size = new Point(32,9);

WeaponList.king_sword.combos = {};
WeaponList.king_sword.attacks = {"standing" : 8, "charged" : 8, "jumpup" : 8, "ducking" : 8, "downattack" : 8, "jumping" : 8,};
WeaponList.king_sword.size = new Point(32,32);