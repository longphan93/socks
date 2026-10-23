/** Nội dung bên trong access token của admin. */
export interface JwtPayloadInterface {
  /** id của admin_users. */
  sub: string;
  email: string;
}
