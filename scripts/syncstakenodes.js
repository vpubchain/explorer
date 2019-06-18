var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , StakeNodeInfo = require('../models/stakenodeinfo.js')
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
    StakeNodeInfo.remove({}, function(err) { 
      lib.get_bitnodes_url('nodes', function(ret){
        var stakingnodes = {data:[]};
        for(var key in ret.nodes) {  
          var arr = ret.nodes[key];
          if(arr[14] == true || arr[16] <= 0)
          {
            continue;
          }
      
          var item = {'address':'','version':'',protocol:0,height:0, 'country': '','city':'','network':'','asns':'','time':'','stakingcoin':''};
          item.address = key;
          item.version = arr[1];
          item.protocol = arr[0];
          item.height = arr[4];
          item.country = arr[21];//json.nodes[key][13].country;
          item.city = arr[20];//json.nodes[key][13].city;
          item.network = arr[12];
          item.asns = arr[11];
          item.time = arr[2];//new Date((arr[2]) * 1000).toLocaleString();
          item.stakingcoin = (arr[16]).toFixed(6);
          stakingnodes.data.push(item);
        }

        function update_stake_address(i)
        {
          if(i == stakingnodes.data.length)
          {
            exit();
            return;
          }
          var stakingnode = stakingnodes.data[i];
          db.update_stake_node_info(stakingnode.address, stakingnode.version,stakingnode.protocol,stakingnode.height,stakingnode.country,stakingnode.city,stakingnode.network,stakingnode.asns, stakingnode.time, stakingnode.stakingcoin, function(){
            //insert_nodes_address(++i);
            ++i;
            update_stake_address(i); 
          }); 
        }
        update_stake_address(0);
      });
    });
  }
});
