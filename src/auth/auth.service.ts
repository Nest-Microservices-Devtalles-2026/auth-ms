import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private jwtService: JwtService
    ) {}
   
    async signJWT(payload: JwtPayload) {
        return this.jwtService.sign(payload)
    }

    async registerUser(registerUserDto: RegisterUserDto) {
        try {
            const { email, name, password } = registerUserDto;

            const user = await this.prisma.user.findUnique({
                where: { email }
            });
            
            if (user) {
                throw new RpcException({
                    status: 400,
                    message: 'user already exists'
                })
            }

            const newUser = await this.prisma.user.create({
                data: {
                    email,
                    password: bcrypt.hashSync(password, 10),  
                    name
                }
            });

            const { password: _, ...rest } = newUser

            return {
                user: rest,
                token: await this.signJWT(rest)
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error?.message
            })
        }   
    }

    async LoginUser(loginUserDto: LoginUserDto) {
        try {
            const { email, password } = loginUserDto;

            const user = await this.prisma.user.findUnique({
                where: { email }
            });
            
            if (!user) {
                throw new RpcException({
                    status: 400,
                    message: 'User/Password not valid'
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password);

            if (!isPasswordValid) {
                throw new RpcException({
                    status: 400,
                    message: 'User/Password not valid'
                })
            }

            const { password: _, ...rest } = user;

            return {
                user: rest,
                token: await this.signJWT(rest)
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error?.message
            })
        }   
    }

    async verifyToken(token: string) {
        try {
            const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
                secret: envs.jwtSecret
            })

            return {
                user,
                token: await this.signJWT(user)
            }
        } catch (error) {
            console.log('error', error);
            throw new RpcException({
                status: 401,
                message: 'Invalid Token'
            });
        }
    }
}
