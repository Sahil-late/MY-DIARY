
const content = document.getElementsByClassName("content")[0];
const form = document.getElementById("noteBookPage");
const pageNo = document.querySelector('.pageNo');
const dateDisplay = document.querySelector('.date');
const page = document.querySelector('input[name="pageNo"]')
const sidebar = document.getElementsByClassName("sidebar")[0];
const header = document.getElementsByClassName('header')[0]
const hiddenAction = document.getElementById('hiddenAction');
function showAlert(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    close: true,
    backgroundColor: "#1e2021",
    style: {
      borderRadius: "12px",
      color: "#a3abb3",
      padding: "12px 16px"
    }
  }).showToast();
}

function showAlertData(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "left",
    close: true,
    backgroundColor: "#1e2021",
    style: {
      borderRadius: "12px",
      color: "#a3abb3",
      padding: "12px 16px",
      left: "40px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.2)"

    }
  }).showToast();
}

let lastValidValue = "";
let lastsidebarValue = "";
window.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.querySelector('.date');
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  if (mm < 10) mm = '0' + mm;
  if (dd < 10) dd = '0' + dd;
  let hours = (today.getHours() < 10 ? `0${today.getHours()}` : `${today.getHours()}`)
  let minutes = (today.getMinutes() < 10 ? `0${today.getMinutes()}` : `${today.getMinutes()}`)
  let secs = (today.getSeconds() < 10 ? `0${today.getSeconds()}` : `${today.getSeconds()}`)
  dateInput.innerHTML = `<div class="fullDate">${dd}/${mm}/${yyyy}</div><div class='text-sm bg-white text-gray-100 flex justify-center items-center rounded'><span class="hours">${hours}</span><span class='divider'>:</span><span class="minutes">${minutes}</span><span class='divider'>:</span><span class="seconds">${secs}</span></div>`;
});

content.addEventListener("input", () => {
  if (content.scrollHeight > content.clientHeight) {
    content.value = lastValidValue;
    showAlert("Page is full, you can’t write");
  } else {
    lastValidValue = content.value;
  }
});

sidebar.addEventListener("input", () => {
  if (sidebar.scrollHeight > sidebar.clientHeight) {
    sidebar.value = lastsidebarValue;
    alert("sidebar is full, you can’t write");
  } else {
    lastsidebarValue = sidebar.value;
  }
});

let clickedButton = null
document.querySelectorAll('button[name="action"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    clickedButton = e.target;
  });
});


form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullDate = document.querySelector('.fullDate');
  const hoursSpan = document.querySelector('.hours');
  const minutesSpan = document.querySelector('.minutes');
  const secondsSpan = document.querySelector('.seconds');
  const date = document.querySelector('input[name="date"]');
  date.value = JSON.stringify({
    date: fullDate.innerHTML,
    time: { hours: hoursSpan.innerHTML, minutes: minutesSpan.innerHTML, seconds: secondsSpan.innerHTML }
  });
  page.value = JSON.stringify({
    page: pageNo.innerHTML
  });
  if (clickedButton) {
    hiddenAction.value = clickedButton.value;
    if (Number(pageNo.innerHTML) === 1 && clickedButton.value === 'prevpage') {
      showAlert("This is the first page, you can't go to previous page");
      return;
    }
    if (clickedButton.value === 'prevpage' || clickedButton.value === 'nextpage') {
      form.submit()
      return;
    }
  }
  let headerContent = header.value.trim();
  let contentData = content.value.trim();
  if (!headerContent || !contentData) {
    showAlertData('fill all fields');
    return;
  }
  if (headerContent.length < 12 || contentData.length < 500) {
    showAlertData('content is too short')
    return
  }
  form.submit();
});

let usernameDiv = document.querySelector('.username');
let username = document.getElementById('username').value;
let logout = document.querySelector('.logout');
if (!username == '') {
  localStorage.setItem('username', username);
  let usernameInitial = localStorage.getItem('username');
  usernameDiv.textContent = usernameInitial.charAt(0).toUpperCase();
}
usernameDiv.addEventListener('click', () => {
  logout.classList.toggle('hidden');
});

logout.addEventListener('click', function (){
   fetch('/logout', {
        method: 'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body: JSON.stringify({data:'dummy data'}),
    }).then((res)=> res.json())
    .then((data)=>{
      if (data === 'logout') {
        showAlert('Logged out successfully');
        setTimeout(()=>{
          window.location.href = '/';
        },2000)
      }
    })    
})