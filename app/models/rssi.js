var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  
var RSSISchema = new Schema({
rssi: { type: Number, default: '' },
ts: { type: Date, default: '' },
//sensor: { type: Schema.ObjectId, ref: 'Sensor' },
visit: { type: Schema.ObjectId, ref: 'Visit' }
})

/**
* Methods
*/

RSSISchema.methods = {
    
}

/**
 * Statics
 */

RSSISchema.static({
  
  /**
  * List articles
  * @param {Object} options
  * @param {Function} cb
  * @api private
  */
  
  list: function(id, cb) {
    console.log("Buscando...");
    console.log(id);
    this.find({ visit: id })
      .sort({ts: -1})
      .limit(3000)
      .exec(cb)
  }
  
})

/**
 * Register
 */

mongoose.model('RSSI', RSSISchema)