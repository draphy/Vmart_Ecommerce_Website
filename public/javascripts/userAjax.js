//Ajax User Sign-In
function userSignIn() {
  let status = true;

  const email = document.getElementById("userLoginemail");
  const password = document.getElementById("userLoginpassword");

  checkInputs();

  function checkInputs() {
    // trim to remove the whitespaces

    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    if (emailValue === "") {
      setErrorFor(email, "Email cannot be blank");
      status = false;
    } else if (!isEmail(emailValue)) {
      setErrorFor(email, "Not a valid email");
      status = false;
    } else {
      setSuccessFor(email);
    }

    if (passwordValue === "") {
      setErrorFor(password, "Password cannot be blank");
      status = false;
    } else  if (passwordValue.length < 8) {
      setErrorFor(password, "Password should contain 8 characters");
      status = false;
    } else {
      setSuccessFor(password);
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

function userSignInButton() {
  let status = userSignIn();
  if (status) {
    $.ajax({
      url: "/homepage/user_signin",
      data: $("#userSignIn").serialize(),
      method: "POST",
      success: (response) => {
        if (response.message) {
          swal.fire({
            title: `${response.message} is Wrong`,
            text: `Try another ${response.message}`,
            icon: "error",
            dangerMode: true,
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "You Have Successfully  ",
            text: "Logged In",
            showConfirmButton: false,
            timer: 2500,
          }).then((state) => {
            if (state) {
              window.location.href = "/homepage";
            }
          });
        }
      },
    });
  } else {
    return false;
  }
}

//Ajax User Sign-Up
function userSignUp() {
  let status = true;

  const names = document.getElementById("userSignUpname");
  const username = document.getElementById("userSignUpusername");
  const email = document.getElementById("userSignUpemail");
  const password = document.getElementById("userSignUppassword");
  const password2 = document.getElementById("userSignUppassword2");
  const phoneNumber = document.getElementById("userSignUpphoneNumber");

  checkInputs();

  function checkInputs() {
    // trim to remove the whitespaces
    const nameValue = names.value.trim();
    const usernameValue = username.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const password2Value = password2.value.trim();
    const phoneNumberValue = phoneNumber.value.trim();
    const phoneNumberLength = phoneNumber.value.length;

    if (status) {
      if (nameValue === "") {
        setErrorFor(names, "Name cannot be blank");
        status = false;
      } else if (!isName(nameValue)) {
        setErrorFor(names, "Numbers is not allowed");
        status = false;
      } else {
        setSuccessFor(names);
      }
    }

    if (status) {
      if (usernameValue === "") {
        setErrorFor(username, "Lastname cannot be blank");
        status = false;
      } else if (!isName(usernameValue)) {
        setErrorFor(username, "Numbers is not allowed");
        status = false;
      } else {
        setSuccessFor(username);
      }
    }

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
      }else  if (passwordValue.length < 8) {
        setErrorFor(password, "Password should contain 8 characters");
        status = false;
      } else {
        setSuccessFor(password);
      }
    }

    if (status) {
      if (password2Value === "") {
        setErrorFor(password2, "Confirm Password cannot be blank");
        status = false;
      } else if (passwordValue !== password2Value) {
        setErrorFor(password2, "Passwords does not match");
        status = false;
      } else {
        setSuccessFor(password2);
      }
    }
    if (status) {
      if (phoneNumberValue === "") {
        setErrorFor(phoneNumber, "Phone-Number cannot be blank");
        status = false;
      } else if (phoneNumberLength > 10 || phoneNumberLength < 10) {
        setErrorFor(phoneNumber, "This service is only available on India");
        status = false;
      } else {
        setSuccessFor(phoneNumber);
      }
    }
  }

  function setErrorFor(input, message) {
    const formControl = input.parentElement;
    const small = formControl.querySelector("small");
    formControl.className = "form-control1 error";
    small.innerText = message;
  }

  function setSuccessFor(input) {
    const formControl = input.parentElement;
    formControl.className = "form-control1 success";
  }
  function isName(name) {
    return /^[a-z A-Z]+$/.test(name);
  }
  function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );
  }

  return status;
}

function userSignUpButton() {
  let status = userSignUp();
  if (status) {
    $.ajax({
      url: "/homepage/user_registration",
      data: $("#userSignUp").serialize(),
      method: "POST",
      success: (response) => {
        if (response.referral) {
          swal.fire({
            title: response.referral,
            text: `Try another Referral Code`,
            icon: "error",
            dangerMode: true,
          });
        } else if (response.message) {
          swal.fire({
            title: `User Already Exists`,
            text: `Try another ${response.message}`,
            icon: "error",
            dangerMode: true,
          });
        } else {
          if (response.error) {
            swal.fire({
              title: `${response.error}`,
              text: "Type Correct Phone-Number (this service is only available on India)",
              icon: "error",
              dangerMode: true,
            });
          } else {
            document.getElementById(
              "loginSignInWrite"
            ).innerHTML = `<div class="card-body py-5 px-md-5" style="text-align: center ;clear:center;"><h4>Verify your Phone Number</h4><br><form onkeydown="return event.key != 'Enter';" id="otpnumber"><input type="hidden" name="text" id="" value="Registered" ><input type="hidden" name="_id" id="" value="${response._id}" ><input type="hidden" name="name" id="" value="${response.name}" ><input type="hidden" name="phoneNumber" id="" value="${response.phoneNumber}" ><input type="number" name="otp" id="" style="width:5rem"><label for="otp">&nbsp&nbspEnter the OTP</label></form><br><button type="submit" id="otpSubmit"  class="btn btn-primary btn-block mb-4" onclick="otpVerify()" >Submit</button> </div>`;
          }
        }
      },
    });
  } else {
    return false;
  }
}

//Ajax OtpVerify

function otpVerify() {
  $.ajax({
    url: "/homepage/user_verification",
    data: $("#otpnumber").serialize(),
    method: "POST",
    success: (response) => {
      if (response.message) {
        swal.fire({
          title: `${response.message}`,
          text: `Try one more time`,
          icon: "error",
          dangerMode: true,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "You Have Successfully ",
          text: `${response.text}`,
          showConfirmButton: false,
          timer: 2500,
        }).then((state) => {
          if (state) {
            window.location.href = "/homepage";
          }
        });
      }
    },
  });
}

// Ajax Otp Login

function otplogin() {
  let status = true;

  const phoneNumber = document.getElementById("userOtpLoginphoneNumber");

  checkInputs();

  function checkInputs() {
    // trim to remove the whitespaces

    const phoneNumberValue = phoneNumber.value.trim();
    const phoneNumberLength = phoneNumber.value.length;

    if (phoneNumberValue === "") {
      setErrorFor(phoneNumber, "Phone-Number cannot be blank");
      status = false;
    } else if (phoneNumberLength > 10 || phoneNumberLength < 10) {
      setErrorFor(phoneNumber, "This service is only available on India");
      status = false;
    } else {
      setSuccessFor(phoneNumber);
    }
  }

  function setErrorFor(input, message) {
    const formControl = input.parentElement;
    const small = formControl.querySelector("small");
    formControl.className = "form-control1 error";
    small.innerText = message;
  }

  function setSuccessFor(input) {
    const formControl = input.parentElement;
    formControl.className = "form-control1 success";
  }

  if (status) {
    $.ajax({
      url: "/homepage/user_otp_login",
      data: $("#userOtpLogin").serialize(),
      method: "POST",
      success: (response) => {
        if (response.message) {
          swal.fire({
            title: `User Not Found`,
            text: `Try another ${response.message} or Register`,
            icon: "error",
            dangerMode: true,
          });
        } else {
          if (response.error) {
            swal.fire({
              title: `${response.error}`,
              text: "Type Correct Phone-Number (this service is only available on India)",
              icon: "error",
              dangerMode: true,
            });
          } else {
            document.getElementById(
              "loginSignInWrite"
            ).innerHTML = `<div class="card-body py-5 px-md-5" style="text-align: center ;clear:center;"><h4>Verify your Phone Number</h4><br><form onkeydown="return event.key != 'Enter';" id="otpnumber"><input type="hidden" name="text" id="" value="Logged In" ><input type="hidden" name="_id" id="" value="${response._id}" ><input type="hidden" name="name" id="" value="${response.name}" ><input type="hidden" name="phoneNumber" id="" value="${response.phoneNumber}" ><input type="number"  name="otp" id="" style="width:5rem"><label for="otp">&nbsp&nbspEnter the OTP</label></form><br><button type="submit" id="otpSubmit"  class="btn btn-primary btn-block mb-4" onclick="otpVerify()" >Submit</button> </div>`;
          }
        }
      },
    });
  } else {
    return false;
  }
}

function singleAddToCart(productId, instock) {
  if (Number(instock) > 10) {
    $.ajax({
      url: "/homepage/add_to_cart",
      data: { productId: productId, quantity: 1, weight: 500 },
      method: "POST",
      success: function (response) {
        if (response.state) {
          Swal.fire({
            icon: "success",
            title: "Added to Cart",

            showConfirmButton: false,
            timer: 2500,
          }).then((state) => {
            if (state) {
              if (response.message == "insert") {
                let countOrg = document.getElementById(
                  "spanCartProductCount"
                ).innerHTML;
                console.log(countOrg, "hi");
                document.getElementById("spanCartProductCount").innerHTML =
                  Number(countOrg) + 1;
              }
            }
          });
        } else {
          showPopup();
        }
      },
      error: function (err) {
        alert("Something Error");
      },
    });
  } else {
    Swal.fire({
      icon: "info",
      title: "Product Out Of Stock",

      showConfirmButton: false,
      timer: 1500,
    });
  }
}

function singleAddToWishlist(productId, weight) {
  $.ajax({
    url: "/homepage/add_to_wishlist",
    data: { productId: productId, weight: weight },
    method: "POST",
    success: function (response) {
      if (response.message == "insert") {
        Swal.fire({
          icon: "success",
          title: "Added to Wishlist",

          showConfirmButton: false,
          timer: 2500,
        }).then((state) => {
          if (state) {
            if (state) {
              document.getElementById(
                `wishlistState${productId}`
              ).innerHTML = ` <a href="javascript:void(0);" onclick="singleAddToWishlist('${productId}', 500)" style="background-color: #739f03; border-color:#739f03;  "><i class="fa fa-heart" style=" color: white;"></i></a> `;

              let countOrg = document.getElementById(
                "spanWishlistProductCount"
              ).innerHTML;
              console.log(countOrg, "hi");
              document.getElementById("spanWishlistProductCount").innerHTML =
                Number(countOrg) + 1;
            }
          }
        });
      } else if (response.message == "pull") {
        Swal.fire({
          icon: "error",
          title: "Removed from Wishlist",

          showConfirmButton: false,
          timer: 2500,
        }).then((state) => {
          if (state) {
            if (state) {
              document.getElementById(
                `wishlistState${productId}`
              ).innerHTML = ` <a href="javascript:void(0);" onclick="singleAddToWishlist('${productId}', 500)"><i class="fa fa-heart"></i></a>  `;

              let countOrg = document.getElementById(
                "spanWishlistProductCount"
              ).innerHTML;
              console.log(countOrg, "hi");
              document.getElementById("spanWishlistProductCount").innerHTML =
                Number(countOrg) - 1;
            }
          }
        });
      } else {
        showPopup();
      }
    },
    error: function (err) {
      alert("Something Error");
    },
  });
}
