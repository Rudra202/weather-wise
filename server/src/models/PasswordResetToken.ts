import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const passwordResetTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ email: 1, createdAt: -1 });

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PasswordResetToken = mongoose.model(
  'PasswordResetToken',
  passwordResetTokenSchema,
);
