require("dotenv").config();
var adminOpt = require("../models/adminOpt");

//creating the token

const jwt = require("jsonwebtoken");
const { response } = require("express");

const maxAge = 10 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};

module.exports = {
  adminDashboardCategorySalesGet: async (req, res, next) => {
    await adminOpt.findAllCategorySales().then((categorySales) => {
      res.json(categorySales);
    });
  },

  adminDashboardUsersDayGet: async (req, res, next) => {
    await adminOpt.findAllUsersByDay().then((usersDay) => {
      res.json(usersDay);
    });
  },

  adminDashboardOrdersDayGet: async (req, res, next) => {
    await adminOpt.findAllOrdersByDay().then((ordersDay) => {
      res.json(ordersDay);
    });
  },

  adminDashboardOrdersMonthGet: async (req, res, next) => {
    await adminOpt.findAllOrdersByMonth().then((ordersMonth) => {
      res.json(ordersMonth);
    });
  },

  adminDashboardUsersMonthGet: async (req, res, next) => {
    await adminOpt.findAllUsersByMonth().then((usersMonth) => {
      res.json(usersMonth);
    });
  },

  adminDashboardGet: async (req, res, next) => {
    let orders = await adminOpt.getAllOrdersDashboard();
    let monthSales = await adminOpt.getAllMonthlySales();
    let yearlySales = await adminOpt.getAllYearlySales();
    let totalSales = await adminOpt.getAllSales();
    let todaySales = await adminOpt.getTodaySales();

    res.render("admin/adminDashboard", {
      user: false,
      issue: false,
      orders,
      monthSales,
      yearlySales,
      totalSales,
      todaySales,
    });
  },

  adminLoginGet: (req, res) => {
    res.redirect("/admin_panel");
  },

  adminLoginPost: function (req, res, next) {
    adminOpt.adminLogin(req.body).then((response) => {
      if (response.stat) {
        //sending the token

        const token = createToken(response.id);
        res.cookie("jwtAdmin", token, {
          httponly: true,
          maxAge: maxAge * 1000,
        });

        res.json({ state: false });
      } else {
        res.json({ message: response.message });
      }
    });
  },

  adminUserManagementGet: (req, res, next) => {
    let pageNo = (Number(req.params.id) - 1) * 10;
    let passNo = req.params.id;

    adminOpt.getAllUsers(pageNo).then((response) => {
      res.render("admin/adminUsersList", {
        user: false,
        issue: false,
        response,
        passNo,
      });
    });
  },

  verifyJwtAdminToken: (req, res, next) => {
    const token = req.cookies.jwtAdmin;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
          console.log(err.message, "jwt error");
          res.render("admin/adminLogin", { user: false, issue: false });
        } else {
          console.log(decodedToken, "decoded the token");

          next();
        }
      });
    } else {
      res.render("admin/adminLogin", { user: false, issue: false });
    }
  },

  adminUserBlockPatch: (req, res) => {
    console.log(req.body);

    adminOpt.updateUserBlock(req.body).then((response) => {
      console.log(
        typeof response,
        "checkingggggggggggggggggggggggggggggggggggggggg"
      );
      res.json({ state: response });
    });
  },

  adminLogoutGet: (req, res) => {
    res.cookie("jwtAdmin", "", { maxAge: 1 });
    res.redirect("/admin_panel/admin_login");
  },

  adminAddCategoriesPost: (req, res) => {
    req.body.active = true;
    req.body.date = new Date();

    adminOpt.addCategory(req.body).then((response) => {
      if (response.state) {
        let categoryImage = req.files.categoryImage;
        categoryImage.mv(`public/categoryImages/${response.id}.jpg`);
        console.log(req.body, "adddd categoryyyyyyyyyyyyyyyyyyyyyy");
        console.log(req.files.categoryImage);
        res.json({});
      } else {
        res.json({ message: "Category Already Exits" });
      }
    });
  },

  adminEditCategoriesPatch: (req, res) => {
    console.log(req.body, "editttttttttttttttttt category");

    adminOpt.editCategory(req.body).then((response) => {
      if (response.state) {
        if (req.files) {
          console.log("innnnnnnn   filesssssssssssssssssssssssss");
          let categoryImage = req.files.categoryImage;
          categoryImage.mv(`public/categoryImages/${req.body._id}.jpg`);
          console.log(req.files.categoryImage);
        }

        res.json({});
      } else {
        res.json({ message: "Category Already Exists" });
      }
    });
  },

  adminDeleteCategoriesPatch: (req, res) => {
    console.log(req.body);

    adminOpt.deleteCategory(req.body).then((response) => {
      console.log(
        typeof response,
        "checkingggggggggggggggggggggggggggggggggggggggg"
      );
      res.json({ state: response });
    });
  },

  adminCategoriesGet: (req, res) => {
    adminOpt.getAllCategories().then((categories) => {
      res.render("admin/adminCategory", {
        user: false,
        issue: false,
        categories,
      });
    });
  },

  // Admin Products Controllersssss

  adminProductsGet: (req, res) => {
    adminOpt.getAllProductsandCategories().then((response) => {
      const { products, categories } = response;

      console.log(products[0], categories[0]);
      res.render("admin/adminProducts", {
        user: false,
        issue: false,
        products,
        categories,
      });
    });
  },

  adminAddProductsPost: (req, res) => {
    const {
      _id,
      productsName,
      price,
      categoryId,
      description,
      weight500,
      instock500,
      weight1,
      instock1,
      massUnit,
    } = req.body;
    console.log(weight500, weight1, "hiiiiiii");

    let weight500State = weight500 !== undefined && "true" === weight500; //returns true
    console.log(weight500State);
    let weight1State = weight1 !== undefined && "true" === weight1; //returns true
    console.log(weight1State);
    req.body = {
      _id,
      productsName,
      price,
      categoryId,
      description,
      weight: { weight500State, weight1State },
      instock: { half: Number(instock500), full: Number(instock1) },
      massUnit,
    };
    req.body.active = true;
    req.body.date = new Date();

    adminOpt.addProducts(req.body).then((response) => {
      if (response.state) {
        console.log(req.body, "adddd Productsyyyyyyyyyyyyyyyyyyyyyy");
        console.log(req.files);
        console.log(req.files.productsImage);

        let subImage1 = req.files.productSubImage1;
        let subImage2 = req.files.productSubImage2;
        let subImage3 = req.files.productSubImage3;
        let productsImage = req.files.productsImage;

        subImage1.mv(`public/productsImages/${response.id}_subimage1.jpg`);
        subImage2.mv(`public/productsImages/${response.id}_subimage2.jpg`);
        subImage3.mv(`public/productsImages/${response.id}_subimage3.jpg`);
        productsImage.mv(`public/productsImages/${response.id}.jpg`);

        res.json({});
      } else {
        res.json({ message: "Product Already Exits" });
      }
    });
  },

  adminEditProductsPatch: (req, res) => {
    const {
      _id,
      productsName,
      price,
      categoryId,
      description,
      weight500,
      instock500,
      weight1,
      instock1,
      massUnit,
    } = req.body;
    console.log(weight500, weight1, "hiiiiiii");

    let weight500State = weight500 !== undefined && "true" === weight500; //returns true
    console.log(weight500State);
    let weight1State = weight1 !== undefined && "true" === weight1; //returns true
    console.log(weight1State);
    req.body = {
      _id,
      productsName,
      price,
      categoryId,
      description,
      weight: { weight500State, weight1State },
      instock: { half: Number(instock500), full: Number(instock1) },
      massUnit,
    };

    console.log(req.body, "editttttttttttttttttt Products");

    adminOpt.editProducts(req.body).then((response) => {
      if (response.state) {
        if (req.files) {
          console.log("innnnnnnn   filesssssssssssssssssssssssss");
          if (req.files.productSubImage1) {
            let subImage1 = req.files.productSubImage1;
            subImage1.mv(`public/productsImages/${req.body._id}_subimage1.jpg`);
          }
          if (req.files.productSubImage2) {
            let subImage2 = req.files.productSubImage2;
            subImage2.mv(`public/productsImages/${req.body._id}_subimage2.jpg`);
          }

          if (req.files.productSubImage3) {
            let subImage3 = req.files.productSubImage3;
            subImage3.mv(`public/productsImages/${req.body._id}_subimage3.jpg`);
          }

          if (req.files.productsImage) {
            let productsImage = req.files.productsImage;

            productsImage.mv(`public/productsImages/${req.body._id}.jpg`);
          }

          console.log(req.files.productsImage);
        }

        res.json({});
      } else {
        res.json({ message: "Products Already Exists" });
      }
    });
  },

  adminDeleteProductsPatch: (req, res) => {
    console.log(req.body);

    adminOpt.deleteProducts(req.body).then((response) => {
      if (response.message) {
        res.json({ message: response.message });
      } else {
        console.log(
          typeof response,
          "checkingggggggggggggggggggggggggggggggggggggggg"
        );
        res.json({ state: response });
      }
    });
  },

  adminOrdersListingGet: (req, res) => {
    let pageNo = (Number(req.params.id) - 1) * 10;
    let passNo = req.params.id;

    adminOpt.getAllOrders(pageNo).then((orders) => {
      res.render("admin/adminOrdersList", {
        user: false,
        issue: false,
        orders,
        passNo,
      });
    });
  },

  //Admin product Order Status

  adminOrderStatusPatch: (req, res) => {
    adminOpt
      .adminOrderStatusChange(req.body.status, req.body.user, req.body.orderId)
      .then((response) => {
        res.json({ state: response });
      });
  },
  adminOrderStatusReturnPatch: (req, res) => {
    adminOpt
      .adminOrderStatusReturnChange(
        req.body.status,
        req.body.user,
        req.body.orderId,
        req.body.totalAmount
      )
      .then((response) => {
        res.json({ state: response });
      });
  },

  // Admin Coupons Get

  adminCouponsGet: (req, res) => {
    adminOpt.getAllCoupons().then((coupons) => {
      res.render("admin/adminCoupons", { user: false, issue: false, coupons });
    });
  },

  adminAddCouponPost: (req, res) => {
    console.log(req.body);
    adminOpt.adminAddCoupon(req.body).then((response) => {
      if (response.state) {
        res.json({});
      } else {
        res.json({ message: "Coupon Already Exits" });
      }
    });
  },

  adminEditCouponPatch: (req, res) => {
    console.log(req.body, "editttttttttttttttttt couponnn");

    adminOpt.editCoupon(req.body).then((response) => {
      if (response.state) {
        res.json({});
      } else {
        res.json({ message: "Coupon Already Exists" });
      }
    });
  },

  adminCouponDelete: (req, res) => {
    console.log(req.body);

    adminOpt.deleteCoupon(req.body._id).then((response) => {
      if (response.state) {
        console.log(
          typeof response,
          "checkingggggggggggggggggggggggggggggggggggggggg"
        );
        res.json({});
      } else {
        res.json({ message: response.message });
      }
    });
  },
};
