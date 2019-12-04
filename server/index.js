const express = require("express");
const bodyparser = require("body-parser");
const Librus = require("Librus-api");
const session = require("express-session");
const cookieparser = require("cookie-parser");
const uuid = require("uuid/v1")

var LibrusSessions = {}


var app = express();
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());
app.use(cookieparser());
app.use(session({secret: "LUL", resave: "false", saveUninitialized: "false"}))
app.use(express.static("www"));

app.get("/",function(req,res){
	res.sendFile(__dirname + "/www/index.html");
});

function CheckAuth(req,res,parentfunc){	
	if (req.session.LibrusSession == null){
		console.log("auth not present")
		//res.sendFile(__dirname + "/www/index.html")	
		res.sendStatus(401)
	}
	else {
		console.log("auth present")		
		if (Math.floor(new Date() / 1000) - req.session.LastAction >= 600) {
			LibrusSessions[req.session.LibrusSession].calendar.getTimetable().then(data => {
				if (data.hours[0] == null)
					console.log(data.hours)
					console.log("token expired \n initializing reauth")
					delete LibrusSessions[req.session.LibrusSession]
					req.session.destroy();	
					res.sendFile(__dirname + "/www/index.html");
			
			})	
		}
		else {
			console.log("Token still valid")
			console.log("LastActionTime: " + req.session.LastAction)
			parentfunc(req,res)
			req.session.LastAction = Math.floor(new Date() / 1000)
		
		}
	}
}
app.get("/getTimetable",function(req,res){
	function parentfunc(req,res) {
		LibrusSessions[req.session.LibrusSession].calendar.getTimetable().then(data =>{
		console.log(data)
		res.send(JSON.stringify(data))
		})
	}
	
	CheckAuth(req,res,parentfunc);
})
app.get("/getGrades",function(req,res){
	function parentfunc(req,res) {
		LibrusSessions[req.session.LibrusSession].info.getGrades().then(data => {
		console.log(data)
		res.send(JSON.stringify(data))	
		})	
	}
	console.log("gotGradeCall")
	CheckAuth(req,res,parentfunc);
})


app.get("/plan_lekcji",function(req,res){
console.log("got pln req")
var LibrusSessionAuth = new Librus();

LibrusSessionAuth.authorize(req.session.username,req.session.password).then(function() {
	console.log("connection aquired")	
	if (req.session.LibrusSession == null){
	LibrusSessionAuth.calendar.getTimetable().then(data => {console.log(data);
	if (data.hours[0] != null){
		console.log(data.hours)
		console.log("auth success")
		req.session.LibrusSession = uuid();
		LibrusSessions[req.session.LibrusSession] = LibrusSessionAuth
		req.session.LastAction = Math.floor(new Date() / 1000)
		console.log("session last action: " + req.session.LastAction)
		console.log(LibrusSessions)
		res.sendFile(__dirname + "/www/plan_lekcji - Copy.html")
	}
	else {
		console.log("auth fail")
		res.sendStatus(401)
	}
	

	})
	}
	else{
		console.log("user already authorized")	
		console.log(LibrusSessions)
		res.sendFile(__dirname + "/www/plan_lekcji - Copy.html")
	}
	

})
});

app.get("/oceny",function(req,res){
	console.log("Got Grade Request")
	function parentfunc(req,res){
		res.sendFile(__dirname + "/www/oceny.html")	
	}
	CheckAuth(req,res,parentfunc);
})

app.get("/wip",function(req,res){
console.log("got WIP request")
	function parentfunc(req,res){
		res.sendFile(__dirname + "/www/wip.html")
	}

	CheckAuth(req,res,parentfunc);
})
app.get("/logout",function(req,res){
	delete LibrusSessions[req.session.LibrusSession]
	req.session.destroy();
	res.sendFile(__dirname + "/www/index.html")

})
app.get("/personal",function(req,res){
	function parentfunc(req,res){
		console.log("got Personal request")	
		res.sendFile(__dirname + "/www/personal.html")
	}
	CheckAuth(req,res,parentfunc);
	
})

app.post("/auth", function(req,res){
	console.log("received post request")
	//console.log(req.body)
	//console.log(req.body.username)
	//console.log(req.body.password)
	req.session.username = req.body.username
	req.session.password = req.body.password
	res.sendFile(__dirname + "/www/auth.html")
	//console.log(req.session)

});
app.listen(3000,function(){
	console.log("listening on port 3000")
});

var client = new Librus();
