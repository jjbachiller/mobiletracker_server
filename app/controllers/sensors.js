
/**
* Module dependencies.
*/

var mongoose = require('mongoose')

/**
* Create sensor
*/

exports.create = function (req, res) {
  var shop = req.shop
  
  shop.addSensor(function (err) {
    if (err) return res.render('500')
    res.redirect('/companies/' + shop.company._id)
  })
}