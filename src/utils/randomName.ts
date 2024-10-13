import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'

const randomName = uniqueNamesGenerator({
  dictionaries: [adjectives, colors, animals],
  length: 2,
})

export default randomName
