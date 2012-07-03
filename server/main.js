////Config Variable
var sil_port = 8000;
var database_url = 'mongodb://127.0.0.1/deldb';
//var sil_port = 80;
//var database_url = 'mongodb://nodejitsu:c0e78e5b3ab649484028fb71a44ff623@staff.mongohq.com:10046/nodejitsudb831935829387';

///////////////////////////////////////////////////////
//// init database components
var mongoose = require('mongoose'); 

console.log('Started database connection, waiting for it to open');
console.log(database_url);

var db_connect_timeout = setTimeout(function() {
  console.log('Failed to connect database!');
  //throw 'Failed to connect database!'
}, 10000);

mongoose.connect(database_url);
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



var io = require('socket.io').listen(sil_port);

io.sockets.on('connection', function (socket) {
  var address = socket.handshake.address;
  var username = null;
  var _id = null;
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
            username = doc.name;
            _id = doc._id
            socket.emit('login_response',{result:'OK',name:doc.name});
        }
        else{
            socket.emit('login_response',{result:err});
        }
    });    
  });
  socket.on('send_chat_msg', function (data) {
     socket.broadcast.emit('broadcast_chat_msg',{name:username,value:data.value});
  });
  
});