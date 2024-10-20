// TESTS FOR GENERAL USER CREATION / JWT
// USE npm install --save-dev jest supertest
// npx jest (after setting up server)

const request = require("supertest");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

describe("JWT and permissions API tests", () => {
  const regularUsername =
    "regular_user_" + Math.random().toString(36).substring(2, 15);
  const adminUsername =
    "regular_user_" + Math.random().toString(36).substring(2, 15);
  const testUsername =
    "test_user_" + Math.random().toString(36).substring(2, 15);
  
  const email = "user@example.com"
  let adminAccessToken;
  let userAccessToken;
  let userRefreshToken;

  beforeAll(async () => {
    // Create an admin user and a regular user for testing
    await request(BASE_URL).post("/api/accounts/register").send({
      username: adminUsername,
      password: "adminPass",
      role: "ADMIN",
      email: email,
    });

    await request(BASE_URL).post("/api/accounts/register").send({
      username: regularUsername,
      password: "userPass",
      role: "USER",
      email: email,
    });

    // Log in as admin and user to obtain tokens
    const adminLoginResponse = await request(BASE_URL)
      .post("/api/accounts/login")
      .send({
        username: adminUsername,
        password: "adminPass",
        email: email,
      });
    adminAccessToken = adminLoginResponse.body.accessToken;

    const userLoginResponse = await request(BASE_URL)
      .post("/api/accounts/login")
      .send({
        username: regularUsername,
        password: "userPass",
        email: email,
      });
    userAccessToken = userLoginResponse.body.accessToken;
    userRefreshToken = userLoginResponse.body.refreshToken;
  });

  describe("1: User registration", () => {
    it("should create a new user", async () => {
      const response = await request(BASE_URL)
        .post("/api/accounts/register")
        .send({
          username: testUsername,
          password: "testPass",
          role: "USER",
          email: email,
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.username).toBe(testUsername);
    });

    it("should fail to create a user with an existing username", async () => {
      const response = await request(BASE_URL)
        .post("/api/accounts/register")
        .send({
          username: testUsername,
          password: "anotherPass",
          email: email,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("2: User login and JWT generation", () => {
    it("should log in and return a JWT", async () => {
      const response = await request(BASE_URL).post("/api/accounts/login").send({
        username: testUsername,
        password: "testPass",
        email: email,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
    });

    it("should fail to log in with incorrect credentials", async () => {
      const response = await request(BASE_URL).post("/api/accounts/login").send({
        username: testUsername,
        password: "wrongPass",
        email: email,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("3: Protecting routes with JWT middleware", () => {
    it("should allow access to protected route with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/api/protected")
        .set("Authorization", `Bearer ${userAccessToken}`);

      expect(response.status).toBe(200);
    });

    it("should deny access to protected route with no token", async () => {
      const response = await request(BASE_URL).get("/api/protected");

      expect(response.status).toBe(401);
    });

    it("should deny access to protected route with invalid token", async () => {
      const response = await request(BASE_URL)
        .get("/api/protected")
        .set("Authorization", `Bearer invalidToken`);

      expect(response.status).toBe(401);
    });
  });

  describe("4: Role-based permissions", () => {
    it("should allow access to admin route with ADMIN role", async () => {
      const response = await request(BASE_URL)
        .get("/api/admin/protected")
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(200);
    });

    it("should deny access to admin route with USER role", async () => {
      const response = await request(BASE_URL)
        .get("/api/admin/protected")
        .set("Authorization", `Bearer ${userAccessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("5: Refreshing JWTs", () => {
    it("should refresh the token", async () => {
      const refreshResponse = await request(BASE_URL)
        .post("/api/accounts/refresh")
        .send({
          refreshToken: userRefreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty("accessToken");
    });

    it("should deny refresh with expired or invalid token", async () => {
      const refreshResponse = await request(BASE_URL)
        .post("/api/accounts/refresh")
        .send({
          refreshToken: "expiredOrInvalidToken",
        });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body).toHaveProperty("error");
    });
  });
});
