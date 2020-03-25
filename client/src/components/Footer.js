import React, { Component } from 'react';
import BotList from './BotList.js';
import TopList from './TopList.js';
import './../styles/Footer.css';

class Footer extends Component {

    render() {
        return (
            <div className="footer">
                <TopList />
                <BotList />
            </div>

        );
    }
}

export default Footer;