const db=require('../config/db');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const  randomstring = require("randomstring");
const sendMail=require('../config/nodemailer.js');

const forgetpassword=async(req,res)=>{
    try {
        const {email}=req.body;
        const data= await db.query(`SELECT id FROM users WHERE email=?`,[email]);
        const user = data[0].map(user => user.id);
        const user_id=user[0];
        if(data[0].length==0){
            res.status(200).send({success:false,message:"Invalid Email id"});
        }else{
        const token=randomstring.generate();
        const updateData=await db.query(`INSERT INTO forgetpassword (user_id,token,isactive) VALUES(?,?,?);`,[user_id,token,true]);
        await sendMail(email,token);
        res.status(202).send({success:true, message:'reset mail sent'});
        }  
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const resetpassword=async(req,res)=>{
       try {
        const {token}=req.query;
        const data=await db.query(`SELECT isactive FROM forgetpassword  WHERE token=?;`,[token]);
        const data1=data[0].map(user=>user.isactive);
        const isactive=data1[0];
        if(isactive==1){
        const data= await db.query(`SELECT user_id FROM forgetpassword WHERE token=?`,[token]);
        const user = data[0].map(user => user.user_id);
        const user_id=user[0];
        await db.query(`UPDATE forgetpassword SET isactive=? WHERE token=?;`,[false,token]);
        res.status(200).send(`<html>
            <script>
                function formsubmitted(e){
                    e.preventDefault();
                    console.log('called')
                }
            </script>
            <form action="/admin/update-password/${user_id}" method="post">
                <label for="newpassword">Enter New password</label>
                <input name="newpassword" type="password" required></input>
                <button>reset password</button>
            </form>
        </html>`
        )
        }else{
            res.status(410).send(`<html><h1>Link  expired </h1></html>`)
        }
       } catch (error) {
       
        res.status(400).send(error.message);
       }
}

const updatepassword=async(req,res)=>{
    try {
        const id=req.params.id;
        const {newpassword}=req.body;
        const hashpassword= await bcrypt.hash(newpassword, 10);
        await db.query(`UPDATE users SET password=? WHERE id=?`,[hashpassword,id]);
        res.status(202).send(`<html><h1>Password changed successfully</h1></html>`);
    } catch (error) {
        res.status(400).send(error.message);
    }
}



module.exports={
    forgetpassword,
    resetpassword,
    updatepassword
}