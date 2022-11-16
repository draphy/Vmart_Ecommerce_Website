require("dotenv").config();
var db = require("./connection");
const collection = require("./collections");
const bcrypt = require("bcrypt");
const { ObjectID } = require("bson");
var objectId = require("mongodb").ObjectId;
const crypto = require("crypto");
const paypal = require("paypal-rest-sdk");
//RazorPay
const Razorpay = require("razorpay");
const { response } = require("../app");

var instance = new Razorpay({
  key_id: process.env.Razorpay_KEY_ID,
  key_secret: process.env.Razorpay_KEY_SECRET,
});

//Paypal

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});

module.exports = {
  // User Registration
  findUserRegistration: async (info) => {
    console.log(info);
    let user = await db
      .get()
      .collection(collection.userCollection)
      .findOne({ email: info.email });

    if (user) {
      return new Promise((res, rej) => {
        res({ state: false, message: "Email" });
      });
    } else {
      let phoneNumber = await db
        .get()
        .collection(collection.userCollection)
        .findOne({ phoneNumber: info.phoneNumber });
      if (phoneNumber) {
        console.log(user);
        console.log("suc");
        return new Promise((res, rej) => {
          res({ state: false, message: "Phone Number" });
        });
      } else {
        return new Promise((res, rej) => {
          res({ state: true });
        });
      }
    }
  },

  // User Otp Login
  findUserOtpLogin: async (info) => {
    console.log(info);
    let user = await db
      .get()
      .collection(collection.userCollection)
      .findOne({ phoneNumber: info.phoneNumber });

    if (user) {
      return new Promise((res, rej) => {
        res({ state: true, name: user.name, _id: user._id });
      });
    } else {
      return new Promise((res, rej) => {
        res({ state: false, message: "Phone-Number" });
      });
    }
  },
  // User Login
  doLogin: (userData) => {
    return new Promise(async (res, rej) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.userCollection)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((stat) => {
          if (stat) {
            console.log("login success");
            response._id = user._id;
            response.name = user.name;
            response.stat = true;
            res(response);
          } else {
            console.log("wrong password");
            res({ stat: false, message: "Password" });
          }
        });
      } else {
        console.log("wrong username");
        res({ stat: false, message: "Username" });
      }
    });
  },

  adminLogin: (userData) => {
    return new Promise(async (res, rej) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection("adminlist")
        .findOne({ username: userData.username });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((stat) => {
          if (stat) {
            console.log("login success");
            response.user = user;
            response.stat = true;
            res(response);
          } else {
            console.log("wrong password");
            res({ stat: false, message: "Wrong Password" });
          }
        });
      } else {
        console.log("wrong username");
        res({ stat: false, message: "Wrong Username" });
      }
    });
  },

  getAllUsers: () => {
    return new Promise(async (res, rej) => {
      let users = await db
        .get()
        .collection(collection.userCollection)
        .find()
        .toArray();
      res(users);
    });
  },

  // users Homepage Top Products

  topProducts: () => {
    return new Promise(async (res, rej) => {
      let topProducts = await db
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
            $unwind: "$order.products",
          },
          {
            $project: {
              _id: 0,
              "order.products.productId": 1,
              "order.products.productDetails.productsName": 1,
            },
          },
          {
            $group: {
              _id: "$order.products.productId",
              count: { $sum: 1 },
              detail: { $first: "$$ROOT" },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 6,
          },
        ])
        .toArray();

      res(topProducts);
    });
  },

  // find the user with Referral
  findReferral: (referral) => {
    return new Promise(async (res, rej) => {
      let user = await db
        .get()
        .collection(collection.userCollection)
        .findOne({ referral: referral });

      if (user) {
        res(true);
      } else {
        res(false);
      }
    });
  },

  getUserDetails: (userId) => {
    return new Promise(async (res, rej) => {
      await db
        .get()
        .collection(collection.userCollection)
        .findOne({ _id: objectId(userId) }, { projection: { password: 0 } })
        .then((userDetails) => {
          console.log(userDetails, " stage 123333");
          res(userDetails);
        });
    });
  },

  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.userCollection)
        .deleteOne({ _id: objectId(userId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  updateUser: (userId, userDetails) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne({ _id: objectId(userId) }, { $set: userDetails })
        .then((response) => {
          res(response);
        });
    });
  },

  addUser: async (info) => {
    return new Promise(async (res, rej) => {
      info.password = await bcrypt.hash(info.password, 10);
      db.get()
        .collection(collection.userCollection)
        .insertOne(info)
        .then((data) => {
          console.log(data, "data of registerd user");
          res(data);
        });
    });
  },

  // User Verification

  updateUserVerification: (info) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { phoneNumber: info.phoneNumber },
          { $set: { verification: true } }
        )
        .then((response) => {
          res(response);
        });
    });
  },
  // User Latest Products Listing

  latestProducts: () => {
    return new Promise(async (res, rej) => {
      let latestProducts = await db
        .get()
        .collection(collection.productsCollection)
        .aggregate([
          { $match: { active: true } },
          {
            $sort: { date: -1 },
          },
          {
            $limit: 6,
          },
          {
            $project: {
              _id: 1,
              productsName: 1,
            },
          },
        ])
        .toArray();

      res(latestProducts);
    });
  },

  // User Search Listing

  getSearchProduct: (search, min, max) => {
    return new Promise(async (res, rej) => {
      let products = await db
        .get()
        .collection(collection.productsCollection)
        .aggregate([
          { $match: { $text: { $search: `${search}` } } },
          {
            $lookup: {
              from: collection.categoryCollection,
              localField: "categoryId",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },

          {
            $project: {
              score: { $meta: "textScore" },
              productsName: 1,
              price: 1,
              categoryId: 1,
              weight: 1,
              instock: 1,
              massUnit: 1,
              active: 1,
              categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
            },
          },

          { $sort: { score: -1 } },

          {
            $match: {
              score: { $gt: 0.5 },
              active: true,
              price: { $lte: max, $gte: min },
            },
          },
        ])
        .toArray();

      console.log(products, "hiiiiii searchhhhhhhhhhhhhhhhh");
      res(products);
    });
  },

  // User Category and Products Listing

  getAllProductsandCategories: () => {
    return new Promise(async (res, rej) => {
      let response = {};

      let category = await db
        .get()
        .collection(collection.categoryCollection)
        .aggregate([
          { $match: { active: true } },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "categoryId",

              pipeline: [
                { $match: { active: true } },
                {
                  $sort: { date: -1 },
                },
                {
                  $limit: 5,
                },
              ],
              as: "productDetails",
            },
          },
        ])
        .toArray();

      console.log(category);
      response.categories = category;

      res(response);
    });
  },

  // User Category wise Products Listing getting all data

  getAllProductInCategory: (categoryId, min, max) => {
    return new Promise(async (res, rej) => {
      let product = await db
        .get()
        .collection(collection.productsCollection)
        .aggregate([
          {
            $match: {
              categoryId: objectId(categoryId),
              active: true,
              price: { $lte: max, $gte: min },
            },
          },

          {
            $project: {
              date: 0,
              description: 0,
            },
          },

          {
            $lookup: {
              from: collection.categoryCollection,
              localField: "categoryId",
              foreignField: "_id",
              as: "categoryDetails",
            },
          },

          {
            $project: {
              productsName: 1,
              price: 1,
              categoryId: 1,
              weight: 1,
              instock: 1,
              massUnit: 1,
              active: 1,
              categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
            },
          },
        ])
        .toArray();

      console.log(product);

      res(product);
    });
  },

  getAllCategory: () => {
    return new Promise(async (res, rej) => {
      let categories = await db
        .get()
        .collection(collection.categoryCollection)
        .find({ active: true })
        .toArray();

      res(categories);
    });
  },

  // User Single Products Listing

  getSingleProductandCategory: (productId) => {
    return new Promise(async (res, rej) => {
      let response = {};

      let product = await db
        .get()
        .collection(collection.productsCollection)
        .aggregate([
          { $match: { _id: objectId(productId) } },
          {
            $lookup: {
              from: collection.productsCollection,
              localField: "categoryId",
              foreignField: "categoryId",
              pipeline: [
                {
                  $match: {
                    $and: [
                      { _id: { $ne: objectId(productId) } },
                      { active: true },
                    ],
                  },
                },
                {
                  $sort: { date: -1 },
                },
                {
                  $limit: 4,
                },
              ],
              as: "similarProducts",
            },
          },
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

      console.log(product);
      response.product = product;

      res(response);
    });
  },

  // Add to wishlist of Single Product

  addToWishlist: (info, userId) => {
    return new Promise(async (res, rej) => {
      let userWishlist = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ _id: objectId(userId) }, { wishlist: { $exists: true } }],
        });
      console.log(userWishlist, "wishlistttttttttttt");
      if (userWishlist) {
        let product = userWishlist.wishlist.findIndex(
          (product) => product.productId == info.productId
        );

        console.log(product, "wishlist productttttttttttttttttttttt");
        if (product != -1) {
          db.get()
            .collection(collection.userCollection)
            .updateOne(
              { _id: objectId(userId) },
              {
                $pull: { wishlist: { productId: objectId(info.productId) } },
              }
            )
            .then((response) => {
              console.log(
                response,
                "successsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss"
              );
              res("pull");
            });
        } else {
          db.get()
            .collection(collection.userCollection)
            .updateOne(
              { _id: objectId(userId) },
              {
                $push: {
                  wishlist: {
                    productId: objectId(info.productId),
                    weight: Number(info.weight),
                    uniqueId: new ObjectID(),
                  },
                },
              }
            )
            .then((response) => {
              res("insert");
            });
        }
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                wishlist: [
                  {
                    productId: objectId(info.productId),

                    weight: Number(info.weight),
                    uniqueId: new ObjectID(),
                  },
                ],
              },
            }
          )
          .then((response) => {
            res("insert");
          });
      }
    });
  },

  // Add to Cart of Single Product

  addToCart: (info, userId) => {
    return new Promise(async (res, rej) => {
      let userCart = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ _id: objectId(userId) }, { cart: { $exists: true } }],
        });
      console.log(userCart, "carttttttttttttttttttttttttttttt");
      if (userCart) {
        let product = userCart.cart.findIndex(
          (product) =>
            product.productId == info.productId && product.weight == info.weight
        );

        console.log(product, "carttttttttttttt productttttttttttttttttttttt");
        if (product != -1) {
          // updateOne({_id:objectId(userId),'cart.productId':objectId(info.productId),'cart.weight':Number(info.weight)},
          //   {
          //       $inc : {'cart.$.quantity': Number( info.quantity)}
          //   }
          //   )

          db.get()
            .collection(collection.userCollection)
            .updateOne(
              { _id: objectId(userId) },
              {
                $inc: { "cart.$[position].quantity": Number(info.quantity) },
              },
              {
                arrayFilters: [
                  {
                    $and: [
                      {
                        "position.productId": {
                          $eq: objectId(info.productId),
                        },
                      },
                      {
                        "position.weight": {
                          $eq: Number(info.weight),
                        },
                      },
                    ],
                  },
                ],
              }
            )
            .then(async (response) => {
              await db
                .get()
                .collection(collection.userCollection)
                .updateOne(
                  { _id: objectId(userId) },
                  {
                    $pull: {
                      wishlist: {
                        productId: objectId(info.productId),
                        weight: Number(info.weight),
                      },
                    },
                  }
                );

              console.log(
                response,
                "successsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss"
              );
              res("update");
            });
        } else {
          db.get()
            .collection(collection.userCollection)
            .updateOne(
              { _id: objectId(userId) },
              {
                $push: {
                  cart: {
                    productId: objectId(info.productId),
                    quantity: Number(info.quantity),
                    weight: Number(info.weight),
                    uniqueId: new ObjectID(),
                  },
                },
              }
            )
            .then(async (response) => {
              await db
                .get()
                .collection(collection.userCollection)
                .updateOne(
                  { _id: objectId(userId) },
                  {
                    $pull: {
                      wishlist: {
                        productId: objectId(info.productId),
                        weight: Number(info.weight),
                      },
                    },
                  }
                );
              res("insert");
            });
        }
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                cart: [
                  {
                    productId: objectId(info.productId),
                    quantity: Number(info.quantity),
                    weight: Number(info.weight),
                    uniqueId: new ObjectID(),
                  },
                ],
              },
            }
          )
          .then(async (response) => {
            await db
              .get()
              .collection(collection.userCollection)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $pull: {
                    wishlist: {
                      productId: objectId(info.productId),
                      weight: Number(info.weight),
                    },
                  },
                }
              );

            res("insert");
          });
      }
    });
  },

  // User  WishListing

  wishListing: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let wishlistItems = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$wishlist",
            },
            {
              $project: {
                productId: "$wishlist.productId",

                weight: "$wishlist.weight",
                uniqueId: "$wishlist.uniqueId",
              },
            },
            {
              $lookup: {
                from: collection.productsCollection,
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      date: 0,
                      description: 0,
                    },
                  },
                ],
                as: "productDetails",
              },
            },
            {
              $project: {
                productId: 1,
                weight: 1,
                uniqueId: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
          ])
          .toArray();
        console.log(wishlistItems, "hiiiiiiiiiiiiiiii");
        resolve(wishlistItems);
      } catch (error) {
        console.log(error);
      }
    });
  },
  // User Cart Listing

  cartListing: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$cart",
            },
            {
              $project: {
                productId: "$cart.productId",
                quantity: "$cart.quantity",
                weight: "$cart.weight",
                uniqueId: "$cart.uniqueId",
              },
            },
            {
              $lookup: {
                from: collection.productsCollection,
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      date: 0,
                      description: 0,
                    },
                  },
                ],
                as: "productDetails",
              },
            },
            {
              $project: {
                productId: 1,
                quantity: 1,
                weight: 1,
                uniqueId: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
            {
              $lookup: {
                from: collection.categoryCollection,
                localField: "productDetails.categoryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      offer: 1,
                    },
                  },
                ],
                as: "categoryDetails",
              },
            },
            {
              $project: {
                productId: 1,
                quantity: 1,
                uniqueId: 1,
                productDetails: 1,
                weight: 1,
                categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
              },
            },
          ])
          .toArray();
        console.log(cartItems, "hiiiiiiiiiiiiiiii");
        resolve(cartItems);
      } catch (error) {
        console.log(error);
      }
    });
  },

  // Cart count Update

  cartCountUpdate: (info, userId) => {
    return new Promise(async (res, rej) => {
      if (Number(info.quantity) == 0) {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $pull: {
                cart: {
                  productId: objectId(info.productId),
                  weight: Number(info.weight),
                },
              },
            }
          )
          .then((response) => {
            res("update");
          });
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: { "cart.$[position].quantity": Number(info.quantity) },
            },
            {
              arrayFilters: [
                {
                  "position.uniqueId": {
                    $eq: objectId(info.uniqueId),
                  },
                },
              ],
            }
          )
          .then((response) => {
            console.log(response, "hiiiiiiiiiiiiiiiiii cart counttttttttt");
            res("update");
          });
      }
    });
  },
  // User Cart Product Delete

  cartDelete: (info, userId) => {
    return new Promise(async (res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $pull: {
              cart: {
                productId: objectId(info.productId),
                weight: Number(info.weight),
              },
            },
          }
        )
        .then((response) => {
          res("delete");
        });
    });
  },
  // User Wishlist Product Delete

  wishlistDelete: (info, userId) => {
    return new Promise(async (res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $pull: { wishlist: { productId: objectId(info.productId) } },
          }
        )
        .then((response) => {
          res("delete");
        });
    });
  },

  placeOrderTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let Total = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$cart",
            },
            {
              $project: {
                productId: "$cart.productId",
                quantity: "$cart.quantity",
                weight: "$cart.weight",
                uniqueId: "$cart.uniqueId",
              },
            },
            {
              $lookup: {
                from: collection.productsCollection,
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      date: 0,
                      description: 0,
                      _id: 0,
                      weight: 0,
                      instock: 0,
                      active: 0,
                    },
                  },
                ],
                as: "productDetails",
              },
            },
            {
              $project: {
                productId: 1,
                quantity: 1,
                uniqueId: 1,
                weight: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
            {
              $lookup: {
                from: collection.categoryCollection,
                localField: "productDetails.categoryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      offer: 1,
                    },
                  },
                ],
                as: "categoryDetails",
              },
            },
            {
              $project: {
                _id: 0,
                productId: 1,
                quantity: 1,
                uniqueId: 1,
                productDetails: 1,
                weight: 1,
                categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
              },
            },
          ])
          .toArray();
        console.log(Total);
        resolve(Total);
      } catch (error) {
        console.log(error);
      }
    });
  },

  //change Wallet User Total

  changeWalletTotal: (amount, message, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $inc: {
              "wallet.total": amount,
            },
          }
        )
        .then((response) => {
          db.get()
            .collection(collection.userCollection)
            .updateOne(
              { _id: objectId(userId) },
              {
                $push: {
                  "wallet.History": {
                    message: message,
                    date: new Date(),
                  },
                },
              }
            )
            .then((data) => {
              resolve(true);
            });
        });
    });
  },

  // referral Add wallet

  referralAddWallet: (referral) => {
    return new Promise(async (resolve, reject) => {
      let wallet = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ referral: referral }, { wallet: { $exists: true } }],
        });

      console.log(wallet, "wallettttttttttttt");

      if (wallet) {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { referral: referral },
            {
              $inc: {
                "wallet.total": 50,
              },
            }
          )
          .then((data) => {
            db.get()
              .collection(collection.userCollection)
              .updateOne(
                { referral: referral },
                {
                  $push: {
                    "wallet.History": {
                      message: `Earned 50 from Referral`,
                      date: new Date(),
                    },
                  },
                }
              )
              .then((datas) => {
                resolve(true);
              });
          });
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { referral: referral },
            {
              $set: {
                wallet: {
                  total: 50,

                  History: [
                    {
                      message: `Earned 50 from Referral`,
                      date: new Date(),
                    },
                  ],
                },
              },
            }
          )
          .then((data) => {
            resolve(true);
          });
      }
    });
  },

  // referral Current Welcome User Add wallet

  welcomeUserReferral: (userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              wallet: {
                total: 10,

                History: [
                  {
                    message: `Earned 10 from Welcome Referral`,
                    date: new Date(),
                  },
                ],
              },
            },
          }
        )
        .then((data) => {
          resolve(true);
        });
    });
  },

  userPlaceOrder: (
    info,
    totalAmount,
    userId,
    cartItems,
    totalDiscount,
    subtotalAmount
  ) => {
    if (info.couponId != "null") {
      info.couponId = objectId(info.couponId);
      info.couponOffer = Number(info.couponOffer);
    }

    return new Promise(async (res, rej) => {
      let orderResponse = {};
      let status = "";
      let orderId =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      orderResponse.orderId = orderId;

      info.payment === "COD" || info.payment == "wallet"
        ? (status = "placed")
        : (status = "pending");
      console.log(status, "hi statussssssssssssssssssssssssssssssssssssss");

      let userOrder = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ _id: objectId(userId) }, { order: { $exists: true } }],
        });

      if (userOrder) {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $push: {
                order: {
                  orderId: orderId,
                  address: {
                    firstName: info.firstName,
                    lastName: info.lastName,
                    country: info.country,
                    streetAddress: info.streetAddress,
                    city: info.city,
                    state: info.state,
                    postCode: Number(info.postCode),
                    phoneNumber: Number(info.phoneNumber),
                    email: info.email,
                  },
                  paymentMethod: info.payment,
                  status: status,
                  products: cartItems,
                  totalAmount: totalAmount,
                  totalDiscount: totalDiscount,
                  subtotalAmount: subtotalAmount,
                  date: new Date(),
                  coupon: {
                    _id: info.couponId,
                    couponName: info.couponName,
                    offer: info.couponOffer,
                  },
                },
              },
            }
          )
          .then((response) => {
            db.get()
              .collection(collection.userCollection)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    cart: [],
                  },
                }
              )
              .then(async (response) => {
                // wallet

                if (info.couponOffer != "null") {
                  let wallet = await db
                    .get()
                    .collection(collection.userCollection)
                    .findOne({
                      $and: [
                        { _id: objectId(userId) },
                        { wallet: { $exists: true } },
                      ],
                    });
                  console.log(wallet, "wallettttttttttttt");

                  let money =
                    Number(totalAmount) * (Number(info.couponOffer) / 100);
                  money = Number(money.toFixed(2));

                  if (wallet) {
                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $inc: {
                            "wallet.total": money,
                          },
                        }
                      )
                      .then((data) => {
                        //pulling from rewards

                        db.get()
                          .collection(collection.userCollection)
                          .updateOne(
                            { _id: objectId(userId) },
                            {
                              $pull: {
                                reward: { _id: objectId(info.couponId) },
                              },
                            }
                          );
                      });

                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $push: {
                            "wallet.History": {
                              message: `Earned ${money} from coupon Offer`,
                              date: new Date(),
                            },
                          },
                        }
                      );
                  } else {
                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $set: {
                            wallet: {
                              total: money,

                              History: [
                                {
                                  message: `Earned ${money} from coupon Offer`,
                                  date: new Date(),
                                },
                              ],
                            },
                          },
                        }
                      )
                      .then((data) => {
                        //pulling from rewards

                        db.get()
                          .collection(collection.userCollection)
                          .updateOne(
                            { _id: objectId(userId) },
                            {
                              $pull: {
                                reward: { _id: objectId(info.couponId) },
                              },
                            }
                          );
                      });
                  }
                }

                for (let i = 0; i < cartItems.length; i++) {
                  if (cartItems[i].weight == "500") {
                    await db
                      .get()
                      .collection(collection.productsCollection)
                      .updateOne(
                        { _id: objectId(cartItems[i].productId) },
                        {
                          $inc: {
                            "instock.half": -Number(cartItems[i].quantity),
                          },
                        }
                      );
                  } else if (cartItems[i].weight == "1000") {
                    await db
                      .get()
                      .collection(collection.productsCollection)
                      .updateOne(
                        { _id: objectId(cartItems[i].productId) },
                        {
                          $inc: {
                            "instock.full": -Number(cartItems[i].quantity),
                          },
                        }
                      );
                  }
                }

                res(orderResponse);
              });
          });
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                order: [
                  {
                    orderId: orderId,
                    address: {
                      firstName: info.firstName,
                      lastName: info.lastName,
                      country: info.country,
                      streetAddress: info.streetAddress,
                      city: info.city,
                      state: info.state,
                      postCode: Number(info.postCode),
                      phoneNumber: Number(info.phoneNumber),
                      email: info.email,
                    },
                    paymentMethod: info.payment,
                    status: status,
                    products: cartItems,
                    totalAmount: totalAmount,
                    totalDiscount: totalDiscount,
                    subtotalAmount: subtotalAmount,
                    date: new Date(),
                    coupon: {
                      _id: info.couponId,
                      couponName: info.couponName,
                      offer: info.couponOffer,
                    },
                  },
                ],
              },
            }
          )
          .then((response) => {
            db.get()
              .collection(collection.userCollection)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    cart: [],
                  },
                }
              )
              .then(async (response) => {
                // wallet

                if (info.couponOffer != "null") {
                  let wallet = await db
                    .get()
                    .collection(collection.userCollection)
                    .findOne({
                      $and: [
                        { _id: objectId(userId) },
                        { wallet: { $exists: true } },
                      ],
                    });
                  console.log(wallet, "wallettttttttttttt");

                  let money =
                    Number(totalAmount) * (Number(info.couponOffer) / 100);
                  money = Number(money.toFixed(2));
                  if (wallet) {
                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $inc: {
                            "wallet.total": money,
                          },
                        }
                      )
                      .then((data) => {
                        //pulling from rewards

                        db.get()
                          .collection(collection.userCollection)
                          .updateOne(
                            { _id: objectId(userId) },
                            {
                              $pull: {
                                reward: { _id: objectId(info.couponId) },
                              },
                            }
                          );
                      });

                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $push: {
                            "wallet.History": {
                              message: `Earned ${money} from coupon Offer`,
                              date: new Date(),
                            },
                          },
                        }
                      );
                  } else {
                    db.get()
                      .collection(collection.userCollection)
                      .updateOne(
                        { _id: objectId(userId) },
                        {
                          $set: {
                            wallet: {
                              total: money,

                              History: [
                                {
                                  message: `Earned ${money} from coupon Offer`,
                                  date: new Date(),
                                },
                              ],
                            },
                          },
                        }
                      )
                      .then((data) => {
                        //pulling from rewards

                        db.get()
                          .collection(collection.userCollection)
                          .updateOne(
                            { _id: objectId(userId) },
                            {
                              $pull: {
                                reward: { _id: objectId(info.couponId) },
                              },
                            }
                          );
                      });
                  }
                }

                for (let i = 0; i < cartItems.length; i++) {
                  if (cartItems[i].weight == "500") {
                    await db
                      .get()
                      .collection(collection.productsCollection)
                      .updateOne(
                        { _id: objectId(cartItems[i].productId) },
                        {
                          $inc: {
                            "instock.half": -Number(cartItems[i].quantity),
                          },
                        }
                      );
                  } else if (cartItems[i].weight == "1000") {
                    await db
                      .get()
                      .collection(collection.productsCollection)
                      .updateOne(
                        { _id: objectId(cartItems[i].productId) },
                        {
                          $inc: {
                            "instock.full": -Number(cartItems[i].quantity),
                          },
                        }
                      );
                  }
                }

                res(orderResponse);
              });
          });
      }
    });
  },

  // Users Orders Listing

  getAllUserOrders: (userId) => {
    return new Promise(async (res, rej) => {
      let orders = await db
        .get()
        .collection(collection.userCollection)
        .aggregate([
          {
            $match: { _id: objectId(userId) },
          },
          {
            $unwind: "$order",
          },

          {
            $project: { order: 1 },
          },

          {
            $sort: { "order.date": -1 },
          },
        ])
        .toArray();

      console.log(orders, " orders stage 123333");
      res(orders);
    });
  },

  // users Orders Details listing

  getUserOrderDetails: (userId, orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderDetails = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$order",
            },
            {
              $match: { "order.orderId": orderId },
            },
            {
              $project: {
                _id: 0,
                order: 1,
              },
            },
          ])
          .toArray();
        console.log(orderDetails);
        resolve(orderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  },
  // users Product Order Status Changing

  userProductOrderStatusChange: (status, userId, orderId) => {
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

  userStockCheckProceed: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let checkStock = await db
          .get()
          .collection(collection.userCollection)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$cart",
            },
            {
              $project: {
                productId: "$cart.productId",
                quantity: "$cart.quantity",
                weight: "$cart.weight",
              },
            },
            {
              $lookup: {
                from: collection.productsCollection,
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      instock: 1,
                      productsName: 1,
                      massUnit: 1,
                    },
                  },
                ],
                as: "productDetails",
              },
            },
            {
              $project: {
                quantity: 1,
                weight: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
          ])
          .toArray();
        console.log(checkStock);
        resolve(checkStock);
      } catch (error) {
        console.log(error);
      }
    });
  },

  //User Profile Update

  userProfileUpdate: (info, userId) => {
    return new Promise(async (res, rej) => {
      if (info.password == undefined) {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            { $set: { name: info.name, lastName: info.lastName } }
          )
          .then((response) => {
            res(true);
          });
      } else {
        let user = await db
          .get()
          .collection(collection.userCollection)
          .findOne({ _id: objectId(userId) });

        bcrypt.compare(info.oldPassword, user.password).then(async (stat) => {
          if (stat) {
            info.password = await bcrypt.hash(info.password, 10);
            db.get()
              .collection(collection.userCollection)
              .updateOne(
                { _id: objectId(userId) },
                { $set: { password: info.password } }
              )
              .then((response) => {
                res(true);
              });
          } else {
            console.log("wrong password");
            res(false);
          }
        });
      }
    });
  },

  // User Profile Address Add

  userProfileAddAddress: (info, userId) => {
    return new Promise(async (res, rej) => {
      let userAddress = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ _id: objectId(userId) }, { address: { $exists: true } }],
        });
      console.log(userAddress, "user Addressssssssssssssssssssssssssssssssss");
      if (userAddress) {
        //       let product = userAddress.address.findIndex(address => address.tag == info.tag )

        // console.log(product,'carttttttttttttt productttttttttttttttttttttt')
        // if(product!=-1){

        // updateOne({_id:objectId(userId),'cart.productId':objectId(info.productId),'cart.weight':Number(info.weight)},
        //   {
        //       $inc : {'cart.$.quantity': Number( info.quantity)}
        //   }
        //   )

        // db.get().collection(collection.userCollection).updateOne({_id: objectId(userId)},
        // {
        //     $inc : {'cart.$[position].quantity': Number( info.quantity)}
        // },     {
        // arrayFilters: [
        // {$and : [{
        //     "position.productId": {
        //       $eq: objectId(info.productId)
        //     }
        //   },   {
        //     "position.weight": {
        //       $eq: Number(info.weight)
        //     }
        //   } ]}

        // ]
        // }
        // ).then((response) => {

        //   console.log(response,'successsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss');
        //   res('update');
        // })

        // }else{
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $push: {
                address: {
                  uniqueId: new ObjectID(),
                  tag: info.tag,
                  firstName: info.firstName,
                  lastName: info.lastName,
                  country: info.country,
                  streetAddress: info.streetAddress,
                  city: info.city,
                  state: info.state,
                  postCode: Number(info.postCode),
                  phoneNumber: Number(info.phoneNumber),
                  email: info.email,
                },
              },
            }
          )
          .then((response) => {
            res(true);
          });

        // }
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                address: [
                  {
                    uniqueId: new ObjectID(),
                    tag: info.tag,
                    firstName: info.firstName,
                    lastName: info.lastName,
                    country: info.country,
                    streetAddress: info.streetAddress,
                    city: info.city,
                    state: info.state,
                    postCode: Number(info.postCode),
                    phoneNumber: Number(info.phoneNumber),
                    email: info.email,
                  },
                ],
              },
            }
          )
          .then((response) => {
            res(true);
          });
      }
    });
  },

  userProfileEditAddress: (info, userId, addressId) => {
    return new Promise(async (res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              "address.$[position]": {
                uniqueId: objectId(addressId),
                tag: info.tag,
                firstName: info.firstName,
                lastName: info.lastName,
                country: info.country,
                streetAddress: info.streetAddress,
                city: info.city,
                state: info.state,
                postCode: Number(info.postCode),
                phoneNumber: Number(info.phoneNumber),
                email: info.email,
              },
            },
          },
          {
            arrayFilters: [
              {
                "position.uniqueId": {
                  $eq: objectId(addressId),
                },
              },
            ],
          }
        )
        .then((response) => {
          res(true);
        });
    });
  },

  userAddressDelete: (uniqueId, userId) => {
    return new Promise(async (res, rej) => {
      db.get()
        .collection(collection.userCollection)
        .updateOne(
          { _id: objectId(userId) },
          {
            $pull: { address: { uniqueId: objectId(uniqueId) } },
          }
        )
        .then((response) => {
          res(true);
        });
    });
  },

  generateRazorPay: (orderId, totalAmount) => {
    totalAmount = parseInt(totalAmount * 100);

    return new Promise(async (res, rej) => {
      instance.orders.create(
        {
          amount: totalAmount,
          currency: "INR",
          receipt: orderId,
          notes: {
            key1: "value3",
            key2: "value2",
          },
        },
        function (err, order) {
          if (err) {
            console.log(
              err,
              "hhiiiiiiiiiii razorpayyyyyyyyy errorrrrrrrrrrrrrrr"
            );
          } else {
            console.log(
              order,
              "hiiiiiiiiiiiiiiiiiiiiiii razorpayyyyyyyyyyyyyy ordrerrrrrrrrrrrrrrrrr"
            );
            res(order);
          }
        }
      );
    });
  },

  verifyRazorpayPayment: (details) => {
    return new Promise(async (resolve, reject) => {
      console.log(details["payment[razorpay_payment_id]"]);

      let hmac = await crypto.createHmac(
        "sha256",
        process.env.Razorpay_KEY_SECRET
      );
      await hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );

      hmac = hmac.digest("hex");

      console.log(hmac, "hiiiiiiiiiii", details["payment[razorpay_signature]"]);

      if (hmac === details["payment[razorpay_signature]"]) {
        console.log("payment Successs");
        resolve(true);
      } else {
        console.log("payment failureeeeeeeeeeee");
        resolve(false);
      }
    });
  },

  // generatePaypal: (orderId, totalPrice) => {
  //   parseInt(totalPrice).toFixed(2)
  //    console.log(totalPrice);
  //   return new Promise(async (resolve, reject) => {
  //       const create_payment_json = {
  //           "intent": "sale",
  //           "payer": {
  //               "payment_method": "paypal"
  //           },

  //           "transactions": [{
  //               "item_list": {
  //                   "items": [{
  //                       "name": "Red Sox Hat",
  //                       "sku": "001",
  //                       "price": totalPrice,
  //                       "currency": "USD",
  //                       "quantity": 1
  //                   }]
  //               },
  //               "amount": {
  //                   "currency": "USD",
  //                   "total": totalPrice
  //               },
  //               "description": "Hat "
  //           }]
  //       };

  //       let data = paypal.payment.create(create_payment_json, function (error, payment) {
  //           if (error) {
  //               console.log(error, 'error hiiiiiiiiiiiiiii');
  //               throw error;
  //           } else {
  //               console.log('payment hiiiiiiiiiii');
  //               resolve(payment)
  //           }
  //       })

  //   })
  // },

  randomCoupon: () => {
    return new Promise(async (resolve, reject) => {
      let rCoupons = await db
        .get()
        .collection(collection.couponsCollection)
        .find({
          startingDate: { $lt: new Date() },
          expiryDate: { $gt: new Date() },
        })
        .toArray();

      resolve(rCoupons);
    });
  },

  checkRandomOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      let rCoupons = await db
        .get()
        .collection(collection.userCollection)
        .find({
          _id: objectId(userId),
          "order.date": { $gt: new Date(new Date() - 10000) },
        })
        .toArray();

      resolve(rCoupons);
    });
  },

  // User Coupon Reward Adding into user Collection

  userCouponRewardAdd: (userId, info) => {
    info._id = new ObjectID();

    return new Promise(async (res, rej) => {
      let userReward = await db
        .get()
        .collection(collection.userCollection)
        .findOne({
          $and: [{ _id: objectId(userId) }, { reward: { $exists: true } }],
        });
      console.log(userReward, "rewarddddddddddddddddddddd");
      if (userReward) {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $push: {
                reward: info,
              },
            }
          )
          .then((response) => {
            res(true);
          });
      } else {
        db.get()
          .collection(collection.userCollection)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                reward: [info],
              },
            }
          )
          .then((response) => {
            res(true);
          });
      }
    });
  },
};
