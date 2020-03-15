import React, { Component, useImperativeHandle } from 'react';
import Popup from './popup.js';
import Loginpopup from './loginpopup.js';
import 'whatwg-fetch'
import Statistics from './Statistics.js';

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
            registeredUsername: '',
            captcha: '',
            svgData: '',
            balance: ''

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

    handleLoginCaptcha() {
        this.checkCaptcha()
        .then(result => {
       if(result === true) this.handleLogin();
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
            // Någon har gått fel
            throw Error(body.message)
        }
        //returnerar svar från backend vilket är användarnamnet
       
        return this.setState({ registeredUsername: body, isLoggedin: true })
    }

    comparePassword() {
       
        if (this.state.password !== this.state.checkpassword) {

            this.setState({ passwordsMatch: false })

            //alert(this.props.passwordsMatch)
            return false; // The form won't submit
        }

        else
            this.setState({ passwordsMatch: true })
            
            this.checkCaptcha()
             .then(result => {
            if(result === true) this.register_user();
            });
     
      

    }

    togglePopup() {
        this.setState({
            showPopup: !this.state.showPopup,
            Login: this.state.LoginPage
        });
    }

    checkCaptcha = async () => {
       
        const captchatext = { input: `${this.state.captcha}` };
        const response = await fetch('/captcha', {
            method: 'POST',
            body: JSON.stringify(captchatext),
            headers: {'Accept':'application/json', 'Content-Type': 'application/json'}
        });
       const data = await response.json();
    //   if(data.robot) {
        //return this.register_user();
        
        return data.robot
      // }
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
        return this.setState({ registeredUsername: body, 
                isLoggedin: true})
    }
 
   

    logOut() {
        fetch('/users/logout')
            .then(ans => {
                return this.setState({isLoggedin: false, registeredUsername: '', balance: '' })
            })
    }

    async getUserBalance(user)  {  
       
        const response = await fetch('/stats/user/' + user)
        const data = await response.json();
        
        const balance = JSON.stringify(data.Balance);
        return balance
      }
  

    render() {
       
        
        let button;
        
        
        if(this.state.isLoggedin === false) {
            //this.togglePopup.bind(this)
            button = <button onClick={this.togglePopup.bind(this)}>Login/Register</button>;
        } else if(this.state.isLoggedin === true) {
            button = <button onClick={this.logOut.bind(this)}>Logout</button>;
           this.getUserBalance(this.state.registeredUsername)
            .then(result => {
            this.setState({balance : result})
            
            });
        }
      

        return (
            <header className="App-header">

            <div style={{position: 'absolute', top: '8px', right: '16px'}}>
            <h1>{this.state.balance}</h1>
            <h1>{this.state.registeredUsername}</h1>
            {button}
            

            </div>

            
                
                
                
           <Statistics />
            

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
                        handleLoginSubmit={this.handleLoginCaptcha.bind(this)}
                    />
                    : null
                } 

            </header>

        );
    }
}
export default Header;