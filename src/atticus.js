// atticus.js - an attic dweller
var argv = require('minimist')(process.argv.slice(2));
var irc = require("irc");
var fs = require("fs");
var tell = require("./tell.js");

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
		console.log("No configuration found. Loading defaults...");
		config.logLevel = "info";
		config.debug = false;
		config.devchan	= "#test";
		config.channels = ["#test"];
		config.server = "irc.efnet.org";
		config.botName =  "atticus";
		config.port = 6667;
		config.realName =  "atticus";
		config.userName = 'atticus';
		console.log(config);
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
		cmdArgs.configFile = cmdArgs.storeDir + "/atticus.conf";

	return cmdArgs;
}

function main() {
	var cmdArgs = parseArgs(argv);
	var config = loadConfig(cmdArgs);
	var bot = new irc.Client(config.server, config.botName, config);

	tell.init(config, bot);

	bot.addListener("message", function(speaker, chan, text, message) {
		tell.check(speaker, chan, text, message);
	});

	bot.addListener('error', function(message) {
		console.log('error: ', message);
	});
}

main();
