import mongoose, { Schema, Document } from 'mongoose';

export interface IMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
}

export interface IGroup extends Document {
  name: string;
  shareCode: string;
  baseCurrency: string;
  members: IMember[];
  categories: ICategory[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>({
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  icon: { type: String },
});

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    shareCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    baseCurrency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    members: [MemberSchema],
    categories: [CategorySchema],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
GroupSchema.index({ createdAt: -1 });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
