class SFX{
	constructor(name, options){
		this.name = name;
		this.url = options["url"];
		this.loop = options["loop"] || null;
		this.music = options["music"] || false;;
		this.alwaysloaded = options["alwaysloaded"] || false;
		
		this.buffer = false;
		this.isLoaded = false;
		this.playOnLoad = false;
		
		if(this.alwaysloaded){
			this.load();
		}
	}
	load(){
		if( !this.isLoaded ){
			var self = this;
			var request = new XMLHttpRequest();
			request.open("GET", this.url, true);
			request.responseType = "arraybuffer";
			request.uniqueid = this.name;
			request.onload = function(e){ 
				var event = window.event || e;
				var key = event.target.uniqueid;
				AudioPlayer.ctx.decodeAudioData(event.target.response, function(b){ 
					self.loaded(b,key); 
				}
			); }
			request.send();
		}
	}
	loaded(buffer, name){
		this.buffer = buffer;
		this.isLoaded = true;
		
		if(this.playOnLoad){
			if( this.music ){
				window.audio.playAs(this.name, "music");
			} else {
				window.audio.play(this.name);
			}
		}
		//this.list[l]["lastplayed"] = 0;
		//this.list[l]["playcount"] = 0;
	}
	unload(){
		if(!this.alwaysloaded){
			delete this.buffer;			
			this.isLoaded = false;
		}
	}
}
/* Audio player */
class AudioPlayer{
	constructor(){
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		
		this.a = new AudioContext();
		AudioPlayer.ctx = this.a;
		
		this.channels = {}
		this.debug = false;
		
		this.compressor = new DynamicsCompressorNode(this.a);
		//this.compressor.threshold.setValueAtTime(-5, this.a.currentTime);
		this.compressor.threshold.setValueAtTime(-5, this.a.currentTime);
		this.compressor.knee.setValueAtTime(0, this.a.currentTime);
		this.compressor.ratio.setValueAtTime(20, this.a.currentTime);
		this.compressor.attack.setValueAtTime(0.005, this.a.currentTime);
		this.compressor.release.setValueAtTime(0.25, this.a.currentTime);
		//this.compressor.reduction = -10.0;
		
		//this.compressor = new GainNode( this.a );
		
		this.analysis = new AnalyserNode(this.a, {
			fftSize: 2048,
			maxDecibels: -25,
			minDecibels: -60,
			smoothingTimeConstant: 0.5,
		});
		this.audiodebug = new Uint8Array(this.analysis.frequencyBinCount);
		
		this.sfxVolume = new GainNode( this.a ); this.sfxVolume.gain.value = 1.0;
		this.musVolume = new GainNode( this.a ); this.musVolume.gain.value = 0.5;
		
		this.compressor.connect(this.sfxVolume);
		this.sfxVolume.connect(this.analysis);
		this.analysis.connect(this.a.destination);
		
		//this.sfxVolume.connect(this.a.destination);
		this.musVolume.connect(this.a.destination);
	}

	play(l, balance=0.5, gain=1.0){
		if(l in AudioPlayer.list ){
			let sfx = AudioPlayer.list[l];
			
			var sfxinstance = { "name" : l, "sfx" : sfx };
			if( sfx.playOnLoad ) {
				sfxinstance = sfx.playOnLoad;
				sfx.playOnLoad = false;
			}
			
			if( AudioPlayer.list[l].isLoaded ) {
				sfxinstance["source"] = this.a.createBufferSource();
				sfxinstance["source"].buffer = sfx.buffer;
				
				if( sfx.loop != null ) {
					sfxinstance["source"].loop = true;
					sfxinstance["source"].loopStart = sfx.loop;
					sfxinstance["source"].loopEnd = sfx.buffer.length / sfx.buffer.sampleRate;
				}
				
				if( sfx.music ) {
					sfxinstance["source"].connect(this.musVolume);
				} else {
					var volume = this.a.createGain();
					var stereo = audio.a.createStereoPanner();
					volume.gain.value = gain;
					stereo.pan.value = balance;
					
					sfxinstance["source"].connect(volume);
					volume.connect(stereo);
					stereo.connect(this.compressor);
					//this.compressor.connect(this.sfxVolume);
					//this.sfxVolume.connect(this.analysis);
					//this.analysis.connect(this.a.destination);
				}
				
				sfxinstance["source"].start();
				return sfxinstance;
			} else {
				sfx.load();
				sfx.playOnLoad = sfxinstance;
				return sfxinstance;
			}
		} else {
			console.error("Trying to play a sound that does not exist");
		}
	}
	playPan(l,balance,gain){
		return this.play(l, balance, gain);
	}
	playAs(l,n){
		this.stop(n);
		let sfx = this.play(l);
		if(sfx){
			this.channels[n] = sfx;
		}
	}
	stop(l){
		if(l in this.channels){
			if("source" in this.channels[l]){
				this.channels[l]["source"].stop();
			}
			delete this.channels[l];
		}
	}
	stopAs(n){
		this.stop(n);
	}
}
AudioPlayer.list = {}
AudioPlayer.getList = function(list){
	if(!(window.audio instanceof AudioPlayer)){
		window.audio = new AudioPlayer();
	}
	
	for(let i in list){
		AudioPlayer.list[i] = new SFX(i, list[i]);
	}
}