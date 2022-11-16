//Ajax Userlist DataTable
$(document).ready(function () {
  $("#adminUsersDataTable").DataTable();
});

// Ajax Admin Block User

function adminBlockUser(id, state, checkboxId) {
  const userBlockedContainer = document.getElementById(id);

  console.log(typeof state);
  if (state == "true") {
    state = false;
  } else {
    state = true;
  }
  console.log(state);
  $.ajax({
    url: "/admin_panel/block_user",
    data: { _id: id, block: state },
    method: "PATCH",
    success: (response) => {
      if (response.state) {
        console.log("user Blocked");
        swal
          .fire({
            title: "User Blocked ",
            icon: "error",
            dangerMode: true,
            showConfirmButton: false,
            timer: 1500,
          })
          .then((state) => {
            if (state) {
              // window.location.reload()
              userBlockedContainer.innerHTML = `<div class="custom-control custom-switch">
              <a onclick="adminBlockUser( '${id}','${response.state}','${checkboxId}' )"> 
                <input type="checkbox" class="custom-control-input" id="${checkboxId}" checked>
                <label class="custom-control-label" for="${checkboxId}"></label>
              </a>
              </div>`;
            }
          });
      } else {
        Swal.fire({
          icon: "success",
          title: "User Unblocked ",
          showConfirmButton: false,
          timer: 1500,
        }).then((state) => {
          if (state) {
            // window.location.reload()
            userBlockedContainer.innerHTML = `<div class="custom-control custom-switch">
              <a onclick="adminBlockUser( '${id}','${response.state}','${checkboxId}' )"> 
                <input type="checkbox" class="custom-control-input" id="${checkboxId}" >
                <label class="custom-control-label" for="${checkboxId}"></label>
              </a>
              </div>`;
          }
        });
      }
    },
  });
}
