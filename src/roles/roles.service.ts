import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { IUser } from "src/auth/interfaces/user.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Role, RoleDocument } from "./shemas/role.shema";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import mongoose from "mongoose";
import aqp from "api-query-params";
import { ADMIN_ROLE } from "src/databases/sample";

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { name } = createRoleDto;
    const isValidRole = await this.roleModel.findOne({ name });
    if (isValidRole) {
      throw new BadRequestException("role name already exist");
    }
    const newRole = await this.roleModel.create({
      ...createRoleDto,
      createdBy: { _id: user._id, email: user.email },
    });

    return {
      _id: newRole._id,
      createdAt: newRole.createdAt,
    };
  }

  async findAll(currentPage: number, pageSize: number, queryParams: string) {
    const { filter, sort, projection, population } = aqp(queryParams, {
      blacklist: ["current", "pageSize"],
    });

    const defaultLimit = pageSize ? pageSize : 10;
    const skip = (currentPage - 1) * pageSize;
    const total = (await this.roleModel.find(filter)).length;
    const pages = Math.ceil(total / defaultLimit);
    const resultRole = await this.roleModel
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
        pages,
        total,
      },
      result: { ...resultRole },
    };
  }

  async findOne(id: string) {
    return (await this.roleModel.findById(id)).populate({
      path: "permissions",
      select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException("Pass object Id please");
    }

    return await this.roleModel.updateOne(
      { _id: id },
      {
        ...updateRoleDto,
        updatedBy: { _id: user._id, email: user.email },
      }
    );
  }

  async remove(id: string, user: IUser) {
    const foundRole = await this.roleModel.findById(id);
    if (foundRole.name === ADMIN_ROLE) {
      throw new BadRequestException("khong the xoa role admin");
    }
    await this.roleModel.updateOne(
      { _id: id },
      { deletedBy: { _id: user._id, email: user.email } }
    );
    return this.roleModel.softDelete({ _id: id });
  }
}
