/** Một object trên kho lưu trữ, dùng khi quét ảnh mồ côi. */
export interface StorageObjectInterface {
  key: string;
  lastModified?: Date;
}
