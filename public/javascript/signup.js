const form = document.querySelector('form');
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
      background: "#1e2021",
      display:"flex",
      gap:"15px"
    }
  }).showToast();
}
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const sign = document.querySelector('.sign');
    const passwordInput = document.getElementById('password');
    const rePasswordInput = document.getElementById('Re-Password');

    if (passwordInput.value !== rePasswordInput.value) {
        showAlert('Passwords do not match!');
        sign.disabled = false;
        return;
    }

    sign.disabled = true;

    const formData = new FormData(form);

    fetch('/signupData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            Object.fromEntries(formData.entries())
        )
    })
    .then(res => res.json())
    .then(data => {
        showAlert(data.message);
        if (data.message === 'User registered successfully') {
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    })
    .catch(err => {
        console.error(err);
        showAlert('Something went wrong');
    })
    .finally(() => {
        sign.disabled = false;
    });
});
