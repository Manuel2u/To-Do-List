const express = require("express");
const app = express();
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
const date = require(__dirname + "/date.js");

let today = date(); 

let list = [];

app.get("/", function(req,res){
   res.render("index",{kindOfDay:today, newITem:list});
});

app.post("/", function(req,res){
  let newItem = req.body.new_item;
  list.push(newItem);
  res.redirect("/");
});














app.listen(3000, function() {
  console.log("Server Started at Port 3000...");
});
