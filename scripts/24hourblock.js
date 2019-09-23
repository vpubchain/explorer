var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request')
  , fs = require('fs') //文件模块
  , path = require('path') //系统路径模块
  ;

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var fs = require('fs');


var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

var blocksdata = {
    status: "OK",
    data: {"blocks":[],
    "stats": {
        "perversion":{"160":{"BlockVersionDesc":"160","Blocks":0,"BlocksPayed":0,"Amount":0,"BlocksPayedCorrectRatio":0,"BlocksPayedIncorrectRatio":0,"MasternodesPopulation":0,"MasternodesUniqueIPs":0,"EstimatedMNDailyEarnings":0,"RatioBlocksAll":0,"RatioBlocksPayed":0,"RatioBlocksPayedIncorrectRatio":0,"RatioBlocksPayedCorrectRatio":0}},
        "perminer":{},
        "global":{
            "BlocksPayed":0,
            "BlocksPayedToCurrentProtocol":0,
            "BlocksPayedCorrectly":0,
            "SupplyAmount":0,
            "MNPaymentsAmount":0,
            "MaxProtocol":90007,
            "RatioBlocksPayedToCurrentProtocol":0
        },
        "protocoldesc":{"90007":"Phore (1.6.0)"}
        }
    },
    "cache":{"time":1552033203,"fromcache":true},
    "api":{"version":4,"compat":4,"bev":"bk24h=2.0.3"}
};

var blocks24h;
var mnCorrectRatio = 0.99;
var founded = 0;
mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    var tsNow = Math.round(new Date().getTime() / 1000);
    var ts24h = tsNow - (24 * 3600);
    db.get_last_pool_by_time(ts24h, function(blocks24hdata){
        blocks24h = blocks24hdata;
        //console.log(blocks24h);
        
        function doBlocks(i) {
        //lib.syncLoop(blocks24h.length, function (loop) {
            //var i = loop.iteration();
            if(i == blocks24h.length)
            {
                blocksdata.data.stats.global.Blocks = blocksdata.data.blocks.length;
                blocksdata.data.stats.global.RatioBlocksPayed = blocksdata.data.stats.global.BlocksPayed/blocksdata.data.blocks.length;
                blocksdata.data.stats.global.RatioBlocksPayedCorrectly = blocksdata.data.stats.global.BlocksPayedCorrectly/blocksdata.data.blocks.length;
                for(var key in blocksdata.data.stats.perversion){  
                    blocksdata.data.stats.perversion[key].RatioBlocksPayedCorrectRatio = blocksdata.data.stats.perversion[key].BlocksPayedCorrectRatio/blocksdata.data.stats.perversion[key].Blocks; 
                    blocksdata.data.stats.perversion[key].RatioBlocksPayedIncorrectRatio = 1 - blocksdata.data.stats.perversion[key].RatioBlocksPayedCorrectRatio;
                    blocksdata.data.stats.perversion[key].RatioBlocksPayed = blocksdata.data.stats.perversion[key].BlocksPayed/blocksdata.data.stats.perversion[key].Blocks;
                    blocksdata.data.stats.perversion[key].RatioBlocksAll = blocksdata.data.stats.perversion[key].Blocks/blocksdata.data.stats.global.Blocks;
                }
                
                for(var key in blocksdata.data.stats.perminer){  
                    blocksdata.data.stats.perminer[key].RatioMNPayments = blocksdata.data.stats.perminer[key].MasternodeAmount/blocksdata.data.stats.perminer[key].TotalAmount; 
                    blocksdata.data.stats.perminer[key].RatioBlocksFound = blocksdata.data.stats.perminer[key].Blocks/blocksdata.data.blocks.length;
                    blocksdata.data.stats.perminer[key].RatioBlocksPayed = blocksdata.data.stats.perminer[key].BlocksPayed/blocksdata.data.stats.perminer[key].Blocks;
                    blocksdata.data.stats.perminer[key].RatioBlocksPayedToCurrentProtocol = blocksdata.data.stats.perminer[key].BlocksPayedToCurrentProtocol/blocksdata.data.stats.perminer[key].Blocks;
                    blocksdata.data.stats.perminer[key].RatioBlocksPayedCorrectly = blocksdata.data.stats.perminer[key].BlocksPayedCorrectly/blocksdata.data.stats.perminer[key].Blocks;
                }

                console.log("found block count = " + founded);
                
                //把data对象转换为json格式字符串
                var content = JSON.stringify(blocksdata);
                //指定创建目录及文件名称，__dirname为执行当前js文件的目录
                var file = path.join(__dirname, '../public/data/blocks24h-0.json'); 
                //写入文件
                fs.writeFile(file, content, function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log('文件创建成功，地址：' + file + ' i=' + i + ' len=' + blocks24h.length);
                    exit();
                    return;
                });
                
                return;
            }
            
            if(blocks24h[i].total != 0 && blocks24h[i].vout.length > 0)
            {
                var blockdata = {};
                blockdata.BlockMNPayed = 0;
                blockdata.BlockId = blocks24h[i].blockindex;
                blockdata.BlockHash = blocks24h[i].blockhash;
                blockdata.TxId = blocks24h[i].txid;
                blockdata.BlockSupplyValue = blocks24h[i].total/100000000;
                blocksdata.data.stats.global.SupplyAmount = blocksdata.data.stats.global.SupplyAmount + blockdata.BlockSupplyValue;
                blockdata.BlockTime = blocks24h[i].timestamp;
                blockdata.BlockDifficulty = blocks24h[i].difficult;
                blockdata.PoolDescription = null;
                blockdata.BlockMNProtocol = 70006;
                blockdata.BlockMNPayee = "";
                blockdata.BlockMNValueRatioExpected = mnCorrectRatio;
                blockdata.BlockMNValueRatio = 0;
                blockdata.IsSuperBlock = false;
                blockdata.SuperBlockBudgetName = "";
                blockdata.SuperBlockBudgetPayees = 0;
                blockdata.SuperBlockBudgetAmount = 0;
                blockdata.BlockDarkSendTXCount = 0;
                blockdata.MemPoolDarkSendTXCount = 0;
                blockdata.BlockVersion = 160;
                blockdata.BlockMNValue = 0;
                
                var vout = blocks24h[i].vout;
                var voutlen = vout.length;
                {
                    blocksdata.data.stats.global.BlocksPayed = blocksdata.data.stats.global.BlocksPayed + 1;
                    blocksdata.data.stats.global.BlocksPayedToCurrentProtocol = blocksdata.data.stats.global.BlocksPayedToCurrentProtocol + 1;
                    blocksdata.data.stats.global.RatioBlocksPayedToCurrentProtocol = blocksdata.data.stats.global.RatioBlocksPayedToCurrentProtocol + 1;

                    if(blocks24h[i].version == 672)
                    {
                        //pool node is now
                        blockdata.BlockPoolPubKey = vout[vout.length-1].addresses;
                        if(blocksdata.data.stats.perminer.hasOwnProperty(blockdata.BlockPoolPubKey))
                        {
                            blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].Blocks++;
                            blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].BlocksPayed++;
                            blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].BlocksPayedToCurrentProtocol++;
                        
                            blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].TotalAmount = blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].TotalAmount + blockdata.BlockSupplyValue - vout[0].amount/100000000;
                        }
                        else
                        {
                            var perminerData = {"PoolPubKeys":[],
                                "PoolName":"",
                                "Blocks":1,
                                "BlocksPayed":1,
                                "BlocksBudgetPayed":0,
                                "TotalAmount":0,
                                "MasternodeAmount":0,
                                "SuperBlockPoolAmount":0,
                                "BudgetAmount":0,
                                "BlocksPayedToCurrentProtocol":1,
                                "BlocksPayedToOldProtocol":0,
                                "BlocksPayedCorrectly":0,
                                "RatioMNPaymentsExpected":0.99,
                                "RatioMNPayments":0,
                                "RatioBlocksFound":0,
                                "RatioBlocksPayed":0,
                                "RatioBlocksPayedToCurrentProtocol":0,
                                "RatioBlocksPayedToOldProtocol":0,
                                "RatioBlocksPayedCorrectly":0};
                            perminerData.TotalAmount = blockdata.BlockSupplyValue - vout[0].amount/100000000;
                            perminerData.PoolPubKeys.push(blockdata.BlockPoolPubKey);
                            blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey] = perminerData; 
                        }
                    }
                    else
                    {
                        for(var j = 0; j < voutlen; j++)
                        {
                            //pool node is now
                            blockdata.BlockPoolPubKey = vout[j].addresses;
                            
                            if(blocksdata.data.stats.perminer.hasOwnProperty(blockdata.BlockPoolPubKey))
                            {
                                blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].Blocks++;
                                blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].BlocksPayed++;
                                blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].BlocksPayedToCurrentProtocol++;
                        
                                blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].TotalAmount = blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey].TotalAmount + vout[j].amount/100000000;
                            }
                            else
                            {
                                var perminerData = {"PoolPubKeys":[],
                                "PoolName":"",
                                "Blocks":1,
                                "BlocksPayed":1,
                                "BlocksBudgetPayed":0,
                                "TotalAmount":0,
                                "MasternodeAmount":0,
                                "SuperBlockPoolAmount":0,
                                "BudgetAmount":0,
                                "BlocksPayedToCurrentProtocol":1,
                                "BlocksPayedToOldProtocol":0,
                                "BlocksPayedCorrectly":0,
                                "RatioMNPaymentsExpected":0.99,
                                "RatioMNPayments":0,
                                "RatioBlocksFound":0,
                                "RatioBlocksPayed":0,
                                "RatioBlocksPayedToCurrentProtocol":0,
                                "RatioBlocksPayedToOldProtocol":0,
                                "RatioBlocksPayedCorrectly":0};
                                perminerData.TotalAmount = vout[j].amount/100000000;
                                perminerData.PoolPubKeys.push(blockdata.BlockPoolPubKey);
                                blocksdata.data.stats.perminer[blockdata.BlockPoolPubKey] = perminerData; 
                            }
                        }        
                    }

                    if(blocksdata.data.stats.perversion.hasOwnProperty(blockdata.BlockVersion))
                    {
                        blocksdata.data.stats.perversion[blockdata.BlockVersion].EstimatedMNDailyEarnings = blocksdata.data.stats.perversion[blockdata.BlockVersion].EstimatedMNDailyEarnings + 1;
                        blocksdata.data.stats.perversion[blockdata.BlockVersion].Blocks++;
                        blocksdata.data.stats.perversion[blockdata.BlockVersion].BlocksPayed++;
                        blocksdata.data.stats.perversion[blockdata.BlockVersion].BlockVersionDesc = blockdata.BlockVersion;
                        blocksdata.data.stats.perversion[blockdata.BlockVersion].Amount += blockdata.BlockSupplyValue;
                    }
                    else
                    {
                        var blockVersionData = {"BlockVersionDesc":"3",
                            "Blocks":1,
                            "BlocksPayed":1,
                            "Amount":0,
                            "BlocksPayedCorrectRatio":0,
                            "BlocksPayedIncorrectRatio":0,
                            "MasternodesPopulation":0,
                            "MasternodesUniqueIPs":0,
                            "EstimatedMNDailyEarnings":1,
                            "RatioBlocksAll":0,
                            "RatioBlocksPayed":0,
                            "RatioBlocksPayedIncorrectRatio":0,
                            "RatioBlocksPayedCorrectRatio":0};
                        
                        blockVersionData.Amount = blockdata.BlockSupplyValue;   
                        
                            
                        blocksdata.data.stats.perversion[blockdata.BlockVersion] = blockVersionData;    
                    }
                    
                    blocksdata.data.blocks.push(blockdata);
                }
                i++;
                doBlocks(i);
            }
            else
            {
                i++;
                doBlocks(i);
                return;
            }
        }
        var i = 0;
        doBlocks(i);
        
    },function(){
        exit();
    });        
  }
});



