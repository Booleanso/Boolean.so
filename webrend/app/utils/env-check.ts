// Environment variables checker utility
export interface EnvironmentCheck {
  name: string;
  required: boolean;
  present: boolean;
  value?: string;
}

export interface ServiceConfig {
  name: string;
  required: boolean;
  configured: boolean;
  variables: EnvironmentCheck[];
}

// Check individual environment variable
function checkEnvVar(name: string, required: boolean = true): EnvironmentCheck {
  const value = process.env[name];
  return {
    name,
    required,
    present: !!value,
    value: value ? '***' : undefined // Hide actual values for security
  };
}

// Check Firebase Admin configuration
export function checkFirebaseAdmin(): ServiceConfig {
  const variables = [
    checkEnvVar('FIREBASE_PROJECT_ID', true),
    checkEnvVar('FIREBASE_CLIENT_EMAIL', true),
    checkEnvVar('FIREBASE_PRIVATE_KEY', true),
    checkEnvVar('FIREBASE_STORAGE_BUCKET', false),
  ];

  const requiredVars = variables.filter(v => v.required);
  const configured = requiredVars.every(v => v.present);

  return {
    name: 'Firebase Admin',
    required: true,
    configured,
    variables
  };
}

// Check Firebase Client configuration
export function checkFirebaseClient(): ServiceConfig {
  const variables = [
    checkEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', true),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', true),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', true),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', false),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', false),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', false),
    checkEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', false),
  ];

  const requiredVars = variables.filter(v => v.required);
  const configured = requiredVars.every(v => v.present);

  return {
    name: 'Firebase Client',
    required: true,
    configured,
    variables
  };
}

// Check Stripe configuration
export function checkStripe(): ServiceConfig {
  const variables = [
    checkEnvVar('STRIPE_SECRET_KEY', true),
    checkEnvVar('STRIPE_PUBLISHABLE_KEY', true),
    checkEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', true),
    checkEnvVar('STRIPE_WEBHOOK_SECRET', false),
    checkEnvVar('PLATFORM_FEE_PERCENT', false),
  ];

  const requiredVars = variables.filter(v => v.required);
  const configured = requiredVars.every(v => v.present);

  return {
    name: 'Stripe',
    required: false,
    configured,
    variables
  };
}

// Check GitHub configuration
export function checkGitHub(): ServiceConfig {
  const variables = [
    checkEnvVar('GITHUB_CLIENT_ID', true),
    checkEnvVar('GITHUB_CLIENT_SECRET', true),
  ];

  const requiredVars = variables.filter(v => v.required);
  const configured = requiredVars.every(v => v.present);

  return {
    name: 'GitHub',
    required: false,
    configured,
    variables
  };
}

// Check general app configuration
export function checkApp(): ServiceConfig {
  const variables = [
    checkEnvVar('NEXT_PUBLIC_URL', false),
    checkEnvVar('NEXT_PUBLIC_BASE_URL', false),
    checkEnvVar('NODE_ENV', false),
  ];

  const requiredVars = variables.filter(v => v.required);
  const configured = requiredVars.length === 0 || requiredVars.every(v => v.present);

  return {
    name: 'App',
    required: false,
    configured,
    variables
  };
}

// Check all services
export function checkAllServices(): ServiceConfig[] {
  return [
    checkFirebaseAdmin(),
    checkFirebaseClient(),
    checkStripe(),
    checkGitHub(),
    checkApp(),
  ];
}

// Get summary of environment status
export function getEnvironmentSummary() {
  const services = checkAllServices();
  const requiredServices = services.filter(s => s.required);
  const configuredRequired = requiredServices.filter(s => s.configured);
  
  return {
    allRequired: configuredRequired.length === requiredServices.length,
    criticalIssues: requiredServices.filter(s => !s.configured),
    optionalIssues: services.filter(s => !s.required && !s.configured),
    services
  };
}

// Development helper to log environment status
export function logEnvironmentStatus() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const summary = getEnvironmentSummary();
  
  console.log('🔧 Environment Configuration Status:');
  console.log('=====================================');
  
  summary.services.forEach(service => {
    const status = service.configured ? '✅' : '❌';
    const label = service.required ? '(Required)' : '(Optional)';
    console.log(`${status} ${service.name} ${label}`);
    
    if (!service.configured) {
      const missingVars = service.variables.filter(v => !v.present && v.required);
      if (missingVars.length > 0) {
        console.log(`   Missing: ${missingVars.map(v => v.name).join(', ')}`);
      }
    }
  });
  
  if (summary.criticalIssues.length > 0) {
    console.warn('⚠️  Critical services not configured:', summary.criticalIssues.map(s => s.name).join(', '));
  }
  
  if (summary.allRequired) {
    console.log('✅ All required services configured!');
  }
  
  console.log('=====================================');
} 