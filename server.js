var restify = require('restify');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var uuid = require('node-uuid');
var NodeCache = require( "node-cache" );
var myCache = new NodeCache();
var crypto = require('crypto');

var collection;
var user;

MongoClient.connect("mongodb://localhost:27017/taskmanager", function(err, db) {
  if(!err) {
    collection = db.collection('task');
    user = db.collection('user');
  } else {
    console.log('Error connecting to Mongo');
  }
});

function getTasks(req, res, next) {
  var token = req.headers.authorization.split(" ")[1];

  if (typeof token !== 'undefined' && token !== null && token !== 'null'){
      myCache.get( token, function( err, value ){
        if( !err ){
          if(value === undefined){
            collection.find({$or: [{uid: {$exists: false}},{$and:[{uid: {$exists: true}},{private: false}]}]}).toArray(function(err, items) {
              if(err) { console.error(err) }
                res.json({task:items});
            });
          }else{
            var uid = value.uid;

            collection.find({$or: [{uid:{$exists: false}},{uid:uid}]}).toArray(function(err, items) {
              if(err) { console.error(err) }
                res.json({task:items});
            });
          }
        }
      });
  } else {
    collection.find({$or: [{uid: {$exists: false}},{$and:[{uid: {$exists: true}},{private: false}]}]}).toArray(function(err, items) {
      if(err) { console.error(err) }
        res.json({task:items});
    });
  }
}

function getTask(req, res, next) {
  var task = req.params.id;

  collection.findOne({_id:new mongodb.ObjectID(task)}, function(err, document) {
    if(err) { console.error(err) }
      res.json({task:document});
  });
}

function saveTasks(req, res, next) {
  var task = req.body.task;
  var token = req.headers.authorization.split(" ")[1];

  if (typeof token !== 'undefined' && token !== null && token !== 'null'){
      myCache.get( token, function( err, value ){
      if( !err ){
        if(value === undefined){
            collection.insertOne(task, {w:1}, function(err, result) {
              res.json({task:{_id:result.insertedId}});
            });
        }else{
            task.uid = value.uid; console.log(task);

            collection.insertOne(task, {w:1}, function(err, result) {
              res.json({task:{_id:result.insertedId}});
            });
        }
      }
    });
  } else{
    collection.insertOne(task, {w:1}, function(err, result) {
      res.json({task:{_id:result.insertedId}});
    });
  }
}

function deleteTasks(req, res, next) {
  var task = req.params.id;

  collection.remove({_id:new mongodb.ObjectID(task)}, {w:1}, function(err, result) {
    res.json({});
  });
}

function completeTasks(req, res, next) {
  var task = req.params.id;

  collection.update({_id:new mongodb.ObjectID(task)}, {$set:{completed:true}}, {w:1}, function(err, result) {
    res.json({});
  });
}

function ping(req, res, next) {

}

function createAccount(req, res, next) {
  var un = req.body.username;
  var pw = req.body.password;
  var cpw = req.body.confirmPassword;

  const secret = 'thisischaos';
  const hashpw = crypto.createHmac('sha256', secret).update(pw).digest('hex');

  user.findAndModify(
    { username: un },
    [['_id','asc']],
    {
      $setOnInsert: { un: un, pw: hashpw }
    },
    {new: true,upsert: true},
    function(err, result) {
      if (result.lastErrorObject.updatedExisting) { res.json({err:true}); } else { res.json({err:false}); }
    });
}

function logout(req, res, next) {
  var token = req.headers.authorization.split(" ")[1];

  myCache.del( token, function( err, count ){
    if( !err ){
      res.json({});
    }
  });
}

function login(req, res, next) {
  var un = req.body.username;
  var pw = req.body.password;
  var token = uuid.v4();

  const secret = 'thisischaos';
  const hashpw = crypto.createHmac('sha256', secret).update(pw).digest('hex');

  user.findOne ({un:un, pw:hashpw}, function(err, document) {
    if(err) { console.error(err) }

    if (document !== null){
      var username = document.un;
      var id = document._id;

        myCache.set( token, {username:username, uid:id}, function( err, success ){
        if( !err && success ){
          res.json({token:token, username:username, uid:id});
        }
      });
    } else {
      res.json({token:null});
    }
  });
}

var server = restify.createServer();

restify.CORS.ALLOW_HEADERS.push('authorization');
restify.CORS.ALLOW_HEADERS.push('Accept-Encoding');
restify.CORS.ALLOW_HEADERS.push('Accept-Language');

server.use(restify.CORS({'origins': ['http://localhost:4200']}));
server.use(restify.fullResponse());

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/tasks', getTasks);
server.get('/tasks/:id', getTask);
server.post('/tasks', saveTasks);
server.put('/tasks/:id', completeTasks);
server.del('/tasks/:id', deleteTasks);

server.get('/ping', ping);
server.get('/logout', logout);
server.post('/login', login);
server.post('/create', createAccount);

server.listen(8888, function() {
    console.log('%s listening at %s', server.name, server.url);
});
