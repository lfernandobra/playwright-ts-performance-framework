import { test, expect } from "../../support/fixtures";
import { getUserWithLink } from "../../support/factories/user";

test.describe("POST /api/links", () => {
  const user = getUserWithLink();
  let token;

  test.beforeEach(async ({ auth }) => {
    await auth.createUser(user);
    token = await auth.getToken(user);
  });

  test("should create a shortened link successfully", async ({ links }) => {
    const response = await links.createLink(user.link, token);

    expect(response.status()).toBe(201);
    const { data, message } = await response.json();

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("original_url", user.link.original_url);
    expect(data).toHaveProperty("title", user.link.title);
    expect(data.short_code).toMatch(/^([a-zA-Z0-9_-]){5}$/);
    expect(message).toBe("Link criado com sucesso");
  });

  test("should require original url when creating a link", async ({
    links,
  }) => {
    const response = await links.createLink(
      { ...user.link, original_url: "" },
      token,
    );

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'OriginalURL' é obrigatório`);
  });

  test("should require title when creating a link", async ({ links }) => {
    const response = await links.createLink({ ...user.link, title: "" }, token);

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'Title' é obrigatório`);
  });

  test("should reject invalid original url format", async ({
    links,
  }) => {
    const response = await links.createLink(
      { ...user.link, original_url: "invalid-url@test.com" },
      token,
    );

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'OriginalURL' deve ser uma URL válida`);
  });
});
