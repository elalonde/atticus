// supervisor.js: simple tool hacked together to monitor/reload irc bots.

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str) {
		return this.slice(0, str.length) == str;
	};
}

function loadConfig(cmdArgs) {
	var config = {};
	

	if(fs.existsSync(cmdArgs.configFile)) {
		config = JSON.parse(fs.readFileSync(cmdArgs.configFile));
		console.log("Loaded configuration from " + cmdArgs.configFile);
	} else {
		console.log("No configuration found.");
		process.exit(1);
	}

	config.storeDir = cmdArgs.storeDir;

	return config;
}

function parseArgs(argv) {
	var cmdArgs = {};

	if(argv.hasOwnProperty('d'))
		cmdArgs.storeDir = argv.d;
	else
		cmdArgs.storeDir = process.env.HOME + "/.atticus";
	if(argv.hasOwnProperty('c'))
		cmdArgs.configFile = argv.c;
	else
		cmdArgs.configFile = cmdArgs.storeDir + "/supervisor.conf";

	return cmdArgs;
}

function isOnline(chan, nick) {
	var rv = -1;
	var online = bot.chans[chan].users.hasOwnProperty(nick);

	if(online) {
		console.log(nick + " is online");
		rv = 1;
	} else {
		console.log(nick + " is offline" );
		rv = 0;
	}

	return rv;
}

var argv = require('minimist')(process.argv.slice(2));
var irc = require("irc");
var fs = require("fs");
var cmdArgs = parseArgs(argv);
var config = loadConfig(cmdArgs);
var bot = new irc.Client(config.server, config.botName, config);
var trigger = config.storeDir + "/.reload";

bot.addListener("quit", function(nick, reason, channels, message) {
	if(config.monitored.indexOf(nick) > -1) {
		bot.say(config.devchan, nick + " has quit. Kicking off restart.");
		fs.closeSync(fs.openSync(trigger, 'w'));
	}
});

bot.addListener("join", function(channel, nick, message) {
	if(config.botName == nick) {
		for(var i =0; i < config.monitored.length; i++) {
			if(0 == isOnline(channel, config.monitored[i])) {
				bot.say(config.devchan, config.monitored[i]
					+ " is not online. Kicking off restart.");
				fs.closeSync(fs.openSync(trigger, 'w'));
			}
		}
	}
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

