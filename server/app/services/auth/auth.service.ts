import { JWT_SECRET } from '@app/env';
import { AdminUserModel, IAdminUser } from '@app/models/admin-user.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';

export interface AuthResult {
    success: boolean;
    token?: string;
    message?: string;
}

@Service()
export class AuthService {
    private readonly SALT_ROUNDS = 12;
    private readonly TOKEN_EXPIRY = '8h';

    async validateAdmin(email: string, password: string): Promise<AuthResult> {
        try {
            const admin = await AdminUserModel.findOne({ email: email.toLowerCase() });

            if (!admin) {
                return { success: false, message: 'Identifiants invalides' };
            }

            const isValid = await admin.comparePassword(password);

            if (!isValid) {
                return { success: false, message: 'Identifiants invalides' };
            }

            await AdminUserModel.updateOne({ _id: admin._id }, { lastLogin: new Date() });

            const token = jwt.sign(
                { email: admin.email, role: admin.role },
                JWT_SECRET,
                { expiresIn: this.TOKEN_EXPIRY },
            );

            return { success: true, token };
        } catch (error) {
            console.error('Erreur validation admin:', error);
            return { success: false, message: 'Erreur serveur' };
        }
    }

    async createAdmin(email: string, password: string, role: 'admin' | 'superadmin' = 'admin'): Promise<IAdminUser | null> {
        try {
            const passwordHash = await this.hashPassword(password);
            const admin = new AdminUserModel({
                email: email.toLowerCase(),
                passwordHash,
                role,
            });
            return await admin.save();
        } catch (error) {
            console.error('Erreur création admin:', error);
            return null;
        }
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async changePassword(email: string, newPassword: string): Promise<boolean> {
        try {
            const passwordHash = await this.hashPassword(newPassword);
            const result = await AdminUserModel.updateOne(
                { email: email.toLowerCase() },
                { passwordHash },
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            return false;
        }
    }

    async adminExists(email: string): Promise<boolean> {
        const count = await AdminUserModel.countDocuments({ email: email.toLowerCase() });
        return count > 0;
    }

    async ensureDefaultAdmins(): Promise<void> {
        const defaultAdmins = [
            { email: 'admin@meyefoundation.org', password: 'admin123', role: 'superadmin' as const },
            { email: 'morel.mintsa@sing.ga', password: '1234567890', role: 'admin' as const },
        ];

        for (const adminData of defaultAdmins) {
            const exists = await this.adminExists(adminData.email);
            if (!exists) {
                await this.createAdmin(adminData.email, adminData.password, adminData.role);
                console.log(`Admin créé: ${adminData.email}`);
            }
        }
    }
}
