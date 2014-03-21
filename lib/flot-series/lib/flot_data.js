var extend = require("extend");

this.serie = {}

var series = {}

function startTimeUnit(time, unit) {
  switch (unit) {
    case 'month':
              time.setDate(1);
              time.setHours(0,0,0,0);
              break;
    case 'week':
              //???
              time.setHours(0,0,0,0);
              break;
    case 'hour':
              time.setHours(time.getHours(),0,0,0);
              break;
    default: //day
              //???
              time.setHours(0,0,0,0);
  }
  return time;
}

function nextTimeUnit(time, unit) {
  switch (unit) {
    case 'month':
                time.setMonth(time.getMonth()+1)
                break;
    case 'week':
                time.setDate(time.getDate()+7)
                break;
    case 'hour':
                time.setHours(time.getHours()+1);
                break;
    default:
                time.setDate(time.getDate()+1);
  }

  return startTimeUnit(time, unit);
}
/*
//Aplica el formato visual de la seríe, segun los datos.
this.formatFullSerie = function() {
  if (this.serie.data.length > global.MAX_SIZED_DOTTED)
    this.serie.points.show = false;
}

this.formatSecondarySerie = function(serie) {
  serie.color = "#AADFF3"; 
  serie.points.fillColor = "#AADFF3";
  serie.lines.fill = false;
  serie.yaxis = 2;
}

this.initializeSerie = function() {
    this.serie.label = "";
    this.serie.data = new Array();
    this.serie.color = "#058DC7";
    this.serie.lines = {
       show: true, 
       fill: true, 
       lineWidth: 4, 
       fillColor: "#E5F3F9" 
    };
    this.serie.points = { 
        show: true, 
        lineWidth: 4, 
        fillColor: "#058DC7" 
    };
}
*/

function getHintDate(date) {
  return global.DAYS_ES[date.getDay()] + ', ' + date.getDate() + ' de ' + global.MONTHS_ES[date.getMonth()] + ' de ' + date.getFullYear();
}

function getHint(start, end, unit) {
  var hint = '';
  switch (unit) {
    case 'month':
                hint = global.MONTHS_ES[start.getMonth()] + ' de ' + start.getFullYear();
                break;
    case 'week':
                var end_week = new Date(start.getTime());
                end_week.setDate(end_week.getDate() + 6);
                if (end_week.getTime() > end.getTime()) end_week = new Date(end.getTime());
                hint = start.getDate() + '/' + (start.getMonth()+1) + '/' + start.getFullYear();
                hint+= ' - ' + end_week.getDate() + '/' + (end_week.getMonth()+1) + '/' + end_week.getFullYear();
                break;
    case 'hour':
                hint = getHintDate(start) + ' ' + start.getHours() + ':00' ;
                break;
    default:
                hint = getHintDate(start);
                //day    
  }
  return hint;
}

function getTimeUnit(start, c_time, unit) {
    var time_unit = new Date(c_time.getTime());
    switch (unit) {
        case 'month':
                    time_unit.setDate(1);
                    time_unit.setHours(0,0,0,0);
                    return time_unit;
        case 'week':
                    var week_start = new Date(start.getTime());
                    while (week_start.getTime() < time_unit.getTime()) {
                        //Avanzamos de semana en semana desde la fecha de inicio
                        week_start.setDate(week_start.getDate()+7);
                    }
                    time_unit = new Date(week_start.getTime());
                    time_unit.setHours(0,0,0,0);
                    return time_unit;
        case 'day':
                    time_unit.setHours(0,0,0,0);
                    return time_unit;                    
        case 'hour':
                    return time_unit;
    }
}
/*
//Genera una serie rellenada con 0s desde start hasta end, en incrementos de unit
this.generateEmptySerie = function(start, end, unit) {
  this.initializeSerie();
  //Redondeamos la fecha inicial al principio de la hora, el día, la semana o el mes.
  start = this.startTimeUnit(start, unit);

  while (start.getTime() < end.getTime()) {
    //Obtener la cabecera del hint
    var hint = this.getHint(start, end, unit);
    //Pares mes valor para cada array
    var data_unit = [start.getTime(), 0, hint];
    this.serie.data.push(data_unit);
    start = this.nextTimeUnit(start, unit);
  }
  //Si tras incorporar los datos, cambia el formato, lo revisamos.
  this.formatFullSerie();
}

//Rellena una serie, con los valores de data en las posiciones que correspondan y aplica el timeoffset a los ts para enviarlos.
this.fillSerie = function(data, field, label) {
    //Clonamos la serie que tiene que estar inicializada en la que vamos a devolver
    var filled_serie = {};
    var top_value = 0;
    //Deep copy.
    extend(true, filled_serie, this.serie);
    var data_index = 0;
    for(var i = 0; i < filled_serie.data.length; i++) {
        //Si existe un valor para esa misma unidad de tiempo, lo rellenamos
        if (data[data_index] && (filled_serie.data[i][0] == data[data_index].unit)) {
            if (top_value < data[data_index][field]) top_value = data[data_index][field];
            filled_serie.data[i][1] = data[data_index][field];
            data_index++;
        }

        //Timezone Offset.
        filled_serie.data[i][0] -= (new Date()).getTimezoneOffset() * 60 * 1000;
    }
    filled_serie.label = label;
    var secondary_serie = {}
    extend(true, secondary_serie, filled_serie);
    //this.formatSecondarySerie(secondary_serie);
    return {primary: filled_serie, secondary: secondary_serie, top: top_value};
}
*/

//Rellena los datos de las métrics, con los resultados de la consulta por horas.
function fillMetrics(limit_time, visits) {
  var continuar = true;
  var metrics = { 
      total: 0,
      interior: 0,
      exterior: 0,
      bounce: 0,
      int_duration: 0,
      ext_duration: 0,
      avg_bounce: 0,
      avg_int_duration: 0,
      avg_ext_duration: 0
    };

  while ((visits.length > 0) && continuar) {
    var current_data = visits[0];
    if (current_data.unit < limit_time.getTime() ) {
      metrics.total+= current_data.total;
      metrics.interior+= current_data.interior;
      metrics.exterior+= current_data.exterior;
      metrics.bounce+= current_data.bounce;
      metrics.int_duration+= current_data.int_duration;
      metrics.ext_duration+= current_data.ext_duration;
      //Quitar el elemento del array de visitas.
      visits.splice(0, 1)
    } else {
      continuar = false;
    }
  }
  //Calcular medias.
  metrics.avg_bounce = (metrics.bounce == 0) ? 0:(metrics.bounce / metrics.interior) * 100;
  metrics.avg_int_duration = (metrics.interior == 0) ? 0:Math.round((metrics.int_duration / metrics.interior) / 1000);
  metrics.avg_ext_duration = (metrics.exterior == 0) ? 0:Math.round((metrics.ext_duration / metrics.exterior) / 1000);
  return metrics;
}

//Genera una serie rellenada con 0s desde start hasta end, en incrementos de unit
function generateSeriesByUnit(visits, start, end, unit) {
  //Redondeamos la fecha inicial al principio de la hora, el día, la semana o el mes.
  var current_time = new Date(start.getTime());
  current_time = startTimeUnit(current_time, unit);
  //Clonamos el objeto visitas, ya que vamos a ir extrayendo sus elementos en cada llamada.
  var visits_unit = new Array();
  extend(true, visits_unit, visits);
  while (current_time.getTime() <= end.getTime()) {
    //Obtener la cabecera del hint
    var hint = getHint(current_time, end, unit);
    var time_unit = getTimeUnit(start, current_time, unit);
    var end_unit = nextTimeUnit(current_time, unit);
    var data_metrics = fillMetrics(end_unit, visits_unit);
    for (var i = 0; i < global.METRICS.length; i++) {
      var metric = global.METRICS[i].metric;
      //Time offset by zone.
      var time_with_offset =  current_time.getTime() + 3600000;
      //var time_with_offset =  current_time.getTime() - ((new Date()).getTimezoneOffset() * 60 * 1000);      
      var data_element = [time_with_offset, data_metrics[metric], hint];
      series[unit].data[metric].data.push(data_element);
    }
    current_time = end_unit;
  }
  //Si tras incorporar los datos, cambia el formato, lo revisamos.
  //this.formatFullSerie();
}

function getCopiedSerie() {
    var returned_series = {};
    extend(true, returned_series, series);  
    return returned_series;
}

//Para todas las unidades...
function generateEmptySeries() {
    //Para cada unidad inicializamos la serie
    Object.keys(global.UNITS).forEach(function(unit) {
        if (unit == 'year') return;   
        series[unit] = { label: global.UNITS[unit].label, data: {} };   
        //Para cada métrica inicialiamos los datos con ceros
        for (var i = 0; i < global.METRICS.length; i++) {
            var metric_by_unit = new Array();
            metric_by_unit = {};
            metric_by_unit.data = new Array();
            metric_by_unit.label = global.METRICS[i].label;
            metric_by_unit.top = 0;
            metric_by_unit.tickSize = null;
            var metric = global.METRICS[i].metric;
            series[unit].data[metric] = metric_by_unit;
        }
    });
}

this.generateSeries = function(visits, start, end) {
    generateEmptySeries();
    Object.keys(global.UNITS).forEach(function(unit) {
      if (unit == 'year') return;
      generateSeriesByUnit(visits, start, end, unit);
    });
    return getCopiedSerie();
}

//Genera una serie rellenada con 0s desde start hasta end, en incrementos de unit
function generateComparedSeriesByUnit(visits, start, end, unit) {
  var current_time = new Date(start.getTime());
  current_time = startTimeUnit(current_time, unit);      
  //Clonamos el objeto visitas, ya que vamos a ir extrayendo sus elementos en cada llamada.
  var visits_unit = new Array();
  extend(true, visits_unit, visits);
  //Todas las métricas tienen la misma longitud, cogemos una al azar: interior.
  for (var j = 0; j < series[unit].data['interior'].data.length; j++) {  
    //Redondeamos la fecha inicial al principio de la hora, el día, la semana o el mes.    
    if (current_time.getTime() > end.getTime()) return; //Si es más larga que la de base, nos salimos alcanzado el límite
    //Obtener la cabecera del hint
    var hint = getHint(current_time, end, unit);
    var time_unit = getTimeUnit(start, current_time, unit);
    var end_unit = nextTimeUnit(current_time, unit);
    var data_metrics = fillMetrics(end_unit, visits_unit);
    for (var i = 0; i < global.METRICS.length; i++) {  
      var metric = global.METRICS[i].metric;          
      series[unit].data[metric].data[j][1] = data_metrics[metric];
      series[unit].data[metric].data[j][2] = hint;      
    }
    current_time = end_unit;            
  }
}

this.generateComparedSeries = function(visits, start, end, base) {
    //Clonamos la serie base en el atributo serie, con deep copy
    extend(true, series, base);  
    Object.keys(global.UNITS).forEach(function(unit) {
      if (unit == 'year') return;
      generateComparedSeriesByUnit(visits, start, end, unit);
    });
    return getCopiedSerie();    
}

this.generateRepeatedPie = function(repeated) {
    var pie = new Array();
    var repeated_v = {
        'label': 'Returning Visitor',
        'data': repeated.repeated,
        'color': '#058DC7'
    }
    pie.push(repeated_v);
    var uniques_v = {
        'label': 'New Visitor',
        'data': repeated.uniques,
        'color': '#50B432'
    }
    pie.push(uniques_v);    
    return pie;
}