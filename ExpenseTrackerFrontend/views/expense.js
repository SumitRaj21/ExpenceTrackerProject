
function addExpense(e){
    e.preventDefault();
    const expenseDetails={
        expenseamount:e.target.expenseamount.value,
        description:e.target.description.value,
        category:e.target.category.value,
    }
    const token=localStorage.getItem('token');
    axios.post("http://localhost:8000/admin/addExpense",expenseDetails,{headers:{"Authorization":token}})
    .then((response)=>{
        location.reload();
    }).catch(err=>console.log(err)); 
}

function premiumFeatures(){
    const hideButton = document.getElementById('rzp-button');
    hideButton.style.display = 'none'; 
    const showButton = document.getElementById('premium-user');
    showButton.style.display = 'inline';
    document.getElementById('lb-button').style.display = 'inline';
    document.getElementById('download-button').style.display = 'inline';
}


window.addEventListener("DOMContentLoaded",()=>{
    const token=localStorage.getItem('token');
    axios.get('http://localhost:8000/admin/ispremium',{headers:{"Authorization":token}})
    .then((response)=>{
        console.log(response);
        if(response.data[0].ispremiumuser==1){
            premiumFeatures();
        }
    }).catch(err=>console.log(err));
    axios.get('http://localhost:8000/admin/expense',{headers:{"Authorization":token}})
    .then((response)=>{
      response.data.map(user=>{
        displayUserOnScreen(user);
       })
    }).catch(err=>console.log(err));
});

function displayUserOnScreen(user) {
    const parentNode=document.getElementById("tbody");
    const childHTML=`     <tr id="${user.id}">
                <td>${user.expenseamount}</td>
                <td>${user.category}</td>
                <td>${user.description}</td>
                <td>
                        <form onsubmit="deleteUserData(${user.id})" style="display:inline;">
                            <input type="hidden" name="id" value=${user.id}>
                            <button onclick=deleteUserData(${user.id}) >Delete</button>
                        </form>
                    </td>
            </tr>`;
            parentNode.innerHTML+=childHTML;
  }

  function deleteUserData(id){
    axios.delete(`http://localhost:8000/admin/delete/${id}`)
    .then((response)=>{
        removeExpense(id);
    })
    .catch((err)=>{
      console.log(err);
    });
}
function removeExpense(id){
    const parentNode=document.getElementById("tbody");
    const childNodetoDelete=document.getElementById(id);
    if(childNodetoDelete){
        parentNode.removeChild(childNodetoDelete);
    }
    console.log("i worked");
  }

document.getElementById('rzp-button').onclick=async function (e) {
    const token=localStorage.getItem('token');
    const response=await axios.get('http://localhost:8000/admin/premiummembership',{headers:{"Authorization":token}});
    console.log(response);
    var options={
        "key":response.data.key_id,
        "order_id":response.data.order.id,
        "handler": async function (response) {
            await axios.post('http://localhost:8000/admin/updatetransaction1',{
                order_id:options.order_id,
                payment_id:response.razorpay_payment_id
            },{headers:{"Authorization":token}})

            alert("You are Premium user now");
            premiumFeatures();
        },
    };
    const rzp1= new Razorpay(options);
    rzp1.open();
    e.preventDefault();

    rzp1.on('payment.failed', async function(response){
        console.log(response);
        await axios.post('http://localhost:8000/admin/updatetransaction0',{
            order_id:options.order_id,
        },{headers:{"Authorization":token}})
        alert("Something went wrong");
    });

}

let flag=0;
document.getElementById('lb-button').addEventListener('click', async function(e) {
    e.preventDefault();
    if(flag==0){
        const token=localStorage.getItem('token');
        const response= await axios.get('http://localhost:8000/admin/leaderboard',{headers:{"Authorization":token}});
      document.getElementById('leaderboard').style.display='inline';
      const parentNode=document.getElementById("tbody1");
      response.data.map(user=>{
       const childHTML=`     <tr>
                  <td>${user.name}</td>
                  <td>${user.Total_Expenses}</td>
              </tr>`;
              parentNode.innerHTML+=childHTML;
      })
      flag=1;
    } 
});


document.getElementById('download-button').addEventListener('click', async(e) => {
    e.preventDefault();
    try {
        const endpoint = 'http://localhost:8000/admin/download-expense'; 
        const token = localStorage.getItem('token');
        const response = await axios.get(endpoint, { headers: {"Authorization": token },
            responseType: 'blob', 
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'users.xlsx'); 
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Error downloading expense:', error);
        alert('Failed to download expense report. Please try again.');
    }
    
});
