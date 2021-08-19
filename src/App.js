import logo from './logo512.png';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useState,useEffect } from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Accordion from 'react-bootstrap/Accordion';


const parse = require('csv-parse/lib/sync')
const axios = require('axios');

function ItemGroup(p) {
	
	function findIndex(name,arr) {
		for (var i=0;i<arr.length;i++) {
			if (arr[i].name===name) {
				console.log("Found "+name+" at position "+i)
				return i
			}
		}
	}
	
	return <Accordion.Item className="bg-dark" eventKey={p.akey}>
				<Accordion.Header className="panel-body bg-dark">{p.name}</Accordion.Header>
				<Accordion.Body className="panel-body">
				  {p.data.map((item,i,arr)=><Row key={item.id} className={"pb-1 pt-1 text-light"+(Number(item.obtained)===0?" notStarted":Number(item.obtained)===Number(item.required)?" completed":" inProgress")}>
						<Col>
							<img src={"https://xivapi.com"+item.icon}/> {item.name}
						</Col>
						<Col>
							<input style={{width:"5em"}} value={item.obtained} className="mt-1 bg-secondary" onChange={(f)=>{if (f.currentTarget.value>=item.required) {f.currentTarget.blur()} var newData=[...p.data];newData[i].obtained=Math.min(item.required,f.currentTarget.value);p.setData(newData.sort((a,b)=>{
								if (b.required===b.obtained&&a.required!==a.obtained) {return -1}
								if (b.required===b.obtained&&a.required===a.obtained) {return a.id-b.id}
								if (b.required!==b.obtained&&a.required!==a.obtained) {return a.id-b.id}
							}));}} type="number" min="0" max={item.required}/> / {item.required}
						</Col>
						<Col>
							<a style={{position:"relative",top:"8px"}} className="text-muted" href={"https://garlandtools.org/db/#item/"+item.itemid} target="tools">View Item Info</a>
						</Col>
					  </Row>)}
				</Accordion.Body>
			  </Accordion.Item>
}

function App() {
	
	const [data,setData] = useState([])
	const [data2,setData2] = useState([])
	const [data3,setData3] = useState([])
	const [data4,setData4] = useState([])
	const [fileData,setFileData] = useState()
	const [update,setUpdate] = useState(true)
	const [succeeded,setSucceeded] = useState(0)
	const [failed,setFailed] = useState(0)
	const [total,setTotal] = useState(0)
	const [listData,setListData] = useState([])
	
	const disabled=true
	
	function downloadData(d,val,max) {
		if (val<max) {
			axios.get(encodeURI("https://xivapi.com/search?string="+d[val].Item))
				.then((data)=>{
					var results = data.data.Results
					var found=false
					for (var r of results) {
						if (r.Name===d[val].Item&&r.UrlType==="Item") {
							found=true
							//console.log("Found "+r)
							setSucceeded(succeeded+1)
							var dataObj = {
								itemid:r.ID,
								name:r.Name,
								obtained:0,
								required:d[val].Needed,
								icon:r.Icon
							}
							return axios.post("https://projectdivar.com:4505/setItem",dataObj)
						}
					}
					if (!found) {
						setFailed(failed+1)
						console.log("Could not find "+d[val].Item+"....")
					}
				})
				.then(()=>{
					setTimeout(downloadData(d,val+1,max),250)
				})
				.catch((err)=>{
					setFailed(failed+1)
				})
		}
	}
	
	useEffect(()=>{
		if (update) {
			axios.get("https://projectdivar.com:4505/getData")
			.then((data)=>{
				//setData(data.data)
				setData(data.data.slice(0,135))
				setData2(data.data.slice(135,250))
				setData3(data.data.slice(250,388))
				setData4(data.data.slice(388,data.data.length))
			})
			.catch((err)=>{
				console.log(err.message)
				setData([
					{id:1726,itemid:2,name:"Fire Shard",icon:"/i/020000/020001.png",obtained:694,required:4124},
					{id:1727,itemid:3,name:"Ice Shard",icon:"/i/020000/020003.png",obtained:0,required:1226},
					{id:1728,itemid:4,name:"Wind Shard",icon:"/i/020000/020004.png",obtained:4719,required:4719},
					{id:1729,itemid:5,name:"Earth Shard",icon:"/i/020000/020006.png",obtained:15,required:1764},
					{id:1730,itemid:6,name:"Lightning Shard",icon:"/i/020000/020005.png",obtained:0,required:2374},
				])
			})
			setUpdate(false)
		}
	},[update])
	
	useEffect(()=>{
		if (succeeded+failed===total) {
			setUpdate(true)
		}
	},[succeeded,failed])
	
	useEffect(()=>{
		var d = parse(fileData,{columns:true,skip_empty_lines:true})
		console.log(d)
		var promises = []
		downloadData(d,0,d.length)
		setTotal(d.length)
	},[fileData])
	
  return (  
	  <Container className="bg-dark" fluid>
		  <Navbar bg="dark" variant="dark">
			  <Container>
				<Navbar.Brand href="#home">
				  <img src={process.env.PUBLIC_URL+"/favicon.ico"} width="30" height="30" className="d-inline-block align-top" alt="BUN logo"/> BUN Collab App
				</Navbar.Brand>
			  </Container>
		  </Navbar>
		  <Container>
			  {data.length>0?
				  <>
					<Accordion className="bg-dark" defaultActiveKey="0">
					  <ItemGroup name="Gathering Items" akey="0" data={data} setData={setData} sections={[0,135]}/>
					  <ItemGroup name="Other Items" akey="1" data={data2} setData={setData2} sections={[135,250]}/>
					  <ItemGroup name="Pre-crafting" akey="2" data={data3} setData={setData3} sections={[250,388]}/>
					  <ItemGroup name="Crafting Items" akey="3" data={data4} setData={setData4} sections={[388,data.length]}/>
					 </Accordion>
				</>:
				  !disabled&&
				  <Row>
					  <Col>
					  {total===0?<caption><label className="buttonLabel" for="uploads">Import List</label><input onChange={(f)=>{
							const reader = new FileReader()
							reader.onload=(ev)=>{
								setFileData(ev.target.result)
							}
							reader.readAsText(f.target.files[0])
					  }} style={{opacity:0}} id="uploads" type="file" accept=".txt,.csv"/></caption>:
						<>
							<ProgressBar>
							  <ProgressBar animated striped variant="success" now={Math.round(succeeded/total)*100} />
							  <ProgressBar animated striped variant="danger" now={Math.round(failed/total)*100} />
							</ProgressBar>
							<div className="text-center">{Math.round(((failed+succeeded)/total)*100)+"%"}</div>
						</>
					  }
					  </Col>
				  </Row>
			  }
		  </Container>
	  </Container>
  );
}

export default App;
