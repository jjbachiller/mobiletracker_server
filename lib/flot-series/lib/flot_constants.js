global.METRICS = [
        { metric: 'total', label: 'Totales' },
        { metric: 'interior', label: 'Visitas' },
        { metric: 'exterior', label: 'Tráfico' },
        { metric: 'avg_bounce', label: '% Rebote' },
        { metric: 'avg_int_duration', label: 'Duración promedio visita' },
        { metric: 'avg_ext_duration', label: 'Duración promedio tráfico' }
    ];

global.UNITS = {
	hour: {
		label: 'Cada hora',
		max_value: 23,
		next_unit: 'day',
		milliseconds: 60 * 60 * 1000,
		unit: 'hour',
		shift: 1
	},
	day: {
		label: 'Día',		
		max_value: 6, 
		milliseconds: 24 * 60 * 60 * 1000,
		next_unit: 'week',
		unit: 'day',
		shift: 1
	},
	week: {
		label: 'Semana',		
		max_value: 3,
		milliseconds: 7 * 24 * 60 * 60 * 1000,
		next_unit: 'month',
		unit: 'day',
		shift: 7		
	},
	month: {
		label: 'Mes',
		max_value: 11,
		milliseconds: 30 * 24 * 60 * 60 * 1000,
		next_unit: 'year',
		unit: 'month',
		shift: 1		
	},
	year: {
		label: 'Año',
	    max_value: 10,
		milliseconds: 365 * 24 * 60 * 60 * 1000,
		end: true,
		unit: 'year',
		shift: 1			
	}
};

//Número máximo de etiquetas en el eje X
global.MAX_PERIODS = 10;
//Número máximo de valores para los que se muestran los puntos en la línea de una gráfica.
global.MAX_SIZED_DOTTED = 50;
global.MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
global.DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
