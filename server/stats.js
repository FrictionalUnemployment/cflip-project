const express = require('express');
const { checkUser } = require('./request-handler');
const { check, validationResult } = require('express-validator');

const router = express.Router();

let db;
router.init = function (database) {
    db = database;
}

router.get('/toplist/:top/:limit', [
    check('top').isIn(['top', 'bottom']),
    check('limit').isInt()
], (req, res) => {
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
});

router.get('/user/:user', [
    check('user').custom(checkUser)
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    console.log(`\nGetting user stats for ${req.params.user}`);
    db.query(`SELECT
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
})

module.exports = router;