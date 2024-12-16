const express=require('express');
const mysqlPool=require('./config/db');
const cors=require('cors');

const dotenv = require('dotenv');
const app=express();
dotenv.config();
const PORT=8000;
app.use(cors());
app.use(express.json());
const bodyparser=require('body-parser');

app.use(bodyparser.urlencoded({extended:true}));
app.use('/admin',require('./routes/main'))

mysqlPool.query('SELECT 1').then(()=>{
    console.log("DB Connected");

    app.listen(PORT,()=>{
        console.log("Server connected");
    });
}).catch(err=>console.log(err));