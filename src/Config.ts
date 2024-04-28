import fs from 'fs';
import YAML from 'yaml';

export type Category = string;

// Description mappings take precedence over category mappings.
type DescriptionMapping = {
  // from is a regular expression that will be used to match against the
  // original description.
  from: string;
  to: Category;
};

type CategoryMapping = {
  // from is a regular expression that will be used to match against the
  // original category.
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

  // Set default values for fields if they are undefined. Makes processing logic
  // a simpler later on and helps avoid crashes.
  configData.categories = configData.categories || [];
  configData.categoryMappings = configData.categoryMappings || [];
  configData.descriptionMappings = configData.descriptionMappings || [];

  return configData;
}
