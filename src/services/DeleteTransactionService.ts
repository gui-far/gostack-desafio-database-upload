import Transaction from '../models/Transaction'
import TransactionRepository from '../repositories/TransactionsRepository'
import {getCustomRepository} from 'typeorm'
import AppError from '../errors/AppError'

interface Request {
  id: string
}

class DeleteTransactionService {
  public async execute({id} : Request): Promise<void> {
    
    const transactionRepository = getCustomRepository(TransactionRepository)

    const transaction = await transactionRepository.findOne({where:{id}})

    if(!transaction) {
      throw new AppError('Transaction does not exists')
    }

    await transactionRepository.remove(transaction)

  }
}

export default DeleteTransactionService;
