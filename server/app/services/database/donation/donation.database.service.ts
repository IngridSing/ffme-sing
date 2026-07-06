import { DonationModel } from '@app/models/donation.model';
import { Donation } from '@common/interfaces/donation';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import { Service } from 'typedi';

@Service()
export class DonationDatabaseService {
    async create(donation: Donation): Promise<Donation> {
        const newDonation = new DonationModel(donation);
        return newDonation.save();
    }

    async getAll(): Promise<Donation[]> {
        return DonationModel.find().sort({ registrationDate: -1 }).lean();
    }

    async getAllPaginated(page = 1, limit = 20): Promise<PaginatedResponse<Donation>> {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            DonationModel.find().sort({ registrationDate: -1 }).skip(skip).limit(limit).lean(),
            DonationModel.countDocuments(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getById(id: string): Promise<Donation | null> {
        return DonationModel.findOne({ idDonation: id }).lean();
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await DonationModel.updateOne({ idDonation: id }, { isPaid: status });
    }

    async deleteById(id: string): Promise<void> {
        await DonationModel.deleteOne({ idDonation: id });
    }
}
