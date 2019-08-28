var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var BlockRewardsPerDaySchema = new Schema({
  timepoint: { type: Number, unique: true, index: true},
  rewards: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('BlockRewardsPerDay', BlockRewardsPerDaySchema);