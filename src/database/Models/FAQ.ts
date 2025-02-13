import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface IFAQ {
  faqId: number;
  question: string;
  answer: string;
}

interface FAQAttributes extends Optional<IFAQ, 'faqId'> {};

export class FAQ extends Model<IFAQ, FAQAttributes> {
  public faqId!: number;
  public question!: string;
  public answer!: string;
}

export const initFAQModel = (sequelize: Sequelize) => {
  FAQ.init({
    faqId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'faqs',
    timestamps: false
  });
};