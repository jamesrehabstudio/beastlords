function QueueManager() {
	this.threads = {};
	this.defaultThread = "default";
}

QueueManager.prototype.push = function( action, thread ) {
	thread = thread || this.defaultThread;
	
	if ( this.threads[thread] == undefined ) {
		this.threads[thread] = new Array();
	}
	
	action.queue = this;
	action.thread = thread;
	
	this.threads[thread].push( action );
}

QueueManager.prototype.update = function( action, thread ) {
	for( var i in this.theads ) {
		if ( this.threads[i] instanceof Array ) {
			var temp_action = this.threads[i][0];
			if ( temp_action instanceof Action ) {
				var complete = temp_action.update();
				if ( complete ) {
					this.threads[i].splice(0,1); 
				}
			}
		}
	}
}

/* ACTION OBJECT FOR QUEUES */

function Action( func, options ) {
	_options = options || {};
	
	this.queue = null;
	this.thread = "";
	this.func = func;
	this.params = _options['params'] || {};
	this.context = _options['context'] || window ;
}

Action.prototype.update = function() {
	return this.func.apply( this.context, this.params )
}