
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')

//Redirección tras hacer login: Si venía de intentar alguna acción y se le ha enviado al login...
var login = function (req, res) {
    if (req.session.returnTo) {
        res.redirect(req.session.returnTo)
        delete req.session.returnTo
        return
    }
    res.redirect('/admin')
}

exports.signin = function (req, res) {}

/**
* Auth callback
*/

exports.authCallback = login

/**
* Show login form
*/
/*
exports.login = function (req, res) {
    res.render('users/login', {
        title: 'Login',
        message: req.flash('error')
    })
}
*/

/**
* Show sign up form
*/

exports.signup = function (req, res) {
    res.render('users/signup', {
        title: 'Sign up',
        user: new User()
    })
}

/**
* Logout
*/

exports.logout = function (req, res) {
    req.logout()
    res.redirect('/')
}

/**
* Session
*/

exports.session = login

/**
* Show profile
*/

exports.show = function (req, res) {
    var user = req.profile
    res.render('user/show', {
        title: user.name,
        user: user
    })
}

/**
* Find user by id
*/

exports.user = function (req, res, next, id) {
    User.findOne({ _id : id }).exec(function (err, user) {
        if (err) return next(err)
        if (!user) return next(new Error('Failed to load User ' + id))
        req.profile = user
        next()
    })
}