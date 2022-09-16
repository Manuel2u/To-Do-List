const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
app.set('view engine', 'ejs');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const date = require(__dirname + "/date.js");
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const listSchema = {
  name: "string"
};

const List = mongoose.model('list', listSchema);

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

app.get("/", function(req, res) {
  List.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      List.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("index", {kindOfDay: today, newListItems: foundItems});
    }
  });
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/:customListname", function(req, res) {

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

app.post("/", function(req, res) {
  let newItem = req.body.new_item;
  let customItem = req.body.button;

  let newListItem = new List({
    name: newItem
  });

  if(customItem === today ){
    newListItem.save();

    res.redirect("/");

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
        res.redirect("/");
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
