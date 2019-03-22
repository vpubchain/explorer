/**
* The Locale Module reads the locale settings and provides
* this information to the other modules
*/

var fs = require("fs");
var jsonminify = require("jsonminify");
var settings = require("./settings");

exports.menu_explorer = "Explorer",
exports.menu_api = "API",
exports.menu_markets = "Markets",
exports.menu_richlist = "Rich List",
exports.menu_reward = "Reward",
exports.menu_movement = "Movement",
exports.menu_node = "Nodes",
exports.menu_network = "Network",
exports.menu_masternodes = "Masternodes",
exports.menu_coininfo = "Coin Info",
exports.menu_governance = "governance",

exports.ex_title = "Block Explorer",
exports.ex_search_title = "Search",
exports.ex_search_button = "Search",
exports.ex_search_message = "You may enter a block height, block hash, tx hash or address.",
exports.ex_search_message_ripple = "You may enter a ledger height, ledger hash, tx hash or address.",
exports.ex_error = "Error!",
exports.ex_warning = "Warning:",
exports.ex_search_error = "Search found no results.",
exports.ex_latest_transactions = "Latest Transactions",
exports.ex_summary = "Block Summary",
exports.ex_supply = "Coin Supply",
exports.ex_block = "Block",
exports.ex_ledger = "Ledger",
exports.tx_title = "Transaction Details",
exports.tx_block_hash = "Block Hash",
exports.tx_ledger_hash = "Ledger Hash",
exports.tx_recipients = "Recipients",
exports.tx_contributors = "Contributor(s)",
exports.tx_hash = "Hash",
exports.tx_address = "Address",
exports.tx_nonstandard = "NONSTANDARD TX",

exports.block_title = "Block Details",
exports.block_previous = "Previous",
exports.block_next = "Next",
exports.block_hash = "block_hash",
exports.block_genesis = "GENESIS",

exports.difficulty = "Difficulty",
exports.masternodes = "Masternodes",
exports.network = "Network",
exports.height = "Height",
exports.timestamp = "Timestamp",
exports.size = "Size",
exports.transactions = "Transactions",
exports.total_sent = "Total Sent",
exports.total_received = "Total Received",
exports.confirmations = "Confirmations",
exports.total = "Total",
exports.bits = "Bits",
exports.nonce = "Nonce",
exports.new_coins = "New Coins",
exports.proof_of_stake = "PoS",
exports.initial_index_alert = "Indexing is currently incomplete, functionality is limited until index is up-to-date.",

exports.a_menu_showing = "Showing",
exports.a_menu_txs = "transactions",
exports.a_menu_all = "All",

exports.rl_received_coins = "Top 100 - Received Coins",
exports.rl_current_balance = "Top 100 - Current Balance",
exports.rl_received = "Received",
exports.rl_balance = "Balance",
exports.rl_coin_supply = "Coin Supply",
exports.rl_wealth = "Wealth Distribution",
exports.rl_top25 = "Top 1-25",
exports.rl_top50 = "Top 26-50",
exports.rl_top75 = "Top 51-75",
exports.rl_top100 = "Top 76-100",
exports.rl_hundredplus = "101+",

exports.net_connections = "Connections",
exports.net_address = "Address",
exports.net_protocol = "Protocol",
exports.net_subversion = "Sub-version",
exports.net_country = "Country",
exports.net_warning = "This is simply a sub sample of the network based on wallets connected to this node.",

exports.mn_address = "地址",
exports.mn_status = "状态",
exports.mn_lastseen = "上一次同步时间",
exports.mn_lastpaid = "上一次交易时间",
exports.mn_ip = "IP",

exports.coininfo_head = "Coin info",
exports.coininfo_basicinfo = "Basic info",


exports.api_title = "API Documentation",
exports.api_message = "The block explorer provides an API allowing users and/or applications to retrieve information from the network without the need for a local wallet.",
exports.api_calls = "API Calls",
exports.api_getnetworkhashps = "Returns the current network hashrate. (hash/s)",
exports.api_getdifficulty = "Returns the current difficulty.",
exports.api_getconnectioncount = "Returns the number of connections the block explorer has to other nodes.",
exports.api_getblockcount = "Returns the number of blocks currently in the block chain.",
exports.api_getblockhash = "Returns the hash of the block at ; index 0 is the genesis block.",
exports.api_getblock = "Returns information about the block with the given hash.",
exports.api_getrawtransaction = "Returns raw transaction representation for given transaction id. decrypt can be set to 0(false) or 1(true).",
exports.api_getmaxmoney = 'Returns the maximum possible money supply.',
exports.api_getmaxvote = 'Returns the maximum allowed vote for the current phase of voting.',
exports.api_getvote = 'Returns the current block reward vote setting.',
exports.api_getphase = 'Returns the current voting phase (\'Mint\', \'Limit\' or \'Sustain\').',
exports.api_getreward = 'Returns the current block reward, which has been decided democratically in the previous round of block reward voting.',
exports.api_getsupply = 'Returns the current money supply.',
exports.api_getnextrewardestimate = 'Returns an estimate for the next block reward based on the current state of decentralized voting.',
exports.api_getnextrewardwhenstr =  'Returns string describing how long until the votes are tallied and the next block reward is computed.',

// Markets view
exports.mkt_hours = "24 hours",
exports.mkt_view_chart = "View 24 hour summary",
exports.mkt_view_summary = "View 24 hour chart",
exports.mkt_no_chart = "Chart data is not available via markets API.",
exports.mkt_high = "High",
exports.mkt_low = "Low",
exports.mkt_volume = "Volume",
exports.mkt_top_bid = "Top Bid",
exports.mkt_top_ask = "Top Ask",
exports.mkt_last = "Last Price",
exports.mkt_yesterday = "Yesterday",
exports.mkt_change = "Change",
exports.mkt_sell_orders = "Sell Orders",
exports.mkt_buy_orders = "Buy Orders",
exports.mkt_price = "Price",
exports.mkt_amount = "Amount",
exports.mkt_total = "Total",
exports.mkt_trade_history = "Trade History",
exports.mkt_type = "Type",
exports.mkt_time_stamp = "Time Stamp",
// Heavy

exports.heavy_vote = "Vote",
    // Heavy rewards view
exports.heavy_title = "Reward/voting information",

exports.heavy_cap = "Coin Cap",
exports.heavy_phase = "Phase",
exports.heavy_maxvote = "Max Vote",
exports.heavy_reward = "Reward",
exports.heavy_current = "Current Reward",
exports.heavy_estnext = "Est. Next",
exports.heavy_changein = "Reward change in approximately",
exports.heavy_key = "Key",
exports.heavy_lastxvotes = "Last 20 votes",

//last 24 hours
exports.perversionlast24h = "Per Version Statistics (last 24h)",
exports.blockversion = "Block Version",

exports.blocknum = "Blocks",
exports.last24blocks = "last 24 hours blocks",
exports.paidblocksratio = "Paid blocks",
exports.allblocks = "All blocks",
exports.paidblocksincorrectratio = "Paid blocks(Incorrectratio)",
exports.paidblockscorrectratio = "Paid blocks(Correctratio)",

exports.miner = "Miner(Pubkey if unknown)",
exports.minerdetail = "miner detail",
exports.blocksfound = "Blocks Found",
exports.foundratio = "Percent Found",
exports.blocksmnpayed = "Blocks MN Payed",
exports.blocksmnpayedratio = "Percent MN Payed",
exports.totalsupply = "Total Supply",
exports.minermnpayment = "MN Payment",
exports.minermnpaymentratio = "MN Payment Ratio",
exports.payedtolastversion = "Payed to latest version",
exports.payedcorrectly = "Payed correctly",
exports.minerstatistics = "Per Miner Statistics (last 24h)";
exports.minernote = "If you are a pool operator and see your pool is not showing green background everywhere below:",
exports.minerproblem = "Problem",
exports.minersolution = "solution";
exports.minernameisred = "Bold red pool name/pubkey";
exports.minerupdatenote = "You need to update";
exports.minerboth = "BOTH";
exports.minerupdate1 = "Your mining software to include masternode payment (it is not complex): ";
exports.minerupdate2 = "Your wallet software to latest version",
exports.minerupdateremark = "Remark: Failing to update BOTH will result in your blocks not been accepted as of next enforcement).",
exports.redbackground = "Red background (Payed to current protocol field)",
exports.redbackgroundnote = "You need to update your dashd wallet software to latest version",
exports.orangebackground = "Orange background (MN Payment ratio field)",
exports.orangebackgroundnote = "You need to update your mining software to include correct masternode payment ratio (it is an easy change)",
exports.yellowbackground = "Yellow background",
exports.yellowbackgroundnote = "Should not be a problem (most probably you fixed one of the previous problems and the page is catching up)",
exports.updatefailedremark = "REMARK",
exports.updatefailedremarknote = "Failing to implement solution described means your blocks will be rejected by the network in the near future (= no payment).",

// masternodes
exports.masternodesstatistics = "Masternodes Statistics",
exports.actives = "Active",
exports.total = "Total",
exports.inactives = "Inactives",
exports.uniqueips = "Unique IPs",
exports.onlatestprotocol = "on latest protocol",
exports.lastdatarefresh = "Last data refresh:",

exports.masterdistributionperreportedversion = "Masternodes Distribution per Reported Version (and Protocol)",
exports.payeeblocktemplatehistory = "Payee Block Template history (Masternode voting consensus)",
exports.consensus = "Consensus",
exports.notinconsensus = "Not in consensus",

exports.localnodes = "Local Nodes",
exports.lastblockhash = "Last block hash",
exports.connections = "Connections",

exports.actualmasternodeversion = "Actual masternode version",
exports.howtoupdate = "How to uddate",
exports.governanceproposalsvotedeadline = "Governance proposals vote deadline",
exports.checkgovernanceproposals = "Check Governance proposals",

exports.masternodeslist = "Maternodes List",
exports.ipport = "IP:Port",
exports.mnstatus = "Status",
exports.mnstatusratio = "(百分比)",
exports.mnportcheck = "Port Check",
exports.mnnextcheck = "Next check",
exports.mnlastpaid = "Last Paid",
exports.mnactiveduration = "Active Duration",
exports.mnlastseen = "Last Seen",

exports.nextsuperblock = "Next Superblock",
exports.nextsuperblockheight = "Next super-block height",
exports.expectedon = "Expected on:",
exports.timeleft = "Time left:",
exports.providing = "Providing:",
exports.unallocated = "Unallocated:",
exports.governanceleft = "left",
exports.governanceproposals = "Governance proposals",
exports.votedeadline = "Vote deadline",
exports.validproposals = "Valid proposals:",
exports.fundedproposals = "Funded proposals:",
exports.fundedamount = "Funded amount:",
exports.budgetproposalsinfo = "Budget proposals info",
exports.budgetproposalsinfo1 = "A governance proposal is valid if the fee was payed and it was submitted to peers successfully.",
exports.budgetproposalsinfo2 = "A governance proposal is funded (will get paid on next super-block if enough funding available in next super-block.",
exports.moreaboutgovernance = "read more about governance and budget system",
exports.budgetproposalsdetail = "Budget Proposals Detail",
exports.dateadded = "Date Added",
exports.proposalname = "提案名",
exports.proposalstart = "Start",
exports.proposalend = "End",
exports.voteyes = "Votes Yes",
exports.voteno = "Votes No",
exports.voteabstain = "Votes abstain",
exports.totalratio = "Total Ratio",
exports.proposalvalid = "Valid",
exports.proposalfunded = "Funded",
exports.expectedsuperblock = "Expected Super Block (Triggers)",
exports.expectedtriggers = "Trigger Hash",
exports.position = "Position",
exports.budgetname = "Budget Name",
exports.budgetpayment = "Budget Payment",
exports.superblockshistory = "Super Blocks History",
exports.paymentamount = "Payment Amount",
exports.paymentaddress = "Payment Address",
exports.loading = "loading",

exports.datefound = "Date Found",
exports.foundby = "Found by",
exports.mnpayment = "MN Payment",
exports.mnpaymentratio = "MNP Ratio Expected/Actual",
exports.mnpayee = "MN Payee",
exports.mnversion = "masternode version",

exports.networkslapshot = "Network Slapshot",
exports.snapshotreachable = "Snapshot of reachable nodes as of",
exports.useragent = "user_agent",
exports.livemap = "live map",
exports.livemapcrawler = "Live map of reachable nodes in the Bitcoin network being crawled by the Bitnodes crawler.",
exports.charts = "Charts",
exports.currectnodes = "Reachable nodes",
exports.averagenodes = "Average",
exports.dayagonodes = "days ago",
exports.agentsnotes = "Chart shows the number of reachable nodes. Individual series can be enabled or disabled from the legend to view the chart for specific networks",
exports.asnsnotes = "Chart shows the distribution of reachable nodes across leading ASNs. Series can be enabled or disabled from the legend to view the chart for specific ASNs.",
exports.countrynotes = "Chart shows the distribution of reachable nodes across leading countries. Series can be enabled or disabled from the legend to view the chart for specific countries.",
exports.networkavailability = "Network availability",
exports.networkavailabilitynotes = "Chart shows the number of reachable nodes as seen by the crawler during the last 24 hours without taking into account the nodes that are already connected to the crawler. Reachable nodes that have reached their max. allowed connections will not be reflected in the chart.",
exports.hours = "hours",
exports.days = "days",
exports.years = "years",

exports.poloniex = "Poloniex",
exports.bittrex = "Bittrex",
exports.bleutrade = "Bleutrade",
exports.yobit = "Yobit",
exports.cryptsy = "Cryptsy",
exports.cryptopia = "Cryptopia",
exports.empoex = "Empoex",
exports.ccex = "C-Cex",

exports.reloadLocale = function reloadLocale(locale) {
  // Discover where the locale file lives
  var localeFilename = locale;
  //console.log(localeFilename);
  localeFilename = "./" + localeFilename;
  //console.log('Loading locale: ' + localeFilename);
  var localeStr;
  try{
    //read the settings sync
    localeStr = fs.readFileSync(localeFilename).toString();
  } catch(e){
    console.warn('Locale file not found. Continuing using defaults!');
  }

  // try to parse the settings
  var lsettings;
  try {
    if(localeStr) {
      localeStr = jsonminify(localeStr).replace(",]","]").replace(",}","}");
      lsettings = JSON.parse(localeStr);
    }
  }catch(e){
    console.error('There was an error processing your locale file: '+e.message);
    process.exit(1);
  }

  //loop trough the settings
  for(var i in lsettings)
  {
    //test if the setting start with a low character
    if(i.charAt(0).search("[a-z]") !== 0)
    {
      console.warn("Settings should start with a low character: '" + i + "'");
    }

    //we know this setting, so we overwrite it
    if(exports[i] !== undefined)
    {
      exports[i] = lsettings[i];
    }
    //this setting is unkown, output a warning and throw it away
    else
    {
      console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
    }
  }

};

// initially load settings
exports.reloadLocale(settings.locale);
