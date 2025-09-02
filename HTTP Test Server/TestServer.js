const http = require("http");

const requestListener = (req, res) => {
  const { remoteAddress, remotePort, localPort, } = req.socket;
  console.log(`Request is coming from ip:${remoteAddress} port:${remotePort} requested URL:${req.url} for server running on port:${localPort}`);
  res.writeHead(200);
  res.end(`My Server on port:${localPort}`);
};

const startServer=(port)=>{
  
  const server = http.createServer(requestListener);
  
  server.listen(port,() => {
    console.log(`Server is running on port:${port}`);
  });
  
}

for(let i=4173;i<=4173;i+=1){
  startServer(i);
}

