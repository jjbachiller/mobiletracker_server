
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var passportOptions = {
  failureFlash: 'Invalid email or password.',
  failureRedirect: '/'
}

// controllers
var home = require('home')
  , users = require('users')
  , admin = require('admin')  
  , companies = require('companies')
  , shops = require('shops')
  , sensors = require('sensors')
  , visits = require('visits')
  , rssi = require('rssi')
  , feed = require('feed')
  , dashboard = require('dashboard')
  , auth = require('./middlewares/authorization')
  
/**
* Route middlewares
*/
//Así podemos enviar varios métodos para comprobar en lugar de uno solo
var shopAuth = [auth.shop.requiresLogin, auth.shop.hasAuthorization]

/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index)
  // user routes
  app.post('/login', passport.authenticate(
        'local',
        {
            failureRedirect: '/',
            failureFlash: 'Invalid email or password.'
        }), users.session)
  app.get('/admin', admin.index)        
  
  //Gestión de usuarios.
  app.get('/admin/new/user', auth.requiresLogin, admin.new_user)
  app.post('/admin/create/user', admin.create_user)
  
  //Gestión de empresas y tiendas.
  app.get('/companies', companies.index)
  app.get('/companies/new', companies.new)  
  app.post('/companies', companies.create)
  app.get('/companies/:company_id', shops.index)
  app.get('/companies/:company_id/new', shops.new)
  app.post('/companies/:company_id', shops.create)  
  
  app.param('company_id', companies.load)
  
  app.get('/shops/:shop_id/:day/:month/:year', visits.by_day)
  app.get('/shops/:shop_id', visits.days)  
  app.get('/shops/:shop_id/new', sensors.create)
  app.get('/shops/:shop_id/remove', visits.remove_today)

  app.param('shop_id', shops.load)

  app.get('/visits/:visit_id', rssi.visit_detail)
    
  app.param('visit_id', visits.load)
  
  app.post('/feed', feed.sensor_feed)
  
  app.get('/dashboard/:shop_id', dashboard.general)
  app.post('/dashboard/update/:shop_id', dashboard.updateGraph)  
}
