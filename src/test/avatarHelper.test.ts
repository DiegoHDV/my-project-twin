import { describe, it, expect } from "vitest";
import { AvatarHelper } from "@/lib/avatar";

describe("AvatarHelper", () => {
  describe("resolveAvatar", () => {
    it("returns the original URL when it is a storage avatar URL", () => {
      const url =
        "https://abc.supabase.co/storage/v1/object/public/avatars/user1.png";
      expect(AvatarHelper.resolveAvatar(url, "user1")).toBe(url);
    });

    it("returns a pravatar.cc URL when avatarUrl is null", () => {
      const result = AvatarHelper.resolveAvatar(null, "user1");
      expect(result).toContain("https://i.pravatar.cc/");
    });

    it("returns a pravatar.cc URL when avatarUrl is undefined", () => {
      const result = AvatarHelper.resolveAvatar(undefined, "user1");
      expect(result).toContain("https://i.pravatar.cc/");
    });

    it("returns a pravatar.cc URL when avatarUrl is an external non-storage URL", () => {
      const result = AvatarHelper.resolveAvatar(
        "https://example.com/random.png",
        "user1"
      );
      expect(result).toContain("https://i.pravatar.cc/");
    });

    it("fallback URL contains an img number between 0 and 69", () => {
      const result = AvatarHelper.resolveAvatar(null, "user1");
      const match = result.match(/img=(\d+)/);
      expect(match).not.toBeNull();
      const num = Number(match![1]);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(69);
    });
  });

  describe("getDefaultAvatar", () => {
    it("returns a string starting with https://i.pravatar.cc/", () => {
      expect(AvatarHelper.getDefaultAvatar("abc")).toMatch(/^https:\/\/i\.pravatar\.cc\//);
    });

    it("is deterministic: same profileId returns the same URL", () => {
      expect(AvatarHelper.getDefaultAvatar("same-id")).toBe(
        AvatarHelper.getDefaultAvatar("same-id")
      );
    });

    it("two clearly different profileIds return different URLs", () => {
      expect(AvatarHelper.getDefaultAvatar("aaa")).not.toBe(
        AvatarHelper.getDefaultAvatar("zzz")
      );
    });

    it("the size parameter is reflected in the URL (default 200, custom 50)", () => {
      expect(AvatarHelper.getDefaultAvatar("u")).toContain("https://i.pravatar.cc/200?");
      expect(AvatarHelper.getDefaultAvatar("u", 50)).toContain("https://i.pravatar.cc/50?");
    });
  });
});
