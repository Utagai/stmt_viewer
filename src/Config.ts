import fs from 'fs';
import YAML from 'yaml';

export type Category =
  | 'Convenience'
  | 'Bills'
  | 'Restaurant'
  | 'Shopping'
  | 'Donations';

type CategoryMapping = {
  from: string;
  to: Category;
};

type DescriptionMapping = {
  from: string;
  to: Category;
};

export type Config = {
  categories: Category[];
  categoryMappings: CategoryMapping[];
  descriptionMappings: DescriptionMapping[];
};

export function loadConfig(configFilePath: string): Config {
  // Read the YAML file
  const fileContents = fs.readFileSync(configFilePath, 'utf8');

  // Parse the YAML content
  const configData = YAML.parse(fileContents);

  return configData;
}
