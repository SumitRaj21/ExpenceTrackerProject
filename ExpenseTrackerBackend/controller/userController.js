const db=require('../config/db');
const bcrypt=require('bcrypt');
const path=require('path');
const jwt=require('jsonwebtoken');
const fs=require('fs');

const Razorpay=require('razorpay');
const PDFDocument = require('pdfkit');
const exceljs=require('exceljs');


const signupUser=async(req,res)=>{
    try {
        const {name,email,password}=req.body;
        if(!name || !email || !password){
            return res.status(505).send({
                success:false,
                message:"Please Provide all fields"
            })   
        }
        const hashpassword= await bcrypt.hash(password, 10);
        const data=await db.query(`INSERT INTO users (name,email,password) VALUES(?,?,?);`,
        [name,email,hashpassword]);
        if(!data){
            return res.status(404).send({
                success:false,
                message:"Error in insert Querry"
            })
        } 
       
        // res.status(201).json({success:true, message:"New user signed up successfully"});
        res.status(201).json({message: 'Successfuly create new user'});

    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Signup  API',
            error
        })
    }
};

const accessToken = (id, name, ispremiumuser) => {
    return jwt.sign({ userId : id, name: name, ispremiumuser:ispremiumuser } ,process.env.JWT_SECRET,{expiresIn:'2h'});
};

const loginUser=async(req,res)=>{
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(505).send({
                success:false,
                message:"Please Enter valid  Email and password"
            })   
        }
        const data=await db.query(`SELECT id,name, email,password,ispremiumuser FROM users WHERE email=?`,[email]);
        if(data[0].length==0){
            return res.status(404).json({success: false, message:"User Does not exist"});
        }

        const [userData]=data[0];
        const match = await bcrypt.compare(password, userData.password);
        if(match){
            res.status(200).json({success: true, message:"User Login Successfull",token:accessToken(userData.id,userData.name,userData.ispremiumuser)});
            
        }else{
            return res.status(404).json({success: false, message:"Invalid Password"});
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Login  API',
            error
        })
    }

}
const getExpense=async(req,res)=>{
 try {
    const token = req.header('Authorization');
    const user = jwt.verify(token, process.env.JWT_SECRET );
    const data=await db.query(`SELECT id, expenseamount,category,description FROM userdata WHERE user_id=?`,[user.userId]);
    res.status(200).send(data[0]);
 } catch (error) {
    console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Get user Expense by Id  API',
            error
        })
 }
}

const deleteExpense = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || isNaN(id)) {
            return res.status(400).send({
                success: false,
                message: "Invalid or missing ID",
            });
        }
        const [result] = await db.query(`DELETE FROM userdata WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).send({
                success: false,
                message: "Expense not found",
            });
        }
      return  res.status(200).send({
            success: true,
            message: "Successfully deleted",
        });

    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).send({
            success: false,
            message: "Error deleting expense",
        });
    }
};


const addExpense=async(req,res)=>{
   try {
    const token = req.header('Authorization');
    const user = jwt.verify(token, process.env.JWT_SECRET );
    const {expenseamount,description,category}=req.body;
    if(!expenseamount || !description || !category){
        return res.status(505).send({
            success:false,
            message:"Please Provide all fields"
        })   
    }
    const data=await db.query(`INSERT INTO userdata (user_id,expenseamount,category,description) VALUES(?,?,?,?);`,
        [user.userId,expenseamount,category,description]);
    if(!data){
        return res.status(404).send({
            success:false,
            message:"Error in insert Querry"
        })
    }
    res.status(201).send({
        success:true,
        message:'New Record Created',
        })
   } catch (error) {
    console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in add user Expense by Id  API',
            error
        })
   }
    
    

}

const purchasepremium=async(req,res)=>{
        try {
            var rzp=new Razorpay({
                key_id:process.env.RAZORPAY_KEY_ID,
                key_secret:process.env.RAZORPAY_KEY_SECRET
            })
            const token = req.header('Authorization');
             const user = jwt.verify(token, process.env.JWT_SECRET );

            const amount=100;
            rzp.orders.create({amount, currency: "INR"}, (err, order) => {
                if(err) {
                    res.status(403).json({ message: 'Sometghing went wrong', error: err});

                }
                const data= db.query(`INSERT INTO userorder (user_id,orderid,orderstatus) VALUES (?,?,?);`,
                    [user.userId,order.id,'PENDING']);
                if(!data){
                    return res.status(404).send({
                        success:false,
                        message:"Error in insert Querry"
                    })
                } 
                return res.status(201).json({ order, key_id : rzp.key_id});


            })
            
        } catch (error) {
            console.log(error);
            res.status(403).json({ message: 'Sometghing went wrong', error: error});
        }
}

const updateTransactionStatus1=async(req,res)=>{
    try {
        const token = req.header('Authorization');
        const user = jwt.verify(token, process.env.JWT_SECRET );
        const userId=user.userId;
        console.log(req.body);
        const { payment_id, order_id} = req.body;
        const userOrderStatus= await db.query( `UPDATE userorder SET paymentid = ?, orderstatus = ? WHERE orderid = ? AND user_id = ?;`,[payment_id,'SUCCESSFUL',order_id,userId]);
        const userStatus=await db.query( `UPDATE users SET ispremiumuser = ? WHERE id = ?;`,[true,userId]);
        Promise.all([userOrderStatus,userStatus]).then(()=>{
            return  res.status(202).send({ success:true, message:'Transaction Successful'});
        }).catch(err=>console.log(err));    
    } catch (error) {
        console.log(error);
        res.status(403).json({ errpr: error, message: 'Sometghing went wrong' });
    }

}

const updateTransactionStatus0=async(req,res)=>{
    try {
        const token = req.header('Authorization');
        const user = jwt.verify(token, process.env.JWT_SECRET );
        const userId=user.userId;
        console.log(req.body);
        const {order_id} = req.body;
        const userOrderStatus= await db.query( `UPDATE userorder SET  orderstatus = ? WHERE orderid = ? AND user_id = ?;`,['FAILED',order_id,userId]);  
        return  res.status(202).send({ success:false, message:'Transaction failed'});  
    } catch (error) {
        console.log(error);
        res.status(403).json({ errpr: error, message: 'Sometghing went wrong' });
    }

}

const ispremiumUser=async(req,res)=>{
    try {

        const token = req.header('Authorization');
        const user = jwt.verify(token, process.env.JWT_SECRET );
        const userId=user.userId;
        const data=await db.query(`SELECT ispremiumuser From users WHERE id=?;`,[userId]);
        res.status(200).send(data[0]);
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in ispremium user API',
            error
        })
    }
}

const getLeaderboard=async(req,res)=>{
    try {
        const data=await db.query(`SELECT name, Total_Expenses FROM users  ORDER BY Total_Expenses DESC LIMIT 10;`);
        res.status(200).send(data[0]);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in leaderboard  API',
            error
        })
    }
}

const downloadExpense=async(req,res)=>{
        try {
            const workbook=new exceljs.Workbook();
            const worksheet=workbook.addWorksheet("User data");
            worksheet.columns=[
                {header:"S no.",key:"s_no"},
                {header:"Expense Amount",key:"expenseamount"},
                {header:"Category",key:"category"},
                {header:"Description",key:"description"},
                {header:"Created at",key:"created_at"},
            ];

            const token = req.header('Authorization');
            const user = jwt.verify(token, process.env.JWT_SECRET );
            const data=await db.query(`SELECT  expenseamount,category,description,created_at FROM userdata WHERE user_id=?`,[user.userId]);
            console.log(data[0]);
            const userData=data[0];
            let counter=1;
            userData.forEach((user)=>{
                user.s_no=counter;
                worksheet.addRow(user);
                counter++;
            });

            worksheet.getRow(1).eachCell((cell)=>{
                cell.font={bold:true};
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
            );
            res.setHeader("Content-Disposition",`attachment; filename=users.xlsx`);

            return workbook.xlsx.write(res).then(()=>{
                res.status(200);
            });


        } catch (error) {
            console.log(error.message)
        }
}

module.exports={
    signupUser,
    loginUser,
    getExpense,
    deleteExpense,
    addExpense,
    purchasepremium,
    updateTransactionStatus1,
    updateTransactionStatus0,
    ispremiumUser,
    getLeaderboard,
    downloadExpense
}