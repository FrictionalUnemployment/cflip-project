const express = require('express');
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const stats = require('./routers/stats');
const user = require('./routers/user');
const captcha = require('./routers/captcha');
const bet = require('./routers/coin');
const middleware = require('./middleware');

const privatekey = fs.readFileSync('ssl/privkey.pem');
const cert = fs.readFileSync('ssl/fullchain.pem');

// Startar webservern och lyssnar
const credentials = {key: privatekey, cert: cert};
const app = express();

app.get('/', (req, res) => res.sendFile('views/api.html', {root:__dirname}));

app.use(session({ secret: 'coinflipper', cookie: {} }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(middleware);

app.use('/stats', stats);
app.use('/user', user);
app.use('/captcha', captcha);
app.use('/coin', bet);

const port = 5000;
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port);
console.log('Express is listening on port ' + port);
//app.listen(port, () => console.log('Express is listening on port ' + port));