import express, { json } from "express";
import { Category, Prisma, PrismaClient } from "@prisma/client";
import { assert } from "superstruct";
import * as dotenv from "dotenv";
import {
  CreateProduct,
  CreateUser,
  PatchUser,
  PatchProduct,
} from "./structs.js";

dotenv.config(); //활용하려면 config메소드를 호출해야함

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      console.log("Error occured");
      console.log(e.name);
      if (e.name === "StructError") {
        res.status(400).send({ message: e.message });
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
}

// app.get("/users", asyncHandler( async (req, res) => {
//   //생성한 user테이블
//   const users = await prisma.user.findMany();
//   res.send(users);
// });

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    res.send(user);
  })
);

// //구조 분해 할당
// app.get("/users/:id", asyncHandler( async (req, res) => {
//   const { id } = req.params;
//   const user = await prisma.user.findUnique({
//     where: { id },
//   });
//   res.send(user);
// });

app.get(
  "/users",
  asyncHandler(async (req, res) => {
    //req로 받은 정보를 가지고 users모델을 이용하여 새로운 모델을 추가
    const { offset = 0, limit = 10, order = "newest" } = req.query;
    let orderBy;
    switch (order) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
      default:
        orderBy = { createdAt: "desc" };
    }
    const users = await prisma.user.findMany({
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
    });
    res.send(users);
  })
);

app.post(
  "/users",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateUser);
    const newUser = await prisma.newUser.create({ data: req.body });
    res.send(newUser);
  })
);

app.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    assert(req.body, CreateUser);
    const user = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.send(user);
  })
);

app.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.send("Success delete");
  })
);

// app.patch("/users/:id", async(req, res) => {
//   const {id} = req.params;
//   const user = await prisma.user.update({
//     where:{id}
//   })
// });

//product

// app.get("/products", asyncHandler( async (req, res) => {
//   const products = await prisma.product.findMany();
//   res.send(products);
// }));

app.get(
  "/products",
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 10, category, order } = req.query;
    let orderBy;

    switch (order) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "priceLowest":
        orderBy = { price: "asc" };
        break;
      case "priceHighest":
        orderBy = { price: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
      default:
        orderBy = { createdAt: "desc" };
    }
    const where = category ? { category } : {};
    // { category:category } 쇼트핸드
    const product = await prisma.product.findMany({
      where,
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
    });
    res.send(product);
  })
);

app.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    res.send(product);
  })
);

app.post(
  "/products",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateProduct);
    const newProduct = await prisma.product.create({ data: req.body });
    res.send(newProduct);
  })
);

app.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    assert(req.body, PatchProduct);
    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });
    res.send(product);
  })
);

app.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.send("Success delete");
  })
);

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
