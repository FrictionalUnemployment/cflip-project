import React, { Component, useImperativeHandle } from 'react';

import './App.css';
import Popup from './components/popup.js';
import Loginpopup from './components/loginpopup.js';
import TopList from './components/TopList.js'
import Game from './components/Game.js'
import 'whatwg-fetch'



class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPopup: false,

            isLoggedin: false,
            loginPage: false,
            passwordsMatch: null,
            username: '',
            password: '',
            checkpassword: '',
            message: "Pass don't match",
            registeredUsername: ''
        };

    }

    handleOnChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        })

    }

    changeLogin() {
        this.setState({
            Login: !this.state.loginPage
        });

    }

    handleLogin() {

    }

    comparePassword() {
        if (this.state.password !== this.state.checkpassword) {

            this.setState({ passwordsMatch: false })

            //alert(this.props.passwordsMatch)
            return false; // The form won't submit
        }

        else
            this.setState({ passwordsMatch: true })
        this.register_user()
        return true; // The form will submit
    }

    togglePopup() {
        this.setState({
            showPopup: !this.state.showPopup,
            Login: this.state.LoginPage
        });
    }

    register_user = async () => {
        // data innehåller informationen som behövs i header

        const data = { username: `${this.state.username}`, password: `${this.state.password}` };

        // gör förfrågningen med fetch functionen.
        const response = await fetch('/register_user', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        // Här kollar vi på svaret som vi får av servern
        const body = await response.json();
        if (response.status !== 200) {
            // Någon har gått fel
            throw Error(body.message)
        }
        //returnerar svar från backend vilket är användarnamnet
        alert(body.express)
        return this.setState({ registeredUsername: body })
    }

    render() {
        return (
            <header className="App-header">
                <button onClick={this.togglePopup.bind(this)}>Login/register</button>

                {this.state.showPopup && !this.state.Login ?
                    <Popup
                        text='Registration'
                        closePopup={this.togglePopup.bind(this)}
                        handleOnChange={this.handleOnChange.bind(this)}
                        changeLogin={this.changeLogin.bind(this)}

                        handleSubmit={this.comparePassword.bind(this)}
                        message={this.state.passwordsMatch === false && <div>Passwords don't match!</div>
                            || this.state.passwordsMatch === true && <div>Registered!</div>}

                    />
                    : null
                }

                {this.state.Login && this.state.showPopup ?
                    <Loginpopup
                        text='Login'
                        closeLoginPopup={this.togglePopup.bind(this)}
                        handleOnChange={this.handleOnChange.bind(this)}
                        handleLoginSubmit={this.handleLogin.bind(this)}
                    />
                    : null
                } 

            </header>

        );
    }
}
class App extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="Site">
                <Header />
                <Game />
                <TopList />
            </div>

        );
    }
}



export default App;