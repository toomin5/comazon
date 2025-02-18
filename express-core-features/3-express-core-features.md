# Express 미들웨어와 파일 관리

## 학습 개요

- Express 미들웨어
- Express 라우터
- Multer를 이용한 파일 업로드
- 파일 관리 아키텍쳐 이해

## 도입

- 웹 서비스를 운영할 때 필요한 것
  - 코드가 복잡해질 수록 효율적으로 관리할 방법이 필요
  - 미들웨어: 라우트 코드 재사용
  - 라우터: 라우트 코드 쪼개기
- 파일 업로드 기능
  - 직접 구현하지 않고 서드파티 미들웨어 혹은 클라우드 서비스 활용
  - 서드파티를 잘 활용하려면 미들웨어, 라우터에 대해 이해 필요

## 수업 내용

### Express 미들웨어

- 미들웨어: 리퀘스트 도착 → 미들웨어 → 미들웨어 → … → 리스폰스 전송
- 기본 사용법
  - `next()`: 다음 미들웨어로 진행 또는 오류 전달
  - `res`를 통해 리스폰스를 전송한다면 `next()`를 호출하지 않아도 됨
  - 예시: Middleware 기본 사용법
    ```jsx
    function handler(req, res) {
      // do something
      res.send("Hello!");
    }
    ```
    ```jsx
    function middleware(req, res, next) {
      // do something
      next();
    }
    ```
    ```jsx
    function middleware(req, res, next) {
      try {
        // do something
      } catch (err) {
        next(err);
      }
      next();
    }
    ```
- `req`, `res` 객체의 라이프사이클

  - 하나의 리퀘스트에 대하여 `req`, `res` 객체가 유지되면서 여러 미들웨어를 거쳐 전달됨
  - 일반적으로 리퀘스트에 관한 정보는 `req`에 주입
  - 일반적으로 리스폰스에 관한 정보는 `res.locals`에 주입
  - 예시: `req` 객체에 원하는 값 주입

    ```jsx
    function authenticate(req, res, next) {
      req.user = "Codeit";
      next();
    }

    app.get("/me", authenticate, (req, res) => {
      console.log(req.user);
      res.json({ user: req.user });
    });
    ```

- 기본 에러 핸들러

  - 일반적으로 코드상 마지막에 배치해서 모든 에러를 처리
  - 주의
    - `next()` 를 통해 전달된 에러가 아닌 경우, 기본 에러 핸들러에서 처리할 수 없다.
    - 반드시 try/catch로 예외처리를 통해 `next()` 로 넘겨주어야 한다.
  - 예시: Default error handler

    ```jsx
    function errorHandler(err, req, res, next) {
      if (err) {
        // 어떤 오류인지?
        return res.send('오류 발생!');
      }
      res.send('알 수 없는 오류');
    }

    // 전역 미들웨어 등록
    app.use(cors());
    app.use(...);
    app.use(...);

    // 엔드포인트 구현
    app.get('/tasks', ...);
    app.post('/tasks', ...);

    // 기본 에러 핸들러 등록
    app.use(errorHandler);
    ```

- 내장 미들웨어
  - `express.json()` : JSON 형식의 바디 처리
  - `express.static()` : 정적 파일 서빙
    - 예시: 정적 파일 서빙
      ```
      public/
        └─ codeit.png
        └─ index.html
      ```
      ```jsx
      app.use(express.static("public"));
      ```
      GET 리퀘스트로 `/codeit.png` 를 요청하면 해당 파일을 리스폰스로 보내줌
- 서드파티 미들웨어 소개
  - [cors](https://www.npmjs.com/package/cors) : CORS 처리
  - [cookie-parser](https://www.npmjs.com/package/cookie-parser) : 쿠키 값 파싱
  - [morgan](https://www.npmjs.com/package/morgan) : 디버깅을 위한 로깅
  - [multer](https://www.npmjs.com/package/multer) : 파일 업로드

### Express 라우터

- 엔드포인트가 늘어날 수록 코드가 복잡해짐
- 예시: 라우터로 분리하기

  ```jsx
  app.get("/products", (req, res) => {
    res.json({ message: "Product 목록 보기" });
  });

  app.post("/products", (req, res) => {
    res.json({ message: "Product 추가하기" });
  });

  app.patch("/products/:id", (req, res) => {
    res.json({ message: "Product 수정하기" });
  });

  app.delete("/products/:id", (req, res) => {
    res.json({ message: "Product 삭제하기" });
  });
  ```

  ```jsx
  app
    .route("/products")
    .get((req, res) => {
      res.json({ message: "Product 목록 보기" });
    })
    .post((req, res) => {
      res.json({ message: "Product 추가하기" });
    });

  app
    .route("/products/:id")
    .patch((req, res) => {
      res.json({ message: "Product 수정하기" });
    })
    .delete((req, res) => {
      res.json({ message: "Product 삭제하기" });
    });
  ```

  ```jsx
  // productRouter.js
  const productRouter = express.Router();

  productRouter
    .route("/")
    .get((req, res) => {
      res.json({ message: "Product 목록 보기" });
    })
    .post((req, res) => {
      res.json({ message: "Product 추가하기" });
    });

  productRouter
    .route("/:id")
    .patch((req, res) => {
      res.json({ message: "Product 수정하기" });
    })
    .delete((req, res) => {
      res.json({ message: "Product 삭제하기" });
    });

  export default productRouter;

  // app.js

  import productRouter from "./productRouter";

  app.use("/products", productRouter);
  ```

- 라우터는 앱과 구조가 똑같음. 라우터 레벨에서 미들웨어, 에러 핸들러를 사용 가능

### Multer를 이용한 파일 업로드

- HTML에서 데이터를 전송하는 방법: HTML Form
  - 예시: HTML Form으로 데이터를 전송하는 기본적인 방법
    `/submit` 이라는 주소로 `POST` 리퀘스트를 보냄
    ```jsx
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <title>Form Example</title>
    </head>
    <body>
      <form action="/submit" method="post">
        <label for="name">이름</label>
        <input type="text" id="name" name="name">
        <br>
        <label for="age">나이</label>
        <input type="number" id="age" name="age">
        <br>
        <button type="submit">확인</button>
      </form>
    </body>
    </html>
    ```
- HTML Form의 데이터 전송 타입
  - `application/x-www-form-urlencoded` : 문자열로만 이루어진 기본 데이터 전송 타입
  - `multipart/form-data` : 문자열 뿐만 아니라 다양한 형식을 함께 보내는 전송 타입
    - 예: 파일 인풋에서 이미지를 함께 보내는 경우
- Multer 소개
  - `multipart/form-data` 형식으로 데이터를 받아서 처리해 주는 ‘미들웨어’ 라이브러리
- 예시: multer로 `attachment` 라는 필드의 파일 업로드 받기

  - `./uploads/` 폴더에 업로드된 파일 저장
  - `./files` 라는 경로에서 `./uploads/` 에 있는 정적 파일을 서빙
  - 주의! `upload.signle('attachment')` 코드는 미들웨어 **‘함수를 리턴’**

  ```jsx
  import multer from "multer";

  const upload = multer({ dest: "uploads/" });

  app.post("/files", upload.single("attachment"), (req, res) => {
    const filename = req.file.filename;
    const path = `/files/${filename}`;
    res.json({ path });
  });

  app.use("/files", express.static("uploads"));
  ```

### 파일 관리 아키텍처의 이해

- 백엔드 서버에 파일 저장만 하는 경우 문제점: 파일 데이터가 계속 쌓인다.
- 백엔드 서버에 파일 저장 + 데이터베이스에 메타데이터 기록하기
- 클라우드 저장소에 파일 저장(AWS S3, GCS 등) + 데이터베이스에 메타데이터 기록
  - (이후에 AWS를 배울 예정이니 참고로만 알아 두기)
  - 클라이언트가 백엔드 서버에 파일을 업로드 → 백엔드 서버가 클라우드 저장소에 업로드
  - **Presigned URL 방식**: 백엔드 서버가 업로드할 수 있는 URL 발급 → 클라이언트에서 클라우드 저장소로 곧바로 업로드

## 결론/요약

- 미들웨어: 도착한 하나의 리퀘스트에 대해 여러 미들웨어를 거치고 나서 리스폰스를 보낸다.
- 미들웨어 사용법
  `next()` 다음 미들웨어로 진행 또는 `next(err)`로 에러 전달
  ```jsx
  function middleware(req, res, next) {
    try {
      // do something
    } catch (err) {
      next(err);
    }
    next();
  }
  ```
- 기본 에러 핸들러: `next()` 를 통해 전달된 에러들 처리
  ```jsx
  function errorHandler(err, req, res, next) {
    if (err) {
      // 어떤 오류인지?
      return res.send("오류 발생!");
    }
    res.send("알 수 없는 오류");
  }
  ```
- 알아두면 좋은 내장 미들웨어와 서드파티 미들웨어들
  - `express.json()` : JSON 형식의 바디 처리
  - `express.static()` : 정적 파일 서빙
  - [cors](https://www.npmjs.com/package/cors) : CORS 처리
  - [cookie-parser](https://www.npmjs.com/package/cookie-parser) : 쿠키 값 파싱
  - [morgan](https://www.npmjs.com/package/morgan) : 디버깅을 위한 로깅
  - [multer](https://www.npmjs.com/package/multer) : 파일 업로드
- 라우터: 라우트를 분리해서 관리할 수 있는 객체
  `express.Router()`로 라우터 생성
  `app.use()` 로 라우터를 등록해서 사용

  ```jsx
  // productRouter.js
  const productRouter = express.Router();

  productRouter
    .route("/")
    .get((req, res) => {
      res.json({ message: "Product 목록 보기" });
    })
    .post((req, res) => {
      res.json({ message: "Product 추가하기" });
    });

  productRouter
    .route("/:id")
    .patch((req, res) => {
      res.json({ message: "Product 수정하기" });
    })
    .delete((req, res) => {
      res.json({ message: "Product 삭제하기" });
    });

  export default productRouter;

  // app.js

  import productRouter from "./productRouter";

  app.use("/products", productRouter);
  ```

- `application/x-www-form-urlencoded` : 문자열로만 이루어진 기본 데이터 전송 타입
- `multipart/form-data` : 문자열 뿐만 아니라 다양한 형식을 함께 보내는 전송 타입
- Multer: `multipart/form-data` 전송 타입을 처리해 주는 서드파티 미들웨어

  ```jsx
  import multer from "multer";

  const upload = multer({ dest: "uploads/" });

  app.post("/files", upload.single("attachment"), (req, res) => {
    const filename = req.file.filename;
    const path = `/files/${filename}`;
    res.json({ path });
  });

  app.use("/files", express.static("uploads"));
  ```

- 백엔드에서 파일 관리하는 방식
  - 백엔드 서버에 업로드 + 백엔드 서버에 저장 + 데이터베이스에 메타데이터 기록
  - 백엔드 서버에 업로드 + 클라우드에 저장(AWS S3, GCS 등) + 데이터베이스에 메타데이터 기록
  - 백엔드 서버가 presigned URL 발급 + 클라이언트가 클라우드에 업로드(AWS S3, GCS 등)
