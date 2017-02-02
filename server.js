var restify = require('restify');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var uuid = require('node-uuid');
var NodeCache = require( "node-cache" );
var myCache = new NodeCache();
var crypto = require('crypto');

var taskCol;
var user;
var group;

MongoClient.connect("mongodb://localhost:27017/taskmanager", function(err, db) {
  if(!err) {
    taskCol = db.collection('task');
    user = db.collection('user');
    group = db.collection('group');
  } else {
    console.log('Error connecting to Mongo');
  }
});

function getGroups(req, res, next) {
    var token = req.headers.authorization.split(" ")[1];

    if (typeof token !== 'undefined' && token !== null && token !== 'null'){
        myCache.get( token, function( err, value ){
            if( !err ){
                if(value === undefined){
                    group.find({$or: [{uid: {$exists: false}},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
                        if(err) { console.error(err) }
                        res.json({group:items});
                    });
                }else{
                    var uid = value.uid;

                    group.find({$or: [{uid:{$exists: false}},{uid:new mongodb.ObjectID(uid)},{uid: null},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
                        if(err) { console.error(err) }
                        res.json({group:items});
                    });
                }
            }
        });
    } else {
        group.find({$or: [{uid: {$exists: false}},{uid: null},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
            if(err) { console.error(err) }
            res.json({group:items});
        });
    }
}

function getGroupTasks(req, res, next) {
    var qparam = req.params.id;
    taskCol.find({ groups: { $in: [ qparam ] } }).toArray(function(err, items) {
        if(err) { console.error(err) }

        res.json({groupTask:items});
    });
}

function getGroup(req, res, next) {
    var groupId = req.params.id;

    group.find({}).toArray(function(err, items) {
        if(err) { console.error(err) }
        res.json({group:items});
    });
}

function getTasks(req, res, next) {
  var token = req.headers.authorization.split(" ")[1];

  if (typeof token !== 'undefined' && token !== null && token !== 'null'){
      myCache.get( token, function( err, value ){
        if( !err ){
          if(value === undefined){
              taskCol.find({$or: [{uid: {$exists: false}},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
              if(err) { console.error(err) }
                res.json({task:items});
            });
          }else{
            var uid = value.uid;

              taskCol.find({$or: [{uid:{$exists: false}},{uid:new mongodb.ObjectID(uid)},{uid: null},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
              if(err) { console.error(err) }
                res.json({task:items});
            });
          }
        }
      });
  } else {
      taskCol.find({$or: [{uid: {$exists: false}},{uid: null},{$and:[{uid: {$exists: true}},{private: false}]}]}).sort({'_id': 1}).toArray(function(err, items) {
      if(err) { console.error(err) }
        res.json({task:items});
    });
  }
}

function getTask(req, res, next) {
  var task = req.params.id;

    taskCol.findOne({_id:new mongodb.ObjectID(task)}, function(err, document) {
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
            taskCol.insertOne(task, {w:1}, function(err, result) {
              res.json({task:{_id:result.insertedId}});
            });
        }else{
            task.uid = value.uid;

            taskCol.insertOne(task, {w:1}, function(err, result) {
              res.json({task:{_id:result.insertedId}});
            });
        }
      }
    });
  } else{
      taskCol.insertOne(task, {w:1}, function(err, result) {
      res.json({task:{_id:result.insertedId}});
    });
  }
}

function saveGroups(req, res, next) {
  var groupData = req.body.group;
  var token = req.headers.authorization.split(" ")[1];

  if (typeof token !== 'undefined' && token !== null && token !== 'null'){
      myCache.get( token, function( err, value ){
      if( !err ){
        if(value === undefined){
            group.insertOne(groupData, {w:1}, function(err, result) {
              res.json({group:{_id:result.insertedId}});
            });
        }else{
            groupData.uid = value.uid;

            group.insertOne(groupData, {w:1}, function(err, result) {
              res.json({group:{_id:result.insertedId}});
            });
        }
      }
    });
  } else{
      group.insertOne(groupData, {w:1}, function(err, result) {
      res.json({group:{_id:result.insertedId}});
    });
  }
}

function deleteTasks(req, res, next) {
  var task = req.params.id;

    taskCol.remove({_id:new mongodb.ObjectID(task)}, {w:1}, function(err, result) {
    res.json({});
  });
}

function deleteGroup(req, res, next) {
  var groupId = req.params.id;

    group.remove({_id:new mongodb.ObjectID(groupId)}, {w:1}, function(err, result) {
    res.json({});
  });
}

function completeTasks(req, res, next) {
  var task = req.params.id;

    taskCol.update({_id:new mongodb.ObjectID(task)}, {$set:{completed:true}}, {w:1}, function(err, result) {
    res.json({task:{_id:task}});
  });
}

function ping(req, res, next) {
    var token = req.headers.authorization.split(" ")[1];
    myCache.get( token, function( err, value ){
      if( !err ){
        if(value === undefined){
          res.json({token:null});
        }else{
          res.json({token:token, username:value.username, uid:value.uid});
        }
      }
    });
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

function saveComments(req, res, next){
  var token = req.headers.authorization.split(" ")[1];

  if (typeof token !== 'undefined' && token !== null && token !== 'null'){
    myCache.get( token, function( err, value ){
      if( !err ){
        if(value === undefined){
          res.json({err:true});
        }else{
          var uid = value.uid;
          var username = value.username;
          var createdDate = req.body.comment.createdDate;
          var message = req.body.comment.message;
          var taskId = req.body.comment.task;
          var cid = uuid.v4();

          var comment = {
            cid:cid,
            uid:uid,
            username:username,
            createdDate:createdDate,
            message:message
          };

            taskCol.update({_id:new mongodb.ObjectID(taskId)}, { $push: { comments: comment }}, {w:1}, function(err, result) {
            res.json({comment:{cid:cid}});
          });
        }
      }
    });
  } else {
    res.json({err:true});
  }
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
server.post('/comments', saveComments);
server.put('/tasks/:id', completeTasks);
server.del('/tasks/:id', deleteTasks);
server.get('/groups', getGroups);
server.get('/groups/:id', getGroup);
server.post('/groups', saveGroups);
server.get('/groupTasks', getGroupTasks);
server.del('/groups/:id', deleteGroup);

server.get('/ping', ping);
server.get('/logout', logout);
server.post('/login', login);
server.post('/create', createAccount);

server.listen(8888, function() {
    console.log('%s listening at %s', server.name, server.url);
});
