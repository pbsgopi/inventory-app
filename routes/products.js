const express = require("express");
const multer = require("multer");
const router = express.Router();
const productController = require("../controllers/productController");

const { upload } = require("../controllers/uploadMiddleware");

router.route("/").get(productController.getAllProducts);

router.route("/search").post(productController.searchPost);

router
  .route("/new")
  .get(productController.addProduct)
  .post(upload.single("src"), productController.addProductToDb);

//Put this route last otherwise it will mess up links
router.route("/:id").get(productController.showProduct);

router
  .route("/edit/:id")
  .get(productController.editProductGet)
  .post(upload.single("src"), productController.editProductPost);

router.route("/delete/:id").post(productController.deleteProduct);

module.exports = router;
