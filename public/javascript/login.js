function showAlert(message) {
  Toastify({
    text: message,
    duration: 1500,
    close: true,
    style: {
      borderRadius: "12px",
      color: "#a3abb3",
      padding: "12px 16px",
      position:"absolute",
      left:"20%",
      top:"20%",
      backgroundColor: "#1e2021",
      display:"flex",
      gap:"15px"
    }
  }).showToast();
}
let form = document.querySelector('form');
form.addEventListener('submit', function (e) {
    e.preventDefault();
    let formData = new FormData(e.target);
    fetch('/loginData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            Object.fromEntries(formData.entries())
        )
    }).then(res => res.json())
        .then(data => {
            showAlert(data.message)
            if (data.message === 'Login successful') {
                setTimeout(()=>{
                    window.location.href = '/home';
                },2000)
            } else {
                showAlert(data.message);
            }
        });
});
document.addEventListener('DOMContentLoaded', async function () {
    const response = await fetch('/autoLogin', {
        method: 'post',
        body: 'include'
    });
    const data = await response.json();
    if (data.message === 'Auto login successful') {
            showAlert("Welcome back, " + data.username);
        setTimeout(() => {
            window.location.href = '/home';
        }, 2000)
    }
    else{
        showAlert(data.message);
    }
})