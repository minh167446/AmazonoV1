const router = require('express').Router();
const Category = require('../models/category');
const async = require('async');

const stripe = require('stripe')('sk_test_jRTTF1Y07J0d5FfLgtxT2MQs');
const Product = require('../models/product');
const Review = require('../models/review');
const Order = require('../models/order');

const checkJWT = require('../middlewares/check-jwt');
//TEST WATERFALL
// router.get('/test', (req, res, next) => {
//     function number1(callback) {
//         var firstname ="minhminh";
//         callback(null, firstname);
//     }

//     function number2(callback) {
//         var lastname = "nguyen";
//         console.log('${firstname} ${lastname}');
//     }
//     async.waterfall([number1,number2])
// })

    //GET PRODUCT SPECIFIED
    router.get('/products', (req, res, next) => {
        const perPage = 10;
        const page = req.query.page;
        async.parallel([
            function(callback) {
                Product.count({ }, (err, count) => {
                    var totalProducts = count;
                    callback(err, totalProducts);
                });
            },
            function(callback) {
                Product.find({ })
                        .skip(perPage * page)    
                        .limit(perPage)
                        .populate('category')
                        .populate('owner')
                        .exec((err,products) => {
                            if(err) return next(err);
                            callback(err,products);
                        });
            }       
        ], function(err, results) {
            var totalProducts = results[0];
            var products = results[1];
            res.json({
                success: true,
                message: 'category',
                products: products,
                totalProducts: totalProducts,
                pages: Math.ceil(totalProducts / perPage)    
            });
        });
    });

// GET ALL CATEGORY & POST CATEGORY
router.route('/categories')
    .get((req, res, next) => {
        Category.find({}, (err, categories) => {
            res.json({
                success: true,
                message: "Successful",
                categories: categories
            }) 
        })    
    })
    .post((req, res, next) => {
        let category = new Category();
        category.name = req.body.category;
        category.save();
        res.json({
            success: true,
            message: "Successful"
        });
    });

    //GET CATEGORY SPECIFIED
router.get('/categories/:id', (req, res, next) => {
    const perPage = 3;
    const page = req.query.page;
    async.parallel([
        function(callback) {
            Product.count({ category: req.params.id }, (err, count) => {
                var totalProducts = count;
                callback(err, totalProducts);
            });
        },
        function(callback) {
            Product.find({ category: req.params.id })
                    .skip(perPage * page)    
                    .limit(perPage)
                    .populate('category')
                    .populate('owner')
                    .populate('review')
                    .exec((err,products) => {
                        if(err) return next(err);
                        callback(err,products);
                    });
        },
        function(callback) {
            Category.findOne({ _id: req.params.id }, (err, category) => {
                callback(err, category)
            });
        }       
    ], function(err, results) {
        var totalProducts = results[0];
        var products = results[1];
        var category = results[2];
        res.json({
            success: true,
            message: 'category',
            products: products,
            categoryName: category.name,
            totalProducts: totalProducts,
            pages: Math.ceil(totalProducts / perPage)    
        });
    });
});    

//GET SPECIFICED PRODUCT
router.get('/product/:id', (req, res, next) => {
  Product.findById({ _id: req.params.id })
    .populate('category')
    .populate('owner')
    .deepPopulate('reviews.owner')
    .exec((err, product) => {
        if(err) {
            res.json({
               success: false,
               message: 'Product is not found'     
            });
        } else {
            if(product) {
                res.json({
                   success: true,
                   product: product 
                });
            }
        }
    })  
});

// post review 
router.post('/review',checkJWT, (req, res, next) => {
    async.waterfall([
        function(callback) {
            Product.findOne({ _id: req.body.productId }, (err, product) => {
                if(product) {
                    callback(err, product);
                }
            });
        },
        function(product) {
            let review = new Review();
            review.owner = req.decoded.user._id;

            if(req.body.title) review.title = req.body.title;
            if(req.body.description) review.description = req.body.description;
            review.rating = req.body.rating; 

            product.reviews.push(review._id);
            product.save();
            review.save();
            res.json({
                success: true,
                message: "Successful added your comment!"
            })
        }
    ])
})

router.post('/payment',checkJWT, (req, res, next) => {
    const stripeToken = req.body.stripeToken;
    const currentCharges = Math.round(req.body.totalPrice * 100);
    
            stripe.customers
            .create({
                source: stripeToken.id
            })
            .then(function(customer) {
                return stripe.charges.create({
                    amount: currentCharges,
                    currency: 'usd',
                    customer: customer.id
                });
            })
            .then(function(charge) {    
                const products = req.body.products;
                // try {
                let order = new Order();
                order.owner = req.decoded.user._id;
                order.totalPrice = currentCharges;

                products.map(product => {
                    order.products.push({
                        product: product.product,
                        quantity: product.quantity
                    });
                });
                order.save();
                res.json({
                    success: true,
                    message: "Successfully made a payment"
                });
            });
               
});

module.exports = router;