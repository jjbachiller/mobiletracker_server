var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  
var ShopSchema = new Schema({
name: { type: String, deafult: ''},
addr: { type: String, default: ''},
phone: { type: String, default: ''},
sensors: [{
            sec: { type: String, default: '' },
         }],
company: { type: Schema.ObjectId, ref: 'Company' }
})

/**
* Validations
*/

/**
* Methods
*/

ShopSchema.methods = {
    
    /**
    * Add sensor
    *
    * @param {Object} images
    * @param {Function} cb
    * @api private
    */
    
    addSensor: function (cb) {
        var sec = this.createSecret();
        
        this.sensors.push({
            sec: sec
        })
        
        this.save(cb);
    },
    
    
    /**
    * Genera el secret de un sensor
    *
    * @return {String}
    * @api public
    */
    
    createSecret: function () {
      var secret = 'poooo'
      var salt = Math.round((new Date().valueOf() * Math.random())) + 'teslita' 
      try {
        secret =  crypto.createHmac('sha1', salt).update(secret).digest('hex')
        return secret
      } catch (err) {
        return ''
      }
    }    
    
}

/**
* Statics
*/

ShopSchema.statics = {
    
    /**
    * Find shop by id
    *
    * @param {ObjectId} id
    * @param {Function} cb
    * @api private
    */
    
    load: function (id, cb) {
        this.findOne({ _id: id })
            .populate('company', 'name cif')
            .exec(cb)
    },
    
    
    /**
    * List shops
    *
    * @param {Object} options
    * @param {Function} cb
    * @api private
    */
    
    list: function (options, cb) {
        var criteria = options.criteria || {}
        
        this.find(criteria)
            .sort({ 'name': -1 })
            .limit(options.perPage)
            .skip(options.perPage * options.page)
            .exec(cb)
    },
    
    loadSensor: function (shop_id, sensor_secret, cb) {
        this.findOne({ _id: shop_id, sensors: { $elemMatch: { sec : sensor_secret } } } )
          .exec(cb)
    }
}

mongoose.model('Shop', ShopSchema)