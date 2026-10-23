import { Module } from '@nestjs/common';
import { AdminCategoryController } from './http/controllers/admin-category.controller.js';
import { AdminProductController } from './http/controllers/admin-product.controller.js';
import { CategoryController } from './http/controllers/category.controller.js';
import { ProductController } from './http/controllers/product.controller.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { ProductVariantRepository } from './repositories/product-variant.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { AdminCategoryService } from './services/admin-category.service.js';
import { AdminProductService } from './services/admin-product.service.js';
import { CategoryService } from './services/category.service.js';
import { ProductService } from './services/product.service.js';

@Module({
  controllers: [
    CategoryController,
    ProductController,
    AdminCategoryController,
    AdminProductController,
  ],
  providers: [
    CategoryRepository,
    ProductRepository,
    ProductVariantRepository,
    CategoryService,
    ProductService,
    AdminCategoryService,
    AdminProductService,
  ],
  exports: [CategoryService, ProductService],
})
export class CatalogModule {}
