var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
	console.log('connected');
  socket.emit('news', { hello: 'world' });
  socket.on('login event', function (data) {
    console.log(data);
    if (data.id == 'data' && data.pwd == '1234')
    	socket.emit('login result',{result:'OK'});
  });
});