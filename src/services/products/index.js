import express from "express";
import { productsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import db from "../../db/connection.js";
import { savePictureCloudinary } from "../../lib/cloudinaryTools.js";
import multer from "multer";

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
    if (product.rows.length > 0) {
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
productsRouter.get("/:product_id/reviews", async (req, res, next) => {
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
      const { name, description, brand, price, category } = req.body;

      const newProduct = await db.query(
        `INSERT INTO products(name,description,brand,image_url,price,category) VALUES('${name}','${description}','${brand}','https://picsum.photos/350/500','${price}','${category}') RETURNING *;`
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
productsRouter.post(
  "/:product_id/upload",
  multer({ storage: savePictureCloudinary }).single("picture"),
  async (req, res, next) => {
    try {
      const paramsID = req.params.product_id;
      const product = await db.query(
        `SELECT * FROM products WHERE product_id=${paramsID}`
      );
      if (product.rows.length > 0) {
        const imageUrl = req.file.path;
        const updatedProduct = await db.query(
          `UPDATE products SET image_url='${imageUrl}' WHERE product_id=${paramsID} RETURNING *;`
        );

        res.send(updatedProduct.rows[0]);
      } else {
        next(
          createHttpError(
            404,
            `The Product with the id: ${paramsID} was not found.`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

//=============== update product =====================
productsRouter.put(
  "/:product_id",
  productsValidation,
  async (req, res, next) => {
    try {
      const errorList = validationResult(req);
      if (errorList.isEmpty()) {
        const paramsID = req.params.product_id;
        const product = await db.query(
          `SELECT * FROM products WHERE product_id=${paramsID}`
        );
        if (product.rows.length > 0) {
          const { name, description, brand, price, category } = req.body;
          const updatedProduct = await db.query(
            `UPDATE products SET name='${name}',
                                description='${description}',
                                brand='${brand}',
                                price='${price}',
                                category='${category}',
                                updated_at=NOW()
                                WHERE product_id=${paramsID} RETURNING *;`
          );
          res.send(updatedProduct.rows[0]);
        } else {
          next(
            createHttpError(
              404,
              `The Product with the id: ${paramsID} was not found.`
            )
          );
        }
      } else {
        next(createHttpError(400, { errorList }));
      }
    } catch (error) {
      next(error);
    }
  }
);

//=============== Delete product =====================
productsRouter.delete("/:product_id", async (req, res, next) => {
  try {
    const paramsID = req.params.product_id;
    const product = await db.query(
      `SELECT * FROM products WHERE product_id=${paramsID}`
    );
    if (product.rows.length > 0) {
      const deletedProduct = await db.query(
        `DELETE FROM products WHERE product_id=${paramsID};`
      );
      console.log(deletedProduct);
      res.send(`The product with the id ${paramsID} was deleted.`);
    } else {
      next(
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

export default productsRouter;
