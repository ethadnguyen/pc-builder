import { PaginationRes } from 'src/common/types/pagination_types/pagination.res';

import { ApiProperty } from '@nestjs/swagger';
import { ConfigurationRes } from './configuration.res';

export class ConfigurationListRes extends PaginationRes {
  @ApiProperty({
    type: [ConfigurationRes],
    description: 'Danh sách cấu hình',
  })
  configurations: ConfigurationRes[];
}
