const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');
const checkJWT = require('../middlewares/check-jwt');

router.post('/signup', (req, res, next) => {
    let user = new User();
    user.email = req.body.email;
    user.name = req.body.name;
    user.password = req.body.password;
    user.avatar = user.gravatar();
    user.isSeller = req.body.isSeller;

    User.findOne({
        email: req.body.email
    }, (err, existingUser) => {
        if (existingUser) {
            res.json({
                success: false,
                message: 'Email already exist!'
            });
        } else {
            user.save();
            //generate token    
            var token = jwt.sign({
                user: user
            }, config.secret, {
                expiresIn: '7d'
            });

            res.json({
                success: true,
                message: 'Enjoy!',
                token: token
            });
        }
    })
})

router.post('/login', (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err !== null) {
            res.status(500).json({"error":err});
            return;
        } else {
            if (!user) {
                res.json({
                    success: false,
                    message: 'Authenticated failed, user not found'
                });
            } else if (user) {
                var validPassword = user.comparePassword(req.body.password);
                if (!validPassword) {
                    res.json({
                        success: false,
                        message: 'Authenticated failed, wrong password'
                    });
                }
                else {
                    var token = jwt.sign({
                        user: user
                    }, config.secret, {
                        expiresIn: '7d'
                    })
                    res.json({
                        success: true,
                        message: 'Enjoy!',
                        token: token
                    });
                }
            } 
        }
    
    });
});

router.route('/profile')
    .get(checkJWT, (req, res, next) => {
        User.findOne({ _id: req.decoded.user._id}, (err, user) => {
            if (err) return next(err);
            res.json({
                success: true,
                user: user,
                message: "Successful"
            });
        });
    })
    .post(checkJWT, (req, res, next) => {
        User.findOne({
            _id: req.decoded.user._id
        }, (err, user) => {
            if (err) return next(err);
            if (req.body.name) user.name = req.body.name;
            if (req.body.email) user.email = req.body.email;
            if (req.body.password) user.password = req.body.password;
            user.isSeller = req.body.isSeller;
            user.save();
            res.json({
                success: true,
                message: "Successfully edited your profile!"
            });
        })
    });

router.route('/address')
    .get(checkJWT, (req, res, next) => {
        User.findOne({
            _id: req.decoded.user._id
        }, (err, user) => {
            res.json({
                success: true,
                address: user.address,
                message: "Successful"
            });
        });
    })
    .post(checkJWT, (req, res, next) => {
        User.findOne({
            _id: req.decoded.user._id
        }, (err, user) => {
            if (err) return next(err);
            if(req.body.addr1) user.address.addr1 = req.body.addr1;
            if(req.body.addr2) user.address.addr2 = req.body.addr2;
            if(req.body.city) user.address.city = req.body.city;    
            if(req.body.state) user.address.state = req.body.state;    
            if(req.body.country) user.address.country = req.body.country;    
            if(req.body.postalCode) user.address.postalCode = req.body.postalCode;
            user.save();
            res.json({
                success: true,
                message: "Successfully edited your address!"
            });
        })
    });

module.exports = router;