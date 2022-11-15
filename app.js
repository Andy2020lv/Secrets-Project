require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {family: 4});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// To see the files in the .env file use the following syntax
// console.log(process.env.API_KEY);


// Create a secrete constant to procceed with the encryption. This is the key

// const secret = "Thisisoutlittlesecret";
// This however will encrypt the entire database, so we need to add encryptedfields
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });            

const User = new mongoose.model("User", userSchema)





app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    ////////// This is how to use bcrypt /////////////////
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        const newUser = new User({
            email: req.body.username,
            // Use the hash function
            password: hash
    });

    //////// This is how to use md5 /////////////
    // const newUser = new User({
    //     email: req.body.username,
    //     // Use the hash function
    //     password: md5(req.body.password)
    // });
    
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        } else{
            console.log(err);
        }
    });
});
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    ;

    // When using the find method, the password get automatically decrypted
    User.findOne({email: username}, function(err, foundUser){
        if(!err){
            if (foundUser){
                /////// USE bcrypt TO LOGIN /////////////
                bcrypt.compare(password, foundUser.password, function(err, result){
                    if (result === true){
                        res.render("secrets");
                    }
                });
                // if (foundUser.password === password){
                //     res.render("secrets");
                // }
                
            }      
        } else{
          console.log(err);
        }
    });
});












app.listen(3000, function(){
    console.log("Server is running on port 3000");
});