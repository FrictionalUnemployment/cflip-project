const express = require('express');
const svgCaptcha = require('svg-captcha');

const router = express.Router();

router.get('/', (req, res) => {
    let captcha = svgCaptcha.create({ noise: 2, size: 4, background: '#282c34' });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(unescape(captcha.data));
});

router.post('/', (req, res) => {
    const input = req.body.input;
    //req.session.human = (input === req.session.captcha);
    //res.json({ robot: req.session.human });
    if (input === req.session.captcha) {
        req.session.human = true;
        res.json({robot: true});
    } else {
        req.session.human = false;
        res.status(400).json({robot: false});
    }
});

module.exports = router;