let db;
let userWhitelist;

function init(database) {
    db = database;
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
    setTimeout(updateUserWhitelist, 100);
    return true;
} module.exports.checkNewUser = checkNewUser;
