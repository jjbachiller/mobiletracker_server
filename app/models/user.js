
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
//var userPlugin = require('mongoose-user')

/**
 * User schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  company: { type: String }
})

/**
* Virtuals
*/
//El password sin cifrar no se almacena en bd, lo ponemos como atributo virtual.
UserSchema.virtual('password').set(function (password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() { return this._password })

/**
* Validations
*/

var validatePresenceOf = function (value) {
    return value && value.length
}

UserSchema.path('name').validate(function (name) {
   return name.length 
}, 'El campo nombre no puede estar vacío');


UserSchema.path('email').validate(function (email) {
    return email.length
}, 'El campo email no puede estar vacío');

UserSchema.path('email').validate(function (email, fn) {
    var User = mongoose.model('User')
    
    //Check only when it is a new user or when email field is modified
    if (this.isNew || this.isModified('email')) {
        User.find({ email: email }).exec(function (err, users) {
            fn(err || users.length === 0)
        })
    } else fn(true)
}, 'Ya existe un usuario registrado con ese email')

UserSchema.path('hashed_password').validate(function (hashed_password) {
    return hashed_password.length
}, 'El campo contraseña no puede estar vacío')


/**
* Pre-save hook
*/

UserSchema.pre('save', function(next) {
    if (!this.isNew) return next()
    
    if (!validatePresenceOf(this.password))
        next(new Error('Contraseña incorrecta'))
    else
        next()
})

/**
* Methods
*/

UserSchema.methods = {

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
     
     authenticate: function (plaintext) {
         console.log("Contraseña: " + plaintext + " encriptada: " + this.encryptPassword(plaintext) + " real: " + this.hashed_password);
         return this.encryptPassword(plaintext) === this.hashed_password
     },
     
     /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
     
     makeSalt: function() {
         return Math.round((new Date().valueOf() * Math.random())) + ''
     },

     /**
      * Encrypt password
      *
      * @param {String} password
      * @return {String}
      * @api public
      */
     
     encryptPassword: function(password) {
         if (!password) return ''
         var encrypred
         try {
             encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
             return encrypred
         } catch (err) {
             return ''
         }
     }
}

/**
 * Statics
 */

UserSchema.static({

})

/**
 * Register
 */

mongoose.model('User', UserSchema)
