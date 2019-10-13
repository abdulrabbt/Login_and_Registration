var express = require("express");
var app = express();
var mongoose = require("mongoose");
var session = require("express-session");
var flash = require("express-flash");
var bcrypt = require("bcrypt");
var validate = require("mongoose-validator");

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(flash());
app.use(express.static(__dirname + "/static"));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: "QWERT!@#$%^&*()",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

mongoose.connect("mongodb://localhost/login_registration", {useNewUrlParser: true, useUnifiedTopology: true});

var UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        validate: {
            validator: function(value){
                return /^[A-z]+$/.test(value)
            },
            message: "Please enter a valid first name!"
        }
    },
    lastName: {
        type: String,
        required: true,
        validate: {
            validator: function(value){
                return /^[A-z]+$/.test(value)
            },
            message: "Please enter a valid last name!"
        }
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function(value){
				return /@/.test(value)
            },
            message: "Please enter a valid email address!"
        }
    },
    birthday: {
        type: Date,
        required: true,
        validate: {
            validator: function(value){
                return value instanceof Date;
            },
            message: "Please enter a valid birthday!"
        } 
    },
    password: {
        type: String,
        required: true,
        validate: {
			validator: function(value){
				return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,120}/.test(value);
			},
			message: "Password must contain at least 1 number, Uppercase Letter, and special character."
        } 
    }
}, {timestamps: true});

mongoose.model("User", UserSchema);
var User = mongoose.model("User");

app.get("/", function(req, res){
    res.render("index");
});
app.post('/register',function(request,response){
    console.log(request.body)
    new User({first_name: request.body.first_name, last_name: request.body.last_name, birthday: request.body.birthday, email: request.body.email, password: request.body.password}).validate()
        .then((user)=>{
           bcrypt.hash(user.password,10)
                .then((hashed_pass)=>{
                    user.password = hashed_pass;
                })
                .catch((error)=>{
                    for(var key in error.errors){
                        request.flash('registration', error.errors[key].message);
                    }
                    response.redirect('/')
                })
            user.save()
                .then((user)=>{
                    response.redirect('/')
                })
                .catch((error)=>{
                    for(var key in error.errors){
                        request.flash('registration', error.errors[key].message);
                    }
                    response.redirect('/')
                })
        })
        .catch((error)=>{
            for(var key in error.errors){
                request.flash('registration', error.errors[key].message);
            }
            response.redirect('/')
        });
});


app.post('/login',function(request,response){
    User({email: request.body.email, password: request.body.password}).validate()
        .then((user)=>{
            bcrypt.hash(request.body.password,10)
        .then((hashed_pass)=>{
            User.find({email:request.body.email,password: hashed_pass})
                .then((user)=>{
                    request.session = {first_name:user.first_name,last_name:user.last_name,email:user.email,birthday:user.birthday};
                    response.redirect('/')
                })
                .catch((error)=>{
                    for(var key in error.errors){
                        request.flash('login', error.errors[key].message);
                    }
                    response.redirect('/')
                })
        })
        .catch((error)=>{
            for(var key in error.errors){
                request.flash('login', error.errors[key].message);
            }
            response.redirect('/')
        });
    });
});


app.listen(8000, function(){
    console.log("Listening on port: 8000");
});