import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "안녕, 코드잇 (;" });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
