var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  
var CompanySchema = new Schema({
name: { type: String, default: '' },
cif: { type: String, default: '' },
})

/**
* Methods
*/

CompanySchema.methods = {
        
    /**
    * Add shop
    *
    * @param {Object} shop
    * @param {Function} cb
    * @api private
    */
    
    addShop: function (shop, cb) {
        this.shops.push( shop )
    },
    
    addSensor: function(id_shop, sensor, cb) {
        this.shops.findOne({ id: id_shop }, function(err, shop, sensor) {
            shop.push( sensor )
        })
    }
}

/**
 * Statics
 */

CompanySchema.static({

    /**
     * Find company by id
     *
     * @param {ObjectId} id
     * @param {Function} cb
     * @api private
     */
     
     //FIXME: Quizás deberíamos quitar el populate, ya que para una empresa no vamos a obtener nunca todas las visitas
     load: function (id, cb) {
         this.findOne({ _id: id })
            .exec(cb)
     },
     
     /**
     * List companies
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */
     
     list: function (options, cb) {
         var criteria = options.criteria || {}
         
         this.find(criteria)
            .sort({'name': -1})
            .limit(options.perPage)
            .skip(options.perPage * options.page)
            .exec(cb)
     }

})

/**
 * Register
 */

mongoose.model('Company', CompanySchema)