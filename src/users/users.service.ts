import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { CreateUserDto, RegisterUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User as UserM, UserDocument } from "./shemas/user.shema";
import mongoose, { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import { IUser } from "src/auth/interfaces/user.interface";
import passport from "passport";
import aqp from "api-query-params";
import { Role, RoleDocument } from "src/roles/shemas/role.shema";
import { USER_ROLE } from "src/databases/sample";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserM.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>
  ) {}

  gethashPassword(password: string) {
    const salt = genSaltSync(10);
    const hashPassword = hashSync(password, salt);
    return hashPassword;
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    const isExist = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (isExist) {
      throw new BadGatewayException(
        `The email ${createUserDto.email} is exist. Enter another email, please `
      );
    }
    const hashPassword = this.gethashPassword(createUserDto.password);
    const userResult = await this.userModel.create({
      ...createUserDto,
      password: hashPassword,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return {
      _id: userResult.id,
      createdAt: Date.now(),
    };
  }

  async findAll(currentPage: string, limit: number, queryString: string) {
    const { filter, sort, projection, population } = aqp(queryString);
    delete filter.current;
    delete filter.pageSize;
    const defaultLimit = limit ? limit : 10;
    const skip = (+currentPage - 1) * defaultLimit;
    const total = (await this.userModel.find(filter)).length;
    const pageList = Math.ceil(total / defaultLimit);
    const resultFindUsesr = await this.userModel
      .find(filter)
      .skip(skip)
      .limit(defaultLimit)
      .sort(sort as any)
      .select(projection)
      .populate(population);
    return {
      meta: {
        currentPage,
        pageSize: defaultLimit,
        pageList,
        total,
      },
      result: resultFindUsesr,
    };
  }

  async register(user: RegisterUserDto) {
    const isExist = await this.userModel.findOne({ email: user.email });
    if (isExist) {
      throw new BadGatewayException(
        `The email ${user.email} is exist. Enter another email, please `
      );
    }

    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    const hashPassword = this.gethashPassword(user.password);
    return await this.userModel.create({
      ...user,
      password: hashPassword,
      role: userRole?._id,
    });
  }

  async findOne(id: string) {
    const userByid = (
      await this.userModel.findById(id).select("-password")
    ).populate({ path: "role", select: { name: 1 } });
    if (!userByid) {
      throw new BadRequestException("not found user");
    }
    // const { password, ...newObject } = userByid;
    return userByid;
  }

  async findUserByUserName(userName: string) {
    return await this.userModel
      .findOne({ email: userName })
      .populate({ path: "role", select: { name: 1 } });
  }

  isValidUser(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return "user not found";
    }
    return await this.userModel.updateOne(
      { _id: id },
      { ...updateUserDto, updatedBy: { _id: user._id, email: user.email } }
    );
  }

  async remove(id: string, user: IUser) {
    const foundUser = await this.userModel.findById(id);
    if (foundUser.email === "admin@gmail.com") {
      throw new BadRequestException(
        "khong the xoa tai khoan admin: admin@gmail.com"
      );
    }
    await this.userModel.updateOne(
      { _id: id },
      { deletedBy: { _id: user._id, email: user.email } }
    );
    return await this.userModel.softDelete({ _id: id });
  }

  async updateUserToken(refeshToken: string, _id: string) {
    return await this.userModel.updateOne({ _id }, { refeshToken });
  }

  async findUserByRefreshToken(refeshToken: string) {
    return await this.userModel
      .findOne({ refeshToken })
      .populate({ path: "role", select: { name: 1 } });
  }
}
