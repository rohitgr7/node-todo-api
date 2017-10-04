const mongoose = require('mongoose');
const validator = require('validator');
const {Schema} = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },

    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: (value) =>  validator.isEmail(value),
            message: '{VALUE} is not a valid email'
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});


// method to display only specific properties of the user
userSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject , ['name' , 'email' , '_id']);
};

userSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString() , access} , process.env.JWT_SECRET).toString();

    user.tokens.push({
        access, 
        token 
    });

    return user.save().then(() => {
        return token; 
    });
};

userSchema.methods.removeToken = function(token) {
    var user = this;

    //this update method is a local method which removes the entire token from the array 
    return user.update({
        $pull: {
            tokens: {token}
        }
    });
};

userSchema.methods.checkPassword = function(password) {
    var user = this;
    var result;
    return new Promise((resolve , reject) => {
        bcrypt.compare(password , user.password , (err , res) => {
            if(err || !res) {
                reject();
            }
            else {
                resolve(user);
            }
        });
    });
};

userSchema.statics.findByToken = function(token) {
    var User = this;
    var decoded;
    try {
        decoded = jwt.verify(token , process.env.JWT_SECRET);
    }
    catch(e) {
        return Promise.reject();
    }
    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token, //to look into a nested document we put them in quotes
        'tokens.access': 'auth'
    });
};

userSchema.statics.findByCredentials = function(email , password) {
    var User = this;

    return User.findOne( {email} )
        .then((user) => {
        if(!user) {
            return Promise.reject();
        }

        return new Promise((resolve , reject) => {
            bcrypt.compare(password , user.password , (err , res) => {
                if(!res) {
                    reject();
                }
                else {
                    resolve(user);
                }
            });
        });
    });
};

userSchema.pre('save' , function(next) {
    var user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10 , (err , salt) => {
            bcrypt.hash(user.password , salt , (err , hash) => {
                user.password = hash;
                next();
            });
        });
    }
    else {
        next();
    }
});

var User = mongoose.model('User', userSchema);

module.exports = {User}


