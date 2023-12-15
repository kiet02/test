import logo from './logo.svg';
import './App.css';
import { data } from './data';
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto'
import  db from './firebase';
import { getDatabase, ref, onValue } from "firebase/database";
function App() {
  let BC = [
    {ngay:"20/10/2023",value:912},
    {ngay:"21/10/2023",value:412},
    {ngay:"22/10/2023",value:612},
    {ngay:"23/10/2023",value:212},
  ]
  let NT =[
    {ngay:"20/10/2023",value:912},
    {ngay:"21/10/2023",value:412},
    {ngay:"22/10/2023",value:612},
    {ngay:"23/10/2023",value:212},
  ]
  const starCountRef = ref(db, 'bodem');
onValue(starCountRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data.buocchan);
  
});
  // setTimeout(() => {
    
  // }, 100);
const [userData,setUserData] = useState({
  labels: data.map((data)=>data.year),
  datasets:[{
    labels:"Users Gained",
    data: data.map((data)=> data.userGain),
    backgroundColor:["green","blue"]
  }]
})
console.log(BC);
const buocchan = {
  labels: BC.map((data) =>data.ngay),
  datasets:[{
    labels:"Users Gained",
    data: BC.map((data)=>data.value),
    backgroundColor:["green","blue"]
  }]
}
const nhiptim = {
  labels: NT.map((data) =>data.ngay),
  datasets:[{
    labels:"Users Gained",
    data: NT.map((data)=>data.value),
    backgroundColor:["green","blue"]
  }]
}


  return (
    <div className="App">
      <div style={{width: 700,}}>
      <Bar data={buocchan}/>
      <Bar data={nhiptim}/>

      </div>
    </div>
  );
}

export default App;
