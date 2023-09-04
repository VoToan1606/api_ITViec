import { Injectable } from "@nestjs/common";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Job, JobDocument } from "./shemas/job.shema";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import { IUser } from "src/auth/interfaces/user.interface";
import aqp from "api-query-params";
import { fileURLToPath } from "url";

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>
  ) {}
  async create(createJobDto: CreateJobDto, user: IUser) {
    const job = await this.jobModel.create({
      ...createJobDto,
      createdBy: { _id: user._id, email: user.email },
    });
    return {
      _id: job._id,
      createdAt: job.createdAt,
    };
  }

  async findAll(currentPage: string, pageSize: string, queryString: string) {
    const { filter, sort, projection, population } = aqp(queryString);
    delete filter.current;
    delete filter.pageSize;
    console.log("check filter", filter);
    const defaultLimit = pageSize ? pageSize : 10;
    const skip = (+currentPage - 1) * +defaultLimit;
    const total = (await this.jobModel.find(filter)).length;
    const pages = total / +defaultLimit;
    const jobs = await this.jobModel
      .find(filter)
      .skip(skip)
      .limit(+defaultLimit)
      .sort(sort as any)
      .select(projection)
      .populate(population);

    return {
      meta: {
        current: currentPage,
        pageSize: defaultLimit,
        pages,
        total,
      },
      result: jobs,
    };
  }

  async findOne(id: string) {
    return await this.jobModel.findOne({ _id: id });
  }

  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    return await this.jobModel.updateOne(
      { _id: id },
      { ...updateJobDto, updatedBy: { _id: user._id, email: user.email } }
    );
  }

  async remove(id: string, user: IUser) {
    await this.jobModel.updateOne(
      { _id: id },
      { deletedBy: { _id: user._id, email: user.email } }
    );
    return await this.jobModel.softDelete({ _id: id });
  }
}
