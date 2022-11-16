var imageState = true;

//Ajax Categorylist DataTable
$(document).ready(function () {
  $("#adminCategoryDataTable").DataTable();
});

// File Upload
function ekUpload() {
  function Init() {
    console.log("Upload Initialised");

    var fileSelect = document.getElementById("file-upload"),
      fileDrag = document.getElementById("file-drag"),
      submitButton = document.getElementById("submit-button");

    fileSelect.addEventListener("change", fileSelectHandler, false);

    // Is XHR2 available?
    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
      // File Drop
      fileDrag.addEventListener("dragover", fileDragHover, false);
      fileDrag.addEventListener("dragleave", fileDragHover, false);
      fileDrag.addEventListener("drop", fileSelectHandler, false);
    }
  }

  function fileDragHover(e) {
    var fileDrag = document.getElementById("file-drag");

    e.stopPropagation();
    e.preventDefault();

    fileDrag.className =
      e.type === "dragover" ? "hover" : "modal-body file-upload";
  }

  function fileSelectHandler(e) {
    // Fetch FileList object
    var files = e.target.files || e.dataTransfer.files;

    // Cancel event and hover styling
    fileDragHover(e);

    // Process all File objects
    for (var i = 0, f; (f = files[i]); i++) {
      parseFile(f);

      uploadFile(f);
    }
  }
  // Output
  function outputFileName(msg) {
    // Response
    var m = document.getElementById("messages");
    m.innerHTML = msg;
    document.getElementById("messages").style.color = "black";
  }

  // Output
  function errorMessage(msg) {
    // Response
    var m = document.getElementById("messages");
    m.innerHTML = msg;
    document.getElementById("messages").style.color = "red";
  }

  function parseFile(file) {
    console.log(file.name);
    outputFileName("<strong>" + encodeURI(file.name) + "</strong>");

    // var fileType = file.type;
    // console.log(fileType);
    var imageName = file.name;

    var isGood = /\.(?=jpg|png|jpeg)/gi.test(imageName);
    if (isGood) {
      window[imageState] = true;
      document.getElementById("start").classList.add("hidden");
      document.getElementById("response").classList.remove("hidden");
      document.getElementById("notimage").classList.add("hidden");
      // Thumbnail Preview
      document.getElementById("file-image").classList.remove("hidden");
      document.getElementById("file-image").src = URL.createObjectURL(file);
      document.getElementById("file-image-crop").src =
        URL.createObjectURL(file);
      document.getElementById("file-image-crop-div").style.display = "block";
      document.getElementById("file-image-crop").style.display = "block";
    } else {
      window[imageState] = false;
      document.getElementById("file-image-crop").style.display = "none";
      document.getElementById("file-image-crop-div").style.display = "none";
      document.getElementById("file-image").classList.add("hidden");
      document.getElementById("notimage").classList.remove("hidden");
      document.getElementById("start").classList.remove("hidden");
      document.getElementById("response").classList.add("hidden");
      document.getElementById("file-upload-form").reset();
    }
  }

  // function setProgressMaxValue(e) {
  //   var pBar = document.getElementById('file-progress');

  //   if (e.lengthComputable) {
  //     pBar.max = e.total;
  //   }
  // }

  // function updateFileProgress(e) {
  //   var pBar = document.getElementById('file-progress');

  //   if (e.lengthComputable) {
  //     pBar.value = e.loaded;
  //   }
  // }

  function uploadFile(file) {
    var xhr = new XMLHttpRequest(),
      fileInput = document.getElementById("class-roster-file"),
      pBar = document.getElementById("file-progress"),
      fileSizeLimit = 1; // In MB
    if (xhr.upload) {
      // Check if file is less than x MB
      if (file.size <= fileSizeLimit * 1024 * 1024) {
        let imageCropper = document.getElementById("file-image-crop");

        var cropper = new Cropper(imageCropper, {
          aspectRatio: 1,
          autoCropArea: 1,
          viewMode: 1,
          scalable: false,
          zoomable: false,
          movable: false,
          minCropBoxWidth: 50,
          minCropBoxHeight: 50,
        });
        const crop_btn = document.getElementById("crop-btn");
        crop_btn.addEventListener("click", () => {
          // This method coverts the selected cropped image on the cropper canvas into a blob object
          cropper.getCroppedCanvas().toBlob((blob) => {
            // Gets the original image data
            let fileInputElement = document.getElementById("file-upload");
            const img_data = fileInputElement.files[0];
            // Make a new cropped image file using that blob object, image_data.name will make the new file name same as original image
            let file = new File([blob], img_data.name, {
              type: "image/*",
              lastModified: new Date().getTime(),
            });
            // Create a new container
            let container = new DataTransfer();
            // Add the cropped image file to the container
            container.items.add(file);
            // Replace the original image file with the new cropped image file
            fileInputElement.files = container.files;
            document.getElementById("file-image").src = URL.createObjectURL(
              fileInputElement.files[0]
            );
            // Hide the cropper box
            document.getElementById("file-image-crop-div").style.display =
              "none";
            // Hide the crop button
            // document.getElementById("crop-btn1").style.display = "none";
          });
          cropper.destroy();
        });

        // document.getElementById('file-image').src = URL.createObjectURL(cropper.originalUrl);
        console.log(cropper);

        // Progress bar
        // pBar.style.display = 'inline';
        // xhr.upload.addEventListener('loadstart', setProgressMaxValue, false);
        // xhr.upload.addEventListener('progress', updateFileProgress, false);

        // File received / failed
        xhr.onreadystatechange = function (e) {
          if (xhr.readyState == 4) {
            // Everything is good!
            // progress.className = (xhr.status == 200 ? "success" : "failure");
            // document.location.reload(true);
          }
        };
        window[imageState] = true;
        // Start upload
        xhr.open(
          "POST",
          document.getElementById("file-upload-form").action,
          true
        );
        xhr.setRequestHeader("X-File-Name", file.name);
        xhr.setRequestHeader("X-File-Size", file.size);
        xhr.setRequestHeader("Content-Type", "multipart/form-data");
        // xhr.send(file);
      } else {
        window[imageState] = false;

        document.getElementById("file-image-crop-div").style.display = "none";
        errorMessage(
          "Please upload a smaller file (< " + fileSizeLimit + " MB)."
        );
      }
    }
  }

  // Check for the various File API support.
  if (window.File && window.FileList && window.FileReader) {
    Init();
  } else {
    document.getElementById("file-drag").style.display = "none";
  }
}

ekUpload();

const categoryName = document.getElementById("addCategoryName");
const Offer = document.getElementById("addCategoryOffer");

function checkInputs() {
  // trim to remove the whitespaces
  let imageStateInput = true;

  const categoryNameValue = categoryName.value.trim();
  const OfferValue = Offer.value;

  if (categoryNameValue === "") {
    imageStateInput = setErrorFor(
      "categoryNameLabel",
      "Category Name cannot be blank"
    );
  } else {
    setSuccessFor("categoryNameLabel");
  }

  if (Number(OfferValue) < 0) {
    imageStateInput = setErrorFor("categoryOfferLabel", "offer cannot be <= 0");
  } else {
    setSuccessFor("categoryOfferLabel");
  }

  return imageStateInput;
}

function setErrorFor(input, message) {
  document.getElementById(input).innerText = message;
  return false;
}
function setSuccessFor(input) {
  document.getElementById(input).innerText = "";
  return true;
}

$("#adminAddCategory").on("submit", function (ev) {
  ev.preventDefault(); // Prevent browser default submit.

  let imageStateInput = checkInputs();

  var formData = new FormData(this);
  console.log(window[imageState]);
  if (window[imageState] && imageStateInput) {
    $.ajax({
      url: "/admin_panel/addCategory",
      type: "POST",
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function (response) {
        if (response.message) {
          swal.fire({
            title: `${response.message} `,
            icon: "error",
            dangerMode: true,
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Category Added Successfully ",
            showConfirmButton: false,
            timer: 1500,
          }).then((state) => {
            if (state) {
              window.location.reload();
            }
          });
        }
      },
    });
  }
});

// Admin Edit Category Image Edit Preview

// var editImageCategoryState = true

//   function readURL(input) {

//     editImageCategoryState = true
//     let imageName = input.files[0].name;

//     if (input.files && input.files[0]) {
//         var reader = new FileReader();
//         reader.onload = function(e) {
//             $('#imagePreview').css('background-image', 'url('+e.target.result +')');
//             $('#imagePreview').hide();
//             $('#imagePreview').fadeIn(650);
//         }
//         reader.readAsDataURL(input.files[0]);
//         document.getElementById('editCategoryImageError').innerText = ''
//     }

//     let fileSizeLimit = 1; // In MB

//   var isGood = (/\.(?=jpg|png|jpeg)/gi).test(imageName);
//   if (isGood) {

//   document.getElementById('editCategoryImageError').innerText = ''
//   if (input.files[0].size <= fileSizeLimit * 1024 * 1024){

//     document.getElementById('editCategoryImageError').innerText = ''

//   }else {

//     // document.getElementById('editCategoryImageError').innerText = `Select a Image < ${fileSizeLimit} mb`
//     editImageCategoryState = false
//     document.getElementById('editCategoryImageError').innerText = `Select a Image < ${fileSizeLimit} mb`
//   }
//   }
//   else {
//     editImageCategoryState = false
//     document.getElementById('editCategoryImageError').innerText = 'Please Select a Image'

//   }

// }

// $("#imageUpload").change(function() {
//     readURL(this);
// });

// $("#adminEditCategory").on("submit", function(ev) {
//   ev.preventDefault();

//   var formData = new FormData(this);

//     if(editImageCategoryState) {

//       $.ajax({
//         url: "/admin_panel/editCategory",
//         type: "PATCH",
//         data: formData,
//         cache: false,
//         contentType: false,
//         processData: false,
//         success: function (response) {

//          if(response.message){

//           swal.fire({
//             title: `${response.message} `,
//              icon: "error",
//              dangerMode: true,
//              showConfirmButton: false,
//              timer: 1500
//            })

//          }else {

//           Swal.fire({

//             icon: 'success',
//             title: 'Category Edited Successfully ',
//             showConfirmButton: false,
//             timer: 1500
//           }).then((state)=>{

//             if(state){

//            window.location.reload()

//             }
//           })

//          }

//         },
//       });
//     }

// });

// Admin Delete Category

function deleteCategory(id, categoyName) {
  Swal.fire({
    title: "Are you sure?",
    text: `you want to delete ${categoryName} category`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/admin_panel/deleteCategory",
        data: { _id: id },
        method: "DELETE",
        success: function (response) {
          if (response.message) {
            swal.fire({
              title: `${response.message} `,
              icon: "error",
              dangerMode: true,
              showConfirmButton: false,
              timer: 1500,
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Category Deleted Successfully ",
              showConfirmButton: false,
              timer: 1500,
            }).then((state) => {
              if (state) {
                window.location.reload();
              }
            });
          }
        },
      });
    }
  });
}

// Ajax Admin category Active

function adminCategoryActive(id, state, checkboxId) {
  const categoryActiveContainer = document.getElementById(id);

  console.log(typeof state);
  if (state == "true") {
    state = false;
  } else {
    state = true;
  }
  console.log(state);
  $.ajax({
    url: "/admin_panel/deleteCategory",
    data: { _id: id, active: state },
    method: "PATCH",
    success: (response) => {
      if (response.state) {
        console.log("category active");
        swal
          .fire({
            title: "Category Activated ",
            icon: "success",
            dangerMode: true,
            showConfirmButton: false,
            timer: 1500,
          })
          .then((state) => {
            if (state) {
              // window.location.reload()
              categoryActiveContainer.innerHTML = `  <span style="visibility:hidden">1</span><div class="custom-control custom-switch">
            <a onclick="adminCategoryActive( '${id}','${response.state}','${checkboxId}' )"> 
              <input type="checkbox" class="custom-control-input" id="${checkboxId}" checked>
              <label class="custom-control-label" for="${checkboxId}"></label>
            </a>
            </div>`;
            }
          });
      } else {
        Swal.fire({
          icon: "error",

          title: "Category Deactivated ",
          showConfirmButton: false,
          timer: 1500,
        }).then((state) => {
          if (state) {
            // window.location.reload()
            categoryActiveContainer.innerHTML = ` <span style="visibility:hidden">0</span><div class="custom-control custom-switch">
            <a onclick="adminCategoryActive( '${id}','${response.state}','${checkboxId}' )"> 
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
