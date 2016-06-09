/**
 * Created by John on 21/07/2015.
 */
//loads in tweets in Marcos format.

var http = require('http').globalAgent.maxSockets = Infinity;;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/tweets';
var fs  = require("fs"),
    request = require("request"),
    prompt = require('prompt');

    const leaveTags = ['brexit','no2eu','notoeu','betteroffout','voteout','britainout','leaveeu','voteleave','beleave'];
    const remainTags = ['bremain','yes2eu','yestoeu','betteroffin','votein','ukineu','strongerin','leadnotleave','voteremain'];


const PORT=4040;
var itemsProcessed = 0;
var total =0;
var queryData;
//const COLLECTION = 'holyrood16';
const COLLECTION = 'euref';


startstream();

function startstream(){
  console.log("starting Mongo Stream");
  MongoClient.connect(mongoURL, function(err, db) {
    assert.equal(null, err);
    // if(queryData){
    //   if(queryData.page =="stream"){
    //     console.log("starting stream");
        findTweetsStream(db);
    //   }
    //   else if(queryData.page =="data"){
    //     console.log("starting stats");
    //     showStats(db);
    //   }
    // }
  });
}
var tweetSearch = function(string, strings){
  for(var i=0; i<strings.length;i++) {
      if(string.indexOf(strings[i])>0){
        //console.log(entry);
        return true;
      }
      return false;
    };
}

var findTweetsStream = function(db, callback,res) {
  var cursor =db.collection(COLLECTION).find();
  //var cursor =db.collection(COLLECTION).find();
  // var html = '<h2> Results '+queryData.search+' </h2>';
  var counter=0;


  cursor.on('data',
    function(tweet) {
      var countin=0;
      var countout =0

      if(tweet!=null && tweet.text!=null){
        var tweettext = tweet.text.toLowerCase();
        if(tweetSearch(tweettext, leaveTags)){
          countout=1;
        }
        if(tweetSearch(tweettext, remainTags)){
          countin=1;
        }
        db.collection('eucounts').update({},{$inc:{"count.in":countin},$inc:{"count.out":countout},  },function(err, result){
          //assert.equal(err, null);
          //console.log("In");
        });
      }
      counter ++;
      if((counter % 10000) == 0){
        console.log(counter);
      }
    }
  );

  cursor.once('end', function() {
    db.close();
  });
}
