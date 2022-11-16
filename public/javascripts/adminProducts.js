var productsimageState = true;

//Ajax Productslist DataTable
$(document).ready(function () {
  $("#adminProductsDataTable").DataTable();
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
      window[productsimageState] = true;
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
      window[productsimageState] = false;
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
        window[productsimageState] = true;
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
        window[productsimageState] = false;
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

const productsName = document.getElementById("addProductsName");
const price = document.getElementById("addProductsPrice");

function checkInputs() {
  // trim to remove the whitespaces
  let productsimageStateInput = true;

  const productsNameValue = productsName.value.trim();
  const priceValue = price.value;

  if (productsNameValue === "") {
    productsimageStateInput = setErrorFor(
      "productsNameLabel",
      "Product Name cannot be blank"
    );
  } else {
    setSuccessFor("productsNameLabel");
  }

  if (Number(priceValue) < 0) {
    productsimageStateInput = setErrorFor(
      "productsPriceLabel",
      "Price cannot be <= 0"
    );
  } else {
    setSuccessFor("productsPriceLabel");
  }

  return productsimageStateInput;
}

function setErrorFor(input, message) {
  document.getElementById(input).innerText = message;
  return false;
}
function setSuccessFor(input) {
  document.getElementById(input).innerText = "";
  return true;
}

$("#adminAddProducts").on("submit", function (ev) {
  ev.preventDefault(); // Prevent browser default submit.

  let productsimageStateInput = checkInputs();

  var formData = new FormData(this);
  console.log(window[productsimageState]);
  if (window[productsimageState] && productsimageStateInput) {
    $.ajax({
      url: "/admin_panel/addProducts",
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
            title: "Product Added Successfully ",
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

// Admin Edit Products Image Edit Preview

// var editImageProductsState = true

//   function readURL(input) {

//     editImageProductsState = true
//     let imageName = input.files[0].name;

//     if (input.files && input.files[0]) {
//         var reader = new FileReader();
//         reader.onload = function(e) {
//             $('#imagePreview').css('background-image', 'url('+e.target.result +')');
//             $('#imagePreview').hide();
//             $('#imagePreview').fadeIn(650);
//         }
//         reader.readAsDataURL(input.files[0]);
//         document.getElementById('editProductsImageError').innerText = ''
//     }

//     let fileSizeLimit = 1; // In MB

//   var isGood = (/\.(?=jpg|png|jpeg)/gi).test(imageName);
//   if (isGood) {

//   document.getElementById('editProductsImageError').innerText = ''
//   if (input.files[0].size <= fileSizeLimit * 1024 * 1024){

//     document.getElementById('editProductsImageError').innerText = ''

//   }else {

//     // document.getElementById('editProductsImageError').innerText = `Select a Image < ${fileSizeLimit} mb`
//     editImageProductsState = false
//     document.getElementById('editProductsImageError').innerText = `Select a Image < ${fileSizeLimit} mb`
//   }
//   }
//   else {
//     editImageProductsState = false
//     document.getElementById('editProductsImageError').innerText = 'Please Select a Image'

//   }

// }

// $("#imageUpload").change(function() {
//     readURL(this);
// });

// $("#adminEditProducts").on("submit", function(ev) {
//   ev.preventDefault();

//   var formData = new FormData(this);

//     if(editImageProductsState) {

//       $.ajax({
//         url: "/admin_panel/editProducts",
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
//             title: 'Product Edited Successfully ',
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

// Admin Delete Products

function deleteProducts(id, productsName) {
  Swal.fire({
    title: "Are you sure?",
    text: `you want to delete ${productsName} product`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/admin_panel/deleteProducts",
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
              title: "Product Deleted Successfully ",
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

// Ajax Admin Products Active

function adminProductsActive(id, state, checkboxId, categoryId) {
  const productsActiveContainer = document.getElementById(id);

  console.log(typeof state);
  if (state == "true") {
    state = false;
  } else {
    state = true;
  }
  console.log(state);
  $.ajax({
    url: "/admin_panel/deleteProducts",
    data: { _id: id, active: state, categoryId: categoryId },
    method: "PATCH",
    success: (response) => {
      if (response.state) {
        console.log("Product active");
        swal
          .fire({
            title: "Product Activated ",
            icon: "success",
            dangerMode: true,
            showConfirmButton: false,
            timer: 1500,
          })
          .then((state) => {
            if (state) {
              // window.location.reload()
              productsActiveContainer.innerHTML = `  <span style="visibility:hidden">1</span><div class="custom-control custom-switch">
            <a onclick="adminProductsActive( '${id}','${response.state}','${checkboxId}','${categoryId}' )"> 
              <input type="checkbox" class="custom-control-input" id="${checkboxId}" checked>
              <label class="custom-control-label" for="${checkboxId}"></label>
            </a>
            </div>`;
            }
          });
      } else if (response.message) {
        Swal.fire({
          icon: "error",

          title: `${response.message} `,
          showConfirmButton: false,
          timer: 1500,
        }).then((state) => {
          if (state) {
            // window.location.reload()
            productsActiveContainer.innerHTML = ` <span style="visibility:hidden">0</span><div class="custom-control custom-switch">
            <a onclick="adminProductsActive( '${id}','${response.state}','${checkboxId}','${categoryId}' )"> 
              <input type="checkbox" class="custom-control-input" id="${checkboxId}" >
              <label class="custom-control-label" for="${checkboxId}"></label>
            </a>
            </div>`;
          }
        });
      } else {
        Swal.fire({
          icon: "error",

          title: "Product Deactivated ",
          showConfirmButton: false,
          timer: 1500,
        }).then((state) => {
          if (state) {
            // window.location.reload()
            productsActiveContainer.innerHTML = ` <span style="visibility:hidden">0</span><div class="custom-control custom-switch">
            <a onclick="adminProductsActive( '${id}','${response.state}','${checkboxId}','${categoryId}' )"> 
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

function subImagesCrop(event, id) {
  let file = event.target.files[0];

  let imageCropper = document.getElementById("file-image-crop");

  console.log(file);

  document.getElementById("file-image-crop").src = URL.createObjectURL(file);
  document.getElementById("file-image-crop-div").style.display = "block";
  document.getElementById("file-image-crop").style.display = "block";

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
      let fileInputElement = document.getElementById(`file-upload${id}`);
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

      // Preview of the image

      // document.getElementById("file-image").src = URL.createObjectURL(
      //   fileInputElement.files[0]
      // );
      // Hide the cropper box
      document.getElementById("file-image-crop-div").style.display = "none";
      // Hide the crop button
      // document.getElementById("crop-btn1").style.display = "none";
    });
    cropper.destroy();
  });
}
