//Ajax admin Sign-In
function adminSignIn() {
  let status = true;

  const email = document.getElementById("adminLoginemail");
  const password = document.getElementById("adminLoginpassword");

  checkInputs();

  function checkInputs() {
    // trim to remove the whitespaces

    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    if (status) {
      if (emailValue === "") {
        setErrorFor(email, "Email cannot be blank");
        status = false;
      } else if (!isEmail(emailValue)) {
        setErrorFor(email, "Not a valid email");
        status = false;
      } else {
        setSuccessFor(email);
      }
    }

    if (status) {
      if (passwordValue === "") {
        setErrorFor(password, "Password cannot be blank");
        status = false;
      } else {
        setSuccessFor(password);
      }
    }
  }

  function setErrorFor(input, message) {
    const formControl = input.parentElement;
    const small = formControl.querySelector("small");
    formControl.className = "form-control2 error";
    small.innerText = message;
  }

  function setSuccessFor(input) {
    const formControl = input.parentElement;
    formControl.className = "form-control2 success";
  }

  function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );
  }

  return status;
}

function adminSignInButton() {
  let status = adminSignIn();

  if (status) {
    $.ajax({
      url: "/admin_panel/admin_login",
      data: $("#adminSignInForm").serialize(),
      method: "POST",
      success: (response) => {
        if (response.message) {
          document.getElementById("adminLoginErrorLabel").innerText =
            response.message;
        } else {
          Swal.fire({
            icon: "success",
            title: "You Have Successfully  ",
            text: "Logged In",
            showConfirmButton: false,
            timer: 2500,
          }).then((state) => {
            if (state) {
              window.location.href = "/admin_panel";
            }
          });
        }
      },
    });
  } else {
    return false;
  }
}
