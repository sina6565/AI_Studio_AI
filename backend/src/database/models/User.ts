/**
 * User Schema and Model
 */

import { Schema, model, Document } from 'mongoose';
import { IUser, UserRole } from '../../types';

interface UserDocument extends Omit<IUser, 'id'>, Document {}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    preferences: {
      language: {
        type: String,
        enum: ['en', 'fa'],
        default: 'en',
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      defaultProvider: String,
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    quotas: {
      monthlyGenerations: {
        type: Number,
        default: 1000,
      },
      monthlyUsed: {
        type: Number,
        default: 0,
      },
      storageGB: {
        type: Number,
        default: 100,
      },
      storageUsed: {
        type: Number,
        default: 0,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes for performance are declared on the fields above via
// `unique`/`sparse`. Re-declaring them here produced duplicate-index warnings
// (and a conflicting non-sparse apiKey index) on every startup.

const User = model<UserDocument>('User', userSchema);

export default User;
export type { UserDocument };
