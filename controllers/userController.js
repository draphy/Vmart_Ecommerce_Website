require("dotenv").config();
var userOpt = require("../models/useropt");
const https = require("https");
const url = "https://api.exchangerate-api.com/v4/latest/USD";

//RazorPay
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: process.env.Razorpay_KEY_ID,
  key_secret: process.env.Razorpay_KEY_SECRET,
});

// OTP verification
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verificationSid = process.env.VERIFICATION_SID;
const client = require("twilio")(accountSid, authToken);
client.verify.v2.services
  .create({ friendlyName: "My First Verify Service" })
  .then((service) => console.log(service.sid));

//creating the token

const jwt = require("jsonwebtoken");
const { response } = require("../app");

const maxAge = 10 * 24 * 60 * 60;
const createToken = (id, name) => {
  return jwt.sign({ id, name }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};

module.exports = {
  userHomepageGet: (req, res, next) => {
    userOpt.getAllProductsandCategories().then(async (response) => {
      let topProducts = await userOpt.topProducts();
      let latest = await userOpt.latestProducts();
      console.log(topProducts);
      let categories = response.categories;

      res.render("user/userIndex", {
        user: true,
        block: false,
        categories,
        topProducts,
        latest,
      });
    });
  },

  userSearchGet: (req, res, next) => {
    let search = req.query.search;
    let minAmount = 10;
    let maxAmount = 1000;
    if (req.query.minAmount) {
      minAmount = Number(req.query.minAmount);
      maxAmount = Number(req.query.maxAmount);
    }

    console.log(search);
    userOpt
      .getSearchProduct(search, minAmount, maxAmount)
      .then(async (products) => {
        let categories = await userOpt.getAllCategory();

        res.render("user/userSearch", {
          user: true,
          block: false,
          categories,
          products,
          minAmount,
          maxAmount,
          search,
        });
      });
  },

  userCouponCheckPost: (req, res, next) => {
    console.log(req.body);

    let reward = res.locals.userRole.reward;

    if (reward) {
      console.log(reward);
      let coupon = reward.findIndex(
        (coupon) =>
          coupon.couponName == req.body.couponName &&
          coupon.minAmount < Number(req.body.total) &&
          coupon.expiryDate > new Date()
      );
      console.log(coupon);
      if (coupon != -1) {
        res.json({ coupon: reward[coupon] });
      } else {
        res.json({});

        // userOpt.findUserCoupon(req.body).then((response)=>{

        // })
      }
    } else {
      res.json({});
    }
  },

  userSignInPost: (req, res, next) => {
    userOpt.doLogin(req.body).then((response) => {
      if (response.stat) {
        //sending the token

        const token = createToken(response._id, response.name);
        res.cookie("jwt", token, { httponly: true, maxAge: maxAge * 1000 });

        res.json({ state: false });
      } else {
        res.json({ message: response.message });
      }
    });
  },

  userRegistrationPost: (req, res) => {
    if (req.body.referralCode.trim() != "") {
      userOpt.findReferral(req.body.referralCode).then((result) => {
        if (result) {
          userOpt.findUserRegistration(req.body).then((result) => {
            if (result.state) {
              client.verify.v2
                .services(verificationSid)
                .verifications.create({
                  to: `+91${req.body.phoneNumber}`,
                  channel: "sms",
                })
                .then((verification) => {
                  console.log(verification.status);
                  req.body.block = false;
                  req.body.verification = false;
                  req.body.email = req.body.email.toLowerCase();
                  req.body.date = new Date();

                  let randomString =
                    Date.now().toString(36) +
                    Math.random().toString(36).substr(2);
                  let referral = randomString.slice(0, randomString.length / 2);

                  req.body.referral = req.body.name + "-" + referral;

                  userOpt.addUser(req.body).then((result) => {
                    userOpt
                      .referralAddWallet(req.body.referralCode)
                      .then((final) => {
                        userOpt
                          .welcomeUserReferral(result.insertedId)
                          .then((last) => {
                            res.json({
                              phoneNumber: req.body.phoneNumber,
                              name: req.body.name,
                              _id: result.insertedId,
                            });
                          });
                      });
                  });
                })
                .catch((err) => {
                  res.json({ error: err.message });
                });
            } else {
              res.json({ message: result.message });
            }
          });
        } else {
          res.json({ referral: "Invalid Referral" });
        }
      });
    } else {
      userOpt.findUserRegistration(req.body).then((result) => {
        if (result.state) {
          client.verify.v2
            .services(verificationSid)
            .verifications.create({
              to: `+91${req.body.phoneNumber}`,
              channel: "sms",
            })
            .then((verification) => {
              console.log(verification.status);
              req.body.block = false;
              req.body.verification = false;
              req.body.email = req.body.email.toLowerCase();
              req.body.date = new Date();

              let randomString =
                Date.now().toString(36) + Math.random().toString(36).substr(2);
              let referral = randomString.slice(0, randomString.length / 2);

              req.body.referral = req.body.name + "-" + referral;

              userOpt.addUser(req.body).then((result) => {
                res.json({
                  phoneNumber: req.body.phoneNumber,
                  name: req.body.name,
                  _id: result.insertedId,
                });
              });
            })
            .catch((err) => {
              res.json({ error: err.message });
            });
        } else {
          res.json({ message: result.message });
        }
      });
    }
  },

  userVerificationPost: (req, res) => {
    console.log(req.body.phoneNumber);

    //verify code
    client.verify.v2
      .services(verificationSid)
      .verificationChecks.create({
        to: `+91${req.body.phoneNumber}`,
        code: `${req.body.otp}`,
      })
      .then((check) => {
        console.log(check);

        if (check.valid) {
          //sending the token

          const token = createToken(req.body._id, req.body.name);
          res.cookie("jwt", token, { httponly: true, maxAge: maxAge * 1000 });
          userOpt.updateUserVerification(req.body).then((result) => {
            console.log("Verified the Account");

            res.json({ stat: true, text: req.body.text });
          });
        } else {
          console.log(req.body.otp);
          res.json({ message: "Wrong Pin" });
        }
      })
      .catch((err) => {
        console.log(err);
        console.log("catch");
        res.json({ message: "Error Occured" });
      });
  },

  userLogoutGet: (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/homepage");
  },

  userOtpLoginPost: (req, res) => {
    console.log(req.body.phoneNumber, "otp");
    userOpt.findUserOtpLogin(req.body).then((result) => {
      if (result.state) {
        client.verify.v2
          .services(verificationSid)
          .verifications.create({
            to: `+91${req.body.phoneNumber}`,
            channel: "sms",
          })
          .then((verification) => {
            console.log(verification.status);

            res.json({
              phoneNumber: req.body.phoneNumber,
              name: result.name,
              _id: result._id,
            });
          })
          .catch((err) => {
            console.log("catch otp login", err.message);
            res.json({ error: err.message });
          });
      } else {
        res.json({ message: result.message });
      }
    });
  },

  verifyJwtToken: (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
          res.locals.userRole = null;
          res.redirect("/homepage");
          console.log(err.message, "jwt error");
        } else {
          console.log(decodedToken, "decoded the token");
          userOpt.getUserDetails(decodedToken.id).then((userDetails) => {
            res.locals.userRole = userDetails;

            next();
          });
        }
      });
    } else {
      res.locals.userRole = null;

      res.redirect("/homepage");
    }
  },

  verifyJwtTokenHomePage: (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
          res.locals.userRole = null;

          console.log(err.message, "jwt error");
          next();
        } else {
          console.log(decodedToken, "decoded the token");
          userOpt.getUserDetails(decodedToken.id).then((userDetails) => {
            res.locals.userRole = userDetails;

            next();
          });
        }
      });
    } else {
      res.locals.userRole = null;

      next();
    }
  },

  verifyBlock: (req, res, next) => {
    // if(res.locals.userRole){

    if (!res.locals.userRole.block) {
      console.log("Not blocked");
      next();
    } else {
      console.log("blocked");
      //  res.cookie('jwt','',{maxAge : 1})
      //  res.render('user/userBlock', { user: true, block : true });
      res.redirect("/homepage");
    }
    // } else{
    //   next()
    // }
  },

  userSingleProductDetailsGet: (req, res) => {
    userOpt
      .getSingleProductandCategory(req.query.productId)
      .then((response) => {
        let product = response.product;

        res.render("user/userProductDetails", {
          user: true,
          block: false,
          product,
        });
      });
  },

  // User Category wise Product Listing Get

  userCategoryProductDetailsGet: (req, res) => {
    let minAmount = 10;
    let maxAmount = 1000;
    if (req.query.minAmount) {
      minAmount = Number(req.query.minAmount);
      maxAmount = Number(req.query.maxAmount);
    }

    userOpt
      .getAllProductInCategory(req.query.categoryId, minAmount, maxAmount)
      .then(async (products) => {
        let categories = await userOpt.getAllCategory();

        let categoryName = req.query.categoryName;

        let categoryId = req.query.categoryId;

        res.render("user/userProductShop", {
          user: true,
          block: false,
          products,
          categoryName,
          categories,
          categoryId,
          minAmount,
          maxAmount,
        });
      });
  },

  userAddToCartPost: (req, res) => {
    console.log(req.body, "weighttttttttttttttttttttttttttttttttttt");
    console.log(
      res.locals.userRole._id,
      "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
    );
    userOpt.addToCart(req.body, res.locals.userRole._id).then((response) => {
      console.log(req.body, "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
      console.log(
        res.locals.userRole._id,
        "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
      );
      res.json({ message: response, state: true });
    });
  },

  userAddToWishlistPost: (req, res) => {
    console.log(req.body, "weighttttttttttttttttttttttttttttttttttt");
    console.log(
      res.locals.userRole._id,
      "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
    );
    userOpt
      .addToWishlist(req.body, res.locals.userRole._id)
      .then((response) => {
        console.log(req.body, "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
        console.log(
          res.locals.userRole._id,
          "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
        );
        res.json({ message: response, state: true });
      });
  },

  userCartCollectionGet: (req, res) => {
    userOpt.cartListing(res.locals.userRole._id).then((cartItems) => {
      let totalDiscount = 0;
      let totalAmount = 0;

      for (let i = 0; i < cartItems.length; i++) {
        totalDiscount +=
          cartItems[i].productDetails.price *
          (cartItems[i].weight / 500) *
          (cartItems[i].categoryDetails.offer / 100) *
          cartItems[i].quantity;
        totalAmount +=
          cartItems[i].productDetails.price *
          (cartItems[i].weight / 500) *
          cartItems[i].quantity;
      }
      totalAmount = totalAmount.toFixed(2);
      totalDiscount = totalDiscount.toFixed(2);
      res.render("user/userCart", {
        user: true,
        block: false,
        cartItems,
        totalDiscount,
        totalAmount,
      });
    });
  },

  userWishlistCollectionGet: (req, res) => {
    userOpt.wishListing(res.locals.userRole._id).then((wishlistItems) => {
      res.render("user/userWishlist", {
        user: true,
        block: false,
        wishlistItems,
      });
    });
  },

  userCartCountPatch: (req, res) => {
    userOpt
      .cartCountUpdate(req.body, res.locals.userRole._id)
      .then((response) => {
        res.json({});
      });
  },

  userCartDelete: (req, res) => {
    userOpt.cartDelete(req.body, res.locals.userRole._id).then((response) => {
      res.json({ message: response });
    });
  },

  userWishlistDelete: (req, res) => {
    userOpt
      .wishlistDelete(req.body, res.locals.userRole._id)
      .then((response) => {
        res.json({ message: response });
      });
  },

  userCheckoutGet: (req, res) => {
    userOpt.cartListing(res.locals.userRole._id).then((cartItems) => {
      let totalDiscount = 0;
      let totalAmount = 0;

      for (let i = 0; i < cartItems.length; i++) {
        totalDiscount +=
          cartItems[i].productDetails.price *
          (cartItems[i].weight / 500) *
          (cartItems[i].categoryDetails.offer / 100) *
          cartItems[i].quantity;
        totalAmount +=
          cartItems[i].productDetails.price *
          (cartItems[i].weight / 500) *
          cartItems[i].quantity;
      }
      totalAmount = Number(totalAmount.toFixed(2));
      totalDiscount = Number(totalDiscount.toFixed(2));

      let convertedAmount = null;

      function getPromise() {
        return new Promise((resolve, reject) => {
          https
            .get(url, async (res) => {
              let data = "";
              res.on("data", (chunk) => {
                data += chunk;
              });
              res.on("end", () => {
                let currency = JSON.parse(data);

                let fromRate = currency.rates["INR"];
                let toRate = currency.rates["USD"];
                convertedAmount = (
                  (toRate / fromRate) *
                  (totalAmount - totalDiscount)
                ).toFixed(2);

                resolve();
              });
            })
            .on("error", (err) => {
              console.log(err.message);
            });
        });
      }

      // async function to make http request
      async function makeSynchronousRequest(request) {
        try {
          console.log(request);

          await getPromise();

          // holds response from server that is passed when Promise is resolved
        } catch (error) {
          // Promise rejected
          console.log(error);
        }
      }

      // anonymous async function to execute some code synchronously after http request
      (async function () {
        // wait to http request to finish
        await makeSynchronousRequest(1);

        res.render("user/userCheckout", {
          user: true,
          block: false,
          cartItems,
          totalDiscount,
          totalAmount,
          convertedAmount,
        });
      })();
    });
  },

  userPlaceOrderPost: (req, res) => {
    userOpt.placeOrderTotal(res.locals.userRole._id).then((cartItems) => {
      if (cartItems.length) {
        let totalDiscount = 0;
        let subtotalAmount = 0;

        for (let i = 0; i < cartItems.length; i++) {
          totalDiscount +=
            cartItems[i].productDetails.price *
            (cartItems[i].weight / 500) *
            (cartItems[i].categoryDetails.offer / 100) *
            cartItems[i].quantity;
          subtotalAmount +=
            cartItems[i].productDetails.price *
            (cartItems[i].weight / 500) *
            cartItems[i].quantity;
        }
        subtotalAmount = Number(subtotalAmount.toFixed(2));
        totalDiscount = Number(totalDiscount.toFixed(2));
        let totalAmount = Number(subtotalAmount - totalDiscount);
        console.log(totalAmount, req.body);

        if (req.body.payment === "wallet") {
          if (res.locals.userRole.wallet) {
            if (res.locals.userRole.wallet.total > totalAmount) {
              //wallet order

              userOpt
                .userPlaceOrder(
                  req.body,
                  totalAmount,
                  res.locals.userRole._id,
                  cartItems,
                  totalDiscount,
                  subtotalAmount
                )
                .then(async (orderResponse) => {
                  userOpt
                    .changeWalletTotal(
                      -totalAmount,
                      `${totalAmount} debited from shopping`,
                      res.locals.userRole._id
                    )
                    .then((response) => {
                      res.json({
                        paymentMethodId: "wallet",
                        walletState: true,
                      });
                    });
                });
            } else {
              res.json({ paymentMethodId: "wallet", walletState: false });
            }
          } else {
            res.json({ paymentMethodId: "wallet", walletState: false });
          }
        } else {
          userOpt
            .userPlaceOrder(
              req.body,
              totalAmount,
              res.locals.userRole._id,
              cartItems,
              totalDiscount,
              subtotalAmount
            )
            .then(async (orderResponse) => {
              console.log("hiiiiiiiiiiiiiii david raphiiiiiiiiiiii");

              if (req.body.payment === "COD") {
                res.json({ paymentMethodId: "COD" });
              } else if (req.body.payment === "razorpay") {
                await userOpt
                  .generateRazorPay(orderResponse.orderId, totalAmount)
                  .then((data) => {
                    res.json({ order: data, paymentMethodId: "razorpay" });
                  });
              } else if (req.body.payment === "paypal") {
                await userOpt
                  .userProductOrderStatusChange(
                    "placed",
                    res.locals.userRole._id,
                    orderResponse.orderId
                  )
                  .then((response) => {
                    res.json({
                      order: orderResponse.orderId,
                      paymentMethodId: "paypal",
                    });
                  });
              }
            });
        }
      } else {
        res.json({ statePayment: true });
      }
    });
  },

  //user Orders Get

  userOrdersGet: (req, res) => {
    userOpt.getAllUserOrders(res.locals.userRole._id).then((orders) => {
      res.render("user/userOrders", { user: true, block: false, orders });
    });
  },

  // user Orders Details Get

  userOrderDetailsGet: (req, res) => {
    userOpt
      .getUserOrderDetails(res.locals.userRole._id, req.params.id)
      .then((orderDetails) => {
        console.log(req.params.id);

        res.render("user/userOrderDetails", {
          user: true,
          block: false,
          orderDetails,
        });
      });
  },

  //user product Order Status

  userProductOrderStatusPatch: (req, res) => {
    userOpt
      .userProductOrderStatusChange(
        req.body.status,
        res.locals.userRole._id,
        req.body.orderId
      )
      .then((response) => {
        res.json({ state: response });
      });
  },

  // User Check Stock Proceed Checkout

  userStockCheckProceedGet: (req, res) => {
    userOpt.userStockCheckProceed(res.locals.userRole._id).then((cartItems) => {
      let state = false;
      let product = "";
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].weight == 500) {
          if (
            cartItems[i].productDetails.instock.half - cartItems[i].quantity <
            10
          ) {
            product +=
              "--" +
              cartItems[i].productDetails.productsName +
              "(500" +
              cartItems[i].productDetails.massUnit +
              ")";
            state = true;
          }
        } else {
          if (
            cartItems[i].productDetails.instock.full - cartItems[i].quantity <
            10
          ) {
            product +=
              "--" +
              cartItems[i].productDetails.productsName +
              "(1000" +
              cartItems[i].productDetails.massUnit +
              ")";
            state = true;
          }
        }
      }

      res.json({ state: state, product: product });
    });
  },

  userProfileGet: (req, res) => {
    res.render("user/userProfile", { user: true, block: false });
  },

  userProfileRewardsGet: (req, res) => {
    res.render("user/userRewards", { user: true, block: false });
  },

  userProfileUpdatePatch: (req, res) => {
    userOpt
      .userProfileUpdate(req.body, res.locals.userRole._id)
      .then((response) => {
        res.json({ state: response });
      });
  },

  userProfileAddressesGet: (req, res) => {
    res.render("user/userAddresses", { user: true, block: false });
  },

  userProfileAddressesPost: (req, res) => {
    userOpt
      .userProfileAddAddress(req.body, res.locals.userRole._id)
      .then((response) => {
        res.json({ state: response });
      });
  },

  userProfileAddressesPatch: (req, res) => {
    userOpt
      .userProfileEditAddress(req.body, res.locals.userRole._id, req.params.id)
      .then((response) => {
        res.json({ state: response });
      });
  },

  userAddressDelete: (req, res) => {
    userOpt
      .userAddressDelete(req.body.uniqueId, res.locals.userRole._id)
      .then((response) => {
        res.json({ state: response });
      });
  },

  userVerifyRazorpayPaymentPost: (req, res) => {
    console.log(req.body["payment[razorpay_payment_id]"], "hiiiiii");

    userOpt.verifyRazorpayPayment(req.body).then((result) => {
      if (result) {
        console.log(req.body["order[receipt]"]);

        userOpt
          .userProductOrderStatusChange(
            "placed",
            res.locals.userRole._id,
            req.body["order[receipt]"]
          )
          .then((response) => {
            res.json({ state: response });
          });
      } else {
        console.log(req.body["order[receipt]"], "hiiiiiiiiiiiiiiiii falseeeee");
        res.json({ state: false });
      }
    });
  },

  userRewardsCheckoutGet: async (req, res) => {
    let orderCheck = await userOpt.checkRandomOrder(res.locals.userRole._id);

    console.log(orderCheck, "hiiiiiiiiiiii order Check");

    if (orderCheck.length) {
      userOpt.randomCoupon().then((response) => {
        let randomNum = Math.floor(Math.random() * 100);

        console.log(randomNum);

        if (randomNum > 50) {
          let couponIndex = Math.floor(Math.random() * response.length);

          console.log(couponIndex, " hiiiiiiiiiiii couoon inexxxxxxx");

          let coupon = response[couponIndex];

          console.log(coupon, "hiiiiiiiiiiiii couponnnn");

          if (coupon != undefined) {
            userOpt
              .userCouponRewardAdd(res.locals.userRole._id, coupon)
              .then((response) => {
                if (response) {
                  res.render("user/userRewardCoupon", {
                    user: true,
                    block: false,
                    coupon,
                  });
                }
              });
          } else {
            let coupon = 0;

            res.render("user/userRewardCoupon", {
              user: true,
              block: false,
              coupon,
            });
          }
        } else {
          let coupon = 0;

          res.render("user/userRewardCoupon", {
            user: true,
            block: false,
            coupon,
          });
        }
      });
    } else {
      res.redirect("/homepage");
    }
  },
};
