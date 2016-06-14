var express = require('express');
var socket_io    = require( "socket.io" );
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


//var eu = require('./routes/eu');


// Express
var app          = express();

// Socket.io
var io           = socket_io();
app.io           = io;

var routes = require('./routes/index');
//var holy16 = require('./routes/holy16')(io);
var eu = require('./routes/eu')(io);
var eus = require('./routes/eus')(io);
//var network = require('./routes/network')(io);
var users = require('./routes/users');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static('public'));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/eu', eu);
app.use('/eus', eus);
//app.use('/holy16', holy16);
//app.use('/net', network);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var Twitter = require('twitter');
//var tweettools = require('./tools/TweetToNeo');
var counter = 0;




var client = new Twitter({
  consumer_key: 'hhZTif85m9t7Q9aqEUSRxdSwI',
  consumer_secret: 'vnqq3G2hG887KZyeLa0wXkmN19Bn4N8a3CGAf16MBN8TVBeEcQ',
  access_token_key: '14812487-BzawCSPGaNdrJvoa1VrtJ3DbMFgr7nMiAV3x21rzX',
  access_token_secret: 'JqfvcFqBTMYS5RbFeTJ0ai37BEd1QRTZ7npe14bB06TZo',
});

const COLLECTION = 'euref';
//console.log(consumer_key +" : "+ consumer_secret +" : "+ access_token_key +" : "+ z)
/**
 * Stream statuses filtered by keyword
 * number of tweets per second depends on topic popularity
 **/

 // Add a connect listener
io.on('connection', function(socket) {

    console.log('Client connected.');

    // Disconnect listener
    socket.on('disconnect', function() {
        console.log('Client disconnected.');
    });
});

client.stream('statuses/filter', {track: 'eureferendum,euref,brexit,no2eu,notoeu,betteroffout,voteout,britainout,leaveeu,voteleave,beleave,leaveeu,yes2eu,yestoeu,betteroffin,votein,ukineu,bremain,strongerin,leadnotleave,voteremain'},  function(stream){

  stream.on('data', function(tweet) {
    //tweettools.processTweet(tweet, io);
    var geodata;
    var tweettext = tweet.text.toLowerCase();
    if(tweetSearch(tweettext, remainTags)){
      io.emit('tweet', {tweet:tweet.user.name, vote : 'stay' });
      if(tweet.geo !=null){
        data = { cord : tweet.geo.coordinates , ineu : 'true' };
        io.emit('eugeo', data);
      }
      //stayc++;
    }
    if(tweetSearch(tweettext, leaveTags)){
      io.emit('tweet', {tweet:tweet.user.name, vote : 'leave' });
      if(tweet.geo !=null){
        data = { cord : tweet.geo.coordinates , outeu : 'true' };
        io.emit('eugeo', data);
        }
      //leavec++;
    }

    MongoClient.connect(mongoURL, function(err, db) {
      assert.equal(null, err);
      //add tweet to mongo
      insertDocument(db,tweet, function() {
        //incrementout totals
        incrementCount(db,tweet,function(){
          //emit all the stats and close
          emitStatsCount(db,tweet,function(){
            db.close();
          });
        });
      });




    });
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});
const leaveTags = ['brexit','no2eu','notoeu','betteroffout','voteout','britainout','leaveeu','voteleave','beleave'];
const remainTags = ['bremain','yes2eu','yestoeu','betteroffin','votein','ukineu','strongerin','leadnotleave','voteremain'];


var tweetSearch = function(string, strings){
  for(var i=0; i<strings.length;i++) {
      if(string.indexOf(strings[i])>0){
        //console.log(entry);
        return true;
      }
      return false;
    };
}

var insertDocument = function(db, newtweet, callback) {
    db.collection(COLLECTION).insertOne( newtweet, function(err, result) {
      assert.equal(err, null);
      //console.log("Inserted a document into the tweets collection.");
      callback();
    });
};

var incrementCount = function(db,tweet,callback) {
  var countin=0;
  var countout =0;
    var tweettext = tweet.text.toLowerCase();
    if(tweetSearch(tweettext, leaveTags)){
      countout=1;
    }
    if(tweetSearch(tweettext, remainTags)){
      countin=1;
    }
    db.collection('eucounts').update({},{$inc:{"count.in":countin, "count.out":countout}},function(err, result){
      //console.log("counting");
      assert.equal(err, null);
      counter ++;
      if((counter % 10000) == 0){
        console.log(counter);
      }
      emitCount(db,function(){
        callback();
      });
    });
}
var emitCount = function(db,callback){
  db.collection('eucounts').find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    var inoutcount = docs[0];
    //console.log("emiting.");
    io.emit('status',
    {
      incount: inoutcount.in,
      outcount: inoutcount.out
    });
    callback();
  });
}

var emitStatsCount = function(db,tweet,callback){
  db.collection(COLLECTION).count(function(err, count){
    assert.equal(err, null);
    io.emit('welcome',
    {
      count: count,
      tweet: tweet.text,
      time: tweet.created_at,
      message: '<p>Currently '+count+' tweets tracked</p>'+
             '<p>Last Tweet :'+tweet.text+'</p>'+
             '<p>@'+tweet.created_at+'</p>'
    });
    callback();
  });
}


module.exports = app;
