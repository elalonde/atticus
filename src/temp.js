// temp.js features:
// !temp : report the current temperatures provided onboard sensors.

var fs = require("fs");
var config = {};
var db = { events: [] };
var bot = { };

exports.init = function(conf, b) {
	var file = conf.storeDir + "/temp.db";
	config = conf;
	bot = b;

	if(fs.existsSync(file)) {
		db = JSON.parse(fs.readFileSync(file));
		console.log("Loaded " + db.events.length + " event(s) from " + file + ". ");
	}
}

exports.handleMessage = function(speaker, chan, text, message) {
	var now = new Date();
	var ts = Date.parse(now.toString())/1000;
	var file = config.storeDir + "/.temperatures.cache";
	var raw;
	var lines;
	var dest = chan;

	// support replying via /msg
	if(message.args[0] == config.botName)
		dest = message.nick;

	if(text.startsWith("!temp")) {
		raw = fs.readFileSync(file);
		lines = raw.toString('utf8').split("\n");
		for(var i=0; i < lines[i].length; i++) {
			var device = lines[i].replace(/^hw\.sensors\.(.*\.temp[0-9]).*/, "$1");
			var temp = parseFloat(lines[i].replace(/.*=(.*) degC.*/, "$1")).toFixed(2);
			var tempF = (temp * 9 / 5 + 30).toFixed(2);
			bot.say(dest, device + ": " + tempF  + " F (" + temp + " C).");
		}
	}
}
