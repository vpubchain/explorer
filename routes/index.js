var express = require('express')
  , router = express.Router()
  , settings = require('../lib/settings')
  , locale = require('../lib/locale')
  , db = require('../lib/database')
  , lib = require('../lib/explorer')
  , locations = require('../public/js/country.js')
  , qr = require('qr-image')
  , formatCurrency = require('format-currency')
  , formatNum = require('format-num')
  , BigNumber = require('bignumber.js')
  , BigInteger = require('big-integer')
;

function route_get_block(res, blockhash) {
  lib.get_block(blockhash, function (block) {
    if (block != 'There was an error. Check your console.') {
      if (blockhash == settings.genesis_block) {
        res.render('block', { active: 'block', block: block, confirmations: settings.confirmations, txs: 'GENESIS'});
      } else {
        db.get_txs(block, function(txs) {
          if (txs.length > 0) {
            res.render('block', { active: 'block', block: block, confirmations: settings.confirmations, txs: txs});
          } else {
            db.create_txs(block, function(){
              db.get_txs(block, function(ntxs) {
                if (ntxs.length > 0) {
                  res.render('block', { active: 'block', block: block, confirmations: settings.confirmations, txs: ntxs});
                } else {
                  route_get_index(res, 'Block not found: ' + blockhash);
                }
              });
            });
          }
        });
      }
    } else {
      route_get_index(res, 'Block not found: ' + blockhash);
    }
  });
}
/* GET functions */

function route_get_tx(res, txid) {
  if (txid == settings.genesis_tx) {
    route_get_block(res, settings.genesis_block);
  } else {
    db.get_tx(txid, function(tx) {
      if (tx) {
        lib.get_blockcount(function(blockcount) {
          res.render('tx', { active: 'tx', tx: tx, confirmations: settings.confirmations, blockcount: blockcount});
        });
      }
      else {
        lib.get_rawtransaction(txid, function(rtx) {
          if (rtx.txid) {
            lib.prepare_vin(rtx, function(vin) {
              lib.prepare_vout(rtx.vout, rtx.txid, vin, function(rvout, rvin) {
                lib.calculate_total(rvout, function(total){
                  if(rtx.version == 672)
                  {
                    total = total - rvin[0].amount;  
                  }
                  if (!rtx.confirmations > 0) {
                    var utx = {
                      txid: rtx.txid,
                      vin: rvin,
                      vout: rvout,
                      total: total.toFixed(6),
                      timestamp: rtx.time,
                      blockhash: '-',
                      blockindex: -1,
                    };
                    res.render('tx', { active: 'tx', tx: utx, confirmations: settings.confirmations, blockcount:-1});
                  } else {
                    var utx = {
                      txid: rtx.txid,
                      vin: rvin,
                      vout: rvout,
                      total: total.toFixed(6),
                      timestamp: rtx.time,
                      blockhash: rtx.blockhash,
                      blockindex: rtx.blockheight,
                    };
                    lib.get_blockcount(function(blockcount) {
                      res.render('tx', { active: 'tx', tx: utx, confirmations: settings.confirmations, blockcount: blockcount});
                    });
                  }
                });
              });
            });
          } else {
            route_get_index(res, null);
          }
        });
      }
    });
  }
}

function route_get_index(res, error) {
  res.render('index', { active: 'home', error: error, warning: null});
}

function route_get_address(res, hash, count) {
  db.get_address(hash, function(address) {
    if (address) {
      var txs = [];
      var hashes = address.txs.reverse();
      if (address.txs.length < count) {
        count = address.txs.length;
      }
      lib.syncLoop(count, function (loop) {
        var i = loop.iteration();
        db.get_tx(hashes[i].addresses, function(tx) {
          if (tx) {
            txs.push(tx);
            loop.next();
          } else {
            loop.next();
          }
        });
      }, function(){

        // hack to support numbers longer than 15 digits.
        var balance = new BigInteger(address.balance);
        var viewBalance = balance.divide(100000000);
        var balanceRemain = (new BigNumber(balance.toString().substr(
          viewBalance.toString().length))/100).toFixed(0);

        res.render('address', {
          active: 'address',
          address: address,
          balance: viewBalance.toString()+'.'+balanceRemain.toString(),
          txs: txs
        });
      });

    } else {
      route_get_index(res, hash + ' not found');
    }
  });
}

/* GET home page. */
router.get('/', function(req, res) {
  route_get_index(res, null);
});

router.get('/info', function(req, res) {
  res.render('info', { active: 'info', address: settings.address, hashes: settings.api });
});

router.get('/markets/:market', function(req, res) {
  var market = req.params['market'];
  if (settings.markets.enabled.indexOf(market) != -1) {
    db.get_market(market, function(data) {
      /*if (market === 'bittrex') {
        data = JSON.parse(data);
      }*/
      console.log(data);
      res.render('./markets/' + market, {
        active: 'markets',
        marketdata: {
          coin: settings.markets.coin,
          exchange: settings.markets.exchange,
          data: data,
        },
        market: market
      });
    });
  } else {
    route_get_index(res, null);
  }
});


router.get('/masternodes', function(req, res) {
  res.render('masternodes', {active: 'masternodes'});
});

router.get('/governance', function(req, res) {
  res.render('governance', {active: 'governance'});
});


router.get('/movement', function(req, res) {
  res.render('movement', {active: 'movement', flaga: settings.movement.low_flag, flagb: settings.movement.high_flag, min_amount:settings.movement.min_amount});
});


// router.get('/network', function(req, res) {
//   lib.get_bitnodes_url('nodes', function(ret){
//     var user_agent_list_data = [];
//     var country_list_data = [];
//     var network_list_data = [];
//     var location_city = {};
//     console.log('length=' + ret.agents.length);
//     for(var i = 0; i < ret.agents.length; i++)
//     {
//       for(var key in ret.agents[i])
//       {
//         var data = {'user_agent':'','nodes':''};
//         data.user_agent = key;
//         data.nodes = ret.agents[i][key];
//         user_agent_list_data.push(data);
//       }
//     }

//     for(var j = 0; j < ret.countrys.length; j++)
//     {
//       for(var key in ret.countrys[j])
//       {
//         var data = {'county':'','nodes':''};
//         //data.country = country_data[key];
//         data.country = key;
//         data.nodes = ret.countrys[j][key];
//         country_list_data.push(data);
//       }
//     }
    
//     for(var k = 0; k < ret.networks.length; k++)
//     {
//       for(var key in ret.networks[k])
//       {
//         var data = {'network':'','nodes':''};
//         data.network = key;
//         data.nodes = ret.networks[k][key];
//         network_list_data.push(data);
//       }
//     }
// /*
//     for(var key in ret.nodes)
//     {
//       var location_key = ret.nodes[key][8] + '' + ret.nodes[key][9] + '';
//       if(!location_city.hasOwnProperty(location_key))
//       {
//         lib.get_location(ret.nodes[key][8], ret.nodes[key][9], function(location_ret){
//           console.log("x=" + ret.nodes[key][8] + " y=" + ret.nodes[key][9] + " city=" + location_ret.result.addressComponent.city + "key=", location_key);
//           location_city[location_key] = location_ret.result.addressComponent.city;
//         });
//       }
//     }*/

//     var snapshot_localtime = (new Date((ret.timestamp) * 1000)).toLocaleString();
    
//     console.log('snapshot_localtime=' + snapshot_localtime + ret.timestamp);
    
//     res.render('network', {
//                         active: 'network',
//                         bitnodeslist: ret,
//                         useragentlist: user_agent_list_data,
//                         country_list: country_list_data,
//                         network_list: network_list_data,
//                         location_city_list: location_city,
//                         snapshotlocaltime: snapshot_localtime
//                         });
//   });
// });

router.get('/nodes', function(req, res) {
  res.render('nodes', {active: 'nodes'});
});

router.get('/charts', function(req, res) {
  var params_days = req.query.days;
  params_days = isNaN(params_days) || params_days == 0 ? 1 : params_days;
  console.log('params_days' + params_days);
  res.render('charts', {
                        active: 'charts',
                        days: params_days
                      });
});

router.get('/live-map', function(req, res) {
  res.render('live-map', {active: 'live-map'});
});

router.get('/map', function(req, res) {
  var symbolCount = 0;
  res.render('map', {active: 'map',
                    symbolcount: symbolCount});
});

router.get('/reward', function(req, res){
  //db.get_stats(settings.coin, function (stats) {
    console.log(stats);
    db.get_heavy(settings.coin, function (heavy) {
      //heavy = heavy;
      var votes = heavy.votes;
      votes.sort(function (a,b) {
        if (a.count < b.count) {
          return -1;
        } else if (a.count > b.count) {
          return 1;
        } else {
         return 0;
        }
      });

      res.render('reward', { active: 'reward', stats: stats, heavy: heavy, votes: heavy.votes });
    });
  //});
});

//监控平台网络节点页面
// router.get('/bitcoin/api/nodes', function(req, res) {
//   lib.get_bitnodes_url('nodes', function(ret){
//     res.send(ret);
//   });
// });

router.get('/ext/getnodesnum', function(req, res) {
  db.find_peer_count(function(ret){
      res.send(ret);
  });
});

// router.get('/ext/getnodesinfo', function(req, res) {
//   var page = req.query.page;
//   var pagesize = req.query.pagesize;

//   if(undefined == page){
//     page = 1;
//   }
//   if(undefined == pagesize){
//     pagesize = 10;
//   }
//   url = 'nodesinfo?page=' + page + '&pagesize=' + pagesize;
//   lib.get_bitnodes_url(url, function(ret){
//     res.send(ret);
//   });
// });


router.get('/ext/getnodesinfobyip', function(req, res) {
  var ip = req.query.ip;
  if(undefined == ip){
    res.send({'error':'ip is not defined!'});
    return;
  }
  db.find_peer(ip,peer => {
    res.send(peer)
  })
});

router.get('/ext/getmininginfo', function(req, res) {
  db.get_mining_info(function(ret){
    res.send(ret);
  });
});

router.get('/ext/getminingsrewards', function(req, res) {
  var page = req.query.page;
  var pagesize = req.query.pagesize;

  if(undefined == page){
    page = 1;
  }
  if(undefined == pagesize){
    pagesize = 10;
  }
  
  db.get_mining_address(page, pagesize, function(ret){
    for(var i = 0; i < ret.length; i++)
    {
      ret[i].rewards = ret[i].rewards/100000000;
    }
    res.send(ret);
  });
});


router.get('/ext/getminingrewards', function(req, res) {
  var page = req.query.page;
  var pagesize = req.query.pagesize;

  if(undefined == page){
    page = 1;
  }
  if(undefined == pagesize){
    pagesize = 10;
  }
  
  db.get_mining_address(page, pagesize, function(ret){
    for(var i = 0; i < ret.length; i++)
    {
      ret[i].rewards = ret[i].rewards/100000000;
    }
    res.send(ret);
  });
});

router.get('/ext/getminingsrewardsnum', function(req, res) {
  db.get_mining_rewards_num(function(ret){
    res.send({num:ret});
  });
});

router.get('/ext/getminingrewardsnum', function(req, res) {
  db.get_mining_rewards_num(function(ret){
    res.send({num:ret});
  });
});

router.get('/ext/getminingrewardsbyaddress', function(req, res) {
  var hash = req.query.address;
  db.get_address(hash, function(address) {
    if (address) {
      res.send({rewards:address.rewards/100000000});
    } else {
      res.send({'error':hash + ' not found'});
    }
  });
});

router.get('/ext/getminingrewardsdetail', function(req, res) {
  db.get_address(hash, function(address) {
    if (address) {
      var txs = [];
      var hashes = address.txs.reverse();
      if (address.txs.length < count) {
        count = address.txs.length;
      }
      lib.syncLoop(count, function (loop) {
        var i = loop.iteration();
        if(hashes[i].iscoinbase == true) {
          db.get_tx(hashes[i].addresses, function(tx) {
            if (tx) {
              txs.push(tx);
              loop.next();
            } else {
              loop.next();
            }
          });
        }
      }, function(){

        // hack to support numbers longer than 15 digits.
        var balance = new BigInteger(address.balance);
        var viewBalance = balance.divide(100000000);
        var balanceRemain = (new BigNumber(balance.toString().substr(
          viewBalance.toString().length))/100).toFixed(0);

        res.send({
          active: 'address',
          address: address,
          balance: viewBalance.toString()+'.'+balanceRemain.toString(),
          txs: txs
        });
      });

    } else {
      res.send(hash + ' not found');
    }
  });
});

router.get('/ext/getcoldstakingnodes', function(req, res) {
  //console.log('/bitcoin/api/dashboard');
  var address = req.query.address;
  var stakeaddress = req.query.stakeaddress;
  params_address = isNaN(address) ? null : address;
  var page = req.query.page;
  var pagesize = req.query.pagesize;
  if(address != undefined)
  {
    db.get_cold_node_info_by_address(address, function(ret){
      res.send({data:ret});
    });
  }
  else if(stakeaddress != undefined)
  {
    db.get_cold_node_info_by_stakeaddress(stakeaddress, function(ret){
      res.send({data:ret});
    });
  }
  else if(page != undefined)
  {
    params_pagesize = isNaN(pagesize) || pagesize == 0 ? 10 : pagesize;
    db.get_cold_nodes_by_pages(page, params_pagesize, function(ret){
      res.send({data:ret});
    });
  }
  else
  {
    db.get_cold_nodes(function(ret){
      res.send({data:ret});
    });  
  }
});

router.get('/ext/getstakingnodes', function(req, res) {
  //console.log('/bitcoin/api/dashboard');
  var address = req.query.address;
  params_address = isNaN(address) ? null : address;
  var page = req.query.page;
  var pagesize = req.query.pagesize;
  if(address != undefined)
  {
    db.get_stake_node_info_by_address(address, function(ret){
      res.send({data:ret});
    });
  }
  else if(page != undefined)
  {
    params_pagesize = isNaN(pagesize) || pagesize == 0 ? 10 : pagesize;
    db.get_stake_nodes_by_pages(page, params_pagesize, function(ret){
      res.send({data:ret});
    });
  }
  else
  {
    db.get_stake_nodes(function(ret){
      res.send({data:ret});
    });  
  }
});

router.get('/ext/getblockrewardsperday', function(req, res) {
  db.get_sorted_block_rewards_perday(function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getblockrewardscountperhour', function(req, res) {
  db.get_sorted_block_rewards_perhour(function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getblocksupply', function(req, res) {
  //console.log("getblockrewards");
  var starttime = req.query.starttime;
  var endtime = req.query.endtime;
  db.get_block_supply(starttime, endtime, function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getperformancesupply', function(req, res) {
  //console.log("getblockrewards");
  var starttime = req.query.starttime;
  var endtime = req.query.endtime;
  db.get_performance_supply(starttime, endtime, function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getsupplybytime', function(req, res) {
  //console.log("getblockrewards");
  var starttime = req.query.starttime;
  var endtime = req.query.endtime;
  db.get_block_supply(starttime, endtime, function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getsupplybyblockindex', function(req, res) {
  //console.log("getblockrewards");
  var starttime = req.query.startindex;
  var endtime = req.query.endindex;
  db.get_block_supply_by_blockindex(starttime, endtime, function(ret){
    res.send({data:ret});
  });
});

router.get('/ext/getcoldstakingnodeslist', function(req, res) {
  db.get_cold_nodes_list(function(ret){
    res.send({data:ret});
  });  
});

router.get('/ext/stakingnodes', function(req, res) {
  db.get_stake_nodes(function(ret){
    res.send({data:ret});
  });
  /*console.log('/bitcoin/api/stakingnodes');
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
    res.send(stakingnodes);
  });*/
});

router.get('/bitcoin/api/dashboard', function(req, res) {
  //console.log('/bitcoin/api/dashboard');
  var params_days = req.query.days;
  params_days = isNaN(params_days) || params_days == 0 ? 1 : params_days;
  lib.get_bitnodes_dashborad_url('dashboard', params_days, function(ret){
    res.send(ret);
  });
});

router.get('/bitcoin/api/vpubboard', function(req, res) {
  //console.log('/bitcoin/api/vpubboard');
  var params_days = req.query.days;
  params_days = isNaN(params_days) || params_days == 0 ? 1 : params_days;
  lib.get_bitnodes_vpubborad_url('vpubboard', params_days, function(ret){
    res.send(ret);
  });
});

// router.get('/bitcoin/api/snapshots', function(req, res) {
//   console.log('/bitcoin/api/snapshots');
//   lib.get_bitnodes_url('snapshots', function(ret){
//     res.send(ret);
//   });
// });

// router.get('/bitcoin/api/leaderboard', function(req, res) {
//   console.log('/bitcoin/api/leaderboard');
//   lib.get_bitnodes_url('leaderboard', function(ret){
//     res.send(ret);
//   });
// });

router.get('/getlocation/:x/:y', function(req, res) {
  //console.log('/bitcoin/api/leaderboard');
  lib.get_location(req.param('x'), req.param('y') , function(ret){
    res.send(ret);
  });
});

router.get('/addnode/:address', function(req, res) {
  var address = req.params['address'];
  console.log(address);
  lib.addnode(address, function(ret){
    res.send(ret);
  });
});

router.get('/tx/:txid', function(req, res) {
  route_get_tx(res, req.param('txid'));
});

router.get('/block/:hash', function(req, res) {
  route_get_block(res, req.param('hash'));
});

router.get('/address/:hash', function(req, res) {
  route_get_address(res, req.param('hash'), 1000);
});

router.get('/address/:hash/:count', function(req, res) {
  route_get_address(res, req.param('hash'), req.param('count'));
});

router.post('/search', function(req, res) {
  var query = req.body.search;
  if (query.length === 64) {
    if (query === settings.genesis_tx) {
      res.redirect('/block/' + settings.genesis_block);
    } else {
      db.get_tx(query, function(tx) {
        if (tx) {
          res.redirect('/tx/' +tx.txid);
        } else {
          lib.get_block(query, function(block) {
            if (block && block !== 'There was an error. Check your console.') {
              res.redirect('/block/' + query);
            } else {
              route_get_index(res, locale.ex_search_error + query );
            }
          });
        }
      });
    }
  } else {
    db.get_address(query, function(address) {
      if (address) {
        res.redirect('/address/' + address.a_id);
      } else {
        lib.get_blockhash(query, function(hash) {
          if (hash && hash !== 'There was an error. Check your console.') {
            res.redirect('/block/' + hash);
          } else {
            route_get_index(res, locale.ex_search_error + query );
          }
        });
      }
    });
  }
});

router.get('/qr/:string', function(req, res) {
  if (req.param('string')) {
    var address = qr.image(req.param('string'), {
      type: 'png',
      size: 4,
      margin: 1,
      ec_level: 'M'
    });
    res.type('png');
    address.pipe(res);
  }
});

router.get('/ext/summary', function(req, res) {
  lib.get_difficulty(function(difficulty) {
    difficultyHybrid = ''
    if (difficulty['proof-of-work']) {
            if (settings.index.difficulty == 'Hybrid') {
              difficultyHybrid = 'POS: ' + difficulty['proof-of-stake'];
              difficulty = 'POW: ' + difficulty['proof-of-work'];
            } else if (settings.index.difficulty == 'POW') {
              difficulty = difficulty['proof-of-work'];
            } else {
        difficulty = difficulty['proof-of-stake'];
        difficulty = difficulty.toFixed(6);
      }
    }
    
    lib.get_hashrate(function(hashrate) {
      lib.get_connectioncount(function(connections){
        lib.get_blockcount(function(blockcount) {
          //lib.get_masternodecount(function(masternodecount){
            //lib.get_masternodeonlinecount(function(masternodeonlinecount){
              // db.get_cmc(settings.coinmarketcap.ticker, function(cmc){
                db.get_stats(settings.coin, function (stats) {
                  if (hashrate == 'There was an error. Check your console.') {
                    hashrate = 0;
                  }
                  db.get_address(settings.ecological_funds_address, function(ef_address){
                    //console.log("settings.ecological_funds_address=", settings.ecological_funds_address);
                    if (ef_address) {
                      ef_balance = (ef_address.balance / 100000000).toString().replace(/(^-+)/mg, '');
                    } else {
                      ef_balance = 0;
                    }
                    db.get_address(settings.performance_funds_address, function(pf_address){
                      if (pf_address) {
                        pf_balance = (pf_address.balance / 100000000).toString().replace(/(^-+)/mg, '');
                      } else {
                        pf_balance = 0;
                      }
                      db.get_address(settings.development_team_fund_address, function(df_address) {
                        if (df_address) {
                          df_balance = (df_address.balance / 100000000).toString().replace(/(^-+)/mg, '');
                        } else {
                          df_balance = 0;
                        }
                        db.get_address(settings.pension_fund_address, function(pe_address) {
                          if(pe_address) {
                            pe_balance = (pe_address.balance / 100000000).toString().replace(/(^-+)/mg, '');
                          } else {
                            pe_balance = 0;
                          }
                          db.get_address(settings.destroy_fund_address, function(de_address) {
                            if(de_address) {
                              de_balance = (de_address.balance / 100000000).toString().replace(/(^-+)/mg, '');
                            } else {
                              de_balance = 0;
                            }
                            
                            res.send({ data: [{
                              difficulty: formatNum(difficulty ,{ maxFraction: 6 }),
                              difficultyHybrid: formatNum(difficultyHybrid ,{ maxFraction: 6 }),
                              //masternodeCount: masternodecount,
                              //masternodeOnlineCount: masternodeonlinecount,
                              supply: formatNum(stats.supply, { maxFraction: 6 }),
                              hashrate: hashrate,
                              lastPriceBtc: formatNum(stats.last_price, { maxFraction: 6 }),
                              // lastPriceUsd: formatCurrency(cmc.price_usd, { maxFraction: 6 }),
                              // marketCapUsd: formatCurrency(cmc.market_cap_usd, { maxFraction: 6 }),
                              // marketVolumeUsd: formatCurrency(cmc.volume_24h_usd, { maxFraction: 6 }),
                              connections: connections,
                              blockcount: blockcount,
                              // cmc: cmc,
                              ef_balance: formatCurrency(ef_balance, { maxFraction: 6 }),
                              pf_balance: formatCurrency(pf_balance, { maxFraction: 6 }),
                              df_balance: formatCurrency(df_balance, { maxFraction: 6 }),
                              pe_balance: formatCurrency(pe_balance, { maxFraction: 6 }),
                              de_balance: formatCurrency(de_balance, { maxFraction: 6 }),
                            }]});

                          });
                        });
                      });
                    });
                  });
                });
              // });
            //});
          //});
        });
      });
    });
  });
});

router.get('/ext/masternodes', function(req, res) {
  lib.get_masternodelist(function(list) {
    var mnList = [];

    for (var key in list) {
      if (settings.baseType === 'pivx')
      {
        var mn = list[key];
        var mnItem = {
          address: mn.addr,
          status: mn.status,
          lastseen: mn.lastseen,
          lastpaid: mn.lastpaid,
          ip: mn.ip,
//          ip: ""
        };
        mnList.push(mnItem);

        continue;
      }

      if (list.hasOwnProperty(key)) {
        var mnData = list[key].split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
        var mnItem = {
          address: "",
          status: "",
          lastseen: "",
          lastpaid: null,
          ip: "",
        };

        // Address
        if (settings.masternodes.list_format.address === 0)
          mnItem.address = key;
        else if (settings.masternodes.list_format.address > -1)
          mnItem.address = mnData[settings.masternodes.list_format.address - 1];

        // Status
        if (settings.masternodes.list_format.status > -1)
          mnItem.status = mnData[settings.masternodes.list_format.status - 1];

        // last seen
        if (settings.masternodes.list_format.lastseen > -1)
          mnItem.lastseen = mnData[settings.masternodes.list_format.lastseen - 1];

        // last paid
        if (settings.masternodes.list_format.lastpaid > -1)
          mnItem.lastpaid = mnData[settings.masternodes.list_format.lastpaid - 1];

        // IP
	//console.log('/ext/masternodes ip = ' + mnData[settings.masternodes.list_format.ip - 1]);
	//mnItem.ip = mnData[settings.masternodes.list_format.ip - 1];
        if (settings.masternodes.list_format.ip === 0)
          mnItem.ip = key.trim().replace(':'+settings.masternodes.default_port, '');
        else if (settings.masternodes.list_format.ip > -1)
          mnItem.ip = mnData[settings.masternodes.list_format.ip - 1].trim().replace(':'+settings.masternodes.default_port, '');
	//console.log('/ext/masternodes ip = ' + mnItem.ip);
        mnList.push(mnItem);
      }
    }

    res.send({ data: mnList });
  });
});

router.get('/ext/coindetails', function(req, res) {
  lib.get_blockcount(function(blockcount) {
    lib.get_masternodecount(function(masternodecount){
      lib.get_masternodeonlinecount(function(masternodeonlinecount){
        // db.get_cmc(settings.coinmarketcap.ticker, function(cmc){
          db.get_stats(settings.coin, function (stats) {
            db.get_latest_masternodestats(settings.symbol, function(mnStats) {
              var blocks_24h = (24*3600)/settings.coininfo.block_time_sec;

              var data = {
                coin_name: settings.coin,
                symbol: settings.symbol,
                logo: settings.logo,
                mobile_app_v: 1,
                supply: stats.supply,
                last_price_btc: stats.last_price,
                // last_price_usd: cmc.price_usd,
                // market_cap_usd: cmc.market_cap_usd,
                // market_volume_24h_usd: cmc.volume_24h_usd,
                // price_perc_change_1h: cmc.percent_change_1h,
                // price_perc_change_24h: cmc.percent_change_24h,
                // price_perc_change_7d: cmc.percent_change_7d,
                // price_last_updated: cmc.last_updated,
                block_count_24h: (24*3600) / settings.coininfo.block_time_sec,
                block_time: settings.coininfo.block_time_sec,
                masternode_count_total: masternodecount,
                masternode_count_enabled: masternodeonlinecount,
                masternode_required_coins: settings.coininfo.masternode_required,
                masternode_coin_rewards_24h: (blocks_24h * settings.coininfo.block_reward_mn)/masternodeonlinecount,
                block_mn_reward: settings.coininfo.block_reward_mn,
                info_links: settings.coininfo.basic_info_links,
                calculations_bases_on_real_data: false
              };

              if (mnStats) {
                data.calculations_bases_on_real_data = true;
                data.masternode_coin_rewards_24h = mnStats.reward_coins_24h;
                data.block_count_24h = mnStats.block_count_24h;
                data.block_time = mnStats.block_avg_time;
              }

              res.send(data);
            });
          });
        // });
      });
    });
  });
});

module.exports = router;
