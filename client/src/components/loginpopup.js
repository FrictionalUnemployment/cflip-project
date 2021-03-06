import React from "react";
import './../styles/loginpopup.css';
import ReactHtmlParser from "react-html-parser";
class Loginpopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      svgData: ""
    };
  }
  //Visa captcha när du öppnar popupen.
  componentDidMount() {
    this.getCaptcha();
  }

  handleChange = event => {
    event.preventDefault();
    this.props.handleOnChange(event);
  };
  // Hämtar captcha och sparar det i svgData för att sedan rendera som HTML-kod.
  getCaptcha = async () => {
    this.props.handleRefresh();
    const response = await fetch("/captcha");
    const data = await response.text();
    this.setState({ svgData: data });

  };

  render() {
    if (this.props.refresh) {
      this.getCaptcha();
    }

    return (
      <div className="popup">
        <button className="closeButton" onClick={this.props.closeLoginPopup}>X</button>
        <div className="popup_real_inner">
          <div>
            <h4>{this.props.text}</h4>
            <button className="login-change-button" 
            onClick={this.props.changeLogin}>
              Register here!
            </button>
            <div style={{ color: "red", justifyContent: "center", }}>
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
              <div></div>
              <div className="captchaimage"> {ReactHtmlParser(this.state.svgData)} </div>
              <input
                type="text"
                name="captcha"
                placeholder="Enter captcha code"
                onChange={this.handleChange}
              />
              <br />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <button className="submit" onClick={this.props.handleLoginSubmit}>
                  Submit
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
export default Loginpopup;
