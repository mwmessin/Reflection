@socket = io.connect("http://localhost:1337")

@socket.on "init", (data) ->
	console.log "init", JSON.stringify(data)

@socket.on "update", (data) ->
	
