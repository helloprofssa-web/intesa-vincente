import algoritmicaWords from './algoritmica'
import databaseWords from './database'
import intelligenzaArtificialeWords from './intelligenza-artificiale'
import retiSicurezzaWords from './reti-sicurezza'
import culturaGeneraleWords from './culturaGenerale'
const retiIntelligenzaArtificialeWords = [
  ...new Set([...retiSicurezzaWords, ...intelligenzaArtificialeWords]),
]

const wordsByTopic = {
  algoritmica: algoritmicaWords,
  database: databaseWords,
  'intelligenza artificiale': intelligenzaArtificialeWords,
  'reti e sicurezza': retiSicurezzaWords,
  'cultura generale': culturaGeneraleWords,
  'reti + intelligenza artificiale': retiIntelligenzaArtificialeWords,
}

export default wordsByTopic
