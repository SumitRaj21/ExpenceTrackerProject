let form=document.getElementById('form');
form.addEventListener('submit', function(event){
    event.preventDefault();
        let email=document.querySelector('#email').value;
        let password=document.querySelector('#password').value;
        let myobj={
            email:email,
            password:password
        }
axios.post('http://localhost:8000/admin/login',myobj)
    .then((response) => {
            alert(response.data.message);
            localStorage.setItem('token',response.data.token);
            window.location.href="./expense.html";
    })
    .catch((error) =>{
        console.log(error);
        document.body.innerHTML+=`<div style="color:red">${error.message}</div>`
    });
});

function forgetpassword(){
        window.location.href='./forget.html';
}