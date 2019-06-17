var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var ColdNodeInfoSchema = new Schema({
  address: { type: String, unique: true, index: true},
  rewards: {type: Number, default: 0},
  stakeaddress: { type: String },
  stakevalue: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('ColdNodeInfo', ColdNodeInfoSchema);