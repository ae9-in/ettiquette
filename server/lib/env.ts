type RuntimeConfig = {
  MONGO_URI: string;
  JWT_SECRET: string;
  NODE_ENV: string;
};

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'] as const;

export function getMissingEnvVars() {
  return REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });
}

export function getRuntimeConfig(): RuntimeConfig {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    MONGO_URI: process.env.MONGO_URI as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    NODE_ENV: process.env.NODE_ENV as string,
  };
}

