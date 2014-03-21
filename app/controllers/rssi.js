
/**
* Module dependencies
*/

var mongoose = require('mongoose')
  , RSSI = mongoose.model('RSSI')
  , utils = require('../../lib/utils')

/**
* List rssi by visit
*/
exports.visit_detail = function(req, res) {
  RSSI.list(req.visit._id, function(err, rssis) {
    if (err) return res.render('500')
    res.render('rssi/list', {
      visit: req.visit,
      rssis: rssis
    })
  })
}