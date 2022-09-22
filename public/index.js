function registerErrorMessage() {
    var error = document.getElementById("error")
    const pass1 = document.getElementById("pass1").value;
    const pass2 = document.getElementById("pass2").value;
    const pass = document.querySelector(".pass");
    if ((pass1 != pass2) && (pass1 != "" && pass2 != "")) {
        error.textContent = "Passwords do not match";
        error.style.color = "red";
    } else {
        error.innerHTML = "";
    }
}

function login(){
    window.location='https://to-do-list-xx.herokuapp.com/login';
}