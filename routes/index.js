const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');

const bluebird = require('bluebird');
require('express-async-errors');

// TODO: 프런트에 줄때는 link를 준다

require('dotenv').config();

aws.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY
});

let s3 = bluebird.promisifyAll(new aws.S3());

/* GET home page. */
router.get('/', async (req, res, next) => {

    if (req.user === undefined) {
        res.redirect('/login');
        return;
    }

    let params = {
        Bucket: process.env.BUCKET_NAME
    };

    let response = await s3.listObjectsAsync({ Bucket: process.env.BUCKET_NAME, Prefix: req.user.ID });
    let files = [];

    for (let name of response.Contents) {
        if (name.Key === req.user.ID + '/') continue;

        params.Key = name.Key;
        let arr = name.Key.split('/');
        let fileName = arr[1];

        let url = await s3.getSignedUrlAsync('getObject', params);

        let file = {
            name: fileName,
            url: url
        };

        files.push(file);
    }

    console.log('arr: ', files);
    res.render('index', { files: files });
});

router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ message: err.message });
});

module.exports = router;
