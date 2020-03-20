const express = require('express');
const { checkUser } = require('./validator');
const { check, validationResult } = require('express-validator');

const router = express.Router();


router.get('/toplist/:top/:limit', [
    check('top').isIn(['top', 'bottom']),
    check('limit').isInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    console.log(`\rGetting ${req.params.top} ${req.params.limit}`);

    let order = (req.params.top === 'bottom') ? 'ASC' : 'DESC';
    req.db.query(`SELECT
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
});

router.get('/user/:user', [
    check('user').custom(checkUser)
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    console.log(`\rGetting user stats for ${req.params.user}`);
    req.db.query(`SELECT
                user.Username,
                user.Balance,
                (SELECT
                    GROUP_CONCAT(DISTINCT FID)
                FROM winner
                WHERE winner.UID=user.UID) as Wins,
                (SELECT
                    GROUP_CONCAT(DISTINCT FID)
                FROM loser
                WHERE loser.UID=user.UID) as Losses
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
        });
});

router.get('/flip/:FID', [
    check('FID').isInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let FID = req.params.FID;

    // Om du lyckas få ihop alla 3 queries här i en är du en gud
    // Jag försökte i en hel dag innan jag gav upp

    // Query för att hämta alla vinnare och hur mycket dom har satsat
    req.db.query(`SELECT DISTINCT
    CONCAT('{', '"', user.Username, '"', ':', winner.Winnings, '}')
    FROM user
        JOIN winner
        ON user.UID=winner.UID
    WHERE FID=${FID}`)
        .then(ans => {
            let winners = {};
            for (let i = 0; i < ans.length; i++) {
                for (let prop in ans[i]) {
                    //winners.push(JSON.parse(ans[i][prop]));
                    winners = {...winners, ...JSON.parse(ans[i][prop])};
                }
            }
            // Query för att hämta alla förlorare och hur mycket dom har satsat
            req.db.query(`SELECT DISTINCT
            CONCAT('{', '"', user.Username, '"', ':', loser.losses, '}')
            FROM user
                JOIN loser
                ON user.UID=loser.UID
            WHERE FID=${FID};`)
                .then(ans => {
                    let losers = {};
                    for (let i = 0; i < ans.length; i++) {
                        for (let prop in ans[i]) {
                            //losers.push(JSON.parse(ans[i][prop]));
                            losers = {...losers, ...JSON.parse(ans[i][prop])};
                        }
                    }
                    // Query för att hämta resultat och tid för flippen
                    req.db.query(`SELECT Result, Date_time FROM flip WHERE FID=${FID};`)
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
});

module.exports = router;