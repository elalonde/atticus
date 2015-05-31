atticus
====

atticus is an irc bot written in node.js. It's primary purpose is to record and report temperatures of its home in an attic, and for the author to become better acquainted with node.js. atticus is in early development.

Features
========
* !tell \<nick\> \<message\><br /> 
  Record a message for \<nick\>. Messages are delivered when the user speaks in a channel monitored by atticus. Messages are stored persistently until delivered.
* !last \<nick\><br />
  Display the last statement made by \<nick\>. If \<nick\> is not online, the time elapsed since user quit is also printed.
* !temp<br />
  Display current temperature sensor readings for those which report via sysctl(8).

All features may also be accessed privately by messaging the bot directly.

Installation
==========
``` sh
npm install minimist irc
git clone https://github.com/elalonde/atticus
```

Usage
====
node atticus.js \<options\>
* -d \<storage dir\> # default: $HOME/.atticus
* -c \<config file\> # default: $HOME/.atticus/atticus.conf

atticus.conf default settings
====
``` json
{
    "logLevel": "info",
    "debug": false,
    "devchan": "#test",
    "channels": [ "#test" ],
    "server": "irc.efnet.org",
    "botName": "atticus",
    "port": 6667,
    "realName": "atticus",
    "userName": "atticus"
}
