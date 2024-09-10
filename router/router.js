const express  = require("express");

const router = express.Router();
const passport = require('passport');
const controller = require('../controller/controller');

router.get('/',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}),controller.home);
router.post('/createUser', controller.createUser);
router.delete('/deleteUser/:id',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.deleteUser);
router.put('/updateUser/:id',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.updateUser);
router.get("/loginFailed",async (req,res)=>{
    return res.json({status:200,msg:"First you have to login"});
});
router.post('/login', controller.login);
router.post('/forgot-password',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}),controller.forgotPassword);
router.post('/reset-password',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.resetPassword);
router.post('/addInvestment',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.addInvestment);
router.get('/getInvestment/:id', passport.authenticate('jwt', {failureRedirect:'/loginFailed'}), controller.getInvestment);
router.get ('/investment-ledger',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.getAllInvestmentLedger);
router.put('/update-investment-ledger',passport.authenticate('jwt',{failureRedirect:'/loginFailed'}), controller.updateInvestmentLedger);

module.exports = router;