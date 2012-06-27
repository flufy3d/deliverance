////Config Variable
//var database_url = 'mongodb://127.0.0.1/deldb';

var database_url = 'mongodb://nodejitsu:c0e78e5b3ab649484028fb71a44ff623@staff.mongohq.com:10046/nodejitsudb831935829387';

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

User.find({}, function (err, docs) {
  // docs.forEach
  docs.forEach(function(doc){console.log(doc)});
});

/////////////////////////////////////////////////////////
