# a simple script to automatically reload node irc bot instances.
#!/bin/sh

# XXX: this is quite racey, needs advisory locking.

pid=
pid=`ps -Ao pid,args |  grep '.*node .*supervisor\.js$' | awk '{print $1}'`
if [ -z $pid ]; then
	cd "$HOME/ws/atticus" 
	/usr/local/bin/node ./tools/supervisor.js 2>&1 >>"$HOME/.atticus/supervisor.log" &
	# if supervisor is reloaded, let the normal process restart atticus.
	exit 0
fi

pid=
pid=`ps -o pid,args |  grep '.*node .*atticus\.js$' | awk '{print $1}'`

if [ -z $pid ] && [ -f "$HOME/.atticus/.reload" ]; then
	cd "$HOME/ws/atticus" 
	rm "$HOME/.atticus/.reload"
	/usr/local/bin/node ./src/atticus.js 2>&1 >>"$HOME/.atticus/atticus.log" &
fi
