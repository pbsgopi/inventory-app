const express = require("express");
const app = express();
const path = require("node:path");
const assetsPath = path.join(__dirname, "public");
require("dotenv").config();

const indexRouter = require("./routes/index");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");

app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));
app.use("/", indexRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
