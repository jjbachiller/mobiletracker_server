
/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

exports.errors = function (errors) {
  var keys = Object.keys(errors)
  var errs = []

  // if there is no validation error, just display a generic error
  if (!keys) {
    console.log(errors);
    return ['Oops! There was an error']
  }

  keys.forEach(function (key) {
    errs.push(errors[key].type)
  })

  return errs
}

//Dada una fecha javascript, la devuelve en formato texto con 0's delante de meses y días si son menores que 10
exports.getTextDate = function(date) {
  return ("0" + date.getDate()).slice(-2) + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
}	

exports._daylightSavingAdjust = function(date) {
	if (!date) {
		return null;
	}
	date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
	return date;
},

exports.getInitDate = function(date) {
	var init_date;
  	if (date instanceof Date) {
  		init_date = new Date(date);
  	} else {
  		//Si no nos dan una fecha, la iniciamos al primer día del mes anterior.
  		init_date = new Date();
  		init_date.setMonth(init_date.getMonth());
  		init_date.setDate(init_date.getDate()-31);
  	}
  	init_date.setHours(0,0,0,0);    
  	return init_date;
}

exports.getEndDate = function(date) {
	var end_date;
	if (date instanceof Date) {
		end_date = new Date(date);
		end_date.setDate(end_date.getDate() + 1);
	} else {
		//Si no nos dan una fecha, la inicializamos a primera hora de hoy.
  		end_date = new Date();
//  		end_date.setDate(end_date.getDate());
	}
  	end_date.setHours(0,0,0,0);			
  	return end_date;
}

/* Parse a string value into a date object.
 * See formatDate below for the possible formats.
 *
 * @param  format string - the expected format of the date
 * @param  value string - the date in the above format
 * @param  settings Object - attributes include:
 *					shortYearCutoff  number - the cutoff year for determining the century (optional)
 *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
 *					dayNames		string[7] - names of the days from Sunday (optional)
 *					monthNamesShort string[12] - abbreviated names of the months (optional)
 *					monthNames		string[12] - names of the months (optional)
 * @return  Date - the extracted date value or null if value is blank
 */
exports.parseDate = function (format, value, settings) {
	if (format == null || value == null) {
		throw "Invalid arguments";
	}

	value = (typeof value === "object" ? value.toString() : value + "");
	if (value === "") {
		return null;
	}

	var iFormat, dim, extra,
		iValue = 0,
		shortYearCutoffTemp = (settings ? settings.shortYearCutoff : null) || "+10",
		shortYearCutoff = (typeof shortYearCutoffTemp !== "string" ? shortYearCutoffTemp :
			new Date().getFullYear() % 100 + parseInt(shortYearCutoffTemp, 10)),
		dayNamesShort = (settings ? settings.dayNamesShort : null) || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		dayNames = (settings ? settings.dayNames : null) || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		monthNamesShort = (settings ? settings.monthNamesShort : null) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		monthNames = (settings ? settings.monthNames : null) || ["January","February","March","April","May","June","July","August","September","October","November","December"],
		year = -1,
		month = -1,
		day = -1,
		doy = -1,
		literal = false,
		date,
		// Check whether a format character is doubled
		lookAhead = function(match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
			if (matches) {
				iFormat++;
			}
			return matches;
		},
		// Extract a number from the string value
		getNumber = function(match) {
			var isDoubled = lookAhead(match),
				size = (match === "@" ? 14 : (match === "!" ? 20 :
				(match === "y" && isDoubled ? 4 : (match === "o" ? 3 : 2)))),
				digits = new RegExp("^\\d{1," + size + "}"),
				num = value.substring(iValue).match(digits);
			if (!num) {
				throw "Missing number at position " + iValue;
			}
			iValue += num[0].length;
			return parseInt(num[0], 10);
		},
		// Extract a name from the string value and convert to an index
		getName = function(match, shortNames, longNames) {
			var index = -1,
				names = $.map(lookAhead(match) ? longNames : shortNames, function (v, k) {
					return [ [k, v] ];
				}).sort(function (a, b) {
					return -(a[1].length - b[1].length);
				});

			$.each(names, function (i, pair) {
				var name = pair[1];
				if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
					index = pair[0];
					iValue += name.length;
					return false;
				}
			});
			if (index !== -1) {
				return index + 1;
			} else {
				throw "Unknown name at position " + iValue;
			}
		},
		// Confirm that a literal character matches the string value
		checkLiteral = function() {
			if (value.charAt(iValue) !== format.charAt(iFormat)) {
				throw "Unexpected literal at position " + iValue;
			}
			iValue++;
		};

	for (iFormat = 0; iFormat < format.length; iFormat++) {
		if (literal) {
			if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
				literal = false;
			} else {
				checkLiteral();
			}
		} else {
			switch (format.charAt(iFormat)) {
				case "d":
					day = getNumber("d");
					break;
				case "D":
					getName("D", dayNamesShort, dayNames);
					break;
				case "o":
					doy = getNumber("o");
					break;
				case "m":
					month = getNumber("m");
					break;
				case "M":
					month = getName("M", monthNamesShort, monthNames);
					break;
				case "y":
					year = getNumber("y");
					break;
				case "@":
					date = new Date(getNumber("@"));
					year = date.getFullYear();
					month = date.getMonth() + 1;
					day = date.getDate();
					break;
				case "!":
					date = new Date((getNumber("!") - this._ticksTo1970) / 10000);
					year = date.getFullYear();
					month = date.getMonth() + 1;
					day = date.getDate();
					break;
				case "'":
					if (lookAhead("'")){
						checkLiteral();
					} else {
						literal = true;
					}
					break;
				default:
					checkLiteral();
			}
		}
	}

	if (iValue < value.length){
		extra = value.substr(iValue);
		if (!/^\s+/.test(extra)) {
			throw "Extra/unparsed characters found in date: " + extra;
		}
	}

	if (year === -1) {
		year = new Date().getFullYear();
	} else if (year < 100) {
		year += new Date().getFullYear() - new Date().getFullYear() % 100 +
			(year <= shortYearCutoff ? 0 : -100);
	}

	if (doy > -1) {
		month = 1;
		day = doy;
		do {
			dim = this._getDaysInMonth(year, month - 1);
			if (day <= dim) {
				break;
			}
			month++;
			day -= dim;
		} while (true);
	}

	date = this._daylightSavingAdjust(new Date(year, month - 1, day));
	if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
		throw "Invalid date"; // E.g. 31/02/00
	}
	return date;
}