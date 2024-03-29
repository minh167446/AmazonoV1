const router = require('express').Router();
const Product = require('../models/product');

// AKIAIZ2HS3XR7WNHQPWA
// aAbh/8xIQJ5pJwP4xnJ5aGQ8+erKSMWJDuOzv2tV

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new aws.S3({accessKeyId: "AKIAIZ2HS3XR7WNHQPWA" ,secretAccessKey: "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"});

const checkJWT = require('../middlewares/check-jwt');

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'webappamazono',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
          },
        key: function(req, file, cb) {
            console.log(file);
            cb(null, Date.now().toString())
        }
    })
})

router.route('/products') 
    .get(checkJWT, (req, res, next) => {
        Product.find({ owner: req.decoded.user._id })
            .populate('owner')
            .populate('category')
            .exec((err, products) => {
                if(products) {
                    res.json({
                        success: true,
                        message: "Products",
                        products: products
                    });
                }
            });
    })
    .post([checkJWT, upload.single('product_picture')], (req, res, next) => {
        let product = new Product();
        product.owner = req.decoded.user._id;
        product.category = req.body.categoryId;
        product.title = req.body.title;
        product.price = req.body.price;
        product.description = req.body.description;
        product.image = req.file.location;
        product.save();
        res.json ({
            success: true,
            message: 'Successfully added the product'
        });
    });

module.exports = router; 

