var fs = require("fs");
var config = {};
var db = { msgs: [] };

function debug(text) {
	if(config.logLevel == "debug")
		bot.say(config.devchan, "DEBUG: " + text);
}

function isAllowed(sender, replyDest, msg) {
	if(!config.debug && sender == msg.to) {
		bot.say(replyDest, sender + " you are wrong and should feel bad for being wrong.");
		return 0;
	}

	for (var i = 0, cnt=0; i < db.msgs.length; i++) {
		var cur = db.msgs[i];
		if(cur.sender == sender) {
			cnt++;
			/* ETOOMANY */
			if(cnt >= 20) {
				bot.say(replyDest, "You talk too much, " + sender + ".");
				return 0;
			}
		}
	}

	return 1;
}

function saveMsg(sender, replyDest, input) {
	var now = new Date();
	var tokens = input.split(" ");

	debug(input);

	if(tokens.length < 2) {
		bot.say(replyDest, "Usage: !tell <nick> <message>");
		return;
	}

	var msg = {
		to: tokens[0],
		chan: replyDest,
		msg: tokens.slice(1).toString().replace(/,/g, " "),
		sender: sender,
		ctime: now.toLocaleString()
	};

	if(!isAllowed(sender, replyDest, msg))
		return;

	debug("ctime:" + msg.ctime + ",to:" + msg.to + ",from:" + msg.sender + ",chan:" + replyDest + ",msg:" + msg.msg);

	for(var i=0, cnt=0; i < db.msgs.length; i++) {
		if(db.msgs[i].sender == msg.sender)
			cnt++;
	}

	if(cnt >= 10)
		return;
	
	db.msgs.push(msg);

	bot.say(replyDest, "OK, " + sender + ", I'll tell " + msg.to + " the next time they talk.");
	storeDB();
}

function storeDB() {
	var file = config.storeDir + "/db";
	var str = JSON.stringify(db, null, 4);
	fs.writeFileSync(file, str);
	console.log("Stored " + db.msgs.length + " entries in " + file);
}

function loadDB() {
	var file = config.storeDir + "/db";
	if(fs.existsSync(file)) {
		db = JSON.parse(fs.readFileSync(file));
		console.log("Loaded " + db.msgs.length + " message(s) from "+ file + ". ");
	}
}

function checkMsgs(speaker, chan) {
	var msgs = [];

	debug(speaker + " spoke on " + chan + ".");

	for (var i = 0; i < db.msgs.length; i++) {
		if(speaker == db.msgs[i].to) {
			msgs.push(db.msgs[i]);
			db.msgs.splice(i, 1);
		}
	}

	if(msgs.length > 0) {
		for (var i = 0; i < msgs.length; i++) {
			bot.say(chan, speaker + ": around " +  msgs[i].ctime + ", " + msgs[i].sender + " left a message for you: " + msgs[i].msg);
		}
		storeDB();
	}
}

function listMsgs() {
	if(db.msgs.length == 0) {
		bot.say(config.devchan, "no messages.");
		return;
	}

	for (var i = 0; i < db.msgs.length; i++) {
		var msg = db.msgs[i];
		bot.say(config.devchan, "ctime:" + msg.ctime + ",to:" + msg.to + ",from:" + msg.sender + ",chan:" + msg.chan + ",msg:" + msg.msg);
	}
}

exports.init = function(conf, b) {
	config = conf;
	bot = b;
	loadDB();
}

exports.check = function(speaker, chan, text, message) {
	var isPM;
	var replyDest;

	if(message.args[0] == config.botName) {
		isPM = true;
		replyDest = message.nick;
	} else {
		isPM = false;
		replyDest = message.args[0];
	}

	if(text.startsWith("!tell"))
		saveMsg(message.nick, replyDest, text.substr(6).trim());

	else if (isPM && text.startsWith("tell "))
		saveMsg(message.nick, replyDest, text.substr(5).trim());
	
	else if(text.startsWith("!tlist") ) {
		if(chan == config.devchan)
			listMsgs();
	}
	else if(text.startsWith("!save") ) {
		storeDB();
		bot.say(chan, "Saved.");
	}
	else if(false == isPM) {
		checkMsgs(speaker, chan);
	}
}
