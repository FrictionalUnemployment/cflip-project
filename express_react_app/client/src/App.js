import React, { Component, useImperativeHandle } from 'react';
import logo from './logo512.png';
import './App.css';
import Popup from './components/popup.js';
import Loginpopup from './components/loginpopup';
import 'whatwg-fetch'

class App extends Component {
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
            <div>

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

                    <img src={logo} className="App-logo" alt="logo" />

                </header>
            </div>

        );
    }
}

function TopItem(props) {
    return (
        <li className="topitem">{this.props.value}</li>
    );
}

class TopList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            topFive: Array(5).fill(null)
        };
    }

    renderItem(itm) {
        return <TopItem value={itm} />;
    }

    render() {
        return (
            <div className="toplist">
                <ol>
                    {this.renderItem(0)}
                    {this.renderItem(1)}
                    {this.renderItem(2)}
                    {this.renderItem(3)}
                    {this.renderItem(4)}
                </ol>                
            </div>
        );
    }
}

export default App;