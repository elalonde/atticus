// last.js features:
// !last <nick> : report the last message spoken by <nick>, and if
// applicable, how much time has transpired since since <ick> quit.
var fs = require("fs");
var config = {};
var db = { events: [] };
var bot = { };
var msgs = { nicks : [] };

function isOnline(chan, nick) {
	var rv = -1;

	if(!bot.hasOwnProperty("chans"))
		return -1;
	if(!bot.chans.hasOwnProperty("users"))
		return -1;

	var online = bot.chans[chan].users.hasOwnProperty(nick);

	if(online) {
		debug(nick + " is online");
		rv = 1;
	} else {
		debug(nick + " is offline" );
		rv = 0;
	}

	return rv;
}

function fmtTime(time) {
	var days = parseInt(time / 86400);
	var rem = time - (days * 86400);
	var hours = parseInt(rem / 3600);
	rem = rem - (hours * 3600);
	var minutes = parseInt(rem / 60);
	var seconds = rem - (minutes * 60);
	var output = "";
	var concat = "";

	if(days > 0) {
		output += days + (days == 1 ? " day" : " days");
		concat = ", ";
	} if(hours > 0) {
		output += concat + hours + (hours == 1 ? " hour" : " hours");
		concat = ", ";
	} if(minutes > 0) {
		output += concat + minutes + (minutes == 1 ? " minute" : " minutes");
		concat = ", ";
	} if(seconds >= 0) {
		output += concat + seconds + (seconds == 1 ? " second" : " seconds");
	}

	output += " ago.";

	return output;
}

function debug(text) {
	if(config.logLevel == "debug")
		bot.say(config.devchan, "DEBUG: " + text);
}

function lkupEventIdx(nick, event) {
	for(var i =0; i < db.events.length; i++) {
		if(nick == db.events[i].nick &&
		  event.message.command == db.events[i].message.command) {
			return i;
		}
	}

	return -1;
}

function lkupEvent(nick, cmd) {
	var message = { command: cmd };
	var event = { message: message };
	var idx = lkupEventIdx(nick, event);

	if(idx > -1)
		return db.events[idx];

	return null;
}

function insertEvent(nick, event) {
	var file = config.storeDir + "/last.db";
	var idx = lkupEventIdx(nick, event);

	if(idx > -1)
		db.events[idx] = event;
	else
		db.events.push(event);

	debug("Recorded event: " + event.nick + " " + event.message.command + " at " + event.time + " on " + event.channels + ".");
	fs.writeFileSync(file, JSON.stringify(db, null, 4));
}

exports.handleMessage = function(speaker, chan, text, message) {
	var now = new Date();
	var ts = Date.parse(now.toString())/1000;
	var tokens = text.split(" ");
	var event = {};
	var output;
	var dest = chan;
	event.nick = speaker;
	event.time = ts;
	event.channels = [ chan ];
	event.message = message;

	for(var i=0; i < config.bots.length; i++) {
		if(config.bots[i] == speaker)
			return;
	}

	insertEvent(speaker, event);

	// support replying via /msg
	if(message.args[0] == config.botName)
		dest = message.nick;

	if(text.startsWith("!last")) {
		event = null;
		if(tokens.length != 2) {
			bot.say(dest, "Usage: !last <nick>");
			return;
		}
		var nick = tokens[1];

		if(!config.debug && nick == speaker) {
			bot.say(dest, "Try harder, " + nick + ".");
			return;
		}

		if((event = lkupEvent(nick, "PRIVMSG")))
			bot.say(dest, speaker + ": " + nick + " last spoke " +
				fmtTime(ts - event.time) + " Message was: \"" + event.message.args[1] + "\".");

		if(0 == isOnline(dest, nick) && (event = lkupEvent(nick, "QUIT")))
			bot.say(dest, speaker + ": I last saw " + nick + " " +
				fmtTime(ts - event.time) + " Quit message: \"" + event.message.args[0] + "\".");
	}
}

exports.init = function(conf, b) {
	var file = conf.storeDir + "/last.db";
	config = conf;
	bot = b;

	if(fs.existsSync(file)) {
		db = JSON.parse(fs.readFileSync(file));
		console.log("Loaded " + db.events.length + " event(s) from " + file + ". ");
	}
}

exports.handleQuit = function(nick, reason, channels, message) {
	var now = new Date();
	var event = {};
	event.nick = nick;
	event.time = Date.parse(now.toString())/1000;
	event.channels = channels;
	event.message = message;

	insertEvent(nick, event);
}
