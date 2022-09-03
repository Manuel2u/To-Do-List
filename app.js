const express = require("express");
const mongoose = require("mongoose");
const app = express();
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

let list = [];

app.get("/", function (req, res) {
  List.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      List.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("index", {
        kindOfDay: today,
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function (req, res) {
  let newItem = req.body.new_item;

  let newListItem = new List({
    name: newItem
  });

  newListItem.save();

  res.redirect("/");
});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  console.log(checkedItemId);
  List.findByIdAndRemove(checkedItemId, function (err) {
    if (!err) {
      console.log("Successfully deleted checked item");
      res.redirect("/");
    }
  });
});


app.listen(3000, function () {
  console.log("Server Started at Port 3000...");
});