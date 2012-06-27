//// init database components
var mongoose = require('mongoose'); 

console.log('Started database connection, waiting for it to open');

var db_connect_timeout = setTimeout(function() {
  console.log('Failed to connect database!');
  //throw 'Failed to connect database!'
}, 10000);

mongoose.connect('mongodb://127.0.0.1/deldb');
console.log('database ip and port:'+mongoose.connection.host+':'+mongoose.connection.port);


mongoose.connection.on('open', function() {
                console.log('Opened database connection');
                clearTimeout(db_connect_timeout); 
            });
            
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var User = new Schema({
    name      : String
  , email     : String
  , password  : String
  , date      : { type: Date, default: Date.now }
});


var User = mongoose.model('User', User);


/////////////////////////////////////////////////////////



var io = require('socket.io').listen(8000);

io.sockets.on('connection', function (socket) {
   var address = socket.handshake.address;
   console.log("New connection from " + address.address + ":" + address.port);
   
  socket.on('register',function(data) {
    console.log(data);
    var user = new User();
    user.name       = data.name;
    user.email      = data.email;
    user.password   = data.password;
    
    user.save(function (err) {
        if(err){
            console.log(err);
            socket.emit('register_response',{result:err});
        }else{
            console.log('new user registered!');
            socket.emit('register_response',{result:'OK'});
        }
    });
      
  });
  
  socket.on('login', function (data) {
    console.log('user login request.');
    User.findOne({ email: data.email,password: data.password }, function (err, doc){
        if (doc != null){
            socket.emit('login_response',{result:'OK'});
        }
        else{
            socket.emit('login_response',{result:err});
        }
    });
    
  });
});