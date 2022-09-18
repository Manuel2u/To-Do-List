const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
const passport = require("passport");
const PassportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");

app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret:"yourSecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const date = require(__dirname + "/date.js");
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const listSchema = new mongoose.Schema({
  name: String
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret : String,
    list : listSchema
});

userSchema.plugin(PassportLocalMongoose);

const List = mongoose.model("list", listSchema);
const User = mongoose.model('user', userSchema);

let item1 = new List({
  name: "Welcome to your ToDo-List"
});

let item2 = new List({
  name: "Hit the + button to add a new item"
});


let defaultItems = [item1, item2];


let today = date();

const customSchema = {
  name: "string",
  list: [listSchema]
}

const Custom = mongoose.model("custom", customSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.get("/login", function(req, res){
  res.render("login");
})

app.get("/", function(req, res){
  res.render("register");
});

app.get("/list", function(req, res) {
  if(req.isAuthenticated()){
    List.find({}, function(err, foundItems) {
      if (foundItems.length === 0) {
        List.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB");
          }
        });
        res.redirect("/list");
      } else {
        res.render("index", {kindOfDay: today, newListItems: foundItems});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.post("/", function(req, res){
  User.register({username : req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/list");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/list");
      });
    }
  });

});

app.get("/list/:customListname", function(req, res) {

  const customListname = _.capitalize(req.params.customListname);

  Custom.findOne({name: customListname}, function(err, custom) {
    if (!err) {
      if (!custom) {
        let firstList = new Custom({
          name: customListname,
          list: defaultItems
        });

        firstList.save();
        res.redirect("/" + customListname);

      } else {
        res.render("index" , {kindOfDay: custom.name, newListItems: custom.list});
      }
    }
  });





});

app.post("/list", function(req, res) {
  let newItem = req.body.new_item;
  let customItem = req.body.button;

  let newListItem = new List({
    name: newItem
  });

  if(customItem === today ){
    newListItem.save();

    res.redirect("/list");

    }else{
      Custom.findOne({name:customItem}, function(err, foundList){
          foundList.list.push(newListItem);
          foundList.save();
          res.redirect("/"+customItem);
        });
    }

  });


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const customList = req.body.customList;

  if (customList === today){
    console.log(checkedItemId);
    List.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/list");
      }
    });
  }else{
    Custom.findOneAndUpdate({name:customList}, {$pull:{list:{_id:checkedItemId}}}, function(err, foundThings){
      if(!err){
        res.redirect("/"+customList);
      }
    });
  }

});


app.listen(3000, function() {
  console.log("Server Started at Port 3000...");
});
