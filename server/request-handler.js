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


