import { BadRequestException, Injectable } from '@nestjs/common';
import { LocaleEnum } from '../../../common/enums/index.js';
import {
  resolveTranslated,
  resolveTranslatedOrNull,
} from '../../../common/helpers/resolve-translated.helper.js';
import { shippingMethods } from '../../../database/schema/index.js';
import { ShippingMethodRepository } from '../repositories/shipping-method.repository.js';
import { ShippingMethodResponse } from '../http/responses/index.js';

type MethodRow = typeof shippingMethods.$inferSelect;

@Injectable()
export class ShippingMethodService {
  constructor(private readonly repository: ShippingMethodRepository) {}

  async listActive(locale: LocaleEnum): Promise<ShippingMethodResponse[]> {
    const rows = await this.repository.findAllActive();

    return rows.map((row) => toResponse(row, locale));
  }

  /** Lấy hình thức khách chọn; chỉ nhận hình thức đang bật. */
  async requireActive(id: string): Promise<MethodRow> {
    const row = await this.repository.findById(id);

    if (!row || !row.isActive) {
      throw new BadRequestException('order.shipping_method_not_found');
    }

    return row;
  }

  /**
   * Phí ship cho một đơn.
   *
   * Vượt ngưỡng miễn phí thì về 0. Hình thức có `feeMax` nghĩa là phí thay đổi
   * theo quãng đường, nên số lúc đặt chỉ là tạm tính — đánh dấu để admin chốt
   * lại khi gọi xác nhận, và để giao diện nói rõ với khách.
   */
  calculateFee(method: MethodRow, subtotal: number): { fee: number; isEstimate: boolean } {
    if (method.freeFrom !== null && subtotal >= method.freeFrom) {
      return { fee: 0, isEstimate: false };
    }

    return { fee: method.fee, isEstimate: method.feeMax !== null };
  }
}

export function toResponse(row: MethodRow, locale: LocaleEnum): ShippingMethodResponse {
  return {
    id: row.id,
    code: row.code,
    name: resolveTranslated(row.name, locale),
    description: resolveTranslatedOrNull(row.description, locale),
    fee: row.fee,
    feeMax: row.feeMax,
    freeFrom: row.freeFrom,
    areaNote: resolveTranslatedOrNull(row.areaNote, locale),
    estimatedTime: resolveTranslatedOrNull(row.estimatedTime, locale),
    isPickup: row.isPickup,
  };
}
