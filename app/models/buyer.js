var mongoose = require('mongoose')
  , visit = require('./visit')
  , Schema = mongoose.Schema
  
var BuyerSchema = new Schema({
mac: { type: String, default: '' },
is_ap: { type: Boolean, default: false},
is_con: { type: Boolean, default: false},
})

/**
* Methods
*/

BuyerSchema.methods = {
        
}

/**
 * Statics
 */

BuyerSchema.static({

  get: function(mac, cb) {
    this.findOne({ mac: mac })
        .exec(cb)
  },
  
  fillBuyer: function(buyer, cb) {
    this.findOne({ _id: buyer._id}, function(err, b){
      buyer.data = b;
    })
    .exec(cb)
  }
  
})

/**
 * Register
 */

mongoose.model('Buyer', BuyerSchema)