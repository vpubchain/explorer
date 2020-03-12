var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var PeersSchema = new Schema({
  createdAt: { type: Date, expires: 86400, default: Date.now()},
  address: { type: String, default: "" },
  payee: { type: String, default: "" },
  status: { type: String, default: "" },
  protocol: { type: Number, default: 0 },
  daemonversion: { type: String, default: "" },
  sentinelversion: { type: String, default: "" },
  sentinelstate: { type: String, default: "" },
  lastseen: { type: Number, default: 0 },
  activeseconds: { type: Number, default: 0 },
  lastpaidtime: { type: Number, default: 0 },
  lastpaidblock: { type: Number, default: 0 },
  pingretries: { type: Number, default: 0 },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  country: { type: String, default: "" },
  province: { type: String, default: "" },
  city: { type: String, default: "" },
  asn: { type: String, default: "" },
  timeZone: { type: String, default: "" }
});

module.exports = mongoose.model('Peers', PeersSchema);
