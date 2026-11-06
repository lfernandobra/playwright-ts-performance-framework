import { test, expect } from "../../support/fixtures";
import { getUser } from "../../support/factories/user";

test.describe("POST /auth/login", () => {
  test("should authenticate successfully with valid credentials", async ({ auth }) => {
    const user = getUser();

    const respCreate = await auth.createUser(user);
    expect(respCreate.status()).toBe(201);

    const response = await auth.login(user);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty("message", "Login realizado com sucesso");
    expect(body.data).toHaveProperty("token");
    expect(body.data.user).toHaveProperty("id");
    expect(body.data.user).toHaveProperty("name", user.name);
    expect(body.data.user).toHaveProperty("email", user.email);
    expect(body.data.user).not.toHaveProperty("password");
  });

  test("should reject login with incorrect password", async ({ auth }) => {
    const user = getUser();

    const respCreate = await auth.createUser(user);
    expect(respCreate.status()).toBe(201);

    const response = await auth.login({ ...user, password: "123456" });

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message", "Credenciais inválidas");
  });

  test("should reject login for non-existent email", async ({ auth }) => {
    const user = {
      email: "404@abc.com",
      password: "pwd123",
    };

    const response = await auth.login(user);

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message", "Credenciais inválidas");
  });

  test("should require email on login", async ({ auth }) => {
    const user = {
      email: "",
      password: "pwd123",
    };

    const response = await auth.login(user);

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message", "O campo 'Email' é obrigatório");
  });

  test("should require password on login", async ({ auth }) => {
    const user = {
      email: "404@abc.com",
      password: "",
    };

    const response = await auth.login(user);

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message", "O campo 'Password' é obrigatório");
  });
});
