import { test, expect } from "../../support/fixtures";
import { getUserWithLink } from "../../support/factories/user";
import { generateULID } from "../../support/factories/utils";

test.describe("DELETE /link/:id", () => {
  const user = getUserWithLink();
  let token;

  test.beforeEach(async ({ auth }) => {
    await auth.createUser(user);
    token = await auth.getToken(user);
  });

  test("should delete a shortened link", async ({ links }) => {
    const linkId = await links.createAndReturnLinkId(user.link, token);

    const response = await links.removeLink(linkId, token);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toBe("Link excluído com sucesso");
  });

  test("should return 404 when link id does not exist", async ({ links }) => {
    // ULID
    const linkId = generateULID();

    const response = await links.removeLink(linkId, token);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe("Link não encontrado");
  });
});
