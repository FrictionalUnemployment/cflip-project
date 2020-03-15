import React from 'react';  
import './style.css';  
import {Table} from "reactable";




class Statistics extends React.Component {  
    constructor(props) {
        super(props);
        this.state = {
            info: '',
            displayStats: 'top',
            

        }
    }
    async componentDidMount() {
        const response = await fetch('/stats/toplist/' + this.state.displayStats + '/25')
        const body = await response.json();
        
        if(response.status !== 200) {
            throw Error(body.message);
        }
       
        this.setState({
            info: body

        });

    }
    handleChange = event => {
        event.preventDefault()
        this.props.handleOnChange(event)
    }

    render() {
     
        var info = this.state.info;
        var array = [];
        
        for (var i=0; i<info.length; i++) {
            console.log(info[i].Username);
            var obj = {
                "#": i+1,
                "Username": info[i].Username,
                "Balance": info[i].Balance,
                "Wins": info[i].Wins,
                "Losses": info[i].Losses 
            };
           
            array.push(obj);
        }
        

        return(
            <div className='popup'>  
            
            
            <Table className="table" sortable={true} data={array} />
            </div>
           
           
      );
    
        
      
        }
        
    }
        export default Statistics;

