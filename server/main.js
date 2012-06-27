var mongoose = require('mongoose'); 
console.log('Started database connection, waiting for it to open');

var db_connect_timeout = setTimeout(function() {
  console.log('Failed to connect database!');
  //throw 'Failed to connect database!'
}, 10000);

mongoose.connect('mongodb://127.0.0.1/my_database');
console.log(mongoose.connection.host);
console.log(mongoose.connection.port);

 mongoose.connection.on('open', function() {
                console.log('Opened connection');
                clearTimeout(db_connect_timeout); 
            });
            
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var Comments = new Schema({
    title     : String
  , body      : String
  , date      : Date
});

var BlogPost = new Schema({
    author    : ObjectId
  , title     : String
  , body      : String
  , date      : Date
  , comments  : [Comments]
  , meta      : {
        votes : Number
      , favs  : Number
    }
  , count     : Number
});

var BlogPost = mongoose.model('BlogPost', BlogPost);

/* push new one
var post = new BlogPost();
post.title='asdf';
post.count= 23;
// create a comment
post.comments.push({ title: 'My comment' });

post.save(function (err) {
  if(err){
      throw err;
      console.log(err);
  }else{
      console.log('saved!');
  }
});
*/
/* update one
BlogPost.findOne({ title: 'asdf' }, function (err, doc){
  doc.title = 'jason borne';
  doc.count += 1;
  doc.save();
});
*/

/* delete one
BlogPost.findOne({ count: 23 }, function (err, doc){
  doc.remove();
});
*/

/* Traverse all the results
BlogPost.find({}, function (err, docs) {
  // docs.forEach
  docs.forEach(function(doc){console.log(doc)});
});
*/
///////////
var io = require('socket.io').listen(8000);

io.sockets.on('connection', function (socket) {
  console.log('connected');
  socket.on('register',function(data) {
    console.log(data);
    socket.emit('register_response',{result:'OK'});
  
  });
  socket.on('login', function (data) {
    console.log(data);
    socket.emit('login_response',{result:'OK'});
  });
});