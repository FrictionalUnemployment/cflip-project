const express = require('express');
const { check, validationResult } = require('express-validator')

const router = express.Router();

router.get('/info', (req, res) => {
    res.json(req.coin.bets);
})

router.post('/bet/:bet/:amount', [
    check('bet').isIn(['heads', 'tails']),
    check('amount').isInt()
], (req, res) => {
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

    console.log(`\rPlacing bet for ${user}, for ${amount}, on ${bet}`);
    if (!req.coin.hasExistingBet(user)) {
        req.db.query(`SELECT Balance FROM user WHERE Username="${user}"`)
            .then(ans => {
                if (amount > ans[0].Balance) amount = ans[0].Balance;

                req.coin.placeBet(user, amount, bet);
                res.json(`Bet placed by ${user} on ${bet} for ${amount}`);
                console.log(`Bet placed by ${user} on ${bet} for ${amount}.`);
            })
            .catch(err => {
                console.log('Error getting user balance: ' + err);
                res.status(400).json({ errors: err });
            });
    } else {
        res.status(403).json({ errors: { msg: `${user} has already bet on this flip.` } });
        console.log(`${user} has existing bet on this flip. Cancelling bet.`);
    }
});

module.exports = router;