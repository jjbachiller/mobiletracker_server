
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Shop = mongoose.model('Shop')
  , Buyer = mongoose.model('Buyer')
  , Visit = mongoose.model('Visit')
  , RSSI = mongoose.model('RSSI')
  , async = require('async')
  
/**
* Constantes del módulo
*/

const TL = 1800000;//Tiempo límite en milisegundos para considerar discontinuada una visita.
const mrssi = -75; //RSSI mínima para considerar que una visita está dentro.
const num_in_verifications = 3;
const num_out_verifications = 20;
const time_out_verifications = 300000;//In miliseconds

//FIXME: Aclarar! al llamar al callback ¿SE SALE DEL BUCLE O SIGUE?

//FIXME: unificar estos dos métodos, no tienen sentido separados, son prácitcamente iguales.
function checkInAndOut(visit, rssi, cb_cio) {
    var num_verifications = 0;
    var current_time =  new Date(rssi.ts);
    current_time.setMilliseconds(0);    
    RSSI.list(visit._id, function(err, rssis) {
        for (var i = 0; i < rssis.length; i++) {
            var last_time = new Date(rssis[i].ts);
            last_time.setMilliseconds(0);
            if (last_time != current_time) {
                var current_into = (rssis[i].rssi > mrssi);
                if (current_into) {
                    //Si no se confirma la tendencia de salida, abandonamos
                    visit.end_date = rssi.ts
                    return cb_cio(visit, rssi);
                } else {
                    num_verifications++;
                    if (num_verifications == num_out_verifications) {
                        //Si no han pasado el tiempo indicado aunque tengamos las verificaciones, la ignoramos
                        var elapsed_time = (current_time - last_time); // milliseconds
                        if (elapsed_time >= time_out_verifications) {
                            //Nueva visita interior
                            visit = new Visit({
                                into: false,
                                start_date: rssis[i].ts,
                                end_date: rssi.ts,
                            })
                            //FIXME: Asociar las otras rssis y cambiar el ts de la visita anterior.....   
                            return cb_cio(visit, rssi);                            
                        }
                    }
                }
            }
        }
    })
}

function checkOutAndIn(visit, rssi, cb_coi) {
    var num_verifications = 0;
    var current_time =  new Date(rssi.ts);
    current_time.setMilliseconds(0);
    RSSI.list(visit._id, function(err, rssis) {
        for (var i = 0; i < rssis.length; i++) {
            var last_time = new Date(rssis[i].ts);
            last_time.setMilliseconds(0);
            if (last_time != current_time) {
                var current_into = (rssis[i].rssi >= mrssi);
                if (!current_into) {
                    //Si no se confirma la tendencia de entrada, abandonamos                                    
                    visit.end_date = rssi.ts    
                    return cb_coi(visit, rssi);
                } else {
                    num_verifications++;
                    if (num_verifications == num_in_verifications) {
                        //Nueva visita interior
                        visit = new Visit({
                            into: true,
                            start_date: rssis[i].ts,
                            end_date: rssi.ts,
                        })
                        //FIXME: Asociar las otras rssis y cambiar el ts de la visita anterior.....   
                        return cb_coi(visit, rssi);
                    }
                }
            }
        }
    })    
}

function reviewVisit(visit, rssi, into, cb_rv) {
    var into = (rssi.rssi >= mrssi);  
    
    if (visit.into != into) {
        if (into) {
          checkOutAndIn(visit, rssi, function(visit, rssi) {
            return cb_rv(visit, rssi)
          });
        } else {
          checkInAndOut(visit, rssi, function(visit, rssi) {
            return cb_rv(visit, rssi);
          });
        }
    } else {
        //Si se confirma el estado, simplemente actualizamos la fecha de fin de visita.
        visit.end_date = rssi.ts    
        cb_rv(visit, rssi)
    }
}

function createVisit(rssi, into, cb_cv) {
    //Si nunca antes ha visitado la tienda, o ha cambiado el estado o ha transcurrido mucho tiempo desde la última visita, creamos una nueva
    visit = new Visit({
        into: into,
        start_date: rssi.ts,
        end_date: rssi.ts,
    })
    
    return cb_cv(visit, rssi)    
}

//Dada la última visita y un array de actividad de un comprador, decide si ampliar la visita o crear una nueva
function get_visit(visit, activity, act, cb_gv) {
    var rssi = new RSSI({ rssi: act.value, ts: act.timestamp });
    var into = (rssi.rssi >= mrssi);
    
    if (!visit || (rssi.ts - visit.end_date) > TL) {
        //Es una visita nueva (nunca ha estado o hace más de TL milis de la última visita)
        createVisit(rssi, into, function(visit, rssi) {
          return cb_gv(visit, rssi);
        });
    } else {
        reviewVisit(visit, rssi, into, function(visit, rssi) {
          return cb_gv(visit, rssi);
        });
    }
/*    
  if (!visit)
    console.log("Primera visita para este comprador")
  else
    console.log("Visita recibida: " + visit._id + " verificaciones: " + visit.v)
  var index = activity.indexOf(act);
  console.log("Iteración " + index + " rssi: " + act.value);
  console.log(act.timestamp)
  var new_visit;
  var rssi = new RSSI({ rssi: act.value, ts: act.timestamp})
  var into = (rssi.rssi >= mrssi);
  if (!visit || (rssi.ts - visit.end_date) > TL) {
    console.log("NUEVA: no existe o fecha desfasada");
    //Si es una nueva visita, o ha transcurrido más de TL desde la última:
    new_visit = true;
  } else {
    if (visit.into != into) {
      console.log("Tienen distinto into...")
      visit.v++;
      if (visit.v >= num_verifications) {
        console.log("NUEVA: num verifi antes de for " + visit.v)
        new_visit = true;
      }
      else {
        new_visit = false;
        //Miramos cuantas por delante nos confirman
        var tmp_into;
        for (var i = index+1; i < activity.length; i++) {
          tmp_into = (activity[i].value >= mrssi)
          //Si no confirma el cambio, nos salimos.
          if (visit.into == tmp_into) {
            visit.v = 0;
            new_visit = false;
            break;
          }
          //Si esta en otro segundo, sumamos una verificacion
          if ((activity[i].timestamp - rssi.ts) > 1000) {
            console.log("Contando el cambio: " + (activity[i].timestamp - rssi.ts))
            visit.v++;
            if (visit.v >= num_verifications) {
              console.log("NUEVA: num verifi dentro de for " + visit.v)              
              new_visit = true;                
              break;
            }
          }
        }
      }
    } else {
      //Si había un cambio de estado y se ha anulado con una señal posterior, lo descartamos
      if (visit.v != 0) visit.v = 0;
      new_visit = false
    }
  }
  
  if (new_visit) {
    console.log("Creando nueva visita");
    //Si nunca antes ha visitado la tienda, o ha cambiado el estado o ha transcurrido mucho tiempo desde la última visita, creamos una nueva
    visit = new Visit({
        into: into,
        start_date: rssi.ts,
        end_date: rssi.ts,
    })
  } else {
    console.log("MANTENGO: Actualizando visita existente")
    //Es una continuación de la visita anterior.
    visit.end_date = rssi.ts
  }
  cb(visit, rssi);
*/
}

//Funciones privadas del módulo
function record_buyer_activity(shop, buyer, activity, cb_rba) {
  //Si es un ap, no registrarlo como comprador...
  if (buyer.is_ap == 1) {
    //Guardar la relación con la tienda, de otra forma para los puntos de acceso.
    console.log("Descartando AP: " + buyer.mac)
    return cb_rba();
  } else {
    console.log("STA: " + buyer.mac)
  }
  
  console.log("Total de registros de actividad del comprador: " + activity.length);
  
  async.eachSeries(activity, function(act, cb_serie) {
    Visit.lastVisit(shop, buyer, function(err, visit) {
      if (err) {
        console.log("Error obteniendo la última visita")
        return cb_serie(err)
      }        
      get_visit(visit, activity, act, function(v, rssi) {
        v.shop= shop._id
        v.buyer= buyer._id
        v.save(function (err, save_visit) {
          if (err) {
            console.log("Error al guardar al visita.")
            return cb_serie(err);
          }
//          console.log("Guardando la visita en la iteración: " + activity.indexOf(act))
          //Asociamos el rssi a la visita
          rssi.visit = save_visit._id
          rssi.save(function (err) {
            if (err) {
              console.log("Error al crear el registro de rssi.");
              return cb_serie(err)
            }
//            console.log("Guardado rssi");
            cb_serie();
          })
        })
      })
    })
  }, function(err) {
    return cb_rba(err)
  })
}


function dump_feed(shop, feed, cb) {
  console.log("Longitud de datos a procesar: " + feed.length);
  async.each(feed, function (person, cb_each) {
    Buyer.get(person.mac, function(err, buyer) {
      if (err) {
        console.log("Error buscando el comprador " + person.mac);
        return cb_each(err);
      }
      if (!buyer) {
        //Si la persona No es un comprador registrado, lo registramos
        buyer = new Buyer({ mac: person.mac, is_ap: person.is_ap, is_con: person.is_connected})
      } else {
        //Si ha cambiado is_ap o is_connected, actualizamos
        if (buyer.is_ap == 0 && person.is_ap == 1)
          buyer.is_ap = 1
        if (buyer.is_connected == 0 && person.is_connected == 1)
          buyer.is_connected = 1
      }
      buyer.save(function (err) {
        if (err) {
          console.log("Error creando o actualizando el comprador")
          return cb_each(err);
        }
        record_buyer_activity(shop, buyer, person.rssi, function(err) {
          if(err) return cb_each(err);
//          console.log("Entro en record buyer activity con comprador nuevo: " + feed.indexOf(person));
//          console.log("Persona:");
//          console.log(person);
          cb_each();
        });
      })
    })
  }, function(err) {
    return cb(err)
  })
}


//...

exports.sensor_feed = function (req, res) {
  var pkg = req.body;
  //Comprobar que existe pkg.id (shop) y pkg.sec (sensor) en la tabla de sensores.
  Shop.loadSensor(pkg.id, pkg.key, function(err, shop) {
    if (err) {
      console.log("ERROR!!!");
      console.log(err);
      return res.render('500')
    }
    if (!shop) {
      console.log("Tienda no encontrada :(  ID --> " + pkg.id + " Secret: " + pkg.key);
      return res.render('500')
    }
    dump_feed(shop, pkg.values, function(err) {
      return res.render('admin/index');
    });
  })
}