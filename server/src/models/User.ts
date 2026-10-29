import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name must be at most 80 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email is too long.'],
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model('User', userSchema);

export function toPublicUser(user: UserDocument) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
  };
}
