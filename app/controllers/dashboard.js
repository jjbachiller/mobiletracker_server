/**
* Module dependencies
*/

var mongoose = require('mongoose')
  , Visit = mongoose.model('Visit')
  , utils = require('../../lib/utils')
  , flot_serie = require('../../lib/flot-series')
  , async = require('async')


function getGraph(shop, graphDates, cb) {
  var series = new Array();
  var total_visits = 0;  
  Visit.visitsSummary(shop, graphDates.start, graphDates.end, function(err, visits) {
    flot_serie.formatSeriesUnits(visits.retval, graphDates.start, graphDates.end, function(serie) {
        for (var i = 0; i < serie.month.data.interior.data.length; i++) {
            total_visits+=serie.month.data.interior.data[i][1];
        }
        series.push(serie);
        if (graphDates.comparing) {
            Visit.visitsSummary(shop, graphDates.c_start, graphDates.c_end, function(err, visits) {
                flot_serie.formatComparedSeriesUnits(visits.retval, graphDates.c_start, graphDates.c_end, serie, function(c_serie) {
                    series.push(c_serie);
                    cb(series, total_visits);
                })
            });
        } else {
            cb(series, total_visits);
        }
    })
  });
}

function getRepeated(shop, graphDates, cb) {
    var repeated = new Array();
    Visit.repeatedVisits(shop, graphDates.start, graphDates.end, function(err, repeated_visitors) {
        flot_serie.formatRepeatedVisitors(repeated_visitors, function(repeated_formated) {
            repeated.push(repeated_formated);
            if (graphDates.comparing) {
                Visit.repeatedVisits(shop, graphDates.c_start, graphDates.c_end, function(err, c_repeated_visitors) {
                    flot_serie.formatRepeatedVisitors(c_repeated_visitors, function(c_repeated_formated) {
                        repeated.push(c_repeated_formated);
                        cb(repeated);                        
                    })
                })
            } else {
                cb(repeated);
            }            
        }) 
    })
}

function getDashboard(shop, graphDates, cb) {
  var series;
  var repeated;
  var total_visits;
  async.parallel([
      function(callback) { //This is the first task, and callback is its callback task
          getGraph(shop, graphDates, function(graph_series, total) {
              //Now we have saved to the DB, so let's tell async that this task is doneç
              series=graph_series;
              total_visits=total;
              callback();
          });
      },
      //Función para los repetidos/únicos
      function(callback) { //This is the second task, and callback is its callback task
          getRepeated(shop, graphDates, function(repeated_visitors) {
              repeated=repeated_visitors;
              callback();
          })
      }
  ], function(err) { //This is the final callback
      cb(series, total_visits, repeated);
  });
}

exports.updateGraph = function(req, res) {
  var graphDates = {
    start: utils.getInitDate(utils.parseDate('dd/mm/yy', req.body.start)),
    end: utils.getEndDate(utils.parseDate('dd/mm/yy', req.body.end)),
    comparing: (req.body.comparing == 'true'),
  }

  if (graphDates.comparing) {
    graphDates.c_start = utils.getInitDate(utils.parseDate('dd/mm/yy', req.body.c_start));
    graphDates.c_end = utils.getEndDate(utils.parseDate('dd/mm/yy', req.body.c_end));
  }
  var shop = req.shop;

  getDashboard(shop, graphDates, function(series, total, repeated) {
    var response= {
        'series': series,
        'total_visits': total,
        'repeated': repeated
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(response));
    res.end();
  });
}

/**
* Dashboard graph
*/

exports.general = function(req, res) {
  var css_files = [ "/css/cupertino/jquery-ui-1.10.3.custom.min.css", "/css/datespicker.css" ]
  var js_files = [ "/js/flot/jquery.min.js", "/js/flot/jquery.flot.min.js", "/js/flot/jquery.flot.time.min.js", "/js/flot/jquery.flot.pie.min.js", "/js/dashboard/dashboard.js", "/js/datespicker/jquery-ui-1.10.3.custom.modified.js", "/js/datespicker/datespicker.js" ]
  var shop = req.shop
  
  //Por defecto cargamos un mes atrás desde hoy
  var graphDates = {
    start: utils.getInitDate(false),
    end: utils.getEndDate(false),
    comparing: false,
    c_start: '',
    c_end: ''
  }

  start_str = utils.getTextDate(graphDates.start);
  end_str = utils.getTextDate(graphDates.end);

  getDashboard(shop, graphDates, function(series, total, repeated) {
      res.render('dashboard/main', {
        css_files: css_files,
        js_files: js_files,
        shop: shop,
        start: start_str,
        end: end_str,
        series: series,
        total_visits: total,
        repeated: repeated
      });
  });
}