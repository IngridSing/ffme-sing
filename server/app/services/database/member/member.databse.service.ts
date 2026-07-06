import { MemberModel } from '@app/models/member.model';
import { Member } from '@common/interfaces/member';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import { Service } from 'typedi';
import { MongoStorageService } from './mongo-storage.service';

@Service()
export class MemberDatabaseService {
    constructor(
        private readonly mongoStorageService: MongoStorageService,
    ) {}

    async create(member: Member): Promise<Member> {
        const newMember = new MemberModel(member);
        return newMember.save();
    }

    async getAll(): Promise<Member[]> {
        return MemberModel.find().sort({ registrationDate: -1 }).lean();
    }

    async getAllPaginated(page = 1, limit = 20): Promise<PaginatedResponse<Member>> {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            MemberModel.find().sort({ registrationDate: -1 }).skip(skip).limit(limit).lean(),
            MemberModel.countDocuments(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string): Promise<any | null> {
        const member = await MemberModel.findOne({ idMember: id }).exec();
        if (!member) throw new Error('Membre non trouvé');

        //const documents = await this.ftpService.getDocumentsForMembership(id);
        const documents = await this.mongoStorageService.getDocumentsForMembership(id);
        return { member: member.toObject(), document: documents };
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await MemberModel.updateOne({ idMember: id }, { paymentStatus: status });
    }

    async updateValidation(id: string, isValidated: boolean): Promise<void> {
        await MemberModel.updateOne({ idMember: id }, { isValidated });
    }

    async deleteById(id: string): Promise<void> {
        await MemberModel.deleteOne({ idMember: id });
    }
}
