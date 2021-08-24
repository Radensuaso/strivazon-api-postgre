import express from "express";
import { productsReviewsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import db from "../../db/connection.js";

const reviewsRouter = express.Router();

//================Get all========================
reviewsRouter.get("/", async (req, res, next) => {
  try {
    const products = await db.query(`SELECT * FROM reviews`);
    res.send(products.rows);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//================Get single========================
reviewsRouter.get("/:review_id", async (req, res, next) => {
  try {
    const paramsID = req.params.review_id;
    const review = await db.query(
      `SELECT * FROM reviews WHERE review_id=${paramsID}`
    );
    if (review.rows.length > 0) {
      res.send(review.rows[0]);
    } else {
      res.send(
        createHttpError(
          404,
          `The review with the id: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

//===============Post Review=======================
reviewsRouter.post(
  "/product/:product_id",
  productsReviewsValidation,
  async (req, res, next) => {
    try {
      const errorList = validationResult(req);
      if (errorList.isEmpty()) {
        const paramsID = req.params.product_id;
        const product = await db.query(
          `SELECT * FROM products WHERE product_id=${paramsID}`
        );
        if (product.rows.length > 0) {
          const { comment, rate } = req.body;

          const newReview = await db.query(
            `INSERT INTO reviews(comment,rate,product_id) VALUES('${comment}','${rate}','${paramsID}') RETURNING *;`
          );

          res.status(201).send(newReview.rows[0]);
        } else {
          res.send(
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
      console.log(error);
      next(error);
    }
  }
);

//==================Update Review ===================
reviewsRouter.put(
  "/:review_id",
  productsReviewsValidation,
  async (req, res, next) => {
    try {
      const errorList = validationResult(req);
      if (errorList.isEmpty()) {
        const paramsID = req.params.review_id;
        const review = await db.query(
          `SELECT * FROM reviews WHERE review_id=${paramsID}`
        );
        if (review.rows.length > 0) {
          const { comment, rate } = req.body;
          const updatedReview = await db.query(
            `UPDATE reviews SET comment='${comment}',
                                rate='${rate}',
                                updated_at=NOW()
                                WHERE review_id=${paramsID} RETURNING *;`
          );
          res.send(updatedReview.rows[0]);
        } else {
          next(
            createHttpError(
              404,
              `The Review with the id: ${paramsID} was not found.`
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

//================delete review====================
reviewsRouter.delete("/:_id", async (req, res, next) => {
  try {
    const paramsID = req.params._id;
    const productsReviews = await readProductsReviews();
    const productReview = productsReviews.find((pR) => pR._id === paramsID);
    if (productReview) {
      const remainingProductsReviews = productsReviews.filter(
        (pR) => pR._id !== paramsID
      );

      await writeProductsReviews(remainingProductsReviews);

      res.send({
        message: `The Product Review with the id: ${productReview._id} was deleted`,
        blogPost: productReview,
      });
    } else {
      next(
        createHttpError(
          404,
          `The product review with the id: ${paramsID} was not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default reviewsRouter;
