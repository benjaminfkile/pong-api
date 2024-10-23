import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

function randomName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    length: 2,
  });
}

export default randomName;
