var PlayerAttackList = [
	{	//Standing attack 1
		"damage":1.0,
		"time" : Game.DELTASECOND,
		"wait":Game.DELTASECOND,
		"animation" : 0,
		"pause" : Game.DELTAFRAME30,
		"stun" : 0.5*Game.DELTASECOND,
		"movement" : 0.3,
		"audio" : "swing",
		"mesh" : "slash1"
	},
	{	//Standing attack 2
		"damage":1.2,
		"time" : Game.DELTASECOND,
		"wait":Game.DELTASECOND,
		"animation" : 1,
		"pause" : Game.DELTAFRAME30,
		"stun" : 0.5*Game.DELTASECOND,
		"movement" : 0.3,
		"audio" : "swing",
		"mesh" : "slash2"
	},
	{	//Standing attack 3
		"damage":1.5,
		"time" : Game.DELTASECOND,
		"wait":1.2*Game.DELTASECOND,
		"animation" : 2,
		"force" : new Point(3.0, 0.0),
		"pause" : Game.DELTAFRAME30 * 4,
		"knockback" : new Point(4,0),
		"stun" : 0.25 * Game.DELTASECOND,
		"movement" : 0.0,
		"audio" : "swing",
		"mesh" : "slash3"
	},
	{	//Charge attack
		"damage":3.0,
		"time" : 1.5*Game.DELTASECOND,
		"wait":1.0*Game.DELTASECOND,
		"animation" : 3,
		"stun" : 0.7 * Game.DELTASECOND,
		"pause" : Game.DELTASECOND * 0.25,
		"force" : new Point(12.0, 0.0),
		"movement" : 0.1,
		"audio" : "swing2",
		"mesh" : "slashc"
		//"airtime" : (warmTime+1.5*baseTime+restTime) * Game.DELTASECOND
	},
	{	//uppercut
		"damage":0.8,
		"time" : 1.5*Game.DELTASECOND,
		"wait":Game.DELTASECOND,
		"animation" : 4,
		"pause" : Game.DELTAFRAME30 * 2,
		"stun" : 0.5 * Game.DELTASECOND,
		"knockback" : new Point(0.0, -8.0),
		"force" : new Point(0, -8.0),
		"movement" : 0.3,
		"audio" : "swing2",
		"mesh" : "slashu"
	},
	{	//duck attack
		"damage":1.2,
		"time" : Game.DELTASECOND,
		"wait": Game.DELTASECOND,
		"animation" : 5,
		"force" : new Point(0.0, 0.0),
		"stun" : 0.3 * Game.DELTASECOND,
		"movement" : 0.0,
		"audio" : "swing",
		"mesh" : "slash3"
	},
	{	//Down stab
		"damage":1.0,
		"time" : Game.DELTASECOND,
		"wait": 0.0,
		"animation" : 6,
		"stun" : 0.7 * Game.DELTASECOND,
		"movement" : 1.0,
		"audio" : "swing",
		"mesh" : "slashd"
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
	constructor(name, speed, missWait, damage, range) {
		this.name = name;
		this.speed = speed;
		this.missWait = missWait;
		this.damage = damage;
		this.range = range;
		
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
			0 : {"standing" : 1, "jumping":1},
			1 : {"standing" : 2}
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
	//name, speed, missWait, damage, range
	"short_sword" : new PlayerWeapon("short sword", 0.25,0.10,1.0,38),
	"long_sword" : new PlayerWeapon("long sword", 0.25,0.2,1.5,48),
	"broad_sword" : new PlayerWeapon("broad_sword", 0.25,0.3,2.0,42),
	"morningstar" : new PlayerWeapon("morning star", 0.45,0.35,2.0,40),
	"bloodsickle" : new PlayerWeapon("blood sickle", 0.25,0.15,0.8,36),
	"burningblade" : new PlayerWeapon("burning blade", 0.25,0.2,0.85,38),
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
