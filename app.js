import express, { json } from "express";
import cors from "cors";
import { Category, Prisma, PrismaClient } from "@prisma/client";
import { assert, create } from "superstruct";
import * as dotenv from "dotenv";
import {
  CreateProduct,
  CreateUser,
  CreateOrder,
  PatchUser,
  PatchProduct,
  createSavedProduct,
} from "./structs.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

dotenv.config(); //활용하려면 config메소드를 호출해야함

const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      console.log("Error occured");
      console.log(e.name);
      if (
        e.name === "StructError" ||
        (e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2022") ||
        e instanceof Prisma.PrismaClientValidationError
      ) {
        res.status(400).send({ message: e.message });
      } else if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        res.status(400).send({ message: e.message });
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
}

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        userPreference: {
          select: {
            receiveEmail: true,
          },
        },
      },
    });
    res.send(user);
    console.log(user);
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
      include: {
        userPreference: {
          select: {
            receiveEmail: true,
          },
        },
      },
    });
    res.send(users);
  })
);

app.post(
  "/users",
  asyncHandler(async (req, res) => {
    assert(req.body, CreateUser);
    const { userPreference, ...userField } = req.body;
    const user = await prisma.user.create({
      data: {
        ...userField,
        userPreference: {
          create: userPreference,
        },
      },
      include: {
        userPreference: true,
      },
    });
    res.status(201).send(user);
  })
);

app.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    assert(req.body, CreateUser);
    const { userPreference, ...userField } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userField,
        userPreference: {
          update: userPreference,
        },
      },
      include: {
        userPreference: true,
      },
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

app.get(
  "/users/:id/saved-products",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { savedProducts } = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        savedProducts: true,
      },
    });
    res.send(savedProducts);
  })
);

app.post(
  "/users/:id/saved-products",
  asyncHandler(async (req, res) => {
    assert(req.body, createSavedProduct);
    const { id: userId } = req.params;
    const { productId } = req.body;
    const savedCount = await prisma.user.count({
      where: {
        id: userId,
        savedProducts: {
          some: { id: productId },
        },
      },
    });

    const condition =
      savedCount > 0
        ? { disconnect: { id: productId } }
        : { connect: { id: productId } };

    const { savedProducts } = await prisma.user.update({
      where: { id: userId },
      data: {
        savedProducts: condition,
      },
      include: {
        savedProducts: true,
      },
    });
    res.send(savedProducts);
  })
);

app.get(
  "/users/:id/orders",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orders } = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        orders: true,
      },
    });
    res.send(orders);
  })
);

//product

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

//orders
app.post(
  "/orders",
  asyncHandler(async (req, res) => {
    // 요청 본문(req.body)이 CreateOrder 스키마를 따르는지 확인
    assert(req.body, CreateOrder);
    const { userId, orderItems } = req.body;
    // 1. 주문에 포함된 상품들의 ID 배열 추출
    const productIds = orderItems.map((orderItem) => orderItem.productId);
    // 2. 데이터베이스에서 해당 상품 정보 조회
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }, // productIds 배열에 포함된 ID들만 조회
    });
    // 특정 productId에 해당하는 주문 수량을 반환하는 함수
    function getQuantity(productId) {
      const { quantity } = orderItems.find(
        (orderItem) => orderItem.productId === productId
      );
      return quantity;
    }
    // 3. 주문한 모든 상품이 재고를 충분히 가지고 있는지 확인
    const isSuffcientStock = products.every((product) => {
      const { id, stock } = product; // 상품 ID와 재고량
      return stock >= getQuantity(id); // 재고가 주문량 이상이어야 함
    });
    // 4. 재고가 부족하면 에러 반환
    if (!isSuffcientStock) {
      throw new Error("Insufficient stock"); // 재고 부족 예외 발생
    }

    // 재고감소
    // for (const productId of productIds) {
    //   await prisma.product.update({
    //     where: { id: productId },
    //     data: {
    //       stock: {
    //         decrement: getQuantity(productId),
    //       },
    //     },
    //   });
    // }
    const querise = productIds.map((productId) => {
      return prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: getQuantity(productId),
          },
        },
      });
    });
    await Promise.all(querise);

    // 5. 주문 생성
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          user: {
            connect: { id: userId },
          },
          orderItems: {
            create: orderItems, // 주문 항목(orderItems)을 포함하여 주문 생성
          },
        },
        include: {
          orderItems: true, // 생성된 주문에 포함된 주문 항목도 함께 반환
        },
      }),
      ...querise,
    ]);

    // 6. 생성된 주문 정보를 응답으로 반환
    res.status(201).send(order);
  })
);

app.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        orderItems: true,
      },
    });
    let total = 0;
    order.orderItems.forEach((item) => {
      // ({unitPrice, quantity})
      total += item.unitPrice * item.quantity; // unitPrice * quantity
    });
    order.total = total;
    res.send(order);
  })
);

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
