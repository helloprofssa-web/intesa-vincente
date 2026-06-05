import algoritmicaWords from './algoritmica'
import databaseWords from './database'
import intelligenzaArtificialeWords from './intelligenza-artificiale'
import retiSicurezzaWords from './reti-sicurezza'

const retiIntelligenzaArtificialeWords = [
  ...new Set([...retiSicurezzaWords, ...intelligenzaArtificialeWords]),
]

const wordsByTopic = {
  algoritmica: algoritmicaWords,
  database: databaseWords,
  'intelligenza artificiale': intelligenzaArtificialeWords,
  'reti e sicurezza': retiSicurezzaWords,
  'reti + intelligenza artificiale': retiIntelligenzaArtificialeWords,
}

export default wordsByTopic
