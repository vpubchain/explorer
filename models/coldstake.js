var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var ColdStakeNodeSchema = new Schema({
  address: { type: String, unique: true, index: true},
  rewards: {type: Number, default: 0},
}, {id: false});

module.exports = mongoose.model('ColdStakeNode', ColdStakeNodeSchema);