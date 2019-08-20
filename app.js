var express = require('express')
  , path = require('path')
  , bitcoinapi = require('bitcoin-node-api')
  , favicon = require('static-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , settings = require('./lib/settings')
  , routes = require('./routes/index')
  , lib = require('./lib/explorer')
  , db = require('./lib/database')
  , locale = require('./lib/locale')
  , request = require('request');

var app = express();

// bitcoinapi
bitcoinapi.setWalletDetails(settings.wallet);
if (settings.heavy != true) {
  bitcoinapi.setAccess('only', [
    'getinfo',
    'getnetworkhashps',
    'getmininginfo',
    'getdifficulty',
    'getconnectioncount',
    'getblockcount',
    'getblockhash',
    'getblock',
    'getrawtransaction',
    'getpeerinfo',
    'gettxoutsetinfo',
  ]);
} else {
  // enable additional heavy api calls
  /*
    getvote - Returns the current block reward vote setting.
    getmaxvote - Returns the maximum allowed vote for the current phase of voting.
    getphase - Returns the current voting phase ('Mint', 'Limit' or 'Sustain').
    getreward - Returns the current block reward, which has been decided democratically in the previous round of block reward voting.
    getnextrewardestimate - Returns an estimate for the next block reward based on the current state of decentralized voting.
    getnextrewardwhenstr - Returns string describing how long until the votes are tallied and the next block reward is computed.
    getnextrewardwhensec - Same as above, but returns integer seconds.
    getsupply - Returns the current money supply.
    getmaxmoney - Returns the maximum possible money supply.
  */
  bitcoinapi.setAccess('only', ['getinfo', 'getstakinginfo', 'getnetworkhashps', 'getdifficulty', 'getconnectioncount',
    'getblockcount', 'getblockhash', 'getblock', 'getrawtransaction','getmaxmoney', 'getvote',
    'getmaxvote', 'getphase', 'getreward', 'getnextrewardestimate', 'getnextrewardwhenstr',
    'getnextrewardwhensec', 'getsupply', 'gettxoutsetinfo']);
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, settings.favicon)));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const rateLimit = require("express-rate-limit");
 
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);
 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 80000
});
 
// only apply to requests that begin with /api/
app.use("/api/", apiLimiter);
app.use("/ext/", apiLimiter);

// routes
app.use('/api', bitcoinapi.app);
app.use('/', routes);
app.use('/ext/getmoneysupply', function(req,res){
  lib.get_supply(function(supply){
    res.send(' '+supply);
  });
});

app.use('/ext/getaddress/:hash', function(req,res){
  db.get_address(req.param('hash'), function(address){
    if (address) {
      var a_ext = {
        address: address.a_id,
        sent: (address.sent / 100000000),
        received: (address.received / 100000000),
        balance: (address.balance / 100000000).toString().replace(/(^-+)/mg, ''),
        last_txs: address.txs,
      };
      res.send(a_ext);
    } else {
      res.send({ error: 'address not found.', hash: req.param('hash')})
    }
  });
});


app.use('/ext/getbalance/:hash', function(req,res){
  db.get_address(req.param('hash'), function(address){
    if (address) {
      res.send((address.balance / 100000000).toString().replace(/(^-+)/mg, ''));
    } else {
      res.send({ error: 'address not found.', hash: req.param('hash')})
    }
  });
});


app.use('/ext/getdistribution', function(req,res){
  db.get_richlist(settings.coin, function(richlist){
    db.get_stats(settings.coin, function(stats){
      db.get_distribution(richlist, stats, function(dist){
        res.send(dist);
      });
    });
  });
});

app.use('/ext/getlasttxs/:min', function(req,res){
  db.get_last_txs(settings.index.last_txs, (req.params.min * 100000000), function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/getlastrealtxs/:min', function(req,res){
  db.get_last_real_txs(settings.index.last_txs, (req.params.min * 100000000), function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/getlasttxsbytime/:second', function(req,res){
  db.get_last_txs_by_time((req.params.second), function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/getlastpoolbytime/:second', function(req,res){
  db.get_last_pool_by_time((req.params.second), function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/getstakerewards/:hash', function(req,res){
  db.get_cold_node_info_by_address(req.param('hash'), function(ret){
    if (ret.length == 1) {
      res.send(' ' + ret[0].rewards);
    }
    else
    {
      res.send({ error: 'address not found.', hash: req.param('hash')})
    }
  });
});

app.use('/ext/getstakerewardsdetail/:hash', function(req,res){
  var now = parseInt(new Date().getTime()/1000+0.5);
  //console.log('test2' + req.param('hash') + ' time=' + req.query.transactionTime + 'time1=' + req.query.transactionEndTime + "time2=" + now);
  //var transactionTime = Number(0);
  //var transactionEndTime = Number(0);
  if(req.query.begintime == undefined)
  {
    transactionTime = Number(0);
    //console.log("test999");
  }
  else
  {
    transactionTime = Number(req.query.begintime);
    //console.log("test888" + req.query.transactionTime);
  }

  if(req.query.endtime == undefined)
  {
    transactionEndTime = now;
    //console.log("test777");
  }
  else
  {
    transactionEndTime = Number(req.query.endtime);
    //console.log("test666");
  }
  //console.log("time=" + transactionTime + "  endtime=" + transactionEndTime);
  
  db.get_stake_rewards_detail_by_address(req.param('hash'), transactionTime, transactionEndTime, function(rewards){
    if (rewards) {
      db.get_stake_rewards_by_address(req.param('hash'), function(total){
        if(total)
        {
          res.send({ sum: total, detail: rewards});
        }
        else
        {
          res.send({ error: 'address not found.', hash: req.param('hash')});
        }
      });
    }
    else
    {
      res.send({ error: 'address not found.', hash: req.param('hash')});
    }
  });
});

app.use('/ext/gettxs/', function(req,res){
  var second = req.query.second;
  var amount = req.query.amount * 100000000;
  var address = req.query.address;
  address = isNaN(address) || address == '' ? '' : address;
  db.get_bigcharge_txs(second, amount, address, function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/getrealtxsbytime/', function(req,res){
  console.log("getrealtxsbytime");
  var second = req.query.second;
  db.get_real_txs(second, function(txs){
    res.send({data: txs});
  });
});


app.use('/ext/getblockhashbytime/:lte/:gte', function(req,res){
  db.get_blockhash_by_time(req.params.lte, req.params.gte, function(txs){
    var ret = [];
    var retkey = [];
    for(var i = 0; i < txs.length; i++)
    {
      if(txs[i].blockhash in retkey)
      {
        console.log(txs[i].blockhash);
      }
      else
      {
        retkey[txs[i].blockhash] = '1';
        ret.push(txs[i].blockhash);
        //console.log(txs[i].blockhash);
      }
    }
    res.send(ret);
  });
});

app.use('/ext/connections', function(req,res){
  db.get_peers(function(peers){
    res.send({data: peers});
  });
});

app.use('/ext/coldstakingnodes', function(req,res){
  db.get_cold_nodes(function(ret){
    res.send({data:ret});
  });
});


app.use('/ext/getorderedcoldnodes', function(req,res){
  db.get_sorted_cold_nodes(function(ret){
    res.send({data:ret});
  });
});

app.use('/ext/coldstakingnodesnum', function(req,res){
  db.get_coldstaking_nodes_num(function(num){
    res.send({total: num});
  });
});

// locals
app.set('title', settings.title);
app.set('symbol', settings.symbol);
app.set('coin', settings.coin);
app.set('baseType', settings.baseType);
app.set('locale', locale);
app.set('display', settings.display);
app.set('markets', settings.markets);
app.set('twitter', settings.twitter);
app.set('genesis_block', settings.genesis_block);
app.set('index', settings.index);
app.set('heavy', settings.heavy);
app.set('txcount', settings.txcount);
app.set('nethash', settings.nethash);
app.set('nethash_units', settings.nethash_units);
app.set('show_sent_received', settings.show_sent_received);
app.set('logo', settings.logo);
app.set('theme', settings.theme);
app.set('labels', settings.labels);
app.set('ecological_funds_address', settings.ecological_funds_address);
app.set('performance_funds_address', settings.performance_funds_address);
app.set('development_team_fund_address', settings.development_team_fund_address);
app.set('email_sender', settings.email_sender);
app.set('email_receiver', settings.email_receiver);
app.set('email_passwd', settings.email_passwd);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

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

module.exports = app;
