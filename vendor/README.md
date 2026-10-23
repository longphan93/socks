# vendor

## longphan93-nestjs-migration-1.0.1.tgz — TẠM THỜI

Bản `@longphan93/nestjs-migration` đã vá, build tại chỗ, để monorepo cài và
build được ngay. Bản trên GitHub Packages chưa dùng được vì:

1. 7 file import theo đường tuyệt đối `src/...` → consumer TypeScript typecheck hỏng
2. `index.ts` không export `BaseExecutor`, nên không ai viết được executor riêng
3. Barrel gốc `require('typeorm')` lúc nạp, mà typeorm chỉ là devDependency → app
   không dùng TypeORM crash ngay dòng import
4. `package.json` thiếu `main` / `types`

Patch cho 4 điểm trên nằm ở repo `longphan93/nestjs-migration`. Khi 1.0.2 được
publish thì **xoá thư mục này** và đổi dependency trong `apps/backend/package.json`:

```diff
-"@longphan93/nestjs-migration": "file:../../vendor/longphan93-nestjs-migration-1.0.1.tgz"
+"@longphan93/nestjs-migration": "^1.0.2"
```
