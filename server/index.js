const express = require("express");
const bodyparser = require("body-parser");
const Librus = require("librus-api");
const session = require("express-session");
const cookieparser = require("cookie-parser");
const uuid = require("uuid/v1");

var LibrusSessions = {}


var app = express();
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());
app.use(cookieparser());
app.use(session({secret: process.env.SESSION_SECRET, resave: "false", saveUninitialized: "false"}))
app.use(express.static("www"));

app.get("/",function(req,res){
	res.sendFile(__dirname + "/www/index.html");
});

function CheckAuth(req,res,parentfunc){	
	if (req.session.LibrusSession == null){
		res.sendFile(__dirname + "/www/index.html")	
	}
	else {
		if (Math.floor(new Date() / 1000) - req.session.LastAction >= 600) {
			LibrusSessions[req.session.LibrusSession].calendar.getTimetable().then(data => {
				if (data.hours[0] == null)
					delete LibrusSessions[req.session.LibrusSession]
					req.session.destroy();	
					res.sendFile(__dirname + "/www/index.html");
			
			})	
		}
		else {
			parentfunc(req,res)
			req.session.LastAction = Math.floor(new Date() / 1000)
		
		}
	}
}
app.get("/getTimetable",function(req,res){
	function parentfunc(req,res) {
		LibrusSessions[req.session.LibrusSession].calendar.getTimetable().then(data =>{
		res.send(JSON.stringify(data))
		})
	}
	
	CheckAuth(req,res,parentfunc);
})
app.get("/getGrades",function(req,res){
	function parentfunc(req,res) {
		LibrusSessions[req.session.LibrusSession].info.getGrades().then(data => {
		res.send(JSON.stringify(data))	
		})	
	}
	CheckAuth(req,res,parentfunc);
})
app.get("/getGradeInfo*",function(req,res){
	function parentfunc(req,res){
		var GradeIdToProcess = req.url.split("/")[2]
		LibrusSessions[req.session.LibrusSession].info.getGrade(GradeIdToProcess).then(data => {
		res.send(JSON.stringify(data))	
		})
	}
	CheckAuth(req,res,parentfunc)
})
app.get("/getPointGradeInfo*",function(req,res){
	function parentfunc(req,res){
		var GradeIdToProcess = req.url.split("/")[2]
		LibrusSessions[req.session.LibrusSession].info.getPointGrade(GradeIdToProcess).then(data => {
		res.send(JSON.stringify(data))	
		})
	}
	CheckAuth(req,res,parentfunc)
})
app.get("/getLuckyNumber",function(req,res){
	function parentfunc(req,res){
		LibrusSessions[req.session.LibrusSession].info.getLuckyNumber().then(data => {
		res.send(JSON.stringify(data))		
		})
	}
	CheckAuth(req,res,parentfunc)
})

app.get("/plan_lekcji",function(req,res){
var LibrusSessionAuth = new Librus();

LibrusSessionAuth.authorize(req.session.username,req.session.password).then(function() {
	if (req.session.LibrusSession == null){
	if (data.hours[0] != null){
		delete req.session.username
		delete req.session.password
		req.session.LibrusSession = uuid();
		LibrusSessions[req.session.LibrusSession] = LibrusSessionAuth
		req.session.LastAction = Math.floor(new Date() / 1000)
		res.sendFile(__dirname + "/www/plan_lekcji.html")
	}
	else {
		res.sendStatus(401)
	}
	

	})
	}
	else{
		res.sendFile(__dirname + "/www/plan_lekcji.html")
	}
	

})
});

app.get("/oceny",function(req,res){
	function parentfunc(req,res){
		res.sendFile(__dirname + "/www/oceny.html")	
	}
	CheckAuth(req,res,parentfunc);
})

app.get("/wip",function(req,res){
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
		res.sendFile(__dirname + "/www/personal.html")
	}
	CheckAuth(req,res,parentfunc);
	
})

app.post("/auth", function(req,res){
	req.session.username = req.body.username
	req.session.password = req.body.password
	res.sendFile(__dirname + "/www/auth.html")

});
app.listen(3000,function(){
	console.log("listening on port: 3000")
});


