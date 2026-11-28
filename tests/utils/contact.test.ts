import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, DONATION_URL } from "../../src/utils/constants";
import { getFeedbackUrl } from "../../src/utils/contact";

describe("contact and support", () => {
  it("writes to the publisher with the version in the subject, and nothing else", () => {
    const url = new URL(getFeedbackUrl("1.2.3"));

    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(CONTACT_EMAIL);
    expect([...url.searchParams.keys()]).toEqual(["subject"]);
    expect(url.searchParams.get("subject")).toBe("Offliner v1.2.3 : mon retour");
    expect(url.search).not.toContain("+");
  });

  it("sends donations to the publisher's PayPal page over HTTPS", () => {
    expect(DONATION_URL).toBe("https://paypal.me/sylvainalx");
  });
});
