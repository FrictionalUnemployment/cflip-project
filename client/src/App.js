import React, { Component } from 'react';

import './styles/App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js'
import Game from './components/Game.js'
import Statistics from './components/Statistics';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            balance: 0,
            mode: 1
        }
    }

    setGame = () => {
        this.setState({mode: 1});
    }

    setStats = () => {
        this.setState({mode: 2});
    }

    setBalance = value => {
        this.setState({balance: value});
    }

    getBalance = () => {
        return this.state.balance;
    }

    render() {
                if (this.state.mode == 1) {
                return (
                    <div className="Site">
                    <Header setMode={this.state.mode} setGame={this.setGame} setStats={this.setStats} getBalance={this.getBalance} setBalance={this.setBalance}/>
                    <Game getBalance={this.getBalance} />
                    <Footer />
                    </div>
                    );
            }else if (this.state.mode == 2) {
                return (
                    <div className="Site">
                    <Header setMode={this.state.mode} setGame={this.setGame} setStats={this.setStats} getBalance={this.getBalance} setBalance={this.setBalance}/>
                    <Statistics />
                    <Footer />
                    </div>  
                );
            }
        
    }
}

export default App;