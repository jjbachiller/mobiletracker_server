const BOUNCE_TIME = 360000;//Tiempo límite en milisegundos para considerar rebote en una visita.

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , moment = require('moment')  

require('./buyer')

var schemaOptions = {
    toObject: {
      virtuals: true
    }
    ,toJSON: {
      virtuals: true
    }
  };
    
var VisitSchema = new Schema({
into: { type: Boolean, default: '' },
start_date: { type: Date, default: '', index: true },
end_date: { type: Date, default: '', index: true },
v: { type: Number, default: 0},
shop: { type: Schema.ObjectId, ref: 'Shop' },
buyer: { type: Schema.ObjectId, ref: 'Buyer' }
}, schemaOptions)

/**
* Virtuals
*/

VisitSchema
  .virtual('duration')
  .get(function() { 
    var milisecs = (this.end_date - this.start_date)
    var duration = moment.duration(milisecs)
    //return milisecs
    return  duration.humanize()
  })
  
VisitSchema
  .virtual('from')
  .get(function() {
    return moment(this.start_date).format("hh:mm:ss a");
  })

VisitSchema
  .virtual('to')
  .get(function() {
    return moment(this.end_date).format("hh:mm:ss a");
  })
  
/**
* Internal use functions (map-reduce,...)
*/

/**
* Initialize a visit as an item for the dashboard
*
* @param {Object} visit
* @api private
*/
/*
var initialVisit = function(visit) {
  total = 0
  interior = 0
  bounce = 0;  
  exterior = 0
  int_duration = 0
  ext_duration = 0
}
*/
var initialVisit = {
  total: 0,
  interior: 0,
  bounce: 0,
  exterior: 0,
  int_duration: 0,
  ext_duration: 0,
  average_bounce: 0,
  average_int_duration: 0,
  average_ext_duration: 0,
}

/**
* Add the current visit info to the visit item
*
* @param {Object} visit
* @param {Object} prev
* @api private
*/

var reduceVisit = function(visit, prev) {
  var duration = (visit.end_date - visit.start_date)
  
  prev.total++
  if (visit.into) {//Visita interior
    prev.interior++
    prev.int_duration += duration
    if (duration < 360000)
      prev.bounce++
  } else {//Visita exterior
    prev.exterior++
    prev.ext_duration += duration
  }
}

/**
* Calculate average info
*
* @param {Object} visit
* @api private
*/

var finalizerVisit = function(visit) {
  visit.average_bounce = (visit.bounce / visit.interior) * 100;
  visit.average_int_duration = Math.round((visit.int_duration / visit.interior) / 1000);
  visit.average_ext_duration = Math.round((visit.ext_duration / visit.exterior) / 1000);
 
  //visit.unit = new Date(visit.unit).toString('dd/MM/yyyy')
}

/**
* Group visit info by Month
*
* @param {Object} visit
* @api private
*/
var keyfGroupVisitByMonth = function(visit) {
  var month = new Date(visit.start_date);
  month.setDate(1);
  month.setHours(0,0,0,0)
  return { unit: month.getTime() }
  //return { unit: month.getDate() + '/' + month.getMonth() + '/' + month.getFullYear()  }
}

/**
* Group visit info by Week
*
* @param {Object} visit
* @api private
*/
var keyfGroupVisitByWeek = function(visit) {
  var start_str = "#start#";
  var end_str = "#end#";
  var start = new Date(start_str);
  var end = new Date(end_str);
  var visit_date = new Date(visit.start_date);
  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);
  var end_week = new Date(start.getTime());
  end_week.setDate(end_week.getDate()+6);
  end_week.setHours(23,59,59,999);
  while (visit_date.getTime() > end_week.getTime() ) {
    start = new Date(end_week.getTime());
    start.setDate(start.getDate()+1)
    start.setHours(0,0,0,0);    
    end_week = new Date(start.getTime());
    end_week.setDate(end_week.getDate()+6);
    end_week.setHours(23,59,59,999);    
  }
  //Si estamos en la última semana y la fecha final es anterior a la de la última semana, la acabamos en la fecha final
//  if (end_week.getTime() > end.getTime()) {
//    end_week = new Date(end.getTime());
//  }
//  return { unit: start.getDate() + '/' + (start.getMonth()+1) + '/' + start.getFullYear() + ' - ' + end_week.getDate() + '/' + (end_week.getMonth()+1) + '/' + end_week.getFullYear()  }
  return { unit: start.getTime() }
}

/**
* Group visit info by Day
*
* @param {Object} visit
* @api private
*/
var keyfGroupVisitByDay = function(visit) {
  var day = new Date(visit.start_date);
  day.setHours(0,0,0,0)
  return { unit: day.getTime() }
//  return { unit: day.getDate() + '/' + day.getMonth() + '/' + day.getFullYear()  }
}

/**
* Group visit info by Hour
*
* @param {Object} visit
* @api private
*/
var keyfGroupVisitByHour = function(visit) {
  var hour = new Date(visit.start_date);
  hour.setHours(hour.getHours(),0,0,0)
  return { unit: hour.getTime() }
//  return { unit: hour.getDate() + '/' + hour.getMonth() + '/' + hour.getFullYear() + ' ' + hour.getHours() + ':00' }
}


/**
* Methods
*/

VisitSchema.methods = {
        
}

/**
 * Statics
 */

VisitSchema.static({
  
  /**
  * Find visit by id
  *
  * @param {ObjectId} id
  * @param {Function} cb
  * @api private
  */
  
  load: function (id, cb) {
    this.findOne({ _id: id})
      .populate('shop')
      .populate('buyer')
      .exec(cb)
  },
  
  /**
  * Return the last visit from a buyer to a shop
  *
  * @param {Object} shop
  * @param {Object} buyer  
  * @param {Function} cb
  * @api private
  */
    
  lastVisit: function(shop, buyer, cb) {
    this.findOne({ shop: shop, buyer: buyer})
      .sort({'end_date': -1, 'start_date': -1})
      .exec(cb)
  },
  
  /**
  * Get num visits by day for a shop
  *
  * @param {Object} shop
  * @api private
  */
  
  numVisits: function(shop, cb) {
    this.aggregate([
          {$match: { shop: shop._id } },
          {$group: {
              _id: {
                  year: {$year: "$start_date"},
                  month: {$month: "$start_date"},
                  day: {$dayOfMonth: "$start_date"}
              },
              count: {$sum: 1}
          }},
          {$project: {
              date: {
                      year: "$_id.year",
                      month:"$_id.month",
                      day:"$_id.day"
              },
              count: 1,
              _id: 0
          }}
        ], cb);    
    },

    /**
    * Get the list of uniques buyers id between two dates
    *
    * @param {Object} shop
    * @param {Date} start
    * @param {Date} end
    * @api private
    */
    
    buyers: function(shop, start, end, cb) {
      this.aggregate([
          {$match: {$and: [{shop: shop._id}, {start_date: {$gte: start}}, {start_date: {$lt: end}}]}},
          {$group: {
            _id: "$buyer",
            count: {$sum: 1}
          }},
          {$project: {
            _id: 1,
            count: 1
          }}
        ], cb)
    },
    
    /**
    * Get the calculate shop visits between two dates group by a unit of time
    *
    * @param {Object} shop
    * @param {Date} start
    * @param {Date} end
    * @param {Object} unit
    * @api private
    */
    
    visitsByUnit2: function(shop, start, end, unit, cb) {
      this.aggregate([
          {$match: {$and: [ {shop: shop._id}, 
                          {$or: [ 
                                  { start_date: {$gte: start, $lte: end} }, 
                                  { end_date: { $gte: start, $lte: end} }
                                ]} 
                          ]
                  }
          },
          //Group varía en función de unit
          {$group: { 
              _id: {
                  year: {$year: "$start_date"},
                  month: {$month: "$start_date"},
                  day: {$dayOfMonth: "$start_date"}
              },
              count: {$sum: 1}          
            }
          }
        ], cb)
    },
    
    visitsByUnit: function(shop, start, end, unit, cb) {
      var key;
      
      switch (unit) {
        case 'month':
                    key = String(keyfGroupVisitByMonth);
                    break;
        case 'week':
                    key = String(keyfGroupVisitByWeek);
                    key = key.replace("#start#", start.toString())
                    key = key.replace("#end#", end.toString())   
                    break;
        case 'hour':
                    key = String(keyfGroupVisitByHour);
                    break;
        default:
                    key = String(keyfGroupVisitByDay)
      }
      
      var command = {
        'group': {
          'ns': 'visits',
          'scope': { bounce_time: BOUNCE_TIME },
          '$keyf': key,
          'initial': initialVisit,
          '$reduce': String(reduceVisit),
          'cond': { $and: [ {shop: shop._id}, 
                            {$or: [
                              { start_date: {$gte: start, $lte: end} },
                              { end_date: { $gte: start, $lte: end} }
                            ]}
                          ]},
          'finalize': String(finalizerVisit)
        }
      };
      mongoose.connection.db.executeDbCommand(command, function(err, visits) {
        if (err) return cb(err)
        cb(err, visits.documents[0])
      })
    },
    
    visitsSummary: function(shop, start, end, cb) {
        var hour = 'hour';
        //Obtenemos las visitas para la unidad más pequeña
        this.visitsByUnit(shop, start, end, hour, function(err, visits) {
            if (err) return cb(err);
            cb(err, visits);
        })
    },

    repeatedVisits: function(shop, start, end, cb) {
      //Agrupa por buyer
      this.aggregate([
          {$match: {$and: [{shop: shop._id}, {into: true}, {start_date: {$gte: start}}, {start_date: {$lt: end}}]}},
          {$group: {
            _id: "$buyer",
            count: {$sum: 1}
          }},
          {$project: {
            _id: 0,
            count: 1
          }}
        ], function(err, result) {
            var visits_summary = {
                'total': 0,
                'uniques': 0,
                'repeated': 0
            };
            visits_summary.uniques = result.length;
            for (var i = 0; i < result.length; i++) {
                visits_summary.total+=result[i].count;
                //Solo suma si es mayor que 1.
                visits_summary.repeated+=(result[i].count - 1);
            }
            cb(err, visits_summary);
        });
    },
})

/**
 * Register
 */

mongoose.model('Visit', VisitSchema)