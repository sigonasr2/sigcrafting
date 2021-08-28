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
import ToastContainer from 'react-bootstrap/ToastContainer'
import Toast from 'react-bootstrap/Toast'

import { FaCheckCircle } from 'react-icons/fa';


const parse = require('csv-parse/lib/sync')
const axios = require('axios');

const dataSplitters = [0,135,250,388]

const BACKEND_URL = "https://projectdivar.com:4505"

const NOTIFICATIONTIMEOUT = 300 //In seconds

const progress1 = new Audio(process.env.PUBLIC_URL+"/progress1.mp3")
const progress2 = new Audio(process.env.PUBLIC_URL+"/progress2.mp3")

function ItemGroup(p) {
	const { data } = p
	const { contributor } = p
	const { setData1,setData2,setData3,setData4,setLastModified,lastModified } = p
	const [displayData,setDisplayData] = useState([])
	const [lockout,setLockout] = useState(false)
	
	useEffect(()=>{
		setDisplayData([...data].sort((a,b)=>{
			if (b.required===b.obtained&&a.required!==a.obtained) {return -1}
			if (b.required===b.obtained&&a.required===a.obtained) {return a.id-b.id}
			if (b.required!==b.obtained&&a.required!==a.obtained) {return a.id-b.id}
		}))
	},[data])

	useEffect(()=>{
		displayData.forEach((item)=>{
			if (document.getElementById("field_"+item.id)) {
				document.getElementById("field_"+item.id).value=item.obtained
			}
		})
	},[displayData])

	function updateItem(item,target,contributor) {
		var correctedVal=Math.min(item.required,target.value);
		if (correctedVal==item.obtained) {return;}
		setLockout(true)
		axios.post(BACKEND_URL+"/updateItem",{obtained:correctedVal,id:item.id,last_modified:new Date(),item_name:item.name,username:contributor,required:item.required,operation:correctedVal==item.required?"FINISH":correctedVal>item.obtained?"INCREASE":"SET",previous_amt:item.obtained})
		.then((data)=>{
			setLockout(false)
		})
		.catch((err)=>{

		})
	}
	
	return <Accordion.Item className="bg-dark" eventKey={p.akey}>
				<Accordion.Header className="panel-body bg-dark">{p.name}</Accordion.Header>
				<Accordion.Body className="panel-body">
				  {displayData.map((item,i,arr)=><Row key={item.id} className={"pb-1 pt-1 text-light"+(Number(item.obtained)===0?" notStarted":Number(item.obtained)===Number(item.required)?" completed":" inProgress")}>
						<Col>
							<img src={"https://xivapi.com"+item.icon}/> {item.name}
						</Col>
						<Col>
							<input disabled={lockout} id={"field_"+item.id} style={{width:"5em"}} defaultValue={item.obtained} className="mt-1 bg-secondary"
							onKeyDown={(k)=>{
								if (k.key==='Enter') {updateItem(item,document.getElementById("field_"+item.id),contributor)}
							}}
							onChange={(f)=>{
								if (f.currentTarget.value>=item.required) {f.currentTarget.blur()} 
							}} onBlur={(f)=>{updateItem(item,f.currentTarget,contributor)}} type="number" min="0" max={item.required}/> / {item.required} {item.required!==item.obtained&&<FaCheckCircle style={{color:"green"}} onClick={(f)=>{
								updateItem(item,{value:item.required},contributor)
							}}/>}
						</Col>
						<Col>
							<a style={{position:"relative",top:"8px"}} className="text-muted" href={"https://garlandtools.org/db/#item/"+item.itemid} target="tools">View Item Info</a>
						</Col>
					  </Row>)}
				</Accordion.Body>
			  </Accordion.Item>
}

function Notification(p) {

	const [show,setShow] = useState(true)

	const { not } = p
	return <Toast key={not.id} show={show} autohide delay={NOTIFICATIONTIMEOUT*1000} onClose={()=>{setShow(false)}} bg={not.operation==="FINISH"?"success":not.operation==="INCREASE"?"primary":"warning"}>
	<Toast.Header closeButton={true}>
	<span className="me-auto">
		<strong>{not.username}</strong>
		{not.operation==="FINISH"?" has finished collecting "+not.required+"/"+not.required+" "+not.item_name+"!":
		not.operation==="INCREASE"?" has collected "+not.obtained+"/"+not.required+" "+not.item_name+" (+"+(not.obtained-not.previous_amt)+")"
		:" has set "+not.item_name+"  to "+not.obtained+"/"+not.required}</span>
	</Toast.Header>
</Toast>
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
	const [lastModified,setLastModified] = useState(new Date())

	const [contributor,setContributor] = useState("")
	const [notifications,setNotifications] = useState([])
	const [closedNotifications,setClosedNotifications] = useState([])

	function LZ(digits,numb) {
		return "0".repeat(digits-String(numb).length)+numb
	}
	
	useEffect(()=>{
		const interval = setInterval(()=>{
			axios.get(BACKEND_URL+"/lastUpdate")
			.then((data)=>{
				if (new Date(data.data[0].last_modified)>lastModified) {
					console.log("Updating entries... "+[lastModified,data.data[0].last_modified])
					setLastModified(new Date())
					return axios.get("https://projectdivar.com:4505/getData")
					.then((data)=>{
						//setData(data.data)
						setData(data.data.slice(dataSplitters[0],dataSplitters[1]))
						setData2(data.data.slice(dataSplitters[1],dataSplitters[2]))
						setData3(data.data.slice(dataSplitters[2],dataSplitters[3]))
						setData4(data.data.slice(dataSplitters[3],data.data.length))
					})
				}
			})
			.catch((err)=>{
				console.log(err.message)
			})
		},1000)
		return ()=>clearInterval(interval)
	},[lastModified])

	useEffect(()=>{
		var notificationLastUpdate = new Date(new Date()-(NOTIFICATIONTIMEOUT*1000))
		var largestNotificationID = -1
		var dataCheck=true
		const interval = setInterval(()=>{
			if (dataCheck) {
				dataCheck=false
				notificationLastUpdate = new Date(new Date()-(NOTIFICATIONTIMEOUT*1000))
				axios.get(BACKEND_URL+"/getNotifications?date="+encodeURIComponent(LZ(4,notificationLastUpdate.getUTCFullYear())+"-"+LZ(2,notificationLastUpdate.getUTCMonth()+1)+"-"+LZ(2,notificationLastUpdate.getUTCDate())+" "+LZ(2,notificationLastUpdate.getUTCHours())+":"+LZ(2,notificationLastUpdate.getUTCMinutes())+":"+LZ(2,notificationLastUpdate.getUTCSeconds())+"."+LZ(3,notificationLastUpdate.getUTCMilliseconds())+"+00"))
				.then((data)=>{
					if (data.data.length>0) {
						console.log("New notification array: "+JSON.stringify(data.data))
						setNotifications(data.data)
						var completion=false
						var largestID = -1
						for (var dat of data.data) {
							if (dat.id>largestNotificationID && dat.operation==="FINISH") {
								completion=true
								largestID=Math.max(dat.id,largestID)
								break
							} else 
							if (dat.id>largestNotificationID)
							{
								largestID=Math.max(dat.id,largestID)
							}
						}
						if (largestID!==-1) {	
							largestNotificationID = largestID
							if (completion) {progress2.play()} else {progress1.play()}
						}
					}
				})
				.catch((err)=>{
					console.log(err.message)
				})
				.then(()=>{
					dataCheck=true
				})
			}
		},1000)
		return ()=>clearInterval(interval)
	},[])
	
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
							return axios.post(BACKEND_URL+"/setItem",dataObj)
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
				setData(data.data.slice(dataSplitters[0],dataSplitters[1]))
				setData2(data.data.slice(dataSplitters[1],dataSplitters[2]))
				setData3(data.data.slice(dataSplitters[2],dataSplitters[3]))
				setData4(data.data.slice(dataSplitters[3],data.data.length))
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
				{contributor.length>0&&<span className="text-light font-weight-light font-italic">Signed in as {contributor}</span>}
			  </Container>
		  </Navbar>
			<Container>
				{contributor.length===0?<>
							<input placeHolder="e.g. Bun" onKeyDown={(k)=>{if (k.key==='Enter') {setContributor(document.getElementById("username").value)}}} id="username"/>
							<button type="Submit" onClick={(f)=>{setContributor(document.getElementById("username").value)}}>Submit</button>
						</>:
						data.length>0?
							<>
								<Accordion className="bg-dark" defaultActiveKey="0">
									<ItemGroup name="Gathering Items" contributor={contributor} akey="0" data={data} lastModified={lastModified} setLastModified={setLastModified} setData={setData} setData1={setData} setData2={setData2} setData3={setData3} setData4={setData4}/>
									<ItemGroup name="Other Items" contributor={contributor} akey="1" data={data2} lastModified={lastModified} setLastModified={setLastModified} setData={setData2} setData1={setData} setData2={setData2} setData3={setData3} setData4={setData4}/>
									<ItemGroup name="Pre-crafting" contributor={contributor} akey="2" data={data3} lastModified={lastModified} setLastModified={setLastModified} setData={setData3} setData1={setData} setData2={setData2} setData3={setData3} setData4={setData4}/>
									<ItemGroup name="Crafting Items" contributor={contributor} akey="3" data={data4} lastModified={lastModified} setLastModified={setLastModified} setData={setData4} setData1={setData} setData2={setData2} setData3={setData3} setData4={setData4}/>
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
		<div style={{pointerEvents:"none",position:"fixed",top:"0px",left:"0px",width:"100%",height:"100%"}}>
			<ToastContainer position="bottom-end">
				{notifications.map((not)=>{
					return <Notification not={not}/>
				})}
			</ToastContainer>
		</div>
		</Container>
	  </Container>
  );
}

export default App;
