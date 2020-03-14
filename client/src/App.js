import React, { Component, useImperativeHandle } from 'react';

import './App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js'
import Game from './components/Game.js'
import 'whatwg-fetch'

class App extends Component {

    render() {
        return (
            <div className="Site">
                <Header />
                <Game />
                <Footer />
            </div>

        );
    }
}

export default App;