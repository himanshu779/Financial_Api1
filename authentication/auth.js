const passport = require('passport')
var JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {

    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : "testkey"
}

const user = require('../model/model')
passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    let findUserData =await user.findOne({email: jwt_payload.userData.email});
    
    if(findUserData)
    {
        if(findUserData.password === jwt_payload.userData.password)
        {
            return done(null,findUserData);
        }
        else
        {
            return done(null,false);
        }
    }
    else
    {
        return done(null, false);
    }       

}));

passport.serializeUser(function(user,done){
    return done(null,user.id);
})

passport.deserializeUser(async function(id,done){
    let userRecord = await user.findById(id);
    if(userRecord){
        return done(null,userRecord);
    }
    else{
        return done(null,false);
    }
});

module.exports = passport;  