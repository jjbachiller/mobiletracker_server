
/**
* Module dependencies
*/

var mongoose = require('mongoose')
  , Visit = mongoose.model('Visit')
  , Buyer = mongoose.model('Buyer')
  , utils = require('../../lib/utils')
  , moment = require('moment')
  

function day_buyers(shop, day, callback) {
  var next_day = moment(day).add('days', 1);
  var end_date = next_day.toDate();
  var count;
  Visit.buyers(shop, day, end_date, function(err, buyers) {
    count = buyers.length;
    buyers.forEach(function (buyer, ind) {
      Buyer.findOne({ _id: buyer._id}, function(err, b) {
        if (err) {
          count--
          if (count==0) {
            callback(end_date, buyers)
          }                    
          return;
        }
        if (b.is_ap) {
          count--
          //Lo eliminamos del array
          buyers.splice(ind, 1);          
          if (count==0) {
            callback(end_date, buyers)
          }                    
          return;
        }
        buyer.data = b;
        //Rellenamos las visitas del comprador
        Visit.find({$query: {start_date: {$gte: day, $lt: end_date}, shop: shop._id, buyer: buyer._id}, $order_by: {start_date: 1, into: 1}}, function(err, visits) {
          count--;          
          if (err) return;
          buyer.visits = visits;
          if (count==0) {
            callback(end_date, buyers)
          }          
        })
      })
    })
  })
}

/**
* Load
*/

exports.load = function(req, res, next, id) {
  Visit.findOne({ _id: id }, function(err, visit) {
    if (err) return next(err);
    if (!visit) return next(new Error("Visit not found"));
    req.visit = visit
    next()
  })
}

/**
* List days with visits
*/

exports.days = function(req, res) {
  var shop = req.shop
  
  Visit.numVisits(shop, function(err, visits) {
    res.render('visit/list_by_day', {
      shop: shop,
      visits: visits
    });
  })
}

/**
* List visits by day
*/

exports.by_day = function(req, res) {
  var shop = req.shop
  var start_date = new Date(req.param('year'), req.param('month')-1, req.param('day'));
  day_buyers(shop, start_date, function(end_date, buyers) {
    res.render('visit/list_by_buyer', {
      shop: shop,
      start_date: start_date,
      end_date: end_date,
      buyers: buyers
    });              
  })
}

/**
* Remove today visits
*/

exports.remove_today = function(req, res) {
  var today = moment().startOf('day').toDate();
  var shop = req.shop
  Visit.remove( {start_date: {$gte: today}, shop: shop._id}, function(err){
    if (err) return res.render('500')
    return res.redirect('/shops/' + shop._id);
  })
}

/**
* List rssi compounds the visit
*/

exports.visit_detail = function(req, res) {
  
}