import { CreateConfigurationInput } from './create-configuration.input';

export interface UpdateConfigurationInput
  extends Partial<CreateConfigurationInput> {
  id: number;
}
