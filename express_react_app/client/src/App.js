import React, {Component} from 'react';
import './App.css';

class App extends Component {

  state= {test_response: null};

  componentDidMount() {
    this.callTestAPI()
      .then(res => this.setState({test_response: res.express}))
      .catch(err => console.log(err));
  }

  callTestAPI = async () => {
    const response = await fetch('/test_get');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Coinflip</h1>
        </header>
        <p className="test_api_connection">{this.state.test_response}</p>
      </div>
    )
  }
}

export default App;
