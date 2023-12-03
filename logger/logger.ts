import { Logger } from "tslog";

export const logger = (name: string) => {
  return new Logger({ name: name, prettyLogTimeZone: "local"});
};
