require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
// Make sure to follow this exacat order
var session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));


////////////////// setup SESSION make sure to place it right where it is /////////////////////////////
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

///////////// Setup PASSPORT ///////////////////////
app.use(passport.initialize());
app.use(passport.session()); 



mongoose.connect("mongodb://localhost:27017/userDB", {family: 4});
     
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// The following will hash and salt our passwords, aswell as to save the data in mongodb
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

// Serialize creates the cookie
passport.serializeUser(User.serializeUser());
//  Deserialize breaks the cookie and allows the browser to see whats inside of it
passport.deserializeUser(User.deserializeUser());





app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    // Check if user is authentificated
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logOut(function(err){
        if (!err){
            res.redirect("/");
        }
    });
    
})

app.post("/register", function(req, res){
    // Handle registration using passport
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (!err){
            passport.authenticate("local")(req, res, function(){
                // If the client gets in here it means that he was successfully registered
                res.redirect("/secrets")
            });
        } else{
            console.log(err);
            res.redirect("/register");
        }
    })
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    // The login function comes from passport
    req.login(user, function(err){
        if(!err){
            passport.authenticate("local");
            res.redirect("/secrets");
        } else {
            console.log(err);
        }
    })
   
});








app.listen(3000, function(){
    console.log("Server is running on port 3000");
});