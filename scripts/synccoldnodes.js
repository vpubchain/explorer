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
        db.get_coldstaking_nodes(function(nodes){
          function update_nodes_address(i)
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
                  item.stakevalue = (coldstakes[key].value/100000000).toFixed(6);
                  nodes_data.push(item);
                }    
              }

              function update_cold_node_info2db(j)
              {
                if(j >= nodes_data.length)
                {
                  exit();
                  return;
                }
                var item = nodes_data[j];
                db.update_cold_node_info(item.address, item.stakeaddress, item.rewards, item.stakevalue, function(){
                  update_cold_node_info2db(++j);  
                });
              }

              update_cold_node_info2db(0); 
              return;
            }

            var item = {'address':'', 'rewards':0,'stakeaddress':'','stakevalue':0,'hascount':false};
            item.address = nodes[i].address;
            item.rewards = nodes[i].rewards.toFixed(6);
            stakenode = coldstakes[item.address];
            if(stakenode != undefined)
            {
              //console.log(item.address + stakenode);
              item.stakeaddress = stakenode["onlineaddress"];
              item.stakevalue = (stakenode["value"]/100000000).toFixed(6);
              stakenode.hascount = true;
              nodes_data.push(item);
              update_nodes_address(++i);
            }
            else
            {
              nodes_data.push(item);
              update_nodes_address(++i);
            }
          }
          update_nodes_address(0);
        });
      });
    });
  }
});
