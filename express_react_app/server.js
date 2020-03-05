const express = require('express');
const mariadb = require('mariadb');

mariadb.createConnection({
    user:'coinflip',
    password: 'amirphilip9896',
    host: '193.10.236.94',
    database: 'coinflip'
    })
    .then(conn => {
        console.log("Connected to database. Connection id is " + conn.threadId);
    })
    .catch(err => {
        console.log('error connecting to database: ' + err);
    });


const app = express();
const port = process.env.PORT || 5000; // Om port inte sätts när man startar så är den 5000

app.listen(port, () => console.log('Listening on port ' + port));

app.get('/test_get', (req, res) => {
    res.send({express: 'test_get successful'});
})