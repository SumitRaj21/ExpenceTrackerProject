let form=document.getElementById('form');
form.addEventListener('submit', function(event){
    event.preventDefault();
        let email=document.querySelector('#email').value;
        let myobj={
            email:email
        }
axios.post('http://localhost:8000/admin/forget-password',myobj)
    .then((response) => {
            if(response.status==202){
                alert("Please check your mail for reset password link");
               window.location.href='./login.html';
            }else{
                alert("Please Enter Valid mail id");
                window.location.href='./forget.html';
            }
    })
    .catch((error) =>{
        document.body.innerHTML+=`<div style="color:red">${error.message}</div>`
    });
});