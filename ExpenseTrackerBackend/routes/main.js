const path=require('path');

const express=require('express');
const userAuthenticate=require('../middleware/auth');
const { signupUser, loginUser, getExpense, deleteExpense, addExpense, purchasepremium, updateTransactionStatus1,updateTransactionStatus0, ispremiumUser, getLeaderboard, downloadExpense } = require('../controller/userController');
const { forgetpassword, resetpassword, updatepassword } = require('../controller/resetpassword');

const router=express.Router();

router.post('/login',loginUser);

router.post('/signup',signupUser);


router.delete('/delete/:id',deleteExpense);

router.get('/expense', userAuthenticate.authenticate, getExpense);
router.get('/download-expense', userAuthenticate.authenticate, downloadExpense);


router.post('/addExpense',userAuthenticate.authenticate,  addExpense);

router.get('/premiummembership',userAuthenticate.authenticate,purchasepremium);

router.post('/updatetransaction1',userAuthenticate.authenticate,updateTransactionStatus1);
router.post('/updatetransaction0',userAuthenticate.authenticate,updateTransactionStatus0);
router.get('/ispremium',userAuthenticate.authenticate,ispremiumUser);
router.get('/leaderboard',userAuthenticate.authenticate,getLeaderboard);
router.post('/forget-password',forgetpassword);
router.get('/reset-password',resetpassword);
router.post('/update-password/:id',updatepassword);








module.exports=router;