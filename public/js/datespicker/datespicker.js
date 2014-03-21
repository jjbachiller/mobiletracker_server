var date_format = 'dd/mm/yy';
//Fechas a restaurar si se da a cancelar
var restored_to, restored_from, restored_compare_to, restored_compare_from;
var is_comparing;

//Dada una fecha javascript, la devuelve en formato texto con 0's delante de meses y días si son menores que 10
function getTextDate(date) {
  return ("0" + date.getDate()).slice(-2) + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
}	

//Actualiza el resumen siempre visible, con las fechas seleccionadas
function updateDatesSummary() {
  var to = $("#input_to").val();;
  var from = $("#input_from").val();
  $('#dates_summary').html(to + ' - ' + from);
  if ($('#compare_to').prop('checked')) {
    var compared_summary = $('<div id="compared_summary"></div>');
    var compare_to =  $("#input_compare_to").val();
    var compare_from =  $("#input_compare_from").val();        
    compared_summary.html('<span>Comparar con:</span> ' + compare_to + ' - ' + compare_from);
    $('#dates_summary').append(compared_summary);
    //Ajustamos la posición de fondo del date_control
    $('#dates_control').removeClass('low');
    if(!$('#dates_control').hasClass('high')) $('#dates_control').addClass('high');
  } else {
    //Ajustamos la posición de fondo del date_control
    $('#dates_control').removeClass('high');
    if(!$('#dates_control').hasClass('low')) $('#dates_control').addClass('low');        
  }
}

function submitUpdate() {
  updateDatesSummary();
  $('#analytics_date_selector').css('visibility', 'hidden');
  var to = $('#input_to').val();
  var from = $('#input_from').val();
  var compare_to = $('#input_compare_to').val();
  var compare_from = $('#input_compare_from').val();
  var is_comparing = $('#compare_to').prop('checked');
  
  datespicker_callback(to, from, compare_to, compare_from, is_comparing);
  return false;
}
  
$(document).ready(function() {
	var second_range = false;
	var enabled_comparation = false;
	var focused = 'input_to';
	
	function isToDate(id) {
	  return id == 'input_to' || id == 'input_compare_to';
	}

    function isCompareDate(id) {
        return id == 'input_compare_to' || id == 'input_compare_from';
    }
    
    function textDateToJS(id) {
        var date;
        try {
            date = $.datepicker.parseDate(date_format, $("#" + id).val());
            //Si está marcada como con error y no lo tiene:
            if ($('#' + id).hasClass('highlight-error')) clearError($("#" + id));            
            if (!isToDate(id)) {
                //Si es fecha final, comprobamos que no sea menor que fecha inicio.
                var to_id = id.replace("_from","_to"); 
                to_date = $.datepicker.parseDate(date_format, $('#' + to_id).val());
                if (date < to_date) {
                    date = null();
                    setError($('#' + id));
                }
            }
        } catch(err) {
            date = null;
        }
        return date;
    }

    //Pone el marco del foco en el input text de fecha identificado con id
    function setFocus(id) {
        //Quitamos el foco de cualquier otro campo.
        $(".date_text").each(function() {
          if ($(this).hasClass('focus')) {
            $(this).trigger('focusout');
            $(this).removeClass('focus');
          }
        });

        var current_date = $('#' + id);
        //Guardamos el valor en el hidden, antes de que cambie
        if (!current_date.hasClass('highlight-error')) {
            copyToHidden(current_date);
        }
        current_date.addClass('focus');
        focused = id;
        if(isToDate(id))
            $(".datepicker").datepicker("option", "minDate", null);
        else {
            var to_id = id.replace("_from","_to"); 
            //Quitar las fechas anteriores al to
            var to_date = textDateToJS(to_id);
            $(".datepicker").datepicker("option", "minDate", to_date);  	    
        }

        //Si es del primer rango, quitamos el atributo second_range, si no lo ponemos
        if (current_date.hasClass('highlight-text2')) {
          //Si es del segundo rango.
          second_range = true;
        } else {
          second_range = false;
        }
    }

    //Diferencia en días, entre 2 fechas en milisegundos
    function dayDiff(first, second) {
        return (second - first)/(1000*60*60*24);
    }

    //Vuelca fechas to, from indicadas a los inputs indicados
    function updateInputDates(input_to, input_from, to, from) {
        $('#' + input_to).val(getTextDate(to));
        $(".datepicker").datepicker('refresh');
        $('#' + input_from).val(getTextDate(from));   
        $(".datepicker").datepicker('refresh');      
    }

    //Rellena el campo oculto equivalente al input text 'input', con el valor de este.
    function copyToHidden(input) {
        var hidden = input.attr('id') + '_hidden';
        $('#' + hidden).val(input.val());
    }

    //Rellena los inputs text de fechas, con los valores almacenados en sus campos ocultos equivalentes, en el caso 
    //de que halla error.
    function restoreFromHidden() {
        $(".date_text").each(function() {
          if ($(this).hasClass('highlight-error')) {
            clearError($(this));
            var hidden = $(this).attr('id') + '_hidden';
            $(this).val($('#' + hidden).val());
          }
        });      
    }

    //Carga las fechas indicadas, cuando se carga la página.
    function loadDefaultDates() {
        //Actualizamos el datepicker.
        updateInputDates('input_to', 'input_from', default_to, default_from);
        //Actualizamos el resumen visible.
        updateDatesSummary();	
    }

    function setError(date_input) {
        date_input.addClass('highlight-error');        
        $('#submitDates').prop('disabled', true);
    }

    function clearError(date_input) {
        date_input.removeClass('highlight-error');  
        //Si no hay ninguno con error, restaurarmos el botón
        $(".date_text").each(function() {
          if (!$(this).hasClass('highlight-error')) {
            $('#submitDates').prop('disabled', false);
          }
        });
    }

    //Muestra u oculta el datepicker
    $('#input_dates').click(function() {
        //Calcular la pos del div y mostrar
        var visibility = $('#analytics_date_selector').css('visibility');
        var visibility_toggle = (visibility == 'visible') ? 'hidden' : 'visible';
        $('#analytics_date_selector').css('visibility', visibility_toggle);
        if (visibility_toggle == 'visible') {
            //Calculamos la posición
            var ancho_dp = 832;//Ancho del datepicker + margen
             var ancho_win = $(window).innerWidth();
//            var ancho_win = $(this).parent().parent().width();
            var margin = 73;//Margen izquierdo del resumen de fechas.
            console.log("Datespicker width: " + ancho_dp + " parent_width: " + ancho_win);
            var left = ancho_win - (ancho_dp + margin);
//            if (left < 0) left = 0;
            $('#analytics_date_selector').css('left', left + 'px');
            var top = 96;
//            var top = $(this).parent().parent().height() - margin_top;
            $('#analytics_date_selector').css('top', top + 'px');
            
            //Guardamos las fechas por si hay que restaurarlas
            restored_to = $('#input_to').val();
            restored_from = $('#input_from').val();
            restored_compare_to = $('#input_compare_to').val();
            restored_compare_from = $('#input_compare_from').val();
            //Guardamos si está comparando
            is_comparing = $('#compare_to').prop('checked');
        }
    });
    
    //Restaura el datepicker a su estado inicial
    $('#cancelUpdate').click(function() {
        //Restauramos las fechas anteriores
        //Guardamos las fechas por si hay que restaurarlas
        $('#input_to').val(restored_to);
        $('#input_from').val(restored_from);
        $('#input_compare_to').val(restored_compare_to);
        $('#input_compare_from').val(restored_compare_from);
        //Restauramos el compare
        $('#compare_to').prop('checked', is_comparing).change();
        return false;
    });    

    $("#selected_period").change(function() {
        var opt = $(this).val();
        var from, to;
        switch (opt) {
          case '0': //personalizado: Habilitar los inputs
                  break;
          case '1': //Hoy
                  to = from = new Date();
                  break;
          case '2': //Ayer
                  var yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  to = from = yesterday;
                  break;
          case '3': //La semana pasada
                  to = new Date();
                  to.setDate(to.getDate() - 13);
                  from = new Date();
                  from.setDate(from.getDate() - 7);                
                  break;
          case '4': //El mes pasado;
                  to = new Date();
                  to.setMonth(to.getMonth() - 1);
                  to.setDate(1);                
                  from = new Date();
                  from.setDate(1);
                  from.setDate(from.getDate() - 1);                
        }
        updateInputDates('input_to', 'input_from', to, from);
        $('#compared_period').trigger('change');            
    });

    $("#compared_period").change(function(e) {
        var opt = $(this).val();
    	var to = textDateToJS("input_to");
    	var from = textDateToJS("input_from");      
    	var compare_to, compare_from;
        switch (opt) {
          case '0': //personalizado
                    compare_to = textDateToJS("input_compare_to");
                    compare_from = textDateToJS("input_compare_from");                   
                    //Si se ha lanzado el evento por un cambio del select, y no por un trigger desde código
                    if (e.originalEvent)
                      setFocus('input_compare_to');
                    break;
          case '1': //Previous period
                    //Seleccionamos el mismo número de días anteriores, si está seleccionado el mes completo, seleccionamos todo el mes anterior
                    if (to.getMonth() == from.getMonth()) {
                      var lastDay = new Date(from.getFullYear(), (from.getMonth() + 1), 0);
                      if (to.getDate() == 1 && from.getDate() == lastDay.getDate()) {
                        //Esta seleccionado un mes completo,seleccionamos todo el anterior.
                        compare_to = new Date(to.getTime());
                        compare_to.setMonth(compare_to.getMonth() - 1);
                        compare_from = new Date(compare_to.getFullYear(), (compare_to.getMonth() + 1), 0);
                      }
                    }
                    if (compare_to == null) {
                      //Si no se han rellenado, lo rellenamos con el periodo inmediatamente anterior
                      var num_days = dayDiff(to.getTime(), from.getTime());
                      //El límite es el día anterior al inicio del otro rango.
                      compare_from = new Date(to.getTime());
                      compare_from.setDate(compare_from.getDate() - 1);
                      compare_to = new Date(compare_from.getTime());
                      compare_to.setDate(compare_to.getDate() - num_days);
                    }
                    break;
          case '2': //Previous year
                    compare_to = new Date(to.getTime());
                    compare_to.setFullYear(compare_to.getFullYear()-1);
                    compare_from = new Date(from.getTime());
                    compare_from.setFullYear(compare_from.getFullYear()-1);
        }
        updateInputDates('input_compare_to', 'input_compare_from', compare_to, compare_from);      
    });
    
    //Cambia el select del periodo principal a personalizado
    $(".highlight-text1").focus(function() {
        $('#selected_period option:eq(0)').prop('selected', true);
    });

    //Cambia el select del periodo a comparar a personalizado
    $(".highlight-text2").focus(function() {
        $('#compared_period option:eq(0)').prop('selected', true);
    });

    $('#compare_to').change(function() {      
        $('#compared_dates').toggle();
        restoreFromHidden();      
        if ($(this).prop('checked')) {
            enabled_comparation = true;
            $('#compared_period').prop('disabled', false);
            $('#compared_period').trigger('change');                    
        } else {
            enabled_comparation = false;
            $('#compared_period').prop('disabled', true);
            //Ponemos como opción por defecto el periodo anterior
            $('#compared_period option:eq(1)').prop('selected', true);
            //Mandamos el foco al to
            setFocus('input_to');
        }
        $(".datepicker").datepicker('refresh');
    });

    $('.date_text').focus(function() {      
        setFocus($(this).attr('id'));      
        $(".datepicker").datepicker();	
    })

    $('.date_text').focusout(function() {      
        //Si no hay error, copiamos el valor al campo oculto
        if (!$(this).hasClass('highlight-error')) {
            copyToHidden($(this));
        }
    })

    $('.date_text').keyup(function() {
        var date = textDateToJS($(this).attr('id'));
        if (date != null) {
            clearError($(this));
            $(this).addClass('focus');
            //Actualizamos la fecha oculta      
            copyToHidden($(this));  
            $(".datepicker").datepicker('refresh');                
        } else {
            //Fecha no válida
            $(this).removeClass('focus');
            setError($(this));
        }
    })
		
    $(".datepicker").datepicker({
    	numberOfMonths: 3, 
    	//showCurrentAtPos: 2,
    	maxDate: new Date,
    	dateFormat: date_format,
    	beforeShowDay: function(date) {
    	var date1 = textDateToJS("input_to");
    	var date2 = textDateToJS("input_from");
    	if (enabled_comparation) {
    		var date3 = textDateToJS("input_compare_to");
    		var date4 = textDateToJS("input_compare_from");
		}
		var day_class = '';
		//Si es un día del rango1
		if (date1 && ((date.getTime() == date1.getTime()) || (date2 && date >= date1 && date <= date2))) {
    	 	//Si además es un día del rango2, hay solape
    	 	if (enabled_comparation && date3 && ((date.getTime() == date3.getTime()) || (date4 && date >= date3 && date <= date4)))
                day_class = 'dp-highlight3';						  
        	else
        		day_class = 'dp-highlight1';
    	} else {
		  	//Si es un día del rango2
			if (enabled_comparation && date3 && ((date.getTime() == date3.getTime()) || (date4 && date >= date3 && date <= date4)))
                day_class = 'dp-highlight2';
    		}
    		return [true, day_class];
    	},
    	onSelect: function(dateText, inst) {
            restoreFromHidden();
            //Cambiamos el select al valor: "Personalizado", en cada caso.
            if (isCompareDate(focused)) {
                $('#compared_period option:eq(0)').prop('selected', true);
            } else {
                $('#selected_period option:eq(0)').prop('selected', true);
            }

            $('#' + focused).val(dateText);      
            if (isToDate(focused)) { 
                //Añadimos la misma fecha en el from
                var from_id = focused.replace("_to","_from"); 
                $('#' + from_id).val(dateText);
                setFocus(from_id);
            } else {
                //Mandamos el foco, al to del rango inicial.        
                setFocus('input_to');
            }

            $('#compared_period').trigger('change');      
    	}
    });
	
    loadDefaultDates();
});
