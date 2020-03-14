import React, { Component, useImperativeHandle } from 'react';
import Popup from './popup.js';
import Loginpopup from './loginpopup.js';

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
        const response = await fetch('/user/login', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        // Här kollar vi på svaret som vi får av servern
        const body = await response.text();
        console.log(body);
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
        // Ett användarnamn får bara innehålla a-z, A-Z, 0-9, - och _
        // den för vara mellan 3-15 långt
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
        return this.setState({ registeredUsername: body, 
                isLoggedin: true})
    }
 
   

    logOut() {
        return this.setState({isLoggedin: false, registeredUsername: '' })
    }
  

    render() {
     
        let button;

        if(this.state.isLoggedin === false) {
            button = <button onClick={this.togglePopup.bind(this)}>Login/Register</button>;
        } else if(this.state.isLoggedin === true) {
            button = <button onClick={this.logOut.bind(this)}>Logout</button>;
            
        }

        return (
            <header className="App-header">

            
            {button}
              

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

export default Header;