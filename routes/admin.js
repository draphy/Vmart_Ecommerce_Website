var express = require("express");
var router = express.Router();
var controllers = require("../controllers/adminController");

// Admin Login Get
router.get("/admin_login", controllers.adminLoginGet);

// Admin Login Post

router.post("/admin_login", controllers.adminLoginPost);

/********************************Restricted**************************/

// Verifying every Routes
router.use("*", controllers.verifyJwtAdminToken);

// Admin Dashboard Get
router.get("/", controllers.adminDashboardGet);

router.get("/users_month", controllers.adminDashboardUsersMonthGet);

router.get("/orders_month", controllers.adminDashboardOrdersMonthGet);

router.get("/orders_day", controllers.adminDashboardOrdersDayGet);

router.get("/users_day", controllers.adminDashboardUsersDayGet);

router.get("/categorySales", controllers.adminDashboardCategorySalesGet);

// Admin Categories Get
router.get("/category", controllers.adminCategoriesGet);

//Admin Add Categories Post
router.post("/addCategory", controllers.adminAddCategoriesPost);

//Admin Edit Categories Post
router.patch("/editCategory", controllers.adminEditCategoriesPatch);

//Admin Delete Categories Delete
router.patch("/deleteCategory", controllers.adminDeleteCategoriesPatch);

//Admin Products Get
router.get("/products", controllers.adminProductsGet);

//Admin Add Products Post
router.post("/addProducts", controllers.adminAddProductsPost);

//Admin Edit Products Post
router.patch("/editProducts", controllers.adminEditProductsPatch);

//Admin Delete Products Delete
router.patch("/deleteProducts", controllers.adminDeleteProductsPatch);

// Admin Users Management Get
router.get("/user_management/:id", controllers.adminUserManagementGet);

// Admin User Block
router.patch("/block_user", controllers.adminUserBlockPatch);

//Admin Orders Listing
router.get("/order_management/:id", controllers.adminOrdersListingGet);

// Admin Logout
router.get("/logout", controllers.adminLogoutGet);

// Admin Status Change

router.patch("/order_status", controllers.adminOrderStatusPatch);

router.patch("/order_status_return", controllers.adminOrderStatusReturnPatch);

// Admin Coupons Get

router.get("/coupons", controllers.adminCouponsGet);

// Admin Add Coupon

router.post("/addCoupon", controllers.adminAddCouponPost);

//Admin Edit Coupon Post
router.patch("/editCoupon", controllers.adminEditCouponPatch);

// Admin Delete coupon
router.delete("/deleteCoupon", controllers.adminCouponDelete);

module.exports = router;
