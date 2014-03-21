
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  
/**
* Menú principal
*/

exports.index = function (req, res) {
    res.render('admin/index', {
        title: 'Administración',
        Companies: []
    })
}


/**
* Show sign up form
*/

exports.new_user = function (req, res) {
  res.render('admin/new_user', {
      title: 'Crear un nuevo usuario.',
      user: new User()
  })
}

/**
* Create user
*/ 

exports.create_user = function (req, res) {
    var user = new User(req.body)
    user.provider = 'local'
    user.save(function (err) {
        if (err) {
            return res.render('admin/new_user', {
                errors: utils.errors(err.errors),
                user: user,
                title: 'Sign up'
            })
        }
        
        req.flash('message', 'Usuario creado correctamente!');
        return res.redirect('admin/')
        
        // manually login the user once succesfully signed up
        /*
        req.logIn(user, function(err) {
            if (err) return next(err)
            return res.redirect('/')
        })
        */
    })
}

