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

function CheckAuth(req,res){	
	if (req.session.LibrusSession == null){
		console.log("auth not present")
		//res.sendFile(__dirname + "/www/index.html")
		res.sendStatus(401)
	}
	else {
		console.log("auth present")		
	}
}
app.get("/getTimetable",function(req,res){
	CheckAuth(req,res);
	LibrusSessions[req.session.LibrusSession].calendar.getTimetable().then(data =>{
	console.log(data)
	res.send(JSON.stringify(data))
	})

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
app.get("/wip",function(req,res){
console.log("got WIP request")
	CheckAuth(req,res);
	res.sendFile(__dirname + "/www/wip.html")
})
app.get("/logout",function(req,res){
	delete LibrusSessions[req.session.LibrusSession]
	req.session.destroy();
	res.sendFile(__dirname + "/www/index.html")

})
app.get("/personal",function(req,res){
console.log("got Personal request")
	CheckAuth(req,res);
	res.sendFile(__dirname + "/www/personal.html")
})

app.post("/auth", function(req,res){
	console.log("received post request")
	console.log(req.body)
	console.log(req.body.username)
	console.log(req.body.password)
	req.session.username = req.body.username
	req.session.password = req.body.password
	res.sendFile(__dirname + "/www/auth.html")
	console.log(req.session)

});
app.listen(3000,function(){
	console.log("listening on port 3000")
});

var client = new Librus();
