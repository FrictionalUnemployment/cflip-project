const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

let db;
let coin;
let userWhitelist;

function init(database, flipper) {
    db = database;
    coin = flipper;
    updateUserWhitelist();
} module.exports.init = init;

function updateUserWhitelist() {
    db.query('SELECT Username FROM user;')
        .then(ans => {
            userWhitelist = ans.map(user => user.Username);
        });
}

function checkUser(value, { req }) {
    // Funktion för att se om användare finns, för att undvika SQL injections
    if (!userWhitelist.includes(value)) {
        throw new Error('User does not exist');
    }
    return true;
} module.exports.checkUser = checkUser;

function checkNewUser(value, { req }) {
    // Regex som säger att strängen får bara innehålla
    // a-z, A-Z, 0-9, _, -
    // Strängen måste vara mellan 3-15 långt
    let re = /^[a-zA-Z0-9_-]{3,15}$/;
    if (!re.test(value)) {
        throw new Error('Illegal username');
    }
    return true;
} module.exports.checkNewUser = checkNewUser;

function test(req, res) {
    console.log(req);
    console.log('here');
    res.send('hello there');
} module.exports.test = test;

function captchaImage(req, res) {
    let captcha = svgCaptcha.create({ noise: 4, size: 5 });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(toString(captcha.data));
} module.exports.captchaImage = captchaImage;

function captchaParse(req, res) {
    const input = String(req.body.input);
    req.session.human = (input === req.session.captcha);
    res.send(req.session.human);
} module.exports.captchaParse = captchaParse;

function registerUser(req, res) {
    // Ta bort detta när amir är klar med captcha
    /*
    if (!req.session.human) {
        return res.status(403).json({errors: 'client has not completed captcha'});
    }
    */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const user = String(req.body.username);
    const hash = crypto.createHash('sha256')
        .update(req.body.password)
        .digest('hex');

    console.log(`\nRegistering user: ${user}\nHash: ${hash}`);

    db.query('INSERT INTO user (Username, Password, Balance) ' +
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

} module.exports.registerUser = registerUser;

function login(req, res) {
    //Lägg till detta när amir är klar med captcha
    /*
    if (!req.session.human) {
        return res.status(403).json({errors: 'client has not completed captcha});
    }
    */

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const user = String(req.body.username);
    const hash = crypto.createHash('sha256')
        .update(req.body.password)
        .digest('hex');

    console.log(`\nLogging in ${user}`);
    db.query(`SELECT Password FROM user WHERE Username="${user}";`)
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
        })
} module.exports.login = login;

function userList(req, res) {
    console.log('\nGetting User list');
    db.query('SELECT Username FROM user')
        .then(ans => {
            let usernames = ans.map(x => x.Username);
            res.json(usernames);
        })
        .catch(err => {
            console.log('error getting user list' + err);
            res.status(500).json({ error: err });
        })
} module.exports.userList = userList;

function placeBet(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    if (!req.session.loggedIn) {
        return res.status(401).json({ errors: 'client is not logged in' });
    }

    const bet = String(req.params.bet); // 'heads' eller 'tails'
    const user = req.session.Username;
    let amount = req.params.amount;

    console.log(`\nPlacing bet for ${user}, for ${amount}, on ${bet}`);
    if (!coin.hasExistingBet(user)) {
        db.query(`SELECT Balance FROM user WHERE Username="${user}"`)
            .then(ans => {
                if (amount > ans[0].Balance) amount = ans[0].Balance;

                if (bet === 'heads') {
                    coin.betOnHeads(user, amount);
                } else if (bet === 'tails') {
                    coin.betOnTails(user, amount);
                }
                res.json(`Bet placed by ${user} on ${bet} for ${amount}`);
                console.log(`Bet placed by ${user} on ${bet} for ${amount}.`);
            })
            .catch(err => {
                console.log('Erro getting user balance: ' + err);
                res.status(400).json({ errors: err });
            });
    } else {
        res.status(403).json({ errors: { msg: `${user} has already bet on this flip.` } });
        console.log(`${user} has existing bet on this flip. Cancelling bet.`);
    }
} module.exports.placeBet = placeBet;

function userStatsList(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    console.log(`\nGetting ${req.params.top} ${req.params.limit}`);

    let order = (req.params.top === 'bottom') ? 'ASC' : 'DESC';
    db.query(`SELECT
                Username,
                Balance,
                (SELECT COUNT(*) FROM winner WHERE winner.UID=user.UID) as Wins,
                (SELECT COUNT(*) FROM loser WHERE loser.UID=user.UID) as Losses
             FROM user
             ORDER BY Balance ${order} 
             LIMIT ${req.params.limit}`)
        .then(ans => {
            res.json(ans);
        })
        .catch(err => {
            console.log("Error getting top list");
            res.status(500).json({ errors: err });
        });
} module.exports.userStatsList = userStatsList;

function userStat(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    console.log(`\nGetting user stats for ${req.params.user}`);
    db.query(`SELECT
                user.Username,
                user.Balance,
                (SELECT GROUP_CONCAT(DISTINCT FID) FROM winner WHERE winner.UID=user.UID) as Wins,
                (SELECT GROUP_CONCAT(DISTINCT FID) FROM loser WHERE loser.UID=user.UID) as Losses
             FROM user
             WHERE Username='${req.params.user}'`)
        .then(ans => {
            ans[0].Wins = JSON.parse('[' + ans[0].Wins + ']');
            ans[0].Losses = JSON.parse('[' + ans[0].Losses + ']');
            res.json(ans[0]);
        })
        .catch(err => {
            console.log('Error getting user stats ' + err);
            res.status(400).json({ errors: err });
        })
} module.exports.userStat = userStat;

function flipStat(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let FID = req.params.FID;
    console.log('\nGetting stats for flip: ' + FID);

    // Om du lyckas få ihop alla 3 queries här i en är du en gud
    // Jag försökte i en hel dag innan jag gav upp

    // Query för att hämta alla vinnare och hur mycket dom har satsat
    db.query(`SELECT DISTINCT
    CONCAT('{', '"', user.Username, '"', ':', winner.Winnings, '}')
    FROM user
        JOIN winner
        ON user.UID=winner.UID
    WHERE FID=${FID}`)
        .then(ans => {
            let winners = [];
            for (let i = 0; i < ans.length; i++) {
                for (let prop in ans[i]) {
                    winners.push(JSON.parse(ans[i][prop]));
                }
            }
            // Query för att hämta alla förlorare och hur mycket dom har satsat
            db.query(`SELECT DISTINCT
            CONCAT('{', '"', user.Username, '"', ':', loser.losses, '}')
            FROM user
                JOIN loser
                ON user.UID=loser.UID
            WHERE FID=${FID}`)
                .then(ans => {
                    let losers = [];
                    for (let i = 0; i < ans.length; i++) {
                        for (let prop in ans[i]) {
                            losers.push(JSON.parse(ans[i][prop]));
                        }
                    }
                    // Query för att hämta resultat och tid för flippen
                    db.query(`SELECT Result, Date_time FROM flip WHERE FID=${FID}`)
                        .then(ans => {
                            let flip = { results: null, time: null, winners: winners, losers: losers };
                            flip.results = ans[0].Result;
                            flip.time = ans[0].Date_time;
                            res.json(flip);
                        })
                        .catch(err => {
                            console.log('Error getting flip: ' + err);
                            res.status(400).json({ errors: err });
                        })

                })
                .catch(err => {
                    console.log('Error getting flip losers: ' + err);
                    res.status(400).json({ errors: err });
                })
        })
        .catch(err => {
            console.log('Error getting flip winners: ' + err);
            res.status(400).json({ errors: err });
        })
} module.exports.flipStat = flipStat;