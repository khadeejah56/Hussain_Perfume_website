import { plainToInstance } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString, validateSync } from "class-validator";

class EnvironmentVariables {
  @IsIn(["development", "production", "test"])
  NODE_ENV!: string;

  @IsOptional()
  @IsNumberString()
  API_PORT?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN!: string;

  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN!: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  return validatedConfig;
}
