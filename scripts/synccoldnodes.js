var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , ColdNodeInfo = require('../models/coldnodeinfo.js')
  , request = require('request');


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
    exit();
  } else {
    var nodes_data = [];
    ColdNodeInfo.remove({}, function(err) { 
      lib.get_bitnodes_url('coldstakes', function(coldstakes){
        //console.log(coldstakes);
        var coldstakecount = 0;
        for(key in coldstakes)
        {
          coldstakecount++;
        }
        var index = 0;
        db.get_coldstaking_nodes(function(nodes){
          function insert_nodes_address(i)
          {
            if(i == nodes.length)
            {
              for(key in coldstakes)
              {
                if(!coldstakes[key].hascount)
                {
                  var item = {};
                  item.address = key;
                  item.stakeaddress = coldstakes[key].onlineaddress;
                  item.rewards = 0;
                  //item.balance = 0;
                  item.stakevalue = (coldstakes[key].value/100000000).toFixed(6);
                  nodes_data.push(item);
                  db.update_cold_node_info(item.address, item.stakeaddress, item.rewards, item.stakevalue, function(){
                  //insert_nodes_address(++i);  
                  });
                }    
              }
              //res.send({data: nodes_data});
              exit();
              return;
            }

            var item = {};
            item.address = nodes[i].address;
            item.rewards = nodes[i].rewards.toFixed(6);
            stakenode = coldstakes[item.address];
            if(stakenode != undefined)
            {
              //console.log(item.address + stakenode);
              item.stakeaddress = stakenode["onlineaddress"];
              item.stakevalue = (stakenode["value"]/100000000).toFixed(6);
              stakenode.hascount = true;
              //db.update_cold_node_info(item.address, item.stakeaddress, item.rewards, item.stakevalue);
              nodes_data.push(item);
              db.update_cold_node_info(item.address, item.stakeaddress, item.rewards, item.stakevalue, function(){
                insert_nodes_address(++i);  
              });
            }
            else
            {
              db.update_cold_node_info(item.address, 0, item.rewards, 0, function(){
                insert_nodes_address(++i);  
              }); 
            }
          }
          insert_nodes_address(0);
        });
      });
    });
  }
});
