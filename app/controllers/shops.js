
/**
* Module dependencies
*/

var mongoose = require('mongoose')
  , Shop = mongoose.model('Shop')
  , utils = require('../../lib/utils')

/**
* Load
*/

exports.load = function (req, res, next, id) {
    Shop.load(id, function (err, shop) {
        if (err) return next(err)
        if (!shop) return next(new Error('not found'))
        req.shop = shop
        next()
    })
}

/**
* List
*/

exports.index = function (req, res) {
    var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
    var perPage = 30;
    var options = {
        company: req.company._id,
        page: page,
        perPage: perPage
    }
    
    Shop.list(options, function(err, shops) {
        if (err) return res.render('500')
        Shop.count().exec(function (err, count){
            res.render('shop/index', {
                title: 'Tiendas de la Empresa: ' + req.company.name,
                company: req.company,
                shops: shops,
                page: page + 1,
                pages: Math.ceil(count / perPage)
            })            
        })
    })
}

/**
* New shop
*/

exports.new = function (req, res) {
    var shop = new Shop({});
    shop.company = req.company

    res.render('shop/new', {
        title: 'Nueva tienda de ' + req.company.name,
        shop: shop
    });
}

/**
* Create shop
*/

exports.create = function (req, res) {
    var shop = new Shop(req.body)
    shop.company = req.company._id

    shop.save(function(err) {
        if (!err) {
            req.flash('success', 'Tienda creada correctamente para ' + req.company.name + '!');
            return res.redirect('/companies/' + shop.company)            
        }
        
        res.render('shop/new', {
           title: 'Nueva tienda de ' + req.company.name,
           shop: shop,
           errors: utils.errors(err.errors || err)
        });
    })
}