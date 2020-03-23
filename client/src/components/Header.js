import React, { Component } from 'react';
import Popup from './popup.js';
import Loginpopup from './loginpopup.js';
import 'whatwg-fetch'
import Statistics from './Statistics.js';
import './header.css';

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPopup: false,
            stats: false,
            isLoggedin: false,
            loginPage: true,
            passwordsMatch: null,
            username: '',
            password: '',
            checkpassword: '',
            registeredUsername: '',
            captcha: '',
            svgData: '',
            errorMessage: '',
            refreshCaptcha: false
        };

    }

    componentDidMount() {
        if (sessionStorage.getItem('username') !== null &&
            sessionStorage.getItem('loggedIn') !== null) {
            const username = sessionStorage.getItem('username');
            this.setState({ registeredUsername: username, isLoggedin: true });
            this.getUserBalance(username);
            this.timer = setInterval(() => this.getUserBalance(username), 30000);
        }
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        this.timer = null;
    }

    handleOnChange(event) {

        this.setState({
            [event.target.name]: event.target.value
        })

    }

    changeLogin() {
        this.setState({
            loginPage: !this.state.loginPage
        });

    }

    handleLoginCaptcha() {
        this.checkCaptcha()
            .then(result => {
                if (result === true) this.handleLogin();
            });

    }

    handleLogin = async () => {
        // data innehåller informationen som behövs i header

        const data = { username: `${this.state.username}`, password: `${this.state.password}` };

        // gör förfrågningen med fetch functionen.
        const response = await fetch('/user/login', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        // Här kollar vi på svaret som vi får av servern
        const body = await response.json();
        if (response.status !== 200) {
            if (response.status === 422 && body.errors[0].msg === "User does not exist") {
                return this.setState({ errorMessage: body.errors[0].msg })
            } else if (response.status === 400) {
                return this.setState({ errorMessage: "Password incorrect!" })
            }

        }


        //returnerar svar från backend vilket är användarnamnet

        this.setState({ registeredUsername: body, isLoggedin: true, errorMessage: '' });
        this.getUserBalance(this.state.registeredUsername);
        sessionStorage.setItem('username', body);
        sessionStorage.setItem('loggedIn', 'yes');
        this.timer = setInterval(() => this.getUserBalance(this.state.registeredUsername), 30000);
        this.togglePopup();
    }



    comparePassword() {

        if (this.state.password !== this.state.checkpassword) {
            this.setState({ passwordsMatch: false })

            //alert(this.props.passwordsMatch)
            return false; // The form won't submit
        } else
            this.setState({ passwordsMatch: true })

        this.checkCaptcha()
            .then(result => {
                if (result === true) this.register_user();
            });
    }

    execPopup() {
        this.setState({
            loginPage: true
        });
        this.togglePopup();
    }

    togglePopup() {
        this.setState({
            showPopup: !this.state.showPopup,
        });
    }

    checkCaptcha = async () => {

        const captchatext = { input: `${this.state.captcha}` };
        const response = await fetch('/captcha', {
            method: 'POST',
            body: JSON.stringify(captchatext),
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.status !== 200) {
            return this.setState({ errorMessage: "Wrong captcha!", refreshCaptcha: true });
        }
        return data.robot

    }

    register_user = async () => {
        // data innehåller informationen som behövs i header

        const data = { username: `${this.state.username}`, password: `${this.state.password}` };

        // gör förfrågningen med fetch functionen.
        const response = await fetch('/user/register', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        //  Här kollar vi på svaret som vi får av servern
        const body = await response.json();

        if (response.status !== 200) {
            // Någon har gått fel
            throw Error(body.message)
        }

        //returnerar svar från backend vilket är användarnamnet
        return this.setState({
            registeredUsername: body,
            isLoggedin: true
        })
    }

    logOut() {
        clearInterval(this.timer);
        this.timer = null;
        fetch('/user/logout')
            .then(ans => {
                return this.setState({ isLoggedin: false, registeredUsername: '', balance: '' })
            })
        sessionStorage.clear();
    }

    async getUserBalance(user) {

        const response = await fetch('/stats/user/' + user)
        const data = await response.json();

        const balance = JSON.stringify(data.Balance);
        this.setState({ balance: balance });
    }

    showStats = () => {
        this.setState({ stats: true });
        this.togglePopup();
    }

    closeStats = () => {
        this.setState({ stats: false });
        this.togglePopup();
    }
    handleRefresh = () => {
        this.setState({ refreshCaptcha: false });
    }



    render() {
        let button;

        if (!this.state.isLoggedin && !this.state.showPopup) {
            //this.togglePopup.bind(this)
            button = <button className="login-button" onClick={this.execPopup.bind(this)}>Login/Register</button>;
        } else if (this.state.isLoggedin === true) {
            button = <button className="login-button" onClick={this.logOut.bind(this)}>Logout</button>;
        }

        let balString = this.state.isLoggedin ? "Balance: " + this.state.balance + " -|" : null;
        let userString = this.state.isLoggedin ? "- Logged in as: " + this.state.registeredUsername : null;

        // style={{position: 'absolute', top: '8px', right: '16px'}}
        return (
            <header className="App-header">
                <div>
                    <h3 id="title">cflip.app</h3>
                 </div>
                <div>
                    {this.state.showPopup ? null :
                        <button className="stats-button" onClick={this.showStats}>Statistics</button>}
                </div>

                <div id="userinfo">
                    <p>{balString}</p>
                    <p>{userString}</p>
                </div>
                {button}
                {(this.state.showPopup && this.state.stats) ?
                    <Statistics
                        closeStats={this.closeStats}
                    />
                    : null
                }
                {this.state.showPopup && !this.state.loginPage && !this.state.stats ?
                    <Popup
                        text='Register'
                        refresh={this.state.refreshCaptcha}
                        handleRefresh={this.handleRefresh.bind(this)}
                        closePopup={this.togglePopup.bind(this)}
                        displayErrorMessage={this.state.errorMessage}
                        handleOnChange={this.handleOnChange.bind(this)}
                        changeLogin={this.changeLogin.bind(this)}
                        handleSubmit={this.comparePassword.bind(this)}
                        message={(this.state.passwordsMatch === false && <div>Passwords don't match!</div>)
                            || (this.state.passwordsMatch === true && this.state.registeredUsername !== "" && <div>You're registered! {this.state.registeredUsername} </div>)}
                    />
                    : null}

                {this.state.registeredUsername !== undefined && this.state.loginPage && this.state.showPopup && !this.state.stats ?
                    <Loginpopup
                        refresh={this.state.refreshCaptcha}
                        handleRefresh={this.handleRefresh.bind(this)}
                        text='Login'
                        displayErrorMessage={this.state.errorMessage}
                        closeLoginPopup={this.togglePopup.bind(this)}
                        changeLogin={this.changeLogin.bind(this)}
                        handleOnChange={this.handleOnChange.bind(this)}
                        handleLoginSubmit={this.handleLoginCaptcha.bind(this)}
                    />
                    : null
                }

            </header>

        );
    }
}
export default Header;