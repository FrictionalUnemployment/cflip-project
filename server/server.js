const Coin = require('./Coin');
const express = require('express');
const mariadb = require('mariadb');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const {check, oneOf, validationResult} = require('express-validator');

// Connectar mot våran databas
let databaseInfo = {
    user: 'coinflip',
    password: 'amirphilip9896',
    database: 'coinflip',
    host: '193.10.236.94'
};
if (process.env.local) {
    console.log("Attempting to connecect to local database.")
    databaseInfo.socketPath = '/var/lib/mysql/mysql.sock';
} else {
    console.log("Attempting to connect to remote database.")
}
let db;
mariadb.createConnection(databaseInfo)
    .then(conn => {
        console.log(`Connected to database. Connection id is ${conn.threadId}\n`);
        db = conn;
        updateuserWhitelist();
    })
    .catch(err => {
        console.log(`Error connecting to database: ${err}`);
    });


// Skapar Coin object
const coin = new Coin();
intervalID = setInterval(updateCoin, 100);

let flipsSinceStart = 0;
function updateCoin() {
    let flipped = coin.updateCoin();
    if (flipped) {
        process.stdout.write('\rCoin has flipped!\n')
        console.log(`Flips since server start: ${++flipsSinceStart}`);
        console.log(`Results: ${flipped}`);
        if (coin.potsizeTails + coin.potsizeHeads > 0) {
            coin.logChanges(flipped, db);
            updateflipWhitelist();
        } else {
            console.log("No bets placed on this flip.\n")
        }
    } else {
        coin.updateTimer();
    }
}

// Startar webservern och lyssnar
const app = express();
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
const port = 5000;
app.listen(port, () => console.log('Express is listening on port ' + port));


// Skapar listor som kollar user input så att inget ingen gör nåt dumt
let userWhitelist = [];
function updateuserWhitelist() {
    userWhitelist = [];
    db.query('SELECT Username FROM user;')
        .then(ans => {
            for (let i = 0; i < ans.length; i++) {
                userWhitelist.push(ans[i].Username);
            }
        });
}


// ==========================================================
// Här finns alla API som går att nå från frontend


function checkUser(value, {req}) {
    // Funktion för att se om användare finns, för att undvika SQL injections
    if (!userWhitelist.includes(value)) {
        throw new Error('User does not exist');
    }
    return true;
}

// Lägg till användare
app.post('/register_user', [
    check('username').isLength({ min: 1, max: 18 }).trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const user = String(req.body.username);
    const hash = crypto.createHash('sha256')
        .update(req.body.password)
        .digest('hex');

    console.log(`\nRegistering user: ${user}\nHash: ${hash}`);
    db.query('INSERT INTO user (Username, Password, Balance) ' +
        `VALUES ("${user}", "${hash}", 50);`)
        .then(ans => {
            res.json(user);
            console.log(`Registered ${user}`);
            updateuserWhitelist();
        })
        .catch(err => {
            res.status(400).json({errors: err});
            console.log('error registering user:' + err);
        });
})

// Logga in användare
app.post('/login', [
    check('username').custom(checkUser)
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const pwd = String(req.body.password);
    const user = String(req.body.username);

    const hash = crypto.createHash('sha256')
                    .update(pwd)
                    .digest('hex');

    console.log(`\nLogging in ${user}`);
    db.query(`SELECT Password FROM user WHERE Username="${user}";`)
                .then(ans => {
                    let stored_hash = ans[0].Password;
                    if (stored_hash === hash) {
                        res.json(user);
                        console.log('logged in ' + user);
                    } else {
                        res.status(401).json({errors: 'incorrect password'});
                        console.log('incorrect password: ' + user);
                    }
                })
                .catch(err => {
                    res.status(400).json({errors: err});
                    console.log('error logging in: ' + err);
                })
})

// Satsa på heads eller tails
app.post('/place_bet', [
    check('bet').isIn(['heads', 'tails']),
    check('user').custom(checkUser),
    check('amount').isInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const bet = String(req.body.bet); // 'heads' eller 'tails'
    const user = String(req.body.username);
    let amount = req.body.amount;
    
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
                res.status(400).json({errors: err});
            });
    } else {
        res.status(403).json({errors: `${user} has already bet on this flip.`});
        console.log(`${user} has existing bet on this flip. Cancelling bet.`);
    }
})

// top eller bottom lista
app.get('/stats/toplist/:top/:limit', [
    check('top').isIn(['top', 'bottom']),
    check('limit').isInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    console.log(`Getting ${req.params.top} ${req.params.limit}`);

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
             res.status(500).json({errors: err});
         });

})

// Hämtar statistik om en användare
app.get('/stats/user/:user', [
    check('user').custom(checkUser)
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    console.log(`Getting user stats for ${req.params.user}`);
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
            res.status(400).json({errors: err});
        })
})

// Hämtar statistic om en flip
app.get('/stats/flip/:FID', [
    check('FID').isInt()
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }
    
    let FID = req.params.FID;

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
                            let flip = {results: null, time: null, winners: winners, losers: losers};
                            flip.results = ans[0].Result;
                            flip.time = ans[0].Date_time;
                            res.json(flip);
                        })
                        .catch(err => {
                            console.log('Error getting flip: ' + err);
                            res.status(400).json({errors: err});
                        })

                })
                .catch(err => {
                    console.log('Error getting flip losers: ' + err);
                    res.status(400).json({errors: err});
                })
        })
        .catch(err => {
            console.log('Error getting flip winners: ' + err);
            res.status(400).json({errors: err});
        })

})