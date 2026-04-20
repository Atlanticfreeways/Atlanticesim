import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key missing. Provide x-api-key in headers.');
    }

    // Split token to find the ID and the Secret (e.g. at_cl1234_ABCDEFGH)
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'at') {
        throw new UnauthorizedException('Invalid API Key format.');
    }
    
    // We would look up by user or simply sweep the DB if we strictly hash.
    // For production, ApiTokens should be fetched by an ID string to prevent sequential scanning.
    // Assuming the user stored the raw token to hash comparison...
    
    // In a real application, you'd find by an indexable prefix, but for demonstration:
    const activeTokens = await this.prisma.apiToken.findMany({
        where: { isActive: true },
        include: { user: true }
    });

    for (const token of activeTokens) {
        const isValid = await bcrypt.compare(apiKey, token.tokenHash);
        if (isValid) {
            // Check if user is actually a business partner
            if (token.user.role !== 'BUSINESS_PARTNER') {
                 throw new UnauthorizedException('User is not authorized for B2B transactions.');
            }
            
            // Mutate request user object to mimic JWT structure allowing existing logic to prosper
            request.user = {
                userId: token.user.id,
                email: token.user.email,
                role: token.user.role,
                isApi: true
            };
            
            // Update last used timestamp
            await this.prisma.apiToken.update({
                where: { id: token.id },
                data: { lastUsedAt: new Date() }
            });

            return true;
        }
    }

    throw new UnauthorizedException('Invalid or expired API Key.');
  }
}
