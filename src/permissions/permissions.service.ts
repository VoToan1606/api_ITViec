import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission, PermissionDocument } from "./shemas/permission.shema";
import { InjectModel } from "@nestjs/mongoose";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import { IUser } from "src/auth/interfaces/user.interface";
import aqp from "api-query-params";

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>
  ) {}
  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const { method, apiPath } = createPermissionDto;
    const isValidApi = await this.permissionModel.findOne({ method, apiPath });
    if (isValidApi) {
      throw new BadRequestException("api is exist");
    }
    const newPermission = await this.permissionModel.create({
      ...createPermissionDto,
      createdBy: { _id: user._id, email: user.email },
    });

    return {
      _id: newPermission._id,
      createdAt: newPermission.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, queryParam: string) {
    console.log(currentPage, limit, queryParam);
    const { filter, sort, projection, population } = aqp(queryParam, {
      blacklist: ["current", "pageSize"],
    });
    const defaultLimit = limit ? limit : 10;
    const skip = (currentPage - 1) * defaultLimit;
    const total = (await this.permissionModel.find(filter)).length;
    const pages = Math.ceil(total / defaultLimit);
    const permissions = await this.permissionModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort as any)
      .select(projection)
      .populate(population);
    return {
      metadata: {
        currentPage,
        pageSize: defaultLimit,
        pages,
        total,
      },
      result: permissions,
    };
  }

  async findOne(id: string) {
    return await this.permissionModel.findById(id);
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    user: IUser
  ) {
    return await this.permissionModel.updateOne(
      { _id: id },
      {
        ...updatePermissionDto,
        updatedBy: { _id: user._id, email: user.email },
      }
    );
  }

  async remove(id: string, user: IUser) {
    await this.permissionModel.updateOne(
      { _id: id },
      {
        deletedBy: { _id: user._id, email: user.email },
      }
    );
    return this.permissionModel.softDelete({ _id: id });
  }
}
