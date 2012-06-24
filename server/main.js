var io = require('socket.io').listen(8000);

io.sockets.on('connection', function (socket) {
	console.log('connected');
  socket.emit('news', { hello: 'world' });
  socket.on('register',function(data) {
    console.log(data);
    socket.emit('register_response',{result:'OK'});
  
  });
  socket.on('login', function (data) {
    console.log(data);
    socket.emit('login_response',{result:'OK'});
  });
});