import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProfileService } from 'src/profile/profile.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly profileService: ProfileService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const profileIdHeader = req.headers['profile-id'];

    const profileId = parseInt(profileIdHeader as string, 10);
    if (isNaN(profileId)) throw new UnauthorizedException('Invalid Profile ID format');

    const profile = await this.profileService.findOne(profileId);
    if (!profile) throw new UnauthorizedException('Profile not found');

    req['profile'] = profile;
    next();
  }
}
