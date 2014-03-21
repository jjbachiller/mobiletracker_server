
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Company = mongoose.model('Company')
  , utils = require('../../lib/utils')

/**
* Load
*/

exports.load = function (req, res, next, id) {
    Company.load(id, function (err, company) {
        if (err) return next(err)
        if (!company) return next(new Error('not found'))
        req.company = company
        next()
    })
}

/**
* List
*/

exports.index = function(req, res) {
    var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
    var perPage = 30
    var options = {
        perPage: perPage,
        page: page
    }
    
    Company.list(options, function(err, companies) {
        if (err) return res.render('500')
        Company.count().exec(function (err, count) {
            res.render('company/index', {
                title: 'Empresas cliente',
                companies: companies,
                page: page + 1,
                pages: Math.ceil(count / perPage)
            })
        })
    })
}

/**
* New Company
*/

exports.new = function (req, res) {
    res.render('company/new', {
        title: 'Alta de empresa',
        company: new Company({})
    })
}

/**
* Create Company
*/

exports.create = function(req, res) {
    var company = new Company(req.body)
    company.save(function (err) {
        if (!err) {
            req.flash('success', 'Alta de empresa correcto!')
            return res.redirect('/companies/' + company._id)
        }
        
        res.render('company/new', {
            title: 'Alta de empresa',
            company: company,
            errors: utils.errors(err.errors || err)
        })
    })
}

/**
* Show
*/

exports.show = function(req, res) {
    res.render('company/show', {
        company: req.company        
    })
}