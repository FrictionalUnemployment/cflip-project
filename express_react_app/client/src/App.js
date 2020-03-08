import React, { Component, useImperativeHandle } from 'react';
import logo from './logo512.png';
import './App.css';
import Popup from './components/popup.js';
import Loginpopup from './components/loginpopup';
import 'whatwg-fetch'

function TopItem(props) {
    return (
        <li className="topitem">{props.value}</li>
    );
}

class TopList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            topFive: ["Hejsan", "Bester", "BENLPS", "HEMSKT", "BAJS"]
        };
    }

    renderItem(itm) {
        return <TopItem value={this.state.topFive[itm]} />;
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

class BetChoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: 0
        }
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.onClick(this.props.suit, this.state.amount);
    }

    render() {
        return (
            <button className="s" onClick={this.handleClick}>Bet {this.props.suit}!</button>
        )
    }
}

class Game extends Component {

    placeBet = async (suit, amount) => {
        // Här sätts vad, vem och hur mycket
        const data = {bet: suit, username: "test_user", amount: amount};

        const response = await fetch('/place_bet', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Accept':'application/json', 'Content-Type': 'application/json'}
        });

        const body = await response.json();
        if (response.status !== 200) {
            throw Error(body.message);
        }
        return body.express;
    }

    handleClick(suit, amount) {
        let res = this.placeBet(suit, amount);
        console.log(res);

    }

    render() {
        return (
            <div className="App-game">
                <div>
                    <BetChoice suit="Heads" onClick={this.handleClick} />
                    <img src={logo} className="App-logo" alt="logo" />
                    <BetChoice suit="Tails" onClick={this.handleClick} />
                </div>
            </div>
        );
    }
}

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

    handleLogin = async () => {
        // data innehåller informationen som behövs i header

        const data = { username: `${this.state.username}`, password: `${this.state.password}` };

        // gör förfrågningen med fetch functionen.
        const response = await fetch('/login', {
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
        
        return this.setState({ registeredUsername: body.express, isLoggedin: true })
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
        
        return this.setState({ registeredUsername: body.express})
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
                            || this.state.passwordsMatch === true && this.state.registeredUsername !== undefined && <div>You're registered! {this.state.registeredUsername} </div>}

                    />
                    : null
                }

                {this.state.registeredUsername !== undefined && this.state.Login && this.state.showPopup ?
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