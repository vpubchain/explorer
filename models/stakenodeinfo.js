var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var StakeNodeInfoSchema = new Schema({
  address: { type: String, unique: true, index: true},
  protocol: {type: Number, default: 0},
  version: { type: String},
  height: {type: Number, default: 0},
  country: { type: String},
  city: { type: String},
  network: { type: String},
  asns: { type: String},
  time: {type: Number, default: 0},
  stakingcoin: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('StakeNodeInfo', StakeNodeInfoSchema);