import express, { json } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config(); //활용하려면 config메소드를 호출해야함

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.get("/users", async (req, res) => {
  //생성한 user테이블
  const users = await prisma.user.findMany();
  res.send(users);
});

app.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });
  res.send(user);
});

// //구조 분해 할당
// app.get("/users/:id", async (req, res) => {
//   const { id } = req.params;
//   const user = await prisma.user.findUnique({
//     where: { id },
//   });
//   res.send(user);
// });

app.post("/users", async (req, res) => {
  //req로 받은 정보를 가지고 users모델을 이용하여 새로운 모델을 추가
  console.log(req.body);
  const user = await prisma.user.create({ data: req.body });
  res.status(201).send(user);
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: req.body,
  });
  res.send(user);
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({
    where: { id },
  });
  res.send("Success delete");
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

// app.patch("/users/:id", async(req, res) => {
//   const {id} = req.params;
//   const user = await prisma.user.update({
//     where:{id}
//   })
// });
