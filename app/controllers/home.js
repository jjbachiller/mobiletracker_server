
/*!
 * Module dependencies.
 */



exports.index = function (req, res) {
  res.render('home', {
    title: 'Teslametrics - Analytics for real life',
    message: req.flash('error')
  })
}
