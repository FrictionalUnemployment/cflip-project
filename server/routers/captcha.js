const express = require('express');
const svgCaptcha = require('svg-captcha');

const router = express.Router();

router.get('/', (req, res) => {
    let captcha = svgCaptcha.create({ noise: 4, size: 5 });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(captcha.data);
});

router.post('/', (req, res) => {
    const input = String(req.body.input);
    req.session.human = (input === req.session.captcha);
    res.json(req.session.human);
});

module.exports = router;