const express = require('express');
const svgCaptcha = require('svg-captcha');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.get('/', (req, res) => {
    let captcha = svgCaptcha.create({ noise: 4, size: 5, background: '#282c34' });
    req.session.captcha = captcha.text;
    console.log('get id: ' + req.session.id);
    res.type('svg');
    res.send(unescape(captcha.data));
});

router.post('/', (req, res) => {
    const input = String(req.body.input);
    req.session.human = (input === req.session.captcha);
    console.log('post id: ' + req.session.id)
    res.json({ robot: req.session.human });
});

module.exports = router;