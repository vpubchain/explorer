var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var ColdNodeInfoSchema = new Schema({
  address: { type: String, unique: true, index: true},
  onlineaddress: { type: String },
  rewards: {type: Number, default: 0},
  stakevalue: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('ColdNodeInfo', ColdNodeInfoSchema);