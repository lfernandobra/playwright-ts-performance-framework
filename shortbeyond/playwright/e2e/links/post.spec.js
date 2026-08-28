import { test, expect } from "@playwright/test";
import { authService } from "../../support/services/auth";
import { linksService } from "../../support/services/links";
import { getUserWithLink } from "../../support/factories/user";

test.describe("POST /api/links", () => {
  const user = getUserWithLink();
  let auth, link, token;

  test.beforeEach(async ({ request }) => {
    auth = authService(request);
    link = linksService(request);
    await auth.createUser(user);

    token = await auth.getToken(user);
  });
  test("deve encurtar um novo link", async ({ request }) => {
    const response = await link.createLink(user.link, token);

    expect(response.status()).toBe(201);
    const { data, message } = await response.json();

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("original_url", user.link.original_url);
    expect(data).toHaveProperty("title", user.link.title);
    expect(data.short_code).toMatch(/^([a-zA-Z0-9_-]){5}$/);
    expect(message).toBe("Link criado com sucesso");
  });

  test("não deve encurtar quando a url original não é informada", async ({
    request,
  }) => {
    const response = await link.createLink(
      { ...user.link, original_url: "" },
      token,
    );

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'OriginalURL' é obrigatório`);
  });

  test("não deve encurtar quando titulo não é informado", async ({
    request,
  }) => {
    const response = await link.createLink({ ...user.link, title: "" }, token);

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'Title' é obrigatório`);
  });

  test("não deve encurtar quando a url original não é invalida", async ({
    request,
  }) => {
    const response = await link.createLink(
      { ...user.link, original_url: "papito@test.com" },
      token,
    );

    expect(response.status()).toBe(400);
    const { message } = await response.json();
    expect(message).toBe(`O campo 'OriginalURL' deve ser uma URL válida`);
  });
});
