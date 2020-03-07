import React from 'react';  
import './style.css';  

class Popup extends React.Component {  

  handleChange = event => {
    event.preventDefault()
    this.props.handleOnChange(event)
}

render() {  
  return (  
  <div className='popup'>  
  <div className='popup\_inner'> 
    <button onClick={this.props.closePopup}>X</button>  

<div style={{display: 'flex', justifyContent: 'center', border: '1px solid white'}}>

<div>
<h2>{this.props.text}</h2>  
<div style={{color: 'blue'}}><h3 onClick={this.props.changeLogin}>Already registered? login!</h3></div>

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

 <input type="password" 
 name="checkpassword"
 placeholder="Enter password again" 
 onChange={this.handleChange}
 /><br />

<button 
onClick={this.props.handleSubmit}>
  Submit
</button>
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