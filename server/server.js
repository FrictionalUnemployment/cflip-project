const express = require('express');
const session = require('express-session');
const stats = require('./routers/stats');
const user = require('./routers/user');
const captcha = require('./routers/captcha');
const bet = require('./routers/coin');
const middleware = require('./middleware');

// Startar webservern och lyssnar
const app = express();
app.use(session({ secret: 'coinflipper', cookie: {} }));
app.use(middleware);

app.use('/stats', stats);
app.use('/user', user);
app.use('/captcha', captcha);
app.use('/coin', bet);

const port = 5000;
app.listen(port, () => console.log('Express is listening on port ' + port));