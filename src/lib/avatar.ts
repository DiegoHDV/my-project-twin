/**
 * AvatarHelper — utilidades para resolver avatares de perfil.
 * Implementado como clase para cumplir el requisito de arquitectura OO.
 */
export class AvatarHelper {
  /**
   * Returns a deterministic real-person avatar URL based on a profile id.
   * Uses pravatar.cc which serves real portrait photos.
   */
  static getDefaultAvatar(profileId: string, size = 200): string {
    let hash = 0;
    for (let i = 0; i < profileId.length; i++) {
      hash = (hash * 31 + profileId.charCodeAt(i)) | 0;
    }
    const num = Math.abs(hash) % 70; // pravatar has ~70 images
    return `https://i.pravatar.cc/${size}?img=${num}`;
  }

  /**
   * Returns the avatar_url only if it was uploaded by the user (stored in our
   * storage bucket), otherwise falls back to a real-person photo.
   */
  static resolveAvatar(
    avatarUrl: string | null | undefined,
    profileId: string,
    size = 200
  ): string {
    if (avatarUrl && avatarUrl.includes("/storage/v1/object/public/avatars/")) {
      return avatarUrl;
    }
    return AvatarHelper.getDefaultAvatar(profileId, size);
  }
}
