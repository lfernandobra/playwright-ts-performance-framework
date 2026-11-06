import { test, expect } from "../../support/fixtures";
import { getUser } from "../../support/factories/user";

test.describe("POST /auth/register", () => {
  test("should register a new user successfully", async ({ auth }) => {
    // Preparação
    const user = getUser();

    // Ação
    const response = await auth.createUser(user);
    // Resultado Esperado
    expect(response.status()).toBe(201);

    const responseBody = await response.json();

    // expect(responseBody.message).toBe("");
    expect(responseBody).toHaveProperty(
      "message",
      "Usuário cadastrado com sucesso!",
    );
    expect(responseBody.user).toHaveProperty("id");
    expect(responseBody.user).toHaveProperty("name", user.name);
    expect(responseBody.user).toHaveProperty("email", user.email);
    expect(responseBody.user).not.toHaveProperty("password");
  });

  test("should reject registration when email is already in use", async ({
    auth,
  }) => {
    const user = getUser();

    const preCondition = await auth.createUser(user);

    expect(preCondition.status()).toBe(201);

    const response = await auth.createUser(user);

    expect(response.status()).toBe(400);

    const responseBody = await response.json();

    // expect(responseBody.message).toBe("");
    expect(responseBody).toHaveProperty(
      "message",
      "Este e-mail já está em uso. Por favor, tente outro.",
    );
  });

  test("should reject registration with invalid email format", async ({ auth }) => {
    const user = {
      name: `Luis Brandao`,
      email: `invalid-email@dev`,
      password: "pwd123",
    };

    const response = await auth.createUser(user);

    expect(response.status()).toBe(400);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty(
      "message",
      "O campo 'Email' deve ser um email válido",
      //   'O campo \'Email\' deve ser um email válido",
    );
  });

  test("should require name on registration", async ({ auth }) => {
    const user = {
      email: `invalid-email@dev`,
      password: "pwd123",
    };

    const response = await auth.createUser(user);

    expect(response.status()).toBe(400);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty(
      "message",
      //"O campo 'Email' deve ser um email válido",
      "O campo 'Name' é obrigatório",
    );
  });

  test("should require email on registration", async ({
    auth,
  }) => {
    const user = {
      name: `Luis Brandao`,
      password: "pwd123",
    };

    const response = await auth.createUser(user);

    expect(response.status()).toBe(400);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty(
      "message",
      //"O campo 'Email' deve ser um email válido",
      "O campo 'Email' é obrigatório",
    );
  });

  test("should require password on registration", async ({
    auth,
  }) => {
    const user = {
      name: `Luis Brandao`,
      email: `luis.brandao@qa-enterprise.dev`,
    };

    const response = await auth.createUser(user);

    expect(response.status()).toBe(400);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty(
      "message",
      //"O campo 'Email' deve ser um email válido",
      "O campo 'Password' é obrigatório",
    );
  });
});
