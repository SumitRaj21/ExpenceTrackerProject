
// const key=process.env.JWT_SECRET;
// const dotenv = require('dotenv');
// const key=process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const db=require('../config/db');
const authenticate = async(req, res, next) => {
    try {
        const token = req.header('Authorization');
        const user = jwt.verify(token, process.env.JWT_SECRET );

        const data=await db.query('SELECT id FROM users WHERE id=?',[user.userId]);
        if(data[0].length==0){
            return res.status(404).json({success: false, message:"User Does not exist"});
        }
        next();
      } catch(err) {
        console.log(err);
        return res.status(401).json({success: false})
      }

}

module.exports = {
    authenticate
}