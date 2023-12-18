
import './App.css';
import { data } from './data';
import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js/auto'
import  db from './firebase';
import { getDatabase, ref, onValue } from "firebase/database";
function App() {
 
  let NT =[
    {Nhiptim:92,Oxi:102},
  ]

  const [Bc,setBc] = useState([])
  const [Nt,setNt] = useState([])


 
  useEffect(()=>{
    const Buocchan = ref(db, 'bodem/buocchan');
onValue(Buocchan, (snapshot) => {
  const data = snapshot.val();
  setBc(data)
})

const Nhiptim = ref(db, 'bodem/Nhiptim');
onValue(Nhiptim, (snapshot) => {
  const data = snapshot.val();
  setNt(data)
})

},[])
console.log(Nt.value);

const buocchan = {
  labels: Bc.map(e=>e.ngay),
  datasets:[{
    labels:"Users Gained",
    data: Bc.map(e=>e.value),
    backgroundColor:["green","blue"]
  }]
}
const nhiptim = {
  labels: ['nhịp tim','nồng đọ oxi'],
  datasets:[{
    labels:"Users Gained",
    data: [Nt.value,Nt.O2],
    backgroundColor:['red',
        'blue',]
  }]
}


  return (
    <div className="App" style={{flex:1}} >
      <div className='Buocchan' >
    <Bar data={buocchan} />
    </div>
    <div className='Nhiptim'>
    <Pie data={nhiptim}/>

    </div>

    </div>
  );
}

export default App;
