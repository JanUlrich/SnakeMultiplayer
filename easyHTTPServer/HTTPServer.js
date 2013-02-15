var http = require("http");
var url = require("url");
var fs = require("./fileSystem.js");


var handles = {}

function startHTTP(port){

	//var runningDirectory = "/home/andreas/PGP-Chat/PGP-Chat-Server/";

	function onRequest(request, response) {
		
    		//console.log("Request for " + pathname + " received.");
    		route(request, response);
	}

	var server = http.createServer(onRequest).listen(port);

	console.log("HTTP-Server started\n");
	return server;
}

function route(request, response){
	var pathname = url.parse(request.url).pathname;

	console.log("Trying to get: "+ pathname);

	if (handles[pathname] != undefined && typeof handles[pathname]["function"] === 'function') {
	handles[pathname]["function"]( handles[pathname]["path"] , response);
	} else {
	console.log("No request handler found for " + pathname);
	response.writeHead(404, {"Content-Type": "text/plain"});
	response.write("404 Not found");
	response.end();
	}
}

function registerFile(path, handle){
	handles[handle] = {}

	handles[handle]["function"] = function(path, response){   
			response.writeHead(200, {'Content-Type':'text/html'}); 
		    response.write(fs.getFileContent(path));  
		    response.end();
	}

	handles[handle]["path"]=path;
}

function registerFolder(path, handle){

}

exports.startHTTP = startHTTP;
exports.registerFile = registerFile;
exports.registerFolder = registerFolder;