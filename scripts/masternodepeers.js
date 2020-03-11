var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    lib.sendMail(settings.email_receiver, "监管平台系统告警", "mongodb异常，请检查");
    return;
    //exit();
  } else {
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/masternodelist', json: true}, function (error, response, body) {
      if( error || body == "There was an error. Check your console."){
        lib.sendMail(settings.email_receiver, "监管平台系统告警", "种子节点异常，请检查");
        //exit();
        return;
      }  
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        var address = body[i].address.split(':')[0];
        db.find_peer(address, function(peer) {
          if (peer) {
            // peer already exists
            loop.next();
          } else {
            //request('http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=json&ip=' + address, function (error, response, geo) {
            request({uri: 'http://freegeoip.net/json/' + address, json: true}, function (error, response, geo) {
              //if(!error && response.statusCode == 200)
              //{
                //console.log('body=' + response + ' geo=' + geo);
                db.create_peer({
                  address: address,
                  protocol: body[i].protocol,
                  version: body[i].daemonversion.replace('/', '').replace('/', '')//,
                  //country: geo.country
                }, function(){
                  loop.next();
                });
              /*}
              else
              {
                console.log('error!' + address);
                loop.next();
              }*/
            });
          }
        });
      }, function() {
        exit();
      });
    });
  }
});
