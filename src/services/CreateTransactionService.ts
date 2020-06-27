import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository  from '../repositories/TransactionsRepository'

import { getRepository, getCustomRepository } from 'typeorm'

interface Request {
  title: string,
  value: number,
  type: 'income' | 'outcome',
  category: string
}

class CreateTransactionService {

  public async execute({ title, value, type, category }: Request): Promise<Transaction> {

    const categoryRepository = getRepository(Category)
    const transactionRepository = getCustomRepository(TransactionsRepository)

    const { total } = await transactionRepository.getBalance()

    if(type === 'outcome' && total < value) {
      throw new AppError('Insuficient balance')
    }

    //Check if category exits
    let transactionCategory = await categoryRepository.findOne({where: {title: category}})
    if (!transactionCategory) {
      transactionCategory = await categoryRepository.create({title: category})
      await categoryRepository.save(transactionCategory)
    }

    //create the transaction with category (or the found one)
    const transactionCreated = transactionRepository.create({
      title,
      value,
      type,
      category: transactionCategory
    })

    await transactionRepository.save(transactionCreated)

    return transactionCreated;

  }
}

export default CreateTransactionService;
