const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { checkUser, checkNewUser } = require('./request-helper');
const { check, validationResult } = require('express-validator');

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.post('/register', [
    check('Username').custom(checkNewUser)
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

    console.log(`\nRegistering user: ${user}\nHash: ${hash}`);

    req.db.query('INSERT INTO user (Username, Password, Balance) ' +
        `VALUES ("${user}", "${hash}", 50);`)
        .then(ans => {
            console.log(`Registered ${user}`);
            updateUserWhitelist();
            req.session.loggedIn = true;
            req.session.Username = user;
            res.json(user);
        })
        .catch(err => {
            res.status(400).json({ errors: err });
            console.log('error registering user:' + err);
        });
});

router.post('/login', [
    check('username').custom(checkUser)
], (res, req) => {
    
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

    console.log(`\nLogging in ${user}`);
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
                console.log('logged in ' + user);
            } else {
                let errmsg = {
                    value: pwd,
                    msg: 'Incorrect password',
                    param: 'password',
                    location: 'body'
                }
                res.status(401).json({ errors: errmsg });
                console.log('incorrect password: ' + user);
            }
        })
        .catch(err => {
            res.status(400).json({ errors: err });
            console.log('error logging in: ' + err);
        });
});

router.get('/list', (req, res) => {
    console.log('\nGetting User list');
    req.db.query('SELECT Username FROM user')
        .then(ans => {
            let usernames = ans.map(x => x.Username);
            res.json(usernames);
        })
        .catch(err => {
            console.log('error getting user list' + err);
            res.status(500).json({ error: err });
        });
});

module.exports = router;