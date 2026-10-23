import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { EmailLogTypeEnum, LocaleEnum, OrderStatusEnum } from '../../../common/enums/index.js';
import { resolveTranslated } from '../../../common/helpers/resolve-translated.helper.js';
import { ShippingMethodService } from '../../shipping/services/shipping-method.service.js';
import { ORDER_CODE_MAX_ATTEMPTS } from '../constants/index.js';
import { generateOrderCode } from '../helpers/order-code.helper.js';
import { CartVariantRepository } from '../repositories/cart-variant.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { OrderItemDraftInterface, PersistOrderParamsInterface } from '../interfaces/index.js';
import { CreateOrderDto, ValidateCartDto } from '../http/dto/index.js';
import {
  CartValidationResponse,
  OrderCreatedResponse,
  OrderLineResponse,
} from '../http/responses/index.js';

type CartRow = Awaited<ReturnType<CartVariantRepository['findForCart']>>[number];

/** Chuỗi D1 trả về khi ràng buộc CHECK (stock >= 0) chặn một câu lệnh. */
const CHECK_CONSTRAINT = 'CHECK constraint failed';

const UNIQUE_CONSTRAINT = 'UNIQUE constraint failed';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orders: OrderRepository,
    private readonly variants: CartVariantRepository,
    private readonly shipping: ShippingMethodService,
  ) {}

  async create(dto: CreateOrderDto, locale: LocaleEnum): Promise<OrderCreatedResponse> {
    const rows = await this.loadCart(dto.items.map((item) => item.variantId));
    const method = await this.shipping.requireActive(dto.shippingMethodId);

    // Ghé nhận thì không hỏi địa chỉ; giao tận nơi thì bắt buộc có.
    if (!method.isPickup && !(dto.province && dto.ward && dto.street)) {
      throw new BadRequestException('order.address_required');
    }

    const items = dto.items.map((line) => {
      const row = rows.get(line.variantId)!;
      // Giá LUÔN lấy từ kho dữ liệu, không bao giờ tin số client gửi lên.
      const unitPrice = row.price;

      return {
        id: randomUUID(),
        orderId: '',
        variantId: row.id,
        productName: resolveTranslated(row.productName, locale),
        variantLabel: `${resolveTranslated(row.sizeLabel, locale)} · ${resolveTranslated(row.colorLabel, locale)}`,
        sku: row.sku,
        unitPrice,
        quantity: line.quantity,
        lineTotal: unitPrice * line.quantity,
      };
    });

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const { fee, isEstimate } = this.shipping.calculateFee(method, subtotal);

    const order = await this.persist({ dto, locale, method, items, subtotal, fee, isEstimate });

    return {
      code: order.code,
      items: items.map(toLineResponse),
      subtotal,
      shippingFee: fee,
      total: subtotal + fee,
      shippingFeeIsEstimate: isEstimate,
      shippingMethodName: resolveTranslated(method.name, locale),
      shippingFeeMax: method.feeMax,
    };
  }

  /** Giỏ nằm ở trình duyệt nên giá và tồn trong đó có thể đã cũ. */
  async validateCart(dto: ValidateCartDto, locale: LocaleEnum): Promise<CartValidationResponse> {
    const rows = await this.variants.findForCart(dto.items.map((item) => item.variantId));
    const byId = new Map(rows.map((row) => [row.id, row]));

    let changed = false;

    const items = dto.items.map((line) => {
      const row = byId.get(line.variantId);
      const available = Boolean(row && row.isActive && row.productIsActive && row.stock > 0);
      const quantity = available ? Math.min(line.quantity, row!.stock) : 0;

      if (!available || quantity !== line.quantity) changed = true;

      return {
        variantId: line.variantId,
        available,
        unitPrice: row?.price ?? 0,
        stock: row?.stock ?? 0,
        quantity,
        productName: row ? resolveTranslated(row.productName, locale) : '',
        variantLabel: row
          ? `${resolveTranslated(row.sizeLabel, locale)} · ${resolveTranslated(row.colorLabel, locale)}`
          : '',
        productSlug: row?.productSlug ?? null,
      };
    });

    return {
      items,
      subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
      changed,
    };
  }

  private async loadCart(variantIds: string[]): Promise<Map<string, CartRow>> {
    const rows = await this.variants.findForCart(variantIds);
    const byId = new Map(rows.map((row) => [row.id, row]));

    for (const id of variantIds) {
      const row = byId.get(id);

      if (!row || !row.isActive || !row.productIsActive) {
        throw new BadRequestException('order.variant_unavailable');
      }
    }

    return byId;
  }

  private async persist(params: PersistOrderParamsInterface): Promise<{ code: string }> {
    const { dto, locale, method, items, subtotal, fee, isEstimate } = params;

    const emailTypes = [EmailLogTypeEnum.ADMIN_NEW_ORDER];

    // Chỉ hẹn gửi email xác nhận khi khách có để lại email.
    if (dto.email) emailTypes.unshift(EmailLogTypeEnum.ORDER_CONFIRMATION);

    for (let attempt = 1; attempt <= ORDER_CODE_MAX_ATTEMPTS; attempt++) {
      const id = randomUUID();
      const code = generateOrderCode();

      try {
        await this.orders.createWithStockDeduction({
          order: {
            id,
            code,
            customerName: dto.customerName.trim(),
            phone: dto.phone.trim(),
            email: dto.email?.trim(),
            province: method.isPickup ? null : dto.province,
            ward: method.isPickup ? null : dto.ward,
            street: method.isPickup ? null : dto.street,
            note: dto.note,
            locale: dto.locale ?? locale,
            shippingMethodId: method.id,
            subtotal,
            discount: 0,
            shippingFee: fee,
            shippingFeeIsEstimate: isEstimate,
            total: subtotal + fee,
            status: OrderStatusEnum.PENDING_CONFIRMATION,
          },
          items: items.map((item) => ({ ...item, orderId: id })),
          emailTypes,
        });

        return { code };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Hết hàng: ràng buộc CHECK chặn, cả batch rollback nên không có đơn dở.
        if (message.includes(CHECK_CONSTRAINT)) {
          throw new ConflictException('order.out_of_stock');
        }

        // Trùng mã: sinh lại rồi thử tiếp.
        if (message.includes(UNIQUE_CONSTRAINT) && attempt < ORDER_CODE_MAX_ATTEMPTS) {
          this.logger.warn(`Mã đơn ${code} bị trùng, sinh lại (lần ${attempt})`);
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('order.code_generation_failed');
  }

}

function toLineResponse(item: OrderItemDraftInterface): OrderLineResponse {
  return {
    productName: item.productName,
    variantLabel: item.variantLabel,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  };
}
