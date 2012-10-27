app = require("http").createServer (req, res) ->
io = require("socket.io").listen(app)

app.listen 1337

state = "test init"

io.sockets.on "connection", (socket) ->
	socket.emit "init", state: state

	socket.on "edit", (data) ->
		socket.broadcast.emit 'update', data
		console.log data
