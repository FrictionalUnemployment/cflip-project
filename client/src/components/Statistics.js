import React from 'react';  
import './style.css';  
import {Table} from "reactable";
import { getQueriesForElement } from '@testing-library/react';




class Statistics extends React.Component {  
    constructor(props) {
        super(props);
        this.state = {
            info: '',
            filterUsername: '',
            array: [],
            userInfo: '',
            winsInfo: '',
            showStats: false,
            userArray: []
        };

    }

    handleOnChange(event) {
       
        this.setState({
            [event.target.name]: event.target.value
        })

    }

    async componentDidMount() {
        const response = await fetch('/stats/toplist/top/10000')
        const body = await response.json();
        
        if(response.status !== 200) {
            throw Error(body.message);
        }
       
        this.setState({
            info: body

        });

    }

     async getUser() {
         
        const response = await fetch('/stats/user/' + this.state.filterUsername);
        const body = await response.json();

        if(response.status !== 200) {
            throw Error(body.message);
        }
        
        this.setState({
            userInfo: body
        });
      }

      async getWID() {
          const userInfo = this.state.userInfo;
          
        for(var i=0; i<userInfo.Wins.length; i++){
            
        const response = await fetch('/stats/flip/' + userInfo.Wins[i]);
   
        const body = await response.json();
        if(response.status !== 200) {
            throw Error(body.message);
        }
        this.setState({
            winsInfo: body, showStats: true
        });
    
    }
      }

      handleUserQuery() {
          
        this.getUser()
            .then(() => this.getWID());
      }

      showUserStats() {
          
        const userInfo = this.state.userInfo;
        const userWID = this.state.winsInfo;
        alert(userWID.results)
        for (var i=0; i<userInfo.Wins.length; i++) {
            
            var obj = {
                "Username": userInfo.Username,
                "Balance": userInfo.Balance,
                "Wins": toString(userWID)
                
            };
            this.state.userArray.push(obj);
        }
      }

   
    
      filterArray = e => {
       // this.setState({filterUsername: e.target.value});
    }
        
            
    

    render() {
        
        const info = this.state.info;
        for (var i=0; i<info.length; i++) {
            var obj = {
                "#": i+1,
                "Username": info[i].Username,
                "Balance": info[i].Balance,
                "Wins": info[i].Wins,
                "Losses": info[i].Losses 
            };
            this.state.array.push(obj);
        }

        return(
            <div className='popup'>  
                    <Table className="table" sortable={true} data={this.state.array} itemsPerPage={10}
                    pageButtonLimit={10}  filterable={["Username"]} onFilter={this.filterArray}
                    
                    />
            </div>
           
           
      );
    
        
      
        }
        
    }
        export default Statistics;

