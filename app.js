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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    password: String,
    googleId: String,
    secret: String

});

// The following will hash and salt our passwords, aswell as to save the data in mongodb
userSchema.plugin(passportLocalMongoose);
// Plugin findOrCreate
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

// Serialize creates the cookie
passport.serializeUser(function(user, done){
    done(null, user.id)
});
//  Deserialize breaks the cookie and allows the browser to see whats inside of it
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user)
    })
});

////////////// GOOGLE OAUTH //////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackUrl: "http://localhost:3000/auth/google/secrets",
    redirectUri: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "http://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb){
    console.log(profile);
    User.findOrCreate({googleId: profile.id}, function(err, user){
        return cb(err, user);
    });
    }
));





app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
    // Authentificate using google
    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets",
passport.authenticate("google", {failureRedirect: "/login"}),
function(req, res){
    res.redirect("secrets");
});




app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    // The ne means not equal to, so this line of code checks if the secret is not null
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (!err){
            if (foundUsers){
                res.render("secrets", {userWithSecrets: foundUsers})
            }
        }
    })
});

app.get("/submit", function(req, res){
    // Check if user is authentificated
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    // This saves the data of the logged in user
    User.findById(req.user.id, function(err, foundUser){
        if(!err){
            if (foundUser){
                foundUser.secret = submittedSecret,
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})




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
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        } else {
            console.log(err);
        }
    })
   
});



app.listen(3000, function(){
    console.log("Server is running on port 3000");
});