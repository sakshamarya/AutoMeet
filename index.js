function changeStatus()
{
    let status = document.querySelector('.status');
    status.innerHTML = 'App running ..';
    status.style.backgroundColor = "green";
}

// fetch('/invalid-Email',()=>{
//     alert('Invalid Email.');
// });

// fetch('/invalid-Password',() => {
//     alert('Invalid Password.');
// });

// fetch('otp').then((otpNumber) => {
//     alert('comment added');
// })