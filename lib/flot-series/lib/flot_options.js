function calculateNumPeriods(start, end, period_size) {
    var total_time = (end.getTime() - start.getTime());
    var num_periods = Math.ceil(total_time / period_size);    
    return num_periods;
}

//En lugar de que devuelva el tickSize, que devuelva un array de unidades.
function calculateTickSize(start, end, unit) {
    //Comprobar si existe this.units[unit]
    var current_unit = global.UNITS[unit];
    var num_units = 1;
    var excedido = false;
    do {
        //Milisegundos entre las dos fechas        
        var period_size = (current_unit.milliseconds * num_units);
        var num_periods = calculateNumPeriods(start, end, period_size);
        if (num_units > current_unit.max_value) {
            if (current_unit.end) {
                excedido = true;
            } else {
                current_unit = global.UNITS[current_unit.next_unit];
                num_units = 1;
            }
        }
        //unidades: 1, 2, 4, 6 ,12
        if (num_units == 4) num_units +=2;
        else num_units *= 2;        
    } while (!excedido && (num_periods > global.MAX_PERIODS))

    if (excedido) return null;
    return [num_units * current_unit.shift, current_unit.unit];
}

this.calculateOptions = function(start, end, unit) {    
    var options = {
        xaxis: { 
            mode: "time", 
            tickLength: 1,
            tickSize: calculateTickSize(start, end, unit)
        },    
//        yaxis : { alignTicksWithAxis: 1 },
        grid: { 
            borderWidth: 0,
            hoverable: true 
        },
        legend: {
            position: "nw",
            labelBoxBorderColor: null,
            noColumns: 4
        }
    }
    return options;
}

this.pieOptions = function() {
    var options = {
        series: {
          pie: { 
            show: true,
            label: {
              show: true,
              radius: 2/4,
            }
          }
        },
        legend: {
          show: true,
          position: "n",
          noColumns: 2,
          labelBoxBorderColor: null
        }
    }
    return options;
}