import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserRole } from '../schemas/user-role.enum';
import { IUserRepository } from '../interfaces/user-repository';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByKeycloakId(keycloakId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ keycloakId }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ userId }).exec();
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  async searchByRoleAndQuery(
    query: string,
    role: UserRole,
  ): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  }

  async delete(user: UserDocument): Promise<void> {
    await user.deleteOne();
  }

  async updateMany(filter: any, update: any): Promise<any> {
    return this.userModel.updateMany(filter, update).exec();
  }
}
