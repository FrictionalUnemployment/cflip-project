import React, { Component, useImperativeHandle } from 'react';

import './App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js'
import Game from './components/Game.js'
import Statistics from './components/Statistics';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: 1
        };
    }

    setGame = () => {
        this.setState({mode: 1});
        console.log("CHanging mode to 1");
    }

    setStats = () => {
        this.setState({mode: 2});
        console.log("Changing mode to 2");
    }

    render() {
        if (this.state.mode == 1) {
            return (
                <div className="Site">
                    <Header setGame={this.setGame} setStats={this.setStats}/>
                    <Game />
                    <Footer />
                </div>

            );
        } else if (this.state.mode == 2) {
            return (
                <div className="Site">
                    <Header setGame={this.setGame} setStats={this.setStats}/>
                    <Statistics />
                    <Footer />
                </div>
            );
        }
    }
}

export default App;