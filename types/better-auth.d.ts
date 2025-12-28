import "better-auth";

declare module "better-auth" {
  interface User {
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
  }
  
  interface Session {
    user: User & {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
      country?: string;
      investmentGoals?: string;
      riskTolerance?: string;
      preferredIndustry?: string;
    };
  }
}