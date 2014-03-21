$(function() {

  var previousMain = {}
  var previousSecondary = {}

  var previousPoint = null;
  
  //Cargar los select de las series
  function fillSelectSeries(select_id, main) {
      if (!main) {
          //Si no es el select de la serie principal, el primer valor es vacío
          $('#'+select_id).append(new Option('', 0, true, true));
      }
      for (var serie in series[0].hour.data) {
        var value = serie;
        var text = series[0].hour.data[serie].label;
        var selected = false;
        if (serie == 'interior') {
            if (main) selected = true;
            else continue; //No añadimos al secundario, la seleccionada por defecto en el principal
        }
        $('#'+select_id).append(new Option(text, value, selected, selected));
      }      
  }

  function fillSelectUnits() {
    for (var serie in series[0]) {
      if (serie == 'year') continue;
      var radio_btn = $('<button class="btn">' + serie + '</button>');
      if (serie == 'day') {
        radio_btn.addClass("active");
      }
      radio_btn.appendTo('#units');
/*
      radio_btn.appendTo(btn_container);
      btn_container.append(' ' + series[0][serie].label);
      btn_container.appendTo('#units_list');      
*/
    }
  }

  function getFormatter(value) {
      if(value == 'avg_bounce')
        return percentageFormatter;
      else if(value == 'avg_int_duration' || value == 'avg_ext_duration')
        return timeFormatter;
      else 
        return null;      
  }

  function setPresentedSerie(main, comparing, label, data) {
    //Opciones comunes
    var presented_serie = {
      label: label,
      data: data,
      lines: {
        show: true, 
        fill: true, 
        lineWidth: 4, 
        fillColor: "#E5F3F9" 
      },
      points: { 
        show: true, 
        lineWidth: 4, 
        fillColor: "#058DC7"          
      },
    }

    if (data.length > 50) {
      presented_serie.points.show = false; 
    }
    if (!comparing) {
      if (main) {
        //Opciones de la serie principal
        presented_serie.color = "#058DC7";      
        presented_serie.lines.fill = true;     
      } else {
        //Opciones de la serie secundaria
        presented_serie.color = "#AADFF3"; 
        presented_serie.points.fillColor = "#AADFF3";
        presented_serie.lines.fill = false;
        presented_serie.yaxis = 2;    
      }
    } else {
      if (main) {
        //Opciones de la serie principal
        presented_serie.color = "#ED7E17";      
        presented_serie.points.fillColor = "#ED7E17";        
        presented_serie.lines.fill = false;     
      } else {
        //Opciones de la serie secundaria
        presented_serie.color = "#F2D5BD"; 
        presented_serie.points.fillColor = "#F2D5BD";
        presented_serie.lines.fill = false;
        presented_serie.yaxis = 2;    
      }      
    }

    return presented_serie;
  }

  function setPresentedOptions() {
    var presented_options = {
      xaxis: { mode: "time", tickLength: 0 },
      grid: { hoverable: true }
    }
  }
  
  function fillSerie(unit, main_data, main_label, second_data, second_label, comparing) {
      //Seleccionamos la unidad y la métrica principal
      presented_series.push(setPresentedSerie(true, comparing, main_label, main_data));
      if (second_data != '') 
        presented_series.push(setPresentedSerie(false, comparing, second_label, second_data));
  }
  
  function fillOptions(base_options, main_serie, second_serie) {
      //Rellenamos las opciones
      var options = base_options;      
      //Ponemos el formateador correcto según la métrica seleccionada
      options.yaxis = { tickFormatter: getFormatter(main_serie) }       
      if (second_serie == 0) {
        options.y2axis = null;
      } else {
        //Rellenamos las opciones del eje y para la segunda serie.
        options.y2axis = {
            position: 'right',
            alignTicksWithAxis: 1,
            tickFormatter: getFormatter(second_serie)
        }                
      }
      return options;
  }

  $.updateChart = function() {
    var unit = $('.btn.active').html();
    var main_serie = $('#mainSerie').val();
    var second_serie = $('#secondarySerie').val();        
    var main_label = $('#mainSerie').find(":selected").text();
    var second_label = $('#secondarySerie').find(":selected").text();  
    presented_series = new Array();
    for (var i = 0; i < series.length; i++) {
        if (jQuery.isEmptyObject(series[i])) continue;        
        var main_data = series[i][unit].data[main_serie].data;
        var second_data = (second_serie == 0) ? '' : series[i][unit].data[second_serie].data;        
        fillSerie(unit, main_data, main_label, second_data, second_label, i);
    }
    //Rellenamos las opciones
    var options = series[0][unit].options;                      
    options = fillOptions(options, main_serie, second_serie);    
    $.plot('#placeholder', presented_series, options);
    //Actualizamos el total de visitas
    $("span#all_visits").html(total_visits);
  }


  //Si cambia el valor de un select de la serie, modificamos la gráfica
  $('#mainSerie').focus(function () {
      // Store the current value on focus and on change
      previousMain = { value: this.value, text: $(this).find(":selected").text() };
  }).change(function() {
      //Añadimos el que se ha quitado
      $('#secondarySerie').append(new Option(previousMain.text, previousMain.value));
      //Y quitamos el que se ha seleccionado ahora
      $("#secondarySerie option[value='" + this.value + "']").remove();
      // Make sure the previous value is updated
      previousMain = { value: this.value, text: $(this).find(":selected").text() };
      $.updateChart();
  });
  
  $('#secondarySerie').focus(function () {
        // Store the current value on focus and on change
        previousSecondary = { value: this.value, text: $(this).find(":selected").text() };
  }).change(function() {
        //Añadimos el que se ha quitado
        if (previousSecondary.value != 0)
          $('#mainSerie').append(new Option(previousSecondary.text, previousSecondary.value));
        //Y quitamos el que se ha seleccionado ahora
        $("#mainSerie option[value='" + this.value + "']").remove();
        // Make sure the previous value is updated
        previousSecondary = { value: this.value, text: $(this).find(":selected").text() };
        $.updateChart();
  });

  //Lo hacemos con delegate ya que los elementos radios de units se generan dinámicamente
  $("#units").delegate(".btn", 'click', function(){
    $('.btn').removeClass('active');
    $(this).addClass('active');
    $.updateChart();
  });  

  //Mostrar el hint cuando se para en alguno de los puntos
  $("#placeholder").bind("plothover", function (event, pos, item) {
    if (item) {
      if (previousPoint != item.dataIndex) {
        previousPoint = item.dataIndex;
        $("#tooltip").remove();
        content = addHintData(item);
        showTooltip(item.pageX, item.pageY, content);
      }
    } else {
      $("#tooltip").remove();
      previousPoint = null;
    }      
  });  
  
  function getHintTitle(item_index, serie_index) {
     var title = '<div id="tt_title">';
     title+=presented_series[serie_index].data[item_index][2];      
     title+='</div>';
     return title;
  }

  function getHintValue(item_index, serie_index, item_formatter) {
      //Valor de la pimera serie
      var unformated_value = presented_series[serie_index].data[item_index][1];
      var formatter = getFormatter(item_formatter);             
      if (formatter) unformated_value = formatter(unformated_value);
      var value = '<li>' + presented_series[serie_index].label + ': ' + unformated_value + '</li>';
      return value;
  }

  function addHintBlock(item, base_index, compared_index) {
      //Titulo de la primera serie
      var content = getHintTitle(item.dataIndex, base_index, $('#mainSerie').val());
      content+= '<ul>';
      content+= getHintValue(item.dataIndex, base_index);
      if (compared_index != 0) {
          content+=getHintValue(item.dataIndex, compared_index, $('#secondSerie').val());
      }      
      //Datos de la primera serie
      content+='</ul>';      
      return content;
  }
  
  function addHintData(item) {
      var serie_index = 0;
      var compared_index = 0;
      var content = '';
      if (series.length > 1) {//Hay dos rangos de fechas
          if (presented_series.length > 2) {//Esta comparando dos métricas
              content = addHintBlock(item, 0, 1);
              content+= addHintBlock(item, 2, 3);
          } else {//Solo hay una métrica para cada rango
              content = addHintBlock(item, 0, 0);
              content+= addHintBlock(item, 1, 0);              
          }
      } else {
          if (presented_series.length > 1) {//Está comparando dos métricas
              content = addHintBlock(item, 0, 1);              
          } else {//Solo hay una métrica en el único rango
              content = addHintBlock(item, 0, 0);              
          }
      }
      return content;
  }

  function showTooltip(x, y, contents) {
      $('<div id="tooltip">' + contents + '</div>').css({
          position: 'absolute',
          display: 'none',
          top: y + 5,
          left: x + 20,
          border: '2px solid #4572A7',
          padding: '2px',    
          size: '10',  
          'border-radius': '6px 6px 6px 6px',
          'background-color': '#fff',
          opacity: 0.80
      }).appendTo("body").fadeIn(200);
  }

  function percentageFormatter(v, axis) {
      return v.toFixed(2) + " %";
  }

  //Function formatear los valores de duración (tiempo medio de visita o de tráfico):
  function timeFormatter(v, axis) {
      var seconds = v % 60;
      v /= 60;
      var minutes = v % 60;
      var hours = v / 60;
      
      var strtime = '';
      if (hours < 10) strtime+= '0';
      strtime+= hours.toFixed(0)+':';
      if (minutes < 10) strtime+= '0';
      strtime+= minutes.toFixed(0)+':';
      if (seconds < 10) strtime+= '0';      
      strtime+= seconds.toFixed(0);
      return strtime;
  }
  
  $(window).resize(function() {
      // erase the flot graph, allowing the div to shrink correctly
      $('#placeholder').text(''); 

      // redraw the graph in the correctly sized div
      $.updateChart();
  });  
  
  function pieFormatter(label, series) {
//      return '<div style="font-size:8pt;text-align:center;padding:12px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
      return '<div style="font-size:8pt;text-align:center;padding:12px;color:white;">'+Math.round(series.percent)+'%</div>';
  }

  $.updatePies = function() {
    repeated[0].options.series.pie.label.formatter = function(label, series){
          return pieFormatter(label, series);
        };
    $.plot($("#repeatedvisitor"), repeated[0].data, repeated[0].options);
    if (repeated.length > 1) {
        repeated[1].options.series.pie.label.formatter = function(label, series){
              return pieFormatter(label, series);
            };        
        $.plot($("#repeatedcomparedvisitor"), repeated[1].data, repeated[1].options);
    }
  }

  //Rellenamos los valores de los select
  fillSelectSeries('mainSerie', true);
  fillSelectSeries('secondarySerie', false);
  fillSelectUnits();
  //Y mostramos la gráfica
  $.updateChart();
  //Gráficos de tarta: Visitantes únicos / repetidos
  $.updatePies();
})