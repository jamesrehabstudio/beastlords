tilerules.rules["world"] = {
	959:tilerules.ignore,
	960:tilerules.edge_right,
	989:tilerules.ceil_1to0,
	990:tilerules.ceil_0to1,
	991:tilerules.edge_left,
	992:tilerules.ignore,
	1021:tilerules.slope_1to0,
	1022:tilerules.slope_0to1
};

tilerules.rules["default"] = {
	9:tilerules.slope_1tohalf,
	10:tilerules.slope_halfto0,
	11:tilerules.slope_1to0,
	12:tilerules.slope_0to1,
	13:tilerules.slope_0tohalf,
	14:tilerules.slope_halfto1,
	41:tilerules.ignore,
	42:tilerules.ignore,
	43:tilerules.ignore,
	44:tilerules.ignore,
	45:tilerules.ignore,
	47:tilerules.ignore,
	
	73:tilerules.slope_1tohalf,
	74:tilerules.slope_halfto0,
	75:tilerules.slope_1to0,
	76:tilerules.slope_0to1,
	77:tilerules.slope_0tohalf,
	78:tilerules.slope_halfto1,
	105:tilerules.ignore,
	106:tilerules.ignore,
	107:tilerules.ignore,
	108:tilerules.ignore,
	109:tilerules.ignore,
	110:tilerules.ignore,
	
	137:tilerules.slope_1tohalf,
	138:tilerules.slope_halfto0,
	139:tilerules.slope_1to0,
	140:tilerules.slope_0to1,
	141:tilerules.slope_0tohalf,
	142:tilerules.slope_halfto1,
	169:tilerules.ignore,
	170:tilerules.ignore,
	171:tilerules.ignore,
	172:tilerules.ignore,
	173:tilerules.ignore,
	174:tilerules.ignore,
	
	201:tilerules.onewayup,
	202:tilerules.onewayup,
	203:tilerules.onewayup,
	204:tilerules.onewayup,
	205:tilerules.onewayup,
	206:tilerules.onewayup,
	233:tilerules.ignore,
	234:tilerules.ignore,
	235:tilerules.ignore,
	236:tilerules.ignore,
	237:tilerules.ignore,
	238:tilerules.ignore,
	
	905:tilerules.ignore, 906:tilerules.ignore, 907:tilerules.ignore, 
	908:tilerules.ignore, 909:tilerules.ignore, 910:tilerules.ignore, 
	937:tilerules.ceil_1tohalf,
	938:tilerules.ceil_halfto0,
	939:tilerules.ceil_1to0,
	940:tilerules.ceil_0to1,
	941:tilerules.ceil_0tohalf,
	942:tilerules.ceil_halfto1,
	
	1003:tilerules.ceil_1to0,
	1004:tilerules.ceil_0to1,
};

tilerules.rules["gateway"] = mergeLists({
	33:tilerules.ignore, 34:tilerules.ignore, 35:tilerules.ignore, 36:tilerules.ignore,37:tilerules.ignore, 38:tilerules.ignore,
	65:tilerules.ignore, 97:tilerules.ignore, 129:tilerules.ignore, 131:tilerules.ignore, 133:tilerules.ignore,
	161:tilerules.ignore, 193:tilerules.ignore, 225:tilerules.ignore, 
	226:tilerules.ignore, 227:tilerules.ignore, 228:tilerules.ignore, 229:tilerules.ignore, 230:tilerules.ignore,
	968:tilerules.ignore, 136:tilerules.ignore, 39:tilerules.ignore, 40:tilerules.ignore, 
}, tilerules.rules["default"]);

tilerules.rules["firepits"] = mergeLists({
	271:tilerules.ignore, 272:tilerules.ignore,303:tilerules.ignore, 304:tilerules.ignore,
	98:tilerules.ignore, 99:tilerules.ignore,
	225:tilerules.ignore, 226:tilerules.ignore, 227:tilerules.ignore, 228:tilerules.ignore, 229:tilerules.ignore, 230:tilerules.ignore,
	257:tilerules.ignore, 291:tilerules.ignore, 293:tilerules.ignore, 321:tilerules.ignore, 323:tilerules.ignore, 359:tilerules.ceil_1to0, 360:tilerules.ceil_0to1,
	353:tilerules.ignore, 385:tilerules.ignore, 386:tilerules.ignore, 386:tilerules.ignore, 387:tilerules.ignore, 388:tilerules.ignore,
	389:tilerules.ignore, 390:tilerules.ignore, 417:tilerules.ignore, 418:tilerules.ignore, 419:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["temple2"] = mergeLists({
	271:tilerules.ignore, 272:tilerules.ignore,303:tilerules.ignore, 304:tilerules.ignore,
	275:tilerules.ignore, 307:tilerules.ignore, 308:tilerules.ignore, 
	326:tilerules.ignore, 327:tilerules.ignore, 328:tilerules.ignore, 
	358:tilerules.ignore, 390:tilerules.ignore, 422:tilerules.ignore, 
}, tilerules.rules["default"]);

tilerules.rules["temple4"] = mergeLists({
	51:tilerules.onewayup, 52:tilerules.onewayup, 53:tilerules.onewayup,
	83:tilerules.ignore, 84:tilerules.ignore, 85:tilerules.ignore, 86:tilerules.ignore, 87:tilerules.ignore,
	115:tilerules.ignore, 116:tilerules.ignore, 117:tilerules.ignore, 118:tilerules.ignore, 119:tilerules.ignore,
	147:tilerules.ignore, 148:tilerules.ignore, 149:tilerules.ignore, 150:tilerules.ignore, 151:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["town"] = mergeLists({
	39:tilerules.ignore, 40:tilerules.ignore, 136:tilerules.ignore, 321:tilerules.ignore, 326:tilerules.ignore,
	331:tilerules.ignore, 358:tilerules.ignore, 359:tilerules.ignore, 360:tilerules.ignore, 361:tilerules.ignore, 393:tilerules.ignore,
	425:tilerules.ignore, 457:tilerules.ignore, 491:tilerules.ignore, 492:tilerules.ignore
}, tilerules.rules["default"]);

tilerules.rules["lighthouse"] = mergeLists({
	37:tilerules.ignore, 38:tilerules.ignore, 39:tilerules.ignore, 40:tilerules.ignore,
	97:tilerules.ignore, 98:tilerules.ignore, 99:tilerules.ignore
}, tilerules.rules["default"]);