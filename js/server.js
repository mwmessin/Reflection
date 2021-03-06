// Generated by CoffeeScript 1.3.1
(function() {
  var app, io, state;

  app = require("http").createServer(function(req, res) {});

  io = require("socket.io").listen(app);

  app.listen(1337);

  state = "test init";

  io.sockets.on("connection", function(socket) {
    socket.emit("init", {
      state: state
    });
    return socket.on("edit", function(data) {
      socket.broadcast.emit('update', data);
      return console.log(data);
    });
  });

}).call(this);
