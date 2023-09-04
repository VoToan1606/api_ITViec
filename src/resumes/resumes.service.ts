import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateResumeDto } from "./dto/create-resume.dto";
import { UpdateResumeDto } from "./dto/update-resume.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Resume, ResumeDocument } from "./shemas/resume.shema";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import { IUser } from "src/auth/interfaces/user.interface";
import aqp from "api-query-params";
import mongoose from "mongoose";
@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>
  ) {}
  async create(createResumeDto: CreateResumeDto, user: IUser) {
    const { _id, email } = user;
    const resume = await this.resumeModel.create({
      ...createResumeDto,
      email,
      userId: _id,
      status: "PENDING",
      createdBy: { _id, email },
      history: [
        {
          status: "PENDING",
          updatedAt: new Date(),
          updatedBy: {
            _id,
            email,
          },
        },
      ],
    });
    return {
      _id: resume._id,
      createdAt: resume.createdAt,
    };
  }

  async findAll(currentPage: string, pageSize: string, queryParams: string) {
    const { filter, sort, projection, population } = aqp(queryParams);
    delete filter.current;
    delete filter.pageSize;
    const skip = (+currentPage - 1) * +pageSize;
    const defaultLimit = pageSize ? +pageSize : 10;
    const total = (await this.resumeModel.find(filter)).length;
    const pages = Math.ceil(total / defaultLimit);
    const result = await this.resumeModel
      .find(filter)
      .skip(skip)
      .limit(defaultLimit)
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
      result,
    };
  }

  async findOne(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException("resume not found");
    }
    return await this.resumeModel.findOne({ _id: id });
  }

  async update(id: string, status: string, user: IUser) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException("resume not found");
    }
    return this.resumeModel.updateOne(
      { _id: id },
      {
        status,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
        $push: {
          history: {
            status,
            updatedAt: new Date(),
            updatedBy: {
              _id: user._id,
              email: user.email,
            },
          },
        },
      }
    );
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException("resume not found");
    }
    await this.resumeModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      }
    );
    return await this.resumeModel.softDelete({ _id: id });
  }

  async handleFindAllResumeByUser(user: IUser) {
    return this.resumeModel
      .find({ userId: user._id })
      .sort("-createdAt")
      .populate([
        { path: "companyId", select: { name: 1 } },
        { path: "jobId", select: { name: 1 } },
      ]);
  }
}
