/** Admin đã xác thực, guard gắn vào request để controller dùng. */
export interface AuthenticatedAdminInterface {
  id: string;
  email: string;
}
