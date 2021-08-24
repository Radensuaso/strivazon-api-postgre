import express from "express";
import { productsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import db from "../../db/connection.js";
/* import multer from "multer"; */

const productsRouter = express.Router();

//=============== Get all =====================
productsRouter.get("/", async (req, res, next) => {
  try {
    if (req.query && req.query.category) {
      const { category } = req.query;
      const filteredProducts = await db.query(
        `SELECT * FROM products WHERE category LIKE '%${category}%'`
      );
      res.send(filteredProducts.rows);
    } else {
      const products = await db.query(`SELECT * FROM products`);
      res.send(products.rows);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//=============== Get single =====================
productsRouter.get("/:product_id", async (req, res, next) => {
  try {
    const paramsID = req.params.product_id;
    const product = await db.query(
      `SELECT * FROM products WHERE product_id=${paramsID}`
    );
    if (product) {
      res.send(product.rows);
    } else {
      res.send(
        createHttpError(
          404,
          `The Product with the id: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

//=============== Get  specific product review =====================
productsRouter.get("/:_id/reviews", async (req, res, next) => {
  try {
    const paramsID = req.params._id;
    const products = await readProducts();
    const product = products.find((p) => p._id === paramsID);
    if (product) {
      const productsReviews = await readProductsReviews();

      console.log(productsReviews);

      const particularProductReviews = productsReviews.filter(
        (p) => p.productId === paramsID
      );
      res.send(particularProductReviews);
    } else {
      res.send(
        createHttpError(
          404,
          `The Product with the id: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

//=============== post products =====================
productsRouter.post("/", productsValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);
    if (errorList.isEmpty()) {
      const { name, description, brand, image_url, price, category } = req.body;

      const newProduct = await db.query(
        `INSERT INTO products(name,description,brand,image_url,price,category) VALUES('${name}','${description}','${brand}','${image_url}','${price}','${category}') RETURNING *;`
      );

      res.status(201).send(newProduct.rows[0]);
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//=============== Upload picture =====================
/* productsRouter.post(
  "/:_id/upload",
  multer().single("picture"),
  async (req, res, next) => {
    try {
      const paramsId = req.params._id;
      const products = await readProducts();
      const product = products.find((p) => p._id === paramsId);
      if (product) {
        await saveProductPicture(`${product._id}.jpg`, req.file.buffer);
        const pictureUrl = `http://${req.get("host")}/img/productsPictures/${
          product._id
        }.jpg`;
        const remainingProducts = products.filter((p) => p._id !== paramsId);
        const updatedProduct = { ...product, imageUrl: pictureUrl };

        remainingProducts.push(updatedProduct);
        await writeProducts(remainingProducts);
        res.send("Picture uploaded!");
      } else {
        next(
          createHttpError(
            404,
            `The Product with the id: ${paramsId} was not found.`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);
 */
//=============== update product =====================
productsRouter.put("/:_id", productsValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);
    if (errorList.isEmpty()) {
      const paramsID = req.params._id;
      const products = await readProducts();
      const productToUpdate = products.find((p) => p._id === paramsID);

      const updatedProduct = {
        ...productToUpdate,
        updatedAt: new Date(),
        ...req.body,
      };

      const remainingProducts = products.filter((p) => p._id !== paramsID);

      remainingProducts.push(updatedProduct);
      await writeProducts(remainingProducts);

      res.send(updatedProduct);
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    next(error);
  }
});

//=============== Delete product =====================
productsRouter.delete("/:_id", async (req, res, next) => {
  try {
    const paramsID = req.params._id;
    const products = await readProducts();
    const product = products.find((p) => p._id === paramsID);
    if (product) {
      const remainingProducts = products.filter((p) => p._id !== paramsID);

      await writeProducts(remainingProducts);
      await removeProductPicture(`${product._id}.jpg`);

      res.send({
        message: `The Product with the id: ${product._id} was deleted`,
        blogPost: product,
      });
    } else {
      next(
        createHttpError(
          404,
          `The product with the id: ${paramsID} was not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default productsRouter;
