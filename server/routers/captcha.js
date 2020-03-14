const express = require('express');
const svgCaptcha = require('svg-captcha');

const router = express.Router();

router.get('/', (req, res) => {
    let captcha = svgCaptcha.create({ noise: 4, size: 5, background: '#282c34' });
    req.session.captcha = captcha.text;
    console.log('session id: ' + req.session.id);
    res.type('svg');
    res.send(unescape(captcha.data));
});

router.post('/', (req, res) => {
    const input = req.body.input;
    req.session.human = (input === req.session.captcha);
    res.json({ robot: req.session.human });
});

module.exports = router;