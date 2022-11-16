var express = require("express");
var router = express.Router();
var controllers = require("../controllers/userController");

// router.get('*',controllers.verifyJwtTokenHomePage,controllers.verifyBlock)

/* GET Users Home Page. */
router.get(
  "/",
  controllers.verifyJwtTokenHomePage,
  controllers.userHomepageGet
);

//User Sign- in
router.post("/user_signin", controllers.userSignInPost);

//User Otp Login
router.post("/user_otp_login", controllers.userOtpLoginPost);

// User Sign-Up
router.post("/user_registration", controllers.userRegistrationPost);

// User Verification
router.post("/user_verification", controllers.userVerificationPost);

// User Search

router.get(
  "/search/:id",
  controllers.verifyJwtTokenHomePage,
  controllers.userSearchGet
);

// User Logout
router.get(
  "/user_logout",
  controllers.verifyJwtTokenHomePage,
  controllers.userLogoutGet
);

// User Single Product Details

router.get(
  "/home/:id",
  controllers.verifyJwtTokenHomePage,
  controllers.userSingleProductDetailsGet
);

// User Categorywise Product Listing

router.get(
  "/shop/:id",
  controllers.verifyJwtTokenHomePage,
  controllers.userCategoryProductDetailsGet
);

/********************************Restricted**************************/

router.use(controllers.verifyJwtToken, controllers.verifyBlock);

router.get("/cart", controllers.userCartCollectionGet);

router.get("/wishlist", controllers.userWishlistCollectionGet);

router.post("/add_to_cart", controllers.userAddToCartPost);

router.post("/add_to_wishlist", controllers.userAddToWishlistPost);

router.patch("/cart_count", controllers.userCartCountPatch);

router.delete("/cart_delete", controllers.userCartDelete);

router.delete("/wishlist_delete", controllers.userWishlistDelete);

router.get("/checkout", controllers.userCheckoutGet);

router.post("/place_order", controllers.userPlaceOrderPost);

router.get("/orders", controllers.userOrdersGet);

router.get("/order_details/:id", controllers.userOrderDetailsGet);

router.patch("/product_order_status", controllers.userProductOrderStatusPatch);

router.get("/checkstock", controllers.userStockCheckProceedGet);

router.get("/user_profile", controllers.userProfileGet);

router.get("/user_profile_rewards", controllers.userProfileRewardsGet);

router.patch("/user_profile_update", controllers.userProfileUpdatePatch);

router.get("/user_profile_address", controllers.userProfileAddressesGet);

router.post("/user_profile_address", controllers.userProfileAddressesPost);

router.patch(
  "/user_profile_address/:id",
  controllers.userProfileAddressesPatch
);

router.delete("/user_address_delete", controllers.userAddressDelete);

router.post(
  "/verify_razorpay_payment",
  controllers.userVerifyRazorpayPaymentPost
);

router.get("/rewards", controllers.userRewardsCheckoutGet);

router.post("/user_coupon_check", controllers.userCouponCheckPost);

module.exports = router;
