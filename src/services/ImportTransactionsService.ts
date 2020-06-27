import fs from 'fs'
import csvParse from 'csv-parse'

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import {getCustomRepository, getRepository, In} from 'typeorm'
import TransactionRepository from '../repositories/TransactionsRepository'
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  file: Express.Multer.File
}

interface CSVTransaction {

  title: string,
  type: 'income' | 'outcome',
  value: number,
  category: string

}

class ImportTransactionsService {
  async execute({file} : Request): Promise<Transaction[]> {
    
    const transactionRepository = getCustomRepository(TransactionRepository)
    const categoryRepository = getRepository(Category)

    const contactsReadStream = fs.createReadStream(file.path)

    const parsers = csvParse({
      from_line: 2
    })

    const transactions: CSVTransaction[] = []
    const categories: string[] = []

    const parseCSV = contactsReadStream.pipe(parsers)

    parseCSV.on('data', async line => {
      const [ title, type, value, category] = line.map((cell: string) => cell.trim())

      if(!title || !type || !value) {
        return
      }

      categories.push(category)
      transactions.push({title, type, value, category}) 

    })

    await new Promise(resolve => parseCSV.on('end', resolve))

    //Acha todas as categories do arquivo que ja estao no banco de dados
    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories)
      }
    })

    //Pra essas categorias, usar some o title
    const extentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title)

    //Acha nas categorias do arquivo, categorias que nao estao no banco
    const addCategoryTitles = categories.filter(category => !extentCategoriesTitles.includes(category))
      .filter((value, index, self)=> self.indexOf(value) == index)

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title
      }))
    )

      await categoryRepository.save(newCategories)

      const finalCategories = [...newCategories, ...existentCategories]

      const createdTransactions = transactionRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type:transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category => category.title == transaction.category
          )
        })) 
      )

      await transactionRepository.save(createdTransactions)

      console.log('servico')
      console.log(createdTransactions)

      return createdTransactions

  }
}

export default ImportTransactionsService;
