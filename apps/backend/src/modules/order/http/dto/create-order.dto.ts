import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LocaleEnum } from '../../../../common/enums/index.js';
import { MAX_LINES_PER_ORDER } from '../../constants/index.js';
import { OrderLineDto } from './order-line.dto.js';

/** Di động Việt Nam: 0 hoặc +84, rồi đầu số 3/5/7/8/9 và 8 chữ số. */
const VN_PHONE = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

export class CreateOrderDto {
  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'order.empty_cart' })
  @ArrayMaxSize(MAX_LINES_PER_ORDER, { message: 'order.too_many_lines' })
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @ApiProperty({ description: 'id hình thức nhận hàng' })
  @IsString()
  shippingMethodId!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2, { message: 'order.invalid_name' })
  @MaxLength(100)
  customerName!: string;

  @ApiProperty({ example: '0905123456' })
  @Matches(VN_PHONE, { message: 'order.invalid_phone' })
  phone!: string;

  @ApiPropertyOptional({ description: 'Không bắt buộc; có thì gửi email xác nhận' })
  @IsOptional()
  @IsEmail({}, { message: 'order.invalid_email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Tỉnh/thành. Bỏ trống khi chọn ghé nhận' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ description: 'Xã/phường — hai cấp theo cải cách 2025' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @ApiPropertyOptional({ description: 'Số nhà, tên đường' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ enum: LocaleEnum, default: LocaleEnum.VI })
  @IsOptional()
  @IsEnum(LocaleEnum)
  locale?: LocaleEnum;

  /**
   * Bẫy bot: ô ẩn trên form, người thật không bao giờ điền. Có giá trị là
   * loại đơn — rẻ hơn captcha và không làm phiền khách.
   */
  @ApiPropertyOptional({ description: 'Để trống. Trường bẫy bot.' })
  @IsOptional()
  @IsString()
  @MaxLength(0, { message: 'order.rejected' })
  website?: string;
}
