var db = require("./connection");
const collection = require("./collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;
module.exports = {
  // Admin Login

  adminLogin: (userData) => {
    return new Promise(async (resolve, rej) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.adminCollection)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((stat) => {
          if (stat) {
            console.log("login success");
            response.id = user._id;
            response.stat = true;
            resolve(response);
          } else {
            console.log("wrong password");
            resolve({ stat: false, message: " Password is Wrong" });
          }
        });
      } else {
        console.log("wrong username");
        resolve({ stat: false, message: " Username is Wrong" });
      }
    });
  },

  // Admin User Listing

  getAllUsers: (pageNo) => {
    return new Promise(async (res, rej) => {
      let users = await db
        .get()
        .collection(collection.userCollection)
        .aggregate([
          {
            $sort: { date: -1 },
          },
          {
            $skip: pageNo,
          },
          {
            $limit: 10,
          },
        ])
        .toArray();
      res(users);
    });
  },

  //Admin User Block

  updateUserBlock: (info) => {
    let blockBoolean = true;
    if (info.block === "false") {
      blockBoolean = false;
    }
    console.log(typeof info.block);
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(info._id) },
          { $set: { block: blockBoolean } }
        )
        .then((response) => {
          res(blockBoolean);
        });
    });
  },

  // Admin Add Category

  addCategory: async (info) => {
    return new Promise(async (res, rej) => {
      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .findOne({
          categoryName: { $regex: new RegExp(`^${info.categoryName}$`, "i") },
        });
      let response = {};
      if (category) {
        response.state = false;
        res(response);
      } else {
        info.offer = Number(info.offer);

        db.get()
          .collection(collection.categoryCollection)
          .insertOne(info)
          .then((data) => {
            response.state = true;
            response.id = data.insertedId;
            console.log(data, "data of registerd user");
            res(response);
          });
      }
    });
  },

  // Admin Category Listing

  getAllCategories: () => {
    return new Promise(async (res, rej) => {
      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .find()
        .toArray();
      res(category);
    });
  },

  // Admin Edit Category

  editCategory: async (info) => {
    console.log(info, "edit categoryyyyyyyyyyyyyyyyyyyyyyyyyyy");
    const { categoryName, offer } = info;
    let checkCategoryName = info.categoryName;
    return new Promise(async (res, rej) => {
      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .findOne({
          $and: [
            { _id: { $ne: objectId(info._id) } },
            {
              categoryName: {
                $regex: new RegExp(`^${checkCategoryName}$`, "i"),
              },
            },
          ],
        });

      console.log(category, "helllllllllllllllllllllllllllllllllllllllll");
      let response = {};
      if (category) {
        response.state = false;

        res(response);
      } else {
        await db
          .get()
          .collection(collection.categoryCollection)
          .updateOne(
            { _id: objectId(info._id) },
            { $set: { categoryName, offer: Number(offer) } }
          )
          .then((data) => {
            response.state = true;

            console.log(
              data,
              "data of edited categoryyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
            );
            res(response);
          });
      }
    });
  },

  //Admin Delete Category

  deleteCategory: (info) => {
    let activeBoolean = true;
    if (info.active === "false") {
      activeBoolean = false;
    }
    console.log(typeof info.active);
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.productsCollection)
        .updateMany(
          { categoryId: objectId(info._id) },
          { $set: { active: activeBoolean } }
        )
        .then((response) => {
          db.get()
            .collection(collection.categoryCollection)
            .updateOne(
              { _id: objectId(info._id) },
              { $set: { active: activeBoolean } }
            )
            .then((response) => {
              res(activeBoolean);
            });
        });
    });
  },

  // Admin Add Products

  addProducts: async (info) => {
    return new Promise(async (res, rej) => {
      let products = await db
        .get()
        .collection(collection.productsCollection)
        .findOne({
          productsName: { $regex: new RegExp(`^${info.productsName}$`, "i") },
        });
      let response = {};
      if (products) {
        response.state = false;
        res(response);
      } else {
        info.categoryId = objectId(info.categoryId);
        info.price = Number(info.price);
        // info.instock = Number(info.instock)
        db.get()
          .collection(collection.productsCollection)
          .insertOne(info)
          .then((data) => {
            response.state = true;
            response.id = data.insertedId;
            console.log(data, "data of registerd products");
            res(response);
          });
      }
    });
  },

  // Admin Products Listing

  getAllProductsandCategories: () => {
    return new Promise(async (res, rej) => {
      let response = {};
      let products = await db
        .get()
        .collection(collection.productsCollection)
        .aggregate([
          {
            $lookup: {
              from: collection.categoryCollection,
              localField: "categoryId",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },
        ])
        .toArray();

      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .find({ active: true })
        .toArray();
      console.log(products);
      console.log(category);
      response.products = products;
      response.categories = category;

      res(response);
    });
  },

  // Admin Edit Products

  editProducts: async (info) => {
    console.log(info, "edit Productsyyyyyyyyyyyyyyyyyyyyyyyyyyy");
    const {
      productsName,
      price,
      categoryId,
      description,
      instock,
      weight,
      massUnit,
    } = info;

    let checkProductsName = info.productsName;
    return new Promise(async (res, rej) => {
      let products = await db
        .get()
        .collection(collection.productsCollection)
        .findOne({
          $and: [
            { _id: { $ne: objectId(info._id) } },
            {
              productsName: {
                $regex: new RegExp(`^${checkProductsName}$`, "i"),
              },
            },
          ],
        });

      console.log(products, "helllllllllllllllllllllllllllllllllllllllll");
      let response = {};
      if (products) {
        response.state = false;

        res(response);
      } else {
        await db
          .get()
          .collection(collection.productsCollection)
          .updateOne(
            { _id: objectId(info._id) },
            {
              $set: {
                productsName,
                price: Number(price),
                categoryId: objectId(categoryId),
                description,
                weight,
                instock,
                massUnit,
              },
            }
          )
          .then((data) => {
            response.state = true;

            console.log(
              data,
              "data of edited Productsyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
            );
            res(response);
          });
      }
    });
  },

  //Admin Delete Products

  deleteProducts: (info) => {
    let response = {};
    let activeBoolean = true;
    if (info.active === "false") {
      activeBoolean = false;
    }
    console.log(typeof info.active);
    return new Promise(async (res, rej) => {
      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .findOne({ _id: objectId(info.categoryId) });
      if (category.active) {
        db.get()
          .collection(collection.productsCollection)
          .updateOne(
            { _id: objectId(info._id) },
            { $set: { active: activeBoolean } }
          )
          .then((response) => {
            res(activeBoolean);
          });
      } else {
        response.message = "Category is Inactive";
        res(response);
      }
    });
  },

  // Admin All Orders Listing

  getAllOrders: (pageNo) => {
    return new Promise(async (res, rej) => {
      let orders = await db
        .get()
        .collection(collection.userCollection)
        .aggregate([
          {
            $match: { order: { $exists: true } },
          },
          {
            $unwind: "$order",
          },
          {
            $sort: { "order.date": -1 },
          },
          {
            $skip: pageNo,
          },
          {
            $limit: 10,
          },

          {
            $project: {
              order: 1,
              name: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
            },
          },
        ])
        .toArray();

      console.log(orders, " orders stage 123333");
      res(orders);
    });
  },

  // Admin Dashboard Orders Listing

  getAllOrdersDashboard: () => {
    return new Promise(async (res, rej) => {
      let orders = await db
        .get()
        .collection(collection.userCollection)
        .aggregate([
          {
            $match: { order: { $exists: true } },
          },
          {
            $unwind: "$order",
          },
          {
            $sort: { "order.date": -1 },
          },

          {
            $project: {
              order: 1,
              name: 1,
              lastName: 1,
              email: 1,
              phoneNumber: 1,
            },
          },
          { $limit: 5 },
        ])
        .toArray();

      console.log(orders, " orders stage dashhhhhhhhhhhhhboaaaaaarddddddddd");
      res(orders);
    });
  },

  // Admin Order Status Changing

  adminOrderStatusChange: (status, userId, orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.userCollection)
          .updateOne(
            {
              _id: objectId(userId),
            },
            {
              $set: {
                "order.$[orderPosition].status": status,
                "order.$[orderPosition].statusDate": new Date(),
              },
            },
            {
              arrayFilters: [
                {
                  "orderPosition.orderId": {
                    $eq: orderId,
                  },
                },
              ],
            }
          )
          .then((result) => {
            console.log(result, orderId, status);
            resolve(true);
          });
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  adminOrderStatusReturnChange: (status, userId, orderId, totalAmount) => {
    let money = Number(totalAmount);

    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.userCollection)
          .updateOne(
            {
              _id: objectId(userId),
            },
            {
              $set: {
                "order.$[orderPosition].status": status,
                "order.$[orderPosition].statusDate": new Date(),
              },
            },
            {
              arrayFilters: [
                {
                  "orderPosition.orderId": {
                    $eq: orderId,
                  },
                },
              ],
            }
          )
          .then(async (result) => {
            await db
              .get()
              .collection(collection.userCollection)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $inc: {
                    "wallet.total": money,
                  },
                }
              )
              .then((result) => {
                db.get()
                  .collection(collection.userCollection)
                  .updateOne(
                    { _id: objectId(userId) },
                    {
                      $push: {
                        "wallet.History": {
                          message: `Credited ${money} from Returned Order ${orderId}`,
                          date: new Date(),
                        },
                      },
                    }
                  );

                console.log(result, orderId, status);
                resolve(true);
              });
          });
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find All Category Sales

  findAllCategorySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let categorySales = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },

            {
              $unwind: "$order.products",
            },

            {
              $group: {
                _id: "$order.products.productDetails.categoryId",
                sum: {
                  $sum: {
                    $multiply: [
                      "$order.products.productDetails.price",
                      "$order.products.quantity",
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "category",
                localField: "_id",
                foreignField: "_id",

                pipeline: [{ $project: { categoryName: 1, _id: 0 } }],
                as: "categoryName",
              },
            },
            {
              $project: {
                _id: 1,
                sum: 1,
                count: 1,
                category: { $arrayElemAt: ["$categoryName", 0] },
              },
            },
            {
              $project: {
                _id: 1,
                sum: 1,
                count: 1,
                categoryName: "$category.categoryName",
              },
            },
          ])
          .toArray();

        console.log(categorySales);

        resolve(categorySales);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find All orders by Month

  findAllOrdersByMonth: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let ordersMonth = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },
            {
              $match: {
                "order.date": {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 365),
                },
              },
            },
            {
              $unwind: "$order.products",
            },
            {
              $project: {
                year: { $year: "$order.date" },
                month: { $month: "$order.date" },
                day: { $dayOfMonth: "$order.date" },
                dayOfWeek: { $dayOfWeek: "$order.date" },
                week: { $week: "$order.date" },
              },
            },
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },

                detail: { $first: "$$ROOT" },
              },
            },
            {
              $sort: { detail: 1 },
            },
          ])
          .toArray();

        resolve(ordersMonth);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Monthly Sales Orders

  getAllMonthlySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let ordersMonth = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },
            {
              $match: {
                "order.date": {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 31),
                },
              },
            },
            {
              $project: {
                month: "totalId",

                total: "$order.totalAmount",
              },
            },
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
                total: { $sum: "$total" },
              },
            },
          ])
          .toArray();

        resolve(ordersMonth);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Yearly Sales Orders

  getAllYearlySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let ordersYear = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },
            {
              $match: {
                "order.date": {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 365),
                },
              },
            },
            {
              $project: {
                month: "totalId",

                total: "$order.totalAmount",
              },
            },
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
                total: { $sum: "$total" },
              },
            },
          ])
          .toArray();

        resolve(ordersYear);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // All Sales Orders

  getAllSales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allOrders = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: {
                month: "totalId",

                total: "$order.totalAmount",
              },
            },
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
                total: { $sum: "$total" },
              },
            },
          ])
          .toArray();

        console.log(
          allOrders,
          "hiiiiiiiiiiiiiiii Alll    order Salesssssssssssss"
        );

        resolve(allOrders);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find All orders by Day

  findAllOrdersByDay: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let ordersDay = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },
            {
              $match: {
                "order.date": {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7),
                },
              },
            },
            {
              $unwind: "$order.products",
            },
            {
              $project: {
                year: { $year: "$order.date" },
                month: { $month: "$order.date" },
                day: { $dayOfMonth: "$order.date" },
                dayOfWeek: { $dayOfWeek: "$order.date" },
                week: { $week: "$order.date" },
              },
            },
            {
              $group: {
                _id: "$dayOfWeek",
                count: { $sum: 1 },
                detail: { $first: "$$ROOT" },
              },
            },
            {
              $sort: { detail: 1 },
            },
          ])
          .toArray();

        resolve(ordersDay);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find Today Orders Sale

  getTodaySales: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let todayOrders = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { order: { $exists: true } },
            },
            {
              $unwind: "$order",
            },
            {
              $sort: { "order.date": -1 },
            },

            {
              $project: { order: 1 },
            },
            {
              $match: {
                "order.date": {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24),
                },
              },
            },
            {
              $project: {
                day: "todayId",
                total: "$order.totalAmount",
              },
            },
            {
              $group: {
                _id: "$day",
                count: { $sum: 1 },
                total: { $sum: "$total" },
              },
            },
          ])
          .toArray();

        console.log(todayOrders, "hiiiiiiiiiiii");
        resolve(todayOrders);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find All Users by Month

  findAllUsersByMonth: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let usersMonth = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 365),
                },
              },
            },

            {
              $sort: { date: -1 },
            },

            {
              $project: { date: 1 },
            },

            {
              $project: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                day: { $dayOfMonth: "$date" },
                dayOfWeek: { $dayOfWeek: "$date" },
                week: { $week: "$date" },
              },
            },
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
                detail: { $first: "$$ROOT" },
              },
            },
            {
              $sort: { detail: 1 },
            },
          ])
          .toArray();

        resolve(usersMonth);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Find All Users by Day

  findAllUsersByDay: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let usersDay = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7),
                },
              },
            },

            {
              $sort: { date: -1 },
            },

            {
              $project: { date: 1 },
            },

            {
              $project: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                day: { $dayOfMonth: "$date" },
                dayOfWeek: { $dayOfWeek: "$date" },
                week: { $week: "$date" },
              },
            },
            {
              $group: {
                _id: "$dayOfWeek",
                count: { $sum: 1 },
                detail: { $first: "$$ROOT" },
              },
            },
            {
              $sort: { detail: 1 },
            },
          ])
          .toArray();
        console.log(usersDay);
        resolve(usersDay);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  // Admin Add Coupons

  adminAddCoupon: async (info) => {
    return new Promise(async (res, rej) => {
      let coupon = await db
        .get()
        .collection(collection.couponsCollection)
        .findOne({
          couponName: { $regex: new RegExp(`^${info.couponName}$`, "i") },
        });
      let response = {};
      if (coupon) {
        response.state = false;
        res(response);
      } else {
        info.offer = Number(info.offer);
        info.startingDate = new Date(info.startingDate);
        info.expiryDate = new Date(info.expiryDate);
        info.minAmount = Number(info.minAmount);
        info.maxAmount = Number(info.maxAmount);

        db.get()
          .collection(collection.couponsCollection)
          .insertOne(info)
          .then((data) => {
            response.state = true;
            response.id = data.insertedId;
            console.log(data, "data of coupon addedddddd");
            res(response);
          });
      }
    });
  },

  // Admin Coupons Listing

  getAllCoupons: () => {
    return new Promise(async (res, rej) => {
      let coupon = await db
        .get()
        .collection(collection.couponsCollection)
        .find()
        .toArray();
      res(coupon);
    });
  },

  // Admin Edit Coupon

  editCoupon: async (info) => {
    console.log(info, "edit couponnnnnnnnnnnnnns");
    const { couponName, offer } = info;
    let checkCouponName = info.couponName;
    return new Promise(async (res, rej) => {
      let coupon = await db
        .get()
        .collection(collection.couponsCollection)
        .findOne({
          $and: [
            { _id: { $ne: objectId(info._id) } },
            { couponName: { $regex: new RegExp(`^${checkCouponName}$`, "i") } },
          ],
        });

      console.log(coupon, "helllllllllllllllllllllllllllllllllllllllll");
      let response = {};
      if (coupon) {
        response.state = false;

        res(response);
      } else {
        info.offer = Number(info.offer);
        info.startingDate = new Date(info.startingDate);
        info.expiryDate = new Date(info.expiryDate);
        info.minAmount = Number(info.minAmount);
        info.maxAmount = Number(info.maxAmount);

        await db
          .get()
          .collection(collection.couponsCollection)
          .updateOne(
            { _id: objectId(info._id) },
            {
              $set: {
                couponName: info.couponName,
                offer: info.offer,
                startingDate: info.startingDate,
                expiryDate: info.expiryDate,
                minAmount: info.minAmount,
                maxAmount: info.maxAmount,
              },
            }
          )
          .then((data) => {
            response.state = true;

            console.log(data, "data of edited couponssssssss");
            res(response);
          });
      }
    });
  },

  deleteCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      let response = {};

      db.get()
        .collection(collection.couponsCollection)
        .deleteOne({ _id: objectId(couponId) })
        .then((data) => {
          response.state = true;
          resolve(response);
        })
        .catch((err) => {
          console.log(err, "delete Error");

          response.state = false;
          response.message = err;

          resolve(response);
        });
    });
  },

  /************************  wil use it in the future *********************/
  // getUserDetails: (userId) => {
  //   return new Promise((res, rej) => {
  //     db.get()
  //       .collection(collection.userCollection)
  //       .findOne({ _id: objectId(userId) })
  //       .then((userDetails) => {
  //         console.log(userDetails, " stage 1");
  //         res(userDetails);
  //       });
  //   });
  // },

  // deleteUser: (userId) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collection.userCollection)
  //       .deleteOne({ _id: objectId(userId) })
  //       .then((response) => {
  //         resolve(response);
  //       });
  //   });
  // },
  // updateUser: (userId, userDetails) => {
  //   return new Promise((res, rej) => {
  //     db.get()
  //       .collection(collection.userCollection)
  //       .updateOne({ _id: objectId(userId) }, { $set: userDetails })
  //       .then((response) => {
  //         res(response);
  //       });
  //   });
  // },
};
