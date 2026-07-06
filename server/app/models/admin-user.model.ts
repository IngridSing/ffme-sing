import * as bcrypt from 'bcrypt';
import { model, Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
    email: string;
    passwordHash: string;
    role: 'admin' | 'superadmin';
    createdAt: Date;
    lastLogin?: Date;
    comparePassword(password: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
    },
});

AdminUserSchema.index({ email: 1 });

AdminUserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

AdminUserSchema.statics.hashPassword = async function (password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
};

export const AdminUserModel = model<IAdminUser>('AdminUser', AdminUserSchema);
