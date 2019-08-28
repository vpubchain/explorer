var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var BlockRewardsPerHourSchema = new Schema({
  timepoint: { type: Number, unique: true, index: true},
  rewards: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('BlockRewardsPerHour', BlockRewardsPerHourSchema);