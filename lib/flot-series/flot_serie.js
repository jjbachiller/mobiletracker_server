var flot_constant = require('./lib/flot_constants')
  , flot_options = require('./lib/flot_options') 
  , flot_data = require('./lib/flot_data');

exports.formatSeriesUnits = function(visits, start, end, cb) {
  //Genera una seríe vaciá (rellena con 0's) entre start y end para todas las unidades de tiempo.
  var flot_series = flot_data.generateSeries(visits, start, end);
  for (var unit in flot_series) {
    flot_series[unit].options = flot_options.calculateOptions(start, end, unit);
  }
  cb(flot_series)
}

exports.formatComparedSeriesUnits = function(visits, start, end, base, cb) {
   //Genera una seríe vaciá (rellena con 0's) entre start y end para todas las unidades de tiempo.
  var flot_series = flot_data.generateComparedSeries(visits, start, end, base);
  cb(flot_series) 
}

exports.formatRepeatedVisitors = function(repeated, cb) {
    var repeated_visitors = {
        data: flot_data.generateRepeatedPie(repeated),
        options: flot_options.pieOptions()
    }
    cb(repeated_visitors);
}

/*

exports.formatSeries = function(visits, start, end, unit, cb) {
  this.formatSeriesUnits(visits, start, end, cb);
  var options = flot_options.calculateOptions(start, end, unit);

  var series = {
    total: [],
    interior: [],
    exterior: [],
    avg_bounce: [],
    avg_int_duration: [],
    avg_ext_duration: []
  }

  //Generamos la seríe vacía
  flot_data.generateEmptySerie(start, end, unit);
  //Para cada dato, volcamos sus valores a la serie vacía generada
  series.total = flot_data.fillSerie(visits, 'total', "Totales");
  series.interior = flot_data.fillSerie(visits, 'interior', "Visitas");
  series.exterior = flot_data.fillSerie(visits, 'exterior', "Tráfico");
  series.avg_bounce = flot_data.fillSerie(visits, 'average_bounce', "% Rebote");
  series.avg_int_duration = flot_data.fillSerie(visits, 'average_int_duration', "Duración promedio visita");
  series.avg_ext_duration = flot_data.fillSerie(visits, 'average_ext_duration', "Duración promedio tráfico");

  var flot_series = { data: series, options: options }
  //Modificar el timezone
  cb(flot_series);
}

*/