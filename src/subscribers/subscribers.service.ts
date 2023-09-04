import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateSubscriberDto } from "./dto/create-subscriber.dto";
import { UpdateSubscriberDto } from "./dto/update-subscriber.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Subscriber, SubscriberDocument } from "./shemas/subscriber.shema";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import { IUser } from "src/auth/interfaces/user.interface";
import aqp from "api-query-params";
import mongoose from "mongoose";

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>
  ) {}
  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const { email } = createSubscriberDto;
    const isValidEmail = await this.subscriberModel.findOne({ email });
    if (isValidEmail) {
      throw new BadRequestException("email already exist");
    }
    const newSubcriber = await this.subscriberModel.create({
      ...createSubscriberDto,
      createdBy: { _id: user._id, email: user.email },
    });

    return {
      _id: newSubcriber._id,
      createdAt: newSubcriber.createdAt,
    };
  }

  async findAll(currentPage: number, pageSize: number, queryParams: string) {
    const { filter, sort, projection, population } = aqp(queryParams, {
      blacklist: ["current", "pageSize"],
    });

    const defaultLimit = pageSize ? pageSize : 10;
    const skip = (currentPage - 1) * pageSize;
    const total = (await this.subscriberModel.find(filter)).length;
    const pages = Math.ceil(total / defaultLimit);
    const resultSubcriber = await this.subscriberModel
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
      result: { ...resultSubcriber },
    };
  }

  async findOne(id: string) {
    return await this.subscriberModel.findById(id);
  }

  async update(updateSubscriberDto: UpdateSubscriberDto, user: IUser) {
    return await this.subscriberModel.updateOne(
      { email: user.email },
      {
        ...updateSubscriberDto,
        updatedBy: { _id: user._id, email: user.email },
      },
      { upsert: true }
    );
  }

  async remove(id: string, user: IUser) {
    await this.subscriberModel.updateOne(
      { _id: id },
      { deletedBy: { _id: user._id, email: user.email } }
    );
    return this.subscriberModel.softDelete({ _id: id });
  }

  async getSkills(user: IUser) {
    const { email } = user;
    return await this.subscriberModel.findOne({ email }, { skills: 1 });
  }
}
