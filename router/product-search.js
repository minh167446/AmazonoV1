const router = require('express').Router();

const algoliasearch = require('algoliasearch');
const client = algoliasearch('CMMAFFZNC3','6d08144463655fe2c6ebc5ff828b377a');

const index = client.initIndex('amazono-v1');

router.get('/',(req,res,next) => {
    if(req.query.query) {
        index.search({
            query: req.query.query,
            page: req.query.page,
        }, (err, content) => {
            res.json({
                success: true,
                message: "Here your search",
                status: 200,
                content: content,
                search_result: req.query.query
            })
        })

    }
});

module.exports = router;