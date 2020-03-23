import React from 'react';
import './style.css';
import ReactHtmlParser from 'react-html-parser';
class Popup extends React.Component {
  constructor(props) {
    super(props)
    this.state = { svgData: '' };
  }

  componentDidMount() {
    this.getCaptcha();
  }

  handleChange = event => {
    event.preventDefault()
    this.props.handleOnChange(event)
  }

  getCaptcha = async () => {
    this.props.handleRefresh();
    const response = await fetch('/captcha')
    const data = await response.text();
    this.setState({ svgData: data });
  }


  render() {
    if(this.props.refresh) {
      this.getCaptcha();
    }
    return (
      <div className="popup">
        <div className="popup\_inner">
          <button onClick={this.props.closePopup}>X</button>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              border: "1px solid white"
            }}
          >
            <div>
              <h2>{this.props.text}</h2>
              <div style={{ color: "blue" }}>
                <button id='login' onClick={this.props.changeLogin}>
                  Already registered? login!
                </button>
              </div>
              <div style={{color: "red"}}>
              <h3>{this.props.displayErrorMessage}</h3>
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
                <div> {ReactHtmlParser(this.state.svgData)} </div>
                <div style={{ display: "flex" }}>
                  <input
                    type="text"
                    name="captcha"
                    placeholder="Enter captcha code"
                    onChange={this.handleChange}
                  />
                  <br />
                  <button onClick={this.props.handleSubmit}>Submit</button>
                </div>

                <h3>{this.props.message}</h3>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;