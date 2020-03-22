const express = require('express');
const crypto = require('crypto');
const { checkUser, checkNewUser } = require('./validator');
const { check, validationResult } = require('express-validator');

const router = express.Router()

router.get('/logout', (req, res) => {
    req.session.loggedIn = false;
    req.session.Username = null;
    res.send('logged out.');
})

router.post('/register', [
    check('username').custom(checkNewUser)
], (req, res) => {
    
    if (!req.session.human) {
        return res.status(403).json({errors: 'client has not completed captcha'});
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const user = String(req.body.username);
    const hash = crypto.createHash('sha256')
        .update(req.body.password)
        .digest('hex');

    req.db.query('INSERT INTO user (Username, Password, Balance) ' +
        `VALUES ("${user}", "${hash}", 50);`)
        .then(ans => {
            req.session.loggedIn = true;
            req.session.Username = user;
            res.json(user);
        })
        .catch(err => {
            res.status(400).json({ errors: err });
            console.error('error registering user:' + err);
        });
});

router.post('/login', [
    check('username').custom(checkUser)
], (req, res) => {
    
    if (!req.session.human) {
        return res.status(403).json({errors: 'client has not completed captcha'});
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const user = String(req.body.username);
    const hash = crypto.createHash('sha256')
        .update(req.body.password)
        .digest('hex');

    req.db.query(`SELECT Password FROM user WHERE Username="${user}";`)
        .then(ans => {

            if (!ans[0]) {
                let errmsg = {
                    value: user,
                    msg: 'Incorrect username',
                    param: 'username',
                    location: 'body'
                }
                res.status(401).json({ errors: errmsg });
            }

            let stored_hash = ans[0].Password;
            if (stored_hash === hash) {
                req.session.loggedIn = true;
                req.session.Username = user;
                res.json(user);
            } else {
                let errmsg = {
                    value: req.body.password,
                    msg: 'Incorrect password',
                    param: 'password',
                    location: 'body'
                }
                res.status(401).json({ errors: errmsg });
            }
        })
        .catch(err => {
            res.status(400).json({ errors: err });
            console.error('error logging in: ' + err);
        });
});

router.get('/list', (req, res) => {
    req.db.query('SELECT Username FROM user')
        .then(ans => {
            let usernames = ans.map(x => x.Username);
            res.json(usernames);
        })
        .catch(err => {
            console.error('error getting user list' + err);
            res.status(400).json({ error: err });
        });
});

module.exports = router;