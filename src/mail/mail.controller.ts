import { Controller, Get } from "@nestjs/common";
import { MailService } from "./mail.service";
import { MailerService } from "@nestjs-modules/mailer";
import { Public, ResponseMessage } from "src/decorators/customize";
import { InjectModel } from "@nestjs/mongoose";
import { SoftDeleteModel } from "soft-delete-plugin-mongoose";
import {
  Subscriber,
  SubscriberDocument,
} from "src/subscribers/shemas/subscriber.shema";
import { Job, JobDocument } from "src/jobs/shemas/job.shema";

@Controller("mail")
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private mailerService: MailerService,
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>
  ) {}

  @Get()
  @Public()
  @ResponseMessage("Test email")
  async handleTestEmail() {
    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      const subsSkills = subs.skills;
      const jobWithMatchingSkills = await this.jobModel.find({
        skills: { $in: subsSkills },
      });
      if (jobWithMatchingSkills?.length) {
        const jobs = jobWithMatchingSkills.map((item) => {
          return {
            name: item.name,
            company: item.company.name,
            salary:
              `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " đ",
            skills: item.skills,
          };
        });

        await this.mailerService.sendMail({
          to: "votoan1662002@gmail.com",
          from: '"Support Team" <support@example.com>', // override default from
          subject: "Welcome to Nice App! Confirm your Email",
          template: "./confirmation",
          context: {
            // ✏️ filling curly brackets with content
            name: subs.name,
            jobs: jobs,
          },
        });
      }
    }
  }
}
