// require("dotenv").config();
const express = require("express");
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session'); 
const passportJWT = require('./authentication/auth');
const cors = require('cors');
const app = express();


const port = 8000;
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

// mongoose.set('strictQuery', false);
const url ='mongodb://localhost:27017/financial '

mongoose.connect(url).then(()=>{
    console.log('Database connected');
}).catch((err)=>{
    console.log(err);
});

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false,
    cookie :{
        maxAge : 60*100*100
    }
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/',require('./router/router'))

app.listen(port, (err) => {
    if(err)
    {
        console.log(err);
    }
    console.log(`Server is running on port ${port}`);
});



