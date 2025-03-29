import { Configuration } from 'src/app/modules/configuration/entities/configuration.entity';
import { PaginationRes } from 'src/common/types/pagination_types/pagination.res';

export class GetAllConfigurationRes extends PaginationRes {
  configurations: Configuration[];
}
