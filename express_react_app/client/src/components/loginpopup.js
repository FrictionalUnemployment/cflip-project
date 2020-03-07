import React from 'react';  
import './style.css';  

class Loginpopup extends React.Component {  

  handleChange = event => {
    event.preventDefault()
    this.props.handleOnChange(event)
}

render() {
return(
    <div className='popup'>  
    <div className='popup\_inner'> 
    <button onClick={this.props.closeLoginPopup}>X</button>  
    <div style={{display: 'flex', justifyContent: 'center', border: '1px solid white'}}>
    <div>
    <h2>{this.props.text}</h2>
    <form onSubmit={e => e.preventDefault()}>
    <input 
    placeholder="Enter username"  
    type="text" 
    name="username"
    onChange={this.handleChange}
    /><br />

    <input type="password" 
    placeholder="Enter password" 
    name="password"
    onChange={this.handleChange}
    /><br />
    <button 
    onClick={this.props.handleLoginSubmit}>
     Submit
    </button>

    </form>
    </div>
    </div>
    </div>
    </div>


);

}
}


export default Loginpopup;

