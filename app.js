const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
const passport = require("passport");
const PassportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const dotenv = require('dotenv').config();

app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(session({
  secret: "yourSecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const mongoDBURL = process.env.MONGO_DB_URL;

const date = require(__dirname + "/date.js");
mongoose.connect(mongoDBURL, {
  useNewUrlParser: true
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "List item name is required"]
  }
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  list: [listSchema]
});

userSchema.plugin(PassportLocalMongoose);
userSchema.plugin(findOrCreate);

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

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://to-do-list-xx.herokuapp.com/auth/google/list"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/list', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/list');
  });

app.get("/login", function (req, res) {
  res.render("login");
})

app.get("/", function (req, res) {
  res.render("register");
});

app.get("/logout", function(req,res){
  req.logout(function(err){
      if(err){
          console.log(err);
      }
  });
  res.redirect("/");
});


app.get("/list", function(req, res) {
  if(req.isAuthenticated()){
    User.findById(req.user.id, function(err, foundUser) {
      if (foundUser) {
        defaultItems.forEach(function(items){
          foundUser.list.unshift(items);
        });
      } 
      res.render("index", {kindOfDay: today, newListItems: foundUser.list});
    });
  }else{
    res.redirect("/login");
  }
});

app.post("/", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.passwordConfirm;
  if (password === confirmPassword) {
  User.register({username: req.body.username}, req.body.password, function (err, user){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/list");
      });
    }
  });
} else {
  setTimeout(function () {
    res.redirect("/");
  }
  , 3000);
};
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: '/login', failureMessage: true })(req, res, function () {
        res.redirect("/list");
      });
    }
  });

});

app.get("/list/:customListname", function (req, res) {

  const customListname = _.capitalize(req.params.customListname);

  Custom.findOne({
    name: customListname
  }, function (err, custom) {
    if (!err) {
      if (!custom) {
        let firstList = new Custom({
          name: customListname,
          list: defaultItems
        });

        firstList.save();
        res.redirect("/" + customListname);

      } else {
        res.render("index", {
          kindOfDay: custom.name,
          newListItems: custom.list
        });
      }
    }
  });


});

app.post("/list", function (req, res) {
  let newItem = req.body.new_item;
  let customItem = req.body.button;

  const newListItem = new List({
    name: newItem
  });
  newListItem.save();

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (customItem === today) {
          foundUser.list .push(newListItem); 
          foundUser.save(function () {
            res.redirect("/list");
          });
        } else {
          Custom.findOne({
            name: customItem
          }, function (err, foundList) {
            foundList.list.push(newListItem);
            foundList.save();
            res.redirect("/" + customItem);
          });
        }
      }
    }
  });

});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const customList = req.body.customList;

  if (customList === today) {
    User.findById(req.user.id, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.list = foundUser.list.filter(function (item) {
            return item._id != checkedItemId;
          });
          foundUser.save(function () {
            res.redirect("/list");
          });
        }
      }
    });
  } else {
    Custom.findOneAndUpdate({
      name: customList
    }, {
      $pull: {
        list: {
          _id: checkedItemId
        }
      }
    }, function (err, foundThings) {
      if (!err) {
        res.redirect("/" + customList);
      }
    });
  }

});


app.listen(process.env.PORT||3000, function () {
  console.log("Server Started at Port 3000...");
});