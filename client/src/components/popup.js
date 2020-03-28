import React from 'react';
import './../styles/loginpopup.css';
import ReactHtmlParser from 'react-html-parser';
class Popup extends React.Component {
  constructor(props) {
    super(props)
    this.state = { svgData: '' };
  }
  //De första vi gör är att hämta en captcha
  componentDidMount() {
    this.getCaptcha();
  }
  //Hanterar alla inputs som fås av klienten och skickas vidare till header.js som en prop.
  handleChange = event => {
    event.preventDefault()
    this.props.handleOnChange(event)
  }
  //Hämtar captchan från servern och stoppas in i en state
  getCaptcha = async () => {
    this.props.handleRefresh();
    const response = await fetch('/captcha')
    const data = await response.text();
    this.setState({ svgData: data });
  }

  render() {
    //Vi kollar ifall captchan behöver refreshas hämtar från parent komponent refresh state.
    if (this.props.refresh) {
      this.getCaptcha();
    }
    return (
      <div className="popup">
        <button className="closeButton" onClick={this.props.closePopup}>X</button>
        <div className="popup_real_inner">
          <div>
            <h4>{this.props.text}</h4>
            <button className="login-change-button"
              onClick={this.props.changeLogin}>
              Login here!
              </button>
            <div style={{ 
              color: "red" 
              }}>
              <p>{this.props.displayErrorMessage}</p>
            </div>
            <form onSubmit={e => e.preventDefault()}>
              <input
                placeholder="Enter username"
                type="text"
                name="username"
                onChange={this.handleChange}
              />
              <br />
              <input
                type="password"
                placeholder="Enter password"
                name="password"
                onChange={this.handleChange}
              />
              <br />
              <input
                type="password"
                name="checkpassword"
                placeholder="Enter password again"
                onChange={this.handleChange}
              />
              <br />
              <div className="captchaimage"> {ReactHtmlParser(this.state.svgData)} </div>
              <input
                type="text"
                name="captcha"
                placeholder="Enter captcha code"
                onChange={this.handleChange}
              />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <br />
                <button className="submit" onClick={this.props.handleSubmit}>Submit</button>
              </div>
              <h3>{this.props.message}</h3>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;