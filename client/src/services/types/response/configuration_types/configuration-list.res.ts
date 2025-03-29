import { PaginationRes } from '../pagination_types/pagination-res';
import { ConfigurationRes } from './configuration.res';

export interface ConfigurationListRes extends PaginationRes {
  configurations: ConfigurationRes[];
}
