const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deepPopulate = require('mongoose-deep-populate')(mongoose);
const mongooseAlgolia = require('mongoose-algolia');

const ProductSchema = new Schema({
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    image: String,
    title: String,
    description: String,
    price: Number,
    created: { type: Date, default: Date.now}
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals:true }
});

ProductSchema
    .virtual('averageRating')
    .get(function() {
        var rating =0;
        if( this.reviews.length == 0 ) {
            rating =0
        } else {
            this.reviews.map((review) => {
                rating += review.rating;
            });
            rating = rating / this.review.length;
        }
        return rating;
    })

//product schema can deep populate
ProductSchema.plugin(deepPopulate);
ProductSchema.plugin(mongooseAlgolia, {
    appId: 'CMMAFFZNC3',
    apiKey: '6d08144463655fe2c6ebc5ff828b377a',
    indexName: 'amazono-v1',
    selector: '_id title image reviews description price owner created',
    populate: {
        path: 'owner reviews',
        select: 'name rating'

    },
    default: {
        author: 'unknown'
    }, 
    mappings: {
        title: function(value) {
            return `${value}`
        }
    }, virtuals: {
        averageRating: function(doc) {
            var rating = 0;
            if(doc.reviews.length == 0) {
                rating = 0;

            } else {
                doc.reviews.map((review) => {
                    rating +=review.rating;
                });
                rating = rating / doc.reviews.length;
            }
            return rating;
        }
    },
    debug: true 
})

let Model = mongoose.model('Product', ProductSchema);
Model.SyncToAlgolia();
Model.SetAlgoliaSettings({
    searchableAttributes: ['title']
});
module.exports = Model

